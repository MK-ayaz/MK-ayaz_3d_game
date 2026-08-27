import { useEffect, useRef } from 'react'

/**
 * Pauses the game loop when the tab is hidden.
 * Returns a ref that's true when the game should be paused due to visibility.
 */
export function useVisibilityPause() {
  const isPausedRef = useRef(false)

  useEffect(() => {
    const handleVisibility = () => {
      isPausedRef.current = document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return isPausedRef
}
