import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { seedEntries, seedWeight } from '../data/seed'

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage unavailable (private mode, quota) — app still works in-memory
    }
  }, [state])

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
    }),
    [state, upsertEntry, deleteEntry, addWeightLog, deleteWeightLog, updateGoal, resetAll, replaceAll],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
