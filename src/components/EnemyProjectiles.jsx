import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PROJECTILE_SPEED = 22
const LIFETIME_MS = 4500

// ─── Shared geometry/material for enemy projectiles ───
const projGeometry = new THREE.SphereGeometry(0.18, 8, 8)
const projMaterials = new Map()
function getProjectileMaterial(color) {
  if (!projMaterials.has(color)) {
    projMaterials.set(color, new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 4,
    }))
  }
  return projMaterials.get(color)
}

function ProjectileMesh({ posRef, color }) {
  const meshRef = useRef()
  useFrame(() => {
    if (meshRef.current && posRef.current) {
      meshRef.current.position.set(posRef.current[0], posRef.current[1], posRef.current[2])
    }
  })
  return <mesh ref={meshRef} geometry={projGeometry} material={getProjectileMaterial(color)} />
}

/**
 * Manages enemy-fired projectiles (sniper shots, future boss patterns).
 * Stores active projectiles in a ref; spawn via window.__enemyFire(pos, dir, color).
 * Renders only the active ones.
 */
export function EnemyProjectiles() {
  const projectilesRef = useRef([])
  const nextIdRef = useRef(0)
  const [renderKey, setRenderKey] = useState(0)

  const spawn = useCallback((pos, dir, color = '#ffaa00') => {
    const id = nextIdRef.current++
    projectilesRef.current.push({
      id,
      posRef: { current: [...pos] },
      dir: [dir[0] || 0, dir[1] || 0, dir[2] || 0],
      color,
      spawnTime: performance.now(),
      active: true,
    })
    setRenderKey((k) => k + 1)
  }, [])

  useEffect(() => {
    window.__enemyFire = spawn
    return () => { delete window.__enemyFire }
  }, [spawn])

  useFrame((_, delta) => {
    const playerPos = window.__playerPos || [0, 0, 0]
    let changed = false
    projectilesRef.current.forEach((p) => {
      if (!p.active) return
      p.posRef.current[0] += p.dir[0] * PROJECTILE_SPEED * delta
      p.posRef.current[1] += p.dir[1] * PROJECTILE_SPEED * delta
      p.posRef.current[2] += p.dir[2] * PROJECTILE_SPEED * delta
      const age = performance.now() - p.spawnTime
      // Off-screen or expired
      if (p.posRef.current[2] > 15 || Math.abs(p.posRef.current[0]) > 25 || age > LIFETIME_MS) {
        p.active = false
        changed = true
        return
      }
      // Collision with player
      const dx = p.posRef.current[0] - playerPos[0]
      const dy = p.posRef.current[1] - playerPos[1]
      const dz = p.posRef.current[2] - playerPos[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < 0.8) {
        p.active = false
        changed = true
        // Damage player
        if (window.__playerHit) {
          window.__playerHit(10, p.posRef.current)
        } else if (window.__soundManager) {
          // Fallback to takeDamage via store
          // (window.__playerHit is wired up in App)
        }
      }
    })
    const prev = projectilesRef.current.length
    projectilesRef.current = projectilesRef.current.filter((p) => p.active)
    if (changed || projectilesRef.current.length !== prev) {
      setRenderKey((k) => k + 1)
    }
  })

  return (
    <>
      {projectilesRef.current.map((p) => (
        <ProjectileMesh key={p.id} posRef={p.posRef} color={p.color} />
      ))}
    </>
  )
}
