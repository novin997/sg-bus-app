import { useState, type FormEvent } from 'react'
import type { Stop } from '../api/stops'
import { StopArrivals } from '../components/StopArrivals'
import { useFavourites } from '../favourites'
import { stopHref } from '../hooks/useRoute'

export function Home({ stops }: { stops: Map<string, Stop> | null }) {
  const favourites = useFavourites()
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)

  const openStop = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!/^\d{5}$/.test(trimmed)) return setCodeError('Stop codes are 5 digits, e.g. 83139.')
    if (stops && !stops.has(trimmed)) return setCodeError(`No bus stop ${trimmed}.`)
    setCodeError(null)
    window.location.hash = stopHref(trimmed)
  }

  return (
    <>
      <div className="home-heading">
        <h1>My buses</h1>
        <a className="map-button" href="#/map">
          Stops near me
        </a>
      </div>

      {favourites.length === 0 && (
        <p className="status">No favourites yet. Find a stop near you, or open one by code below, then tap “Save stop”.</p>
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
    </>
  )
}
