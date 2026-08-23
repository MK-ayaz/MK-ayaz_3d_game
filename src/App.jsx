import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { PlayerShip } from './components/PlayerShip'
import { GameEntities } from './components/GameEntities'
import { SpaceEnvironment } from './components/SpaceEnvironment'
import { GameUI } from './components/GameUI'
import { ParticleSystem } from './components/ParticleSystem'
import { SoundSystem } from './components/SoundSystem'
import { useGameStore } from './store'

function CameraShake() {
  const cameraRef = useRef()
  const shakeIntensity = useRef(0)
  
  useFrame((_, delta) => {
    if (!cameraRef.current) return
    
    // Decay shake intensity
    shakeIntensity.current *= 0.9
    
    if (shakeIntensity.current > 0.01) {
      cameraRef.current.position.x = (Math.random() - 0.5) * shakeIntensity.current
      cameraRef.current.position.y = 2 + (Math.random() - 0.5) * shakeIntensity.current
    } else {
      cameraRef.current.position.x = 0
      cameraRef.current.position.y = 2
    }
  })
  
  // Expose trigger function
  React.useEffect(() => {
    window.__triggerCameraShake = (intensity = 0.5) => {
      shakeIntensity.current = intensity
    }
    return () => { delete window.__triggerCameraShake }
  }, [])
  
  return <primitive ref={cameraRef} object={null} />
}

function Scene() {
  const isPlaying = useGameStore((s) => s.gameState === 'playing')

  return (
    <>
      <CameraShake />
      <SpaceEnvironment />
      <ParticleSystem />
      <PlayerShip isPlaying={isPlaying} />
      <GameEntities isPlaying={isPlaying} />
    </>
  )
}

export default function App() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <SoundSystem />
      <Canvas
        camera={{ position: [0, 2, 10], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: false, alpha: false }}
        style={{ background: '#000011' }}
      >
        <Scene />
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
      <GameUI />
    </div>
  )
}
