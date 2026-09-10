const SESSION_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']

export default function SessionsBarChart({ counts }) {
  const max = Math.max(1, ...counts.map((c) => c.count))

  return (
    <div className="flex flex-col gap-3">
      {counts.map(({ type, count }, i) => (
        <div key={type} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{type}</span>
            <span className="shrink-0 font-semibold text-slate-700 dark:text-slate-200">{count}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(count / max) * 100}%`, backgroundColor: SESSION_COLORS[i] }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
