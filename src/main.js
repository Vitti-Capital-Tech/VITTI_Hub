import { createClient } from '@supabase/supabase-js';
import './style.css';

/* ================================================================
   VITTI Hub â€” Main Application
   ================================================================ */

const SB_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const GUEST_ID = import.meta.env.VITE_GUEST_ID || '';
const THEME_KEY = 'vitti_hub_theme';

// External users allowed via OTP, each restricted to a single dashboard.
const RESTRICTED_USERS = {
  'udeshidhwani22@gmail.com': 'ratio-spread-scanner',
  'tusharbhardwaj2617@gmail.com': 'ratio-spread-scanner',
  'usert7556@gmail.com': 'ratio-spread-scanner',
};

const isMarketingTeam = (guest) => {
  if (!guest) return false;
  const g = guest.trim().toLowerCase();
  return g === 'vittimarketing team' || g === 'vittimarketingteam' || (GUEST_ID && g === GUEST_ID.toLowerCase());
};

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

// â”€â”€ 24-Hour Session Enforcement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Animation Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

function renderBypassTerminal(statusText, callback) {
  // Step 1: Fade the whole login screen out cleanly
  const pinScreen = document.getElementById('pin-screen');
  if (pinScreen) {
    pinScreen.style.transition = 'opacity 0.45s ease';
    pinScreen.style.opacity = '0';
  }

  // Step 2: Mount the branded splash after screen fades
  setTimeout(() => {
    const overlay = document.createElement('div');
    overlay.id = 'bypass-splash';
    overlay.innerHTML = `
      <div class="splash-inner">
        <div class="splash-logo">${logoImg(72)}</div>
        <div class="splash-brand">
          <span class="splash-name">VITTI Hub</span>
          <span class="splash-tagline">Operations Portal</span>
        </div>
        <div class="splash-divider"></div>
        <div class="splash-progress-track">
          <div class="splash-progress-bar" id="splash-bar"></div>
        </div>
        <p class="splash-status">${statusText}</p>
      </div>
    `;
    document.body.appendChild(overlay);

    // Fade splash in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
      });
    });

    // Trigger the progress bar sweep after a brief settle
    setTimeout(() => {
      const bar = document.getElementById('splash-bar');
      if (bar) bar.style.width = '100%';
    }, 180);

    // Fade out and redirect after progress completes
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        // Also remove the old login screen so it never flashes back
        if (pinScreen) pinScreen.remove();
        callback();
      }, 550);
    }, 2200);

  }, 450);
}

// â”€â”€ Project data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PROJECTS = [
  {
    id: 'option-scope',
    name: 'Live Trading',
    tagline: "Execute and monitor trades live, in real time.",
    url: import.meta.env.VITE_TRADE_URL || '',
    image: '/trade.png',
    badge: 'live-trading',
  },
  {
    id: 'ratio-spread-scanner',
    name: 'Ratio Spread Scanner',
    tagline: "Scan the options chain for ratio spread setups.",
    url: import.meta.env.VITE_RATIO_SCANNER_URL || '',
    image: '/ratio.png',
    badge: 'scanner',
  },
  {
    id: 'mirror-dashboard',
    name: 'Mirror Dashboard',
    tagline: 'See trades in the follower accounts executed by the master account.',
    url: import.meta.env.VITE_MIRROR_URL || '',
    image: '/mirror.png',
    badge: 'copy-trade',
  },
  {
    id: 'asx-dashboard',
    name: 'ASX Dashboard',
    tagline: 'See today\'s ASX news, AI-summarised.',
    url: import.meta.env.VITE_ASX_URL || '',
    image: '/asx.png',
    badge: 'ai-news',
  },
  {
    id: 'jodi',
    name: 'Jodi',
    tagline: 'Chart every put & call, side by side.',
    url: import.meta.env.VITE_JODI_URL || '',
    image: '/jodi.png',
    badge: 'options',
  },
  {
    id: 'client-dashboard',
    name: 'Client Dashboard',
    tagline: 'View client portfolios, performance metrics, and account details.',
    url: import.meta.env.VITE_CLIENT_URL || import.meta.env.VIT_CLIENT_URL || '',
    image: '/client.png',
    badge: 'portfolio',
  },
  {
    id: 'vitti-bot',
    name: 'VITTI Bot',
    tagline: "See today's option trades, executed by the BOT.",
    url: import.meta.env.VITE_BOT_URL || '',
    image: '/bot.png',
    badge: 'automated',
  },
  {
    id: 'ideas-dashboard',
    name: 'Ideas Dashboard',
    tagline: "See today's content ideas, AI-generated.",
    url: import.meta.env.VITE_IDEAS_URL || '',
    image: '/ideas.png',
    badge: 'ai',
  },
];

// â”€â”€ Theme â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getTheme() { return localStorage.getItem(THEME_KEY) || 'dark'; }
function applyTheme(t) { document.documentElement.dataset.theme = t; localStorage.setItem(THEME_KEY, t); }
function toggleTheme() { applyTheme(getTheme() === 'dark' ? 'light' : 'dark'); updateThemeIcon(); }

function updateThemeIcon() {
  const btns = document.querySelectorAll('.theme-btn');
  const dark = getTheme() === 'dark';
  btns.forEach(btn => {
    btn.innerHTML = dark ? iconSun() : iconMoon();
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

// â”€â”€ Supabase Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const storedGuest = localStorage.getItem('vitti_guest');
    if (isMarketingTeam(storedGuest) || (storedGuest && storedGuest.trim().toLowerCase() === 'trade')) {
      renderPortal();
      return;
    }
    renderEmailForm();
  } else {
    const email = (session.user.email || '').toLowerCase();
    const isVitti = email.endsWith('@vitti.capital') || email.endsWith('@vitticapital.ai');
    const isTest = email === 'tusharbhardwaj2617@gmail.com';
    const isRestricted = email in RESTRICTED_USERS;

    if (!isVitti && !isTest && !isRestricted) {
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
        <p class="pin-heading">Login</p>
        <p class="pin-sub">Enter your work email to receive a secure access code</p>
        
        <form class="auth-form" id="email-form">
          <input type="text" id="email-input" class="auth-input" placeholder="name@vitti.capital" autofocus />
          <p class="auth-err" id="auth-err"></p>
          <button type="submit" class="btn-primary" id="send-otp-btn">Send Access Code</button>
        </form>
      </div>
    </div>
  `;
  startCandleBg(document.getElementById('mkt-canvas'));

  const emailInput = document.getElementById('email-input');
  if (emailInput) {
    emailInput.focus();
    emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('send-otp-btn').click();
      }
    });
  }

  const form = document.getElementById('email-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email-input').value.trim().toLowerCase();
      const errEl = document.getElementById('auth-err');

      if (isMarketingTeam(email) || email === 'trade') {
        triggerSuccess('email-input', () => {
          localStorage.setItem('vitti_guest', email);
          const isMarketing = isMarketingTeam(email);
          const statusMessage = isMarketing
            ? 'Marketing access verified &nbsp;·&nbsp; Welcome back'
            : 'Trading desk authorization confirmed &nbsp;·&nbsp; Welcome back';
          renderBypassTerminal(statusMessage, () => {
            renderPortal();
          });
        });
        return;
      }

      const isVitti = email.endsWith('@vitti.capital') || email.endsWith('@vitticapital.ai');
      const isTest = email === 'tusharbhardwaj2617@gmail.com';
      const isRestricted = email in RESTRICTED_USERS;

      if (!isVitti && !isTest && !isRestricted) {
        errEl.textContent = 'Please use a @vitti.capital work email';
        errEl.classList.add('show');
        triggerShake('email-input');
        return;
      }

      const btn = document.getElementById('send-otp-btn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending...';
      }

      const { error } = await supabase.auth.signInWithOtp({ email });

      if (error) {
        errEl.textContent = error.message;
        errEl.classList.add('show');
        triggerShake('email-input');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Send Access Code';
        }
      } else {
        triggerSuccess('email-input', () => renderOtpForm(email));
      }
    });
  }
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
        <p class="pin-sub">We sent a 6-digit code to <strong>${email}</strong></p>
        
        <div class="auth-form">
          <div class="otp-boxes" id="otp-boxes">
            <div class="otp-box" id="otp-0"></div>
            <div class="otp-box" id="otp-1"></div>
            <div class="otp-box" id="otp-2"></div>
            <div class="otp-box" id="otp-3"></div>
            <div class="otp-box" id="otp-4"></div>
            <div class="otp-box" id="otp-5"></div>
            <input
              id="otp-hidden"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              style="position:absolute;opacity:0;width:100%;height:100%;top:0;left:0;cursor:text;font-size:16px;"
            />
          </div>
          <p class="auth-err" id="auth-err"></p>
          <button class="btn-primary" id="verify-otp-btn" disabled>Access Portal</button>
          <button class="btn-link" id="back-to-email">Change Email</button>
        </div>
      </div>
    </div>
  `;
  startCandleBg(document.getElementById('mkt-canvas'));

  // The hidden input captures ALL input/paste — the divs are pure display
  const hiddenInput = document.getElementById('otp-hidden');
  const boxEls = Array.from({ length: 6 }, (_, i) => document.getElementById(`otp-${i}`));
  const verifyBtn = document.getElementById('verify-otp-btn');
  const errEl = document.getElementById('auth-err');
  const otpContainer = document.getElementById('otp-boxes');

  // Make the container relatively positioned so the hidden input overlays it
  otpContainer.style.position = 'relative';

  function getToken() { return hiddenInput.value; }

  // Sync the 6 visual boxes from the hidden input value
  function syncBoxes() {
    const val = hiddenInput.value;
    boxEls.forEach((box, i) => {
      box.textContent = val[i] || '';
      box.classList.toggle('otp-box-filled', !!val[i]);
      box.classList.toggle('otp-box-active', i === val.length && val.length < 6);
    });
    // Enable button only when 6 digits present
    const filled = val.length === 6;
    verifyBtn.disabled = !filled;
  }

  async function submitOtp() {
    const token = getToken();
    if (token.length !== 6) return;

    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';
    hiddenInput.disabled = true;

    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });

    if (error) {
      errEl.textContent = 'Invalid or expired code — please try again';
      errEl.classList.add('show');
      boxEls.forEach(b => {
        b.classList.add('otp-error');
        setTimeout(() => b.classList.remove('otp-error'), 700);
      });
      hiddenInput.value = '';
      hiddenInput.disabled = false;
      verifyBtn.textContent = 'Access Portal';
      syncBoxes();
      hiddenInput.focus();
    } else {
      boxEls.forEach(b => b.classList.add('otp-success'));
      setTimeout(() => triggerSuccess('otp-hidden', renderPortal), 300);
    }
  }

  hiddenInput.addEventListener('input', () => {
    // Strip non-digits, enforce max 6
    hiddenInput.value = hiddenInput.value.replace(/\D/g, '').slice(0, 6);
    syncBoxes();
    if (hiddenInput.value.length === 6) submitOtp();
  });

  hiddenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { submitOtp(); e.preventDefault(); }
  });

  // Click anywhere on the box row focuses the hidden input
  otpContainer.addEventListener('click', () => hiddenInput.focus());

  // Initialise display and focus
  syncBoxes();
  hiddenInput.focus();

  verifyBtn.addEventListener('click', submitOtp);
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

