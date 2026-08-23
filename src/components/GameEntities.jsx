import React, { useRef, useCallback, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'

const ENEMY_SPEED_BASE = 8
const ENEMY_SPAWN_DISTANCE = 50
const ARENA_SIZE = 12
const BULLET_SPEED = 40
const SHOOT_COOLDOWN = 180

// ─── Shared geometry for asteroids ───
function createAsteroidGeometry() {
  const geo = new THREE.IcosahedronGeometry(1, 1)
  const positions = geo.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const offset = 0.8 + Math.random() * 0.4
    positions.setX(i, positions.getX(i) * offset)
    positions.setY(i, positions.getY(i) * offset)
    positions.setZ(i, positions.getZ(i) * offset)
  }
  geo.computeVertexNormals()
  return geo
}

const asteroidGeometries = Array.from({ length: 20 }, () => createAsteroidGeometry())

// ─── Visual: Bullet ───
function BulletMesh({ posRef }) {
  const meshRef = useRef()
  useFrame(() => {
    if (meshRef.current && posRef.current) {
      meshRef.current.position.set(posRef.current[0], posRef.current[1], posRef.current[2])
    }
  })
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={5} />
    </mesh>
  )
}

// ─── Visual: Asteroid ───
function AsteroidMesh({ posRef, rotRef, geoIdx, scale }) {
  const meshRef = useRef()
  useFrame(() => {
    if (meshRef.current && posRef.current) {
      meshRef.current.position.set(posRef.current[0], posRef.current[1], posRef.current[2])
      if (rotRef.current) {
        meshRef.current.rotation.set(rotRef.current[0], rotRef.current[1], rotRef.current[2])
      }
    }
  })
  return (
    <mesh ref={meshRef} geometry={asteroidGeometries[geoIdx % 20]} scale={scale}>
      <meshStandardMaterial color="#888888" roughness={0.9} metalness={0.1} flatShading />
    </mesh>
  )
}

