import { Trash2 } from 'lucide-react'
import { formatDay } from '../lib/format'
import { SESSION_COLORS } from '../lib/sessionColors'

const BULLET_LINE = /^(\s*)[-*•]\s+(.*)$/

export default function WorkoutCard({ workout, onEdit, onDelete }) {
  return (
    <div className="animate-pop rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-neutral-800 dark:shadow-none">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onEdit} className="flex-1 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
          {formatDay(workout.date)}
        </button>
        <div className="flex items-center gap-2">
          <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${SESSION_COLORS[workout.session]}`}>
            {workout.session}
          </span>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 active:scale-90 hover:text-rose-500 dark:text-slate-600"
            aria-label="Supprimer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <button type="button" onClick={onEdit} className="mt-3 flex w-full flex-col gap-1 text-left text-sm">
        {workout.content.split('\n').map((line, i) => {
          const bullet = line.match(BULLET_LINE)
          if (!bullet) {
            return (
              <p key={i} className="min-h-5 whitespace-pre-wrap break-words text-slate-600 dark:text-slate-300">
                {line}
              </p>
            )
          }
          const [, indent, text] = bullet
          return indent ? (
            <p key={i} className="flex gap-2 break-words pl-5 text-slate-500 dark:text-slate-400">
              <span aria-hidden="true">◦</span>
              <span className="min-w-0">{text}</span>
            </p>
          ) : (
            <p key={i} className="flex gap-2 break-words font-medium text-slate-700 dark:text-slate-200">
              <span aria-hidden="true" className="text-orange-500">
                •
              </span>
              <span className="min-w-0">{text}</span>
            </p>
          )
        })}
      </button>
    </div>
  )
}
