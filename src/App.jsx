import { useState, useEffect } from 'react'
import DashboardCard from './components/DashboardCard'
import DashboardChart from './components/DashboardChart'
import DicaCard from './components/DicaCard'
import SubscriptionAlert from './components/SubscriptionAlert'
import DashboardTable from './components/DashboardTable'
import ModalConfiguracoes from './components/ModalConfiguracoes'
import ConfirmModal from './components/ConfirmModal'
import SubscriptionModal from './components/SubscriptionModal'
import AuthScreen from './components/AuthScreen'
import useTranslations from './translations'
import { isAuthenticated, setToken, setUser, fetchTransactions, deleteTransaction, createTransaction, fetchAccounts, createAccount } from './services/api'

function mesAtual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function filtrarPorMes(transacoes, mes) {
  return transacoes.filter((trx) => trx.data && trx.data.startsWith(mes))
}

const DEFAULT_SETTINGS = {
  tema: 'claro',
  fonte: 'Inter',
  moeda: 'EUR',
  idioma: 'pt-PT',
  pais: 'Portugal',
  formatoHora: '24h',
  formatoData: 'DD/MM/AAAA',
  cor: 'verde',
}

function loadSettings() {
  try {
    const saved = localStorage.getItem('fundflow_settings')
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

function getCurrencySymbol(moeda) {
  const map = { EUR: '€', USD: '$', BRL: 'R$', GBP: '£' }
  return map[moeda] || '€'
}

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated())
  const [transacoes, setTransacoes] = useState([])
  const [mesFiltro, setMesFiltro] = useState(mesAtual())
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settings, setSettings] = useState(loadSettings)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showSubscriptionsModal, setShowSubscriptionsModal] = useState(false)
  const [accountId, setAccountId] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations(settings.idioma)

  // Aplica tema, fonte e cor globalmente
  useEffect(() => {
    const isDark =
      settings.tema === 'escuro' ||
      (settings.tema === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    document.body.style.fontFamily = settings.fonte
    document.documentElement.setAttribute('data-cor', settings.cor)
    document.documentElement.setAttribute('lang', settings.idioma)
  }, [settings.tema, settings.fonte, settings.cor, settings.idioma])

  useEffect(() => {
    if (!authenticated) return

    async function loadData() {
      try {
        const accountsData = await fetchAccounts()
        setAccounts(accountsData.accounts)
        let defaultAccountId
        if (accountsData.accounts.length === 0) {
          const newAcct = await createAccount({
            institution: 'Carteira',
            account_type: 'checking',
            currency: settings.moeda,
          })
          defaultAccountId = newAcct.id
          setAccounts([newAcct])
        } else {
          defaultAccountId = accountsData.accounts[0].id
        }
        setAccountId(defaultAccountId)
        const txData = await fetchTransactions()
        setTransacoes(txData.transactions.map(tx => ({
          id: tx.id,
          tipo: tx.type === 'income' ? 'receita' : 'despesa',
          descricao: tx.description,
          categoria: tx.category,
          data: tx.date,
          valor: Number(tx.amount),
          subscricao: tx.is_subscription,
        })))
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [authenticated])

  async function addTransaction(form) {
    if (!accountId) return
    const result = await createTransaction({
      account_id: accountId,
      description: form.descricao,
      amount: Number(form.valor),
      type: form.tipo === 'receita' ? 'income' : 'expense',
      category: form.categoria,
      date: form.data,
      is_subscription: form.subscricao,
      currency: settings.moeda,
    })
    setTransacoes(prev => [{
      id: result.id,
      tipo: result.type === 'income' ? 'receita' : 'despesa',
      descricao: result.description,
      categoria: result.category,
      data: result.date,
      valor: Number(result.amount),
      subscricao: result.is_subscription,
    }, ...prev])
  }

  async function removeTransaction(id) {
    await deleteTransaction(id)
    setTransacoes(prev => prev.filter(trx => trx.id !== id))
  }

  const transacoesFiltradas = filtrarPorMes(transacoes, mesFiltro)
  const totalReceitas = transacoesFiltradas
    .filter((trx) => trx.tipo === 'receita')
    .reduce((acc, trx) => acc + trx.valor, 0)
  const totalDespesas = transacoesFiltradas
    .filter((trx) => trx.tipo === 'despesa')
    .reduce((acc, trx) => acc + trx.valor, 0)
  const saldoCorrente = totalReceitas - totalDespesas
  const moeda = getCurrencySymbol(settings.moeda)

  function handleLogout() {
    setToken(null)
    setUser(null)
    setAuthenticated(false)
  }

  if (!authenticated) {
    return <AuthScreen onAuthSuccess={() => setAuthenticated(true)} t={t} />
  }

  function handleSaveSettings(newSettings) {
    setSettings(newSettings)
    localStorage.setItem('fundflow_settings', JSON.stringify(newSettings))
  }

  function handleExportCSV() {
    if (transacoes.length === 0) {
      alert(t('semTransacoesExportar'))
      return
    }
    const headers = 'Tipo,Descricao,Categoria,Data,Valor,Subscricao'
    const rows = transacoes.map((trx) =>
      `${trx.tipo},${trx.descricao},${trx.categoria},${trx.data},${trx.valor},${trx.subscricao ? 'sim' : 'nao'}`
    )
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fundflow_${mesFiltro}.csv`
    a.click()
    URL.revokeObjectURL(url)
    alert(t('exportadoSucesso', transacoes.length))
  }

  function handleImportData() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target.result
        try {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed)) {
            setTransacoes((prev) => [...parsed, ...prev])
            alert(t('importadoJSON', parsed.length))
          } else {
            alert(t('jsonInvalido'))
          }
        } catch {
          const lines = text.split('\n').slice(1).filter(Boolean)
          const imported = lines.map((line) => {
            const [tipo, descricao, categoria, data, valor, subscricao] = line.split(',')
            return { id: crypto.randomUUID(), tipo, descricao, categoria, data, valor: Number(valor), subscricao: subscricao === 'sim' }
          })
          setTransacoes((prev) => [...imported, ...prev])
          alert(t('importadoCSV', imported.length))
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-slate-900 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            {t('appTitle')}
          </h1>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            Sair
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <DashboardCard title={t('saldoCorrente')} value={`${moeda} ${saldoCorrente.toFixed(2)}`} />
          <DashboardCard title={t('totalReceitas')} value={`${moeda} ${totalReceitas.toFixed(2)}`} />
          <DashboardCard title={t('totalDespesas')} value={`${moeda} ${totalDespesas.toFixed(2)}`} />
          <DicaCard transacoes={transacoesFiltradas} moeda={moeda} t={t} />
        </div>

        <div className="mt-6">
          <DashboardChart transacoes={transacoesFiltradas} moeda={moeda} t={t} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <SubscriptionAlert transacoes={transacoesFiltradas} moeda={moeda} onShowSubscriptions={() => setShowSubscriptionsModal(true)} t={t} />
          </div>
          <div className="flex items-center justify-end gap-4 lg:col-span-4">
            <button
              onClick={() => setShowTransactionsModal(true)}
              className="rounded-xl bg-(--accent) px-8 py-4 text-base font-semibold text-white shadow transition hover:bg-(--accent-hover)"
            >
              {t('checarTransacoes')}
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="rounded-xl border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {t('configuracoes')}
            </button>
          </div>
        </div>

        <DashboardTable
          transacoes={transacoesFiltradas}
          mesFiltro={mesFiltro}
          setMesFiltro={setMesFiltro}
          showTransactionsModal={showTransactionsModal}
          setShowTransactionsModal={setShowTransactionsModal}
          onAddTransaction={addTransaction}
          onRemoveTransaction={removeTransaction}
          moeda={moeda}
          formatoData={settings.formatoData}
          t={t}
        />

        {showSettingsModal && (
          <ModalConfiguracoes
            settings={settings}
            onSave={handleSaveSettings}
            onClose={() => setShowSettingsModal(false)}
            onExportCSV={handleExportCSV}
            onImportData={handleImportData}
            onClearAll={() => setShowClearConfirm(true)}
            t={t}
          />
        )}

        {showClearConfirm && (
          <ConfirmModal
            message={t('confirmaLimpar')}
            onConfirm={() => {
              setTransacoes([])
              setShowClearConfirm(false)
              setShowSettingsModal(false)
            }}
            onCancel={() => setShowClearConfirm(false)}
          />
        )}

        {showSubscriptionsModal && (
          <SubscriptionModal
            transacoes={transacoes}
            moeda={moeda}
            onClose={() => setShowSubscriptionsModal(false)}
            t={t}
          />
        )}
      </div>
    </div>
  )
}

export default App