// â”€â”€ Ripple â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ripple(btn, e) {
  const r = btn.getBoundingClientRect();
  const sz = Math.max(r.width, r.height) * 1.6;
  const el = document.createElement('span');
  el.className = 'ripple';
  el.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX - r.left - sz / 2}px;top:${e.clientY - r.top - sz / 2}px`;
  btn.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// â”€â”€ Clock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
const iconMoon = () => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const iconSun = () => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const iconLock = () => `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const iconArrow = () => `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>`;
const iconDel = () => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="13" y2="14"/><line x1="13" y1="9" x2="18" y2="14"/></svg>`;
const iconMonitor = () => `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;

// ── Logo ────────────────────────────────────────────────────────────
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="13" fill="#0d0d18"/><path d="M10 18L32 46L54 18" stroke="#3b82f6" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 18L32 36L43 18" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function logoImg(size) {
  return `<img src="/logo.jpeg" alt="VITTI Capital" width="${size}" height="${size}" onerror='this.outerHTML=\`${FALLBACK_SVG.replace(/`/g, "\\`")}\`' />`;
}

// Mouse movement parallax tracking
let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;

window.addEventListener('mousemove', (e) => {
  targetMouseX = (e.clientX / window.innerWidth) - 0.5;
  targetMouseY = (e.clientY / window.innerHeight) - 0.5;
});

window.addEventListener('mouseleave', () => {
  targetMouseX = 0;
  targetMouseY = 0;
});

