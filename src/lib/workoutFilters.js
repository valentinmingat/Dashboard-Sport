import { addDays, todayISO } from './format'
import { workoutDetail } from './workouts'

export const PERIODS = ['Tout', '7 jours', '30 jours', 'Personnalisée']
const PERIOD_DAYS = { '7 jours': 7, '30 jours': 30 }

export const NO_FILTERS = { types: [], exercise: '', period: 'Tout', from: '', to: '' }

function dateRange({ period, from, to }) {
  if (PERIOD_DAYS[period]) return { from: addDays(todayISO(), 1 - PERIOD_DAYS[period]), to: '' }
  if (period === 'Personnalisée') return { from, to }
  return { from: '', to: '' }
}

// exerciseMatch comes from exerciseMatcher(history, filters.exercise).
export function matchesFilters(workout, filters, exerciseMatch = null) {
  if (filters.types.length > 0 && !filters.types.includes(workout.session)) return false
  if (exerciseMatch && !workoutDetail(workout).exercises.some((ex) => exerciseMatch(ex.name))) return false
  const { from, to } = dateRange(filters)
  return (!from || workout.date >= from) && (!to || workout.date <= to)
}

export function activeFilterCount(filters) {
  const { from, to } = dateRange(filters)
  return (filters.types.length > 0 ? 1 : 0) + (filters.exercise.trim() ? 1 : 0) + (from || to ? 1 : 0)
}
