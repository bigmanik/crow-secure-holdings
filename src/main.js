
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── Hamburger Menu ────────────────────────────────────────
  const hamburger   = document.getElementById('hamburger');
  const mobileMenu  = document.getElementById('mobile-menu');
  const closeBtn    = document.getElementById('close-btn');
  const overlay     = document.getElementById('menu-overlay');

  // Guard: only run if these elements exist on the page
  if (hamburger && mobileMenu && closeBtn && overlay) {
    function openMenu() {
      mobileMenu.classList.remove('translate-x-full', 'opacity-0');
      overlay.classList.remove('opacity-0', 'pointer-events-none');
      hamburger.classList.add('hidden');
    }

    function closeMenu() {
      mobileMenu.classList.add('translate-x-full', 'opacity-0');
      overlay.classList.add('opacity-0', 'pointer-events-none');
      hamburger.classList.remove('hidden');
    }

    hamburger.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);
  }

  // ── Scroll Fade-In Observer ───────────────────────────────
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('opacity-0', 'translate-y-10');
          entry.target.classList.add('opacity-100', 'translate-y-0');
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll('[data-fade]').forEach((el) => observer.observe(el));

});

// ── Crypto Ticker (CoinGecko) ─────────────────────────────
// Runs outside DOMContentLoaded because it only touches #ticker-track
// which is on the homepage. Guard added so it fails silently on other pages.

const COIN_API_URL =
  'https://api.coingecko.com/api/v3/coins/markets' +
  '?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false';

async function fetchCryptos() {
  try {
    const res = await fetch(COIN_API_URL);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch crypto data:', err);
    return [];
  }
}

function createTickerItem(coin) {
  const isPositive  = coin.price_change_percentage_24h >= 0;
  const changeColor = isPositive ? 'text-emerald-400' : 'text-red-400';
  const arrow       = isPositive ? '▲' : '▼';
  const change      = Math.abs(coin.price_change_percentage_24h).toFixed(2);

  return `
    <div class="flex items-center gap-2 px-4 py-1 rounded-full bg-gray-800 border border-gray-700">
      <img src="${coin.image}" alt="${coin.name}" class="w-5 h-5 rounded-full" />
      <span class="text-white font-semibold text-sm uppercase tracking-wider">${coin.symbol}</span>
      <span class="text-gray-200 text-sm">$${coin.current_price.toLocaleString()}</span>
      <span class="${changeColor} text-xs font-medium">${arrow} ${change}%</span>
    </div>
  `;
}

async function renderTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return; // not on homepage, do nothing

  const coins = await fetchCryptos();
  if (!coins.length) return;

  const itemsHTML = coins.map(createTickerItem).join('');
  track.innerHTML = itemsHTML + itemsHTML; // doubled for seamless loop
}

async function initTicker() {
  await renderTicker();
  setInterval(renderTicker, 60_000); // refresh every 60 seconds
}

