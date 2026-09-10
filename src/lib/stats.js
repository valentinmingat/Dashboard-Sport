import { addDays, todayISO } from './format'

export function average(nums) {
  const clean = nums.filter((n) => typeof n === 'number' && !Number.isNaN(n))
  if (!clean.length) return 0
  return Math.round((clean.reduce((a, b) => a + b, 0) / clean.length) * 10) / 10
}

export function resultCounts(entries) {
  return entries.reduce(
    (acc, e) => {
      if (e.result && acc[e.result] != null) acc[e.result] += 1
      return acc
    },
    { Bon: 0, Neutre: 0, Mauvais: 0 },
  )
}

export function currentStreak(entries, predicate) {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1))
  let streak = 0
  for (const e of sorted) {
    if (predicate(e)) streak += 1
    else break
  }
  return streak
}

export function attendanceStreak(entries) {
  const dates = new Set(entries.map((e) => e.date))
  let cursor = todayISO()
  if (!dates.has(cursor)) cursor = addDays(cursor, -1)
  let streak = 0
  while (dates.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function latestWeight(weight) {
  if (!weight.logs.length) return weight.startWeight
  const sorted = [...weight.logs].sort((a, b) => (a.date > b.date ? 1 : -1))
  return sorted[sorted.length - 1].weight
}

export function weightProgress(weight) {
  const current = latestWeight(weight)
  const total = weight.goalWeight - weight.startWeight
  if (total === 0) return 1
  const done = current - weight.startWeight
  return Math.max(0, Math.min(1, done / total))
}
