// Card reutilizável que exibe um título e um valor (ex: saldos)
export default function DashboardCard({ title, value }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-gray-100 transition-shadow hover:shadow-xl dark:bg-slate-800 dark:ring-slate-700 sm:p-6">
      <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase dark:text-slate-400 sm:text-sm">
        {title}
      </p>
      <p className="mt-1 text-base font-semibold tracking-tight text-gray-900 sm:mt-2 sm:text-3xl dark:text-slate-100">
        {value}
      </p>
    </div>
  )
}
