// src/dashboard.js
import {
  getToken,
  getStoredUser,
  logout,
  getMe,
  getTransactions,
  requestWithdrawal
} from './api.js'


// At the top of dashboard.js or any protected page script


// ── Auth Guard ────────────────────────────────────────────────
// ES modules are deferred — DOM is ready, no DOMContentLoaded needed
if (!getToken()) {
  window.location.href = '/account.html'
}

const currentUser = getStoredUser()
if (!currentUser) {
  window.location.href = '/account.html'
}

// ── DOM refs ──────────────────────────────────────────────────
const userName      = document.getElementById('user-name')
const statBalance   = document.getElementById('stat-balance')
const statPnl       = document.getElementById('stat-pnl')
const statWithdrawn = document.getElementById('stat-withdrawn')
const txList        = document.getElementById('tx-list')
const withdrawBtn   = document.getElementById('withdraw-btn')
const withdrawMsg   = document.getElementById('withdraw-msg')
const logoutBtns    = document.querySelectorAll('.logoutBtn')      // your existing id

// ── Hamburger menu (your existing logic, preserved) ───────────
const hamburger  = document.getElementById('hamburger')
const mobileMenu = document.getElementById('mobile-menu')
const closeBtn   = document.getElementById('close-btn')
const overlay    = document.getElementById('menu-overlay')

if (hamburger && mobileMenu && closeBtn && overlay) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.remove('translate-x-full', 'opacity-0')
    overlay.classList.remove('opacity-0', 'pointer-events-none')
    hamburger.classList.add('hidden')
  })
  closeBtn.addEventListener('click', () => {
    mobileMenu.classList.add('translate-x-full', 'opacity-0')
    overlay.classList.add('opacity-0', 'pointer-events-none')
    hamburger.classList.remove('hidden')
  })
  overlay.addEventListener('click', () => {
    mobileMenu.classList.add('translate-x-full', 'opacity-0')
    overlay.classList.add('opacity-0', 'pointer-events-none')
    hamburger.classList.remove('hidden')
  })
}

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function showMsg(msg, isError = false) {
  withdrawMsg.textContent = msg
  withdrawMsg.className = `mt-3 text-sm ${isError ? 'text-red-400' : 'text-green-400'}`
  withdrawMsg.classList.remove('hidden')
  setTimeout(() => withdrawMsg.classList.add('hidden'), 4000)
}

// ── Render transactions ───────────────────────────────────────
function renderTransactions(txs) {
  if (!txs || txs.length === 0) {
    txList.innerHTML = '<p class="text-gray-500 py-4 text-sm">No transactions yet.</p>'
    return
  }
  txList.innerHTML = txs.map(tx => {
    const isCredit = tx.type === 'deposit' || tx.type === 'pnl_credit'
    const amtClass = isCredit ? 'text-green-400' : 'text-red-400'
    const amtSign  = isCredit ? '+' : '-'
    const label    = tx.note || tx.type || 'Transaction'
    return `
      <div class="flex items-center justify-between py-3">
        <div>
          <p class="text-white text-sm capitalize">${label}</p>
          <p class="text-gray-500 text-xs mt-0.5">${timeAgo(tx.createdAt)}</p>
        </div>
        <span class="font-semibold text-sm ${amtClass}">${amtSign}${fmt(tx.amount)}</span>
      </div>
    `
  }).join('')
}

// ── Load dashboard data ───────────────────────────────────────
async function loadDashboard() {
  try {
    const [meRes, txRes] = await Promise.all([getMe(), getTransactions()])

    const user = meRes.data?.user || meRes.user || meRes
    const txs  = txRes.data?.transactions || txRes.transactions || txRes

    // Greet by name — works from stored user even before API responds
    if (userName) userName.textContent = `${currentUser.firstName} ${currentUser.lastName}`

    // Investment stats
    const investment = meRes.data?.investment || meRes.investment || {}
    if (statBalance)   statBalance.textContent   = fmt(investment.currentBalance   ?? user.currentBalance)
    if (statPnl)       statPnl.textContent       = fmt(investment.totalPnL         ?? user.totalPnL)
    if (statWithdrawn) statWithdrawn.textContent = fmt(investment.totalWithdrawn   ?? user.totalWithdrawn)

    renderTransactions(Array.isArray(txs) ? txs : [])

  } catch (err) {
    console.error('Dashboard load error:', err)
    if (err.message?.includes('401') || err.message?.toLowerCase().includes('unauthorized')) {
      logout()
    }
  }
}

// ── Withdrawal form ───────────────────────────────────────────
if (withdrawBtn) {
  withdrawBtn.addEventListener('click', async () => {
    const amount = document.getElementById('withdraw-amount').value.trim()
    const wallet = document.getElementById('withdraw-wallet').value.trim()

    if (!amount || !wallet) return showMsg('Please fill in both fields.', true)
    if (Number(amount) <= 0) return showMsg('Amount must be greater than 0.', true)

    withdrawBtn.disabled = true
    withdrawBtn.textContent = 'Submitting...'

    try {
      await requestWithdrawal(Number(amount), wallet)
      showMsg('Withdrawal request submitted. Pending admin review.')
      document.getElementById('withdraw-amount').value = ''
      document.getElementById('withdraw-wallet').value = ''
      loadDashboard()
    } catch (err) {
      showMsg(err.message || 'Submission failed.', true)
    } finally {
      withdrawBtn.disabled = false
      withdrawBtn.textContent = 'Submit'
    }
  })
}

//logout


logoutBtns.forEach(btn => {
  btn.addEventListener('click', logout);
});

// Auth guard
const user = JSON.parse(localStorage.getItem('crow_user'));
if (!user) window.location.href = '/account.html';
if (user && user.role === 'admin') window.location.href = '/admin.html';


// ── Init ──────────────────────────────────────────────────────
loadDashboard()