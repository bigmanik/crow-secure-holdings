
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