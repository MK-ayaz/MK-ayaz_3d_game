import React, { useState, useEffect } from 'react'
import { useGameStore } from '../store'

function getTodaySeed() {
  const today = new Date()
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
}

// Mulberry32 seeded RNG
function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SEED_STORAGE_KEY = 'spaceShooterDailyPlayed'

function getDailyLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem('spaceShooterDailyLeaderboard') || '{}')
  } catch { return {} }
}

function saveDailyScore(seed, score, wave) {
  const lb = getDailyLeaderboard()
  if (!lb[seed]) lb[seed] = []
  lb[seed].push({ score, wave, date: new Date().toISOString() })
  lb[seed].sort((a, b) => b.score - a.score)
  lb[seed] = lb[seed].slice(0, 10) // top 10
  try {
    localStorage.setItem('spaceShooterDailyLeaderboard', JSON.stringify(lb))
  } catch {}
  return lb[seed]
}

export function DailyChallengeModal({ onClose, onStart }) {
  const seed = getTodaySeed()
  const [hasPlayed, setHasPlayed] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    const played = JSON.parse(localStorage.getItem(SEED_STORAGE_KEY) || '{}')
    setHasPlayed(!!played[seed])
    const lb = getDailyLeaderboard()
    setLeaderboard(lb[seed] || [])
  }, [seed])

  const handleStart = () => {
    if (hasPlayed) return
    onStart(seed)
    onClose()
  }

  // Generate preview of today's wave order using the seed
  const previewRng = mulberry32(seed)
  const previewEnemies = []
  for (let w = 1; w <= 5; w++) {
    const enemyCount = Math.floor(previewRng() * 5) + 5
    previewEnemies.push(`Wave ${w}: ${enemyCount} enemies + boss`)
  }

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
        maxWidth: 540,
        background: 'linear-gradient(180deg, rgba(60,40,0,0.98) 0%, rgba(0,0,0,0.98) 100%)',
        border: '1px solid #ffdd00',
        borderRadius: 12,
        padding: 28,
        boxShadow: '0 0 40px rgba(255,221,0,0.4)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: '#ffdd00', fontSize: 24, margin: 0, letterSpacing: 3, textShadow: '0 0 10px #ffaa00' }}>
            ⚡ DAILY CHALLENGE
          </h2>
          <button onClick={onClose} style={{
            padding: '6px 14px', fontSize: 12, color: '#aaa', background: 'transparent',
            border: '1px solid #666', borderRadius: 6, cursor: 'pointer',
          }}>CLOSE</button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ color: '#ffaa00', fontSize: 14, letterSpacing: 4 }}>SEED</div>
          <div style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', fontFamily: 'monospace', textShadow: '0 0 10px #ffaa00' }}>
            {seed}
          </div>
          <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
            {new Date().toDateString()}
          </div>
        </div>

        <div style={{ color: '#88aacc', fontSize: 13, lineHeight: 1.6, marginBottom: 20, textAlign: 'center' }}>
          Same waves, same enemy spawns for every player today.<br/>
          Beat the leaderboard to earn bragging rights.
        </div>

        {hasPlayed ? (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ color: '#ff8866', fontSize: 14, marginBottom: 12 }}>
              ✓ You've already played today's challenge
            </div>
            <div style={{ color: '#88aacc', fontSize: 12 }}>
              Come back tomorrow for a new seed!
            </div>
          </div>
        ) : (
          <button
            onClick={handleStart}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: 16, fontWeight: 'bold',
              color: '#000',
              background: 'linear-gradient(135deg, #ffdd00, #ffaa00)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(255,221,0,0.5)',
              letterSpacing: 3,
              marginBottom: 20,
            }}
          >
            ACCEPT CHALLENGE
          </button>
        )}

        {leaderboard.length > 0 && (
          <div>
            <h3 style={{ color: '#88aacc', fontSize: 12, letterSpacing: 3, margin: '0 0 8px 0', textAlign: 'center' }}>
              🏆 LEADERBOARD
            </h3>
            <div style={{ maxHeight: 140, overflowY: 'auto' }}>
              {leaderboard.map((entry, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 12px',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                  borderRadius: 4,
                }}>
                  <span style={{ color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#aaa', fontSize: 12 }}>
                    #{i + 1}
                  </span>
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                    {entry.score.toLocaleString()}
                  </span>
                  <span style={{ color: '#888', fontSize: 11 }}>
                    W{entry.wave}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
