// Card reutilizável que exibe um título e um valor (ex: saldos)
export default function DashboardCard({ title, value }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100 transition-shadow hover:shadow-xl dark:bg-slate-800 dark:ring-slate-700">
      <p className="text-sm font-medium tracking-wide text-gray-500 uppercase dark:text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-gray-900 sm:text-3xl dark:text-slate-100">
        {value}
      </p>
    </div>
  )
}
