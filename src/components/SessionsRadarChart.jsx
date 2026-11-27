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

// The two lower labels sit centered under their vertex instead of beside it,
// so they never run past the edge of the card, even with two-digit counts.
function AngleTick({ x, y, cy, payload }) {
  const below = y > cy
  return (
    <text x={x} y={below ? y + 14 : y} textAnchor="middle" fontSize={14} className="fill-slate-400">
      {payload.value}
    </text>
  )
}

export default function SessionsRadarChart({ counts }) {
  const byType = Object.fromEntries(counts.map(({ type, count }) => [type, count]))
  const data = ORDER.map((type) => {
    const count = byType[type] ?? 0
    return { type: `${DISPLAY_LABELS[type]} ${count}`, count }
  })

  return (
    <div className="sessions-radar h-64 w-full text-accent">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="60%">
          <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-neutral-700" />
          <PolarAngleAxis dataKey="type" tick={AngleTick} />
          <Radar
            dataKey="count"
            stroke="currentColor"
            strokeWidth={2}
            fill="currentColor"
            fillOpacity={0.3}
            dot={{ r: 3, fill: 'currentColor', strokeWidth: 0 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
