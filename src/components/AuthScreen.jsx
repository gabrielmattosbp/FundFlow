import { useState } from 'react'
import { login, register, setToken, setUser } from '../services/api'

export default function AuthScreen({ onAuthSuccess, t }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = mode === 'login'
        ? await login(email, password)
        : await register(email, name, password)

      setToken(data.access_token)
      setUser(data.user)
      onAuthSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-slate-800 dark:ring-slate-700 sm:p-8">
        <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
          FundFlow
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500 dark:text-slate-400">
          {mode === 'login' ? 'Acede à tua conta' : 'Cria a tua conta'}
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              placeholder="ola@exemplo.com"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Nome
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                placeholder="O seu nome"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-(--accent) px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-(--accent-hover) disabled:opacity-50"
          >
            {loading ? 'A carregar…' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
          {mode === 'login' ? 'Ainda não tens conta?' : 'Já tens conta?'}
          <button
            onClick={switchMode}
            className="ml-1 font-semibold text-(--accent) hover:underline"
          >
            {mode === 'login' ? 'Regista-te' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  )
}
