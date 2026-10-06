// Static stop data (names, roads, coordinates) from busrouter.sg.
// Fetched once per session; the browser's HTTP cache keeps it for a day.

const STOPS_URL = 'https://data.busrouter.sg/v1/stops.min.json'

export interface Stop {
  code: string
  name: string
  road: string
  lat: number
  lng: number
}

let stopsPromise: Promise<Map<string, Stop>> | null = null

export function getStops(): Promise<Map<string, Stop>> {
  stopsPromise ??= fetch(STOPS_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Stops request failed (${res.status})`)
      return res.json() as Promise<Record<string, [number, number, string, string]>>
    })
    .then((data) => {
      const stops = new Map<string, Stop>()
      for (const [code, [lng, lat, name, road]] of Object.entries(data)) {
        stops.set(code, { code, name, road, lat, lng })
      }
      return stops
    })
    .catch((e) => {
      stopsPromise = null // allow a retry next time
      throw e
    })
  return stopsPromise
}
