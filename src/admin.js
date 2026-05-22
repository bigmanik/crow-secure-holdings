// src/admin.js
import {
  getToken,
  getStoredUser,
  logout,
  adminGetUsers,
  adminGetWithdrawals,
  adminDeposit,
  adminInjectPnL,
  adminResolveWithdrawal
} from './api.js'

// ── Guard: admin only ─────────────────────────────────────────
if (!getToken()) {
  window.location.href = '/index.html'
}
const storedUser = getStoredUser()
if (storedUser && storedUser.role !== 'admin') {
  window.location.href = '/dashboard.html'
}



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


// ── DOM refs ──────────────────────────────────────────────────
const panelUsers       = document.getElementById('panel-users')
const panelWithdrawals = document.getElementById('panel-withdrawals')
const tabUsers         = document.getElementById('tab-users')
const tabWithdrawals   = document.getElementById('tab-withdrawals')
const usersTbody       = document.getElementById('users-tbody')
const withdrawalsTbody = document.getElementById('withdrawals-tbody')
const userCount        = document.getElementById('user-count')
const pendingCount     = document.getElementById('pending-count')
const logoutBtn        = document.getElementById('logoutBtn')


// Modal refs
const modal        = document.getElementById('modal')
const modalTitle   = document.getElementById('modal-title')
const modalAmount  = document.getElementById('modal-amount')
const modalMode    = document.getElementById('modal-mode')
const modalNote    = document.getElementById('modal-note')
const pnlFields    = document.getElementById('pnl-fields')
const modalError   = document.getElementById('modal-error')
const modalCancel  = document.getElementById('modal-cancel')
const modalConfirm = document.getElementById('modal-confirm')

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function statusBadge(status) {
  const map = {
    pending:  'bg-yellow-900/40 text-yellow-400',
    approved: 'bg-green-900/40 text-green-400',
    rejected: 'bg-red-900/40 text-red-400',
  }
  const cls = map[status] || 'bg-gray-800 text-gray-400'
  return `<span class="text-xs font-medium px-2 py-0.5 rounded ${cls}">${status}</span>`
}

function roleBadge(role) {
  const cls = role === 'admin' ? 'text-purple-400' : 'text-gray-400'
  return `<span class="text-xs font-medium ${cls}">${role}</span>`
}

// ── Tab switching ─────────────────────────────────────────────
function setActiveTab(tab) {
  if (tab === 'users') {
    panelUsers.classList.remove('hidden')
    panelWithdrawals.classList.add('hidden')
    tabUsers.className = 'tab-btn text-white font-medium'
    tabWithdrawals.className = 'tab-btn text-gray-400 hover:text-white transition'
  } else {
    panelUsers.classList.add('hidden')
    panelWithdrawals.classList.remove('hidden')
    tabUsers.className = 'tab-btn text-gray-400 hover:text-white transition'
    tabWithdrawals.className = 'tab-btn text-white font-medium'
    loadWithdrawals()
  }
}

tabUsers.addEventListener('click', () => setActiveTab('users'))
tabWithdrawals.addEventListener('click', () => setActiveTab('withdrawals'))

// ── Modal ─────────────────────────────────────────────────────
let modalCallback = null

function openModal(title, showPnL = false) {
  modalTitle.textContent = title
  modalAmount.value = ''
  modalNote.value = ''
  modalMode.value = 'fixed'
  modalError.classList.add('hidden')
  pnlFields.classList.toggle('hidden', !showPnL)
  modal.classList.remove('hidden')
}

function closeModal() {
  modal.classList.add('hidden')
  modalCallback = null
}

modalCancel.addEventListener('click', closeModal)
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal() })

modalConfirm.addEventListener('click', async () => {
  const amount = modalAmount.value.trim()
  if (!amount || Number(amount) <= 0) {
    modalError.textContent = 'Enter a valid amount.'
    modalError.classList.remove('hidden')
    return
  }
  modalConfirm.disabled = true
  modalConfirm.textContent = 'Processing...'
  try {
    await modalCallback(amount)
    closeModal()
  } catch (err) {
    modalError.textContent = err.message || 'Action failed.'
    modalError.classList.remove('hidden')
  } finally {
    modalConfirm.disabled = false
    modalConfirm.textContent = 'Confirm'
  }
})

