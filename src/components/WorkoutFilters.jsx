import SegmentedControl from './SegmentedControl'
import ExerciseNameInput from './ExerciseNameInput'
import { SESSION_TYPES } from '../data/seed'
import { SESSION_COLORS } from '../lib/sessionColors'
import { PERIODS, NO_FILTERS, activeFilterCount } from '../lib/workoutFilters'
import { todayISO } from '../lib/format'
import { searchExercises } from '../lib/workouts'

export default function WorkoutFilters({ filters, history, onChange, resultCount, onClose }) {
  const set = (patch) => onChange({ ...filters, ...patch })
  // Nothing typed yet: every exercise, alphabetically, to browse.
  const exerciseSuggestions = (query) =>
    query.trim()
      ? searchExercises(history, query)
      : [...history.values()].map((h) => h.name).sort((a, b) => a.localeCompare(b, 'fr'))

  return (
    <div className="flex flex-col gap-5">
      <Field label="Type de séance">
        <SegmentedControl
          multiple
          options={SESSION_TYPES}
          value={filters.types}
          onChange={(types) => set({ types })}
          colorFor={(o) => SESSION_COLORS[o]}
        />
      </Field>

      <Field label="Exercice">
        {history.size > 0 ? (
          <ExerciseNameInput
            value={filters.exercise}
            placeholder="Tous les exercices"
            clearable
            onChange={(exercise) => set({ exercise })}
            onPick={(exercise) => set({ exercise })}
            suggestionsFor={exerciseSuggestions}
          />
        ) : (
          <p className="text-xs text-slate-400">Les exercices de tes séances apparaîtront ici.</p>
        )}
      </Field>

      <Field label="Période">
        <SegmentedControl options={PERIODS} value={filters.period} onChange={(period) => set({ period })} />
        {filters.period === 'Personnalisée' && (
          <div className="mt-1 grid grid-cols-2 gap-3">
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs text-slate-400 dark:text-slate-500">Du</span>
              <input
                type="date"
                value={filters.from}
                max={filters.to || todayISO()}
                onChange={(e) => set({ from: e.target.value })}
                className="input"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs text-slate-400 dark:text-slate-500">Au</span>
              <input
                type="date"
                value={filters.to}
                min={filters.from}
                max={todayISO()}
                onChange={(e) => set({ to: e.target.value })}
                className="input"
              />
            </label>
          </div>
        )}
      </Field>

      <div className="mt-1 flex gap-3">
        <button
          type="button"
          onClick={() => onChange(NO_FILTERS)}
          disabled={activeFilterCount(filters) === 0}
          className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-600 active:scale-[0.98] disabled:opacity-40 dark:bg-neutral-800 dark:text-slate-300"
        >
          Réinitialiser
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 py-3 text-sm font-semibold text-white shadow-md shadow-red-600/30 active:scale-[0.98]"
        >
          {resultCount === 0 ? 'Aucune séance' : `Afficher ${resultCount} séance${resultCount > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
      {children}
    </div>
  )
}
