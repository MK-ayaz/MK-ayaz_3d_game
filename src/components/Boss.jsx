import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'

const BOSS_MAX_HP = 100
const PHASE_THRESHOLDS = [1, 0.66, 0.33] // % of HP where each phase starts

const BOSS_GEOMETRY = new THREE.IcosahedronGeometry(2.5, 1)
const BOSS_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#880088',
  emissive: '#aa00aa',
  emissiveIntensity: 1.0,
  metalness: 0.7,
  roughness: 0.3,
})
const BOSS_RING_GEOMETRY = new THREE.TorusGeometry(3.2, 0.1, 8, 32)
const BOSS_RING_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#ff00ff',
  emissive: '#ff00ff',
  emissiveIntensity: 3,
})

/**
 * Boss entity. Spawned by GameEntities when wave % 5 === 0.
 * Has 3 phases that change attack patterns:
 *   - Phase 1 (100-66% HP): slow radial spiral
 *   - Phase 2 (66-33% HP): aimed bursts + spread missiles
 *   - Phase 3 (33-0% HP): bullet-hell sweep + charge
 */
export function Boss({ bossId, onDefeat }) {
  const groupRef = useRef()
  const stateRef = useRef({
    pos: [0, 0, -35],
    hp: BOSS_MAX_HP,
    maxHp: BOSS_MAX_HP,
    phase: 1,
    alive: true,
    lastFire: 0,
    fireInterval: 800,
    spiralAngle: 0,
    sweepAngle: 0,
    burstShots: 0,
    burstInterval: 200,
    lastBurstShot: 0,
    chargeProgress: 0,
    lastHitTime: 0,
    chargeTarget: null,
    chargeStart: null,
  })
  const materialRef = useRef()
  const [, forceUpdate] = useState(0)

  useFrame((_, delta) => {
    const s = stateRef.current
    if (!s.alive || !groupRef.current) return

    const now = performance.now()
    const playerPos = window.__playerPos || [0, 0, 0]

    // Slow horizontal drift
    s.pos[0] = Math.sin(now * 0.0004) * 6
    s.pos[1] = Math.cos(now * 0.0006) * 3

    // Phase transitions
    const hpPct = s.hp / s.maxHp
    let newPhase = 1
    if (hpPct <= PHASE_THRESHOLDS[2]) newPhase = 3
    else if (hpPct <= PHASE_THRESHOLDS[1]) newPhase = 2
    if (newPhase !== s.phase) {
      s.phase = newPhase
      // Phase 3: charge at player
      if (s.phase === 3 && !s.chargeTarget) {
        s.chargeStart = [...s.pos]
        s.chargeTarget = [...playerPos]
        s.chargeProgress = 0
      }
    }

    // Damage flash
    if (s.lastHitTime) {
      const t = (now - s.lastHitTime) / 1000
      if (t < 0.15) {
        const k = 1 - t / 0.15
        BOSS_MATERIAL.emissiveIntensity = 1.0 + k * 4
      } else {
        BOSS_MATERIAL.emissiveIntensity = 1.0
        s.lastHitTime = 0
      }
    }

    // Phase 3 charge behavior
    if (s.phase === 3 && s.chargeProgress < 1) {
      s.chargeProgress += delta * 0.5
      const t = Math.min(1, s.chargeProgress)
      // Lerp position toward target
      s.pos[0] = s.chargeStart[0] + (s.chargeTarget[0] - s.chargeStart[0]) * t
      s.pos[1] = s.chargeStart[1] + (s.chargeTarget[1] - s.chargeStart[1]) * t
      s.pos[2] = s.chargeStart[2] + (s.chargeTarget[2] - s.chargeStart[2]) * t
      if (s.chargeProgress >= 1) {
        // Reset charge after a moment
        setTimeout(() => {
          s.chargeStart = [s.pos[0], s.pos[1], s.pos[2]]
          s.chargeTarget = [Math.sin(now * 0.001) * 6, Math.cos(now * 0.0015) * 3, -35]
          s.chargeProgress = 0
        }, 1000)
      }
    }

    // Update group transform
    groupRef.current.position.set(s.pos[0], s.pos[1], s.pos[2])
    groupRef.current.rotation.y += delta * (0.5 + s.phase * 0.5)
    groupRef.current.rotation.x = Math.sin(now * 0.001) * 0.1

    // Attack patterns per phase
    if (s.phase === 1) {
      // Radial spiral - 8 bullets, slow
      s.fireInterval = 600
      if (now - s.lastFire > s.fireInterval) {
        s.lastFire = now
        s.spiralAngle += 0.4
        for (let i = 0; i < 8; i++) {
          const a = s.spiralAngle + (i * Math.PI * 2) / 8
          const dx = Math.cos(a)
          const dy = Math.sin(a)
          const dz = 0.6
          if (window.__enemyFire) {
            window.__enemyFire(
              [s.pos[0], s.pos[1], s.pos[2] + 1.5],
              [dx, dy, dz],
              '#ff44ff'
            )
          }
        }
      }
    } else if (s.phase === 2) {
      // Aimed burst + spread
      s.fireInterval = 1200
      if (now - s.lastFire > s.fireInterval) {
        s.lastFire = now
        s.burstShots = 5
        s.lastBurstShot = 0
      }
      if (s.burstShots > 0 && now - s.lastBurstShot > s.burstInterval) {
        s.lastBurstShot = now
        s.burstShots--
        // Aimed shot
        const dx = playerPos[0] - s.pos[0]
        const dy = playerPos[1] - s.pos[1]
        const dz = playerPos[2] - s.pos[2]
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
        if (window.__enemyFire) {
          window.__enemyFire(
            [s.pos[0], s.pos[1], s.pos[2] + 1.5],
            [dx / d, dy / d, dz / d],
            '#ffaa00'
          )
        }
      }
      // Steady spread
      s.sweepAngle += delta * 0.5
      if (Math.random() < 0.1) {
        const a = s.sweepAngle
        if (window.__enemyFire) {
          window.__enemyFire(
            [s.pos[0] + Math.cos(a) * 2, s.pos[1] + Math.sin(a) * 2, s.pos[2] + 1.5],
            [Math.cos(a) * 0.5, Math.sin(a) * 0.5, 1],
            '#ff8800'
          )
        }
      }
    } else {
      // Phase 3: bullet hell - many directions, fast
      s.fireInterval = 120
      if (now - s.lastFire > s.fireInterval) {
        s.lastFire = now
        s.spiralAngle += 0.2
        for (let i = 0; i < 12; i++) {
          const a = s.spiralAngle + (i * Math.PI * 2) / 12
          const dx = Math.cos(a) * 0.7
          const dy = Math.sin(a) * 0.7
          const dz = 0.7
          if (window.__enemyFire) {
            window.__enemyFire(
              [s.pos[0], s.pos[1], s.pos[2] + 1.5],
              [dx, dy, dz],
              '#ff00ff'
            )
          }
        }
      }
    }

    // HP bar
    forceUpdate((n) => n + 1)
  })

  // Handle incoming damage - listen for collision events
  useEffect(() => {
    const checkHit = (e) => {
      const s = stateRef.current
      if (!s.alive) return
      const dx = e.x - s.pos[0]
      const dy = e.y - s.pos[1]
      const dz = e.z - s.pos[2]
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (d < 3.0) {
        s.hp -= e.damage
        s.lastHitTime = performance.now()
        if (s.hp <= 0) {
          s.alive = false
          onDefeat?.()
        }
      }
    }
    window.__bossCheckHit = checkHit
    return () => { delete window.__bossCheckHit }
  }, [onDefeat])

  const s = stateRef.current
  if (!s.alive) return null

  const hpPct = Math.max(0, s.hp / s.maxHp)
  const phaseColor = s.phase === 1 ? '#ff44ff' : s.phase === 2 ? '#ffaa00' : '#ff0000'

  return (
    <group ref={groupRef} position={s.pos}>
      <mesh geometry={BOSS_GEOMETRY} material={BOSS_MATERIAL} />
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={BOSS_RING_GEOMETRY} material={BOSS_RING_MATERIAL} />
      <pointLight intensity={3} color={phaseColor} distance={15} />
      {/* HP bar - 3D billboard above boss */}
      <group position={[0, 4.5, 0]}>
        <mesh>
          <planeGeometry args={[6, 0.4]} />
          <meshBasicMaterial color="#330000" transparent opacity={0.7} />
        </mesh>
        <mesh position={[-(1 - hpPct) * 3, 0, 0.01]}>
          <planeGeometry args={[6 * hpPct, 0.4]} />
          <meshBasicMaterial color={phaseColor} />
        </mesh>
      </group>
    </group>
  )
}

export const BOSS_DEFAULT_MAX_HP = BOSS_MAX_HP
