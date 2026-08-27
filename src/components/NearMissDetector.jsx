import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store'

/**
 * Detects near-misses (enemy passes close to player without colliding)
 * and grants bonus score + brief invincibility frames.
 * State is tracked via a ref so it can be queried by GameEntities.
 */
const NEAR_MISS_RADIUS = 1.5
const NEAR_MISS_DISTANCE = 2.5 // enemy must pass within this z-distance
const COOLDOWN_MS = 800

export function NearMissDetector() {
  const lastTriggerRef = useRef(0)
  const [flash, setFlash] = useState(0)

  useEffect(() => {
    // Expose invincibility frame state
    window.__playerInvincibleUntil = 0
  }, [])

  useFrame(() => {
    const enemies = window.__gameEnemies
    if (!enemies) return
    const playerPos = useGameStore.getState().playerPosition
    if (!playerPos) return
    const now = performance.now()
    if (now - lastTriggerRef.current < COOLDOWN_MS) return

    for (const e of enemies) {
      if (!e.active) continue
      const dx = e.pos[0] - playerPos[0]
      const dy = e.pos[1] - playerPos[1]
      const dz = e.pos[2] - playerPos[2]
      // Only trigger when enemy is near player's z-plane and within radius
      if (Math.abs(dz) > NEAR_MISS_DISTANCE) continue
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < NEAR_MISS_RADIUS) {
        // Near miss!
        lastTriggerRef.current = now
        window.__playerInvincibleUntil = now + 600
        useGameStore.getState().addScore(50)
        useGameStore.getState().triggerNearMiss?.()
        window.__nearMissTriggered = true
        setFlash(now)
        if (window.__soundManager) window.__soundManager.playPowerUp?.()
        if (window.__triggerScreenFlash) window.__triggerScreenFlash('#00ffff', 0.1)
        break
      }
    }
  })

  if (Date.now() - flash > 600) return null

  return (
    <div style={{
      position: 'absolute',
      top: '40%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: '#00ffff',
      fontSize: 36,
      fontWeight: 'bold',
      letterSpacing: 4,
      textShadow: '0 0 20px #00ffff, 0 0 40px #00aaff',
      pointerEvents: 'none',
      zIndex: 60,
      animation: 'floatUp 0.6s ease-out forwards',
    }}>
      DODGE!
    </div>
  )
}
