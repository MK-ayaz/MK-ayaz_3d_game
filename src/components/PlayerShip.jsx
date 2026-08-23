import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'

const PLAYER_SPEED = 15
const ARENA_BOUNDS_X = 11
const ARENA_BOUNDS_Y = 6

export function PlayerShip({ isPlaying }) {
  const groupRef = useRef()
  const posRef = useRef([0, 0, 0])
  const keysRef = useRef({})

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.code] = true
      // Prevent page scrolling
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault()
      }
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

    // Store position for GameEntities auto-shoot
    useGameStore.getState().setPlayerPosition([...pos])

    if (groupRef.current) {
      groupRef.current.position.set(...pos)
      // Slight tilt when moving
      const tiltZ = (keys['ArrowLeft'] || keys['KeyA'] ? 0.3 : 0) + (keys['ArrowRight'] || keys['KeyD'] ? -0.3 : 0)
      const tiltX = (keys['ArrowUp'] || keys['KeyW'] ? -0.15 : 0) + (keys['ArrowDown'] || keys['KeyS'] ? 0.15 : 0)
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, tiltZ, 5 * delta)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tiltX, 5 * delta)
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main hull - cone pointing forward (-Z) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.5, 1.8, 4]} />
        <meshStandardMaterial color="#00aaff" metalness={0.8} roughness={0.2} emissive="#0044aa" emissiveIntensity={0.3} />
      </mesh>

      {/* Cockpit dome - front (-Z) */}
      <mesh position={[0, 0.2, -0.3]}>
        <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#66ddff" metalness={0.9} roughness={0.1} transparent opacity={0.7} emissive="#00aaff" emissiveIntensity={0.5} />
      </mesh>

      {/* Left wing */}
      <mesh position={[-0.7, -0.05, 0.1]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.9, 0.06, 0.4]} />
        <meshStandardMaterial color="#0077cc" metalness={0.7} roughness={0.3} emissive="#003366" emissiveIntensity={0.2} />
      </mesh>

      {/* Right wing */}
      <mesh position={[0.7, -0.05, 0.1]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.9, 0.06, 0.4]} />
        <meshStandardMaterial color="#0077cc" metalness={0.7} roughness={0.3} emissive="#003366" emissiveIntensity={0.2} />
      </mesh>

      {/* Engine glow left - back (+Z) */}
      <mesh position={[-0.3, -0.05, 0.8]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4} />
      </mesh>

      {/* Engine glow right - back (+Z) */}
      <mesh position={[0.3, -0.05, 0.8]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4} />
      </mesh>

      {/* Point light on ship */}
      <pointLight position={[0, 0, 1]} intensity={1} color="#00aaff" distance={8} />
    </group>
  )
}
