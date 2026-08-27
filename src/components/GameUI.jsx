import React, { useEffect, useState, useRef } from 'react'
import { useGameStore } from '../store'
import { UpgradeScreen } from './UpgradeScreen'
import { PauseMenu } from './PauseMenu'
import { IntroScreen } from './IntroScreen'

export function GameUI() {
  const score = useGameStore((s) => s.score)
  const health = useGameStore((s) => s.health)
  const wave = useGameStore((s) => s.wave)
  const gameState = useGameStore((s) => s.gameState)
  const activePowerUp = useGameStore((s) => s.activePowerUp)
  const powerUpTimer = useGameStore((s) => s.powerUpTimer)
  const highScore = useGameStore((s) => s.highScore)
  const combo = useGameStore((s) => s.combo)
  const comboMultiplier = useGameStore((s) => s.comboMultiplier)
  const comboTimer = useGameStore((s) => s.comboTimer)
  const maxCombo = useGameStore((s) => s.maxCombo)
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements)
  const startGame = useGameStore((s) => s.startGame)
  const resumeGame = useGameStore((s) => s.resumeGame)
  const pauseGame = useGameStore((s) => s.pauseGame)
  const resetGame = useGameStore((s) => s.resetGame)
  const heat = useGameStore((s) => s.heat)
  const overheated = useGameStore((s) => s.overheated)
  const bossActive = useGameStore((s) => s.bossActive)
  const muted = useGameStore((s) => s.muted)
  const setMuted = useGameStore((s) => s.setMuted)
  const volume = useGameStore((s) => s.volume)
  const [chargeValue, setChargeValue] = useState(0)

  // Esc to pause/resume
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Escape') {
        const s = useGameStore.getState()
        if (s.gameState === 'playing') pauseGame()
        else if (s.gameState === 'paused') resumeGame()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pauseGame, resumeGame])

  // Poll charge value (set by PlayerShip via window.__gameChargeState)
  useEffect(() => {
    let raf
    const tick = () => {
      setChargeValue(window.__playerCharge ?? 0)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      {/* HUD - always visible during gameplay */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          {/* Score */}
          <div style={{
            color: '#00ffff',
            fontSize: 24,
            fontWeight: 'bold',
            textShadow: '0 0 10px #00ffff',
          }}>
            SCORE: {score}
          </div>

          {/* High Score */}
          <div style={{
            color: '#ffdd00',
            fontSize: 16,
            fontWeight: 'bold',
            textShadow: '0 0 8px #ffdd00',
          }}>
            HIGH: {highScore}
          </div>

          {/* Wave */}
          <div style={{
            color: '#ffaa00',
            fontSize: 20,
            fontWeight: 'bold',
            textShadow: '0 0 10px #ffaa00',
          }}>
            WAVE {wave}
          </div>
        </div>
      )}

      {/* Health bar */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div style={{
          position: 'absolute',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 300,
        }}>
          <div style={{
            color: '#ffffff',
            fontSize: 12,
            marginBottom: 4,
            textAlign: 'center',
            textShadow: '0 0 5px #fff',
          }}>
            HULL INTEGRITY
          </div>
          <div style={{
            width: '100%',
            height: 12,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.3)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${health}%`,
              height: '100%',
              background: health > 50
                ? 'linear-gradient(90deg, #00ff88, #00ffcc)'
                : health > 25
                  ? 'linear-gradient(90deg, #ffaa00, #ff6600)'
                  : 'linear-gradient(90deg, #ff0000, #ff4400)',
              borderRadius: 6,
              transition: 'width 0.3s ease',
              boxShadow: `0 0 10px ${health > 50 ? '#00ff88' : health > 25 ? '#ffaa00' : '#ff0000'}`,
            }} />
          </div>
        </div>
      )}

      {/* Controls hint */}
      {gameState === 'playing' && (
        <div style={{
          position: 'absolute',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.4)',
          fontSize: 12,
          textAlign: 'center',
        }}>
          WASD / Arrow Keys to move • TAP SPACE for shot • HOLD for spread • ESC to pause
        </div>
      )}

      {/* Charge meter near bottom-center, mirrors the in-world visual */}
      {gameState === 'playing' && chargeValue > 0.05 && (
        <div style={{
          position: 'absolute',
          bottom: 90,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: 6,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <div style={{
            width: `${Math.min(100, chargeValue * 100)}%`,
            height: '100%',
            background: chargeValue >= 1
              ? 'linear-gradient(90deg, #ffaa00, #ff4400)'
              : chargeValue >= 0.3
                ? 'linear-gradient(90deg, #00ffff, #00aaff)'
                : 'linear-gradient(90deg, #00ffaa, #00ffff)',
            transition: 'width 0.05s linear',
            boxShadow: `0 0 8px ${chargeValue >= 1 ? '#ffaa00' : '#00ffff'}`,
          }} />
        </div>
      )}

      {/* Heat bar */}
      {gameState === 'playing' && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 100,
          height: 6,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${heat}%`,
            height: '100%',
            background: overheated
              ? 'linear-gradient(90deg, #ff0000, #ff4400)'
              : 'linear-gradient(90deg, #ffaa00, #ff6600)',
            transition: overheated ? 'width 2s linear' : 'width 0.1s linear',
            boxShadow: overheated ? '0 0 8px #ff0000' : 'none',
          }} />
        </div>
      )}
      {gameState === 'playing' && overheated && (
        <div style={{
          position: 'absolute',
          bottom: 30,
          right: 20,
          color: '#ff4444',
          fontSize: 11,
          fontWeight: 'bold',
          textShadow: '0 0 6px #ff0000',
          letterSpacing: 1,
        }}>
          OVERHEAT
        </div>
      )}

      {/* Mute button (top right) */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <button
          onClick={() => {
            const newMuted = !muted
            setMuted(newMuted)
            if (window.__soundManager) {
              window.__soundManager.setVolume(newMuted ? 0 : volume)
            }
          }}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            fontSize: 18,
            cursor: 'pointer',
            pointerEvents: 'auto',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.5)')}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      )}

      {/* Boss banner */}
      {gameState === 'playing' && bossActive && (
        <div style={{
          position: 'absolute',
          top: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#ff4444',
          fontSize: 28,
          fontWeight: 'bold',
          textShadow: '0 0 20px #ff0000, 0 0 40px #ff0000',
          letterSpacing: 4,
          animation: 'pulse 1s infinite',
        }}>
          ⚠ BOSS INCOMING ⚠
        </div>
      )}

      {/* Active Power-up indicator */}
      {gameState === 'playing' && activePowerUp && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}>
          <div style={{
            color: activePowerUp === 'health' ? '#00ff88' : 
                  activePowerUp === 'speed' ? '#00ccff' : '#ffaa00',
            fontSize: 16,
            fontWeight: 'bold',
            textShadow: `0 0 10px ${activePowerUp === 'health' ? '#00ff88' : 
                  activePowerUp === 'speed' ? '#00ccff' : '#ffaa00'}`,
            marginBottom: 4,
          }}>
            {activePowerUp.toUpperCase()} ACTIVE
          </div>
          <div style={{
            width: 100,
            height: 6,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.max(0, (powerUpTimer - Date.now()) / 5000 * 100)}%`,
              height: '100%',
              background: activePowerUp === 'health' ? '#00ff88' : 
                       activePowerUp === 'speed' ? '#00ccff' : '#ffaa00',
              borderRadius: 3,
              transition: 'width 0.1s linear',
            }} />
          </div>
        </div>
      )}

      {/* Combo indicator */}
      {gameState === 'playing' && combo > 0 && (
        <div style={{
          position: 'absolute',
          top: 80,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}>
          <div style={{
            color: comboMultiplier >= 5 ? '#ff00ff' : 
                  comboMultiplier >= 3 ? '#ff6600' : '#ffff00',
            fontSize: 24,
            fontWeight: 'bold',
            textShadow: `0 0 15px ${comboMultiplier >= 5 ? '#ff00ff' : 
                  comboMultiplier >= 3 ? '#ff6600' : '#ffff00'}`,
            marginBottom: 4,
          }}>
            {combo}x COMBO
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 'bold',
          }}>
            {comboMultiplier}x SCORE
          </div>
          <div style={{
            width: 100,
            height: 4,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            overflow: 'hidden',
            marginTop: 4,
          }}>
            <div style={{
              width: `${Math.max(0, (comboTimer - Date.now()) / 3000 * 100)}%`,
              height: '100%',
              background: comboMultiplier >= 5 ? '#ff00ff' : 
                       comboMultiplier >= 3 ? '#ff6600' : '#ffff00',
              borderRadius: 2,
              transition: 'width 0.05s linear',
            }} />
          </div>
        </div>
      )}

      {/* Achievement notifications */}
      {unlockedAchievements.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 140,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
        }}>
          {unlockedAchievements.slice(-3).map((achievementId, index) => {
            const achievement = {
              first_blood: { name: 'First Blood', icon: '🎯' },
              combo_master: { name: 'Combo Master', icon: '🔥' },
              wave_survivor: { name: 'Wave Survivor', icon: '🌊' },
              score_hunter: { name: 'Score Hunter', icon: '💯' },
              power_collector: { name: 'Power Collector', icon: '⚡' },
              combo_legend: { name: 'Combo Legend', icon: '👑' },
              wave_master: { name: 'Wave Master', icon: '🏆' },
              high_scorer: { name: 'High Scorer', icon: '🌟' },
              perfect_game: { name: 'Perfect Game', icon: '💎' },
            }[achievementId] || { name: 'Achievement', icon: '🏅' }
            
            return (
              <div key={achievementId} style={{
                background: 'rgba(0, 0, 0, 0.8)',
                border: '2px solid #ffd700',
                borderRadius: 8,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                animation: 'slideIn 0.3s ease-out',
                boxShadow: '0 0 15px rgba(255, 215, 0, 0.5)',
              }}>
                <span style={{ fontSize: 24 }}>{achievement.icon}</span>
                <div>
                  <div style={{
                    color: '#ffd700',
                    fontSize: 12,
                    fontWeight: 'bold',
                    textShadow: '0 0 5px #ffd700',
                  }}>
                    ACHIEVEMENT UNLOCKED
                  </div>
                  <div style={{
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 'bold',
                  }}>
                    {achievement.name}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Main Menu */}
      {gameState === 'menu' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, rgba(0,20,60,0.9) 0%, rgba(0,0,0,0.95) 100%)',
          pointerEvents: 'auto',
        }}>
          <h1 style={{
            fontSize: 64,
            fontWeight: 'bold',
            color: '#00ccff',
            textShadow: '0 0 30px #00aaff, 0 0 60px #0066ff',
            marginBottom: 8,
            letterSpacing: 4,
          }}>
            SPACE SHOOTER
          </h1>
          <p style={{
            color: '#88aacc',
            fontSize: 18,
            marginBottom: 40,
            letterSpacing: 2,
          }}>
            3D WEB GAME
          </p>

          <div style={{
            color: '#aaa',
            fontSize: 14,
            marginBottom: 30,
            textAlign: 'center',
            lineHeight: 1.8,
          }}>
            <div>WASD / Arrow Keys — Move</div>
            <div>SPACE — Shoot</div>
            <div style={{ marginTop: 8, color: '#ff8866' }}>Destroy enemies and dodge asteroids!</div>
          </div>

          <button
            onClick={startGame}
            style={{
              padding: '16px 48px',
              fontSize: 22,
              fontWeight: 'bold',
              color: '#001122',
              background: 'linear-gradient(135deg, #00ccff, #0088ff)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(0,170,255,0.5)',
              letterSpacing: 2,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
          >
            START GAME
          </button>
        </div>
      )}

      {/* Game Over */}
      {gameState === 'gameover' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, rgba(60,0,0,0.9) 0%, rgba(0,0,0,0.95) 100%)',
          pointerEvents: 'auto',
        }}>
          <h1 style={{
            fontSize: 56,
            fontWeight: 'bold',
            color: '#ff4444',
            textShadow: '0 0 30px #ff0000, 0 0 60px #ff0000',
            marginBottom: 16,
            letterSpacing: 4,
          }}>
            GAME OVER
          </h1>

          <div style={{
            color: '#ffaa88',
            fontSize: 28,
            marginBottom: 8,
            fontWeight: 'bold',
            textShadow: '0 0 10px #ff4400',
          }}>
            SCORE: {score}
          </div>
          {score >= highScore && score > 0 && (
            <div style={{
              color: '#ffd700',
              fontSize: 18,
              marginBottom: 12,
              fontWeight: 'bold',
              textShadow: '0 0 15px #ffd700',
              animation: 'pulse 1.5s infinite',
            }}>
              ★ NEW HIGH SCORE ★
            </div>
          )}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto auto',
            gap: '6px 20px',
            marginBottom: 12,
            fontSize: 15,
          }}>
            <span style={{ color: '#888' }}>WAVE REACHED</span>
            <span style={{ color: '#ffaa88', fontWeight: 'bold' }}>{wave}</span>
            <span style={{ color: '#888' }}>ENEMIES DESTROYED</span>
            <span style={{ color: '#ffaa88', fontWeight: 'bold' }}>{useGameStore.getState().enemiesDestroyed}</span>
            <span style={{ color: '#888' }}>MAX COMBO</span>
            <span style={{ color: '#88aaff', fontWeight: 'bold' }}>{maxCombo}x</span>
            <span style={{ color: '#888' }}>HIGH SCORE</span>
            <span style={{ color: '#666', fontWeight: 'bold' }}>{highScore}</span>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              onClick={startGame}
              style={{
                padding: '14px 36px',
                fontSize: 20,
                fontWeight: 'bold',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #ff4444, #cc2222)',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(255,0,0,0.5)',
                letterSpacing: 2,
              }}
            >
              PLAY AGAIN
            </button>
            <button
              onClick={resetGame}
              style={{
                padding: '14px 36px',
                fontSize: 16,
                fontWeight: 'bold',
                color: '#aaa',
                background: 'transparent',
                border: '1px solid #666',
                borderRadius: 8,
                cursor: 'pointer',
                letterSpacing: 2,
              }}
            >
              MAIN MENU
            </button>
          </div>
        </div>
      )}

      <UpgradeScreen />
      <PauseMenu />
      <IntroScreen />
    </div>
  )
}
