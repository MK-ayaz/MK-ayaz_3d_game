import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Visual charge indicator around the player ship.
 * - Renders a ring + glowing sphere that scales with charge level.
 * - Subscribes to the global charge state set by PlayerShip via window.__gameChargeState.
 */
export function ChargedShot() {
  const ringRef = useRef()
  const orbRef = useRef()
  const lightRef = useRef()
  const chargeStateRef = useRef(0) // latest charge value, updated each frame
  const pulseRef = useRef(0)

  useEffect(() => {
    // Expose a callback the PlayerShip can call to update the latest charge
    window.__gameChargeState = (value) => {
      chargeStateRef.current = value
    }
    return () => { delete window.__gameChargeState }
  }, [])

  useFrame((_, delta) => {
    const c = chargeStateRef.current
    pulseRef.current += delta

    if (ringRef.current) {
      const visible = c > 0.05
      ringRef.current.visible = visible
      if (visible) {
        // Pulse scale with breathing effect
        const pulse = 1 + Math.sin(pulseRef.current * 8) * 0.05
        const scale = 0.6 + c * 1.0 * pulse
        ringRef.current.scale.set(scale, scale, scale)
        // Rotate
        ringRef.current.rotation.z += delta * (1 + c * 2)
        // Color shifts cyan → yellow → red as it charges
        const mat = ringRef.current.material
        if (mat) {
          const hue = THREE.MathUtils.lerp(0.5, 0.05, c) // 0.5 cyan → 0.05 red
          mat.color.setHSL(hue, 1, 0.6)
          mat.emissive.setHSL(hue, 1, 0.5)
          mat.emissiveIntensity = 2 + c * 4
          mat.opacity = 0.4 + c * 0.5
        }
      }
    }

    if (orbRef.current) {
      const visible = c > 0.05
      orbRef.current.visible = visible
      if (visible) {
        const s = 0.1 + c * 0.3
        orbRef.current.scale.set(s, s, s)
        const mat = orbRef.current.material
        if (mat) {
          const hue = THREE.MathUtils.lerp(0.5, 0.05, c)
          mat.color.setHSL(hue, 1, 0.7)
          mat.emissive.setHSL(hue, 1, 0.6)
          mat.emissiveIntensity = 3 + c * 6
        }
      }
    }

    if (lightRef.current) {
      lightRef.current.intensity = c > 0.05 ? 1 + c * 4 : 0
    }
  })

  return (
    <>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[0.9, 0.05, 8, 32]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={3}
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={orbRef} position={[0, 0, -1.2]} visible={false}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={5}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0, -1.2]} intensity={0} color="#00ffff" distance={5} />
    </>
  )
}
