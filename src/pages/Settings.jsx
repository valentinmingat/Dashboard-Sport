import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useStore } from '../lib/store'

export default function Settings() {
  const { weight, updateGoal, resetAll } = useStore()
  const [form, setForm] = useState(weight)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const [saved, setSaved] = useState(false)

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-4">
      <header className="px-1">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Réglages</h1>
      </header>

      <section className="animate-pop flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-slate-800 dark:shadow-none">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Objectif de poids</h2>

        <Row label="Date de départ">
          <input type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} className="input" />
        </Row>
        <Row label="Poids de départ (kg)">
          <input
            type="number"
            step="0.1"
            value={form.startWeight}
            onChange={(e) => set({ startWeight: Number(e.target.value) })}
            className="input"
          />
        </Row>
        <Row label="Date objectif">
          <input type="date" value={form.goalDate} onChange={(e) => set({ goalDate: e.target.value })} className="input" />
        </Row>
        <Row label="Poids objectif (kg)">
          <input
            type="number"
            step="0.1"
            value={form.goalWeight}
            onChange={(e) => set({ goalWeight: Number(e.target.value) })}
            className="input"
          />
        </Row>

        <button
          type="button"
          onClick={() => {
            updateGoal(form)
            setSaved(true)
            setTimeout(() => setSaved(false), 1500)
          }}
          className="mt-1 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 active:scale-[0.98]"
        >
          {saved ? 'Enregistré ✓' : 'Enregistrer'}
        </button>
      </section>

      <section className="animate-pop rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60 dark:bg-slate-800 dark:shadow-none">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Données</h2>
        <button
          type="button"
          onClick={() => {
            if (confirm('Réinitialiser toutes les données ? Cette action est irréversible.')) resetAll()
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 py-3 text-sm font-semibold text-rose-600 active:scale-[0.98] dark:bg-rose-500/10 dark:text-rose-400"
        >
          <RotateCcw size={15} />
          Réinitialiser les données
        </button>
      </section>

      <p className="px-1 text-center text-xs text-slate-300 dark:text-slate-600">
        Sport Track · données stockées localement sur cet appareil
      </p>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
      {children}
    </label>
  )
}
