import { useMemo, useState } from 'react'
import { Plus, Trash2, Flag, Target } from 'lucide-react'
import { useStore } from '../lib/store'
import { formatShort, todayISO } from '../lib/format'
import { latestWeight, weightProgress } from '../lib/stats'
import WeightChart from '../components/WeightChart'
import Sheet from '../components/Sheet'
import NumberStepper from '../components/NumberStepper'

export default function Weight() {
  const { weight, addWeightLog, deleteWeightLog } = useStore()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(() => ({ date: todayISO(), value: latestWeight(weight) }))

  const sortedLogs = useMemo(() => [...weight.logs].sort((a, b) => (a.date < b.date ? 1 : -1)), [weight.logs])
  const current = latestWeight(weight)
  const progress = weightProgress(weight)
  const gain = weight.goalWeight >= weight.startWeight

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-4">
      <header className="flex items-center justify-between px-1">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Poids</h1>
        <button
          type="button"
          onClick={() => {
            setDraft({ date: todayISO(), value: current })
            setOpen(true)
          }}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 active:scale-95"
        >
          <Plus size={16} strokeWidth={2.5} />
          Peser
        </button>
      </header>

      <section className="animate-pop rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-slate-800 dark:shadow-none">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Flag size={14} /> Départ {weight.startWeight} {weight.unit}
          </span>
          <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <Target size={14} /> Objectif {weight.goalWeight} {weight.unit}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{current}</span> {weight.unit} actuellement ·{' '}
          {gain ? '+' : ''}
          {Math.round((current - weight.startWeight) * 10) / 10} {weight.unit} depuis le départ
        </p>
      </section>

      <section className="animate-pop rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-slate-800 dark:shadow-none">
        <WeightChart weight={weight} />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="px-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Historique des pesées</h2>
        {sortedLogs.map((log) => (
          <div
            key={log.id}
            className="animate-pop flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-sm shadow-slate-200/60 dark:bg-slate-800 dark:shadow-none"
          >
            <span className="text-sm text-slate-500 dark:text-slate-400">{formatShort(log.date)}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {log.weight} {weight.unit}
              </span>
              <button
                type="button"
                onClick={() => confirm('Supprimer cette pesée ?') && deleteWeightLog(log.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 active:scale-90 hover:text-rose-500 dark:text-slate-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </section>

      <Sheet open={open} title="Nouvelle pesée" onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Date</span>
            <input
              type="date"
              value={draft.date}
              max={todayISO()}
              onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              className="input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Poids</span>
            <NumberStepper value={draft.value} onChange={(v) => setDraft((d) => ({ ...d, value: v }))} step={0.1} min={20} max={250} suffix={` ${weight.unit}`} />
          </div>
          <div className="mt-1 flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-600 active:scale-[0.98] dark:bg-slate-800 dark:text-slate-300"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                addWeightLog({ date: draft.date, weight: draft.value })
                setOpen(false)
              }}
              className="flex-1 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 active:scale-[0.98]"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}
