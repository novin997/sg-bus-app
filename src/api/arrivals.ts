// All arrival fetching goes through this file, so the data source
// (currently Arrivelah) can be swapped without touching the UI.

const ARRIVELAH_URL = 'https://arrivelah2.busrouter.sg/'

export type Load = 'SEA' | 'SDA' | 'LSD' // seats / standing / limited standing
export type BusType = 'SD' | 'DD' | 'BD' // single / double deck / bendy

export interface Arrival {
  time: Date
  minutes: number // rounded down; 0 means arriving
  load: Load
  wheelchair: boolean
  type: BusType
  destinationCode: string
  monitored: boolean // false = scheduled time, not live GPS
  lat: number
  lng: number
}

export interface Service {
  no: string
  operator: string
  arrivals: Arrival[] // up to 3, soonest first
}

interface RawArrival {
  time?: string
  duration_ms?: number
  load?: Load
  feature?: string
  type?: BusType
  destination_code?: string
  monitored?: number
  lat?: number
  lng?: number
}

interface RawService {
  no: string
  operator: string
  next?: RawArrival
  next2?: RawArrival // `subsequent` is a legacy alias of next2, so it is ignored
  next3?: RawArrival
}

function toArrival(raw: RawArrival | undefined): Arrival | null {
  if (!raw?.time || raw.duration_ms === undefined) return null
  return {
    time: new Date(raw.time),
    minutes: Math.max(0, Math.floor(raw.duration_ms / 60000)),
    load: raw.load ?? 'SEA',
    wheelchair: raw.feature === 'WAB',
    type: raw.type ?? 'SD',
    destinationCode: raw.destination_code ?? '',
    monitored: raw.monitored === 1,
    lat: raw.lat ?? 0,
    lng: raw.lng ?? 0,
  }
}

export async function getArrivals(stopCode: string, signal?: AbortSignal): Promise<Service[]> {
  const res = await fetch(`${ARRIVELAH_URL}?id=${encodeURIComponent(stopCode)}`, { signal })
  if (!res.ok) throw new Error(`Arrivals request failed (${res.status})`)
  const data: { services?: RawService[] } = await res.json()

  return (data.services ?? [])
    .map((s) => ({
      no: s.no,
      operator: s.operator,
      arrivals: [s.next, s.next2, s.next3]
        .map(toArrival)
        .filter((a): a is Arrival => a !== null),
    }))
    .sort((a, b) => a.no.localeCompare(b.no, undefined, { numeric: true }))
}
