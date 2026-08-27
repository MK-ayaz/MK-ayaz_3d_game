import React, { useEffect, useState, useRef } from 'react'
import { useGameStore } from '../store'

/**
 * Live DPS meter and accuracy percentage. Tracks recent damage via
 * a sliding window of (timestamp, damage) entries.
 */
const WINDOW_MS = 3000

export function StatsHUD() {
  const gameState = useGameStore((s) => s.gameState)
  const shotsFired = useGameStore((s) => s.shotsFired)
  const shotsHit = useGameStore((s) => s.shotsHit)
  const damageLogRef = useRef([]) // { t, dmg }
  const [dps, setDps] = useState(0)
  const lastShotFiredRef = useRef(0)
  const lastShotHitRef = useRef(0)
  const lastScoreRef = useRef(0)
  const score = useGameStore((s) => s.score)

  useEffect(() => {
    if (gameState !== 'playing') return
    let raf
    const loop = () => {
      // Detect new hits (delta in shotsHit)
      if (shotsHit > lastShotHitRef.current) {
        const gained = shotsHit - lastShotHitRef.current
        // Estimate damage per hit from score delta
        const scoreDelta = score - lastScoreRef.current
        const avgDmg = scoreDelta > 0 ? Math.max(1, Math.floor(scoreDelta / gained)) : 1
        for (let i = 0; i < gained; i++) {
          damageLogRef.current.push({ t: performance.now(), dmg: avgDmg })
        }
        lastShotHitRef.current = shotsHit
        lastScoreRef.current = score
      }
      // Trim old entries
      const cutoff = performance.now() - WINDOW_MS
      damageLogRef.current = damageLogRef.current.filter((e) => e.t > cutoff)
      // Compute DPS
      const totalDmg = damageLogRef.current.reduce((s, e) => s + e.dmg, 0)
      setDps(Math.round(totalDmg / (WINDOW_MS / 1000)))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [gameState, shotsHit, score])

  if (gameState !== 'playing') return null
  const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0

  return (
    <div style={{
      position: 'absolute',
      bottom: 60,
      left: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      pointerEvents: 'none',
    }}>
      <div style={{
        color: '#88aaff',
        fontSize: 11,
        fontWeight: 'bold',
        textShadow: '0 0 4px #88aaff',
        letterSpacing: 1,
      }}>
        DPS: {dps}
      </div>
      <div style={{
        color: accuracy > 50 ? '#00ff88' : accuracy > 25 ? '#ffaa00' : '#ff6666',
        fontSize: 11,
        fontWeight: 'bold',
        textShadow: '0 0 4px currentColor',
        letterSpacing: 1,
      }}>
        ACC: {accuracy}%
      </div>
    </div>
  )
}
