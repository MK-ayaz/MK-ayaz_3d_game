import React, { useState, useEffect } from 'react'
import { useGameStore } from '../store'

/**
 * Tutorial overlay that appears during wave 1 and shows contextual prompts
 * for each mechanic. Each prompt disappears once the player demonstrates the action.
 */
const PROMPTS = [
  {
    id: 'move',
    title: 'MOVE',
    description: 'Press WASD or Arrow Keys to fly your ship',
    icon: '🛩️',
    check: (state) => {
      const k = window.__lastKey || {}
      return k.wasd || k.arrows
    },
  },
  {
    id: 'shoot',
    title: 'AUTO-FIRE',
    description: 'Your ship fires automatically. Watch the bullets fly!',
    icon: '🔫',
    check: (state) => state.shotsFired >= 5,
  },
  {
    id: 'charge',
    title: 'CHARGE SHOT',
    description: 'Hold SPACE for 1 second, then release to fire a 5-way spread!',
    icon: '💥',
    check: (state) => window.__spreadFired || false,
  },
  {
    id: 'dodge',
    title: 'NEAR-MISS',
    description: 'Dodge enemies closely for bonus points! Try to fly right past one.',
    icon: '💨',
    check: (state) => (state.score > 0 && (state.shotsHit / Math.max(1, state.shotsFired)) > 0) || window.__nearMissTriggered,
  },
  {
    id: 'pickup',
    title: 'POWER-UPS',
    description: 'Glowing octahedrons give you boosts. Fly into one!',
    icon: '⚡',
    check: (state) => state.powerUpsCollected > 0,
  },
]

export function TutorialOverlay() {
  const wave = useGameStore((s) => s.wave)
  const [shownPrompts, setShownPrompts] = useState({})
  const [currentPrompt, setCurrentPrompt] = useState(null)

  useEffect(() => {
    if (wave !== 1) {
      setCurrentPrompt(null)
      return
    }
    // Show first unshown prompt
    for (const p of PROMPTS) {
      if (!shownPrompts[p.id]) {
        setCurrentPrompt(p)
        break
      }
    }
  }, [wave, shownPrompts])

  // Poll the check function
  useEffect(() => {
    if (!currentPrompt) return
    const id = setInterval(() => {
      const state = useGameStore.getState()
      if (currentPrompt.check(state)) {
        setShownPrompts((prev) => ({ ...prev, [currentPrompt.id]: true }))
      }
    }, 200)
    return () => clearInterval(id)
  }, [currentPrompt])

  if (wave !== 1 || !currentPrompt) return null

  return (
    <div style={{
      position: 'absolute',
      top: 110,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 30, 60, 0.92)',
      border: '2px solid #00ccff',
      borderRadius: 10,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      zIndex: 40,
      boxShadow: '0 0 20px rgba(0,170,255,0.5)',
      animation: 'fadeIn 0.3s ease-out',
      maxWidth: 480,
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: 32 }}>{currentPrompt.icon}</div>
      <div>
        <div style={{
          color: '#00ccff',
          fontSize: 11,
          fontWeight: 'bold',
          letterSpacing: 3,
          textShadow: '0 0 6px #00aaff',
        }}>
          {currentPrompt.title}
        </div>
        <div style={{
          color: '#fff',
          fontSize: 13,
          marginTop: 2,
        }}>
          {currentPrompt.description}
        </div>
      </div>
    </div>
  )
}
