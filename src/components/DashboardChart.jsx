// Gráfico de pizza mostrando gastos por categoria (dados reais das transações)
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

// Cores para cada fatia do gráfico
const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899']

// Lista fixa de categorias para manter a ordem e cor consistentes
const CATEGORIAS = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Educação', 'Lazer', 'Salário', 'Freelance', 'Investimentos', 'Outros',
]

export default function DashboardChart({ transacoes, moeda = '€', t }) {
  // Mapeia categorias para chaves de tradução (sem acentos)
  function catKey(categoria) {
    const map = {
      'Alimentação': 'catAlimentacao',
      'Transporte': 'catTransporte',
      'Moradia': 'catMoradia',
      'Saúde': 'catSaude',
      'Educação': 'catEducacao',
      'Lazer': 'catLazer',
      'Salário': 'catSalario',
      'Freelance': 'catFreelance',
      'Investimentos': 'catInvestimentos',
      'Outros': 'catOutros',
    }
    return map[categoria] || 'catOutros'
  }

  // Agrupa despesas por categoria a partir das transações reais
  const despesas = transacoes.filter((trx) => trx.tipo === 'despesa')
  const gastosPorCategoria = CATEGORIAS.map((cat) => ({
    name: t(catKey(cat)),
    value: despesas
      .filter((trx) => trx.categoria === cat)
      .reduce((acc, trx) => acc + trx.valor, 0),
  })).filter((cat) => cat.value > 0)

  // Se não houver despesas, mostra uma mensagem em vez do gráfico
  if (gastosPorCategoria.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-slate-800 dark:ring-slate-700">
        <h3 className="mb-4 text-lg font-bold tracking-tight text-gray-900 dark:text-slate-100">
          {t('gastosPorCategoria')}
        </h3>
        <p className="text-sm text-gray-400 dark:text-slate-500">{t('adicioneDespesas')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100 h-full dark:bg-slate-800 dark:ring-slate-700">
      <h3 className="mb-4 text-lg font-bold tracking-tight text-gray-900 dark:text-slate-100">
        {t('gastosPorCategoria')}
      </h3>

      {/* Gráfico responsivo da Recharts */}
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={gastosPorCategoria}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {/* Cada fatia recebe uma cor do array COLORS */}
            {gastosPorCategoria.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          {/* Tooltip ao passar o rato por cima */}
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '14px',
              backgroundColor: 'var(--tooltip-bg, #fff)',
              color: 'var(--tooltip-color, #111827)',
            }}
            formatter={(value) => [`${moeda} ${value.toFixed(2)}`, t('valor')]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legenda com cores correspondentes */}
      <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs dark:text-slate-300">
        {gastosPorCategoria.map((item, i) => (
          <span key={item.name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            {item.name}
          </span>
        ))}
      </div>
    </div>
  )
}
