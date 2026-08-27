import React, { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PlayerShip } from './components/PlayerShip'
import { GameEntities } from './components/GameEntities'
import { SpaceEnvironment } from './components/SpaceEnvironment'
import { GameUI } from './components/GameUI'
import { ParticleSystem } from './components/ParticleSystem'
import { SoundSystem } from './components/SoundSystem'
import { PowerUps } from './components/PowerUps'
import { PostFX } from './components/PostFX'
import { EnemyProjectiles } from './components/EnemyProjectiles'
import { PlayerTrail } from './components/PlayerTrail'
import { DamageNumbers } from './components/DamageNumbers'
import { NearMissDetector } from './components/NearMissDetector'
import { useGameStore } from './store'

function CameraShake() {
  const { camera } = useThree()
  const shakeIntensity = useRef(0)
  const originalPosition = useRef([0, 2, 10])
  
  useFrame((_, delta) => {
    // Decay shake intensity
    shakeIntensity.current *= 0.9
    
    if (shakeIntensity.current > 0.01) {
      camera.position.x = (Math.random() - 0.5) * shakeIntensity.current
      camera.position.y = originalPosition.current[1] + (Math.random() - 0.5) * shakeIntensity.current
    } else {
      camera.position.x = originalPosition.current[0]
      camera.position.y = originalPosition.current[1]
    }
  })
  
  // Expose trigger function
  React.useEffect(() => {
    window.__triggerCameraShake = (intensity = 0.5) => {
      shakeIntensity.current = intensity
    }
    return () => { delete window.__triggerCameraShake }
  }, [])
  
  return null
}

function ScreenFlash() {
  const flashColor = useRef('#ffffff')
  const flashIntensity = useRef(0)
  const materialRef = useRef()

  useFrame(() => {
    if (flashIntensity.current > 0.01) {
      flashIntensity.current *= 0.85
      if (materialRef.current) {
        materialRef.current.opacity = flashIntensity.current
      }
    } else if (flashIntensity.current !== 0) {
      flashIntensity.current = 0
      if (materialRef.current) {
        materialRef.current.opacity = 0
      }
    }
  })

  React.useEffect(() => {
    window.__triggerScreenFlash = (color = '#ffffff', intensity = 0.3) => {
      flashColor.current = color
      flashIntensity.current = intensity
      if (materialRef.current) {
        materialRef.current.color.set(color)
        materialRef.current.opacity = intensity
      }
    }
    return () => { delete window.__triggerScreenFlash }
  }, [])

  return (
    <mesh position={[0, 0, 5]} renderOrder={999}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#ffffff"
        transparent
        opacity={0}
        depthTest={false}
        depthWrite={false}
        side={2}
      />
    </mesh>
  )
}

function Scene() {
  const isPlaying = useGameStore((s) => s.gameState === 'playing')

  return (
    <>
      <CameraShake />
      <ScreenFlash />
      <SpaceEnvironment />
      <ParticleSystem />
      <PlayerTrail />
      <DamageNumbers />
      <NearMissDetector />
      <PowerUps isPlaying={isPlaying} />
      <PlayerShip isPlaying={isPlaying} />
      <GameEntities isPlaying={isPlaying} />
      <EnemyProjectiles />
      <PostFX />
    </>
  )
}

export default function App() {
  // Expose player position and hit handler globally so enemy projectiles can collide
  React.useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      window.__playerPos = state.playerPosition
    })
    window.__playerPos = useGameStore.getState().playerPosition
    window.__playerHit = (amount, hitFromPos) => {
      const store = useGameStore.getState()
      store.takeDamage(amount)
      if (window.__soundManager) window.__soundManager.playHit()
      if (window.__triggerCameraShake) window.__triggerCameraShake(0.4)
      if (window.__triggerScreenFlash) window.__triggerScreenFlash('#ff0000', 0.15)
    }
    return () => {
      unsub()
      delete window.__playerHit
    }
  }, [])

  // Auto-pause when tab is hidden
  React.useEffect(() => {
    const handleVis = () => {
      if (document.hidden && useGameStore.getState().gameState === 'playing') {
        useGameStore.getState().pauseGame()
      }
    }
    document.addEventListener('visibilitychange', handleVis)
    return () => document.removeEventListener('visibilitychange', handleVis)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <SoundSystem />
      <Canvas
        camera={{ position: [0, 2, 10], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#000011' }}
      >
        <Scene />
      </Canvas>
      <GameUI />
    </div>
  )
}
