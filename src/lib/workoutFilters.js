import { addDays, todayISO } from './format'

export const PERIODS = ['Tout', '7 jours', '30 jours', 'Personnalisée']
const PERIOD_DAYS = { '7 jours': 7, '30 jours': 30 }

export const NO_FILTERS = { types: [], period: 'Tout', from: '', to: '' }

function dateRange({ period, from, to }) {
  if (PERIOD_DAYS[period]) return { from: addDays(todayISO(), 1 - PERIOD_DAYS[period]), to: '' }
  if (period === 'Personnalisée') return { from, to }
  return { from: '', to: '' }
}

export function matchesFilters(workout, filters) {
  if (filters.types.length > 0 && !filters.types.includes(workout.session)) return false
  const { from, to } = dateRange(filters)
  return (!from || workout.date >= from) && (!to || workout.date <= to)
}

export function activeFilterCount(filters) {
  const { from, to } = dateRange(filters)
  return (filters.types.length > 0 ? 1 : 0) + (from || to ? 1 : 0)
}
