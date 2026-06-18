import { useState, useRef } from 'react'

// Lista de categorias disponíveis para classificar transações
const CATEGORIAS = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Educação', 'Lazer', 'Salário', 'Freelance', 'Investimentos', 'Outros',
]

// Mapeamento de palavras-chave para categorias (preenchimento automático)
const KEYWORD_MAP = {
  uber: 'Transporte', '99': 'Transporte', taxi: 'Transporte',
  metro: 'Transporte', combustivel: 'Transporte',
  ifood: 'Alimentação', continente: 'Alimentação', 'pingo doce': 'Alimentação',
  cafe: 'Alimentação', almoço: 'Alimentação', jantar: 'Alimentação',
  netflix: 'Lazer', spotify: 'Lazer', ginasio: 'Lazer', cinema: 'Lazer',
  farmacia: 'Saúde', medico: 'Saúde',
}

// Valores predefinidos para os botões de preço rápido
const PRECO_PRESETS = [1, 2, 5, 10, 20, 50, 100, 1000]

// Botões rápidos pré-definidos (despesas comuns e subscrições)
// subscricao: true marca automaticamente o checkbox de subscrição no formulário
const QUICK_ITEMS = [
  { labelKey: 'Cafe', descricao: 'Café', categoria: 'Alimentação' },
  { labelKey: 'Almoco', descricao: 'Almoço', categoria: 'Alimentação' },
  { labelKey: 'Jantar', descricao: 'Jantar', categoria: 'Alimentação' },
  { labelKey: 'Mercado', descricao: 'Mercado', categoria: 'Alimentação' },
  { labelKey: 'Uber', descricao: 'Uber', categoria: 'Transporte' },
  { labelKey: 'Gasolina', descricao: 'Gasolina', categoria: 'Transporte' },
  { labelKey: 'Farmacia', descricao: 'Farmácia', categoria: 'Saúde' },
  { labelKey: 'Cabeleireiro', descricao: 'Cabeleireiro', categoria: 'Saúde' },
  { labelKey: 'Salario', descricao: 'Salário', categoria: 'Salário', tipo: 'receita' },
  { labelKey: 'Investimento', descricao: 'Investimento', categoria: 'Investimentos', tipo: 'receita' },
  { labelKey: 'Netflix', descricao: 'Netflix', categoria: 'Lazer', subscricao: true },
  { labelKey: 'Spotify', descricao: 'Spotify', categoria: 'Lazer', subscricao: true },
  { labelKey: 'Ginasio', descricao: 'Ginásio', categoria: 'Saúde', subscricao: true },
]

// Retorna a data de hoje no formato YYYY-MM-DD
function today() {
  return new Date().toISOString().split('T')[0]
}

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

// Formata uma data YYYY-MM-DD conforme o padrão escolhido
function formatDate(dateStr, formato) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  if (!y || !m || !d) return dateStr
  switch (formato) {
    case 'MM/DD/AAAA': return `${m}/${d}/${y}`
    case 'DD/MM/AAAA': return `${d}/${m}/${y}`
    default: return dateStr // AAAA-MM-DD
  }
}

// Detecta automaticamente a categoria com base na descrição digitada
function detectCategory(descricao) {
  const lower = descricao.toLowerCase()
  for (const [keyword, categoria] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) return categoria
  }
  return null
}

// Estado inicial do formulário de nova transação
function emptyForm() {
  return { tipo: 'despesa', descricao: '', categoria: 'Outros', data: today(), valor: '', subscricao: false }
}

