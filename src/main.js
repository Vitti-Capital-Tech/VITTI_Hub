import { createClient } from '@supabase/supabase-js';
import './style.css';

/* ================================================================
   VITTI Hub — Main Application
   ================================================================ */

const SB_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const THEME_KEY = 'vitti_hub_theme';

const supabase = createClient(SB_URL, SB_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    cookieOptions: {
      domain: '.vitticapital.ai', // Share across all subdomains
      path: '/',
      sameSite: 'Lax',
      secure: true
    }
  }
});

// ── 24-Hour Session Enforcement ──────────────────────────────────
async function checkSessionExpiry() {
  const SESSION_KEY = 'vitti_last_login';
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    const lastLogin = localStorage.getItem(SESSION_KEY);
    const now = Date.now();

    if (!lastLogin) {
      // First time logging in with this new logic
      localStorage.setItem(SESSION_KEY, now);
    } else if (now - parseInt(lastLogin) > TWENTY_FOUR_HOURS) {
      // Session expired!
      localStorage.removeItem(SESSION_KEY);
      await supabase.auth.signOut();
      showSessionExpiredOverlay();
    }
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function showSessionExpiredOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'session-expired-overlay';
  overlay.innerHTML = `
    <div class="expired-card">
      <div class="expired-icon-wrap">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <h2 class="expired-title">Session Expired</h2>
      <p class="expired-text">For your security, you are logged out every 24 hours. Please sign in again to continue.</p>
      <div class="expired-action">
        <button onclick="location.reload()" class="btn-primary expired-btn">
          Sign In
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// ── Animation Helpers ──────────────────────────────────────────
function triggerShake(inputId) {
  const card = document.querySelector('.pin-card');
  const input = document.getElementById(inputId);
  if (!card) return;

  card.style.animation = 'none';
  card.offsetHeight; // trigger reflow
  card.style.animation = 'shakeCard 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both';

  if (input) {
    input.classList.add('error');
    setTimeout(() => input.classList.remove('error'), 1000);
  }
}

async function triggerSuccess(inputId, nextStep) {
  const card = document.querySelector('.pin-card');
  const input = document.getElementById(inputId);
  const container = input.parentElement;

  if (input) input.classList.add('success');

  // Add checkmark next to input
  const check = document.createElement('div');
  check.className = 'success-check';
  check.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  container.style.position = 'relative';
  check.style.position = 'absolute';
  check.style.right = '15px';
  check.style.top = '14px';
  container.appendChild(check);

  setTimeout(() => {
    card.style.animation = 'shrinkOut 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      nextStep();
    }, 550);
  }, 600);
}

// ── Project data ─────────────────────────────────────────────────
const PROJECTS = [
  {
    id: 'asx-dashboard',
    name: 'ASX Dashboard',
    tagline: 'See today\'s ASX news, AI-summarised.',
    url: import.meta.env.VITE_ASX_URL || '',
    image: '/asx.jpg',
  },
  {
    id: 'ideas-dashboard',
    name: 'Ideas Dashboard',
    tagline: "See today's content ideas, AI-generated.",
    url: import.meta.env.VITE_IDEAS_URL || '',
    image: '/ideas.png',
  },
  {
    id: 'option-scope',
    name: 'Option Scope',
    tagline: "Track live trades, spreads & algo signals.",
    url: import.meta.env.VITE_TRADE_URL || '',
    image: '/trade.png',
  },
];

// ── Theme ─────────────────────────────────────────────────────────
function getTheme() { return localStorage.getItem(THEME_KEY) || 'dark'; }
function applyTheme(t) { document.documentElement.dataset.theme = t; localStorage.setItem(THEME_KEY, t); }
function toggleTheme() { applyTheme(getTheme() === 'dark' ? 'light' : 'dark'); updateThemeIcon(); }

function updateThemeIcon() {
  const btn = document.getElementById('theme-btn');
  if (!btn) return;
  const dark = getTheme() === 'dark';
  btn.innerHTML = dark ? iconMoon() : iconSun();
  btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}

// ── Supabase Auth ────────────────────────────────────────────────
async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    renderEmailForm();
  } else {
    const email = session.user.email;
    const isVitti = email.endsWith('@vitti.capital') || email.endsWith('@vitticapital.ai');
    const isTest = email === 'tusharbhardwaj2617@gmail.com';

    if (!isVitti && !isTest) {
      await supabase.auth.signOut();
      renderAccessDenied();
    } else {
      renderPortal();
    }
  }
}

function renderEmailForm() {
  document.getElementById('app').innerHTML = `
    <div id="pin-screen">
      <canvas id="mkt-canvas"></canvas>
      <div class="pin-card">
        <div class="pin-brand">
          <div class="logo-wrap">${logoImg(84)}</div>
          <div class="pin-brand-text">
            <span class="pin-brand-name">VITTI Hub</span>
            <span class="pin-brand-sub">Operations Portal</span>
          </div>
        </div>
        <p class="pin-heading">Employee Login</p>
        <p class="pin-sub">Enter your work email to receive an OTP</p>
        
        <div class="auth-form">
          <input type="email" id="email-input" class="auth-input" placeholder="name@vitti.capital" />
          <p class="auth-err" id="auth-err"></p>
          <button class="btn-primary" id="send-otp-btn">Send Access Code</button>
        </div>
      </div>
    </div>
  `;
  startCandleBg(document.getElementById('mkt-canvas'));

  document.getElementById('send-otp-btn').addEventListener('click', async (e) => {
    const email = document.getElementById('email-input').value.trim().toLowerCase();
    const errEl = document.getElementById('auth-err');

    const isVitti = email.endsWith('@vitti.capital') || email.endsWith('@vitticapital.ai');
    const isTest = email === 'tusharbhardwaj2617@gmail.com';

    if (!isVitti && !isTest) {
      errEl.textContent = 'Please use a @vitti.capital work email';
      errEl.classList.add('show');
      triggerShake('email-input');
      return;
    }

    const btn = e.target;
    btn.disabled = true;
    btn.textContent = 'Sending...';

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      errEl.textContent = error.message;
      errEl.classList.add('show');
      triggerShake('email-input');
      btn.disabled = false;
      btn.textContent = 'Send Access Code';
    } else {
      triggerSuccess('email-input', () => renderOtpForm(email));
    }
  });
}

function renderOtpForm(email) {
  document.getElementById('app').innerHTML = `
    <div id="pin-screen">
      <canvas id="mkt-canvas"></canvas>
      <div class="pin-card">
        <div class="pin-brand">
          <div class="logo-wrap">${logoImg(84)}</div>
        </div>
        <p class="pin-heading">Verify Identity</p>
        <p class="pin-sub">We sent a code to <strong>${email}</strong></p>
        
        <div class="auth-form">
          <input type="text" id="otp-input" class="auth-input" placeholder="6-digit code" maxlength="6" />
          <p class="auth-err" id="auth-err"></p>
          <button class="btn-primary" id="verify-otp-btn">Access Portal</button>
          <button class="btn-link" id="back-to-email">Change Email</button>
        </div>
      </div>
    </div>
  `;
  startCandleBg(document.getElementById('mkt-canvas'));

  document.getElementById('verify-otp-btn').addEventListener('click', async (e) => {
    const token = document.getElementById('otp-input').value.trim();
    const errEl = document.getElementById('auth-err');

    const btn = e.target;
    btn.disabled = true;
    btn.textContent = 'Verifying...';

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });

    if (error) {
      errEl.textContent = 'Invalid or expired code';
      errEl.classList.add('show');
      triggerShake('otp-input');
      btn.disabled = false;
      btn.textContent = 'Access Portal';
    } else {
      triggerSuccess('otp-input', renderPortal);
    }
  });

  document.getElementById('back-to-email').addEventListener('click', renderEmailForm);
}

function renderAccessDenied() {
  document.getElementById('app').innerHTML = `
    <div id="pin-screen">
      <canvas id="mkt-canvas"></canvas>
      <div class="pin-card">
        <p class="pin-heading" style="color: #e05353">Access Denied</p>
        <p class="pin-sub">Only VITTI Capital employees can access this portal.</p>
        <button class="btn-back" style="margin: 0 auto" onclick="location.reload()">Return to Login</button>
      </div>
    </div>
  `;
  startCandleBg(document.getElementById('mkt-canvas'));
}

// ── Ripple ────────────────────────────────────────────────────────
function ripple(btn, e) {
  const r = btn.getBoundingClientRect();
  const sz = Math.max(r.width, r.height) * 1.6;
  const el = document.createElement('span');
  el.className = 'ripple';
  el.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX - r.left - sz / 2}px;top:${e.clientY - r.top - sz / 2}px`;
  btn.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ── Clock ─────────────────────────────────────────────────────────
function startClock(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString('en-AU', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };
  tick();
  setInterval(tick, 1000);
}

// ── Icons ─────────────────────────────────────────────────────────
const iconMoon = () => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const iconSun = () => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const iconLock = () => `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const iconArrow = () => `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>`;
const iconDel = () => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="13" y2="14"/><line x1="13" y1="9" x2="18" y2="14"/></svg>`;
const iconMonitor = () => `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;

// ── Logo ──────────────────────────────────────────────────────────
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="13" fill="#0d0d18"/><path d="M10 18L32 46L54 18" stroke="#3b82f6" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 18L32 36L43 18" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function logoImg(size) {
  return `<img src="/logo.jpeg" alt="VITTI Capital" width="${size}" height="${size}" onerror='this.outerHTML=\`${FALLBACK_SVG.replace(/`/g, "\\`")}\`' />`;
}

// ── Candlestick Canvas Background ────────────────────────────────
function startCandleBg(canvas) {
  const ctx = canvas.getContext('2d');

  // Resize
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Generate realistic market data (trend + momentum + noise)
  function genCandles(count, startPrice) {
    const arr = [];
    let price = startPrice;
    let trend = 0;

    for (let i = 0; i < count; i++) {
      if (Math.random() < 0.04) {
        trend = (Math.random() - 0.5) * 12;
      }

      const open = price;
      const move = trend + (Math.random() - 0.5) * 18;
      const close = open + move;

      const volPrice = Math.abs(close - open) + 2;
      const high = Math.max(open, close) + (Math.random() * volPrice * 0.8);
      const low = Math.min(open, close) - (Math.random() * volPrice * 0.8);

      const volume = 0.05 + (Math.random() * 0.1) + (volPrice * 0.002);

      arr.push({ open, close, high, low, volume });
      price = close;
    }
    return arr;
  }

  // One massive chart lane
  const LANES = [
    { label: 'BTC/USDT  ·  PERPETUAL  ·  1H', candles: genCandles(800, 64200), offset: 0, speed: 0.35, yFrac: 0.05, hFrac: 0.90 },
  ];

  const CW = 12; // candle width
  const GAP = 4;  // gap between candles
  const CS = CW + GAP;

  // Scrolling ticker text
  const TICKERS = [
    'BTC  +2.14%', 'ETH  +0.87%', 'ASX 200  -0.32%', 'SPX  +1.10%',
    'GOLD  +0.55%', 'AUD/USD  -0.18%', 'NASDAQ  +1.44%', 'NVDA  +3.21%',
    'AAPL  +0.72%', 'TSLA  -1.08%', 'BNB  +1.65%', 'SOL  +4.10%',
  ];
  let tickerX = 0;
  const tickerStr = TICKERS.join('    ·    ');

  function drawLane(lane, W, H) {
    const panelY = H * lane.yFrac;
    const panelH = H * lane.hFrac;

    const visible = Math.ceil(W / CS) + 2;
    const startIdx = Math.floor(lane.offset / CS) % lane.candles.length;

    // Find min/max of visible slice
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < visible; i++) {
      const c = lane.candles[(startIdx + i) % lane.candles.length];
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    }
    const range = max - min || 1;
    const toY = v => panelY + panelH - ((v - min) / range) * panelH;

    const xOff = -(lane.offset % CS);

    // Volume bars (subtle, at bottom of lane)
    for (let i = 0; i < visible; i++) {
      const c = lane.candles[(startIdx + i) % lane.candles.length];
      const bull = c.close >= c.open;
      const x = xOff + i * CS;
      const vol = Math.min(c.volume, 0.3); // max 30% of lane height
      ctx.fillStyle = bull
        ? 'rgba(16,185,129,0.12)'
        : 'rgba(244,63,94,0.12)';
      ctx.fillRect(x, panelY + panelH * (1 - vol), CW, panelH * vol);
    }

    // Candles
    for (let i = 0; i < visible; i++) {
      const c = lane.candles[(startIdx + i) % lane.candles.length];
      const bull = c.close >= c.open;
      const x = xOff + i * CS;
      const bTop = toY(Math.max(c.open, c.close));
      const bBot = toY(Math.min(c.open, c.close));
      const bH = Math.max(1.5, bBot - bTop);

      const bodyColor = bull ? 'rgba(16,185,129,0.7)' : 'rgba(244,63,94,0.7)';
      const wickColor = bull ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.35)';

      // Wick
      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + CW / 2, toY(c.high));
      ctx.lineTo(x + CW / 2, toY(c.low));
      ctx.stroke();

      // Body
      ctx.fillStyle = bodyColor;
      ctx.fillRect(x, bTop, CW, bH);
    }

    // Close-price line
    ctx.strokeStyle = 'rgba(59,130,246,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    let first = true;
    for (let i = 0; i < visible; i++) {
      const c = lane.candles[(startIdx + i) % lane.candles.length];
      const x = xOff + i * CS + CW / 2;
      const y = toY(c.close);
      first ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      first = false;
    }
    ctx.stroke();

    // Lane label (top-left of each panel)
    ctx.fillStyle = 'rgba(59,130,246,0.28)';
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillText(lane.label, 16, panelY + 14);

    // Horizontal separator line (only if there are multiple lanes, but leaving subtle base line)
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, panelY + panelH);
    ctx.lineTo(W, panelY + panelH);
    ctx.stroke();
  }

  function draw() {
    const W = canvas.width;
    const H = canvas.height;

    // Deep background
    ctx.clearRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Draw each lane
    LANES.forEach(l => {
      drawLane(l, W, H);
      l.offset += l.speed;
    });

    // Scrolling ticker bar at top
    const barH = 28;
    ctx.fillStyle = 'rgba(59,130,246,0.06)';
    ctx.fillRect(0, 0, W, barH);
    ctx.strokeStyle = 'rgba(59,130,246,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, barH); ctx.lineTo(W, barH); ctx.stroke();

    ctx.fillStyle = 'rgba(59,130,246,0.55)';
    ctx.font = '500 11px Inter, monospace';
    ctx.fillText(tickerStr + '    ·    ' + tickerStr, tickerX, 18);

    // Measure full ticker width to loop
    const tw = ctx.measureText(tickerStr + '    ·    ').width;
    tickerX -= 0.6;
    if (tickerX < -tw) tickerX = 0;

    requestAnimationFrame(draw);
  }

  draw();
}

// ── PIN Screen ────────────────────────────────────────────────────
function renderPin() {
  document.getElementById('app').innerHTML = `
    <div id="pin-screen">
      <canvas id="mkt-canvas"></canvas>

      <div class="pin-card">
        <div class="pin-brand">
          <div class="logo-wrap">
            ${logoImg(84)}
          </div>
          <div class="pin-brand-text">
            <span class="pin-brand-name">VITTI Hub</span>
            <span class="pin-brand-sub">Operations Portal</span>
          </div>
        </div>

        <p class="pin-heading">Secure Access</p>
        <p class="pin-sub">Enter your 4-digit PIN to continue</p>

        <div class="pin-dots" id="dots">
          ${[0, 1, 2, 3].map(i => `<div class="dot" id="d${i}"></div>`).join('')}
        </div>
        <p class="pin-err" id="pin-err">Incorrect PIN — try again</p>

        <div class="keypad" id="keypad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n =>
    `<button class="key" id="k${n}" data-d="${n}" aria-label="${n}">${n}</button>`
  ).join('')}
          <button class="key key-zero" id="k0"   data-d="0" aria-label="0">0</button>
          <button class="key key-del"  id="kdel"             aria-label="Delete">${iconDel()}</button>
        </div>
      </div>

      <p class="pin-contact">
        For access, contact the
        <a href="mailto:goyal.s@vitti.capital">VITTI Capital team</a>
      </p>
    </div>
  `;

  startCandleBg(document.getElementById('mkt-canvas'));
  initPin();
}

function initPin() {
  let entered = '';

  const updateDots = () => {
    [0, 1, 2, 3].forEach(i => {
      const d = document.getElementById(`d${i}`);
      d.classList.toggle('on', i < entered.length);
      d.classList.remove('err');
    });
  };

  const showError = () => {
    const cardEl = document.querySelector('.pin-card');
    const errEl = document.getElementById('pin-err');
    [0, 1, 2, 3].forEach(i => document.getElementById(`d${i}`).classList.add('err'));

    cardEl.style.animation = 'shakeCard 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both';
    cardEl.addEventListener('animationend', () => { cardEl.style.animation = ''; }, { once: true });

    errEl.classList.add('show');
    setTimeout(() => { errEl.classList.remove('show'); entered = ''; updateDots(); }, 1600);
  };

  const push = (digit, btn, e) => {
    if (entered.length >= 4) return;
    if (btn && e) ripple(btn, e);
    entered += digit;
    updateDots();
    if (entered.length === 4) {
      setTimeout(() => {
        if (entered === PIN) {
          const cardEl = document.querySelector('.pin-card');
          [0, 1, 2, 3].forEach(i => document.getElementById(`d${i}`).classList.add('success'));

          setTimeout(() => {
            cardEl.style.animation = 'shrinkOut 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            setTimeout(() => {
              setAuth(true);
              renderPortal();
            }, 600);
          }, 300);
        }
        else showError();
      }, 160);
    }
  };

  document.getElementById('keypad').addEventListener('click', e => {
    const btn = e.target.closest('.key');
    if (!btn) return;
    if (btn.id === 'kdel') { entered = entered.slice(0, -1); updateDots(); }
    else push(btn.dataset.d, btn, e);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Backspace') { entered = entered.slice(0, -1); updateDots(); }
    else if (/^\d$/.test(e.key)) push(e.key, null, null);
  });
}

// ── Dashboard Viewer ──────────────────────────────────────────────
function openDashboard(projectId) {
  const project = PROJECTS.find(p => p.id === projectId);
  if (!project) return;

  const viewer = document.getElementById('viewer');
  const iframe = document.getElementById('viewer-iframe');
  const title = document.getElementById('viewer-title-text');
  const loader = document.getElementById('viewer-loader');

  title.innerHTML = `<span class="viewer-status-dot"></span> ${project.name}`;
  loader.classList.remove('hide');
  iframe.src = project.url;

  viewer.classList.add('show');
  document.body.style.overflow = 'hidden';

  iframe.onload = () => {
    loader.classList.add('hide');
  };
}

function closeDashboard() {
  const viewer = document.getElementById('viewer');
  const iframe = document.getElementById('viewer-iframe');

  viewer.classList.remove('show');
  iframe.src = 'about:blank';
  document.body.style.overflow = '';
}

// ── Portal ────────────────────────────────────────────────────────
async function renderPortal() {
  const isDark = getTheme() === 'dark';

  const cards = PROJECTS.map((p, i) => `
    <div class="card" id="card-${p.id}" style="transition-delay: ${i * 100}ms"
         onclick="openDashboard('${p.id}')"
         onmousemove="this.style.setProperty('--x', event.offsetX + 'px'); this.style.setProperty('--y', event.offsetY + 'px')"
         aria-label="Open ${p.name}">
      <div class="card-img">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <div class="card-img-fade"></div>
        <div class="card-hover-overlay">
          <div class="card-hover-content">
            <div class="card-hover-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
              </svg>
            </div>
            <span class="card-hover-label">View Live</span>
          </div>
        </div>
        <div class="card-live-dot"><span class="sdot"></span></div>
      </div>
      <div class="card-body">
        <h2 class="card-title">${p.name}</h2>
        <p class="card-tagline">${p.tagline}</p>
      </div>
    </div>
  `).join('');

  const { data: { user } } = await supabase.auth.getUser();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const capitalName = userName.charAt(0).toUpperCase() + userName.slice(1);

  document.getElementById('app').innerHTML = `
    <div id="portal" class="show">
      <header class="hdr">
        <div class="hdr-logo">
          <div class="logo-wrap mini">
            ${logoImg(32)}
          </div>
          <div class="hdr-logo-text">
            <span class="hdr-name">VITTI Hub</span>
          </div>
        </div>
        <div class="hdr-actions">
          <div class="badge-live">
            <span class="badge-dot"></span>
            <span>All Systems Live</span>
          </div>
          <div class="viewer-divider"></div>
          <button class="btn-lock" id="logout-btn" aria-label="Logout">
            ${iconLock()} <span>Logout</span>
          </button>
        </div>
      </header>

      <div class="content">
        <!-- Hero Section -->
        <section class="hero-section">
          <div class="hero-content">
            <h1 class="hero-title">Welcome back</h1>
            <p class="hero-subtitle">The markets never sleep. <span class="text-accent">Your edge is ready.</span></p>
          </div>
          
        </section>

        <div class="section-head">
          <span class="section-label">Active Dashboards</span>
          <div class="section-rule"></div>
        </div>

        <div class="grid" id="grid">
          ${cards}
        </div>
      </div>

      <footer>
        <div class="footer">
          <span class="footer-copy">&copy; ${new Date().getFullYear()} VITTI Capital. All rights reserved.</span>
        </div>
      </footer>
    </div>

    <!-- Viewer Layer -->
    <div id="viewer">
      <div class="viewer-hdr">
        <div class="viewer-nav">
          <button class="btn-back-hub" id="viewer-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Back to Hub</span>
          </button>
          <div class="viewer-divider"></div>
          <div class="viewer-title" id="viewer-title-text"></div>
        </div>
        
        <div class="viewer-brand">
          <span class="viewer-brand-text">Vitti Capital</span>
          <div class="logo-wrap mini">
            ${logoImg(24)}
          </div>
        </div>
      </div>
      <div class="viewer-frame-wrap">
        <div class="viewer-loader" id="viewer-loader">
          <div class="loader-spinner"></div>
        </div>
        <iframe id="viewer-iframe"></iframe>
      </div>
    </div>
  `;

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.reload();
  });
  document.getElementById('viewer-back').addEventListener('click', closeDashboard);

  window.openDashboard = openDashboard; // Make globally accessible for onclick

  requestAnimationFrame(() => {
    document.querySelectorAll('.card').forEach(c => c.classList.add('visible'));
  });

  startClock('live-clock-footer');
}

// ── Boot ──────────────────────────────────────────────────────────
applyTheme(getTheme());
checkSessionExpiry();
initAuth();
