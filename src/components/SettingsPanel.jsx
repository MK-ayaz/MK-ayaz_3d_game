import React, { useState, useEffect } from 'react'
import { useGameStore } from '../store'

const ACTIONS = [
  { key: 'up', label: 'Move Up', defaultCode: 'ArrowUp' },
  { key: 'down', label: 'Move Down', defaultCode: 'ArrowDown' },
  { key: 'left', label: 'Move Left', defaultCode: 'ArrowLeft' },
  { key: 'right', label: 'Move Right', defaultCode: 'ArrowRight' },
  { key: 'shoot', label: 'Shoot / Charge', defaultCode: 'Space' },
  { key: 'bomb', label: 'Smart Bomb', defaultCode: 'KeyB' },
]

export function SettingsPanel({ onClose }) {
  const keybinds = useGameStore((s) => s.keybinds)
  const setKeybind = useGameStore((s) => s.setKeybind)
  const volume = useGameStore((s) => s.volume)
  const setVolume = useGameStore((s) => s.setVolume)
  const muted = useGameStore((s) => s.muted)
  const setMuted = useGameStore((s) => s.setMuted)
  const bloomEnabled = useGameStore((s) => s.bloomEnabled)
  const setBloomEnabled = useGameStore((s) => s.setBloomEnabled)
  const [rebinding, setRebinding] = useState(null)

  // Capture next key when rebinding
  useEffect(() => {
    if (!rebinding) return
    const onKey = (e) => {
      e.preventDefault()
      if (e.code === 'Escape') {
        setRebinding(null)
        return
      }
      setKeybind(rebinding, e.code)
      setRebinding(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rebinding, setKeybind])

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (!muted && window.__soundManager) window.__soundManager.setVolume(v)
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
        maxWidth: 520,
        background: 'linear-gradient(180deg, rgba(20,30,60,0.98) 0%, rgba(0,0,0,0.98) 100%)',
        border: '1px solid #00ccff',
        borderRadius: 12,
        padding: 28,
        boxShadow: '0 0 40px rgba(0,170,255,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: '#00ccff', fontSize: 24, margin: 0, letterSpacing: 3, textShadow: '0 0 10px #00aaff' }}>
            ⚙ SETTINGS
          </h2>
          <button onClick={onClose} style={{
            padding: '6px 14px', fontSize: 12, color: '#aaa', background: 'transparent',
            border: '1px solid #666', borderRadius: 6, cursor: 'pointer',
          }}>CLOSE</button>
        </div>

        {/* Audio */}
        <h3 style={{ color: '#88aacc', fontSize: 12, letterSpacing: 3, margin: '0 0 12px 0' }}>AUDIO</h3>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ color: '#aaa', fontSize: 12 }}>MASTER VOLUME</span>
            <span style={{ color: '#00ccff', fontSize: 12 }}>{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range" min="0" max="1" step="0.05" value={volume}
            onChange={handleVolume}
            style={{ width: '100%', accentColor: '#00ccff' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ color: '#aaa', fontSize: 12 }}>MUTE</span>
          <button
            onClick={() => {
              setMuted(!muted)
              if (window.__soundManager) window.__soundManager.setVolume(muted ? volume : 0)
            }}
            style={{
              width: 50, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: muted ? '#ff4444' : '#00ccff', position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: muted ? 2 : 28, width: 20, height: 20,
              borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {/* Graphics */}
        <h3 style={{ color: '#88aacc', fontSize: 12, letterSpacing: 3, margin: '0 0 12px 0' }}>GRAPHICS</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ color: '#aaa', fontSize: 12 }}>BLOOM POST-FX</span>
          <button
            onClick={() => setBloomEnabled(!bloomEnabled)}
            style={{
              width: 50, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: bloomEnabled ? '#00ccff' : '#444', position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: bloomEnabled ? 28 : 2, width: 20, height: 20,
              borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {/* Keybinds */}
        <h3 style={{ color: '#88aacc', fontSize: 12, letterSpacing: 3, margin: '0 0 12px 0' }}>KEYBINDS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {ACTIONS.map((a) => (
            <div key={a.key} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 6,
            }}>
              <span style={{ color: '#aaa', fontSize: 12 }}>{a.label}</span>
              <button
                onClick={() => setRebinding(a.key)}
                style={{
                  padding: '4px 10px',
                  fontSize: 11, fontFamily: 'monospace',
                  color: rebinding === a.key ? '#000' : '#00ccff',
                  background: rebinding === a.key ? '#00ccff' : 'transparent',
                  border: '1px solid #00ccff',
                  borderRadius: 4, cursor: 'pointer',
                  minWidth: 80,
                }}
              >
                {rebinding === a.key ? '...' : keybinds[a.key] || a.defaultCode}
              </button>
            </div>
          ))}
        </div>
        <p style={{ color: '#666', fontSize: 10, marginTop: 12, textAlign: 'center' }}>
          Click a key to rebind. Press ESC to cancel.
        </p>
      </div>
    </div>
  )
}