initTicker();

 // Intersection Observer for scroll animations about
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  document.querySelectorAll('[class*=\"translate-y-[30px]\"]').forEach(el => {
    observer.observe(el);
  });

  // forgot-password

  const API_BASE = 'http://localhost:5000/api';
 
    async function handleForgotPassword() {
      const email   = document.getElementById('email').value.trim();
      const btn     = document.getElementById('submitBtn');
      const spinner = document.getElementById('spinner');
      const btnText = document.getElementById('btnText');
 
      if (!email) { showError('Please enter your email address.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Please enter a valid email address.'); return;
      }
 
      btn.disabled = true;
      spinner.classList.remove('hidden');
      btnText.textContent = 'Sending…';
      document.getElementById('errorMsg').classList.remove('show');
 
      try {
        const res  = await fetch(`${API_BASE}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || 'Something went wrong.');
        showSentState(email);
      } catch (err) {
        showError(err.message || 'Unable to reach the server. Please try again.');
        btn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = 'Send Reset Link';
      }
    }
 
    function showError(msg) {
      document.getElementById('errorText').textContent = msg;
      document.getElementById('errorMsg').classList.add('show');
    }
 
    function showSentState(email) {
      document.getElementById('formState').classList.add('hidden');
      document.getElementById('backLink').classList.add('hidden');
      document.getElementById('sentEmail').textContent = email;
      document.getElementById('sentState').classList.remove('hidden');
    }
 
    document.getElementById('email').addEventListener('keydown', e => {
      if (e.key === 'Enter') handleForgotPassword();
    });

    //reset-password 
  
    // ── 1. Read token from URL ────────────────────────────────────
    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      document.getElementById('formState').style.display    = 'none';
      document.getElementById('invalidState').style.display = 'block';
      document.getElementById('backLink').style.display     = 'none';
    }

    // ── 2. Toggle password visibility ────────────────────────────
    function togglePw(id, btn) {
      const input  = document.getElementById(id);
      const isText = input.type === 'text';
      input.type   = isText ? 'password' : 'text';
      btn.innerHTML = isText
        ? `<svg class="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
             <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
             <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
           </svg>`
        : `<svg class="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
             <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.12-3.73M6.53 6.53A9.97 9.97 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 01-4.512 5.393M3 3l18 18"/>
           </svg>`;
    }

    // ── 3. Password strength meter ────────────────────────────────
    function updateStrength(val) {
      let score = 0;
      if (val.length >= 8)                         score++;
      if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
      if (/\d/.test(val))                          score++;
      if (/[^A-Za-z0-9]/.test(val))               score++;

      const colors = ['rgba(245,242,236,.08)', '#e05a5a', '#e09a30', '#e09a30', '#4caf7d'];
      const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

      for (let i = 1; i <= 4; i++) {
        document.getElementById('s' + i).style.background =
          i <= score ? colors[score] : 'rgba(245,242,236,.08)';
      }
      const lbl       = document.getElementById('strengthLabel');
      lbl.textContent = val.length ? labels[score] : '';
      lbl.style.color = val.length ? colors[score] : 'rgba(245,242,236,.35)';
    }

    // ── 4. Submit ─────────────────────────────────────────────────
    async function handleSubmit() {
      const newPassword     = document.getElementById('newPassword').value.trim();
      const confirmPassword = document.getElementById('confirmPassword').value.trim();

      // Clear previous errors
      document.getElementById('pwError').textContent      = '';
      document.getElementById('confirmError').textContent = '';
      document.getElementById('errorMsg').classList.remove('show');
      document.getElementById('newPassword').style.borderColor     = '';
      document.getElementById('confirmPassword').style.borderColor = '';

      // Validate
      let valid = true;
      if (newPassword.length < 8) {
        document.getElementById('pwError').textContent            = 'Password must be at least 8 characters.';
        document.getElementById('newPassword').style.borderColor  = '#e05a5a';
        valid = false;
      }
      if (newPassword !== confirmPassword) {
        document.getElementById('confirmError').textContent           = 'Passwords do not match.';
        document.getElementById('confirmPassword').style.borderColor  = '#e05a5a';
        valid = false;
      }
      if (!valid) return;

      // Loading state
      const btn     = document.getElementById('submitBtn');
      const spinner = document.getElementById('spinner');
      const btnText = document.getElementById('btnText');
      btn.disabled          = true;
      spinner.classList.remove('hidden');
      btnText.style.opacity = '0';

      try {
        const res  = await fetch('/api/auth/reset-password', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token, newPassword }),
        });
        const data = await res.json();

        if (!res.ok) {
          // Token expired or already used
          if (res.status === 400) {
            document.getElementById('formState').style.display    = 'none';
            document.getElementById('invalidState').style.display = 'block';
            document.getElementById('backLink').style.display     = 'none';
            return;
          }
          throw new Error(data.error || 'Something went wrong. Please try again.');
        }

        // Success — show success state, hide back link
        document.getElementById('formState').style.display    = 'none';
        document.getElementById('successState').style.display = 'block';
        document.getElementById('backLink').style.display     = 'none';

      } catch (err) {
        document.getElementById('errorText').textContent = err.message;
        document.getElementById('errorMsg').classList.add('show');
      } finally {
        btn.disabled          = false;
        spinner.classList.add('hidden');
        btnText.style.opacity = '1';
      }
    }

    document.addEventListener('keydown', e => { if (e.key === 'Enter') handleSubmit(); });
  