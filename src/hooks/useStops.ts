import { useEffect, useState } from 'react'
import { getStops, type Stop } from '../api/stops'

/** All bus stops keyed by code, or null while loading (or if loading failed). */
export function useStops(): Map<string, Stop> | null {
  const [stops, setStops] = useState<Map<string, Stop> | null>(null)
  useEffect(() => {
    let cancelled = false
    getStops()
      .then((s) => !cancelled && setStops(s))
      .catch(() => {}) // names are a nice-to-have; screens fall back to stop codes
    return () => {
      cancelled = true
    }
  }, [])
  return stops
}
