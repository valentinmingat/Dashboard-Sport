import { useMemo, useState } from 'react'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { useStore } from '../lib/store'
import { SESSION_TYPES } from '../data/seed'
import { NO_FILTERS, matchesFilters, activeFilterCount } from '../lib/workoutFilters'
import { exerciseHistory, exerciseMatcher } from '../lib/workouts'
import WorkoutCard from '../components/WorkoutCard'
import WorkoutForm from '../components/WorkoutForm'
import WorkoutFilters from '../components/WorkoutFilters'
import Sheet from '../components/Sheet'

export default function Seances() {
  const { workouts, entries, upsertWorkout, deleteWorkout } = useStore()
  const [target, setTarget] = useState(null)
  const [filters, setFilters] = useState(NO_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const sorted = useMemo(() => [...workouts].sort((a, b) => (a.date < b.date ? 1 : -1)), [workouts])
  const history = useMemo(() => exerciseHistory(workouts), [workouts])
  const exerciseMatch = useMemo(() => exerciseMatcher(history, filters.exercise), [history, filters.exercise])
  const visible = useMemo(() => sorted.filter((w) => matchesFilters(w, filters, exerciseMatch)), [sorted, filters, exerciseMatch])
  const filterCount = activeFilterCount(filters)
  const sessionForDate = (date) => entries.find((e) => e.date === date)?.session ?? SESSION_TYPES[0]

  const editingWorkout = target === 'new' ? null : workouts.find((w) => w.date === target)
  const sheetOpen = target !== null

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
      <header className="flex items-center justify-between px-1">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Séances</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold active:scale-95 ${
              filterCount > 0
                ? 'bg-accent/15 text-accent'
                : 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300'
            }`}
          >
            <SlidersHorizontal size={16} strokeWidth={2.25} />
            Filtres
            {filterCount > 0 && (
              <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent">
                {filterCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTarget('new')}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-br from-accent to-accent-2 px-3.5 py-2 text-sm font-semibold text-on-accent shadow-md shadow-accent-2/25 active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            Ajouter
          </button>
        </div>
      </header>

      {filterCount > 0 && sorted.length > 0 && (
        <div className="-mt-1 flex items-center justify-between px-1 text-xs text-slate-400">
          <span>
            {visible.length} séance{visible.length > 1 ? 's' : ''} sur {sorted.length}
          </span>
          <button type="button" onClick={() => setFilters(NO_FILTERS)} className="font-semibold text-accent">
            Effacer les filtres
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-400">Aucune séance enregistrée pour l'instant.</p>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-400">Aucune séance ne correspond aux filtres.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((workout) => (
            <WorkoutCard
              key={workout.date}
              workout={workout}
              exerciseMatch={exerciseMatch}
              onEdit={() => setTarget(workout.date)}
              onDelete={() => {
                if (confirm('Supprimer cette séance ?')) deleteWorkout(workout.date)
              }}
            />
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} title={target === 'new' ? 'Nouvelle séance' : 'Modifier la séance'} onClose={() => setTarget(null)}>
        {sheetOpen && (
          <WorkoutForm
            initial={editingWorkout}
            workouts={workouts}
            history={history}
            sessionForDate={sessionForDate}
            onCancel={() => setTarget(null)}
            onSave={(workout) => {
              upsertWorkout(workout)
              setTarget(null)
            }}
          />
        )}
      </Sheet>

      <Sheet open={filtersOpen} title="Filtres" onClose={() => setFiltersOpen(false)}>
        <WorkoutFilters
          filters={filters}
          history={history}
          onChange={setFilters}
          resultCount={visible.length}
          onClose={() => setFiltersOpen(false)}
        />
      </Sheet>
    </div>
  )
}
