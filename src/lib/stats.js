import { SESSION_TYPES } from '../data/seed'

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

export function bestStreak(entries, predicate) {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1))
  let best = 0
  let current = 0
  for (const e of sorted) {
    if (predicate(e)) {
      current += 1
      best = Math.max(best, current)
    } else {
      current = 0
    }
  }
  return best
}

export function sessionCounts(entries) {
  return SESSION_TYPES.map((type) => ({
    type,
    count: entries.filter((e) => e.session === type).length,
  }))
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
