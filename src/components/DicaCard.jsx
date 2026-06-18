export default function DicaCard({ transacoes, moeda = '€', t }) {
  const totalReceitas = transacoes
    .filter((trx) => trx.tipo === 'receita')
    .reduce((acc, trx) => acc + trx.valor, 0)

  const totalDespesas = transacoes
    .filter((trx) => trx.tipo === 'despesa')
    .reduce((acc, trx) => acc + trx.valor, 0)

  const totalSubscricoes = transacoes
    .filter((trx) => trx.tipo === 'despesa' && trx.subscricao)
    .reduce((acc, trx) => acc + trx.valor, 0)

  const saldo = totalReceitas - totalDespesas
  const expenseRatio = totalReceitas > 0 ? totalDespesas / totalReceitas : 0
  const subscriptionRatio = totalReceitas > 0 ? totalSubscricoes / totalReceitas : 0

  let percentagem, mensagem

  if (totalReceitas <= 0) {
    percentagem = 0
    mensagem = t('adicioneReceitas')
  } else if (expenseRatio >= 1) {
    percentagem = 0
    mensagem = t('dicaDespesasAltas', moeda, totalDespesas)
    if (totalSubscricoes > 0) {
      mensagem += t('dicaDespesasSub', moeda, totalSubscricoes)
    }
  } else {
    percentagem = Math.round((saldo / totalReceitas) * 100)
    const valorSugerido = saldo
    mensagem = t('dicaPoupanca', percentagem, moeda, valorSugerido)
    if (expenseRatio < 0.5 && subscriptionRatio > 0.15) {
      mensagem += t('dicaSubscricoes', moeda, totalSubscricoes)
    } else if (expenseRatio >= 0.5 && expenseRatio < 0.8 && subscriptionRatio > 0.12) {
      mensagem += t('dicaSubscricoes', moeda, totalSubscricoes)
    } else if (expenseRatio >= 0.8 && subscriptionRatio > 0.1) {
      mensagem += t('dicaDespesasSub', moeda, totalSubscricoes)
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-(--accent-from) to-(--accent-to) p-6 shadow-lg text-white">
      <p className="mb-1 text-xs font-medium tracking-wide uppercase opacity-80">
        {t('dicaFinanceira')}
      </p>
      <p className="text-xl font-bold tracking-tight sm:text-3xl">
        {percentagem > 0 ? `${percentagem}%` : '—'}
      </p>
      <p className="mt-1 text-sm leading-relaxed opacity-90">
        {mensagem}
      </p>
    </div>
  )
}
