

// ── Crypto Ticker (CoinGecko) ─────────────────────────────
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
  if (!track) return;
  const coins = await fetchCryptos();
  if (!coins.length) return;
  const itemsHTML = coins.map(createTickerItem).join('');
  track.innerHTML = itemsHTML + itemsHTML;
}

async function initTicker() {
  await renderTicker();
  setInterval(renderTicker, 60_000);
}

initTicker();

// ============================================================
document.addEventListener('DOMContentLoaded', () => {

  // ── Hamburger Menu ────────────────────────────────────────
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeBtn   = document.getElementById('close-btn');
  const overlay    = document.getElementById('menu-overlay');

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
  // ONE observer, ONE declaration
  const fadeObserver = new IntersectionObserver(
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

  document.querySelectorAll('[data-fade]').forEach((el) => fadeObserver.observe(el));

  // ── Forgot Password (only runs if form exists) ────────────
  const forgotForm = document.getElementById('formState');
  const emailInput = document.getElementById('email');

  if (forgotForm && emailInput) {
    const API_BASE = 'http://localhost:5000/api';

    async function handleForgotPassword() {
      const email   = emailInput.value.trim();
      const btn     = document.getElementById('submitBtn');
      const spinner = document.getElementById('spinner');
      const btnText = document.getElementById('btnText');

      if (!email) { showForgotError('Please enter your email address.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showForgotError('Please enter a valid email address.'); return;
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
        showForgotError(err.message || 'Unable to reach the server. Please try again.');
        btn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = 'Send Reset Link';
      }
    }

    function showForgotError(msg) {
      document.getElementById('errorText').textContent = msg;
      document.getElementById('errorMsg').classList.add('show');
    }

    function showSentState(email) {
      document.getElementById('formState').classList.add('hidden');
      document.getElementById('backLink').classList.add('hidden');
      document.getElementById('sentEmail').textContent = email;
      document.getElementById('sentState').classList.remove('hidden');
    }

    emailInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleForgotPassword();
    });
  }

  // ── Reset Password (only runs if token field exists) ──────
  const newPasswordEl = document.getElementById('newPassword');

  if (newPasswordEl) {
    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      document.getElementById('formState').style.display    = 'none';
      document.getElementById('invalidState').style.display = 'block';
      document.getElementById('backLink').style.display     = 'none';
    }

    window.togglePw = function(id, btn) {
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
    };

    window.updateStrength = function(val) {
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
    };

    async function handleResetSubmit() {
      const newPassword     = document.getElementById('newPassword').value.trim();
      const confirmPassword = document.getElementById('confirmPassword').value.trim();

      document.getElementById('pwError').textContent      = '';
      document.getElementById('confirmError').textContent = '';
      document.getElementById('errorMsg').classList.remove('show');
      document.getElementById('newPassword').style.borderColor     = '';
      document.getElementById('confirmPassword').style.borderColor = '';

      let valid = true;
      if (newPassword.length < 8) {
        document.getElementById('pwError').textContent           = 'Password must be at least 8 characters.';
        document.getElementById('newPassword').style.borderColor = '#e05a5a';
        valid = false;
      }
      if (newPassword !== confirmPassword) {
        document.getElementById('confirmError').textContent           = 'Passwords do not match.';
        document.getElementById('confirmPassword').style.borderColor = '#e05a5a';
        valid = false;
      }
      if (!valid) return;

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
          if (res.status === 400) {
            document.getElementById('formState').style.display    = 'none';
            document.getElementById('invalidState').style.display = 'block';
            document.getElementById('backLink').style.display     = 'none';
            return;
          }
          throw new Error(data.error || 'Something went wrong. Please try again.');
        }

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

    document.addEventListener('keydown', e => { if (e.key === 'Enter') handleResetSubmit(); });
  }

  // ── Deposit Page (only runs if deposit container exists) ──
  const depositContainer = document.getElementById('deposit-container');

  if (depositContainer) {
    const authToken = localStorage.getItem('crow_token');
  if (!authToken) {
    // remember where they were headed so we can send them back after login
    sessionStorage.setItem('crow_redirect_after_login', window.location.href);
    window.location.href = '/index.html#login';
    return;
  }
   
    const WALLET_ADDRESS = 'bc1qchyl0k9muzzlnmcfcm8jdw3dj2ttdpsrem2p4k';
    document.getElementById('wallet-address').textContent = WALLET_ADDRESS;

    document.getElementById('copy-btn').addEventListener('click', () => {
      const addr = document.getElementById('wallet-address').textContent.trim();
      navigator.clipboard.writeText(addr).then(() => {
        document.getElementById('copy-text').textContent = 'Copied!';
        showDepositToast('Wallet address copied!');
        setTimeout(() => { document.getElementById('copy-text').textContent = 'Copy'; }, 2000);
      });
    });

   
document.getElementById('input-proof').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // Block oversized files
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    showDepositError('Screenshot must be under 5MB.');
    e.target.value = '';
    return;
  }
  
  // Block wrong file types (HTML accept is bypassable)
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    showDepositError('Only JPG, PNG, or WEBP images are allowed.');
    e.target.value = '';
    return;
  }
  
  // ... proceed with FileReader
   const reader = new FileReader();

  reader.onload = (event) => {
    document.getElementById('preview-img').src = event.target.result;
    document.getElementById('file-preview').classList.remove('hidden');
    document.getElementById('file-label').classList.add('hidden');
  };

  reader.onerror = () => {
    showDepositError('Could not read that file. Try a different image.');
    e.target.value = '';
  };

  reader.readAsDataURL(file);
});




    document.getElementById('remove-file').addEventListener('click', () => {
      document.getElementById('input-proof').value = '';
      document.getElementById('file-preview').classList.add('hidden');
      document.getElementById('file-label').classList.remove('hidden');
      document.getElementById('preview-img').src = '';
    });

    document.getElementById('submit-btn').addEventListener('click', async () => {
      const amount  = document.getElementById('input-amount').value.trim();
      const proof   = document.getElementById('input-proof').files[0];
      const errorEl = document.getElementById('form-error');

      errorEl.classList.add('hidden');

      if (!amount || isNaN(amount) || Number(amount) <= 0)
        return showDepositError('Please enter the amount you sent.');
   
      if (!proof)
        return showDepositError('Please upload a screenshot of your transaction.');

      const formData = new FormData();
      formData.append('package', planKey);
      formData.append('amount', amount);
      formData.append('proofImage', proof);

      const btn = document.getElementById('submit-btn');
      btn.disabled = true;
      btn.innerHTML = `<svg class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg> Submitting...`;

      try {
        // const authToken = localStorage.getItem('token');
          const authToken = localStorage.getItem('crow_token');
        const res = await fetch('http://localhost:5000/api/deposits/submit', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');

        document.getElementById('deposit-form').classList.add('hidden');
        document.getElementById('success-state').classList.remove('hidden');
        showDepositToast('Deposit submitted successfully!');

      }
      

       catch (err) {
  if (err.name === 'AbortError') return;  // User cancelled — no error
  
  if (err.name === 'TypeError' && err.message.includes('fetch')) {
    // Offline, DNS failure, CORS blocked
    showDepositError('Network error. Check your connection.');
  } else {
    // Server returned 4xx/5xx or validation error
    showDepositError(err.message);
  }
  
  btn.disabled = false;
  btn.innerHTML = originalBtnHTML;
}
    });

    function showDepositError(msg) {
      const el = document.getElementById('form-error');
      el.textContent = msg;
      el.classList.remove('hidden');
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

  
     let toastTimeoutId = null;  // Track active timeout

function showDepositToast(msg) {
  const toast = document.getElementById('toast');
  
  // Clear previous timeout to prevent overlap
  if (toastTimeoutId) clearTimeout(toastTimeoutId);
  
  document.getElementById('toast-msg').textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';  // Slide up
  
  toastTimeoutId = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';  // Reset!
    toastTimeoutId = null;
  }, 2500);
}
     

  }

}); // end DOMContentLoaded