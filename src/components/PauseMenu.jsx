import React, { useState } from 'react'
import { useGameStore } from '../store'

export function PauseMenu() {
  const gameState = useGameStore((s) => s.gameState)
  const resumeGame = useGameStore((s) => s.resumeGame)
  const resetGame = useGameStore((s) => s.resetGame)
  const muted = useGameStore((s) => s.muted)
  const setMuted = useGameStore((s) => s.setMuted)
  const volume = useGameStore((s) => s.volume)
  const setVolume = useGameStore((s) => s.setVolume)
  const bloomEnabled = useGameStore((s) => s.bloomEnabled)
  const setBloomEnabled = useGameStore((s) => s.setBloomEnabled)
  const [showSettings, setShowSettings] = useState(false)

  if (gameState !== 'paused') return null

  const handleResume = () => {
    if (window.__soundManager) window.__soundManager.setVolume(volume)
    resumeGame()
  }

  const handleQuit = () => {
    if (window.__soundManager) window.__soundManager.stopMusic()
    resetGame()
  }

  const handleMute = () => {
    const newMuted = !muted
    setMuted(newMuted)
    if (window.__soundManager) {
      if (newMuted) {
        window.__soundManager.setVolume(0)
      } else {
        window.__soundManager.setVolume(volume)
      }
    }
  }

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (!muted && window.__soundManager) {
      window.__soundManager.setVolume(v)
    }
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, rgba(0,10,30,0.92) 0%, rgba(0,0,0,0.96) 100%)',
      pointerEvents: 'auto',
      zIndex: 90,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <h1 style={{
        fontSize: 56,
        fontWeight: 'bold',
        color: '#00ccff',
        textShadow: '0 0 30px #00aaff, 0 0 60px #0066ff',
        marginBottom: 32,
        letterSpacing: 6,
      }}>
        PAUSED
      </h1>

      {!showSettings && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
          <PauseButton onClick={handleResume} color="#00ccff" hoverColor="#00aaff" text="RESUME" />
          <PauseButton onClick={() => setShowSettings(true)} color="#aaaacc" hoverColor="#ffffff" text="SETTINGS" />
          <PauseButton onClick={handleMute} color={muted ? '#666' : '#ffaa00'} hoverColor={muted ? '#888' : '#ffcc00'} text={muted ? '🔇 UNMUTE' : '🔊 MUTE'} />
          <PauseButton onClick={handleQuit} color="#ff4444" hoverColor="#ff6666" text="QUIT TO MENU" />
        </div>
      )}

      {showSettings && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          width: 360,
          padding: 28,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(0,170,255,0.4)',
          borderRadius: 12,
        }}>
          <h2 style={{ color: '#00ccff', textAlign: 'center', margin: 0, letterSpacing: 2 }}>SETTINGS</h2>

          <div>
            <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 6 }}>
              VOLUME: {Math.round(volume * 100)}%
            </label>
            <input
              type="range" min="0" max="1" step="0.05"
              value={volume}
              onChange={handleVolume}
              style={{ width: '100%', accentColor: '#00ccff' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#aaa', fontSize: 13 }}>BLOOM EFFECTS</span>
            <button
              onClick={() => setBloomEnabled(!bloomEnabled)}
              style={{
                width: 50, height: 24, borderRadius: 12,
                border: 'none', cursor: 'pointer',
                background: bloomEnabled ? '#00ccff' : '#444',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 2,
                left: bloomEnabled ? 28 : 2,
                width: 20, height: 20,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          <button
            onClick={() => setShowSettings(false)}
            style={{
              marginTop: 8,
              padding: '10px 0',
              fontSize: 14,
              color: '#aaa',
              background: 'transparent',
              border: '1px solid #666',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            BACK
          </button>
        </div>
      )}

      <p style={{
        position: 'absolute',
        bottom: 30,
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        letterSpacing: 2,
      }}>
        Press ESC to resume
      </p>
    </div>
  )
}

function PauseButton({ onClick, color, hoverColor, text }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '14px 0',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        background: hover
          ? `linear-gradient(135deg, ${hoverColor}, ${color})`
          : 'rgba(255,255,255,0.05)',
        border: `2px solid ${color}`,
        borderRadius: 8,
        cursor: 'pointer',
        boxShadow: hover ? `0 0 20px ${color}80` : 'none',
        letterSpacing: 3,
        transition: 'all 0.2s',
      }}
    >
      {text}
    </button>
  )
}
