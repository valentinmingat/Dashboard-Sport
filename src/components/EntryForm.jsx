import { useState } from 'react'
import { Wind, Beaker, Droplets, FlaskConical } from 'lucide-react'
import Toggle from './Toggle'
import SegmentedControl from './SegmentedControl'
import NumberStepper from './NumberStepper'
import { SESSION_TYPES, RESULTS } from '../data/seed'
import { formatLong, todayISO } from '../lib/format'

const RESULT_COLORS = {
  Bon: 'bg-emerald-500 text-white',
  Neutre: 'bg-amber-500 text-white',
  Mauvais: 'bg-rose-500 text-white',
}

const EMPTY = {
  stretching: false,
  session: 'Repos',
  meals: 3,
  gainer: false,
  creatine: false,
  collagen: false,
  sleep: 8,
  result: 'Bon',
  notes: '',
}

function mergeDefined(base, override) {
  const merged = { ...base }
  if (override) {
    for (const key of Object.keys(override)) {
      if (override[key] !== null && override[key] !== undefined) merged[key] = override[key]
    }
  }
  return merged
}

export default function EntryForm({ date, initial, dateEditable = false, existingDates = [], onSave, onCancel }) {
  const [form, setForm] = useState(() => mergeDefined(EMPTY, initial))
  const [selectedDate, setSelectedDate] = useState(date)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const dateTaken = dateEditable && selectedDate !== date && existingDates.includes(selectedDate)

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (dateTaken) return
        onSave({ date: selectedDate, ...form })
      }}
    >
      {dateEditable ? (
        <Field label="Date">
          <input
            type="date"
            value={selectedDate}
            max={todayISO()}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input"
          />
          {dateTaken && <span className="text-xs font-medium text-rose-500">Cette date est déjà enregistrée.</span>}
        </Field>
      ) : (
        <p className="-mt-1 text-sm text-slate-400">{formatLong(selectedDate)}</p>
      )}

      <Field label="Étirements">
        <Toggle label={form.stretching ? 'Fait' : 'Non fait'} value={form.stretching} onChange={(v) => set({ stretching: v })} icon={Wind} />
      </Field>

      <Field label="Séance">
        <SegmentedControl options={SESSION_TYPES} value={form.session} onChange={(v) => set({ session: v })} />
      </Field>

      <Field label="Repas">
        <NumberStepper value={form.meals} onChange={(v) => set({ meals: v })} min={0} max={10} suffix=" repas" />
      </Field>

      <Field label="Sommeil">
        <NumberStepper value={form.sleep} onChange={(v) => set({ sleep: v })} step={0.5} min={0} max={14} suffix=" h" />
      </Field>

      <Field label="Suppléments">
        <div className="grid grid-cols-3 gap-2">
          <Toggle label="Gainer" value={form.gainer} onChange={(v) => set({ gainer: v })} icon={FlaskConical} />
          <Toggle label="Créatine" value={form.creatine} onChange={(v) => set({ creatine: v })} icon={Beaker} />
          <Toggle label="Collagène" value={form.collagen} onChange={(v) => set({ collagen: v })} icon={Droplets} />
        </div>
      </Field>

      <Field label="Résultat du jour">
        <SegmentedControl options={RESULTS} value={form.result} onChange={(v) => set({ result: v })} colorFor={(o) => RESULT_COLORS[o]} />
      </Field>

      <Field label="Notes">
        <textarea
          value={form.notes}
          onChange={(e) => set({ notes: e.target.value })}
          rows={3}
          placeholder="Une remarque sur la journée…"
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        />
      </Field>

      <div className="mt-1 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-600 active:scale-[0.98] dark:bg-slate-800 dark:text-slate-300"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={dateTaken}
          className="flex-1 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-40"
        >
          Enregistrer
        </button>
      </div>
    </form>
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
