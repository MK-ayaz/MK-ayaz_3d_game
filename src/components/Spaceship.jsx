import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Spaceship({ position, rotation }) {
  const groupRef = useRef()

  const hullGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 1.5)
    shape.lineTo(-0.6, -0.8)
    shape.lineTo(-0.3, -0.5)
    shape.lineTo(0, -0.8)
    shape.lineTo(0.3, -0.5)
    shape.lineTo(0.6, -0.8)
    shape.closePath()

    const extrudeSettings = { depth: 0.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 3 }
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [])

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2])
      groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2])
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main hull */}
      <mesh geometry={hullGeometry} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.2]}>
        <meshStandardMaterial color="#00aaff" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Cockpit */}
      <mesh position={[0, 0.3, 0.3]}>
        <sphereGeometry args={[0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#66ddff" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>

      {/* Left wing */}
      <mesh position={[-0.8, -0.1, 0]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.8, 0.08, 0.5]} />
        <meshStandardMaterial color="#0077cc" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Right wing */}
      <mesh position={[0.8, -0.1, 0]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.8, 0.08, 0.5]} />
        <meshStandardMaterial color="#0077cc" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Engine glow - left */}
      <mesh position={[-0.4, -0.1, -0.5]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={3} />
      </mesh>

      {/* Engine glow - right */}
      <mesh position={[0.4, -0.1, -0.5]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={3} />
      </mesh>
    </group>
  )
}
