import { useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeftRight, History, Plus, X } from 'lucide-react'
import SegmentedControl from './SegmentedControl'
import ExerciseNameInput from './ExerciseNameInput'
import { SESSION_TYPES } from '../data/seed'
import { SESSION_COLORS } from '../lib/sessionColors'
import { formatDay, formatLong, formatShort, todayISO } from '../lib/format'
import {
  cleanName,
  cleanNotes,
  formatAmount,
  formatSet,
  normalizeName,
  parseAmount,
  previousUse,
  searchExercises,
  toStoredExercise,
  UNITS,
  workoutContent,
  workoutDetail,
} from '../lib/workouts'

const MAX_SUGGESTIONS = 8

let lastId = 0
const nextId = () => ++lastId

const toText = (value) => (value == null ? '' : formatAmount(value))
const formSets = (sets) => sets.map((set) => ({ id: nextId(), reps: toText(set.reps), amount: toText(set.amount) }))
const formExercises = (exercises) =>
  exercises.map((ex) => ({ id: nextId(), name: ex.name, unit: ex.unit, sets: formSets(ex.sets) }))
const emptyExercise = () => ({ id: nextId(), name: '', unit: UNITS.kg, sets: [{ id: nextId(), reps: '', amount: '' }] })

// Most exercises are weighted; the column switches to minutes for timed ones.
const AMOUNT_COLUMN = {
  kg: { title: 'Charge (kg)', field: 'Charge en kg', switchTo: 'Passer en temps (minutes)' },
  min: { title: 'Temps (min)', field: 'Temps en minutes', switchTo: 'Passer en charge (kg)' },
}

const isBlankSet = (set) => !set.reps && !set.amount
const isBlankExercise = (ex) => !ex.name.trim() && ex.sets.every(isBlankSet)

const onlyDigits = (text) => text.replace(/\D/g, '').slice(0, 3)
const onlyDecimal = (text) =>
  text
    .replace(/[^\d.,]/g, '')
    .replace(/^([^.,]*[.,])(.*)$/, (_, head, tail) => head + tail.replace(/[.,]/g, ''))
    .slice(0, 6)

function cleanExercise(ex) {
  return {
    name: cleanName(ex.name),
    unit: ex.unit,
    sets: ex.sets
      .map((set) => ({ reps: parseAmount(set.reps), amount: parseAmount(set.amount) }))
      .filter((set) => set.reps != null || set.amount != null),
  }
}

