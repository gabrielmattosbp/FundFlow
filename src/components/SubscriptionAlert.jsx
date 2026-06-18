// Componente de alerta que mostra subscrições próximas do vencimento
export default function SubscriptionAlert({ transacoes = [], moeda = '€', onShowSubscriptions, t }) {
  const subscricoes = transacoes.filter((s) => s.subscricao)
  const totalSubs = subscricoes.reduce((acc, s) => acc + s.valor, 0)
  const proximas = subscricoes
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(0, 3)

  // Detecta subscrições prestes a cobrar (dentro dos próximos 3 dias)
  const hoje = new Date()
  const diaAtual = hoje.getDate()
  const subscricoesAviso = subscricoes.filter((s) => {
    const diaCobranca = parseInt(s.data.slice(8, 10), 10)
    const diff = diaCobranca - diaAtual
    return diff >= 0 && diff <= 3
  })

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-800 dark:bg-amber-950">
      <div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-lg">🔔</span>
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-200">{t('alertaSubscricao')}</p>
            {subscricoes.length === 0 ? (
              <p className="mt-1 text-sm leading-relaxed text-amber-700 dark:text-amber-300">
                {t('semSubscricoes')}
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm leading-relaxed text-amber-700 dark:text-amber-300">
                  {t('subscricaoCount', subscricoes.length)} — total {moeda} {totalSubs.toFixed(2)}
                </p>
                {subscricoesAviso.length > 0 && (
                  <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
                    {t('subscricaoAviso', parseInt(subscricoesAviso[0].data.slice(8, 10), 10) - diaAtual)}
                  </p>
                )}
                <p className="mb-2 mt-2 text-xs text-amber-600 dark:text-amber-400">
                  <strong>{t('proximasSubscricoes')}</strong>{' '}
                  {proximas.map((s) => `${s.descricao} (${s.data.slice(5)})`).join(' · ')}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2">
        <button
          onClick={onShowSubscriptions}
          className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
        >
          {t('gerirSubscricoes')}
        </button>
      </div>
    </div>
  )
}
