import React, { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'

const ENEMY_SPEED_BASE = 8
const ENEMY_SPAWN_DISTANCE = 50
const ARENA_SIZE = 12

function Asteroid({ initialPosition, speed, onHit }) {
  const meshRef = useRef()
  const [position, setPosition] = useState(initialPosition)
  const rotationSpeed = useMemo(() => [
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
      meshRef.current.position.z += speed * delta
      meshRef.current.rotation.x += rotationSpeed[0] * delta
      meshRef.current.rotation.y += rotationSpeed[1] * delta
      meshRef.current.rotation.z += rotationSpeed[2] * delta

      setPosition([meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z])

      if (meshRef.current.position.z > 10) {
        onHit()
      }
    }
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={position}
      scale={scale}
    >
      <meshStandardMaterial color="#888888" roughness={0.9} metalness={0.1} flatShading />
    </mesh>
  )
}

function Enemy({ initialPosition, speed, onDestroy, enemyId }) {
  const meshRef = useRef()
  const [position, setPosition] = useState(initialPosition)
  const [visible, setVisible] = useState(true)

  useFrame((_, delta) => {
    if (meshRef.current && visible) {
      meshRef.current.position.z += speed * delta
      meshRef.current.rotation.y += 3 * delta
      setPosition([meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z])

      if (meshRef.current.position.z > 10) {
        setVisible(false)
        onDestroy(enemyId, false)
      }
    }
  })

  if (!visible) return null

  return (
    <group ref={meshRef} position={position}>
      {/* Enemy body */}
      <mesh>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Enemy glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.05, 8, 16]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

export function Enemies() {
  const [enemies, setEnemies] = useState([])
  const nextEnemyId = useRef(0)
  const lastSpawn = useRef(0)
  const wave = useGameStore((s) => s.wave)
  const gameState = useGameStore((s) => s.gameState)
  const addScore = useGameStore((s) => s.addScore)
  const takeDamage = useGameStore((s) => s.takeDamage)
  const nextWave = useGameStore((s) => s.nextWave)
  const enemiesDestroyed = useGameStore((s) => s.enemiesDestroyed)

  const speed = ENEMY_SPEED_BASE + wave * 1.5
  const spawnInterval = Math.max(0.5, 2 - wave * 0.15)

  useFrame(() => {
    if (gameState !== 'playing') return

    const now = performance.now()

    // Wave progression
    if (enemiesDestroyed > 0 && enemiesDestroyed % (5 + wave * 2) === 0) {
      nextWave()
    }

    // Spawn enemies
    if (now - lastSpawn.current > spawnInterval * 1000) {
      lastSpawn.current = now
      const id = nextEnemyId.current++
      const x = (Math.random() - 0.5) * ARENA_SIZE * 2
      const y = (Math.random() - 0.5) * ARENA_SIZE
      const z = -ENEMY_SPAWN_DISTANCE

      const isAsteroid = Math.random() > 0.5

      setEnemies((prev) => [
        ...prev,
        { id, position: [x, y, z], speed: speed + Math.random() * 3, type: isAsteroid ? 'asteroid' : 'enemy' },
      ])
    }
  })

  const handleDestroy = (id, wasShot) => {
    setEnemies((prev) => prev.filter((e) => e.id !== id))
    if (wasShot) {
      addScore(10)
    } else {
      takeDamage(20)
    }
  }

  return (
    <>
      {enemies.map((enemy) =>
        enemy.type === 'asteroid' ? (
          <Asteroid
            key={enemy.id}
            initialPosition={enemy.position}
            speed={enemy.speed}
            onHit={() => handleDestroy(enemy.id, false)}
          />
        ) : (
          <Enemy
            key={enemy.id}
            initialPosition={enemy.position}
            speed={enemy.speed}
            enemyId={enemy.id}
            onDestroy={handleDestroy}
          />
        )
      )}
    </>
  )
}