export default function WorkoutForm({ initial, workouts = [], history, sessionForDate, onSave, onCancel }) {
  const isNew = !initial
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [session, setSession] = useState(initial?.session ?? sessionForDate(date))
  const [sessionPicked, setSessionPicked] = useState(!isNew)
  const [exercises, setExercises] = useState(() => {
    const saved = initial ? workoutDetail(initial).exercises : []
    return saved.length > 0 ? formExercises(saved) : [emptyExercise()]
  })
  const [notes, setNotes] = useState(() => (initial ? workoutDetail(initial).notes : ''))
  const [notesOpen, setNotesOpen] = useState(notes !== '')
  const [focusId, setFocusId] = useState(null)

  const dateTaken = isNew && workouts.some((w) => w.date === date)

  // The last séance of the same kind, offered as a starting point for a new one.
  const template = useMemo(() => {
    if (!isNew) return null
    return (
      [...workouts]
        .filter((w) => w.session === session && w.date < date)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((w) => ({ date: w.date, exercises: workoutDetail(w).exercises }))
        .find((w) => w.exercises.length > 0) ?? null
    )
  }, [isNew, workouts, session, date])

  const cleaned = exercises.map(cleanExercise)
  const kept = cleaned.filter((ex) => ex.name)
  const missingName = (i) => !cleaned[i].name && cleaned[i].sets.length > 0
  const finalNotes = cleanNotes(notes)
  const canSave = !dateTaken && !exercises.some((_, i) => missingName(i)) && (kept.length > 0 || finalNotes !== '')

  const updateExercise = (id, change) => setExercises((list) => list.map((ex) => (ex.id === id ? change(ex) : ex)))

  const updateSet = (exerciseId, setId, patch) =>
    updateExercise(exerciseId, (ex) => ({ ...ex, sets: ex.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)) }))

  // A new set starts from the previous one: most sets repeat the same numbers.
  const addSet = (exerciseId) =>
    updateExercise(exerciseId, (ex) => {
      const last = ex.sets[ex.sets.length - 1]
      return { ...ex, sets: [...ex.sets, { id: nextId(), reps: last?.reps ?? '', amount: last?.amount ?? '' }] }
    })

  const toggleUnit = (exerciseId) =>
    updateExercise(exerciseId, (ex) => ({ ...ex, unit: ex.unit === UNITS.kg ? UNITS.min : UNITS.kg }))

  const removeSet = (exerciseId, setId) =>
    updateExercise(exerciseId, (ex) => ({ ...ex, sets: ex.sets.filter((set) => set.id !== setId) }))

  const addExercise = () => {
    const exercise = emptyExercise()
    // Committing synchronously lets the new field take focus inside the tap,
    // which is what makes iOS open the keyboard.
    flushSync(() => {
      setExercises((list) => [...list, exercise])
      setFocusId(exercise.id)
    })
  }

  const removeExercise = (ex) => {
    if (!isBlankExercise(ex) && !confirm(`Supprimer l'exercice${ex.name.trim() ? ` « ${ex.name.trim()} »` : ''} ?`)) return
    setExercises((list) => list.filter((item) => item.id !== ex.id))
  }

  // Picking a known exercise fills in its sets (and kg or minutes) from last
  // time, unless some were already typed.
  const pickName = (id, name) =>
    updateExercise(id, (ex) => {
      const previous = previousUse(history, name, date)
      if (!previous || previous.sets.length === 0 || !ex.sets.every(isBlankSet)) return { ...ex, name }
      return { ...ex, name, unit: previous.unit, sets: formSets(previous.sets) }
    })

  const suggestionsFor = (id) => (query) => {
    const taken = new Set(exercises.filter((ex) => ex.id !== id).map((ex) => normalizeName(ex.name)))
    const names = query.trim()
      ? searchExercises(history, query)
      : [...history.values()].filter((h) => h.uses.some((use) => use.session === session)).map((h) => h.name)
    return names.filter((name) => !taken.has(normalizeName(name))).slice(0, MAX_SUGGESTIONS)
  }

  return (
    <form
      className="flex flex-col gap-5"
      onKeyDown={(e) => {
        // Enter in a field must not save a half-filled séance.
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault()
      }}
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSave) return
        onSave({
          date,
          session,
          exercises: kept.map(toStoredExercise),
          notes: finalNotes,
          content: workoutContent(kept, finalNotes),
        })
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
        <div className="flex flex-col gap-3">
          {template && exercises.every(isBlankExercise) && (
            <button
              type="button"
              onClick={() => setExercises(formExercises(template.exercises))}
              className="flex items-center gap-3 rounded-2xl border border-dashed border-orange-300 px-3.5 py-3 text-left active:scale-[0.98] dark:border-orange-500/40"
            >
              <History size={18} className="shrink-0 text-orange-500" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-orange-600 dark:text-orange-400">
                  Reprendre la séance du {formatDay(template.date).toLowerCase()}
                </span>
                <span className="block truncate text-xs text-slate-400">
                  {template.exercises.map((ex) => ex.name).join(', ')}
                </span>
              </span>
            </button>
          )}

          {exercises.map((ex, i) => {
            const previous = ex.name.trim() ? previousUse(history, ex.name, date) : null
            const column = AMOUNT_COLUMN[ex.unit]
            return (
              <div key={ex.id} className="flex flex-col gap-2.5 rounded-2xl bg-slate-50 p-3 dark:bg-neutral-800/50">
                <ExerciseNameInput
                  value={ex.name}
                  autoFocus={ex.id === focusId}
                  placeholder="Nom de l'exercice"
                  onChange={(name) => updateExercise(ex.id, (item) => ({ ...item, name }))}
                  onPick={(name) => pickName(ex.id, name)}
                  suggestionsFor={suggestionsFor(ex.id)}
                />
                {missingName(i) && <span className="text-xs font-medium text-rose-500">Indique le nom de l'exercice.</span>}
                {previous && previous.sets.length > 0 && (
                  <p className="px-1 text-xs text-slate-400">
                    Dernière fois ({formatShort(previous.date)}) :{' '}
                    {previous.sets.map((set) => formatSet(set, previous.unit)).join(' · ')}
                  </p>
                )}

                {ex.sets.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="grid grid-cols-[2.25rem_1fr_1fr_2rem] items-center gap-2 px-0.5 text-center text-[11px] font-medium text-slate-400">
                      <span>Série</span>
                      <span>Répétitions</span>
                      <button
                        type="button"
                        onClick={() => toggleUnit(ex.id)}
                        aria-label={`${column.title}. ${column.switchTo}`}
                        className={`mx-auto flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 active:scale-95 ${
                          ex.unit === UNITS.min
                            ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                            : 'bg-slate-200/70 text-slate-500 dark:bg-neutral-700/70 dark:text-slate-400'
                        }`}
                      >
                        {column.title}
                        <ArrowLeftRight size={10} strokeWidth={2.5} />
                      </button>
                      <span />
                    </div>
                    {ex.sets.map((set, n) => (
                      <div key={set.id} className="grid grid-cols-[2.25rem_1fr_1fr_2rem] items-center gap-2 px-0.5">
                        <span className="text-center text-sm font-semibold text-slate-400">{n + 1}</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          enterKeyHint="done"
                          value={set.reps}
                          placeholder="–"
                          aria-label={`Répétitions, série ${n + 1}`}
                          onChange={(e) => updateSet(ex.id, set.id, { reps: onlyDigits(e.target.value) })}
                          className={NUMBER_FIELD}
                        />
                        <input
                          type="text"
                          inputMode="decimal"
                          enterKeyHint="done"
                          value={set.amount}
                          placeholder="–"
                          aria-label={`${column.field}, série ${n + 1}`}
                          onChange={(e) => updateSet(ex.id, set.id, { amount: onlyDecimal(e.target.value) })}
                          className={NUMBER_FIELD}
                        />
                        <button
                          type="button"
                          onClick={() => removeSet(ex.id, set.id)}
                          aria-label={`Supprimer la série ${n + 1}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 active:scale-90 hover:text-rose-500 dark:text-slate-600"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 px-0.5">
                  <button
                    type="button"
                    onClick={() => addSet(ex.id)}
                    className="flex items-center gap-1 py-1 text-sm font-semibold text-orange-500 active:scale-95"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                    Ajouter une série
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExercise(ex)}
                    className="py-1 text-xs font-medium text-slate-400 active:scale-95 hover:text-rose-500"
                  >
                    Supprimer l'exercice
                  </button>
                </div>
              </div>
            )
          })}

          <button
            type="button"
            onClick={addExercise}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-orange-500 active:scale-[0.98] dark:border-neutral-700"
          >
            <Plus size={16} strokeWidth={2.5} />
            Ajouter un exercice
          </button>

          {notesOpen ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notes (ressenti, échauffement…)"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-700 placeholder:text-slate-300 focus:border-orange-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          ) : (
            <button
              type="button"
              onClick={() => setNotesOpen(true)}
              className="self-start px-1 text-xs font-medium text-slate-400 active:scale-95"
            >
              + Ajouter une note
            </button>
          )}
        </div>
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

const NUMBER_FIELD =
  'w-full min-w-0 appearance-none rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-700 placeholder:text-slate-300 focus:border-orange-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-200 dark:placeholder:text-slate-600'

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
      {children}
    </div>
  )
}