const QUOTES_POOL = [
  // Robert G. Allen (7 quotes)
  {
    author: "Robert G. Allen",
    title: "Author & Wealth Expert",
    avatarFile: "robert_g_allen.jpg",
    text: "How many millionaires do you know who have become wealthy by investing in savings accounts? I rest my case."
  },
  {
    author: "Robert G. Allen",
    title: "Author & Wealth Expert",
    avatarFile: "robert_g_allen.jpg",
    text: "Don't wait to buy real estate. Buy real estate and wait."
  },
  {
    author: "Robert G. Allen",
    title: "Author & Wealth Expert",
    avatarFile: "robert_g_allen.jpg",
    text: "Wealth is not a matter of intelligence, it's a matter of inspiration and discipline."
  },
  {
    author: "Robert G. Allen",
    title: "Author & Wealth Expert",
    avatarFile: "robert_g_allen.jpg",
    text: "Your income is directly related to your philosophy, not the economy."
  },
  {
    author: "Robert G. Allen",
    title: "Author & Wealth Expert",
    avatarFile: "robert_g_allen.jpg",
    text: "How you feed your mind determines your appetite for success."
  },
  {
    author: "Robert G. Allen",
    title: "Author & Wealth Expert",
    avatarFile: "robert_g_allen.jpg",
    text: "The key to wealth is simple: Find a way to add value to other people's lives."
  },
  {
    author: "Robert G. Allen",
    title: "Author & Wealth Expert",
    avatarFile: "robert_g_allen.jpg",
    text: "Multiple streams of income are no longer a luxury; they are a necessity."
  },

  // Paul Samuelson (7 quotes)
  {
    author: "Paul Samuelson",
    title: "Nobel Laureate Economist",
    avatarFile: "paul_samuelson.jpg",
    text: "Investing should be more like watching paint dry or watching grass grow. If you want excitement, take $800 and go to Las Vegas."
  },
  {
    author: "Paul Samuelson",
    title: "Nobel Laureate Economist",
    avatarFile: "paul_samuelson.jpg",
    text: "In economics, it is easier to explain the past than to predict the future."
  },
  {
    author: "Paul Samuelson",
    title: "Nobel Laureate Economist",
    avatarFile: "paul_samuelson.jpg",
    text: "Markets can remain in liquid imbalances, but mathematical supply and demand will always write the final check."
  },
  {
    author: "Paul Samuelson",
    title: "Nobel Laureate Economist",
    avatarFile: "paul_samuelson.jpg",
    text: "The stock market has predicted nine of the last five recessions."
  },
  {
    author: "Paul Samuelson",
    title: "Nobel Laureate Economist",
    avatarFile: "paul_samuelson.jpg",
    text: "If you must forecast, forecast often."
  },
  {
    author: "Paul Samuelson",
    title: "Nobel Laureate Economist",
    avatarFile: "paul_samuelson.jpg",
    text: "Good questions outrank easy answers."
  },
  {
    author: "Paul Samuelson",
    title: "Nobel Laureate Economist",
    avatarFile: "paul_samuelson.jpg",
    text: "It is the start of wisdom to recognize that there are no free lunches."
  },

  // Sir John Templeton (7 quotes)
  {
    author: "Sir John Templeton",
    title: "Global Investing Pioneer",
    avatarFile: "sir_john_templeton.jpg",
    text: "The four most dangerous words in investing are, it’s different this time."
  },
  {
    author: "Sir John Templeton",
    title: "Global Investing Pioneer",
    avatarFile: "sir_john_templeton.jpg",
    text: "Buy when there's blood in the streets, even if the blood is your own."
  },
  {
    author: "Sir John Templeton",
    title: "Global Investing Pioneer",
    avatarFile: "sir_john_templeton.jpg",
    text: "The time of maximum pessimism is the best time to buy, and the time of maximum optimism is the best time to sell."
  },
  {
    author: "Sir John Templeton",
    title: "Global Investing Pioneer",
    avatarFile: "sir_john_templeton.jpg",
    text: "If you want to have better performance than the crowd, you must do things differently."
  },
  {
    author: "Sir John Templeton",
    title: "Global Investing Pioneer",
    avatarFile: "sir_john_templeton.jpg",
    text: "Focus on value, because most people focus on outlooks and trends."
  },
  {
    author: "Sir John Templeton",
    title: "Global Investing Pioneer",
    avatarFile: "sir_john_templeton.jpg",
    text: "It is nice to be important, but it's more important to be nice."
  },
  {
    author: "Sir John Templeton",
    title: "Global Investing Pioneer",
    avatarFile: "sir_john_templeton.jpg",
    text: "Invest for maximum total real return, not for maximum nominal yield."
  },

  // Peter Bernstein (7 quotes)
  {
    author: "Peter Bernstein",
    title: "Financial Historian & Author",
    avatarFile: "peter_bernstein.jpg",
    text: "Liquidity is a concern of the short-term investor and a minor matter for the long-term investor."
  },
  {
    author: "Peter Bernstein",
    title: "Financial Historian & Author",
    avatarFile: "peter_bernstein.jpg",
    text: "The survival of the fittest in markets is about risk control, not profit maximization."
  },
  {
    author: "Peter Bernstein",
    title: "Financial Historian & Author",
    avatarFile: "peter_bernstein.jpg",
    text: "We don't know what the future holds. Our models are just maps of our ignorance."
  },
  {
    author: "Peter Bernstein",
    title: "Financial Historian & Author",
    avatarFile: "peter_bernstein.jpg",
    text: "The word 'risk' derives from the early Italian 'risicare', which means 'to dare'."
  },
  {
    author: "Peter Bernstein",
    title: "Financial Historian & Author",
    avatarFile: "peter_bernstein.jpg",
    text: "The consequences of being wrong should dictate your strategy, not your view of the future."
  },
  {
    author: "Peter Bernstein",
    title: "Financial Historian & Author",
    avatarFile: "peter_bernstein.jpg",
    text: "In the real world, the future is not a continuation of the past."
  },
  {
    author: "Peter Bernstein",
    title: "Financial Historian & Author",
    avatarFile: "peter_bernstein.jpg",
    text: "Diversification is the only rational behavior in an uncertain world."
  },

  // Robert T. Kiyosaki (7 quotes)
  {
    author: "Robert T. Kiyosaki",
    title: "Author, Rich Dad Poor Dad",
    avatarFile: "robert_t_kiyosaki.jpg",
    text: "Most people fail to realize that in life, it’s not how much money you make, it’s how much money you keep."
  },
  {
    author: "Robert T. Kiyosaki",
    title: "Author, Rich Dad Poor Dad",
    avatarFile: "robert_t_kiyosaki.jpg",
    text: "It's not what you say out of your mouth that determines your life, it's what you whisper to yourself that has the most power."
  },
  {
    author: "Robert T. Kiyosaki",
    title: "Author, Rich Dad Poor Dad",
    avatarFile: "robert_t_kiyosaki.jpg",
    text: "Savers are losers. In a world of debt expansion, financial education is the only true leverage."
  },
  {
    author: "Robert T. Kiyosaki",
    title: "Author, Rich Dad Poor Dad",
    avatarFile: "robert_t_kiyosaki.jpg",
    text: "If you want to be rich, you need to learn how to make money work for you, rather than working for money."
  },
  {
    author: "Robert T. Kiyosaki",
    title: "Author, Rich Dad Poor Dad",
    avatarFile: "robert_t_kiyosaki.jpg",
    text: "Inside of every problem lies an opportunity."
  },
  {
    author: "Robert T. Kiyosaki",
    title: "Author, Rich Dad Poor Dad",
    avatarFile: "robert_t_kiyosaki.jpg",
    text: "The size of your success is measured by the strength of your desire."
  },
  {
    author: "Robert T. Kiyosaki",
    title: "Author, Rich Dad Poor Dad",
    avatarFile: "robert_t_kiyosaki.jpg",
    text: "The most life-destroying word of all is the word 'tomorrow'."
  },

  // Ed Seykota (7 quotes)
  {
    author: "Ed Seykota",
    title: "Market Wizard & Pioneer",
    avatarFile: "ed_seykota.jpg",
    text: "There are old traders and there are bold traders, but there are very few old, bold traders."
  },
  {
    author: "Ed Seykota",
    title: "Market Wizard & Pioneer",
    avatarFile: "ed_seykota.jpg",
    text: "The trend is your friend until the end when it bends."
  },
  {
    author: "Ed Seykota",
    title: "Market Wizard & Pioneer",
    avatarFile: "ed_seykota.jpg",
    text: "If you can't take a small loss, sooner or later you will take the mother of all losses."
  },
  {
    author: "Ed Seykota",
    title: "Market Wizard & Pioneer",
    avatarFile: "ed_seykota.jpg",
    text: "Everyone gets what they want out of the market. Win or lose, people get what they want."
  },
  {
    author: "Ed Seykota",
    title: "Market Wizard & Pioneer",
    avatarFile: "ed_seykota.jpg",
    text: "Win or lose, everybody gets what they want out of the market. Some people seem to like to lose."
  },
  {
    author: "Ed Seykota",
    title: "Market Wizard & Pioneer",
    avatarFile: "ed_seykota.jpg",
    text: "A losing position is a lesson, not an identity."
  },
  {
    author: "Ed Seykota",
    title: "Market Wizard & Pioneer",
    avatarFile: "ed_seykota.jpg",
    text: "Having a system is the difference between investing and gambling."
  },

  // Walter Schloss (7 quotes)
  {
    author: "Walter Schloss",
    title: "Value Investing Legend",
    avatarFile: "walter_schloss.jpg",
    text: "Have patience. Stocks don’t go up immediately."
  },
  {
    author: "Walter Schloss",
    title: "Value Investing Legend",
    avatarFile: "walter_schloss.jpg",
    text: "Try to buy assets at a discount rather than earnings. Earnings can change rapidly, but assets change slowly."
  },
  {
    author: "Walter Schloss",
    title: "Value Investing Legend",
    avatarFile: "walter_schloss.jpg",
    text: "We don't like debt. Debt can get you into a lot of trouble when times get tough in the business cycle."
  },
  {
    author: "Walter Schloss",
    title: "Value Investing Legend",
    avatarFile: "walter_schloss.jpg",
    text: "If you buy cheap companies and have patience, most of them will work out in the long run."
  },
  {
    author: "Walter Schloss",
    title: "Value Investing Legend",
    avatarFile: "walter_schloss.jpg",
    text: "Remember that a stock represents a piece of a business, not just a blinking ticker symbol."
  },
  {
    author: "Walter Schloss",
    title: "Value Investing Legend",
    avatarFile: "walter_schloss.jpg",
    text: "Avoid emotional attachment to your holdings. They do not know that you own them."
  },
  {
    author: "Walter Schloss",
    title: "Value Investing Legend",
    avatarFile: "walter_schloss.jpg",
    text: "If you can't buy at a bargain, the best thing to do is to hold cash."
  },

  // Charlie Munger (7 quotes)
  {
    author: "Charlie Munger",
    title: "Vice Chairman, Berkshire Hathaway",
    avatarFile: "charlie_munger.jpg",
    text: "A lot of people with high IQs are terrible investors because they’ve got terrible temperaments."
  },
  {
    author: "Charlie Munger",
    title: "Vice Chairman, Berkshire Hathaway",
    avatarFile: "charlie_munger.jpg",
    text: "The first rule of compounding: Never interrupt it unnecessarily."
  },
  {
    author: "Charlie Munger",
    title: "Vice Chairman, Berkshire Hathaway",
    avatarFile: "charlie_munger.jpg",
    text: "The big money is not in the buying and the selling, but in the waiting."
  },
  {
    author: "Charlie Munger",
    title: "Vice Chairman, Berkshire Hathaway",
    avatarFile: "charlie_munger.jpg",
    text: "Knowing what you don't know is more useful than being brilliant."
  },
  {
    author: "Charlie Munger",
    title: "Vice Chairman, Berkshire Hathaway",
    avatarFile: "charlie_munger.jpg",
    text: "Spend each day trying to be a little wiser than you were when you woke up."
  },
  {
    author: "Charlie Munger",
    title: "Vice Chairman, Berkshire Hathaway",
    avatarFile: "charlie_munger.jpg",
    text: "To get what you want, you have to deserve what you want."
  },
  {
    author: "Charlie Munger",
    title: "Vice Chairman, Berkshire Hathaway",
    avatarFile: "charlie_munger.jpg",
    text: "Simplicity has a way of improving performance by enabling us to better understand what we are doing."
  },

  // Jensen Huang (7 quotes)
  {
    author: "Jensen Huang",
    title: "NVIDIA CEO",
    avatarFile: "jensen_huang.jpg",
    text: "Well, I don't have any greater insight than anybody else"
  },
  {
    author: "Jensen Huang",
    title: "NVIDIA CEO",
    avatarFile: "jensen_huang.jpg",
    text: "The more you buy, the more you save! Accelerated computing is the future."
  },
  {
    author: "Jensen Huang",
    title: "NVIDIA CEO",
    avatarFile: "jensen_huang.jpg",
    text: "We are at the iPhone moment of artificial intelligence and automated market analysis."
  },
  {
    author: "Jensen Huang",
    title: "NVIDIA CEO",
    avatarFile: "jensen_huang.jpg",
    text: "Run, don't walk. Either you are running for food, or you are running from being food."
  },
  {
    author: "Jensen Huang",
    title: "NVIDIA CEO",
    avatarFile: "jensen_huang.jpg",
    text: "Pain and suffering are necessary parts of building a resilient character."
  },
  {
    author: "Jensen Huang",
    title: "NVIDIA CEO",
    avatarFile: "jensen_huang.jpg",
    text: "We are entering a new industrial revolution where data is the raw material and AI is the factory."
  },
  {
    author: "Jensen Huang",
    title: "NVIDIA CEO",
    avatarFile: "jensen_huang.jpg",
    text: "The future of computing is generative, and the future of work is collaborative."
  }
];

