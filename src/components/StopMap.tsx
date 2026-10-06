import type { FeatureCollection } from 'geojson'
import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre 6 looks for its worker next to its own script, which Vite doesn't copy.
// Let Vite bundle the worker (with its shared chunk) and point MapLibre at it.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { Stop } from '../api/stops'
import { useFavourites } from '../favourites'
import { SINGAPORE, type LngLat } from '../geo'
import { stopHref } from '../hooks/useRoute'
import { applyDraculaMap, DRACULA, MAP_STYLE_URL } from '../mapTheme'

maplibregl.setWorkerUrl(workerUrl)

const PITCH_3D = 55
// Battery limits: cap the tilt, and only extrude buildings when zoomed in close.
const MAX_PITCH = 60
const BUILDINGS_3D_MIN_ZOOM = 15

function stopsGeoJSON(stops: Map<string, Stop>, favouriteCodes: Set<string>): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [...stops.values()].map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      properties: { code: s.code, name: s.name, favourite: favouriteCodes.has(s.code) },
    })),
  }
}

export interface StopMapHandle {
  flyTo: (stop: Stop) => void
}

interface Props {
  stops: Map<string, Stop> | null
  /** Where "nearby" is measured from: the user's GPS fix, else the map centre. */
  onOriginChange: (origin: LngLat, fromGps: boolean) => void
  onGpsError: (message: string | null) => void
  ref?: Ref<StopMapHandle>
}

/** Map with GPS: shows every stop; tap one to open it. */
export default function StopMap({ stops, onOriginChange, onGpsError, ref }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [is3D, setIs3D] = useState(true)
  const hasGpsFix = useRef(false)
  const favourites = useFavourites()

  // Callbacks change identity on every parent render; keep the latest without re-creating the map.
  const callbacks = useRef({ onOriginChange, onGpsError })
  useEffect(() => {
    callbacks.current = { onOriginChange, onGpsError }
  })

  // Create the map once.
  useEffect(() => {
    if (!container.current) return
    const map = new maplibregl.Map({
      container: container.current,
      style: MAP_STYLE_URL,
      center: [SINGAPORE.lng, SINGAPORE.lat],
      zoom: 11,
      pitch: PITCH_3D,
      maxPitch: MAX_PITCH,
      attributionControl: { compact: true },
    })
    mapRef.current = map

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true, maximumAge: 10_000 },
      trackUserLocation: true,
      fitBoundsOptions: { maxZoom: 16 },
    })
    map.addControl(geolocate, 'top-right')
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')

    geolocate.on('geolocate', (e) => {
      hasGpsFix.current = true
      callbacks.current.onGpsError(null)
      callbacks.current.onOriginChange({ lng: e.coords.longitude, lat: e.coords.latitude }, true)
    })
    geolocate.on('error', (e) => {
      hasGpsFix.current = false
      callbacks.current.onGpsError(
        e.code === GeolocationPositionError.PERMISSION_DENIED
          ? 'Location is off. Showing stops near the map centre instead.'
          : 'Could not get your location. Showing stops near the map centre instead.',
      )
    })

    // Keep the 2D/3D button in sync when the user tilts with two fingers.
    map.on('pitchend', () => setIs3D(map.getPitch() > 5))

    map.on('moveend', () => {
      if (hasGpsFix.current) return
      const c = map.getCenter()
      callbacks.current.onOriginChange({ lng: c.lng, lat: c.lat }, false)
    })

    map.on('load', () => {
      applyDraculaMap(map, BUILDINGS_3D_MIN_ZOOM)

      map.addSource('stops', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'stops',
        type: 'circle',
        source: 'stops',
        minzoom: 13,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 3, 17, 8],
          'circle-color': ['case', ['get', 'favourite'], DRACULA.pink, DRACULA.purple],
          'circle-stroke-color': DRACULA.bg,
          'circle-stroke-width': 1.5,
          'circle-pitch-alignment': 'map', // lie flat on the ground when tilted
        },
      })
      map.addLayer({
        id: 'stop-labels',
        type: 'symbol',
        source: 'stops',
        minzoom: 16,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 12,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
        },
        paint: { 'text-color': DRACULA.text, 'text-halo-color': DRACULA.bg, 'text-halo-width': 1.5 },
      })

      map.on('click', 'stops', (e: MapLayerMouseEvent) => {
        const feature = e.features?.[0]
        if (!feature || feature.geometry.type !== 'Point') return
        const { code, name } = feature.properties as { code: string; name: string }
        const link = document.createElement('a')
        link.href = stopHref(code)
        link.className = 'popup-link'
        link.textContent = `${name} (${code}) →`
        new maplibregl.Popup({ closeButton: false, offset: 10 })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setDOMContent(link)
          .addTo(map)
      })
      map.on('mouseenter', 'stops', () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', 'stops', () => (map.getCanvas().style.cursor = ''))

      setMapReady(true)
      geolocate.trigger() // ask for location straight away
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Keep the stop markers in sync with the stop data and favourites.
  useEffect(() => {
    if (!mapReady || !stops) return
    const codes = new Set(favourites.map((f) => f.stopCode))
    mapRef.current?.getSource<GeoJSONSource>('stops')?.setData(stopsGeoJSON(stops, codes))
  }, [mapReady, stops, favourites])

  useImperativeHandle(ref, () => ({
    flyTo: (stop) =>
      mapRef.current?.flyTo({
        center: [stop.lng, stop.lat],
        zoom: 17,
        pitch: (mapRef.current?.getPitch() ?? 0) > 5 ? PITCH_3D : 0,
      }),
  }))
  const toggle3D = () => mapRef.current?.easeTo({ pitch: is3D ? 0 : PITCH_3D, duration: 600 })

  return (
    <div className="map-wrap">
      <div ref={container} className="map" />
      <button className="pitch-toggle" onClick={toggle3D} aria-label={is3D ? 'Switch to flat map' : 'Switch to 3D map'}>
        {is3D ? '2D' : '3D'}
      </button>
    </div>
  )
}
