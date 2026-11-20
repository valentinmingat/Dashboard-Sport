import { useState } from 'react'
import SegmentedControl from './SegmentedControl'
import { SESSION_TYPES } from '../data/seed'
import { SESSION_COLORS } from '../lib/sessionColors'
import { formatLong, todayISO } from '../lib/format'

const PLACEHOLDER = '- Triple Attack biceps : 3 x 8 x 20\n- Tirage vertical : 3 x 8 x (50 / 60 / 65)'

export default function WorkoutForm({ initial, existingDates = [], sessionForDate, onSave, onCancel }) {
  const isNew = !initial
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [session, setSession] = useState(initial?.session ?? sessionForDate(date))
  const [sessionPicked, setSessionPicked] = useState(!isNew)
  const [content, setContent] = useState(initial?.content ?? '')
  const dateTaken = isNew && existingDates.includes(date)
  const canSave = !dateTaken && content.trim().length > 0

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSave) onSave({ date, session, content: content.trimEnd() })
      }}
    >
      {isNew ? (
        <Field label="Date">
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => {
              setDate(e.target.value)
              if (!sessionPicked) setSession(sessionForDate(e.target.value))
            }}
            className="input"
          />
          {dateTaken && <span className="text-xs font-medium text-rose-500">Une séance est déjà enregistrée à cette date.</span>}
        </Field>
      ) : (
        <p className="-mt-1 text-sm text-slate-400">{formatLong(date)}</p>
      )}

      <Field label="Séance">
        <SegmentedControl
          options={SESSION_TYPES}
          value={session}
          onChange={(v) => {
            setSession(v)
            setSessionPicked(true)
          }}
          colorFor={(o) => SESSION_COLORS[o]}
        />
      </Field>

      <Field label="Détail de la séance">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          placeholder={PLACEHOLDER}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-700 placeholder:text-slate-300 focus:border-orange-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200 dark:placeholder:text-slate-500"
        />
      </Field>

      <div className="mt-1 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-600 active:scale-[0.98] dark:bg-neutral-800 dark:text-slate-300"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="flex-1 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 py-3 text-sm font-semibold text-white shadow-md shadow-red-600/30 active:scale-[0.98] disabled:opacity-40"
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