function getAvatarSVG(author) {
  let bg = "linear-gradient(135deg, #1e293b, #475569)";
  let svgContent = "";

  switch (author) {
    case "Charlie Munger":
      bg = "linear-gradient(135deg, #7c2d12, #ea580c)";
      svgContent = `
        <path d="M12 5c-3.31 0-6 2.69-6 6v2c0 2.21 1.79 4 4 4h4c2.21 0 4-1.79 4-4v-2c0-3.31-2.69-6-6-6z" fill="#ffffff" opacity="0.15"/>
        <circle cx="12" cy="11" r="5" fill="#ffffff" opacity="0.3"/>
        <circle cx="9.5" cy="10.5" r="2" stroke="#ffffff" stroke-width="1.2" fill="none" opacity="0.9"/>
        <circle cx="14.5" cy="10.5" r="2" stroke="#ffffff" stroke-width="1.2" fill="none" opacity="0.9"/>
        <line x1="11.5" y1="10.5" x2="12.5" y2="10.5" stroke="#ffffff" stroke-width="1.2" opacity="0.9"/>
        <path d="M5 20c0-2.5 3-3 7-3s7 .5 7 3v1H5v-1z" fill="#ffffff" opacity="0.45"/>
        <path d="M10 17l2 2 2-2" stroke="#ffffff" stroke-width="1" fill="none" opacity="0.6"/>
      `;
      break;
    case "Jensen Huang":
      bg = "linear-gradient(135deg, #052e16, #15803d)";
      svgContent = `
        <circle cx="12" cy="12" r="9" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="3 2" fill="none" opacity="0.5"/>
        <path d="M12 4c-3 0-5 2-5 5v3c0 2 1.5 3 3.5 3h3c2 0 3.5-1 3.5-3V9c0-3-2-5-5-5z" fill="#ffffff" opacity="0.2"/>
        <circle cx="12" cy="9.5" r="4.5" fill="#ffffff" opacity="0.3"/>
        <path d="M5 20c0-2.5 3-3.5 7-3.5s7 1 7 3.5v1H5v-1z" fill="#111827" opacity="0.75"/>
        <path d="M9 16.5l3 2.5 3-2.5" stroke="#22c55e" stroke-width="1.5" fill="none" opacity="0.9"/>
      `;
      break;
    case "Robert T. Kiyosaki":
      bg = "linear-gradient(135deg, #3b0764, #701a75)";
      svgContent = `
        <circle cx="12" cy="10" r="5" fill="#ffffff" opacity="0.25"/>
        <rect x="8" y="9" width="3" height="2" rx="0.5" stroke="#ffffff" stroke-width="1" fill="none" opacity="0.9"/>
        <rect x="13" y="9" width="3" height="2" rx="0.5" stroke="#ffffff" stroke-width="1" fill="none" opacity="0.9"/>
        <line x1="11" y1="10" x2="13" y2="10" stroke="#ffffff" stroke-width="1" opacity="0.9"/>
        <path d="M5 20c0-2.5 3-3.5 7-3.5s7 1 7 3.5v1H5v-1z" fill="#ffffff" opacity="0.4"/>
        <path d="M11.5 16.5l.5 3.5 .5-3.5" fill="#eab308" stroke="#eab308" stroke-width="1.5" opacity="0.9"/>
      `;
      break;
    case "Sir John Templeton":
      bg = "linear-gradient(135deg, #78350f, #d97706)";
      svgContent = `
        <circle cx="12" cy="12" r="8" stroke="#ffffff" stroke-width="0.7" fill="none" opacity="0.2"/>
        <line x1="12" y1="4" x2="12" y2="20" stroke="#ffffff" stroke-width="0.7" opacity="0.2"/>
        <line x1="4" y1="12" x2="20" y2="12" stroke="#ffffff" stroke-width="0.7" opacity="0.2"/>
        <circle cx="12" cy="9.5" r="4.5" fill="#ffffff" opacity="0.3"/>
        <path d="M5 20c0-2.5 3-3 7-3s7 .5 7 3v1H5v-1z" fill="#ffffff" opacity="0.45"/>
      `;
      break;
    case "Ed Seykota":
      bg = "linear-gradient(135deg, #1e1b4b, #312e81)";
      svgContent = `
        <path d="M4 12h3l2-4 3 8 2-6 2 4 4-2" stroke="#38bdf8" stroke-width="1.2" fill="none" opacity="0.5"/>
        <circle cx="12" cy="10" r="4.5" fill="#ffffff" opacity="0.3"/>
        <path d="M6 10c0-4 3-4 6-4s6 0 6 4" stroke="#ffffff" stroke-width="1.2" fill="none" opacity="0.5"/>
        <rect x="5" y="9.5" width="2" height="3.5" rx="0.5" fill="#ffffff" opacity="0.8"/>
        <rect x="17" y="9.5" width="2" height="3.5" rx="0.5" fill="#ffffff" opacity="0.8"/>
        <path d="M5 20c0-2 2-3 7-3s7 1 7 3v1H5v-1z" fill="#ffffff" opacity="0.4"/>
      `;
      break;
    case "Peter Bernstein":
      bg = "linear-gradient(135deg, #0f172a, #334155)";
      svgContent = `
        <path d="M7 6h10v12H7z" fill="#ffffff" opacity="0.1"/>
        <circle cx="12" cy="10" r="4.5" fill="#ffffff" opacity="0.25"/>
        <circle cx="9.5" cy="10" r="1.5" stroke="#ffffff" stroke-width="1" fill="none" opacity="0.8"/>
        <circle cx="14.5" cy="10" r="1.5" stroke="#ffffff" stroke-width="1" fill="none" opacity="0.8"/>
        <line x1="11" y1="10" x2="13" y2="10" stroke="#ffffff" stroke-width="1" opacity="0.8"/>
        <path d="M5 20c0-2.5 3-3 7-3s7 .5 7 3v1H5v-1z" fill="#ffffff" opacity="0.4"/>
      `;
      break;
    case "Walter Schloss":
      bg = "linear-gradient(135deg, #4c0519, #881337)";
      svgContent = `
        <path d="M12 6v6l3 2" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.25"/>
        <circle cx="12" cy="9.5" r="4.5" fill="#ffffff" opacity="0.3"/>
        <path d="M5 20c0-2.5 3-3.2 7-3.2s7 .7 7 3.2v1H5v-1z" fill="#ffffff" opacity="0.45"/>
        <path d="M11 17.5l1-1 1 1-1 1z" fill="#ffffff" opacity="0.8"/>
      `;
      break;
    case "Paul Samuelson":
      bg = "linear-gradient(135deg, #172554, #1e3a8a)";
      svgContent = `
        <path d="M12 17c0-3 1-5 3-6m-3 6c0-4-2-5-4-6m4 6V9" stroke="#10b981" stroke-width="1" fill="none" opacity="0.4"/>
        <circle cx="12" cy="9.5" r="4.5" fill="#ffffff" opacity="0.3"/>
        <path d="M5 20c0-2.5 3-3 7-3s7 .5 7 3v1H5v-1z" fill="#ffffff" opacity="0.45"/>
      `;
      break;
    case "Robert G. Allen":
      bg = "linear-gradient(135deg, #7c2d12, #c2410c)";
      svgContent = `
        <rect x="6" y="11" width="2" height="6" fill="#ffffff" opacity="0.15"/>
        <rect x="10" y="8" width="2" height="9" fill="#ffffff" opacity="0.15"/>
        <rect x="14" y="5" width="2" height="12" fill="#ffffff" opacity="0.15"/>
        <circle cx="12" cy="9.5" r="4.5" fill="#ffffff" opacity="0.3"/>
        <path d="M5 20c0-2.5 3-3 7-3s7 .5 7 3v1H5v-1z" fill="#ffffff" opacity="0.45"/>
      `;
      break;
    default:
      bg = "linear-gradient(135deg, #1e293b, #475569)";
      svgContent = `
        <circle cx="12" cy="10" r="5" fill="#ffffff" opacity="0.3"/>
        <path d="M5 20c0-2.5 3-3 7-3s7 .5 7 3v1H5v-1z" fill="#ffffff" opacity="0.45"/>
      `;
      break;
  }

  return `
    <svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="border-radius: 50%; background: ${bg}">
      ${svgContent}
    </svg>
  `;
}

