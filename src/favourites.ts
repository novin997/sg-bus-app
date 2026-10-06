import { useSyncExternalStore } from 'react'

// Favourites live in this browser only (no accounts).

export interface Favourite {
  stopCode: string
  buses: string[] // bus numbers to show on home; empty = all buses
}

const STORAGE_KEY = 'sgbus.favourites.v1'
const listeners = new Set<() => void>()

function load(): Favourite[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as Favourite[]) : []
  } catch {
    return []
  }
}

let favourites: Favourite[] = load()

function save(next: Favourite[]) {
  favourites = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage unavailable (e.g. private mode): keep favourites for this session only
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useFavourites(): Favourite[] {
  return useSyncExternalStore(subscribe, () => favourites)
}

export function isFavourite(stopCode: string) {
  return favourites.some((f) => f.stopCode === stopCode)
}

export function addFavourite(stopCode: string) {
  if (!isFavourite(stopCode)) save([...favourites, { stopCode, buses: [] }])
}

export function removeFavourite(stopCode: string) {
  save(favourites.filter((f) => f.stopCode !== stopCode))
}

/** Pin or unpin one bus at a favourite stop. Unpinning the last bus means "show all" again. */
export function toggleBus(stopCode: string, busNo: string) {
  save(
    favourites.map((f) => {
      if (f.stopCode !== stopCode) return f
      const buses = f.buses.includes(busNo) ? f.buses.filter((b) => b !== busNo) : [...f.buses, busNo]
      return { ...f, buses }
    }),
  )
}
