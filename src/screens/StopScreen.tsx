import type { Stop } from '../api/stops'
import { StopArrivals } from '../components/StopArrivals'
import { addFavourite, removeFavourite, useFavourites } from '../favourites'

export function StopScreen({ stopCode, stops }: { stopCode: string; stops: Map<string, Stop> | null }) {
  const favourite = useFavourites().find((f) => f.stopCode === stopCode)
  const stop = stops?.get(stopCode)

  return (
    <>
      <a className="back" href="#/">
        ← My buses
      </a>
      <div className="stop-heading">
        <div>
          <h1>{stop?.name ?? `Stop ${stopCode}`}</h1>
          <p className="stop-meta">
            {stopCode}
            {stop && ` · ${stop.road}`}
          </p>
        </div>
        <button
          className="save"
          onClick={() => (favourite ? removeFavourite(stopCode) : addFavourite(stopCode))}
        >
          {favourite ? '★ Saved' : '☆ Save stop'}
        </button>
      </div>
      {favourite && (
        <p className="hint">Tap ☆ on a bus to show only your chosen buses on the home screen.</p>
      )}
      <StopArrivals stopCode={stopCode} stops={stops} favourite={favourite} />
    </>
  )
}