function getAvatarHTML(quote) {
  const avatarPath = `/avatars/${quote.avatarFile}`;
  const fallbackSVG = getAvatarSVG(quote.author);
  
  return `
    <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
      <!-- Inline fallback SVG shown by default -->
      <div class="avatar-svg-fallback" style="position: absolute; inset: 0; z-index: 1; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
        ${fallbackSVG}
      </div>
      <!-- Image overlay, z-index 2. Smoothly fades in once loaded over the SVG -->
      <img src="${avatarPath}" alt="${quote.author}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 50%; z-index: 2; opacity: 0; transition: opacity 0.3s ease; display: block;" onload="this.style.opacity='1';" onerror="this.remove();" />
    </div>
  `;
}

function initFloatingQuotes(canvas) {
  const parent = canvas.parentElement;
  if (!parent) return () => {};

  // Cleanup old quotes container if present
  let oldContainer = parent.querySelector('#quotes-container');
  if (oldContainer) oldContainer.remove();

  const container = document.createElement('div');
  container.id = 'quotes-container';
  canvas.after(container);

  // ── MARKET TICKER HUD (Top-Left) ──
  const tickerEl = document.createElement('div');
  tickerEl.className = 'vitti-widget';
  tickerEl.style.top = '6vh';
  tickerEl.style.left = '6vw';
  tickerEl.innerHTML = `
    <div class="ticker-title">
      <span>Market Status</span>
      <span class="pulsing-dot"></span>
    </div>
    <div class="ticker-grid">
      <div class="ticker-row" id="ticker-sol">
        <div class="ticker-name-col">
          <span class="ticker-sym">SOL</span>
          <span class="ticker-full">Solana / USD</span>
        </div>
        <div class="ticker-price-col">
          <span class="ticker-val" id="val-sol">165.50</span>
          <span class="ticker-chg chg-positive" id="chg-sol">+1.20%</span>
        </div>
      </div>
      <div class="ticker-row" id="ticker-btc">
        <div class="ticker-name-col">
          <span class="ticker-sym">BTC</span>
          <span class="ticker-full">Bitcoin / USD</span>
        </div>
        <div class="ticker-price-col">
          <span class="ticker-val" id="val-btc">67,240.50</span>
          <span class="ticker-chg chg-positive" id="chg-btc">+1.85%</span>
        </div>
      </div>
      <div class="ticker-row" id="ticker-eth">
        <div class="ticker-name-col">
          <span class="ticker-sym">ETH</span>
          <span class="ticker-full">Ethereum / USD</span>
        </div>
        <div class="ticker-price-col">
          <span class="ticker-val" id="val-eth">3,490.80</span>
          <span class="ticker-chg chg-negative" id="chg-eth">-0.25%</span>
        </div>
      </div>
      <div class="ticker-row" id="ticker-aud">
        <div class="ticker-name-col">
          <span class="ticker-sym">AUD</span>
          <span class="ticker-full">AUD / USD Forex</span>
        </div>
        <div class="ticker-price-col">
          <span class="ticker-val" id="val-aud">0.6644</span>
          <span class="ticker-chg chg-positive" id="chg-aud">+0.15%</span>
        </div>
      </div>
    </div>
  `;
  container.appendChild(tickerEl);

  // ── SESSIONS WIDGET (Bottom-Right) ──
  const sessionsEl = document.createElement('div');
  sessionsEl.className = 'vitti-widget';
  sessionsEl.style.bottom = '11vh';
  sessionsEl.style.right = '6vw';
  sessionsEl.innerHTML = `
    <div class="sessions-header">
      <span>Trading Sessions</span>
      <span class="pulsing-green-dot"></span>
    </div>
    <div class="sessions-grid">
      <div class="session-row" id="session-london">
        <div class="session-info">
          <span class="session-name">London</span>
          <span class="session-time" id="time-london">--:--:--</span>
        </div>
        <div class="session-status">
          <span class="session-badge">CLOSED</span>
        </div>
      </div>
      <div class="session-row" id="session-newyork">
        <div class="session-info">
          <span class="session-name">New York</span>
          <span class="session-time" id="time-newyork">--:--:--</span>
        </div>
        <div class="session-status">
          <span class="session-badge">CLOSED</span>
        </div>
      </div>
      <div class="session-row" id="session-tokyo">
        <div class="session-info">
          <span class="session-name">Tokyo</span>
          <span class="session-time" id="time-tokyo">--:--:--</span>
        </div>
        <div class="session-status">
          <span class="session-badge">CLOSED</span>
        </div>
      </div>
      <div class="session-row" id="session-sydney">
        <div class="session-info">
          <span class="session-name">Sydney</span>
          <span class="session-time" id="time-sydney">--:--:--</span>
        </div>
        <div class="session-status">
          <span class="session-badge">CLOSED</span>
        </div>
      </div>
    </div>
  `;
  container.appendChild(sessionsEl);

  // Helper to dynamically update session local clocks and active statuses
  function updateTradingSessions() {
    const sessions = [
      { id: 'london', tz: 'Europe/London', openHour: 8, closeHour: 16 },
      { id: 'newyork', tz: 'America/New_York', openHour: 8, closeHour: 17 },
      { id: 'tokyo', tz: 'Asia/Tokyo', openHour: 9, closeHour: 17 },
      { id: 'sydney', tz: 'Australia/Sydney', openHour: 9, closeHour: 17 }
    ];

    const now = new Date();
    sessions.forEach(session => {
      try {
        const timeStr = now.toLocaleTimeString('en-US', {
          timeZone: session.tz,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        const parts = timeStr.split(':');
        const hour = parseInt(parts[0], 10);

        const isOpen = hour >= session.openHour && hour < session.closeHour;

        const rowEl = container.querySelector(`#session-${session.id}`);
        if (rowEl) {
          const timeEl = rowEl.querySelector(`#time-${session.id}`);
          const badgeEl = rowEl.querySelector('.session-badge');

          if (timeEl) timeEl.textContent = timeStr;
          if (badgeEl) {
            badgeEl.textContent = isOpen ? 'OPEN' : 'CLOSED';
            if (isOpen) {
              badgeEl.classList.remove('badge-closed');
              badgeEl.classList.add('badge-open');
            } else {
              badgeEl.classList.remove('badge-open');
              badgeEl.classList.add('badge-closed');
            }
          }
        }
      } catch (err) {
        console.warn(`Timezone calculation failed for ${session.id}:`, err);
      }
    });
  }

  // Initialize and run the sessions loop
  updateTradingSessions();
  const sessionsInterval = setInterval(updateTradingSessions, 1000);

  // Helper to fetch live market prices from Binance and Open Exchange Rates (AUD)
  async function syncLiveMarketData() {
    try {
      const [btcRes, ethRes, solRes, audRes] = await Promise.all([
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT'),
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT'),
        fetch('https://open.er-api.com/v6/latest/AUD')
      ]);

      if (btcRes.ok) {
        const btcData = await btcRes.json();
        const price = parseFloat(btcData.lastPrice);
        const change = parseFloat(btcData.priceChangePercent);
        
        tickers.btc.price = price;
        tickers.btc.base = price; // Reset baseline for tick simulation
        tickers.btc.pct = change;

        const valEl = container.querySelector('#val-btc');
        const chgEl = container.querySelector('#chg-btc');
        if (valEl && chgEl) {
          valEl.textContent = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          chgEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
          chgEl.className = `ticker-chg ${change >= 0 ? 'chg-positive' : 'chg-negative'}`;
        }
      }

      if (ethRes.ok) {
        const ethData = await ethRes.json();
        const price = parseFloat(ethData.lastPrice);
        const change = parseFloat(ethData.priceChangePercent);

        tickers.eth.price = price;
        tickers.eth.base = price; // Reset baseline for tick simulation
        tickers.eth.pct = change;

        const valEl = container.querySelector('#val-eth');
        const chgEl = container.querySelector('#chg-eth');
        if (valEl && chgEl) {
          valEl.textContent = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          chgEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
          chgEl.className = `ticker-chg ${change >= 0 ? 'chg-positive' : 'chg-negative'}`;
        }
      }

      if (solRes.ok) {
        const solData = await solRes.json();
        const price = parseFloat(solData.lastPrice);
        const change = parseFloat(solData.priceChangePercent);

        tickers.sol.price = price;
        tickers.sol.base = price; // Reset baseline for tick simulation
        tickers.sol.pct = change;

        const valEl = container.querySelector('#val-sol');
        const chgEl = container.querySelector('#chg-sol');
        if (valEl && chgEl) {
          valEl.textContent = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          chgEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
          chgEl.className = `ticker-chg ${change >= 0 ? 'chg-positive' : 'chg-negative'}`;
        }
      }

      if (audRes.ok) {
        const audData = await audRes.json();
        const price = parseFloat(audData.rates.USD);
        
        tickers.aud.price = price;
        tickers.aud.base = price; // Reset baseline for tick simulation
        // The exchangerate API doesn't give 24h change percentages keyless, so we track from our default baseline (+0.15%)
        const change = tickers.aud.pct;

        const valEl = container.querySelector('#val-aud');
        const chgEl = container.querySelector('#chg-aud');
        if (valEl && chgEl) {
          valEl.textContent = price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
          chgEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
          chgEl.className = `ticker-chg ${change >= 0 ? 'chg-positive' : 'chg-negative'}`;
        }
      }
    } catch (err) {
      console.warn("Live market data sync failed, using fallback tracking:", err);
    }
  }

  // Trigger entering transitions
  requestAnimationFrame(() => {
    setTimeout(() => {
      tickerEl.style.opacity = '1';
      tickerEl.style.transform = 'scale(1) translateY(0)';
    }, 300);
    setTimeout(() => {
      sessionsEl.style.opacity = '1';
      sessionsEl.style.transform = 'scale(1) translateY(0)';
    }, 500);
  });

  // Tickers current values memory
  const tickers = {
    sol: { price: 165.50, base: 165.50, pct: 1.20 },
    btc: { price: 67240.50, base: 67240.50, pct: 1.85 },
    eth: { price: 3490.80, base: 3490.80, pct: -0.25 },
    aud: { price: 0.6644, base: 0.6644, pct: 0.15 }
  };

  // Poll live API every 15 seconds to sync with order books
  const liveSyncInterval = setInterval(syncLiveMarketData, 15000);
  
  // Call immediately on start
  syncLiveMarketData();

  // Fluctuating interval loops
  const tickerUpdateInterval = setInterval(() => {
    const keys = Object.keys(tickers);
    const key = keys[Math.floor(Math.random() * keys.length)];
    const ticker = tickers[key];

    // Pick dynamic random deviation -0.08% to +0.08%
    const changePct = (Math.random() * 0.16 - 0.08) / 100;
    const oldPrice = ticker.price;
    ticker.price = +(ticker.price * (1 + changePct)).toFixed(key === 'aud' ? 4 : 2);
    
    // Update active return percentage relative to starting index reference
    const diffFromBase = ticker.price - ticker.base;
    ticker.pct = +(((diffFromBase / ticker.base) * 100) + (key === 'eth' ? tickers.eth.pct : key === 'btc' ? tickers.btc.pct : key === 'aud' ? tickers.aud.pct : tickers.sol.pct)).toFixed(2);

    const valEl = container.querySelector(`#val-${key}`);
    const chgEl = container.querySelector(`#chg-${key}`);

    if (valEl && chgEl) {
      const digits = key === 'aud' ? 4 : 2;
      valEl.textContent = ticker.price.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
      
      const isUp = ticker.pct >= 0;
      chgEl.textContent = `${isUp ? '+' : ''}${ticker.pct}%`;
      chgEl.className = `ticker-chg ${isUp ? 'chg-positive' : 'chg-negative'}`;

      // Flashing text animation color change
      const isHigher = ticker.price >= oldPrice;
      valEl.classList.add(isHigher ? 'flash-green' : 'flash-red');
      setTimeout(() => {
        valEl.classList.remove('flash-green', 'flash-red');
      }, 500);
    }
  }, 2500);



  const SLOTS = {
    'top-right': { top: '6vh', right: '6vw' },
    'bottom-left': { bottom: '11vh', left: '6vw' }
  };

  const timers = [];

  function createQuoteCard(slotName) {
    let lastQuoteIndex = -1;
    let cardTimeLeft = 9000 + Math.random() * 2000; // Desynchronize cycle timings
    let cardIsHovered = false;
    let activeTypingInterval = null;

    const cardEl = document.createElement('div');
    cardEl.className = 'quote-card-popup';
    cardEl.style.opacity = '0';
    cardEl.style.transform = 'scale(0.92) translateY(12px)';
    cardEl.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease';

    function applyPosition() {
      const isMobile = window.innerWidth < 850;
      if (isMobile) {
        // Hide the bottom-left one on mobile so they don't overlap
        if (slotName === 'bottom-left') {
          cardEl.style.display = 'none';
          return;
        }
        cardEl.style.display = 'block';
        cardEl.style.top = 'auto';
        cardEl.style.right = '5%';
        cardEl.style.bottom = '4vh';
        cardEl.style.left = '5%';
        cardEl.style.margin = '0 auto';
      } else {
        cardEl.style.display = 'block';
        const pos = SLOTS[slotName];
        if (pos.top) cardEl.style.top = pos.top; else cardEl.style.top = 'auto';
        if (pos.right) cardEl.style.right = pos.right; else cardEl.style.right = 'auto';
        if (pos.bottom) cardEl.style.bottom = pos.bottom; else cardEl.style.bottom = 'auto';
        if (pos.left) cardEl.style.left = pos.left; else cardEl.style.left = 'auto';
        cardEl.style.margin = '0';
      }
    }

    applyPosition();

    cardEl.innerHTML = `<div class="quote-card-inner enter-prep"></div>`;
    const innerEl = cardEl.querySelector('.quote-card-inner');
    container.appendChild(cardEl);

    cardEl.addEventListener('mouseenter', () => { cardIsHovered = true; });
    cardEl.addEventListener('mouseleave', () => { cardIsHovered = false; });

    function typeQuote(element, text, cursorEl) {
      if (activeTypingInterval) clearInterval(activeTypingInterval);
      element.textContent = '';
      if (cursorEl) cursorEl.style.display = 'inline-block';
      
      let i = 0;
      activeTypingInterval = setInterval(() => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(activeTypingInterval);
          activeTypingInterval = null;
          if (cursorEl) cursorEl.style.display = 'none';
        }
      }, 18);
    }

    function cycleQuote() {
      let quoteIndex;
      let attempts = 0;
      do {
        quoteIndex = Math.floor(Math.random() * QUOTES_POOL.length);
        attempts++;
      } while (attempts < 15 && quoteIndex === lastQuoteIndex && QUOTES_POOL.length > 1);

      lastQuoteIndex = quoteIndex;
      const quote = QUOTES_POOL[quoteIndex];

      const hasContent = innerEl.innerHTML !== '';

      if (hasContent) {
        const oldAvatar = innerEl.querySelector('.quote-avatar');
        if (oldAvatar) oldAvatar.className = 'quote-avatar roll-out';
        innerEl.className = 'quote-card-inner exit';
        
        const t = setTimeout(() => {
          innerEl.innerHTML = `
            <div class="quote-header">
              <div class="quote-avatar roll-in">${getAvatarHTML(quote)}</div>
              <div class="quote-meta">
                <span class="quote-author">${quote.author}</span>
                <span class="quote-handle">${quote.title}</span>
              </div>
            </div>
            <div class="quote-text">“<span class="quote-text-body"></span><span class="typing-cursor"></span>”</div>
          `;
          innerEl.className = 'quote-card-inner enter-prep';
          
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              innerEl.className = 'quote-card-inner';
              const newAvatar = innerEl.querySelector('.quote-avatar');
              if (newAvatar) {
                setTimeout(() => { newAvatar.classList.remove('roll-in'); }, 50);
              }
              const authorEl = innerEl.querySelector('.quote-author');
              const handleEl = innerEl.querySelector('.quote-handle');
              if (authorEl) authorEl.classList.add('reveal');
              if (handleEl) handleEl.classList.add('reveal');

              const bodyEl = innerEl.querySelector('.quote-text-body');
              const cursorEl = innerEl.querySelector('.typing-cursor');
              if (bodyEl) typeQuote(bodyEl, quote.text, cursorEl);
            });
          });
        }, 500);
        timers.push(t);
      } else {
        innerEl.innerHTML = `
          <div class="quote-header">
            <div class="quote-avatar roll-in">${getAvatarHTML(quote)}</div>
            <div class="quote-meta">
              <span class="quote-author">${quote.author}</span>
              <span class="quote-handle">${quote.title}</span>
            </div>
          </div>
          <div class="quote-text">“<span class="quote-text-body"></span><span class="typing-cursor"></span>”</div>
        `;
        innerEl.className = 'quote-card-inner';

        requestAnimationFrame(() => {
          setTimeout(() => {
            cardEl.style.opacity = '1';
            cardEl.style.transform = 'scale(1) translateY(0)';
            
            const newAvatar = innerEl.querySelector('.quote-avatar');
            if (newAvatar) {
              setTimeout(() => { newAvatar.classList.remove('roll-in'); }, 50);
            }
            const authorEl = innerEl.querySelector('.quote-author');
            const handleEl = innerEl.querySelector('.quote-handle');
            if (authorEl) authorEl.classList.add('reveal');
            if (handleEl) handleEl.classList.add('reveal');

            const bodyEl = innerEl.querySelector('.quote-text-body');
            const cursorEl = innerEl.querySelector('.typing-cursor');
            if (bodyEl) typeQuote(bodyEl, quote.text, cursorEl);
          }, 800);
        });
      }
    }

    cycleQuote();

    const intervalId = setInterval(() => {
      if (!cardIsHovered) {
        cardTimeLeft -= 100;
        if (cardTimeLeft <= 0) {
          cardTimeLeft = 9000;
          cycleQuote();
        }
      }
    }, 100);

    return {
      cardEl,
      applyPosition,
      destroy: () => {
        clearInterval(intervalId);
        if (activeTypingInterval) clearInterval(activeTypingInterval);
        cardEl.remove();
      }
    };
  }

  // Create cards for both desktop slots
  const activeCards = [
    createQuoteCard('top-right'),
    createQuoteCard('bottom-left')
  ];

  // Parallax container shift based on interpolated mouse positions
  let animationFrameId;
  function update() {
    if (!canvas.isConnected) return;
    container.style.transform = `translate3d(${mouseX * -16}px, ${mouseY * -16}px, 0)`;
    animationFrameId = requestAnimationFrame(update);
  }
  update();

  function handleResize() {
    activeCards.forEach(c => c.applyPosition());
  }
  window.addEventListener('resize', handleResize);

  // Cleanup handler returned to parent background manager
  return () => {
    clearInterval(tickerUpdateInterval);
    clearInterval(liveSyncInterval);
    clearInterval(sessionsInterval);
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', handleResize);
    activeCards.forEach(c => c.destroy());
    timers.forEach(t => clearTimeout(t));
    container.remove();
  };
}

