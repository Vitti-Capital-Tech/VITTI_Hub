import './style.css';

/* ================================================================
   VITTI Capital — Operations Portal
   PIN-Protected Entry + Dashboard
   ================================================================ */

// ── Config (PIN comes from .env, never hardcoded) ────────────────
const CORRECT_PIN = import.meta.env.VITE_PIN_CODE || '';
const SESSION_KEY = 'vitti_portal_unlocked';

// ── Project Data ─────────────────────────────────────────────────
const PROJECTS = [
  {
    id: 'asx-dashboard',
    name: 'ASX Dashboard',
    category: 'Market Intelligence',
    categoryColor: '#60a5fa',
    description:
      'AI-powered intelligence dashboard for daily ASX company announcements and market updates. Delivers curated, real-time insights for data-driven investment decisions.',
    tech: ['Python', 'AI/NLP', 'ASX Data', 'Streamlit'],
    url: 'https://github.com/VITTICapital/ASX_Dashboard', // ← replace with live URL
    screenshot: null, // ← set to '/screenshots/asx.png' once you add the image
    tag: 'Market Intelligence',
    status: 'live',
  },
  {
    id: 'ideas-dashboard',
    name: 'Ideas Dashboard',
    category: 'Content Engine',
    categoryColor: '#c084fc',
    description:
      'Automated content engine for VITTI Capital. Transforms curated insights and financial news into high-impact investment ideas with consistent, professional output.',
    tech: ['Python', 'Automation', 'LLM', 'Finance'],
    url: 'https://github.com/VITTICapital/Ideas_Dashboard', // ← replace with live URL
    screenshot: null,
    tag: 'Content Engine',
    status: 'live',
  },
  {
    id: 'option-scope',
    name: 'Option Scope',
    category: 'Options Analytics',
    categoryColor: '#34d399',
    description:
      'Real-time dashboard for monitoring Delta Exchange options. Tracks live call/put mark prices and visualises combined premium in candlestick charts for precision options trading.',
    tech: ['JavaScript', 'WebSocket', 'Delta Exchange', 'Charts'],
    url: 'https://github.com/VITTICapital/Option_Scope', // ← replace with live URL
    screenshot: null,
    tag: 'Real-Time Analytics',
    status: 'live',
  },
];

// ── State ─────────────────────────────────────────────────────────
let enteredPin = '';

// ── Helpers ───────────────────────────────────────────────────────
function isUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

function setUnlocked(val) {
  if (val) sessionStorage.setItem(SESSION_KEY, 'true');
  else sessionStorage.removeItem(SESSION_KEY);
}

function addRipple(btn, e) {
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.5;
  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  ripple.style.cssText = `
    width: ${size}px; height: ${size}px;
    left: ${e.clientX - rect.left - size / 2}px;
    top:  ${e.clientY - rect.top  - size / 2}px;
  `;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

// ── Live clock ────────────────────────────────────────────────────
function startClock(el) {
  function tick() {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-AU', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Australia/Sydney',
    }) + ' AEST';
  }
  tick();
  setInterval(tick, 1000);
}

// ── Logo helper ───────────────────────────────────────────────────
function logoHTML(size = 56) {
  // Uses /logo.png if it exists, otherwise falls back to the inline SVG "V" mark
  return `
    <img
      src="/logo.png"
      alt="VITTI Capital Logo"
      width="${size}"
      height="${size}"
      onerror="this.outerHTML=\`${fallbackLogoSVG(size)}\`"
    />
  `;
}

function fallbackLogoSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill="#0d0d18"/>
    <path d="M10 18 L32 46 L54 18" stroke="#d4a843" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M21 18 L32 36 L43 18" stroke="#f0c060" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`;
}

function screenshotHTML(project) {
  if (project.screenshot) {
    return `
      <img src="${project.screenshot}" alt="${project.name} screenshot" loading="lazy" />
      <div class="card-screenshot-overlay"></div>
    `;
  }
  return `
    <div class="card-screenshot-placeholder">
      <span class="placeholder-icon">🖥️</span>
      <span>Screenshot coming soon</span>
    </div>
    <div class="card-screenshot-overlay"></div>
  `;
}

// ── PIN Screen ────────────────────────────────────────────────────
function renderPinScreen() {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return `
    <div id="pin-screen">
      <div class="pin-container">

        <div class="pin-logo">
          ${logoHTML(68)}
          <div class="pin-logo-wordmark">
            <span class="pin-logo-name">VITTI Capital</span>
            <span class="pin-logo-tagline">Operations Portal</span>
          </div>
        </div>

        <div class="pin-header">
          <p class="pin-title">Secure Access</p>
          <p class="pin-subtitle">Enter your 4-digit PIN to continue</p>
        </div>

        <div class="pin-dots" id="pin-dots">
          <div class="pin-dot" id="dot-0"></div>
          <div class="pin-dot" id="dot-1"></div>
          <div class="pin-dot" id="dot-2"></div>
          <div class="pin-dot" id="dot-3"></div>
        </div>

        <p class="pin-error-msg" id="pin-error">Incorrect PIN. Please try again.</p>

        <div class="pin-keypad" id="pin-keypad">
          ${keys.map(n => `
            <button class="pin-key" id="key-${n}" data-digit="${n}" aria-label="${n}">
              ${n}
            </button>
          `).join('')}

          <button class="pin-key key-zero" id="key-0" data-digit="0" aria-label="0">0</button>

          <button class="pin-key key-delete" id="key-del" aria-label="Delete">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
              <line x1="18" y1="9" x2="13" y2="14"/><line x1="13" y1="9" x2="18" y2="14"/>
            </svg>
          </button>
        </div>

        <div class="pin-divider">Protected Access</div>

      </div>
    </div>
  `;
}

