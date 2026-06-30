const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('fundflow_token')
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('fundflow_token', token)
  } else {
    localStorage.removeItem('fundflow_token')
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem('fundflow_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setUser(user) {
  if (user) {
    localStorage.setItem('fundflow_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('fundflow_user')
  }
}

export function isAuthenticated() {
  return !!getToken()
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 204) return null

  const data = await res.json()

  if (!res.ok) {
    const message = data.detail || `Erro ${res.status}`
    if (res.status === 401) {
      setToken(null)
      setUser(null)
    }
    throw new Error(message)
  }

  return data
}

export function register(email, name, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, password }),
  })
}

export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function fetchTransactions(month) {
  let path = '/transactions/?per_page=200'
  if (month) path += `&month=${month}`
  return request(path)
}

export function createTransaction(data) {
  return request('/transactions/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteTransaction(id) {
  return request(`/transactions/${id}`, {
    method: 'DELETE',
  })
}

export function deleteAllTransactions() {
  return request('/transactions/all', {
    method: 'DELETE',
  })
}

export function bulkImport(transactions, accountId) {
  return request('/transactions/bulk', {
    method: 'POST',
    body: JSON.stringify({
      transactions: transactions.map(tx => ({
        account_id: accountId,
        description: tx.descricao,
        amount: Number(tx.valor),
        type: tx.tipo === 'receita' ? 'income' : 'expense',
        category: tx.categoria,
        date: tx.data,
        is_subscription: tx.subscricao || false,
        currency: tx.moeda || 'EUR',
      })),
    }),
  })
}

export function forgotPassword(email) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function resetPassword(email, token, new_password) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, token, new_password }),
  })
}

export function fetchAccounts() {
  return request('/accounts/')
}

export function createAccount(data) {
  return request('/accounts/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
