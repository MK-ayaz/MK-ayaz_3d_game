import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore, SHIP_STATS } from '../store'
import { ChargedShot } from './ChargedShot'

const PLAYER_SPEED_BASE = 15
const ARENA_BOUNDS_X = 11
const ARENA_BOUNDS_Y = 6
const PLAYER_Z = 5 // start position toward camera so player is visible
const CHARGE_TIME = 1.2 // seconds to full charge
const CHARGE_THRESHOLD = 0.3 // min charge to fire a spread

export function PlayerShip({ isPlaying }) {
  const groupRef = useRef()
  const posRef = useRef([0, 0, PLAYER_Z])
  const keysRef = useRef({})
  const chargeRef = useRef(0) // 0..1
  const spaceHeldRef = useRef(false)

  // Subscribe to upgrades for player speed
  const moveSpeedUpgrade = useGameStore((s) => s.upgrades?.moveSpeed ?? 0)
  const shipType = useGameStore((s) => s.shipType)

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.code] = true
      if (e.code === 'Space') {
        spaceHeldRef.current = true
        if (chargeRef.current === 0) {
          // mark start of charge by setting to tiny non-zero
          chargeRef.current = 0.001
        }
      }
      // Prevent page scrolling
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault()
      }
    }
    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false
      if (e.code === 'Space') {
        spaceHeldRef.current = false
        // Fire based on charge
        const charge = chargeRef.current
        if (charge >= CHARGE_THRESHOLD) {
          // Charged spread shot
          window.__gameFireSpread?.([...posRef.current], charge)
        } else if (charge > 0) {
          // Quick tap: single aimed shot
          window.__gameFire?.([...posRef.current])
        }
        chargeRef.current = 0
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((_, delta) => {
    if (!isPlaying) {
      // Reset charge when not playing
      chargeRef.current = 0
      spaceHeldRef.current = false
      return
    }

    // Merge mobile keys into keysRef
    if (window.__keys) {
      Object.assign(keysRef.current, window.__keys)
    }

    const keys = keysRef.current
    const pos = posRef.current
    const shipStats = SHIP_STATS[shipType] || SHIP_STATS.fighter
    const speed = PLAYER_SPEED_BASE * shipStats.speed * (1 + moveSpeedUpgrade * 0.1)

    // Use keybinds from store, falling back to defaults
    const kb = useGameStore.getState().keybinds
    const upKey = kb?.up || 'ArrowUp'
    const downKey = kb?.down || 'ArrowDown'
    const leftKey = kb?.left || 'ArrowLeft'
    const rightKey = kb?.right || 'ArrowRight'

    if (keys[leftKey] || keys['KeyA']) pos[0] -= speed * delta
    if (keys[rightKey] || keys['KeyD']) pos[0] += speed * delta
    if (keys[upKey] || keys['KeyW']) pos[1] += speed * delta
    if (keys[downKey] || keys['KeyS']) pos[1] -= speed * delta

    // Track movement for tutorial
    if (keys['ArrowLeft'] || keys['ArrowRight'] || keys['ArrowUp'] || keys['ArrowDown']) {
      window.__lastKey = { ...(window.__lastKey || {}), arrows: true }
    }
    if (keys['KeyA'] || keys['KeyW'] || keys['KeyS'] || keys['KeyD']) {
      window.__lastKey = { ...(window.__lastKey || {}), wasd: true }
    }

    pos[0] = Math.max(-ARENA_BOUNDS_X, Math.min(ARENA_BOUNDS_X, pos[0]))
    pos[1] = Math.max(-ARENA_BOUNDS_Y, Math.min(ARENA_BOUNDS_Y, pos[1]))

    // Charge meter
    if (spaceHeldRef.current && chargeRef.current < 1) {
      chargeRef.current = Math.min(1, chargeRef.current + delta / CHARGE_TIME)
      window.__gameChargeState?.(chargeRef.current)
      window.__playerCharge = chargeRef.current
    } else if (!spaceHeldRef.current && chargeRef.current > 0 && chargeRef.current < CHARGE_THRESHOLD) {
      // Released below threshold — counts as tap (will fire on keyup); no reset here
    } else if (!spaceHeldRef.current) {
      window.__playerCharge = 0
    }

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

  const ShipBody = () => {
    if (shipType === 'interceptor') {
      // Sleek dart-shape
      return (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.3, 2.0, 6]} />
            <meshStandardMaterial color="#00ff88" metalness={0.9} roughness={0.15} emissive="#005522" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0, 0.15, -0.4]}>
            <sphereGeometry args={[0.18, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#88ffcc" metalness={0.95} roughness={0.05} transparent opacity={0.7} emissive="#00ff88" emissiveIntensity={0.5} />
          </mesh>
          {/* Swept-back wings */}
          <mesh position={[-0.5, -0.05, 0.3]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.7, 0.05, 0.4]} />
            <meshStandardMaterial color="#00aa55" metalness={0.8} roughness={0.2} emissive="#003322" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0.5, -0.05, 0.3]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.7, 0.05, 0.4]} />
            <meshStandardMaterial color="#00aa55" metalness={0.8} roughness={0.2} emissive="#003322" emissiveIntensity={0.3} />
          </mesh>
          {/* Single intense engine */}
          <mesh position={[0, -0.05, 0.9]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#00ffaa" emissive="#00ffaa" emissiveIntensity={6} />
          </mesh>
        </>
      )
    }
    if (shipType === 'destroyer') {
      // Bulky armored
      return (
        <>
          {/* Twin hulls */}
          <mesh position={[-0.4, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.35, 1.6, 4]} />
            <meshStandardMaterial color="#ff8800" metalness={0.6} roughness={0.4} emissive="#662200" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0.4, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.35, 1.6, 4]} />
            <meshStandardMaterial color="#ff8800" metalness={0.6} roughness={0.4} emissive="#662200" emissiveIntensity={0.3} />
          </mesh>
          {/* Central body */}
          <mesh>
            <boxGeometry args={[0.6, 0.4, 1.6]} />
            <meshStandardMaterial color="#aa5500" metalness={0.7} roughness={0.3} emissive="#442200" emissiveIntensity={0.2} />
          </mesh>
          {/* Wide wings */}
          <mesh position={[-0.9, -0.05, 0.1]} rotation={[0, 0, 0.1]}>
            <boxGeometry args={[1.0, 0.08, 0.5]} />
            <meshStandardMaterial color="#cc6600" metalness={0.6} roughness={0.4} emissive="#442200" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0.9, -0.05, 0.1]} rotation={[0, 0, -0.1]}>
            <boxGeometry args={[1.0, 0.08, 0.5]} />
            <meshStandardMaterial color="#cc6600" metalness={0.6} roughness={0.4} emissive="#442200" emissiveIntensity={0.2} />
          </mesh>
          {/* Twin engines */}
          <mesh position={[-0.4, -0.05, 0.8]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={5} />
          </mesh>
          <mesh position={[0.4, -0.05, 0.8]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={5} />
          </mesh>
        </>
      )
    }
    // Fighter (default)
    return (
      <>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.5, 1.8, 4]} />
          <meshStandardMaterial color="#00aaff" metalness={0.8} roughness={0.2} emissive="#0044aa" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0.2, -0.3]}>
          <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#66ddff" metalness={0.9} roughness={0.1} transparent opacity={0.7} emissive="#00aaff" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[-0.7, -0.05, 0.1]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.9, 0.06, 0.4]} />
          <meshStandardMaterial color="#0077cc" metalness={0.7} roughness={0.3} emissive="#003366" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0.7, -0.05, 0.1]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.9, 0.06, 0.4]} />
          <meshStandardMaterial color="#0077cc" metalness={0.7} roughness={0.3} emissive="#003366" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[-0.3, -0.05, 0.8]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4} />
        </mesh>
        <mesh position={[0.3, -0.05, 0.8]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4} />
        </mesh>
      </>
    )
  }

  const ringColor = shipType === 'interceptor' ? '#00ff88' : shipType === 'destroyer' ? '#ff8800' : '#00ffff'
  const lightColor = shipType === 'interceptor' ? '#00ff88' : shipType === 'destroyer' ? '#ffaa00' : '#00aaff'

  return (
    <group ref={groupRef} position={[0, 0, PLAYER_Z]}>
      <ShipBody />

      {/* Strong point light on ship */}
      <pointLight position={[0, 0, 1]} intensity={2.5} color={lightColor} distance={12} />

      {/* Bright glow ring under the player so they're always visible */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 1.0, 32]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Inner ring */}
      <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.55, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Reticle / crosshair in front of player showing where bullets go */}
      <mesh position={[0, 0, -3]}>
        <ringGeometry args={[0.4, 0.45, 16]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Crosshair cross */}
      <mesh position={[-0.6, 0, -3]}>
        <boxGeometry args={[0.4, 0.05, 0.05]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[0.6, 0, -3]}>
        <boxGeometry args={[0.4, 0.05, 0.05]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.6, -3]}>
        <boxGeometry args={[0.05, 0.4, 0.05]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.6, -3]}>
        <boxGeometry args={[0.05, 0.4, 0.05]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.5} depthWrite={false} />
      </mesh>

      {/* Beacon — pulsing column of light above the ship */}
      <pointLight position={[0, 2, 0]} intensity={0.5} color={lightColor} distance={6} />

      {/* Charge visual */}
      <ChargedShot />
    </group>
  )
}
