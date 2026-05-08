
// ============================================================

const API_BASE = 'http://localhost:5000/api/auth';

// ── Helper Functions ──────────────────────────────────────────


function setError(elId, message) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
}

function clearError(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

// ============================================================
//  Everything below runs after the DOM is fully loaded
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── Hamburger Menu ──────────────────────────────────────────
  const hamburger   = document.getElementById('hamburger');
  const mobileMenu  = document.getElementById('mobile-menu');
  const closeBtn    = document.getElementById('close-btn');
  const overlay     = document.getElementById('menu-overlay');

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

  // ── Tab Switching ───────────────────────────────────────────
  let current = 'login';

  function switchTab(tab) {
    if (tab === current) return;

    const loginView   = document.getElementById('loginView');
    const signupView  = document.getElementById('signupView');
    const tabTrack    = document.getElementById('tabTrack');
    const tabLogin    = document.getElementById('tabLogin');
    const tabSignup   = document.getElementById('tabSignup');
    const titleLogin  = document.getElementById('titleLogin');
    const titleSignup = document.getElementById('titleSignup');
    const wrapper     = document.getElementById('fieldsWrapper');

    // Safety: if any element is missing, bail out
    if (!loginView || !signupView || !wrapper) return;

    const outView   = tab === 'signup' ? loginView  : signupView;
    const inView    = tab === 'signup' ? signupView : loginView;
    const exitClass = tab === 'signup' ? 'slide-out-left' : 'slide-out-right';

    wrapper.style.height = outView.offsetHeight + 'px';
    outView.classList.add(exitClass);

    inView.style.display    = 'flex';
    inView.classList.remove('slide-out-left', 'slide-out-right');
    inView.style.opacity    = '0';
    inView.style.transform  = tab === 'signup' ? 'translateX(24px)' : 'translateX(-24px)';
    inView.style.transition = 'none';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        inView.style.transition = 'opacity 0.3s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1)';
        inView.style.opacity    = '1';
        inView.style.transform  = 'translateX(0)';

        setTimeout(() => {
          wrapper.style.height = inView.offsetHeight + 'px';
          setTimeout(() => { wrapper.style.height = 'auto'; }, 360);
        }, 30);
      });
    });

    setTimeout(() => {
      outView.style.display = 'none';
      outView.classList.remove(exitClass);
    }, 350);

    if (tabTrack)   tabTrack.classList.toggle('to-signup', tab === 'signup');
    if (tabLogin)   tabLogin.style.color  = tab === 'login'  ? '#E8C97A' : 'rgba(255,255,255,0.45)';
    if (tabSignup)  tabSignup.style.color = tab === 'signup' ? '#E8C97A' : 'rgba(255,255,255,0.45)';
    if (titleLogin) titleLogin.classList.toggle('hidden',  tab !== 'login');
    if (titleSignup) titleSignup.classList.toggle('hidden', tab !== 'signup');

    current = tab;
  }

  document.getElementById('tabLogin')?.addEventListener('click',  () => switchTab('login'));
  document.getElementById('tabSignup')?.addEventListener('click', () => switchTab('signup'));

  // ── LOGIN ───────────────────────────────────────────────────
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      clearError('loginError');

      const email    = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        return setError('loginError', 'Please fill in all fields.');
      }

      const btn = e.currentTarget;
      btn.textContent = 'Signing in…';
      btn.disabled = true;

      try {
        const response = await fetch(`${API_BASE}/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError('loginError', data.message || 'Login failed. Try again.');
        } else {
          // ✅ Store token + user, then redirect
          localStorage.setItem('crow_token', data.token);
          localStorage.setItem('crow_user',  JSON.stringify(data.data.user));
          window.location.href = '/dashboard.html';
        }

      } catch (err) {
        setError('loginError', 'Cannot reach server. Is the backend running?');
        console.error('Login fetch error:', err);
      } finally {
        btn.textContent = 'Sign In';
        btn.disabled = false;
      }
    });
  }

  // ── SIGNUP ──────────────────────────────────────────────────
  const signupBtn = document.getElementById('signupBtn');
  if (signupBtn) {
    signupBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      clearError('signupError');

      const successEl = document.getElementById('signupSuccess');
      if (successEl) successEl.classList.add('hidden');

      const firstName = document.getElementById('signupFirstName').value.trim();
      const lastName  = document.getElementById('signupLastName').value.trim();
      const email     = document.getElementById('signupEmail').value.trim();
      const password  = document.getElementById('signupPassword').value;

      // Frontend validation before even hitting the server
      if (!firstName || !lastName || !email || !password) {
        return setError('signupError', 'Please fill in all fields.');
      }
      if (password.length < 8) {
        return setError('signupError', 'Password must be at least 8 characters.');
      }

      const btn = e.currentTarget;
      btn.textContent = 'Creating account…';
      btn.disabled = true;

      try {
        const response = await fetch(`${API_BASE}/signup`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ firstName, lastName, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError('signupError', data.message || 'Registration failed. Try again.');
        } else {
          // ✅ Store token + user
          localStorage.setItem('crow_token', data.token);
          localStorage.setItem('crow_user',  JSON.stringify(data.data.user));

          if (successEl) {
            successEl.textContent = 'Account created! Redirecting…';
            successEl.classList.remove('hidden');
          }

          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 1500);
        }

      } catch (err) {
        setError('signupError', 'Cannot reach server. Is the backend running?');
        console.error('Signup fetch error:', err);
      } finally {
        btn.textContent = 'Create Account';
        btn.disabled = false;
      }
    });
  }

});

// Role-based redirect
if (data.data.user.role === 'admin') {
  window.location.href = '/admin.html'
} else {
  window.location.href = '/dashboard.html'
}