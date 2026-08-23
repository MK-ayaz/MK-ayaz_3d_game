import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MAX_PARTICLES = 500
const PARTICLE_LIFETIME = 1.5

export function ParticleSystem() {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const particles = useRef([])

  const triggerExplosion = (position, color, count = 30) => {
    const newParticles = []
    for (let i = 0; i < count; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      )
      newParticles.push({
        position: [...position],
        velocity,
        life: PARTICLE_LIFETIME,
        maxLife: PARTICLE_LIFETIME,
        color,
        size: Math.random() * 0.3 + 0.1
      })
    }
    particles.current.push(...newParticles)
  }

  useFrame((_, delta) => {
    if (!meshRef.current) return

    const activeParticles = []
    let instanceIndex = 0

    particles.current.forEach((p) => {
      p.life -= delta
      
      if (p.life > 0 && instanceIndex < MAX_PARTICLES) {
        // Update position
        p.position[0] += p.velocity.x * delta
        p.position[1] += p.velocity.y * delta
        p.position[2] += p.velocity.z * delta
        
        // Apply drag
        p.velocity.multiplyScalar(0.98)
        
        // Set instance matrix
        dummy.position.set(...p.position)
        const scale = (p.life / p.maxLife) * p.size
        dummy.scale.setScalar(scale)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(instanceIndex, dummy.matrix)
        
        // Set color with fade
        const alpha = p.life / p.maxLife
        meshRef.current.setColorAt(instanceIndex, new THREE.Color(p.color).multiplyScalar(alpha))
        
        instanceIndex++
        activeParticles.push(p)
      }
    })

    particles.current = activeParticles
    meshRef.current.count = instanceIndex
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  })

  // Expose trigger function globally
  React.useEffect(() => {
    window.__triggerExplosion = triggerExplosion
    return () => { delete window.__triggerExplosion }
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[null, null, MAX_PARTICLES]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent vertexColors />
    </instancedMesh>
)
}
