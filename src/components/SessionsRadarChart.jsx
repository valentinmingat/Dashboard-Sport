import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

const SHORT_LABELS = {
  'Jambes': 'Jambes',
  'Pecs / Épaules / Triceps': 'Pecs',
  'Biceps / Dos / Abdos': 'Biceps',
}

export default function SessionsRadarChart({ counts }) {
  const data = counts.map(({ type, count }) => ({ type: SHORT_LABELS[type] ?? type, count }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="65%">
          <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-neutral-700" />
          <PolarAngleAxis dataKey="type" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Radar
            dataKey="count"
            stroke="#f97316"
            strokeWidth={2}
            fill="#f97316"
            fillOpacity={0.3}
            dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
            label={{ fontSize: 12, fontWeight: 600, fill: '#fdba74' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
