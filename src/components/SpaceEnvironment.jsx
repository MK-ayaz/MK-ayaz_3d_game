import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'

// ─── BIOME CONFIGURATIONS ───
export const BIOMES = {
  asteroidField: {
    name: 'ASTEROID FIELD',
    accent: '#88aaff',
    bgColor: '#000011',
    ambient: { color: '#4466aa', intensity: 0.4 },
    directional: { color: '#aaccff', intensity: 0.8 },
    starColor: '#ffffff',
    starDensity: 1.0,
    nebulaColor: '#110033',
  },
  nebula: {
    name: 'PURPLE NEBULA',
    accent: '#cc66ff',
    bgColor: '#0a0011',
    ambient: { color: '#aa44cc', intensity: 0.6 },
    directional: { color: '#ff88ff', intensity: 0.6 },
    starColor: '#ffccff',
    starDensity: 1.5,
    nebulaColor: '#330055',
  },
  enemyFleet: {
    name: 'ENEMY FLEET',
    accent: '#ff4444',
    bgColor: '#110000',
    ambient: { color: '#aa3333', intensity: 0.5 },
    directional: { color: '#ff6666', intensity: 0.7 },
    starColor: '#ffaaaa',
    starDensity: 0.6,
    nebulaColor: '#220000',
  },
  planetOrbit: {
    name: 'PLANET ORBIT',
    accent: '#00ccaa',
    bgColor: '#001a14',
    ambient: { color: '#33aaaa', intensity: 0.55 },
    directional: { color: '#88ffcc', intensity: 0.7 },
    starColor: '#ddffee',
    starDensity: 0.8,
    nebulaColor: '#003322',
  },
}

export function pickBiome(wave) {
  // Rotate every 4 waves: 1-4 field, 5-8 nebula, 9-12 fleet, 13-16 planet, 17+ cycle
  const order = ['asteroidField', 'nebula', 'enemyFleet', 'planetOrbit']
  if (wave < 1) return order[0]
  return order[Math.floor((wave - 1) / 4) % order.length]
}

// ─── Starfield (now biome-aware) ───
function Starfield({ density = 1.0, color = '#ffffff' }) {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const STAR_COUNT = Math.floor(2000 * density)

  const [positions, scales] = useMemo(() => {
    const positions = []
    const scales = []
    for (let i = 0; i < STAR_COUNT; i++) {
      positions.push(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 200 - 50
      )
      scales.push(Math.random() * 0.15 + 0.02)
    }
    return [new Float32Array(positions), new Float32Array(scales)]
  }, [STAR_COUNT])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    for (let i = 0; i < STAR_COUNT; i++) {
      const idx = i * 3
      positions[idx + 2] += delta * 5
      if (positions[idx + 2] > 50) positions[idx + 2] = -150
      dummy.position.set(positions[idx], positions[idx + 1], positions[idx + 2])
      dummy.scale.setScalar(scales[i])
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, STAR_COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color={color} />
    </instancedMesh>
  )
}

// ─── Distant nebula sphere (now biome-aware) ───
function Nebula({ color = '#110033' }) {
  const meshRef = useRef()
  // Slow rotation for life
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.01
      meshRef.current.rotation.x += delta * 0.005
    }
  })
  return (
    <mesh ref={meshRef} position={[0, 0, -80]}>
      <sphereGeometry args={[40, 32, 32]} />
      <meshBasicMaterial color={color} side={THREE.BackSide} />
    </mesh>
  )
}

// ─── Planet (only shown in planetOrbit biome) ───
function Planet() {
  const meshRef = useRef()
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05
    }
  })
  return (
    <group position={[25, 10, -50]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshStandardMaterial
          color="#2266aa"
          emissive="#114466"
          emissiveIntensity={0.3}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      {/* Atmosphere ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[12, 0.3, 8, 64]} />
        <meshBasicMaterial color="#88ddff" transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

// ─── Fleet ships (only shown in enemyFleet biome) ───
function FleetShips() {
  const groupRef = useRef()
  const ships = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      x: (Math.random() - 0.5) * 40,
      y: (Math.random() - 0.5) * 20,
      z: -40 - Math.random() * 20,
      scale: 0.8 + Math.random() * 0.6,
      speed: 1 + Math.random() * 2,
    }))
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((ship, i) => {
      ship.position.z += ships[i].speed * delta
      if (ship.position.z > 30) ship.position.z = -60
    })
  })

  return (
    <group ref={groupRef}>
      {ships.map((s, i) => (
        <group key={i} position={[s.x, s.y, s.z]} scale={s.scale}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.6, 1.8, 4]} />
            <meshStandardMaterial color="#552222" emissive="#aa3333" emissiveIntensity={0.3} />
          </mesh>
          <pointLight intensity={0.3} color="#ff4444" distance={3} />
        </group>
      ))}
    </group>
  )
}

// ─── Main environment ───
export function SpaceEnvironment() {
  const wave = useGameStore((s) => s.wave)
  const biome = pickBiome(wave)
  const cfg = BIOMES[biome]

  // Set canvas body background to biome color
  useEffect(() => {
    document.body.style.background = cfg.bgColor
  }, [cfg.bgColor])

  return (
    <>
      {/* Biome-tinted lighting */}
      <ambientLight color={cfg.ambient.color} intensity={cfg.ambient.intensity} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={cfg.directional.intensity}
        color={cfg.directional.color}
      />
      <pointLight position={[0, 0, -30]} intensity={1.5} color={cfg.ambient.color} distance={100} />
      <pointLight position={[0, 5, 5]} intensity={0.5} color="#ffffff" distance={20} />

      {/* Background nebula sphere */}
      <Nebula color={cfg.nebulaColor} />

      {/* Biome-specific background props */}
      {biome === 'planetOrbit' && <Planet />}
      {biome === 'enemyFleet' && <FleetShips />}

      {/* Starfield */}
      <Starfield density={cfg.starDensity} color={cfg.starColor} />
    </>
  )
}
