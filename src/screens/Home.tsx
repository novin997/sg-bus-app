import { lazy, Suspense, useRef, useState, type FormEvent } from 'react'
import type { Stop } from '../api/stops'
import { NearbyStops } from '../components/NearbyStops'
import { StopArrivals } from '../components/StopArrivals'
import type { StopMapHandle } from '../components/StopMap'
import { useFavourites } from '../favourites'
import { SINGAPORE, type LngLat } from '../geo'
import { stopHref } from '../hooks/useRoute'

// MapLibre is large, so the map loads separately and favourites never wait for it.
const StopMap = lazy(() => import('../components/StopMap'))

export function Home({ stops }: { stops: Map<string, Stop> | null }) {
  const favourites = useFavourites()
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [origin, setOrigin] = useState<{ pos: LngLat; fromGps: boolean }>({ pos: SINGAPORE, fromGps: false })
  const [gpsError, setGpsError] = useState<string | null>(null)
  const map = useRef<StopMapHandle>(null)

  const openStop = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!/^\d{5}$/.test(trimmed)) return setCodeError('Stop codes are 5 digits, e.g. 83139.')
    if (stops && !stops.has(trimmed)) return setCodeError(`No bus stop ${trimmed}.`)
    setCodeError(null)
    window.location.hash = stopHref(trimmed)
  }

  return (
    <div className="home-layout">
      <div className="home-map">
        <Suspense fallback={<div className="map-wrap map-loading">Loading map…</div>}>
          <StopMap
            ref={map}
            stops={stops}
            onOriginChange={(pos, fromGps) => setOrigin({ pos, fromGps })}
            onGpsError={setGpsError}
          />
        </Suspense>
      </div>

      <div className="home-side">
        <h1>My buses</h1>

        {favourites.length === 0 && (
          <p className="status">No favourites yet. Tap a stop on the map or in the list below, then tap “Save stop”.</p>
        )}

        {favourites.map((f) => {
          const stop = stops?.get(f.stopCode)
          return (
            <section key={f.stopCode} className="card">
              <a className="card-header" href={stopHref(f.stopCode)}>
                <span className="stop-name">{stop?.name ?? `Stop ${f.stopCode}`}</span>
                <span className="stop-meta">
                  {f.stopCode}
                  {stop && ` · ${stop.road}`}
                  {f.buses.length > 0 && ` · ${f.buses.length} bus${f.buses.length > 1 ? 'es' : ''} pinned`}
                </span>
              </a>
              <StopArrivals stopCode={f.stopCode} stops={stops} favourite={f} onlyPinned />
            </section>
          )
        })}

        <NearbyStops
          stops={stops}
          origin={origin.pos}
          fromGps={origin.fromGps}
          gpsError={gpsError}
          onShowOnMap={(stop) => {
            map.current?.flyTo(stop)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />

        <form className="open-stop" onSubmit={openStop}>
          <label htmlFor="stop-code">Open a stop</label>
          <div className="open-stop-row">
            <input
              id="stop-code"
              inputMode="numeric"
              placeholder="Stop code, e.g. 83139"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button type="submit">Open</button>
          </div>
          {codeError && <p className="status error">{codeError}</p>}
        </form>
      </div>
    </div>
  )
}
