import React, { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { PlayerShip } from './components/PlayerShip'
import { GameEntities } from './components/GameEntities'
import { SpaceEnvironment } from './components/SpaceEnvironment'
import { GameUI } from './components/GameUI'
import { ParticleSystem } from './components/ParticleSystem'
import { SoundSystem } from './components/SoundSystem'
import { PowerUps } from './components/PowerUps'
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

function Scene() {
  const isPlaying = useGameStore((s) => s.gameState === 'playing')

  return (
    <>
      <CameraShake />
      <SpaceEnvironment />
      <ParticleSystem />
      <PowerUps isPlaying={isPlaying} />
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
