import type { Stop } from './api/stops'

export interface LngLat {
  lng: number
  lat: number
}

/** Great-circle distance in metres (haversine). */
export function distanceMetres(a: LngLat, b: LngLat): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Closest stops to a point, nearest first, within maxMetres. */
export function nearestStops(
  stops: Map<string, Stop>,
  from: LngLat,
  limit = 8,
  maxMetres = 800,
): { stop: Stop; metres: number }[] {
  const result: { stop: Stop; metres: number }[] = []
  for (const stop of stops.values()) {
    const metres = distanceMetres(from, stop)
    if (metres <= maxMetres) result.push({ stop, metres })
  }
  return result.sort((a, b) => a.metres - b.metres).slice(0, limit)
}
