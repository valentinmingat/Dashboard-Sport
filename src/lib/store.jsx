import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { EMPTY_WEIGHT } from '../data/seed'
import {
  isConfigured,
  watchAuth,
  completeLoginIfNeeded,
  sendLoginLink,
  completeLoginWithLink,
  logout as firebaseLogout,
  fetchEntriesOnce,
  writeCloudEntry,
  deleteCloudEntry,
  subscribeEntries,
  fetchGoalOnce,
  writeCloudGoal,
  subscribeGoal,
  fetchWeightLogsOnce,
  writeCloudWeightLog,
  deleteCloudWeightLog,
  subscribeWeightLogs,
  fetchWorkoutsOnce,
  writeCloudWorkout,
  deleteCloudWorkout,
  subscribeWorkouts,
  fetchLegacyDoc,
  deleteLegacyDoc,
} from './firebase'

const STORAGE_KEY = 'sport-track:v1'

function countFilled(obj) {
  return Object.values(obj).filter((v) => v !== null && v !== undefined && v !== '').length
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { workouts: [], ...JSON.parse(raw) }
  } catch {
    // ignore corrupted storage
  }
  return { entries: [], weight: EMPTY_WEIGHT, workouts: [] }
}

function describeError(err) {
  return err?.code || err?.message || String(err)
}

function describeWorkoutError(err) {
  return `Séances : ${describeError(err)}`
}

function hasValidDate(item) {
  return typeof item?.date === 'string' && item.date.length > 0
}

function byDateDesc(a, b) {
  return a.date < b.date ? 1 : -1
}

