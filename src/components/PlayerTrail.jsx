import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'

const MAX_TRAIL = 60

/**
 * Continuous particle stream from the player's two engine glow points.
 * Reads player position from the store and emits small fading quads.
 */
export function PlayerTrail() {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const trail = useRef([])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const playerPos = useGameStore.getState().playerPosition
    const isPlaying = useGameStore.getState().gameState === 'playing'
    const now = performance.now()

    // Emit two particles per frame (one per engine)
    if (isPlaying && playerPos) {
      trail.current.push({ x: playerPos[0] - 0.3, y: playerPos[1] - 0.05, z: playerPos[2] + 0.8, life: 0.5, spawn: now, side: -1 })
      trail.current.push({ x: playerPos[0] + 0.3, y: playerPos[1] - 0.05, z: playerPos[2] + 0.8, life: 0.5, spawn: now, side: 1 })
    }

    // Cap trail
    if (trail.current.length > MAX_TRAIL) {
      trail.current.splice(0, trail.current.length - MAX_TRAIL)
    }

    // Update + write to instanced mesh
    let i = 0
    for (const p of trail.current) {
      const age = (now - p.spawn) / 1000
      const t = age / p.life
      if (t >= 1) continue
      dummy.position.set(p.x, p.y, p.z + age * 4)
      const s = 0.15 * (1 - t) * 0.7
      dummy.scale.set(s, s, s)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
      // Color from cyan→transparent orange as it fades
      const mat = meshRef.current.material
      // we just use vertex color
      i++
    }
    meshRef.current.count = i
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, MAX_TRAIL]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#ff8800" transparent opacity={0.7} depthWrite={false} />
    </instancedMesh>
  )
}
