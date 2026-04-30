// ============================================================
//  dashboard.js  — dashboard.html
//  First thing it does: kick out unauthenticated users
// ============================================================

// ── Auth Guard ────────────────────────────────────────────────
// If no token exists, send user back to login immediately.
// This runs before DOMContentLoaded so the page never even renders for strangers.
const token = localStorage.getItem('crow_token');
const storedUser = localStorage.getItem('crow_user');

if (!token || !storedUser) {
  window.location.href = '/account.html';
}

// ── Parse stored user safely ──────────────────────────────────
let currentUser = null;
try {
  currentUser = JSON.parse(storedUser);
} catch {
  // Corrupted data — log out
  localStorage.removeItem('crow_token');
  localStorage.removeItem('crow_user');
  window.location.href = '/account.html';
}

// ── DOM Ready ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Example: greet the user by name
  // Add an element like <span id="user-name"></span> in your dashboard HTML
  const nameEl = document.getElementById('user-name');
  if (nameEl && currentUser) {
    nameEl.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
  }

  // ── Logout Button ───────────────────────────────────────────
  // Add <button id="logoutBtn">Log out</button> anywhere in dashboard.html
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('crow_token');
      localStorage.removeItem('crow_user');
      window.location.href = '/account.html';
    });
  }

  // ── Hamburger (if dashboard has one) ─────────────────────────
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeBtn   = document.getElementById('close-btn');
  const overlay    = document.getElementById('menu-overlay');

  if (hamburger && mobileMenu && closeBtn && overlay) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.remove('translate-x-full', 'opacity-0');
      overlay.classList.remove('opacity-0', 'pointer-events-none');
      hamburger.classList.add('hidden');
    });
    closeBtn.addEventListener('click', () => {
      mobileMenu.classList.add('translate-x-full', 'opacity-0');
      overlay.classList.add('opacity-0', 'pointer-events-none');
      hamburger.classList.remove('hidden');
    });
    overlay.addEventListener('click', () => {
      mobileMenu.classList.add('translate-x-full', 'opacity-0');
      overlay.classList.add('opacity-0', 'pointer-events-none');
      hamburger.classList.remove('hidden');
    });
  }

  // ── Future: fetch user portfolio data from backend ───────────
  // When you're ready to show real data, use this pattern:
  //
  // async function loadPortfolio() {
  //   const response = await fetch('http://localhost:5000/api/portfolio', {
  //     headers: { Authorization: `Bearer ${token}` }
  //   });
  //   const data = await response.json();
  //   // render data to the page
  // }
  // loadPortfolio();

});