function initPinScreen() {
  const keypad  = document.getElementById('pin-keypad');
  const dotsEl  = document.getElementById('pin-dots');
  const errorEl = document.getElementById('pin-error');

  function updateDots() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`dot-${i}`);
      dot.classList.toggle('filled', i < enteredPin.length);
    }
  }

  function showError() {
    dotsEl.classList.add('error', 'shake');
    errorEl.classList.add('visible');
    setTimeout(() => {
      dotsEl.classList.remove('shake', 'error');
      enteredPin = '';
      updateDots();
    }, 700);
    setTimeout(() => errorEl.classList.remove('visible'), 2400);
  }

  function handleDigit(digit, btn, event) {
    if (enteredPin.length >= 4) return;
    if (btn && event) addRipple(btn, event);
    enteredPin += digit;
    updateDots();

    if (enteredPin.length === 4) {
      setTimeout(() => {
        if (enteredPin === CORRECT_PIN) {
          setUnlocked(true);
          renderPortal();
        } else {
          showError();
        }
      }, 150);
    }
  }

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (!/^\d$/.test(e.key) && e.key !== 'Backspace') return;
    if (e.key === 'Backspace') {
      enteredPin = enteredPin.slice(0, -1);
      updateDots();
    } else {
      handleDigit(e.key, null, null);
    }
  });

  keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('.pin-key');
    if (!btn) return;
    if (btn.id === 'key-del') {
      enteredPin = enteredPin.slice(0, -1);
      updateDots();
    } else {
      handleDigit(btn.dataset.digit, btn, e);
    }
  });
}

// ── Portal Screen ─────────────────────────────────────────────────
function renderPortal() {
  const app = document.getElementById('app');

  const projectCards = PROJECTS.map(p => `
    <article class="project-card" id="card-${p.id}">
      <div class="card-screenshot">
        ${screenshotHTML(p)}
        <div class="card-tag">${p.tag}</div>
      </div>
      <div class="card-body">
        <p class="card-category" style="color: ${p.categoryColor}">${p.category}</p>
        <h2 class="card-title">${p.name}</h2>
        <p class="card-desc">${p.description}</p>
        <div class="card-tech">
          ${p.tech.map(t => `<span class="tech-pill">${t}</span>`).join('')}
        </div>
        <div class="card-footer">
          <span class="card-status">
            <span class="status-dot ${p.status}"></span>
            ${p.status === 'live' ? 'Live' : 'Offline'}
          </span>
          <a
            href="${p.url}"
            target="_blank"
            rel="noopener noreferrer"
            class="card-open-btn"
            id="open-${p.id}"
            aria-label="Open ${p.name}"
          >
            Open Dashboard
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
            </svg>
          </a>
        </div>
      </div>
    </article>
  `).join('');

  app.innerHTML = `
    <div id="portal-screen" class="active">

      <!-- Header -->
      <header class="portal-header">
        <div class="header-logo">
          ${logoHTML(36)}
          <div class="header-logo-text">
            <span class="header-logo-name">VITTI Capital</span>
            <span class="header-logo-sub">Operations Portal</span>
          </div>
        </div>
        <div class="header-right">
          <div class="header-badge">
            <span class="header-badge-dot"></span>
            All Systems Operational
          </div>
          <button class="header-lock-btn" id="lock-btn" aria-label="Lock portal">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Lock
          </button>
        </div>
      </header>

      <!-- Hero -->
      <section class="portal-hero">
        <p class="hero-greeting">Internal Dashboard</p>
        <h1 class="hero-title">
          Welcome to<br/><span>VITTI Capital</span>
        </h1>
        <p class="hero-desc">
          Centralised access to all proprietary analytics tools, market intelligence
          platforms, and automated content engines. Select a dashboard below to launch.
        </p>
      </section>

      <!-- Stats bar -->
      <div class="portal-stats">
        <div class="stat-pill">
          <span class="stat-pill-icon">🚀</span>
          <span class="stat-pill-label">Dashboards</span>
          <span class="stat-pill-value">${PROJECTS.length} Active</span>
        </div>
        <div class="stat-pill">
          <span class="stat-pill-icon">📊</span>
          <span class="stat-pill-label">Coverage</span>
          <span class="stat-pill-value">ASX · Delta · Ideas</span>
        </div>
        <div class="stat-pill">
          <span class="stat-pill-icon">🔒</span>
          <span class="stat-pill-label">Access</span>
          <span class="stat-pill-value">PIN Verified</span>
        </div>
        <div class="stat-pill">
          <span class="stat-pill-icon">🕐</span>
          <span class="stat-pill-label">Time</span>
          <span class="stat-pill-value" id="live-clock">—</span>
        </div>
      </div>

      <!-- Projects -->
      <main class="portal-projects">
        <p class="section-label">Your Dashboards</p>
        <div class="projects-grid" id="projects-grid">
          ${projectCards}
        </div>
      </main>

      <!-- Footer -->
      <footer>
        <div class="portal-footer">
          <span class="footer-copy">© ${new Date().getFullYear()} VITTI Capital. All rights reserved.</span>
          <span class="footer-time" id="footer-time"></span>
        </div>
      </footer>

    </div>
  `;

  // Lock button
  document.getElementById('lock-btn').addEventListener('click', () => {
    setUnlocked(false);
    enteredPin = '';
    location.reload();
  });

  // Start clock
  startClock(document.getElementById('live-clock'));
  startClock(document.getElementById('footer-time'));
}

// ── Boot ──────────────────────────────────────────────────────────
function boot() {
  const app = document.getElementById('app');

  if (isUnlocked()) {
    renderPortal();
  } else {
    app.innerHTML = renderPinScreen();
    initPinScreen();
  }
}

boot();
