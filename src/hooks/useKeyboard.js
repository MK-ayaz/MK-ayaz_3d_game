import { useEffect, useRef } from 'react'

/**
 * Hook for listening to keyboard state.
 * Returns a ref with { [keyCode]: boolean } that's updated each frame.
 * Usage: const keys = useKeyboard(['KeyA', 'KeyD', 'Space', 'ArrowLeft'])
 */
export function useKeyboard(codes = []) {
  const keysRef = useRef({})

  useEffect(() => {
    const handleDown = (e) => {
      keysRef.current[e.code] = true
      if (codes.includes(e.code)) e.preventDefault()
    }
    const handleUp = (e) => {
      keysRef.current[e.code] = false
    }
    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)
    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
    }
  }, [codes.join(',')])

  return keysRef
}
