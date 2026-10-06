import { useSyncExternalStore } from 'react'

// Tiny hash router: "#/" is home, "#/map" is the map, "#/stop/83139" is a stop. Browser back works.

export type Route = { name: 'home' } | { name: 'map' } | { name: 'stop'; stopCode: string }

function parse(hash: string): Route {
  if (hash === '#/map') return { name: 'map' }
  const match = /^#\/stop\/(\d{5})$/.exec(hash)
  return match ? { name: 'stop', stopCode: match[1] } : { name: 'home' }
}

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return parse(hash)
}

export function stopHref(stopCode: string) {
  return `#/stop/${stopCode}`
}
