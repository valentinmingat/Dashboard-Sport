import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const COLORS = { Bon: '#10b981', Neutre: '#f59e0b', Mauvais: '#f43f5e' }

export default function ResultDonut({ counts }) {
  const total = counts.Bon + counts.Neutre + counts.Mauvais
  const data = ['Bon', 'Neutre', 'Mauvais'].map((k) => ({ name: k, value: counts[k] }))
  const hasData = total > 0

  return (
    <div className="relative flex items-center gap-4">
      <div className="relative h-28 w-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={hasData ? data : [{ name: 'vide', value: 1 }]}
              dataKey="value"
              innerRadius="70%"
              outerRadius="100%"
              paddingAngle={hasData ? 3 : 0}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {hasData
                ? data.map((d) => <Cell key={d.name} fill={COLORS[d.name]} />)
                : [<Cell key="empty" fill="#e2e8f0" />]}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{total}</span>
          <span className="text-[10px] font-medium text-slate-400">jours</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        {['Bon', 'Neutre', 'Mauvais'].map((k) => (
          <div key={k} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[k] }} />
              {k}
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {counts[k]}
              <span className="ml-1 text-xs font-normal text-slate-400">
                ({total ? Math.round((counts[k] / total) * 100) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
