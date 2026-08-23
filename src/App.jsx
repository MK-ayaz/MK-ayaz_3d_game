import React from 'react'
import { Canvas } from '@react-three/fiber'
import { PlayerShip } from './components/PlayerShip'
import { GameEntities } from './components/GameEntities'
import { SpaceEnvironment } from './components/SpaceEnvironment'
import { GameUI } from './components/GameUI'
import { useGameStore } from './store'

function Scene() {
  const isPlaying = useGameStore((s) => s.gameState === 'playing')

  return (
    <>
      <SpaceEnvironment />
      <PlayerShip isPlaying={isPlaying} />
      <GameEntities isPlaying={isPlaying} />
    </>
  )
}

export default function App() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
