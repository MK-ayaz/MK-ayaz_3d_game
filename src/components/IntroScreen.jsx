import React, { useEffect, useState, useRef } from 'react'
import { useGameStore } from '../store'
import { pickBiome, BIOMES } from './SpaceEnvironment'

/**
 * Shows a "WAVE N — BIOME NAME" intro card for 1.5s when a new biome begins.
 * Triggers when the biome (derived from wave) changes during active play.
 */
export function IntroScreen() {
  const wave = useGameStore((s) => s.wave)
  const gameState = useGameStore((s) => s.gameState)
  const [show, setShow] = useState(false)
  const [content, setContent] = useState({ wave: 1, biome: 'asteroidField' })
  const lastBiome = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (gameState !== 'playing') {
      setShow(false)
      return
    }
    const biome = pickBiome(wave)
    if (biome !== lastBiome.current) {
      lastBiome.current = biome
      setContent({ wave, biome })
      setShow(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setShow(false), 2000)
      if (window.__soundManager) window.__soundManager.playPowerUp?.()
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [wave, gameState])

  if (!show) return null

  const cfg = BIOMES[content.biome]

  return (
    <div style={{
      position: 'absolute',
      top: '30%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      pointerEvents: 'none',
      zIndex: 50,
      animation: 'fadeIn 0.4s ease-out',
    }}>
      <div style={{
        color: '#ffffff66',
        fontSize: 14,
        letterSpacing: 8,
        marginBottom: 8,
        textShadow: '0 0 10px rgba(255,255,255,0.5)',
      }}>
        WAVE
      </div>
      <div style={{
        color: '#ffffff',
        fontSize: 96,
        fontWeight: 'bold',
        lineHeight: 1,
        textShadow: '0 0 30px ' + cfg.accent + ', 0 0 60px ' + cfg.accent,
        marginBottom: 16,
      }}>
        {content.wave}
      </div>
      <div style={{
        color: cfg.accent,
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 6,
        textShadow: '0 0 15px ' + cfg.accent,
        borderTop: '1px solid ' + cfg.accent + '66',
        borderBottom: '1px solid ' + cfg.accent + '66',
        padding: '8px 24px',
        display: 'inline-block',
      }}>
        {cfg.name}
      </div>
    </div>
  )
}
