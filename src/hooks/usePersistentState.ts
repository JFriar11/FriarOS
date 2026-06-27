import { useEffect, useState } from 'react'

const storageKey = 'athlete-os-v2'

export function loadStoredState<T>(fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function usePersistentState<T>(fallback: T) {
  const [state, setState] = useState<T>(() => loadStoredState(fallback))

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state])

  return [state, setState] as const
}
