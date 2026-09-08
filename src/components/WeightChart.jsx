import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, CartesianGrid } from 'recharts'
import { parseISO, formatShort } from '../lib/format'

export default function WeightChart({ weight }) {
  const { startDate, startWeight, goalDate, goalWeight, logs } = weight
  const start = parseISO(startDate).getTime()
  const end = parseISO(goalDate).getTime()
  const slope = (goalWeight - startWeight) / Math.max(1, end - start)

  const points = [{ t: start, actual: startWeight }, ...logs.filter((l) => l.date !== startDate).map((l) => ({ t: parseISO(l.date).getTime(), actual: l.weight }))]
    .sort((a, b) => a.t - b.t)
    .map((p) => ({ ...p, target: Math.round((startWeight + slope * (p.t - start)) * 10) / 10 }))

  const weights = points.map((p) => p.actual).concat([startWeight, goalWeight])
  const min = Math.floor(Math.min(...weights) - 1)
  const max = Math.ceil(Math.max(...weights) + 1)

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="currentColor" className="text-slate-100 dark:text-slate-800" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={[start, end]}
            tickFormatter={(t) => formatShort(new Date(t).toISOString().slice(0, 10))}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis domain={[min, max]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} tickMargin={4} />
          <Tooltip
            labelFormatter={(t) => formatShort(new Date(t).toISOString().slice(0, 10))}
            formatter={(v, name) => [`${v} kg`, name === 'actual' ? 'Poids' : 'Objectif']}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 13 }}
          />
          <Line type="monotone" dataKey="target" stroke="#c7d2fe" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="url(#weightGradient)"
            strokeWidth={3}
            dot={{ r: 3.5, fill: '#6366f1', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <ReferenceDot x={end} y={goalWeight} r={5} fill="#10b981" stroke="white" strokeWidth={2} />
          <defs>
            <linearGradient id="weightGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
