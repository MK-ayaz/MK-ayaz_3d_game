import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'

/**
 * Smart bomb visual: expanding shockwave + screen flash.
 * Triggered by B key (or window.__triggerBomb()).
 * Effect:
 *   1. Expanding white ring from player position
 *   2. Massive explosion particles
 *   3. Camera shake
 *   4. All enemies destroyed (consume via callback)
 */
export function SmartBomb({ onDetonate }) {
  const ringRef = useRef()
  const materialRef = useRef()
  const stateRef = useRef({ active: false, startTime: 0 })

  useEffect(() => {
    window.__triggerBomb = () => {
      const store = useGameStore.getState()
      if (store.bombs > 0 && !stateRef.current.active) {
        store.useBomb()
        stateRef.current.active = true
        stateRef.current.startTime = performance.now()
        if (onDetonate) onDetonate()
        if (window.__soundManager) {
          window.__soundManager.playExplosion?.()
        }
        if (window.__triggerCameraShake) {
          window.__triggerCameraShake(2.0)
        }
        if (window.__triggerScreenFlash) {
          window.__triggerScreenFlash('#ffffff', 0.8)
        }
      }
    }
    return () => { delete window.__triggerBomb }
  }, [onDetonate])

  useFrame(() => {
    if (!stateRef.current.active) return
    const elapsed = (performance.now() - stateRef.current.startTime) / 1000
    const duration = 1.0
    if (elapsed > duration) {
      stateRef.current.active = false
      if (ringRef.current) ringRef.current.visible = false
      return
    }
    if (ringRef.current) {
      ringRef.current.visible = true
      const scale = 0.5 + elapsed * 30
      ringRef.current.scale.set(scale, scale, scale)
      if (materialRef.current) {
        materialRef.current.opacity = Math.max(0, 1 - elapsed)
      }
      // Position at player
      const playerPos = useGameStore.getState().playerPosition
      if (playerPos) {
        ringRef.current.position.set(playerPos[0], playerPos[1], playerPos[2])
      }
    }
  })

  return (
    <group>
      <mesh ref={ringRef} visible={false}>
        <torusGeometry args={[1.0, 0.15, 8, 32]} />
        <meshBasicMaterial
          ref={materialRef}
          color="#ffffff"
          emissive="#ffffff"
          transparent
          opacity={1}
          depthTest={false}
        />
      </mesh>
    </group>
  )
}
