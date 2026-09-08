import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../lib/store'
import { todayISO, addDays } from '../lib/format'
import EntryCard from '../components/EntryCard'
import Sheet from '../components/Sheet'
import EntryForm from '../components/EntryForm'

export default function Journal() {
  const { entries, upsertEntry, deleteEntry } = useStore()
  const [target, setTarget] = useState(null)

  const sorted = useMemo(() => [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)), [entries])
  const existingDates = useMemo(() => entries.map((e) => e.date), [entries])

  const nextDate = useMemo(() => {
    if (!existingDates.includes(todayISO())) return todayISO()
    let d = addDays(sorted[0]?.date ?? todayISO(), 1)
    if (d > todayISO()) d = todayISO()
    return d
  }, [existingDates, sorted])

  const editingEntry = target === 'new' ? null : entries.find((e) => e.date === target)
  const sheetOpen = target !== null

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
      <header className="flex items-center justify-between px-1">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Journal</h1>
        <button
          type="button"
          onClick={() => setTarget('new')}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 active:scale-95"
        >
          <Plus size={16} strokeWidth={2.5} />
          Ajouter
        </button>
      </header>

      {sorted.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-400">Aucune journée enregistrée pour l'instant.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={() => setTarget(entry.date)}
              onDelete={() => {
                if (confirm('Supprimer cette journée ?')) deleteEntry(entry.id)
              }}
            />
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} title={target === 'new' ? 'Nouvelle journée' : 'Modifier la journée'} onClose={() => setTarget(null)}>
        {sheetOpen && (
          <EntryForm
            date={target === 'new' ? nextDate : target}
            initial={editingEntry}
            dateEditable={target === 'new'}
            existingDates={existingDates}
            onCancel={() => setTarget(null)}
            onSave={(entry) => {
              upsertEntry(entry)
              setTarget(null)
            }}
          />
        )}
      </Sheet>
    </div>
  )
}
