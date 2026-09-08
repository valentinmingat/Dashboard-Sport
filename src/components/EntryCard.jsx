import { Moon, Utensils, Sparkles, Trash2, Dumbbell } from 'lucide-react'
import { formatDay } from '../lib/format'

const RESULT_STYLES = {
  Bon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  Neutre: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  Mauvais: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
}

export default function EntryCard({ entry, onEdit, onDelete }) {
  const supplements = [entry.gainer && 'Gainer/Whey', entry.creatine && 'Créatine', entry.collagen && 'Collagène'].filter(Boolean)

  return (
    <div className="animate-pop rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-slate-800 dark:shadow-none">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onEdit} className="flex-1 text-left">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatDay(entry.date)}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {entry.session && (
              <span className="flex items-center gap-1">
                <Dumbbell size={13} /> {entry.session}
              </span>
            )}
            {entry.sleep != null && (
              <span className="flex items-center gap-1">
                <Moon size={13} /> {entry.sleep} h
              </span>
            )}
            {entry.meals != null && (
              <span className="flex items-center gap-1">
                <Utensils size={13} /> {entry.meals} repas
              </span>
            )}
            {supplements.length > 0 && (
              <span className="flex items-center gap-1">
                <Sparkles size={13} /> {supplements.length}
              </span>
            )}
          </div>
        </button>
        <div className="flex items-center gap-2">
          {entry.result && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${RESULT_STYLES[entry.result]}`}>{entry.result}</span>
          )}
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
      {entry.notes && <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">"{entry.notes}"</p>}
    </div>
  )
}
