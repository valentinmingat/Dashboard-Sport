import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { seedEntries, seedWeight } from '../data/seed'
import {
  isConfigured,
  watchAuth,
  completeLoginIfNeeded,
  sendLoginLink,
  logout as firebaseLogout,
  pullCloudData,
  pushCloudData,
  subscribeCloudData,
} from './firebase'

const STORAGE_KEY = 'sport-track:v1'

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore corrupted storage
  }
  return { entries: seedEntries, weight: seedWeight }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(loadInitial)
  const [user, setUser] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle') // idle | syncing | synced | error
  const skipNextPush = useRef(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage unavailable (private mode, quota) — app still works in-memory
    }
  }, [state])

  // Sign in from an email-link redirect, then track auth state.
  useEffect(() => {
    if (!isConfigured()) return
    completeLoginIfNeeded().catch(() => setSyncStatus('error'))
    const unsubscribe = watchAuth(async (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setSyncStatus('idle')
        return
      }
      setSyncStatus('syncing')
      try {
        const cloud = await pullCloudData(firebaseUser.uid)
        if (cloud && Array.isArray(cloud.entries)) {
          skipNextPush.current = true
          setState({ entries: cloud.entries, weight: cloud.weight ?? seedWeight })
        } else {
          await pushCloudData(firebaseUser.uid, state)
        }
        setSyncStatus('synced')
      } catch {
        setSyncStatus('error')
      }
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Apply changes made from another device.
  useEffect(() => {
    if (!user) return
    const unsubscribe = subscribeCloudData(user.uid, (data, isLocalWrite) => {
      if (isLocalWrite) return
      skipNextPush.current = true
      setState({ entries: data.entries ?? [], weight: data.weight ?? seedWeight })
    })
    return unsubscribe
  }, [user])

  // Push local changes to the cloud once signed in.
  useEffect(() => {
    if (!user) return
    if (skipNextPush.current) {
      skipNextPush.current = false
      return
    }
    setSyncStatus('syncing')
    pushCloudData(user.uid, state)
      .then(() => setSyncStatus('synced'))
      .catch(() => setSyncStatus('error'))
  }, [state, user])

  const upsertEntry = useCallback((entry) => {
    setState((prev) => {
      const idx = prev.entries.findIndex((e) => e.date === entry.date)
      const entries = [...prev.entries]
      if (idx >= 0) {
        entries[idx] = { ...entries[idx], ...entry }
      } else {
        entries.push({ id: `e-${Date.now()}`, ...entry })
      }
      entries.sort((a, b) => (a.date < b.date ? 1 : -1))
      return { ...prev, entries }
    })
  }, [])

  const deleteEntry = useCallback((id) => {
    setState((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }))
  }, [])

  const addWeightLog = useCallback((log) => {
    setState((prev) => {
      const idx = prev.weight.logs.findIndex((l) => l.date === log.date)
      const logs = [...prev.weight.logs]
      if (idx >= 0) {
        logs[idx] = { ...logs[idx], ...log }
      } else {
        logs.push({ id: `w-${Date.now()}`, ...log })
      }
      logs.sort((a, b) => (a.date > b.date ? 1 : -1))
      return { ...prev, weight: { ...prev.weight, logs } }
    })
  }, [])

  const deleteWeightLog = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      weight: { ...prev.weight, logs: prev.weight.logs.filter((l) => l.id !== id) },
    }))
  }, [])

  const updateGoal = useCallback((goal) => {
    setState((prev) => ({ ...prev, weight: { ...prev.weight, ...goal } }))
  }, [])

  const resetAll = useCallback(() => {
    setState({ entries: seedEntries, weight: seedWeight })
  }, [])

  const replaceAll = useCallback((data) => {
    setState({
      entries: Array.isArray(data.entries) ? data.entries : seedEntries,
      weight: data.weight && typeof data.weight === 'object' ? data.weight : seedWeight,
    })
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
      sendLoginLink,
      logout: firebaseLogout,
    }),
    [state, upsertEntry, deleteEntry, addWeightLog, deleteWeightLog, updateGoal, resetAll, replaceAll, user, syncStatus],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
