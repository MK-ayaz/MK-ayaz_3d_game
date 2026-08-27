import React, { useRef, useEffect, useState } from 'react'
import { useGameStore } from '../store'

const SIZE = 110
const WORLD_X = 24
const WORLD_Z = 80

/**
 * HUD minimap: top-down 2D representation of player + nearby enemies/boss/projectiles.
 * Polls `window.__gameEnemies` for enemy positions.
 */
export function Minimap() {
  const gameState = useGameStore((s) => s.gameState)
  const playerPos = useGameStore((s) => s.playerPosition)
  const bossActive = useGameStore((s) => s.bossActive)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (gameState !== 'playing') return
    let raf
    const loop = () => {
      setTick((t) => t + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [gameState])

  if (gameState !== 'playing' && gameState !== 'upgrading' && gameState !== 'paused') return null

  const enemies = window.__gameEnemies || []
  const toMapX = (x) => SIZE / 2 + (x / WORLD_X) * (SIZE / 2)
  const toMapY = (z) => SIZE / 2 + (z / -WORLD_Z) * (SIZE / 2) // -Z is "up" on minimap

  return (
    <div style={{
      position: 'absolute',
      top: 80,
      left: 20,
      width: SIZE,
      height: SIZE,
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(0,170,255,0.5)',
      borderRadius: 8,
      boxShadow: '0 0 10px rgba(0,170,255,0.3)',
      overflow: 'hidden',
    }}>
      {/* Grid lines */}
      <svg width={SIZE} height={SIZE} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
        <line x1="0" y1={SIZE / 2} x2={SIZE} y2={SIZE / 2} stroke="rgba(0,170,255,0.2)" strokeWidth="1" />
        <line x1={SIZE / 2} y1="0" x2={SIZE / 2} y2={SIZE} stroke="rgba(0,170,255,0.2)" strokeWidth="1" />
        <rect x="0" y="0" width={SIZE} height={SIZE} fill="none" stroke="rgba(0,170,255,0.1)" />
      </svg>

      {/* Player dot */}
      {playerPos && (
        <div style={{
          position: 'absolute',
          left: toMapX(playerPos[0]) - 3,
          top: toMapY(playerPos[2]) - 3,
          width: 6, height: 6,
          borderRadius: '50%',
          background: '#00ffff',
          boxShadow: '0 0 6px #00ffff',
        }} />
      )}

      {/* Enemy dots */}
      {enemies.filter((e) => e.active).map((e, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: toMapX(e.pos[0]) - 1.5,
          top: toMapY(e.pos[2]) - 1.5,
          width: 3, height: 3,
          borderRadius: '50%',
          background: '#ff4444',
        }} />
      ))}

      {/* Boss dot */}
      {bossActive && (
        <div style={{
          position: 'absolute',
          left: SIZE / 2 - 4,
          top: toMapY(-30) - 4,
          width: 8, height: 8,
          borderRadius: '50%',
          background: '#ff00ff',
          boxShadow: '0 0 8px #ff00ff',
        }} />
      )}

      {/* Label */}
      <div style={{
        position: 'absolute',
        top: 2, left: 4,
        fontSize: 8,
        color: 'rgba(0,170,255,0.6)',
        letterSpacing: 1,
      }}>
        SCANNER
      </div>
    </div>
  )
}