// â”€â”€ Candlestick Canvas Background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function startCandleBg(canvas) {
  const ctx = canvas.getContext('2d');

  // Cancel any existing background quotes loop to prevent memory/CPU leaks
  if (window.cleanupBackgroundQuotes) {
    window.cleanupBackgroundQuotes();
  }
  window.cleanupBackgroundQuotes = initFloatingQuotes(canvas);

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const CW    = 10;    // candle body width px
  const GAP   = 5;     // gap between candles px
  const CS    = CW + GAP; // stride per candle px
  const SPEED = 0.45;  // scroll px per frame

  /* â”€â”€ Single-candle generator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  let trend = 2;
  function makeCandle(prev) {
    if (Math.random() < 0.04) trend = (Math.random() - 0.5) * 14;
    const open   = prev.close;
    const move   = trend + (Math.random() - 0.5) * 16;
    const close  = open + move;
    const ext    = Math.abs(close - open) + 2;
    const high   = Math.max(open, close) + Math.random() * ext * 0.85;
    const low    = Math.min(open, close) - Math.random() * ext * 0.85;
    const volume = 0.05 + Math.random() * 0.12 + ext * 0.002;
    const ema20  = close * (2/21) + prev.ema20 * (1 - 2/21);
    const ema50  = close * (2/51) + prev.ema50 * (1 - 2/51);
    let signal = null;
    if (Math.random() < 0.02 && Math.abs(close - open) > 8)
      signal = close > open ? 'BUY' : 'SELL';
    return { open, close, high, low, volume, ema20, ema50, signal };
  }

  /* â”€â”€ Seed 350 historical candles (open[i] = close[i-1]) â”€â”€â”€ */
  const candles = [];
  let seed = { open:64200, close:64200, high:64200, low:64200,
               volume:0.08, ema20:64200, ema50:64200, signal:null };
  candles.push(seed);
  for (let i = 0; i < 350; i++) candles.push(makeCandle(candles[candles.length-1]));

  // Initial forming candle: starts flat at last historical close
  const ip = candles[candles.length - 1];
  candles.push({ open:ip.close, close:ip.close, high:ip.close, low:ip.close,
                 volume:0.06, ema20:ip.ema20, ema50:ip.ema50, signal:null });

  let scrollPx = 0; // 0..CS â€” sub-candle scroll offset

  /* â”€â”€ Ticker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const TICKERS = [
    'BTC  +2.14%','ETH  +0.87%','ASX 200  -0.32%','SPX  +1.10%',
    'GOLD  +0.55%','AUD/USD  -0.18%','NASDAQ  +1.44%','NVDA  +3.21%',
    'AAPL  +0.72%','TSLA  -1.08%','BNB  +1.65%','SOL  +4.10%',
  ];
  let tickerX = 0;
  const tickerStr = TICKERS.join('    Â·    ');

  /* â”€â”€ Draw loop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function draw() {
    if (!canvas.isConnected) { window.removeEventListener('resize', resize); return; }

    const W = canvas.width;
    const H = canvas.height;

    /* Advance scroll; birth new candle when stride completes */
    scrollPx += SPEED;
    if (scrollPx >= CS) {
      scrollPx -= CS;
      const prev = candles[candles.length - 1];
      // New forming candle opens flat at previous close
      candles.push({ open:prev.close, close:prev.close, high:prev.close, low:prev.close,
                     volume:0.06, ema20:prev.ema20, ema50:prev.ema50, signal:null });
      // Trim candles scrolled far off the left edge
      const maxKeep = Math.ceil(W / CS) + 80;
      if (candles.length > maxKeep) candles.splice(0, candles.length - maxKeep);
    }

    /* Tick live price on the forming candle (always the last element) */
    const forming = candles[candles.length - 1];
    forming.close += (Math.random() - 0.48) * 1.4;
    if (forming.close > forming.high) forming.high = forming.close;
    if (forming.close < forming.low)  forming.low  = forming.close;
    if (candles.length > 1) {
      const p2 = candles[candles.length - 2];
      forming.ema20 = forming.close * (2/21) + p2.ema20 * (1 - 2/21);
      forming.ema50 = forming.close * (2/51) + p2.ema50 * (1 - 2/51);
    }

    /* Parallax */
    mouseX += (targetMouseX - mouseX) * 0.08;
    mouseY += (targetMouseY - mouseY) * 0.08;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(mouseX * 20, mouseY * 20);

    /* Background grid */
    ctx.strokeStyle = 'rgba(255,255,255,0.022)';
    ctx.lineWidth = 1;
    for (let x = -60; x < W+60; x += 60) { ctx.beginPath(); ctx.moveTo(x,-60); ctx.lineTo(x,H+60); ctx.stroke(); }
    for (let y = -60; y < H+60; y += 60) { ctx.beginPath(); ctx.moveTo(-60,y); ctx.lineTo(W+60,y); ctx.stroke(); }

    /* Layout */
    const TICKER_H = 30, AXIS_W = 74, AXIS_H = 26;
    const chartTop = TICKER_H + 8;
    const chartBot = H - AXIS_H;
    const chartH   = chartBot - chartTop;
    const chartW   = W - AXIS_W;

    // Forming candle is always anchored at 62% from left
    const ANCHOR_X = Math.floor(chartW * 0.62);

    /* Build visible candle list (oldest first, newest last) */
    // age 0 = forming: x = ANCHOR_X - scrollPx
    // age 1 = prev:    x = ANCHOR_X - scrollPx - CS  ... etc.
    const visible = [];
    for (let i = candles.length - 1; i >= 0; i--) {
      const age = candles.length - 1 - i;
      const x   = ANCHOR_X - scrollPx - age * CS;
      if (x + CW < 0) break;
      visible.unshift({ candle: candles[i], x });
    }

    /* Y scale from visible candles */
    let priceMin = Infinity, priceMax = -Infinity;
    visible.forEach(({candle:c}) => {
      if (c.low  < priceMin) priceMin = c.low;
      if (c.high > priceMax) priceMax = c.high;
    });
    if (!isFinite(priceMin)) { priceMin = 63000; priceMax = 65000; }
    const rPad = (priceMax - priceMin) * 0.08 || 100;
    const yMin = priceMin - rPad, yMax = priceMax + rPad;
    const toY  = v => chartBot - ((v - yMin) / (yMax - yMin)) * chartH;

    /* 1. Grid lines + Y-axis labels */
    ctx.fillStyle = 'rgba(255,255,255,0.26)';
    ctx.font      = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    for (let j = 0; j <= 6; j++) {
      const pv   = yMin + (yMax - yMin) * (j/6);
      const yPos = toY(pv);
      if (yPos < chartTop || yPos > chartBot) continue;
      ctx.strokeStyle = 'rgba(255,255,255,0.016)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0,yPos); ctx.lineTo(chartW,yPos); ctx.stroke();
      ctx.fillText(Math.round(pv).toLocaleString(), chartW+6, yPos+3);
    }

    /* 2. Y-axis panel */
    ctx.fillStyle = 'rgba(10,12,22,0.9)';
    ctx.fillRect(chartW, chartTop, AXIS_W, chartH + AXIS_H);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(chartW,chartTop); ctx.lineTo(chartW,chartBot+AXIS_H); ctx.stroke();

    /* 3. X-axis panel */
    ctx.fillStyle = 'rgba(10,12,22,0.9)';
    ctx.fillRect(0, chartBot, W, AXIS_H);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.moveTo(0,chartBot); ctx.lineTo(W,chartBot); ctx.stroke();

    /* 4. Volume bars */
    visible.forEach(({candle:c,x}) => {
      const bull = c.close >= c.open;
      const vh   = Math.min(c.volume * 90, 55);
      ctx.fillStyle = bull ? 'rgba(8,153,129,0.13)' : 'rgba(242,54,69,0.13)';
      ctx.fillRect(x, chartBot - vh, CW, vh);
    });

    /* 5. EMA lines */
    if (visible.length >= 2) {
      [['rgba(255,152,0,0.65)','ema20'],['rgba(0,188,212,0.65)','ema50']].forEach(([color,key]) => {
        ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.beginPath();
        visible.forEach(({candle:c,x},k) => {
          const y = toY(c[key]);
          k===0 ? ctx.moveTo(x+CW/2,y) : ctx.lineTo(x+CW/2,y);
        });
        ctx.stroke();
      });
    }

    /* 6. Candlesticks */
    visible.forEach(({candle:c,x}) => {
      const bull  = c.close >= c.open;
      const color = bull ? '#089981' : '#f23645';
      const bTop  = toY(Math.max(c.open, c.close));
      const bBot  = toY(Math.min(c.open, c.close));
      const bH    = Math.max(1.5, bBot - bTop);
      ctx.strokeStyle = color; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(x+CW/2, toY(c.high)); ctx.lineTo(x+CW/2, toY(c.low)); ctx.stroke();
      ctx.fillStyle = color; ctx.fillRect(x, bTop, CW, bH);
    });

    /* 7. Live price line + badge */
    {
      const fx    = ANCHOR_X - scrollPx;
      const fc    = forming;
      const bull  = fc.close >= fc.open;
      const color = bull ? '#089981' : '#f23645';
      const liveY = toY(fc.close);
      if (liveY >= chartTop && liveY <= chartBot) {
        ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(fx+CW, liveY); ctx.lineTo(chartW, liveY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(chartW+2, liveY-9, AXIS_W-4, 18, 3); ctx.fill(); }
        else { ctx.fillRect(chartW+2, liveY-9, AXIS_W-4, 18); }
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9.5px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(Math.round(fc.close).toLocaleString(), chartW+7, liveY+3.5);
      }
    }

    /* 8. Buy/Sell signals */
    visible.forEach(({candle:c,x}) => {
      if (!c.signal) return;
      ctx.font = 'bold 7.5px Space Grotesk, sans-serif'; ctx.textAlign = 'center';
      if (c.signal === 'BUY') {
        const yp = toY(c.low) + 14;
        if (yp < chartBot) {
          ctx.fillStyle = '#089981';
          ctx.beginPath(); ctx.moveTo(x+CW/2,yp-6); ctx.lineTo(x+CW/2-4,yp); ctx.lineTo(x+CW/2+4,yp); ctx.fill();
          ctx.fillText('BUY', x+CW/2, yp+9);
        }
      } else {
        const yp = toY(c.high) - 14;
        if (yp > chartTop) {
          ctx.fillStyle = '#f23645';
          ctx.beginPath(); ctx.moveTo(x+CW/2,yp+6); ctx.lineTo(x+CW/2-4,yp); ctx.lineTo(x+CW/2+4,yp); ctx.fill();
          ctx.fillText('SELL', x+CW/2, yp-4);
        }
      }
    });

    /* 9. X-axis time labels */
    ctx.fillStyle = 'rgba(255,255,255,0.27)'; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'center';
    visible.forEach(({x},vi) => {
      const age = visible.length - 1 - vi;
      if (age % 10 === 0) {
        const hour  = (9 + Math.floor(age/4)) % 24;
        ctx.fillText(`${hour.toString().padStart(2,'0')}:00`, x+CW/2, chartBot+17);
        ctx.strokeStyle = 'rgba(255,255,255,0.014)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x+CW/2,chartTop); ctx.lineTo(x+CW/2,chartBot); ctx.stroke();
      }
    });

    /* 10. Chart label */
    ctx.fillStyle = 'rgba(59,130,246,0.7)'; ctx.font = 'bold 11px Space Grotesk, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('â— BTC/USDT  Â·  PERPETUAL  Â·  1H', 16, chartTop+18);

    ctx.restore();

    /* Ticker bar (fixed, outside parallax) */
    const barH = 28;
    ctx.fillStyle = 'rgba(59,130,246,0.06)'; ctx.fillRect(0,0,W,barH);
    ctx.strokeStyle = 'rgba(59,130,246,0.12)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,barH); ctx.lineTo(W,barH); ctx.stroke();
    ctx.fillStyle = 'rgba(59,130,246,0.6)'; ctx.font = '500 11px Inter, monospace'; ctx.textAlign = 'left';
    ctx.fillText(tickerStr+'    Â·    '+tickerStr, tickerX, 18);
    const tw = ctx.measureText(tickerStr+'    Â·    ').width;
    tickerX -= 0.6;
    if (tickerX < -tw) tickerX = 0;

    requestAnimationFrame(draw);
  }

  draw();
}

