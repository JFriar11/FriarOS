import { useEffect, useState } from 'react'
import { getAuthSessionState, loadRemoteAppState, saveRemoteAppState } from '../lib/supabaseData'

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
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const sessionState = await getAuthSessionState()
      if (cancelled) {
        return
      }

      if (sessionState.isAuthenticated) {
        try {
          const remoteState = await loadRemoteAppState()
          if (!cancelled && remoteState) {
            setState((prev) => {
              const previous = prev as Record<string, unknown>
              const next = { ...previous, ...remoteState }
              window.localStorage.setItem(storageKey, JSON.stringify(next))
              return next as T
            })
          }
        } catch {
          // fall back to local state when remote sync fails
        }
      }

      if (!cancelled) {
        setIsHydrated(true)
      }
    }

    hydrate()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    window.localStorage.setItem(storageKey, JSON.stringify(state))

    void (async () => {
      const sessionState = await getAuthSessionState()
      if (sessionState.isAuthenticated) {
        try {
          await saveRemoteAppState(state as never)
        } catch {
          // ignore sync failures and preserve local state
        }
      }
    })()
  }, [state, isHydrated])

  return [state, setState] as const
}