// ─── Visual: Enemy ───
function EnemyMesh({ posRef, rotRef }) {
  const groupRef = useRef()
  useFrame(() => {
    if (groupRef.current && posRef.current) {
      groupRef.current.position.set(posRef.current[0], posRef.current[1], posRef.current[2])
      if (rotRef.current) {
        groupRef.current.rotation.y = rotRef.current[1]
      }
    }
  })
  return (
    <group ref={groupRef}>
      <mesh>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.05, 8, 16]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

// ─── Main entity manager ───
export function GameEntities({ isPlaying }) {
  // We store all entity data in a ref and use a render counter to trigger re-renders
  const entitiesRef = useRef({ obstacles: [], bullets: [] })
  const nextIdRef = useRef(0)
  const lastSpawnRef = useRef(0)
  const lastShotRef = useRef(0)
  const frameCountRef = useRef(0)

  // State to trigger re-renders (only when entities are added/removed)
  const [renderKey, setRenderKey] = useState(0)

  const addBullet = useCallback((pos) => {
    const id = nextIdRef.current++
    entitiesRef.current.bullets.push({
      id,
      posRef: { current: [...pos] },
      active: true,
    })
    setRenderKey((k) => k + 1)
  }, [])

  // Expose addBullet to PlayerShip
  useEffect(() => {
    window.__gameAddBullet = addBullet
    return () => { delete window.__gameAddBullet }
  }, [addBullet])

  useFrame(() => {
    if (!isPlaying) return

    const now = performance.now()
    const delta = 1 / 60 // Fixed timestep approximation
    const ents = entitiesRef.current

    // ── Wave progression ──
    const destroyed = useGameStore.getState().enemiesDestroyed
    const currentWave = useGameStore.getState().wave
    if (destroyed > 0 && destroyed % (5 + currentWave * 3) === 0) {
      useGameStore.getState().nextWave()
    }

    // ── Spawn obstacles ──
    const speed = ENEMY_SPEED_BASE + currentWave * 1.5
    const spawnInterval = Math.max(0.6, 2.2 - currentWave * 0.15)

    if (now - lastSpawnRef.current > spawnInterval * 1000) {
      lastSpawnRef.current = now
      const id = nextIdRef.current++
      const x = (Math.random() - 0.5) * ARENA_SIZE * 2
      const y = (Math.random() - 0.5) * ARENA_SIZE
      const z = -ENEMY_SPAWN_DISTANCE
      const isAsteroid = Math.random() > 0.45
      const obsSpeed = speed + Math.random() * 3

      if (isAsteroid) {
        ents.obstacles.push({
          id,
          posRef: { current: [x, y, z] },
          rotRef: { current: [0, 0, 0] },
          rotSpeed: [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2],
          geoIdx: id % 20,
          scale: 0.3 + Math.random() * 0.7,
          speed: obsSpeed,
          type: 'asteroid',
          active: true,
        })
      } else {
        ents.obstacles.push({
          id,
          posRef: { current: [x, y, z] },
          rotRef: { current: [0, 0, 0] },
          rotSpeed: [0, 3, 0],
          geoIdx: -1,
          scale: 1,
          speed: obsSpeed,
          type: 'enemy',
          active: true,
        })
      }
      setRenderKey((k) => k + 1)
    }

    // ── Auto-shoot from player position ──
    if (now - lastShotRef.current > SHOOT_COOLDOWN) {
      lastShotRef.current = now
      const playerPos = useGameStore.getState().playerPosition
      if (playerPos) {
        addBullet([playerPos[0], playerPos[1], playerPos[2] - 1.5])
      }
    }

    // ── Move obstacles ──
    let obstaclesChanged = false
    ents.obstacles.forEach((o) => {
      if (!o.active) return
      o.posRef.current[2] += o.speed * delta
      if (o.rotRef.current) {
        o.rotRef.current[0] += o.rotSpeed[0] * delta
        o.rotRef.current[1] += o.rotSpeed[1] * delta
        o.rotRef.current[2] += o.rotSpeed[2] * delta
      }
      if (o.posRef.current[2] > 10) {
        o.active = false
        useGameStore.getState().takeDamage(15)
        obstaclesChanged = true
      }
    })

    // ── Move bullets ──
    ents.bullets.forEach((b) => {
      if (!b.active) return
      b.posRef.current[2] -= BULLET_SPEED * delta
      if (b.posRef.current[2] < -55) {
        b.active = false
      }
    })

    // ── Collision detection ──
    ents.bullets.forEach((b) => {
      if (!b.active) return
      ents.obstacles.forEach((o) => {
        if (!o.active) return
        const dx = b.posRef.current[0] - o.posRef.current[0]
        const dy = b.posRef.current[1] - o.posRef.current[1]
        const dz = b.posRef.current[2] - o.posRef.current[2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        const hitRadius = o.type === 'asteroid' ? 1.0 : 1.2
        if (dist < hitRadius) {
          o.active = false
          b.active = false
          useGameStore.getState().addScore(o.type === 'asteroid' ? 15 : 25)
          obstaclesChanged = true
        }
      })
    })

    // ── Cleanup inactive entities ──
    const prevObsCount = ents.obstacles.length
    ents.obstacles = ents.obstacles.filter((o) => o.active)
    const prevBulCount = ents.bullets.length
    ents.bullets = ents.bullets.filter((b) => b.active)

    if (
      ents.obstacles.length !== prevObsCount ||
      ents.bullets.length !== prevBulCount ||
      obstaclesChanged
    ) {
      setRenderKey((k) => k + 1)
    }
  })

  const ents = entitiesRef.current

  return (
    <>
      {ents.obstacles.map((o) =>
        o.type === 'asteroid' ? (
          <AsteroidMesh
            key={o.id}
            posRef={o.posRef}
            rotRef={o.rotRef}
            geoIdx={o.geoIdx}
            scale={o.scale}
          />
        ) : (
          <EnemyMesh
            key={o.id}
            posRef={o.posRef}
            rotRef={o.rotRef}
          />
        )
      )}
      {ents.bullets.map((b) => (
        <BulletMesh key={b.id} posRef={b.posRef} />
      ))}
    </>
  )
}
