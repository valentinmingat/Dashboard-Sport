import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

const DISPLAY_LABELS = {
  'Pecs / Épaules / Triceps': 'Pecs / Épaules / Triceps',
  'Jambes': 'Jambes',
  'Biceps / Dos / Abdos': 'Biceps / Dos',
}

// Pecs/Épaules/Triceps is the longest label, so it goes to the top vertex
// (the only spot with enough width to stay on one line) and swaps places
// with Jambes, which fits fine at a side vertex.
const ORDER = ['Pecs / Épaules / Triceps', 'Jambes', 'Biceps / Dos / Abdos']

export default function SessionsRadarChart({ counts }) {
  const byType = Object.fromEntries(counts.map(({ type, count }) => [type, count]))
  const data = ORDER.map((type) => {
    const count = byType[type] ?? 0
    return { type: `${DISPLAY_LABELS[type]} ${count}`, count }
  })

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="60%">
          <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-neutral-700" />
          <PolarAngleAxis dataKey="type" tick={{ fontSize: 14, fill: '#94a3b8' }} />
          <Radar
            dataKey="count"
            stroke="#f97316"
            strokeWidth={2}
            fill="#f97316"
            fillOpacity={0.3}
            dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
