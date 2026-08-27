import React from 'react'
import { useGameStore } from '../store'

export function StatsPanel({ onClose }) {
  const totalKills = useGameStore((s) => s.totalKills)
  const totalGamesPlayed = useGameStore((s) => s.totalGamesPlayed)
  const bestScore = useGameStore((s) => s.bestScore)
  const bestWave = useGameStore((s) => s.bestWave)
  const highScore = useGameStore((s) => s.highScore)
  const shotsFired = useGameStore((s) => s.shotsFired)
  const shotsHit = useGameStore((s) => s.shotsHit)
  const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)',
      pointerEvents: 'auto',
      zIndex: 110,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        width: '90%',
        maxWidth: 480,
        background: 'linear-gradient(180deg, rgba(20,30,60,0.98) 0%, rgba(0,0,0,0.98) 100%)',
        border: '1px solid #00ccff',
        borderRadius: 12,
        padding: 28,
        boxShadow: '0 0 40px rgba(0,170,255,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: '#00ccff', fontSize: 24, margin: 0, letterSpacing: 3, textShadow: '0 0 10px #00aaff' }}>
            📊 CAREER STATS
          </h2>
          <button onClick={onClose} style={{
            padding: '6px 14px', fontSize: 12, color: '#aaa', background: 'transparent',
            border: '1px solid #666', borderRadius: 6, cursor: 'pointer',
          }}>CLOSE</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
          <Stat label="GAMES PLAYED" value={totalGamesPlayed} color="#88aaff" />
          <Stat label="HIGH SCORE" value={highScore.toLocaleString()} color="#ffd700" />
          <Stat label="BEST SCORE" value={bestScore.toLocaleString()} color="#ffd700" />
          <Stat label="BEST WAVE" value={bestWave} color="#ffaa00" />
          <Stat label="TOTAL KILLS" value={totalKills.toLocaleString()} color="#ff6666" />
          <Stat label="SHOTS FIRED" value={shotsFired.toLocaleString()} color="#88aaff" />
          <Stat label="SHOTS HIT" value={shotsHit.toLocaleString()} color="#00ff88" />
          <Stat label="ACCURACY" value={`${accuracy}%`} color={accuracy > 50 ? '#00ff88' : '#ffaa00'} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ color: '#666', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ color, fontSize: 22, fontWeight: 'bold', textShadow: `0 0 6px ${color}` }}>
        {value}
      </div>
    </div>
  )
}
