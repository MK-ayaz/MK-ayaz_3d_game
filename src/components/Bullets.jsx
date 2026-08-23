import React, { useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'

const BULLET_SPEED = 80
const BULLET_LIFETIME = 2

export function Bullets({ bullets, onBulletExpire }) {
  const meshRefs = useRef([])

  useFrame((_, delta) => {
    bullets.forEach((bullet, i) => {
      if (meshRefs.current[i]) {
        meshRefs.current[i].position.z -= BULLET_SPEED * delta
        bullet.position[2] = meshRefs.current[i].position.z

        if (Math.abs(bullet.position[2]) > 60) {
          onBulletExpire(bullet.id)
        }
      }
    })
  })

  return (
    <>
      {bullets.map((bullet, i) => (
        <mesh
          key={bullet.id}
          ref={(el) => { meshRefs.current[i] = el }}
          position={[bullet.position[0], bullet.position[1], bullet.position[2]]}
        >
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={5}
          />
        </mesh>
      ))}
    </>
  )
}

export function BulletSpawner({ isPlaying }) {
  const [bullets, setBullets] = useState([])
  const nextId = useRef(0)
  const lastShot = useRef(0)

  const shoot = useCallback((shipPosition) => {
    const now = performance.now()
    if (now - lastShot.current < 150) return
    lastShot.current = now

    const id = nextId.current++
    setBullets((prev) => [
      ...prev,
      {
        id,
        position: [shipPosition[0], shipPosition[1], shipPosition[2] + 1],
      },
    ])
  }, [])

  const expireBullet = useCallback((id) => {
    setBullets((prev) => prev.filter((b) => b.id !== id))
  }, [])

  useFrame(() => {
    // Auto-shoot while playing
    if (isPlaying) {
      shoot([0, 0, 0])
    }
  })

  return <Bullets bullets={bullets} onBulletExpire={expireBullet} />
}
