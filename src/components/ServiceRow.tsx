import { useState } from 'react'
import type { Arrival, BusType, Load, Service } from '../api/arrivals'
import type { Stop } from '../api/stops'

const LOAD_LABEL: Record<Load, string> = {
  SEA: 'Seats available',
  SDA: 'Standing available',
  LSD: 'Limited standing',
}

const TYPE_LABEL: Record<BusType, string> = {
  SD: 'Single deck',
  DD: 'Double deck',
  BD: 'Bendy',
}

function formatMinutes(minutes: number) {
  return minutes === 0 ? 'Arr' : `${minutes} min`
}

function formatClock(time: Date) {
  return time.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false })
}

interface Props {
  service: Service
  stops: Map<string, Stop> | null
  pinned?: boolean
  onTogglePin?: () => void // shown only when the stop is a favourite
}

/** One bus: compact by default (number, crowding, next arrivals); tap to expand all details. */
export function ServiceRow({ service, stops, pinned, onTogglePin }: Props) {
  const [open, setOpen] = useState(false)
  const [first, ...later] = service.arrivals
  const destination = first && (stops?.get(first.destinationCode)?.name ?? first.destinationCode)

  return (
    <li className="service">
      <div className="service-main">
        <button className="service-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span className="bus-no">{service.no}</span>
          {first ? (
            <>
              <span className={`load load-${first.load}`} title={LOAD_LABEL[first.load]} />
              <span className="next">{formatMinutes(first.minutes)}</span>
              <span className="later">{later.map((a) => formatMinutes(a.minutes)).join(' · ')}</span>
            </>
          ) : (
            <span className="later span-rest">No estimate</span>
          )}
        </button>
        {onTogglePin && (
          <button
            className={`pin ${pinned ? 'pinned' : ''}`}
            aria-pressed={pinned}
            aria-label={pinned ? `Hide bus ${service.no} from home` : `Show bus ${service.no} on home`}
            onClick={onTogglePin}
          >
            {pinned ? '★' : '☆'}
          </button>
        )}
      </div>

      {open && first && (
        <div className="details">
          {destination && <p className="destination">To {destination}</p>}
          <ul>
            {service.arrivals.map((a: Arrival, i) => (
              <li key={i}>
                <strong>{formatMinutes(a.minutes)}</strong> ({formatClock(a.time)}) · {LOAD_LABEL[a.load]} ·{' '}
                {TYPE_LABEL[a.type]}
                {a.wheelchair && ' · ♿'}
                {!a.monitored && <span className="scheduled"> · scheduled</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}