// ── Render users ──────────────────────────────────────────────
function renderUsers(users) {
  if (!users || users.length === 0) {
    usersTbody.innerHTML = '<tr><td colspan="5" class="px-5 py-6 text-gray-500">No users found.</td></tr>'
    return
  }
  userCount.textContent = `${users.length} user${users.length !== 1 ? 's' : ''}`

  usersTbody.innerHTML = users.map(u => {
    const balance = fmt(u.investment?.currentBalance ?? u.currentBalance ?? 0)
    return `
      <tr class="border-b border-gray-800 hover:bg-gray-800/40 transition">
        <td class="px-5 py-4">${u.firstName} ${u.lastName}</td>
        <td class="px-5 py-4 text-gray-400 font-mono text-xs">${u.email}</td>
        <td class="px-5 py-4 font-medium">${balance}</td>
        <td class="px-5 py-4">${roleBadge(u.role)}</td>
        <td class="px-5 py-4">
          <div class="flex gap-2">
            <button
              class="text-xs px-3 py-1.5 rounded-lg bg-blue-900/40 text-blue-400 hover:bg-blue-900/60 transition"
              data-action="deposit" data-id="${u._id}">
              Deposit
            </button>
            <button
              class="text-xs px-3 py-1.5 rounded-lg bg-green-900/40 text-green-400 hover:bg-green-900/60 transition"
              data-action="pnl" data-id="${u._id}">
              PnL
            </button>
          </div>
        </td>
      </tr>
    `
  }).join('')

  // Attach button listeners via delegation
  usersTbody.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const { action, id } = btn.dataset
      if (action === 'deposit') {
        openModal('Deposit Funds', false)
        modalCallback = (amount) => adminDeposit(id, amount).then(loadUsers)
      } else if (action === 'pnl') {
        openModal('Inject PnL', true)
        modalCallback = (amount) => {
          const mode = modalMode.value
          const note = modalNote.value.trim() || 'PnL credit'
          return adminInjectPnL(id, mode, amount, note).then(loadUsers)
        }
      }
    })
  })
}

// ── Render withdrawals ────────────────────────────────────────
function renderWithdrawals(withdrawals) {
  if (!withdrawals || withdrawals.length === 0) {
    withdrawalsTbody.innerHTML = '<tr><td colspan="5" class="px-5 py-6 text-gray-500">No withdrawal requests.</td></tr>'
    return
  }

  const pending = withdrawals.filter(w => w.status === 'pending').length
  pendingCount.textContent = pending > 0 ? `${pending} pending` : ''

  withdrawalsTbody.innerHTML = withdrawals.map(w => {
    const isPending = w.status === 'pending'
    const userName = w.user ? `${w.user.firstName} ${w.user.lastName}` : 'Unknown'
    const wallet = w.walletAddress || '—'
    const shortWallet = wallet.length > 16 ? `${wallet.slice(0, 8)}...${wallet.slice(-6)}` : wallet

    return `
      <tr class="border-b border-gray-800 hover:bg-gray-800/40 transition">
        <td class="px-5 py-4">${userName}</td>
        <td class="px-5 py-4 font-medium">${fmt(w.amount)}</td>
        <td class="px-5 py-4 font-mono text-xs text-gray-400" title="${wallet}">${shortWallet}</td>
        <td class="px-5 py-4">${statusBadge(w.status)}</td>
        <td class="px-5 py-4">
          <div class="flex gap-2">
            <button
              class="text-xs px-3 py-1.5 rounded-lg transition ${isPending ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'opacity-30 cursor-not-allowed bg-gray-800 text-gray-500'}"
              data-action="approve" data-id="${w._id}" ${!isPending ? 'disabled' : ''}>
              Approve
            </button>
            <button
              class="text-xs px-3 py-1.5 rounded-lg transition ${isPending ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' : 'opacity-30 cursor-not-allowed bg-gray-800 text-gray-500'}"
              data-action="reject" data-id="${w._id}" ${!isPending ? 'disabled' : ''}>
              Reject
            </button>
          </div>
        </td>
      </tr>
    `
  }).join('')

  withdrawalsTbody.querySelectorAll('button[data-action]:not([disabled])').forEach(btn => {
    btn.addEventListener('click', async () => {
      const { action, id } = btn.dataset
      btn.disabled = true
      btn.textContent = '...'
      try {
        await adminResolveWithdrawal(id, action)
        loadWithdrawals()
      } catch (err) {
        alert(err.message || 'Action failed')
        btn.disabled = false
        btn.textContent = action === 'approve' ? 'Approve' : 'Reject'
      }
    })
  })
}

// ── Loaders ───────────────────────────────────────────────────
async function loadUsers() {
  try {
    const res = await adminGetUsers()
    const users = res.data?.users || res.users || res
    renderUsers(Array.isArray(users) ? users : [])
  } catch (err) {
    usersTbody.innerHTML = `<tr><td colspan="5" class="px-5 py-6 text-red-400">${err.message}</td></tr>`
  }
}

async function loadWithdrawals() {
  try {
    const res = await adminGetWithdrawals()
    const withdrawals = res.data?.withdrawals || res.withdrawals || res
    renderWithdrawals(Array.isArray(withdrawals) ? withdrawals : [])
  } catch (err) {
    withdrawalsTbody.innerHTML = `<tr><td colspan="5" class="px-5 py-6 text-red-400">${err.message}</td></tr>`
  }
}

// ── Logout ────────────────────────────────────────────────────

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout)
}

const user = JSON.parse(localStorage.getItem('crow_user'));
if (!user) window.location.href = '/account.html';
if (user.role !== 'admin') window.location.href = '/dashboard.html';

// ── Init ──────────────────────────────────────────────────────
loadUsers()