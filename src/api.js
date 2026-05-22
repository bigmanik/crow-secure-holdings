// src/api.js
const BASE_URL = 'http://localhost:5000/api'

// ── Token helpers ─────────────────────────────────────────────
export function getToken() {
 return localStorage.getItem('crow_token') 
}

export function getStoredUser() {
 const u = localStorage.getItem('crow_user')
  return u ? JSON.parse(u) : null
}

export function logout() {
  localStorage.removeItem('crow_token')
  localStorage.removeItem('crow_user')
  window.location.href = '/account.html'
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  }
}

// ── Generic error handler ─────────────────────────────────────
async function handleResponse(res) {
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

// ── Auth ──────────────────────────────────────────────────────
export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  return handleResponse(res)
  // returns: { status, token, data: { user } }
}

// ── User ──────────────────────────────────────────────────────
export async function getMe() {
  const res = await fetch(`${BASE_URL}/user/me`, { headers: authHeaders() })
  return handleResponse(res)
}

export async function getTransactions() {
  const res = await fetch(`${BASE_URL}/user/transactions`, { headers: authHeaders() })
  return handleResponse(res)
}

export async function getMyWithdrawals() {
  const res = await fetch(`${BASE_URL}/user/withdrawals`, { headers: authHeaders() })
  return handleResponse(res)
}

export async function requestWithdrawal(amount, walletAddress) {
  const res = await fetch(`${BASE_URL}/user/withdraw`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ amount, walletAddress })
  })
  return handleResponse(res)
}

// ── Admin ─────────────────────────────────────────────────────
export async function adminGetUsers() {
  const res = await fetch(`${BASE_URL}/admin/users`, { headers: authHeaders() })
  return handleResponse(res)
}

export async function adminGetWithdrawals() {
  const res = await fetch(`${BASE_URL}/admin/withdrawals`, { headers: authHeaders() })
  return handleResponse(res)
}

export async function adminDeposit(userId, amount) {
  const res = await fetch(`${BASE_URL}/admin/users/${userId}/deposit`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ amount: Number(amount) })
  })
  return handleResponse(res)
}

export async function adminInjectPnL(userId, mode, value, note) {
  const res = await fetch(`${BASE_URL}/admin/users/${userId}/pnl`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ mode, value: Number(value), note, type: 'credit' })
  })
  return handleResponse(res)
}

export async function adminResolveWithdrawal(withdrawalId, action) {
  // action: 'approve' | 'reject'
  const res = await fetch(`${BASE_URL}/admin/withdrawals/${withdrawalId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ action })
  })
  return handleResponse(res)
}

