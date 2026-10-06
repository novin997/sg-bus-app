import { useCallback, useEffect, useRef, useState } from 'react'
import { getArrivals, type Service } from '../api/arrivals'

const REFRESH_MS = 30_000

// Every mounted useArrivals registers its refresh here, so pull-to-refresh
// can update all visible stops at once.
const refreshers = new Set<() => Promise<void>>()

export function refreshAllArrivals(): Promise<void> {
  return Promise.all([...refreshers].map((r) => r())).then(() => {})
}

export interface ArrivalsState {
  services: Service[] | null // last good result; kept when a refresh fails
  error: string | null
  updatedAt: number | null
}

/** Live arrivals for a stop: refreshes every 30s while the page is visible, pauses when hidden. */
export function useArrivals(stopCode: string): ArrivalsState {
  const [state, setState] = useState<ArrivalsState>({ services: null, error: null, updatedAt: null })
  const inFlight = useRef<AbortController | null>(null)

  const refresh = useCallback(async () => {
    inFlight.current?.abort()
    const controller = new AbortController()
    inFlight.current = controller
    try {
      const services = await getArrivals(stopCode, controller.signal)
      setState({ services, error: null, updatedAt: Date.now() })
    } catch (e) {
      if (controller.signal.aborted) return
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e) }))
    }
  }, [stopCode])

  useEffect(() => {
    let timer: number | undefined
    const stop = () => {
      window.clearInterval(timer)
      timer = undefined
    }
    const start = () => {
      stop()
      void refresh()
      timer = window.setInterval(refresh, REFRESH_MS)
    }
    const onVisibilityChange = () => (document.hidden ? stop() : start())

    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibilityChange)
    refreshers.add(refresh)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      refreshers.delete(refresh)
      inFlight.current?.abort()
    }
  }, [refresh])

  return state
}
