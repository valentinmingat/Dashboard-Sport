// Séances are stored as { date, session, exercises, notes, content }, where each
// exercise is { name, sets: [{ reps, load }] } (numbers or null). `content` is a
// plain-text copy of the same séance, kept so an older version of the app still
// open on another device can show it.
//
// Séances saved before exercises existed only have free text in `content`. Lines
// written like "- Tirage vertical : 3 x 8 x (50 / 60 / 65)" are read as exercises,
// so they show up, filter and autocomplete like new ones; anything else is kept
// as notes. Nothing is rewritten until the séance is edited and saved again.

const AMOUNT = /^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/
const LEGACY_LINE = /^\s*(?:[-*•]\s*)?([^:]+?)\s*:\s*(.+?)\s*$/

export function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function cleanName(name) {
  return name.trim().replace(/\s+/g, ' ')
}

export function parseAmount(text) {
  const value = String(text ?? '').trim()
  return AMOUNT.test(value) ? Number(value.replace(',', '.')) : null
}

export function formatAmount(value) {
  return String(value).replace('.', ',')
}

export function formatSet({ reps, load }) {
  if (reps != null && load != null) return `${formatAmount(reps)} × ${formatAmount(load)} kg`
  if (reps != null) return `${formatAmount(reps)} rép.`
  return `${formatAmount(load)} kg`
}

// "8", "(50 / 60 / 65)" or "20 kg" -> list of numbers; "-" stands for a blank value.
function parseValues(token) {
  const items = token
    .trim()
    .replace(/^\((.*)\)\s*(kg)?$/i, '$1')
    .split('/')
    .map((item) => item.trim().replace(/\s*kg$/i, ''))
  const values = items.map((item) => (item === '-' ? null : parseAmount(item)))
  return values.every((value, i) => value !== null || items[i] === '-') ? values : null
}

function parseLegacyLine(line) {
  const match = line.match(LEGACY_LINE)
  if (!match) return null
  const parts = match[2].split(/\s*[x×]\s*/i)
  if (parts.length < 2 || parts.length > 3 || !/^\d{1,2}$/.test(parts[0])) return null
  const reps = parseValues(parts[1])
  const loads = parts.length === 3 ? parseValues(parts[2]) : [null]
  if (!reps || !loads) return null
  const total = Math.max(Number(parts[0]), reps.length, loads.length)
  if (total < 1) return null
  const sets = Array.from({ length: total }, (_, i) => ({
    reps: reps[Math.min(i, reps.length - 1)],
    load: loads[Math.min(i, loads.length - 1)],
  }))
  return { name: match[1].trim(), sets }
}

export function cleanNotes(text) {
  return text.replace(/\s+$/, '').replace(/^(?:[ \t]*\n)+/, '')
}

export function parseLegacyContent(content) {
  const exercises = []
  const notes = []
  for (const line of content.split('\n')) {
    const exercise = parseLegacyLine(line)
    if (exercise) exercises.push(exercise)
    else notes.push(line)
  }
  return { exercises, notes: cleanNotes(notes.join('\n')) }
}

export function workoutDetail(workout) {
  if (Array.isArray(workout.exercises)) return { exercises: workout.exercises, notes: workout.notes ?? '' }
  return parseLegacyContent(workout.content ?? '')
}

function formatValues(values) {
  const items = values.map((value) => (value == null ? '-' : formatAmount(value)))
  return items.every((item) => item === items[0]) ? items[0] : `(${items.join(' / ')})`
}

function exerciseLine({ name, sets }) {
  if (sets.length === 0) return `- ${name}`
  const parts = [sets.length, formatValues(sets.map((set) => set.reps))]
  if (sets.some((set) => set.load != null)) parts.push(formatValues(sets.map((set) => set.load)))
  return `- ${name} : ${parts.join(' x ')}`
}

export function workoutContent(exercises, notes) {
  return [...exercises.map(exerciseLine), notes].filter(Boolean).join('\n')
}

// Every exercise ever logged, keyed by normalized name. Uses are newest first,
// and the map itself is ordered by most recent use.
export function exerciseHistory(workouts) {
  const history = new Map()
  const newestFirst = [...workouts].sort((a, b) => (a.date < b.date ? 1 : -1))
  for (const workout of newestFirst) {
    for (const exercise of workoutDetail(workout).exercises) {
      const key = normalizeName(exercise.name)
      if (!key) continue
      if (!history.has(key)) history.set(key, { name: cleanName(exercise.name), uses: [] })
      history.get(key).uses.push({ date: workout.date, session: workout.session, sets: exercise.sets })
    }
  }
  return history
}

export function previousUse(history, name, beforeDate) {
  return history.get(normalizeName(name))?.uses.find((use) => use.date < beforeDate) ?? null
}

function matchRank(key, query) {
  if (key.startsWith(query)) return 0
  if (key.split(' ').some((word) => word.startsWith(query))) return 1
  return -1
}

// Names starting with the query come first, then names with a word starting
// with it; each group stays in most-recently-used order.
export function searchExercises(history, query) {
  const q = normalizeName(query)
  return [...history.entries()]
    .map(([key, { name }]) => ({ name, rank: matchRank(key, q) }))
    .filter(({ rank }) => rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .map(({ name }) => name)
}

// Exact name when the query is a known exercise, otherwise a live search.
export function exerciseMatcher(history, query) {
  const q = normalizeName(query)
  if (!q) return null
  if (history.has(q)) return (name) => normalizeName(name) === q
  return (name) => matchRank(normalizeName(name), q) >= 0
}
