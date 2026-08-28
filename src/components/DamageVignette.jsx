import React, { useEffect, useState, useRef } from 'react'

/**
 * Pulsing red vignette at the edges of the screen when player is hit.
 * Triggers via window.__triggerDamageVignette().
 */
export function DamageVignette() {
  const [intensity, setIntensity] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    window.__triggerDamageVignette = (amt = 0.5) => {
      setIntensity((prev) => Math.min(1, prev + amt))
    }
    return () => { delete window.__triggerDamageVignette }
  }, [])

  useEffect(() => {
    if (intensity <= 0) return
    let last = performance.now()
    const loop = () => {
      const now = performance.now()
      const dt = (now - last) / 1000
      last = now
      setIntensity((prev) => Math.max(0, prev - dt * 0.8))
      if (intensity > 0) rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [intensity])

  if (intensity <= 0) return null

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 30,
      boxShadow: `inset 0 0 ${100 + intensity * 200}px ${80 + intensity * 150}px rgba(255, 0, 0, ${intensity * 0.7})`,
      transition: 'box-shadow 0.1s',
    }} />
  )
}
