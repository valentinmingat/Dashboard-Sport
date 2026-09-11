import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { seedEntries, seedWeight } from '../data/seed'
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
  fetchLegacyDoc,
} from './firebase'

const STORAGE_KEY = 'sport-track:v1'

function countFilled(obj) {
  return Object.values(obj).filter((v) => v !== null && v !== undefined && v !== '').length
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore corrupted storage
  }
  return { entries: seedEntries, weight: seedWeight }
}

function describeError(err) {
  return err?.code || err?.message || String(err)
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
    try {
      let cloudEntries = await fetchEntriesOnce(uid)
      let cloudGoal = await fetchGoalOnce(uid)
      let cloudLogs = await fetchWeightLogsOnce(uid)

      // One-off migration from the old single-document { entries, weight }
      // format, if this account still has data there and nothing yet in
      // the new collections.
      if (cloudEntries.length === 0 && cloudLogs.length === 0 && !cloudGoal) {
        const legacy = await fetchLegacyDoc(uid)
        if (legacy && Array.isArray(legacy.entries) && legacy.entries.length > 0) {
          await Promise.all(legacy.entries.map((e) => writeCloudEntry(uid, e)))
          cloudEntries = legacy.entries
        }
        if (legacy?.weight) {
          const { logs, ...goal } = legacy.weight
          await writeCloudGoal(uid, goal)
          cloudGoal = goal
          if (Array.isArray(logs) && logs.length > 0) {
            await Promise.all(logs.map((l) => writeCloudWeightLog(uid, l)))
            cloudLogs = logs
          }
        }
      }

      const cloudEntryMap = new Map(cloudEntries.map((e) => [e.date, e]))
      await Promise.all(
        stateRef.current.entries.map((local) => {
          const cloud = cloudEntryMap.get(local.date)
          if (!cloud) return writeCloudEntry(uid, local)
          const localTime = local.updatedAt ?? 0
          const cloudTime = cloud.updatedAt ?? 0
          const localWins = localTime !== cloudTime ? localTime > cloudTime : countFilled(local) > countFilled(cloud)
          return localWins ? writeCloudEntry(uid, local) : null
        }),
      )

      if (!cloudGoal) {
        const { logs: _logs, ...goal } = stateRef.current.weight
        await writeCloudGoal(uid, goal)
      }

      const cloudLogMap = new Map(cloudLogs.map((l) => [l.date, l]))
      await Promise.all(
        (stateRef.current.weight.logs ?? [])
          .filter((l) => !cloudLogMap.has(l.date))
          .map((l) => writeCloudWeightLog(uid, l)),
      )

      setSyncStatus('synced')
    } catch (err) {
      setSyncStatus('error')
      setSyncError(describeError(err))
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
    const unsubEntries = subscribeEntries(user.uid, (entries, isLocalWrite) => {
      if (isLocalWrite) return
      setState((prev) => ({ ...prev, entries: [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)) }))
    })
    const unsubGoal = subscribeGoal(user.uid, (goal, isLocalWrite) => {
      if (isLocalWrite) return
      setState((prev) => ({ ...prev, weight: { ...prev.weight, ...goal } }))
    })
    const unsubLogs = subscribeWeightLogs(user.uid, (logs, isLocalWrite) => {
      if (isLocalWrite) return
      setState((prev) => ({
        ...prev,
        weight: { ...prev.weight, logs: [...logs].sort((a, b) => (a.date > b.date ? 1 : -1)) },
      }))
    })
    return () => {
      unsubEntries()
      unsubGoal()
      unsubLogs()
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

  const resetAll = useCallback(() => {
    setState({ entries: seedEntries, weight: seedWeight })
    const uid = userRef.current?.uid
    if (!uid) return
    ;(async () => {
      try {
        const [cloudEntries, cloudLogs] = await Promise.all([fetchEntriesOnce(uid), fetchWeightLogsOnce(uid)])
        await Promise.all(cloudEntries.map((e) => deleteCloudEntry(uid, e.date)))
        await Promise.all(cloudLogs.map((l) => deleteCloudWeightLog(uid, l.date)))
        await Promise.all(seedEntries.map((e) => writeCloudEntry(uid, e)))
        const { logs, ...goal } = seedWeight
        await writeCloudGoal(uid, goal)
        await Promise.all((logs ?? []).map((l) => writeCloudWeightLog(uid, l)))
      } catch (err) {
        setSyncError(describeError(err))
      }
    })()
  }, [])

  const replaceAll = useCallback((data) => {
    const entries = Array.isArray(data.entries) ? data.entries : seedEntries
    const weight = data.weight && typeof data.weight === 'object' ? data.weight : seedWeight
    setState({ entries, weight })
    const uid = userRef.current?.uid
    if (!uid) return
    ;(async () => {
      try {
        const [cloudEntries, cloudLogs] = await Promise.all([fetchEntriesOnce(uid), fetchWeightLogsOnce(uid)])
        await Promise.all(cloudEntries.map((e) => deleteCloudEntry(uid, e.date)))
        await Promise.all(cloudLogs.map((l) => deleteCloudWeightLog(uid, l.date)))
        await Promise.all(entries.map((e) => writeCloudEntry(uid, e)))
        const { logs, ...goal } = weight
        await writeCloudGoal(uid, goal)
        await Promise.all((logs ?? []).map((l) => writeCloudWeightLog(uid, l)))
      } catch (err) {
        setSyncError(describeError(err))
      }
    })()
  }, [])

  const value = useMemo(
    () => ({
      entries: state.entries,
      weight: state.weight,
      upsertEntry,
      deleteEntry,
      addWeightLog,
      deleteWeightLog,
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
