import React, { useRef, useMemo, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'

const ENEMY_SPEED_BASE = 8
const ENEMY_SPAWN_DISTANCE = 50
const ARENA_SIZE = 12
const BULLET_SPEED = 60

function Asteroid({ position: initialPos, speed, onHit }) {
  const meshRef = useRef()
  const posRef = useRef([...initialPos])
  const rotSpeed = useMemo(() => [
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
  ], [])
  const scale = useMemo(() => 0.3 + Math.random() * 0.7, [])

  const geometry = useMemo(() => {
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
  }, [])

  useFrame((_, delta) => {
    if (meshRef.current) {
      posRef.current[2] += speed * delta
      meshRef.current.position.set(...posRef.current)
      meshRef.current.rotation.x += rotSpeed[0] * delta
      meshRef.current.rotation.y += rotSpeed[1] * delta
      meshRef.current.rotation.z += rotSpeed[2] * delta

      if (posRef.current[2] > 10) {
        onHit()
      }
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={initialPos} scale={scale}>
      <meshStandardMaterial color="#888888" roughness={0.9} metalness={0.1} flatShading />
    </mesh>
  )
}

function EnemyShip({ position: initialPos, speed, onPass }) {
  const groupRef = useRef()
  const posRef = useRef([...initialPos])

  useFrame((_, delta) => {
    if (groupRef.current) {
      posRef.current[2] += speed * delta
      groupRef.current.position.set(...posRef.current)
      groupRef.current.rotation.y += 3 * delta

      if (posRef.current[2] > 10) {
        onPass()
      }
    }
  })

  return (
    <group ref={groupRef} position={initialPos}>
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

function Bullet({ position: initialPos, onExpire }) {
  const meshRef = useRef()
  const posRef = useRef([...initialPos])

  useFrame((_, delta) => {
    if (meshRef.current) {
      posRef.current[2] -= BULLET_SPEED * delta
      meshRef.current.position.set(...posRef.current)
      if (posRef.current[2] < -55) {
        onExpire()
      }
    }
  })

  return (
    <mesh ref={meshRef} position={initialPos}>
      <sphereGeometry args={[0.12, 8, 8]} />
      <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={5} />
    </mesh>
  )
}

export function GameEntities({ isPlaying }) {
  const [obstacles, setObstacles] = useState([])
  const [bullets, setBullets] = useState([])
  const nextIdRef = useRef(0)
  const lastSpawnRef = useRef(0)
  const obstaclesRef = useRef(obstacles)
  const bulletsRef = useRef(bullets)

  // Keep refs in sync
  obstaclesRef.current = obstacles
  bulletsRef.current = bullets

  const wave = useGameStore((s) => s.wave)
  const addScore = useGameStore((s) => s.addScore)
  const takeDamage = useGameStore((s) => s.takeDamage)
  const nextWave = useGameStore((s) => s.nextWave)
  const enemiesDestroyed = useGameStore((s) => s.enemiesDestroyed)

  const speed = ENEMY_SPEED_BASE + wave * 1.5
  const spawnInterval = Math.max(0.6, 2.2 - wave * 0.15)

  const addBullet = useCallback((pos) => {
    const id = nextIdRef.current++
    setBullets((prev) => [...prev, { id, position: pos }])
  }, [])

  // Expose addBullet to PlayerShip via global
  React.useEffect(() => {
    window.__gameAddBullet = addBullet
  }, [addBullet])

  useFrame(() => {
    if (!isPlaying) return

    const now = performance.now()

    // Wave progression
    if (enemiesDestroyed > 0 && enemiesDestroyed % (5 + wave * 3) === 0) {
      nextWave()
    }

    // Spawn obstacles
    if (now - lastSpawnRef.current > spawnInterval * 1000) {
      lastSpawnRef.current = now
      const id = nextIdRef.current++
      const x = (Math.random() - 0.5) * ARENA_SIZE * 2
      const y = (Math.random() - 0.5) * ARENA_SIZE
      const z = -ENEMY_SPAWN_DISTANCE
      const isAsteroid = Math.random() > 0.45

      setObstacles((prev) => [
        ...prev,
        {
          id,
          position: [x, y, z],
          speed: speed + Math.random() * 3,
          type: isAsteroid ? 'asteroid' : 'enemy',
        },
      ])
    }

    // Collision detection using refs for fresh data
    const currentBullets = bulletsRef.current
    const currentObstacles = obstaclesRef.current
    const hitObstacles = new Set()
    const hitBullets = new Set()

    currentBullets.forEach((b) => {
      currentObstacles.forEach((o) => {
        if (hitObstacles.has(o.id) || hitBullets.has(b.id)) return
        const dx = b.position[0] - o.position[0]
        const dy = b.position[1] - o.position[1]
        const dz = b.position[2] - o.position[2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

        const hitRadius = o.type === 'asteroid' ? 0.8 : 1.2
        if (dist < hitRadius) {
          hitObstacles.add(o.id)
          hitBullets.add(b.id)
          addScore(o.type === 'asteroid' ? 15 : 25)
        }
      })
    })

    if (hitObstacles.size > 0) {
      setObstacles((prev) => prev.filter((o) => !hitObstacles.has(o.id)))
    }
    if (hitBullets.size > 0) {
      setBullets((prev) => prev.filter((b) => !hitBullets.has(b.id)))
    }
  })

  const removeObstacle = useCallback(
    (id, wasShot) => {
      setObstacles((prev) => prev.filter((o) => o.id !== id))
      if (!wasShot) {
        takeDamage(15)
      }
    },
    [takeDamage]
  )

  const expireBullet = useCallback((id) => {
    setBullets((prev) => prev.filter((b) => b.id !== id))
  }, [])

  return (
    <>
      {obstacles.map((o) =>
        o.type === 'asteroid' ? (
          <Asteroid
            key={o.id}
            position={o.position}
            speed={o.speed}
            onHit={() => removeObstacle(o.id, false)}
          />
        ) : (
          <EnemyShip
            key={o.id}
            position={o.position}
            speed={o.speed}
            onPass={() => removeObstacle(o.id, false)}
          />
        )
      )}
      {bullets.map((b) => (
        <Bullet key={b.id} position={b.position} onExpire={() => expireBullet(b.id)} />
      ))}
    </>
  )
}
