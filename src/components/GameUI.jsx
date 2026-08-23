import React from 'react'
import { useGameStore } from '../store'

export function GameUI() {
  const score = useGameStore((s) => s.score)
  const health = useGameStore((s) => s.health)
  const wave = useGameStore((s) => s.wave)
  const gameState = useGameStore((s) => s.gameState)
  const activePowerUp = useGameStore((s) => s.activePowerUp)
  const powerUpTimer = useGameStore((s) => s.powerUpTimer)
  const highScore = useGameStore((s) => s.highScore)
  const startGame = useGameStore((s) => s.startGame)
  const resumeGame = useGameStore((s) => s.resumeGame)
  const resetGame = useGameStore((s) => s.resetGame)

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
          WASD / Arrow Keys to move • SPACE to shoot
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
            fontSize: 24,
            marginBottom: 8,
          }}>
            SCORE: {score}
          </div>
          <div style={{
            color: '#cc8866',
            fontSize: 18,
            marginBottom: 40,
          }}>
            WAVE: {wave}
          </div>

          <button
            onClick={startGame}
            style={{
              padding: '16px 48px',
              fontSize: 22,
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
        </div>
      )}
    </div>
  )
}
