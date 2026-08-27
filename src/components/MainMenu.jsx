import React, { useState } from 'react'
import { useGameStore } from '../store'

const SHIPS = [
  {
    key: 'fighter',
    name: 'FIGHTER',
    icon: '🚀',
    color: '#00ccff',
    description: 'Balanced. Good for first runs.',
    stats: { hp: 100, speed: 1.0, damage: 1, fireRate: 1.0 },
  },
  {
    key: 'interceptor',
    name: 'INTERCEPTOR',
    icon: '⚡',
    color: '#00ff88',
    description: 'Fast, fragile. Glass cannon.',
    stats: { hp: 70, speed: 1.5, damage: 1, fireRate: 1.2 },
  },
  {
    key: 'destroyer',
    name: 'DESTROYER',
    icon: '🛡️',
    color: '#ff8800',
    description: 'Slow, tanky. Double shot.',
    stats: { hp: 175, speed: 0.75, damage: 1, fireRate: 0.85 },
  },
]

export function MainMenu({ onStart, onShowAchievements, onShowSettings, onShowDaily, onShowStats }) {
  const shipType = useGameStore((s) => s.shipType)
  const setShipType = useGameStore((s) => s.setShipType)
  const highScore = useGameStore((s) => s.highScore)
  const totalGamesPlayed = useGameStore((s) => s.totalGamesPlayed)
  const bestWave = useGameStore((s) => s.bestWave)
  const totalKills = useGameStore((s) => s.totalKills)

  const selected = SHIPS.find((s) => s.key === shipType) || SHIPS[0]

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, rgba(0,30,80,0.92) 0%, rgba(0,0,0,0.97) 100%)',
      pointerEvents: 'auto',
      zIndex: 80,
      animation: 'fadeIn 0.4s ease-out',
    }}>
      {/* Title */}
      <h1 style={{
        fontSize: 72,
        fontWeight: 'bold',
        color: '#00ccff',
        textShadow: '0 0 30px #00aaff, 0 0 60px #0066ff',
        marginBottom: 4,
        letterSpacing: 6,
        margin: 0,
      }}>
        VOID HUNTER
      </h1>
      <p style={{
        color: '#88aacc',
        fontSize: 14,
        marginBottom: 32,
        letterSpacing: 6,
        textTransform: 'uppercase',
      }}>
        A Roguelite Space Shooter
      </p>

      {/* High score banner */}
      {highScore > 0 && (
        <div style={{
          color: '#ffd700',
          fontSize: 14,
          marginBottom: 24,
          padding: '6px 20px',
          background: 'rgba(255,215,0,0.1)',
          border: '1px solid rgba(255,215,0,0.4)',
          borderRadius: 20,
          textShadow: '0 0 8px #ffd700',
          letterSpacing: 2,
        }}>
          ★ HIGH SCORE: {highScore.toLocaleString()} ★
        </div>
      )}

      {/* Ship selection */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          color: '#88aacc',
          fontSize: 12,
          letterSpacing: 4,
          textAlign: 'center',
          marginBottom: 10,
        }}>
          CHOOSE YOUR SHIP
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {SHIPS.map((ship) => (
            <div
              key={ship.key}
              onClick={() => setShipType(ship.key)}
              style={{
                width: 110,
                padding: '14px 10px',
                background: shipType === ship.key
                  ? `linear-gradient(135deg, ${ship.color}33, ${ship.color}11)`
                  : 'rgba(255,255,255,0.04)',
                border: `2px solid ${shipType === ship.key ? ship.color : '#444'}`,
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                boxShadow: shipType === ship.key ? `0 0 20px ${ship.color}66` : 'none',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 4 }}>{ship.icon}</div>
              <div style={{
                color: shipType === ship.key ? ship.color : '#888',
                fontSize: 11,
                fontWeight: 'bold',
                letterSpacing: 1.5,
                textShadow: shipType === ship.key ? `0 0 6px ${ship.color}` : 'none',
              }}>
                {ship.name}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          color: '#aaa',
          fontSize: 12,
          textAlign: 'center',
          marginTop: 8,
          maxWidth: 360,
        }}>
          {selected.description}
          <div style={{ marginTop: 4, fontSize: 10, color: '#666' }}>
            HP {selected.stats.hp} · SPD {selected.stats.speed}× · FR {selected.stats.fireRate}×
          </div>
        </div>
      </div>

      {/* Primary buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        <button
          onClick={onStart}
          style={{
            padding: '16px 64px',
            fontSize: 22,
            fontWeight: 'bold',
            color: '#001122',
            background: `linear-gradient(135deg, ${selected.color}, ${selected.color}aa)`,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            boxShadow: `0 0 30px ${selected.color}80`,
            letterSpacing: 4,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          START MISSION
        </button>
        <button
          onClick={onShowDaily}
          style={{
            padding: '10px 32px',
            fontSize: 14,
            fontWeight: 'bold',
            color: '#ffdd00',
            background: 'rgba(255,221,0,0.08)',
            border: '1px solid #ffdd00',
            borderRadius: 6,
            cursor: 'pointer',
            letterSpacing: 2,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,221,0,0.15)'
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,221,0,0.08)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          ⚡ DAILY CHALLENGE
        </button>
      </div>

      {/* Secondary buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <MenuButton onClick={onShowStats} label="📊 STATS" />
        <MenuButton onClick={onShowAchievements} label="🏆 ACHIEVEMENTS" />
        <MenuButton onClick={onShowSettings} label="⚙ SETTINGS" />
      </div>

      {/* Controls reference */}
      <div style={{
        color: 'rgba(255,255,255,0.45)',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 1.7,
        padding: 12,
        borderTop: '1px solid rgba(255,255,255,0.1)',
        maxWidth: 500,
        letterSpacing: 0.5,
      }}>
        <div><b style={{ color: '#00ccff' }}>WASD / Arrows</b> — Move &nbsp;·&nbsp; <b style={{ color: '#00ccff' }}>TAP SPACE</b> — Shoot &nbsp;·&nbsp; <b style={{ color: '#00ccff' }}>HOLD SPACE</b> — Charge Spread</div>
        <div><b style={{ color: '#00ccff' }}>B</b> — Smart Bomb &nbsp;·&nbsp; <b style={{ color: '#00ccff' }}>ESC</b> — Pause</div>
        <div style={{ marginTop: 6, color: '#ff8866' }}>
          Survive 5 waves to face a boss. Pick upgrades between waves.
        </div>
      </div>

      {/* Footer stats */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        color: 'rgba(255,255,255,0.25)',
        fontSize: 10,
        letterSpacing: 2,
      }}>
        GAMES: {totalGamesPlayed} · BEST WAVE: {bestWave} · TOTAL KILLS: {totalKills.toLocaleString()}
      </div>
    </div>
  )
}

function MenuButton({ onClick, label }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '8px 16px',
        fontSize: 12,
        color: hover ? '#fff' : '#888',
        background: hover ? 'rgba(255,255,255,0.1)' : 'transparent',
        border: '1px solid #555',
        borderRadius: 6,
        cursor: 'pointer',
        letterSpacing: 1.5,
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  )
}
