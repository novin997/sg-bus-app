import type { Stop } from '../api/stops'
import { nearestStops, type LngLat } from '../geo'
import { stopHref } from '../hooks/useRoute'

interface Props {
  stops: Map<string, Stop> | null
  origin: LngLat
  fromGps: boolean
  gpsError: string | null
  onShowOnMap: (stop: Stop) => void
}

export function NearbyStops({ stops, origin, fromGps, gpsError, onShowOnMap }: Props) {
  const nearby = stops ? nearestStops(stops, origin) : []

  return (
    <section>
      <h2 className="nearby-title">{fromGps ? 'Stops near you' : 'Stops near map centre'}</h2>
      {gpsError && <p className="status">{gpsError}</p>}
      {!stops && <p className="status">Loading stops…</p>}
      {stops && nearby.length === 0 && <p className="status">No stops within 800 m. Move the map or zoom in.</p>}
      <ul className="nearby">
        {nearby.map(({ stop, metres }) => (
          <li key={stop.code}>
            <a href={stopHref(stop.code)}>
              <span className="stop-name">{stop.name}</span>
              <span className="stop-meta">
                {stop.code} · {stop.road} · {Math.round(metres)} m
              </span>
            </a>
            <button className="show-on-map" onClick={() => onShowOnMap(stop)} aria-label={`Show ${stop.name} on map`}>
              ◎
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