// â”€â”€ PIN Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        <p class="pin-err" id="pin-err">Incorrect PIN â€” try again</p>

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

// â”€â”€ Dashboard Viewer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

window.handleCardClick = function(e, projectId) {
  // If it's a standard left-click without modifier keys, open in the premium local viewer
  if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
    e.preventDefault();
    openDashboard(projectId);
  }
};

// â”€â”€ Portal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function renderPortal() {
  const isDark = getTheme() === 'dark';

  const storedGuest = localStorage.getItem('vitti_guest');

  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = (user?.email || '').toLowerCase();
  const restrictedTo = RESTRICTED_USERS[userEmail];

  let allowedProjects;
  if (isMarketingTeam(storedGuest)) {
    allowedProjects = PROJECTS.filter(p => p.id === 'ideas-dashboard');
  } else if (restrictedTo) {
    allowedProjects = PROJECTS.filter(p => p.id === restrictedTo);
  } else {
    allowedProjects = PROJECTS;
  }

  const cards = allowedProjects.map((p, i) => `
    <a class="card" id="card-${p.id}" href="${p.url}" target="_blank" style="transition-delay: ${i * 100}ms"
         onclick="handleCardClick(event, '${p.id}')"
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
        ${p.badge ? `<span class="card-badge card-badge-${p.badge}">${p.badge.replace(/-/g, ' ').toUpperCase()}</span>` : ''}
      </div>
      <div class="card-body">
        <h2 class="card-title">${p.name}</h2>
        <p class="card-tagline">${p.tagline}</p>
      </div>
    </a>
  `).join('');

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
          <button class="btn-icon theme-btn" aria-label="Toggle Theme"></button>
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
          <span class="footer-copy">&copy; ${new Date().getFullYear()} <a href="https://vitti.capital" target="_blank" rel="noopener noreferrer" class="footer-link">VITTI Capital</a>. All rights reserved.</span>
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
        
        <div class="viewer-brand" style="display: flex; align-items: center; gap: 12px;">
          <button class="btn-icon theme-btn" aria-label="Toggle Theme"></button>
          <div class="viewer-divider"></div>
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
    localStorage.removeItem('vitti_guest');
    await supabase.auth.signOut();
    location.reload();
  });
  document.getElementById('viewer-back').addEventListener('click', closeDashboard);

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
  updateThemeIcon();

  window.openDashboard = openDashboard; // Make globally accessible for onclick

  requestAnimationFrame(() => {
    document.querySelectorAll('.card').forEach(c => c.classList.add('visible'));
  });

  startClock('live-clock-footer');
}

// â”€â”€ Boot â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
applyTheme(getTheme());
checkSessionExpiry();
initAuth();
