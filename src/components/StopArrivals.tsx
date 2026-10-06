import type { Stop } from '../api/stops'
import { toggleBus, type Favourite } from '../favourites'
import { useArrivals } from '../hooks/useArrivals'
import { ServiceRow } from './ServiceRow'

interface Props {
  stopCode: string
  stops: Map<string, Stop> | null
  favourite?: Favourite // when set, pin toggles are shown
  onlyPinned?: boolean // home view: show only the favourite's chosen buses
}

function formatUpdated(updatedAt: number) {
  return new Date(updatedAt).toLocaleTimeString('en-SG', { hour12: false })
}

export function StopArrivals({ stopCode, stops, favourite, onlyPinned }: Props) {
  const { services, error, updatedAt } = useArrivals(stopCode)
  const pinnedBuses = favourite?.buses ?? []
  const shown =
    onlyPinned && pinnedBuses.length > 0 ? services?.filter((s) => pinnedBuses.includes(s.no)) : services

  return (
    <>
      {error && <p className="status error">Couldn't refresh: {error}</p>}
      {!services && !error && <p className="status">Loading…</p>}
      {shown?.length === 0 && <p className="status">No buses in service right now.</p>}
      <ul className="services">
        {shown?.map((s) => (
          <ServiceRow
            key={s.no}
            service={s}
            stops={stops}
            pinned={pinnedBuses.includes(s.no)}
            onTogglePin={favourite && !onlyPinned ? () => toggleBus(stopCode, s.no) : undefined}
          />
        ))}
      </ul>
      {updatedAt && <p className="updated">Updated {formatUpdated(updatedAt)}</p>}
    </>
  )
}