async function replaceCloudWorkouts(uid, workouts) {
  const valid = workouts.filter(hasValidDate)
  const keepDates = new Set(valid.map((w) => w.date))
  const cloud = await fetchWorkoutsOnce(uid)
  await Promise.all(valid.map((w) => writeCloudWorkout(uid, w)))
  await Promise.all(cloud.filter((w) => !keepDates.has(w.date)).map((w) => deleteCloudWorkout(uid, w.date)))
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(loadInitial)
  const [user, setUser] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle') // idle | syncing | synced | error
  const [syncError, setSyncError] = useState('')
  const stateRef = useRef(state)
  const userRef = useRef(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage unavailable (private mode, quota) — app still works in-memory
    }
  }, [state])

  // One-time reconciliation of whatever is currently local into the cloud
  // (per-date entries/weight-logs collections + one goal doc), resolving
  // conflicts only where a date genuinely exists on both sides. Everything
  // that exists only in the cloud needs no handling here at all: the live
  // subscriptions set up right after this always reflect the full set of
  // documents, from every device that has ever written one.
  const reconcileWithCloud = useCallback(async (uid) => {
    setSyncStatus('syncing')
    setSyncError('')
    // Read local data before the first await: the live subscriptions start in
    // parallel and replace state with the cloud's copy as soon as it lands,
    // which would hide anything that so far only exists on this device.
    const local = stateRef.current
    try {
      let cloudEntries = await fetchEntriesOnce(uid)
      let cloudGoal = await fetchGoalOnce(uid)
      let cloudLogs = await fetchWeightLogsOnce(uid)

      // One-off migration from the old single-document { entries, weight }
      // format, if this account still has data there. Each of the three new
      // stores is backfilled independently — one already having a document
      // (e.g. from an earlier interrupted attempt) must never block
      // migrating the other two, or they'd stay empty forever.
      if (cloudEntries.length === 0 || !cloudGoal || cloudLogs.length === 0) {
        const legacy = await fetchLegacyDoc(uid)
        if (cloudEntries.length === 0 && legacy && Array.isArray(legacy.entries) && legacy.entries.length > 0) {
          const validLegacyEntries = legacy.entries.filter(hasValidDate)
          await Promise.all(validLegacyEntries.map((e) => writeCloudEntry(uid, e)))
          cloudEntries = validLegacyEntries
        }
        if (!cloudGoal && legacy?.weight) {
          const { logs: _legacyLogs, ...goal } = legacy.weight
          await writeCloudGoal(uid, goal)
          cloudGoal = goal
        }
        if (cloudLogs.length === 0 && Array.isArray(legacy?.weight?.logs) && legacy.weight.logs.length > 0) {
          const validLegacyLogs = legacy.weight.logs.filter(hasValidDate)
          await Promise.all(validLegacyLogs.map((l) => writeCloudWeightLog(uid, l)))
          cloudLogs = validLegacyLogs
        }
      }

      const cloudEntryMap = new Map(cloudEntries.map((e) => [e.date, e]))
      await Promise.all(
        local.entries.filter(hasValidDate).map((entry) => {
          const cloud = cloudEntryMap.get(entry.date)
          if (!cloud) return writeCloudEntry(uid, entry)
          const localTime = entry.updatedAt ?? 0
          const cloudTime = cloud.updatedAt ?? 0
          const localWins = localTime !== cloudTime ? localTime > cloudTime : countFilled(entry) > countFilled(cloud)
          return localWins ? writeCloudEntry(uid, entry) : null
        }),
      )

      if (!cloudGoal) {
        const { logs: _logs, ...goal } = local.weight
        await writeCloudGoal(uid, goal)
      }

      const cloudLogMap = new Map(cloudLogs.map((l) => [l.date, l]))
      await Promise.all(
        (local.weight.logs ?? [])
          .filter(hasValidDate)
          .filter((l) => !cloudLogMap.has(l.date))
          .map((l) => writeCloudWeightLog(uid, l)),
      )
    } catch (err) {
      setSyncStatus('error')
      setSyncError(describeError(err))
      return
    }

    // Séances live in their own collection under their own security rule, so
    // a failure here (e.g. that rule not added yet) must not undo the sync above.
    try {
      const cloudWorkoutMap = new Map((await fetchWorkoutsOnce(uid)).map((w) => [w.date, w]))
      await Promise.all(
        local.workouts.filter(hasValidDate).map((workout) => {
          const cloud = cloudWorkoutMap.get(workout.date)
          const localWins = !cloud || (workout.updatedAt ?? 0) > (cloud.updatedAt ?? 0)
          return localWins ? writeCloudWorkout(uid, workout) : null
        }),
      )
      setSyncStatus('synced')
    } catch (err) {
      setSyncStatus('error')
      setSyncError(describeWorkoutError(err))
    }
  }, [])

  // Sign in from an email-link redirect, then track auth state.
  useEffect(() => {
    if (!isConfigured()) return
    completeLoginIfNeeded().catch(() => setSyncStatus('error'))
    const unsubscribe = watchAuth((firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setSyncStatus('idle')
        return
      }
      reconcileWithCloud(firebaseUser.uid)
    })
    return unsubscribe
  }, [reconcileWithCloud])

  // Live subscriptions: once signed in, these are the ongoing source of
  // truth, naturally unioning whatever any device has written.
  useEffect(() => {
    if (!user) return
    const onSubscriptionError = (err) => {
      setSyncStatus('error')
      setSyncError(describeError(err))
    }
    const unsubEntries = subscribeEntries(
      user.uid,
      (entries, isLocalWrite) => {
        if (isLocalWrite) return
        setState((prev) => ({ ...prev, entries: [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)) }))
      },
      onSubscriptionError,
    )
    const unsubGoal = subscribeGoal(
      user.uid,
      (goal, isLocalWrite) => {
        if (isLocalWrite) return
        setState((prev) => ({ ...prev, weight: { ...prev.weight, ...goal } }))
      },
      onSubscriptionError,
    )
    const unsubLogs = subscribeWeightLogs(
      user.uid,
      (logs, isLocalWrite) => {
        if (isLocalWrite) return
        setState((prev) => ({
          ...prev,
          weight: { ...prev.weight, logs: [...logs].sort((a, b) => (a.date > b.date ? 1 : -1)) },
        }))
      },
      onSubscriptionError,
    )
    const unsubWorkouts = subscribeWorkouts(
      user.uid,
      (workouts, isLocalWrite) => {
        if (isLocalWrite) return
        setState((prev) => ({ ...prev, workouts: [...workouts].sort(byDateDesc) }))
      },
      (err) => {
        setSyncStatus('error')
        setSyncError(describeWorkoutError(err))
      },
    )
    return () => {
      unsubEntries()
      unsubGoal()
      unsubLogs()
      unsubWorkouts()
    }
  }, [user])

  const upsertEntry = useCallback((entry) => {
    let mergedEntry
    setState((prev) => {
      const idx = prev.entries.findIndex((e) => e.date === entry.date)
      const entries = [...prev.entries]
      mergedEntry =
        idx >= 0 ? { ...entries[idx], ...entry, updatedAt: Date.now() } : { id: `e-${Date.now()}`, ...entry, updatedAt: Date.now() }
      if (idx >= 0) entries[idx] = mergedEntry
      else entries.push(mergedEntry)
      entries.sort((a, b) => (a.date < b.date ? 1 : -1))
      return { ...prev, entries }
    })
    if (userRef.current) {
      writeCloudEntry(userRef.current.uid, mergedEntry).catch((err) => setSyncError(describeError(err)))
    }
  }, [])

  const deleteEntry = useCallback((id) => {
    let deletedDate
    setState((prev) => {
      deletedDate = prev.entries.find((e) => e.id === id)?.date
      return { ...prev, entries: prev.entries.filter((e) => e.id !== id) }
    })
    if (userRef.current && deletedDate) {
      deleteCloudEntry(userRef.current.uid, deletedDate).catch((err) => setSyncError(describeError(err)))
    }
  }, [])

  const addWeightLog = useCallback((log) => {
    let mergedLog
    setState((prev) => {
      const idx = prev.weight.logs.findIndex((l) => l.date === log.date)
      const logs = [...prev.weight.logs]
      mergedLog = idx >= 0 ? { ...logs[idx], ...log } : { id: `w-${Date.now()}`, ...log }
      if (idx >= 0) logs[idx] = mergedLog
      else logs.push(mergedLog)
      logs.sort((a, b) => (a.date > b.date ? 1 : -1))
      return { ...prev, weight: { ...prev.weight, logs } }
    })
    if (userRef.current) {
      writeCloudWeightLog(userRef.current.uid, mergedLog).catch((err) => setSyncError(describeError(err)))
    }
  }, [])

  const deleteWeightLog = useCallback((id) => {
    let deletedDate
    setState((prev) => {
      deletedDate = prev.weight.logs.find((l) => l.id === id)?.date
      return { ...prev, weight: { ...prev.weight, logs: prev.weight.logs.filter((l) => l.id !== id) } }
    })
    if (userRef.current && deletedDate) {
      deleteCloudWeightLog(userRef.current.uid, deletedDate).catch((err) => setSyncError(describeError(err)))
    }
  }, [])

  const upsertWorkout = useCallback((workout) => {
    const existing = stateRef.current.workouts.find((w) => w.date === workout.date)
    const merged = { ...existing, ...workout, updatedAt: Date.now() }
    setState((prev) => ({
      ...prev,
      workouts: [...prev.workouts.filter((w) => w.date !== merged.date), merged].sort(byDateDesc),
    }))
    if (userRef.current) {
      writeCloudWorkout(userRef.current.uid, merged).catch((err) => setSyncError(describeWorkoutError(err)))
    }
  }, [])

  const deleteWorkout = useCallback((date) => {
    setState((prev) => ({ ...prev, workouts: prev.workouts.filter((w) => w.date !== date) }))
    if (userRef.current) {
      deleteCloudWorkout(userRef.current.uid, date).catch((err) => setSyncError(describeWorkoutError(err)))
    }
  }, [])

  const updateGoal = useCallback((goal) => {
    let mergedGoal
    setState((prev) => {
      mergedGoal = { ...prev.weight, ...goal }
      return { ...prev, weight: mergedGoal }
    })
    if (userRef.current) {
      const { logs: _logs, ...goalOnly } = mergedGoal
      writeCloudGoal(userRef.current.uid, goalOnly).catch((err) => setSyncError(describeError(err)))
    }
  }, [])

  // Write the new set to the cloud before deleting what's no longer wanted,
  // so a failure partway through never leaves the cloud briefly empty — the
  // live subscriptions would otherwise sync that emptiness straight back.
  const replaceCloudWith = useCallback(async (uid, entries, weight) => {
    const validEntries = entries.filter(hasValidDate)
    const validLogs = (weight.logs ?? []).filter(hasValidDate)
    const keepEntryDates = new Set(validEntries.map((e) => e.date))
    const keepLogDates = new Set(validLogs.map((l) => l.date))

    const [cloudEntries, cloudLogs] = await Promise.all([fetchEntriesOnce(uid), fetchWeightLogsOnce(uid)])

    await Promise.all(validEntries.map((e) => writeCloudEntry(uid, e)))
    const { logs: _logs, ...goal } = weight
    await writeCloudGoal(uid, goal)
    await Promise.all(validLogs.map((l) => writeCloudWeightLog(uid, l)))

    await Promise.all(cloudEntries.filter((e) => !keepEntryDates.has(e.date)).map((e) => deleteCloudEntry(uid, e.date)))
    await Promise.all(cloudLogs.filter((l) => !keepLogDates.has(l.date)).map((l) => deleteCloudWeightLog(uid, l.date)))
  }, [])

  const resetAll = useCallback(() => {
    setState({ entries: [], weight: EMPTY_WEIGHT, workouts: [] })
    const uid = userRef.current?.uid
    if (!uid) return
    // The pre-migration document would otherwise be re-imported into the now
    // empty collections on the next sync, undoing the reset.
    Promise.all([replaceCloudWith(uid, [], EMPTY_WEIGHT), deleteLegacyDoc(uid)]).catch((err) =>
      setSyncError(describeError(err)),
    )
    replaceCloudWorkouts(uid, []).catch((err) => setSyncError(describeWorkoutError(err)))
  }, [replaceCloudWith])

  const replaceAll = useCallback(
    (data) => {
      const entries = Array.isArray(data.entries) ? data.entries : []
      const weight = data.weight && typeof data.weight === 'object' ? data.weight : EMPTY_WEIGHT
      // Backups exported before Séances existed carry no workouts: keep the
      // current ones instead of wiping them.
      const workouts = Array.isArray(data.workouts) ? data.workouts : null
      setState((prev) => ({ entries, weight, workouts: workouts ?? prev.workouts }))
      const uid = userRef.current?.uid
      if (!uid) return
      replaceCloudWith(uid, entries, weight).catch((err) => setSyncError(describeError(err)))
      if (workouts) replaceCloudWorkouts(uid, workouts).catch((err) => setSyncError(describeWorkoutError(err)))
    },
    [replaceCloudWith],
  )

  const value = useMemo(
    () => ({
      entries: state.entries,
      weight: state.weight,
      workouts: state.workouts,
      upsertEntry,
      deleteEntry,
      addWeightLog,
      deleteWeightLog,
      upsertWorkout,
      deleteWorkout,
      updateGoal,
      resetAll,
      replaceAll,
      cloudEnabled: isConfigured(),
      user,
      syncStatus,
      syncError,
      resync: () => user && reconcileWithCloud(user.uid),
      sendLoginLink,
      completeLoginWithLink,
      logout: firebaseLogout,
    }),
    [
      state,
      upsertEntry,
      deleteEntry,
      addWeightLog,
      deleteWeightLog,
      upsertWorkout,
      deleteWorkout,
      updateGoal,
      resetAll,
      replaceAll,
      user,
      syncStatus,
      syncError,
      reconcileWithCloud,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
