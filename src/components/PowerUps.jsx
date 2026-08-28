import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'

const POWER_UP_TYPES = ['health', 'speed', 'multishot', 'slowmo', 'blackhole', 'bomb']
const POWER_UP_COLORS = {
  health: '#00ff88',
  speed: '#00ccff',
  multishot: '#ffaa00',
  slowmo: '#cc66ff',
  blackhole: '#ff0066',
  bomb: '#ffdd00'
}

function PowerUpMesh({ position, type, onCollect }) {
  const meshRef = useRef()
  const groupRef = useRef()
  
  const color = POWER_UP_COLORS[type] || '#ffffff'
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 2 * delta
      groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.003) * 0.3
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={2} color={color} distance={5} />
    </group>
  )
}

export function PowerUps({ isPlaying }) {
  const powerUpsRef = useRef([])
  const nextIdRef = useRef(0)
  const lastSpawnRef = useRef(0)
  
  const activePowerUp = useGameStore((s) => s.activePowerUp)
  const activatePowerUp = useGameStore((s) => s.activatePowerUp)
  const playerPosition = useGameStore((s) => s.playerPosition)
  
  const SPAWN_INTERVAL = 8000 // 8 seconds
  const POWER_UP_LIFETIME = 10000 // 10 seconds
  const COLLECT_DISTANCE = 2

  useFrame(() => {
    if (!isPlaying) return

    const now = Date.now()
    const store = useGameStore.getState()
    
    // Update power-up timer
    store.updatePowerUp()

    // Spawn power-ups
    if (now - lastSpawnRef.current > SPAWN_INTERVAL) {
      lastSpawnRef.current = now
      const id = nextIdRef.current++
      const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)]
      const x = (Math.random() - 0.5) * 16
      const y = (Math.random() - 0.5) * 8
      const z = -30
      
      powerUpsRef.current.push({
        id,
        position: [x, y, z],
        type,
        spawnTime: now,
        active: true
      })
    }

    // Move power-ups and check collection
    powerUpsRef.current.forEach((pu) => {
      if (!pu.active) return
      
      // Move towards player
      pu.position[2] += 8 * 0.016 // ~60fps delta
      
      // Check if passed player
      if (pu.position[2] > 15) {
        pu.active = false
        return
      }
      
      // Check lifetime
      if (now - pu.spawnTime > POWER_UP_LIFETIME) {
        pu.active = false
        return
      }
      
      // Check collection
      if (playerPosition) {
        const dx = pu.position[0] - playerPosition[0]
        const dy = pu.position[1] - playerPosition[1]
        const dz = pu.position[2] - playerPosition[2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        
        if (dist < COLLECT_DISTANCE) {
          pu.active = false
          activatePowerUp(pu.type)
          
          // Play power-up sound
          if (window.__soundManager) {
            window.__soundManager.playPowerUp()
          }
          
          // Trigger particle effect
          if (window.__triggerExplosion) {
            window.__triggerExplosion(pu.position, POWER_UP_COLORS[pu.type], 15)
          }
        }
      }
    })

    // Cleanup inactive power-ups
    powerUpsRef.current = powerUpsRef.current.filter(pu => pu.active)
  })

  return (
    <>
      {powerUpsRef.current.map((pu) => (
        <PowerUpMesh
          key={pu.id}
          position={pu.position}
          type={pu.type}
        />
      ))}
    </>
  )
}
