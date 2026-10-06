import { lazy, Suspense } from 'react'
import { refreshAllArrivals } from './hooks/useArrivals'
import { usePullToRefresh } from './hooks/usePullToRefresh'
import { useRoute } from './hooks/useRoute'
import { useStops } from './hooks/useStops'
import { Home } from './screens/Home'
import { StopScreen } from './screens/StopScreen'
import './App.css'

// MapLibre is large, so the map screen loads only when opened.
const MapScreen = lazy(() => import('./screens/MapScreen'))

export default function App() {
  const route = useRoute()
  const stops = useStops()
  const { pull, refreshing, ready } = usePullToRefresh(refreshAllArrivals)

  return (
    <main className="app">
      {(pull > 0 || refreshing) && (
        <div className="pull-indicator" style={{ height: refreshing ? 40 : pull / 2 }}>
          {refreshing ? 'Refreshing…' : ready ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      )}

      {route.name === 'stop' && <StopScreen key={route.stopCode} stopCode={route.stopCode} stops={stops} />}
      {route.name === 'map' && (
        <Suspense fallback={<p className="status">Loading map…</p>}>
          <MapScreen stops={stops} />
        </Suspense>
      )}
      {route.name === 'home' && <Home stops={stops} />}

      <footer>
        Data © LTA, OneMap &amp; OpenStreetMap contributors, via Arrivelah &amp; busrouter.sg
      </footer>
    </main>
  )
}
