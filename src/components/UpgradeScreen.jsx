import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store'

export const UPGRADE_CATALOG = [
  {
    key: 'damage',
    name: 'Damage Up',
    description: '+1 damage per bullet',
    icon: '⚔️',
    color: '#ff4444',
  },
  {
    key: 'fireRate',
    name: 'Rapid Fire',
    description: 'Fire rate +15%',
    icon: '🔥',
    color: '#ff8800',
  },
  {
    key: 'moveSpeed',
    name: 'Thrusters',
    description: 'Move speed +10%',
    icon: '💨',
    color: '#00ccff',
  },
  {
    key: 'maxHp',
    name: 'Hull Plating',
    description: '+25 max HP & full heal',
    icon: '🛡️',
    color: '#00ff88',
  },
  {
    key: 'multishot',
    name: 'Multi-Shot',
    description: 'Adds 2 side bullets',
    icon: '🔱',
    color: '#ffaa00',
  },
  {
    key: 'critChance',
    name: 'Crit System',
    description: '+10% crit chance (2x)',
    icon: '💥',
    color: '#ff00ff',
  },
  {
    key: 'projSize',
    name: 'Heavy Rounds',
    description: 'Bullets +20% larger',
    icon: '🎯',
    color: '#ffff00',
  },
  {
    key: 'lifesteal',
    name: 'Nano-Repair',
    description: 'Heal 1% of damage dealt',
    icon: '💚',
    color: '#88ff88',
  },
]

function pickRandomUpgrades(count, currentUpgrades) {
  // Bias away from upgrades that are already maxed (e.g., damage > 10)
  const candidates = UPGRADE_CATALOG.filter((u) => (currentUpgrades[u.key] || 0) < 10)
  if (candidates.length === 0) return []
  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function UpgradeScreen() {
  const gameState = useGameStore((s) => s.gameState)
  const wave = useGameStore((s) => s.wave)
  const upgrades = useGameStore((s) => s.upgrades)
  const applyUpgrade = useGameStore((s) => s.applyUpgrade)
  const [choices, setChoices] = useState([])
  const [animation, setAnimation] = useState('in')

  useEffect(() => {
    if (gameState === 'upgrading') {
      setChoices(pickRandomUpgrades(3, upgrades))
      setAnimation('in')
    }
  }, [gameState, wave, upgrades])

  if (gameState !== 'upgrading') return null

  const handlePick = (key) => {
    if (window.__soundManager) window.__soundManager.playPowerUp?.()
    applyUpgrade(key)
    setAnimation('out')
    setTimeout(() => {
      // Resume game
      useGameStore.setState({ gameState: 'playing' })
    }, 250)
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, rgba(20,0,40,0.92) 0%, rgba(0,0,0,0.96) 100%)',
      pointerEvents: 'auto',
      zIndex: 100,
      animation: animation === 'in' ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.25s ease-in',
    }}>
      <h2 style={{
        fontSize: 40,
        fontWeight: 'bold',
        color: '#ffdd00',
        textShadow: '0 0 20px #ffaa00, 0 0 40px #ff6600',
        marginBottom: 8,
        letterSpacing: 4,
      }}>
        WAVE {wave} COMPLETE
      </h2>
      <p style={{ color: '#aaaacc', fontSize: 16, marginBottom: 40, letterSpacing: 2 }}>
        Choose an upgrade
      </p>

      <div style={{
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 900,
      }}>
        {choices.map((choice, i) => (
          <div
            key={choice.key}
            onClick={() => handlePick(choice.key)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.06) translateY(-4px)'
              e.currentTarget.style.boxShadow = `0 0 30px ${choice.color}80`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = `0 0 12px ${choice.color}40`
            }}
            style={{
              width: 220,
              padding: '20px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: `2px solid ${choice.color}`,
              borderRadius: 12,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              boxShadow: `0 0 12px ${choice.color}40`,
              animation: `fadeIn 0.3s ease-out ${i * 0.08}s both`,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 8 }}>{choice.icon}</div>
            <div style={{
              color: choice.color,
              fontSize: 18,
              fontWeight: 'bold',
              textShadow: `0 0 8px ${choice.color}`,
              marginBottom: 4,
            }}>
              {choice.name}
            </div>
            <div style={{
              color: '#cccccc',
              fontSize: 13,
              lineHeight: 1.4,
            }}>
              {choice.description}
            </div>
            <div style={{
              color: '#666',
              fontSize: 11,
              marginTop: 8,
              letterSpacing: 1,
            }}>
              TIER {(upgrades[choice.key] || 0) + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
