export default function SubscriptionModal({ transacoes, moeda = '€', onClose, t }) {
  const subscricoes = transacoes.filter((tr) => tr.subscricao)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white p-3 shadow-xl dark:bg-slate-800 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{t('subscricao')}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-slate-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {subscricoes.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">
            {t('semSubscricoes')}
          </p>
        ) : (
          <div className="overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 dark:border-slate-600 dark:text-slate-400">
                  <th className="pb-3 pr-4 font-medium">{t('descricao')}</th>
                  <th className="pb-3 pr-4 font-medium">{t('categoria')}</th>
                  <th className="pb-3 pr-4 font-medium">{t('valor')}</th>
                  <th className="pb-3 font-medium">{t('data')}</th>
                </tr>
              </thead>
              <tbody>
                {subscricoes.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 dark:border-slate-700">
                    <td className="py-3 pr-4 font-medium text-gray-900 dark:text-slate-100">{s.descricao}</td>
                    <td className="py-3 pr-4 text-gray-500 dark:text-slate-400">{s.categoria}</td>
                    <td className="py-3 pr-4 font-medium text-(--accent-text)">{moeda} {s.valor.toFixed(2)}</td>
                    <td className="py-3 text-gray-500 dark:text-slate-400">{s.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
