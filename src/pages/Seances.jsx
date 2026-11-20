import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../lib/store'
import { SESSION_TYPES } from '../data/seed'
import WorkoutCard from '../components/WorkoutCard'
import WorkoutForm from '../components/WorkoutForm'
import Sheet from '../components/Sheet'

export default function Seances() {
  const { workouts, entries, upsertWorkout, deleteWorkout } = useStore()
  const [target, setTarget] = useState(null)

  const sorted = useMemo(() => [...workouts].sort((a, b) => (a.date < b.date ? 1 : -1)), [workouts])
  const existingDates = useMemo(() => workouts.map((w) => w.date), [workouts])
  const sessionForDate = (date) => entries.find((e) => e.date === date)?.session ?? SESSION_TYPES[0]

  const editingWorkout = target === 'new' ? null : workouts.find((w) => w.date === target)
  const sheetOpen = target !== null

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
      <header className="flex items-center justify-between px-1">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Séances</h1>
        <button
          type="button"
          onClick={() => setTarget('new')}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-br from-orange-500 to-red-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-red-600/25 active:scale-95"
        >
          <Plus size={16} strokeWidth={2.5} />
          Ajouter
        </button>
      </header>

      {sorted.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-400">Aucune séance enregistrée pour l'instant.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((workout) => (
            <WorkoutCard
              key={workout.date}
              workout={workout}
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
            existingDates={existingDates}
            sessionForDate={sessionForDate}
            onCancel={() => setTarget(null)}
            onSave={(workout) => {
              upsertWorkout(workout)
              setTarget(null)
            }}
          />
        )}
      </Sheet>
    </div>
  )
}
