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
import { isAuthenticated, setToken, setUser, fetchTransactions, deleteTransaction, createTransaction, fetchAccounts, createAccount, deleteAllTransactions, bulkImport } from './services/api'

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
  const [loading, setLoading] = useState(true)
  const [accountId, setAccountId] = useState(null)
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
      setLoading(true)
      try {
        const accountsData = await fetchAccounts()
        let defaultAccountId
        if (accountsData.accounts.length === 0) {
          const newAcct = await createAccount({
            institution: 'Carteira',
            account_type: 'checking',
            currency: settings.moeda,
          })
          defaultAccountId = newAcct.id
        } else {
          defaultAccountId = accountsData.accounts[0].id
        }
        setAccountId(defaultAccountId)
        const txData = await fetchTransactions(mesFiltro)
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
        if (!isAuthenticated()) {
          setAuthenticated(false)
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [authenticated, settings.moeda, mesFiltro])

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
    return <AuthScreen onAuthSuccess={() => setAuthenticated(true)} />
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

  async function handleImportData() {
    if (!accountId) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const text = ev.target.result
        try {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed)) {
            const result = await bulkImport(parsed, accountId)
            const txData = await fetchTransactions(mesFiltro)
            setTransacoes(txData.transactions.map(tx => ({
              id: tx.id,
              tipo: tx.type === 'income' ? 'receita' : 'despesa',
              descricao: tx.description,
              categoria: tx.category,
              data: tx.date,
              valor: Number(tx.amount),
              subscricao: tx.is_subscription,
            })))
            alert(t('importadoJSON', result.imported))
          } else {
            alert(t('jsonInvalido'))
          }
        } catch {
          const lines = text.split('\n').slice(1).filter(Boolean)
          const imported = lines.map((line) => {
            const [tipo, descricao, categoria, data, valor, subscricao] = line.split(',')
            return { tipo, descricao, categoria, data, valor: Number(valor), subscricao: subscricao === 'sim', moeda: settings.moeda }
          })
          if (imported.length > 0) {
            const result = await bulkImport(imported, accountId)
            const txData = await fetchTransactions(mesFiltro)
            setTransacoes(txData.transactions.map(tx => ({
              id: tx.id,
              tipo: tx.type === 'income' ? 'receita' : 'despesa',
              descricao: tx.description,
              categoria: tx.category,
              data: tx.date,
              valor: Number(tx.amount),
              subscricao: tx.is_subscription,
            })))
            alert(t('importadoCSV', result.imported))
          }
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
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-slate-100 sm:text-3xl">
            {t('appTitle')}
          </h1>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 sm:px-4 sm:py-2 sm:text-sm"
          >
            Sair
          </button>
        </div>

        {loading && (
          <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            A carregar...
          </div>
        )}

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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:col-span-4">
            <button
              onClick={() => setShowTransactionsModal(true)}
              className="w-full rounded-xl bg-(--accent) px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-(--accent-hover) sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              {t('checarTransacoes')}
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
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
            onConfirm={async () => {
              try {
                await deleteAllTransactions()
              } catch (e) {
                console.error('Erro ao limpar transações no servidor:', e)
              }
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

        <footer className="mt-12 text-center text-sm text-gray-400 dark:text-slate-500">
          FundFlow 2026 &copy;
        </footer>
      </div>
    </div>
  )
}

export default App
