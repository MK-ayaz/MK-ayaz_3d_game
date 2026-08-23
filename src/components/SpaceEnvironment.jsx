import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Star({ position, size }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 4, 4]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  )
}

export function Starfield() {
  const groupRef = useRef()

  const stars = useMemo(() => {
    const s = []
    for (let i = 0; i < 500; i++) {
      s.push({
        position: [
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 200 - 50,
        ],
        size: Math.random() * 0.15 + 0.02,
      })
    }
    return s
  }, [])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.z += delta * 5
      if (groupRef.current.position.z > 50) {
        groupRef.current.position.z = 0
      }
    }
  })

  return (
    <group ref={groupRef}>
      {stars.map((star, i) => (
        <Star key={i} position={star.position} size={star.size} />
      ))}
    </group>
  )
}

export function SpaceEnvironment() {
  return (
    <>
      {/* Ambient space lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} color="#aaccff" />
      <pointLight position={[0, 0, -30]} intensity={1} color="#4466aa" distance={100} />

      {/* Distant nebula glow */}
      <mesh position={[0, 0, -80]}>
        <sphereGeometry args={[40, 32, 32]} />
        <meshBasicMaterial color="#110033" side={THREE.BackSide} />
      </mesh>

      <Starfield />
    </>
  )
}