// Componente principal: tabela de transações com formulário de adição
export default function DashboardTable({ transacoes, mesFiltro, setMesFiltro, showTransactionsModal, setShowTransactionsModal, onAddTransaction = () => {}, onRemoveTransaction = () => {}, moeda = '€', formatoData = 'DD/MM/AAAA', t }) {
  // Estado do formulário de nova transação
  const [form, setForm] = useState(emptyForm())
  // Botões rápidos criados pelo utilizador
  const [customItems, setCustomItems] = useState([])
  // Controlo de visibilidade do formulário de criar botão customizado
  const [showCustomForm, setShowCustomForm] = useState(false)
  // Estado do formulário de botão customizado
  const [customForm, setCustomForm] = useState({ label: '', descricao: '', categoria: 'Outros', subscricao: false, tipo: 'despesa' })
  // Referência para focar automaticamente o input de valor após clique rápido
  const valorRef = useRef(null)
  // Termo de pesquisa no modal
  const [searchTerm, setSearchTerm] = useState('')

  // Transações filtradas pelo termo de pesquisa (para o modal)
  const transacoesFiltradasPesquisa = transacoes.filter(
    (trx) =>
      trx.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Apenas as 4 primeiras transações visíveis na tabela principal
  const transacoesLimitadas = transacoes.slice(0, 4)

  // Atualiza um campo do formulário pelo nome
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Atualiza a descrição e tenta detetar a categoria automaticamente
  function handleDescricaoChange(e) {
    const descricao = e.target.value
    const categoria = detectCategory(descricao)
    setForm((prev) => ({
      ...prev,
      descricao,
      categoria: categoria || prev.categoria,
    }))
  }

  // Preenche o formulário com os dados de um botão rápido
  function handleQuickAdd(item) {
    setForm({ ...form, tipo: item.tipo || 'despesa', descricao: item.descricao, categoria: item.categoria, subscricao: item.subscricao || false })
    setTimeout(() => valorRef.current?.focus(), 0)
  }

  // Submete o formulário e adiciona uma nova transação à lista
  function handleSubmit(e) {
    e.preventDefault()
    if (!form.descricao || !form.data || !form.valor) return

    onAddTransaction(form)
    setForm(emptyForm())
  }

  // Remove uma transação da lista pelo ID
  function handleRemover(id) {
    onRemoveTransaction(id)
  }

  // Adiciona um novo botão rápido customizado à lista
  function handleAddCustom() {
    if (!customForm.label || !customForm.descricao) return
    setCustomItems([...customItems, { ...customForm, id: crypto.randomUUID() }])
    setCustomForm({ label: '', descricao: '', categoria: 'Outros', subscricao: false, tipo: 'despesa' })
    setShowCustomForm(false)
  }

  // Remove um botão rápido customizado pelo ID
  function handleRemoveCustom(id) {
    setCustomItems(customItems.filter((i) => i.id !== id))
  }

  // Cálculo do total de receitas
  const totalReceitas = transacoes
    .filter((trx) => trx.tipo === 'receita')
    .reduce((acc, trx) => acc + trx.valor, 0)

  // Cálculo do total de despesas
  const totalDespesas = transacoes
    .filter((trx) => trx.tipo === 'despesa')
    .reduce((acc, trx) => acc + trx.valor, 0)

  return (
    <div className="mt-8 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-slate-800 dark:ring-slate-700">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
          {t('transacoes')}
        </h2>
        {/* Filtro por mês */}
        <input
          type="month"
          value={mesFiltro}
          onChange={(e) => setMesFiltro(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        />
      </div>

      {/* Botões rápidos (pré-definidos + customizados) */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[...QUICK_ITEMS, ...customItems].map((item) => (
          <span key={item.id || item.labelKey} className="relative">
            <button
              type="button"
              onClick={() => handleQuickAdd(item)}
              className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              {item.id ? item.label : t('quick' + item.labelKey)}
            </button>
            {/* Botão "×" para remover apenas itens customizados (têm id próprio) */}
            {item.id && (
              <button
                type="button"
                onClick={() => handleRemoveCustom(item.id)}
                className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-400 text-[10px] text-white hover:bg-red-500"
              >
                ×
              </button>
            )}
          </span>
        ))}
        {/* Botão para abrir/fechar o formulário de criar botão customizado */}
        <button
          type="button"
          onClick={() => setShowCustomForm(!showCustomForm)}
          className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-sm text-gray-500 transition hover:border-gray-400 hover:text-gray-700 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-300"
        >
          {t('+ Custom')}
        </button>
      </div>

      {/* Formulário para criar um novo botão rápido customizado */}
      {showCustomForm && (
        <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-slate-400">{t('nome')}</label>
            <input
              placeholder="Ex: Pizza"
              value={customForm.label}
              onChange={(e) => setCustomForm({ ...customForm, label: e.target.value })}
              className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">{t('descricao')}</label>
            <input
              placeholder="Ex: Pizza"
              value={customForm.descricao}
              onChange={(e) => setCustomForm({ ...customForm, descricao: e.target.value })}
              className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">{t('tipo')}</label>
            <select
              value={customForm.tipo}
              onChange={(e) => setCustomForm({ ...customForm, tipo: e.target.value })}
              className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">{t('categoria')}</label>
            <select
              value={customForm.categoria}
              onChange={(e) => setCustomForm({ ...customForm, categoria: e.target.value })}
              className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>{t(catKey(cat))}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-1.5 pb-1 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={customForm.subscricao}
              onChange={(e) => setCustomForm({ ...customForm, subscricao: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-gray-300 text-(--accent-text) focus:ring-(--accent-ring)"
            />
            {t('subscricao')}
          </label>
          <button
            type="button"
            onClick={handleAddCustom}
            className="rounded bg-(--accent) px-3 py-1.5 text-sm font-medium text-white transition hover:bg-(--accent-hover)"
          >
            {t('criar')}
          </button>
        </div>
      )}

      {/* Formulário de nova transação */}
      <form onSubmit={handleSubmit} className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {/* Tipo: Receita ou Despesa */}
        <select
          name="tipo"
          value={form.tipo}
          onChange={handleChange}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        >
                <option value="receita">{t('receita')}</option>
                <option value="despesa">{t('despesa')}</option>
        </select>

        {/* Descrição da transação (preenche categoria automaticamente) */}
        <input
          name="descricao"
          placeholder={t('descricao')}
          value={form.descricao}
          onChange={handleDescricaoChange}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        />

        {/* {t('categoria')} da transação */}
        <select
          name="categoria"
          value={form.categoria}
          onChange={handleChange}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        >
          {CATEGORIAS.map((cat) => (
            <option key={cat} value={cat}>{t(catKey(cat))}</option>
          ))}
        </select>

        {/* Data da transação */}
        <input
          name="data"
          type="date"
          value={form.data}
          onChange={handleChange}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        />

        {/* Valor com botões de preço predefinido */}
        <div>
          <input
            ref={valorRef}
            name="valor"
            type="number"
            step="1"
            placeholder={t('valor')}
            value={form.valor}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          />
          <div className="mt-1 flex flex-wrap gap-1">
            {PRECO_PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm({ ...form, valor: (Number(form.valor) || 0) + v })}
                className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 transition hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                {moeda}{v}
              </button>
            ))}
          </div>
        </div>

        {/* Botão de submissão */}
        <button
          type="submit"
          className="rounded-lg bg-(--accent) px-4 py-2 text-sm font-medium text-white transition hover:bg-(--accent-hover)"
        >
          {t('adicionar')}
        </button>

        {/* Checkbox para marcar como subscrição (despesa recorrente) */}
        <label className="col-span-full flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
          <input
            name="subscricao"
            type="checkbox"
            checked={form.subscricao}
            onChange={(e) => setForm({ ...form, subscricao: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-(--accent-text) focus:ring-(--accent-ring)"
          />
          {t('subscricaoRecorrente')}
        </label>
      </form>

      {/* Totais de receitas e despesas */}
      {totalReceitas > 0 || totalDespesas > 0 ? (
        <div className="mb-4 flex gap-6 text-sm">
          <span className="font-medium text-(--accent-text)">
            {t('receitas')}: {moeda} {totalReceitas.toFixed(2)}
          </span>
          <span className="font-medium text-red-500">
            {t('despesas')}: {moeda} {totalDespesas.toFixed(2)}
          </span>
        </div>
      ) : null}

      {/* Tabela de transações (apenas 4 visíveis) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 dark:border-slate-600 dark:text-slate-400">
              <th className="pb-3 pr-4 font-medium">{t('tipo')}</th>
              <th className="pb-3 pr-4 font-medium">{t('descricao')}</th>
              <th className="hidden pb-3 pr-4 font-medium sm:table-cell">{t('categoria')}</th>
              <th className="pb-3 pr-4 font-medium">{t('data')}</th>
              <th className="pb-3 pr-4 font-medium">{t('valor')}</th>
              <th className="pb-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {transacoes.length === 0 ? (
              /* Estado vazio */
              <tr>
                <td colSpan={6} className="pt-6 text-center text-gray-400 dark:text-slate-500">
                  {t('nenhumaTransacao')}
                </td>
              </tr>
            ) : (
              /* Lista limitada a 4 transações */
              transacoesLimitadas.map((trx) => (
                <tr key={trx.id} className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        trx.tipo === 'receita'
                          ? 'bg-(--accent-light) text-(--accent)'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {trx.tipo === 'receita' ? t('receita') : t('despesa')}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-slate-100">
                    {trx.descricao}
                    {/* Badge de subscrição para transações recorrentes */}
                    {trx.subscricao && (
                      <span className="ml-2 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {t('subscricao')}
                      </span>
                    )}
                  </td>
                  <td className="hidden py-3 pr-4 text-gray-500 dark:text-slate-400 sm:table-cell">{t(catKey(trx.categoria))}</td>
                  <td className="py-3 pr-4 text-gray-500 dark:text-slate-400">{formatDate(trx.data, formatoData)}</td>
                  <td className={`py-3 pr-4 font-medium ${trx.tipo === 'receita' ? 'text-(--accent-text)' : 'text-red-500'}`}>
                    {trx.tipo === 'receita' ? '+' : '-'}{moeda} {trx.valor.toFixed(2)}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleRemover(trx.id)}
                      className="text-xs text-gray-400 underline transition hover:text-red-500"
                    >
                      {t('remover')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Botão para abrir o modal com todas as transações */}
      {transacoes.length > 0 && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowTransactionsModal(true)}
            className="rounded-lg bg-(--accent) px-6 py-2 text-sm font-medium text-white transition hover:bg-(--accent-hover)"
          >
            {t('checarTransacoes')}
          </button>
        </div>
      )}

      {/* Modal com tabela completa e pesquisa */}
      {showTransactionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[80vh] w-full max-w-4xl flex-col rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
            {/* Cabeçalho do modal */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{t('todasTransacoes')}</h3>
              <button
                type="button"
                onClick={() => setShowTransactionsModal(false)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search box */}
            <input
              type="text"
              placeholder={t('pesquisar')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />

            {/* Tabela completa no modal */}
            <div className="overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 dark:border-slate-600 dark:text-slate-400">
                    <th className="pb-3 pr-4 font-medium">{t('tipo')}</th>
                    <th className="pb-3 pr-4 font-medium">{t('descricao')}</th>
                    <th className="hidden pb-3 pr-4 font-medium sm:table-cell">{t('categoria')}</th>
                    <th className="pb-3 pr-4 font-medium">{t('data')}</th>
                    <th className="pb-3 pr-4 font-medium">{t('valor')}</th>
                    <th className="pb-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {transacoesFiltradasPesquisa.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="pt-6 text-center text-gray-400 dark:text-slate-500">
                          {t('nenhumaEncontrada')}
                      </td>
                    </tr>
                  ) : (
                    transacoesFiltradasPesquisa.map((trx) => (
                      <tr key={trx.id} className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800">
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                trx.tipo === 'receita'
                                  ? 'bg-(--accent-light) text-(--accent)'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {trx.tipo === 'receita' ? t('receita') : t('despesa')}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-slate-100">
                          {trx.descricao}
                          {trx.subscricao && (
                            <span className="ml-2 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                              {t('subscricao')}
                            </span>
                          )}
                        </td>
                        <td className="hidden py-3 pr-4 text-gray-500 dark:text-slate-400 sm:table-cell">{t(catKey(trx.categoria))}</td>
                        <td className="py-3 pr-4 text-gray-500 dark:text-slate-400">{formatDate(trx.data, formatoData)}</td>
                        <td className={`py-3 pr-4 font-medium ${trx.tipo === 'receita' ? 'text-(--accent-text)' : 'text-red-500'}`}>
                          {trx.tipo === 'receita' ? '+' : '-'}{moeda} {trx.valor.toFixed(2)}
                        </td>
                        <td className="py-3">
                          <button
                      onClick={() => handleRemover(trx.id)}
                            className="text-xs text-gray-400 underline transition hover:text-red-500"
                          >
                            {t('remover')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
