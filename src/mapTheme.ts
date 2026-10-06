import type { Map as MapLibreMap } from 'maplibre-gl'

// Re-tints OpenFreeMap's "dark" style with the Dracula palette and adds 3D buildings
// (the dark style only has flat ones). Layer ids come from that style.

export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark'

export const DRACULA = {
  bg: '#282a36',
  deep: '#21222c',
  line: '#44475a',
  comment: '#6272a4',
  text: '#f8f8f2',
  purple: '#bd93f9',
  pink: '#ff79c6',
}

type PaintProperty = Parameters<MapLibreMap['setPaintProperty']>[1]

const PAINT: [layer: string, property: PaintProperty, value: string][] = [
  ['background', 'background-color', DRACULA.bg],
  ['water', 'fill-color', DRACULA.deep],
  ['waterway', 'line-color', DRACULA.deep],
  ['landuse_residential', 'fill-color', '#2b2d3a'],
  ['landcover_wood', 'fill-color', '#2a3236'],
  ['landuse_park', 'fill-color', '#2a3236'],
  ['building', 'fill-color', '#30323f'],
  ['building', 'fill-outline-color', DRACULA.line],
  ['highway_path', 'line-color', '#343746'],
  ['highway_minor', 'line-color', '#383a4a'],
  ['highway_major_casing', 'line-color', DRACULA.line],
  ['highway_major_inner', 'line-color', '#3d4052'],
  ['highway_major_subtle', 'line-color', '#3d4052'],
  ['highway_motorway_casing', 'line-color', DRACULA.comment],
  ['highway_motorway_inner', 'line-color', '#4b4f66'],
  ['highway_motorway_subtle', 'line-color', '#4b4f66'],
  ['railway_transit', 'line-color', DRACULA.line],
  ['railway_minor', 'line-color', DRACULA.line],
  ['railway', 'line-color', DRACULA.line],
]

const LABEL_COLOR = '#9aa3cc'

export function applyDraculaMap(map: MapLibreMap, buildings3dMinZoom: number) {
  for (const [layer, property, value] of PAINT) {
    if (map.getLayer(layer)) map.setPaintProperty(layer, property, value)
  }
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'symbol') continue
    map.setPaintProperty(layer.id, 'text-color', LABEL_COLOR)
    map.setPaintProperty(layer.id, 'text-halo-color', DRACULA.bg)
  }

  // Flat buildings below the 3D threshold, extruded from it upwards.
  if (map.getLayer('building')) map.setLayerZoomRange('building', 13, buildings3dMinZoom)
  if (!map.getLayer('building-3d')) {
    map.addLayer({
      id: 'building-3d',
      type: 'fill-extrusion',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: buildings3dMinZoom,
      paint: {
        'fill-extrusion-color': DRACULA.line,
        'fill-extrusion-height': ['get', 'render_height'],
        'fill-extrusion-base': ['get', 'render_min_height'],
        'fill-extrusion-opacity': 0.85,
      },
    })
  }
}
