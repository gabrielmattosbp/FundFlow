// Card com dica financeira dinâmica baseada nas transações do utilizador
export default function DicaCard({ transacoes, moeda = '€', t }) {
  // Calcula totais a partir das transações reais
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

  // Lógica da dica
  let percentagem, mensagem

  if (totalReceitas <= 0) {
    percentagem = 0
    mensagem = t('adicioneReceitas')
  } else if (saldo > 0) {
    percentagem = 20
    const valorSugerido = totalReceitas * 0.2
    mensagem = t('dicaPoupanca', percentagem, moeda, valorSugerido)
    if (totalSubscricoes > 0) {
      mensagem += t('dicaSubscricoes', moeda, totalSubscricoes)
    }
  } else if (saldo <= 0 && totalDespesas > 0) {
    percentagem = 0
    mensagem = t('dicaDespesasAltas', moeda, totalDespesas)
    if (totalSubscricoes > 0) {
      mensagem += t('dicaDespesasSub', moeda, totalSubscricoes)
    }
  } else {
    percentagem = 0
    mensagem = t('dicaPadrao')
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
