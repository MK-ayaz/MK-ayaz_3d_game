import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Starfield() {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const STAR_COUNT = 2000

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
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current) return

    // Animate starfield movement
    for (let i = 0; i < STAR_COUNT; i++) {
      const idx = i * 3
      positions[idx + 2] += delta * 5
      
      // Reset star when it passes the camera
      if (positions[idx + 2] > 50) {
        positions[idx + 2] = -150
      }

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
      <meshBasicMaterial color="#ffffff" />
    </instancedMesh>
  )
}

export function SpaceEnvironment() {
  return (
    <>
      {/* Ambient space lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} color="#aaccff" />
      <pointLight position={[0, 0, -30]} intensity={1.5} color="#4466aa" distance={100} />
      <pointLight position={[0, 5, 5]} intensity={0.5} color="#ffffff" distance={20} />

      {/* Distant nebula glow */}
      <mesh position={[0, 0, -80]}>
        <sphereGeometry args={[40, 32, 32]} />
        <meshBasicMaterial color="#110033" side={THREE.BackSide} />
      </mesh>

      <Starfield />
    </>
  )
}
