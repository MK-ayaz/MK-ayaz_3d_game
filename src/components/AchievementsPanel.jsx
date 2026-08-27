import React from 'react'
import { useGameStore } from '../store'

const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'First Blood', description: 'Destroy your first enemy', icon: '🎯', tier: 'bronze' },
  { id: 'combo_master', name: 'Combo Master', description: 'Reach 10x combo', icon: '🔥', tier: 'silver' },
  { id: 'wave_survivor', name: 'Wave Survivor', description: 'Reach wave 5', icon: '🌊', tier: 'silver' },
  { id: 'score_hunter', name: 'Score Hunter', description: 'Score 1,000 points', icon: '💯', tier: 'bronze' },
  { id: 'power_collector', name: 'Power Collector', description: 'Collect 5 power-ups', icon: '⚡', tier: 'bronze' },
  { id: 'combo_legend', name: 'Combo Legend', description: 'Reach 25x combo', icon: '👑', tier: 'gold' },
  { id: 'wave_master', name: 'Wave Master', description: 'Reach wave 10', icon: '🏆', tier: 'gold' },
  { id: 'high_scorer', name: 'High Scorer', description: 'Score 5,000 points', icon: '🌟', tier: 'gold' },
  { id: 'perfect_game', name: 'Perfect Wave', description: 'Complete a wave without taking damage', icon: '💎', tier: 'platinum' },
  { id: 'bomb_first', name: 'Tactical Nuke', description: 'Use your first smart bomb', icon: '💣', tier: 'bronze' },
  { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeat your first boss', icon: '⚔️', tier: 'silver' },
  { id: 'untouchable', name: 'Untouchable', description: 'Reach wave 5 without taking damage', icon: '🛡️', tier: 'platinum' },
]

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
}

export function AchievementsPanel({ onClose }) {
  const unlocked = useGameStore((s) => s.achievements)
  const unlockedCount = unlocked.length
  const totalCount = ACHIEVEMENTS.length

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
        maxWidth: 720,
        maxHeight: '85vh',
        background: 'linear-gradient(180deg, rgba(20,30,60,0.98) 0%, rgba(0,0,0,0.98) 100%)',
        border: '1px solid #00ccff',
        borderRadius: 12,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 40px rgba(0,170,255,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#00ccff', fontSize: 28, margin: 0, letterSpacing: 4, textShadow: '0 0 10px #00aaff' }}>
            🏆 ACHIEVEMENTS
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              fontSize: 14,
              color: '#aaa',
              background: 'transparent',
              border: '1px solid #666',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            CLOSE
          </button>
        </div>

        <div style={{ color: '#88aacc', fontSize: 12, marginBottom: 16, textAlign: 'center' }}>
          {unlockedCount} / {totalCount} UNLOCKED · {Math.round(unlockedCount / totalCount * 100)}%
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, overflowY: 'auto', flex: 1 }}>
          {ACHIEVEMENTS.map((a) => {
            const isUnlocked = unlocked.includes(a.id)
            const color = isUnlocked ? TIER_COLORS[a.tier] : '#444'
            return (
              <div
                key={a.id}
                style={{
                  padding: 12,
                  background: isUnlocked ? `linear-gradient(135deg, ${color}22, ${color}11)` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${color}`,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  opacity: isUnlocked ? 1 : 0.4,
                  filter: isUnlocked ? 'none' : 'grayscale(100%)',
                }}
              >
                <div style={{ fontSize: 28 }}>{a.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: color, fontSize: 13, fontWeight: 'bold', textShadow: isUnlocked ? `0 0 4px ${color}` : 'none' }}>
                    {a.name}
                  </div>
                  <div style={{ color: '#888', fontSize: 11, lineHeight: 1.3 }}>
                    {a.description}
                  </div>
                  <div style={{ color: '#555', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                    {a.tier}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
