const SESSION_GRADIENTS = [
  ['#1e3a8a', '#86efac'], // Jambes : bleu foncé -> vert clair
  ['#14532d', '#10b981'], // Pecs / Épaules / Triceps : vert foncé -> émeraude
  ['#a16207', '#fde047'], // Biceps / Dos / Abdos : jaune foncé -> jaune clair
  ['#c2410c', '#fdba74'], // Autre : orange foncé -> orange clair
  ['#dc2626', '#fca5a5'], // Repos : rouge -> rouge clair
]

export default function SessionsBarChart({ counts }) {
  const max = Math.max(1, ...counts.map((c) => c.count))

  return (
    <div className="flex flex-col gap-3">
      {counts.map(({ type, count }, i) => {
        const [from, to] = SESSION_GRADIENTS[i]
        return (
          <div key={type} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{type}</span>
              <span className="shrink-0 font-semibold text-slate-700 dark:text-slate-200">{count}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-700">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(count / max) * 100}%`, background: `linear-gradient(to right, ${to}, ${from})` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
