import { useState, useEffect } from 'react'

export default function ModalConfiguracoes({ settings, onSave, onClose, onExportCSV, onImportData, onClearAll, t }) {
  const [form, setForm] = useState({ ...settings })

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function update(key, value) {
    setForm({ ...form, [key]: value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 sm:pt-20" onClick={onClose}>
      <div className="relative m-4 w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-slate-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">{t('configuracoes')}</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 p-4">

          {/* Aparência */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">{t('aparência')}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-gray-400 dark:text-slate-500">{t('tema')}</label>
                <select value={form.tema} onChange={(e) => update('tema', e.target.value)} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <option value="claro">{t('claro')}</option>
                  <option value="escuro">{t('escuro')}</option>
                  <option value="sistema">{t('sistema')}</option>
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-gray-400 dark:text-slate-500">{t('fonte')}</label>
                <select value={form.fonte} onChange={(e) => update('fonte', e.target.value)} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Poppins">Poppins</option>
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-gray-400 dark:text-slate-500">{t('cor')}</label>
                <select value={form.cor} onChange={(e) => update('cor', e.target.value)} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <option value="verde">{t('corVerde')}</option>
                  <option value="azul">{t('corAzul')}</option>
                  <option value="roxo">{t('corRoxo')}</option>
                  <option value="laranja">{t('corLaranja')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">{t('localização')}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-gray-400 dark:text-slate-500">{t('moeda')}</label>
                <select value={form.moeda} onChange={(e) => update('moeda', e.target.value)} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="BRL">BRL (R$)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-gray-400 dark:text-slate-500">{t('idioma')}</label>
                <select value={form.idioma} onChange={(e) => update('idioma', e.target.value)} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <option value="pt-PT">{t('linguaPtPT')}</option>
                  <option value="pt-BR">{t('linguaPtBR')}</option>
                  <option value="en-US">{t('linguaEnUS')}</option>
                  <option value="es">{t('linguaEs')}</option>
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-gray-400 dark:text-slate-500">{t('pais')}</label>
                <select value={form.pais} onChange={(e) => update('pais', e.target.value)} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <option value="Portugal">{t('paisPortugal')}</option>
                  <option value="Brasil">{t('paisBrasil')}</option>
                  <option value="EUA">{t('paisEua')}</option>
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-gray-400 dark:text-slate-500">{t('formatoData')}</label>
                <select value={form.formatoData} onChange={(e) => update('formatoData', e.target.value)} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <option value="DD/MM/AAAA">dd/mm/aaaa</option>
                  <option value="MM/DD/AAAA">mm/dd/aaaa</option>
                  <option value="AAAA-MM-DD">aaaa-mm-dd</option>
                </select>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] text-gray-400 dark:text-slate-500">{t('formatoHora')}</label>
                <select value={form.formatoHora} onChange={(e) => update('formatoHora', e.target.value)} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--accent-ring) dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <option value="24h">24h</option>
                  <option value="12h">12h (AM/PM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Gestão de Dados */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">{t('gestãoDados')}</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={onExportCSV} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">{t('exportarCSV')}</button>
              <button onClick={onImportData} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">{t('importar')}</button>
              <button onClick={onClearAll} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-700 dark:text-red-400 dark:hover:bg-red-950">{t('limparTudo')}</button>
            </div>
          </div>

        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3 dark:border-slate-700">
          <button onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">{t('cancelar')}</button>
          <button onClick={() => { onSave(form); onClose() }} className="rounded-lg bg-(--accent) px-4 py-1.5 text-sm font-medium text-white transition hover:bg-(--accent-hover)">{t('guardar')}</button>
        </div>
      </div>
    </div>
  )
}
