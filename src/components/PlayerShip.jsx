import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PLAYER_SPEED = 15
const ARENA_BOUNDS_X = 11
const ARENA_BOUNDS_Y = 6
const SHOOT_COOLDOWN = 180

export function PlayerShip({ isPlaying }) {
  const groupRef = useRef()
  const posRef = useRef([0, 0, 0])
  const keysRef = useRef({})
  const lastShotRef = useRef(0)

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.code] = true
    }
    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((_, delta) => {
    if (!isPlaying) return

    const keys = keysRef.current
    const pos = posRef.current

    if (keys['ArrowLeft'] || keys['KeyA']) pos[0] -= PLAYER_SPEED * delta
    if (keys['ArrowRight'] || keys['KeyD']) pos[0] += PLAYER_SPEED * delta
    if (keys['ArrowUp'] || keys['KeyW']) pos[1] += PLAYER_SPEED * delta
    if (keys['ArrowDown'] || keys['KeyS']) pos[1] -= PLAYER_SPEED * delta

    pos[0] = Math.max(-ARENA_BOUNDS_X, Math.min(ARENA_BOUNDS_X, pos[0]))
    pos[1] = Math.max(-ARENA_BOUNDS_Y, Math.min(ARENA_BOUNDS_Y, pos[1]))

    if (groupRef.current) {
      groupRef.current.position.set(...pos)
      // Slight tilt when moving
      const tiltZ = (keys['ArrowLeft'] || keys['KeyA'] ? 0.3 : 0) + (keys['ArrowRight'] || keys['KeyD'] ? -0.3 : 0)
      const tiltX = (keys['ArrowUp'] || keys['KeyW'] ? -0.15 : 0) + (keys['ArrowDown'] || keys['KeyS'] ? 0.15 : 0)
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, tiltZ, 5 * delta)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tiltX, 5 * delta)
    }

    // Shooting
    if (keys['Space']) {
      const now = performance.now()
      if (now - lastShotRef.current > SHOOT_COOLDOWN) {
        lastShotRef.current = now
        if (window.__gameAddBullet) {
          window.__gameAddBullet([pos[0], pos[1], pos[2] - 1.5])
        }
      }
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main hull */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.5, 1.8, 4]} />
        <meshStandardMaterial color="#00aaff" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Cockpit dome - front */}
      <mesh position={[0, 0.2, -0.2]}>
        <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#66ddff" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>

      {/* Left wing */}
      <mesh position={[-0.7, -0.05, 0.1]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.9, 0.06, 0.4]} />
        <meshStandardMaterial color="#0077cc" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Right wing */}
      <mesh position={[0.7, -0.05, 0.1]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.9, 0.06, 0.4]} />
        <meshStandardMaterial color="#0077cc" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Engine glow left - back */}
      <mesh position={[-0.3, -0.05, 0.8]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4} />
      </mesh>

      {/* Engine glow right - back */}
      <mesh position={[0.3, -0.05, 0.8]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4} />
      </mesh>

      {/* Point light on ship */}
      <pointLight position={[0, 0, 1]} intensity={0.5} color="#ff6600" distance={5} />
    </group>
  )
}
