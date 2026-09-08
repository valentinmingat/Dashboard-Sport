export default function StatCard({ label, value, unit, icon: Icon, accent = 'from-cyan-500 to-indigo-500' }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-slate-800 dark:shadow-none">
      {Icon && (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white`}>
          <Icon size={19} strokeWidth={2.25} />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {value}
          {unit && <span className="ml-0.5 text-xs font-medium text-slate-400">{unit}</span>}
        </p>
      </div>
    </div>
  )
}
