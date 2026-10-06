import { useEffect, useState } from 'react'

const THRESHOLD = 70 // px of downward pull needed to trigger

/** Touch pull-down-at-top-of-page gesture. Returns the current pull distance and refreshing flag. */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    let startY: number | null = null
    let distance = 0

    const onStart = (e: TouchEvent) => {
      startY = window.scrollY <= 0 ? e.touches[0].clientY : null
      distance = 0
    }
    const onMove = (e: TouchEvent) => {
      if (startY === null) return
      distance = Math.max(0, e.touches[0].clientY - startY)
      setPull(Math.min(distance, THRESHOLD * 1.5))
    }
    const onEnd = async () => {
      const triggered = startY !== null && distance >= THRESHOLD
      startY = null
      setPull(0)
      if (!triggered) return
      setRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [onRefresh])

  return { pull, refreshing, ready: pull >= THRESHOLD }
}
