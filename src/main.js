
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


    //deposit 
    
      // ── Package config ────────────────────────────────────────
      const PACKAGES = {
        bronze: {
          label: 'Bronze',
          name: 'Bronze Package',
          duration: '15 Days',
          profit: '10% – 15%',
          min: '$5,000',
          minRaw: 5000,
          features: [
            'Weekly market summary report',
            'Email support from investment team',
            'Basic portfolio performance report'
          ]
        },
        silver: {
          label: 'Silver',
          name: 'Silver Package',
          duration: '21 Days',
          profit: '20% – 25%',
          min: '$12,500',
          minRaw: 12500,
          features: [
            'Bi-weekly market analysis reports',
            'Priority email & chat support',
            'Bi-weekly portfolio performance report'
          ]
        },
        diamond: {
          label: 'Diamond',
          name: 'Diamond Package',
          duration: '30 Days',
          profit: '30% – 35%',
          min: '$25,000',
          minRaw: 25000,
          features: [
            'Personalized market analysis reports',
            'One-on-one consultation with investment expert',
            'Monthly portfolio performance report'
          ]
        }
      };

      // ── Read ?plan= from URL ──────────────────────────────────
      const params = new URLSearchParams(window.location.search);
      const planKey = params.get('plan')?.toLowerCase();
      const plan = PACKAGES[planKey];

      // Redirect back if invalid plan
      if (!plan) {
        window.location.href = '/index.html#investNow';
      }

      // ── Apply theme class to container ────────────────────────
      const container = document.getElementById('deposit-container');
      container.classList.add(`theme-${planKey}`);

      // Also apply to step indicators
      document.querySelectorAll('.step-num').forEach(el => el.classList.add(`theme-${planKey}`));

      // ── Populate package card ─────────────────────────────────
      document.getElementById('page-title').textContent = `${plan.name} — Deposit`;
      document.getElementById('breadcrumb-plan').textContent = plan.name;
      document.getElementById('pkg-badge').textContent = plan.label;
      document.getElementById('pkg-name').textContent = plan.name;
      document.getElementById('pkg-duration').textContent = plan.duration;
      document.getElementById('pkg-profit').textContent = plan.profit;
      document.getElementById('pkg-min').textContent = plan.min;

      const featuresList = document.getElementById('pkg-features');
      plan.features.forEach(f => {
        featuresList.innerHTML += `
          <li class="flex items-start gap-2.5">
            <span class="mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded-full pkg-dotring border flex items-center justify-center">
              <span class="w-1.5 h-1.5 rounded-full pkg-dot"></span>
            </span>
            <span class="leading-relaxed">${f}</span>
          </li>`;
      });

      // ── Wallet address (pulled from backend env via API) ──────
      // We fetch it so the address never lives in the HTML
      const WALLET_ADDRESS = 'YOUR_USDT_TRC20_ADDRESS_HERE'; // fallback
      // TODO: replace with fetch('/api/deposits/wallet') once you add that route
      document.getElementById('wallet-address').textContent = WALLET_ADDRESS;

      // ── Copy wallet address ───────────────────────────────────
      document.getElementById('copy-btn').addEventListener('click', () => {
        const addr = document.getElementById('wallet-address').textContent.trim();
        navigator.clipboard.writeText(addr).then(() => {
          document.getElementById('copy-text').textContent = 'Copied!';
          showToast('Wallet address copied!');
          setTimeout(() => {
            document.getElementById('copy-text').textContent = 'Copy';
          }, 2000);
        });
      });

      // ── File preview ──────────────────────────────────────────
      document.getElementById('input-proof').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('preview-img').src = ev.target.result;
          document.getElementById('file-preview').classList.remove('hidden');
          document.getElementById('file-label').classList.add('hidden');
        };
        reader.readAsDataURL(file);
      });

      document.getElementById('remove-file').addEventListener('click', () => {
        document.getElementById('input-proof').value = '';
        document.getElementById('file-preview').classList.add('hidden');
        document.getElementById('file-label').classList.remove('hidden');
        document.getElementById('preview-img').src = '';
      });

      // ── Form submission ───────────────────────────────────────
      document.getElementById('submit-btn').addEventListener('click', async () => {
        const amount  = document.getElementById('input-amount').value.trim();
        const txHash  = document.getElementById('input-txhash').value.trim();
        const proof   = document.getElementById('input-proof').files[0];
        const errorEl = document.getElementById('form-error');

        // Client-side validation
        errorEl.classList.add('hidden');

        if (!amount || isNaN(amount) || Number(amount) <= 0) {
          return showError('Please enter the amount you sent.');
        }
        if (Number(amount) < plan.minRaw) {
          return showError(`Minimum deposit for the ${plan.name} is ${plan.min}.`);
        }
        if (!txHash) {
          return showError('Please paste your transaction hash.');
        }
        if (!proof) {
          return showError('Please upload a screenshot of your transaction.');
        }

        // Build FormData
        const formData = new FormData();
        formData.append('package', planKey);
        formData.append('amount', amount);
        formData.append('txHash', txHash);
        formData.append('proofImage', proof);

        // Disable button + show loading
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.innerHTML = `<svg class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg> Submitting...`;

        try {
          const token = localStorage.getItem('token'); // your JWT token key
          const res = await fetch('http://localhost:5000/api/deposits/submit', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || 'Something went wrong. Please try again.');
          }

          // Show success state
          document.getElementById('deposit-form').classList.add('hidden');
          document.getElementById('success-state').classList.remove('hidden');
          showToast('Deposit submitted successfully!');

        } catch (err) {
          showError(err.message);
          btn.disabled = false;
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Submit Deposit Proof`;
        }
      });

      // ── Helpers ───────────────────────────────────────────────
      function showError(msg) {
        const el = document.getElementById('form-error');
        el.textContent = msg;
        el.classList.remove('hidden');
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      function showToast(msg) {
        const toast = document.getElementById('toast');
        document.getElementById('toast-msg').textContent = msg;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        setTimeout(() => {
          toast.style.opacity = '0';
        }, 2500);
      }

      // ── Mobile nav (same logic as index.html) ─────────────────
      const hamburger = document.getElementById('hamburger');
      const mobileMenu = document.getElementById('mobile-menu');
      const overlay = document.getElementById('menu-overlay');
      const closeBtn = document.getElementById('close-btn');

      function openMenu() {
        mobileMenu.classList.remove('translate-x-full', 'opacity-0');
        overlay.classList.remove('opacity-0', 'pointer-events-none');
      }
      function closeMenu() {
        mobileMenu.classList.add('translate-x-full', 'opacity-0');
        overlay.classList.add('opacity-0', 'pointer-events-none');
      }

      hamburger?.addEventListener('click', openMenu);
      closeBtn?.addEventListener('click', closeMenu);
      overlay?.addEventListener('click', closeMenu);
    
  