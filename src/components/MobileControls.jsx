import React, { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../store'

/**
 * Mobile touch controls: two virtual joysticks + a fire button.
 * Left joystick: move (WASD equivalent)
 * Right side tap: fire (auto-fires while held)
 * Right side long press: charge shot
 */
export function MobileControls() {
  const [isMobile, setIsMobile] = useState(false)
  const [moveDir, setMoveDir] = useState({ x: 0, y: 0 })
  const [firing, setFiring] = useState(false)
  const gameState = useGameStore((s) => s.gameState)
  const movePadRef = useRef(null)
  const moveKnobRef = useRef(null)
  const fireBtnRef = useRef(null)

  // Detect mobile
  useEffect(() => {
    const check = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmall = window.innerWidth < 768
      setIsMobile(isTouch || isSmall)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Apply moveDir to key state for PlayerShip
  useEffect(() => {
    if (!isMobile) return
    window.__mobileMove = moveDir
    // Map to key events
    const k = window.__keys || (window.__keys = {})
    k['ArrowUp'] = moveDir.y > 0.3
    k['ArrowDown'] = moveDir.y < -0.3
    k['ArrowLeft'] = moveDir.x < -0.3
    k['ArrowRight'] = moveDir.x > 0.3
  }, [moveDir, isMobile])

  if (!isMobile || gameState !== 'playing') return null

  const handleMoveStart = (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = movePadRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const update = (clientX, clientY) => {
      const dx = (clientX - cx) / (rect.width / 2)
      const dy = (clientY - cy) / (rect.height / 2)
      const len = Math.sqrt(dx * dx + dy * dy)
      const clamped = len > 1 ? { x: dx / len, y: dy / len } : { x: dx, y: dy }
      setMoveDir(clamped)
      if (moveKnobRef.current) {
        moveKnobRef.current.style.transform = `translate(${clamped.x * 30}px, ${clamped.y * 30}px)`
      }
    }
    update(touch.clientX, touch.clientY)
    const onMove = (ev) => {
      const t = ev.touches[0]
      if (t) update(t.clientX, t.clientY)
    }
    const onEnd = () => {
      setMoveDir({ x: 0, y: 0 })
      if (moveKnobRef.current) moveKnobRef.current.style.transform = 'translate(0, 0)'
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
  }

  const handleFireStart = (e) => {
    e.preventDefault()
    setFiring(true)
    if (window.__soundManager) window.__soundManager.playShoot?.()
    // Trigger fire via window function
    if (window.__gameFire) {
      const playerPos = useGameStore.getState().playerPosition
      if (playerPos) window.__gameFire(playerPos)
    }
    // Auto-fire while held
    const interval = setInterval(() => {
      if (window.__gameFire) {
        const playerPos = useGameStore.getState().playerPosition
        if (playerPos) window.__gameFire(playerPos)
      }
    }, 200)
    fireBtnRef.current.dataset.interval = interval
  }

  const handleFireEnd = (e) => {
    e.preventDefault()
    setFiring(false)
    const interval = fireBtnRef.current?.dataset.interval
    if (interval) clearInterval(parseInt(interval))
  }

  return (
    <>
      {/* Left joystick (move) */}
      <div
        ref={movePadRef}
        onTouchStart={handleMoveStart}
        style={{
          position: 'absolute',
          bottom: 30,
          left: 30,
          width: 120, height: 120,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          border: '2px solid rgba(0,170,255,0.5)',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      >
        <div
          ref={moveKnobRef}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 50, height: 50,
            marginLeft: -25, marginTop: -25,
            borderRadius: '50%',
            background: 'rgba(0,170,255,0.5)',
            border: '2px solid #00aaff',
            boxShadow: '0 0 10px rgba(0,170,255,0.5)',
            transition: 'transform 0.1s',
          }}
        />
      </div>

      {/* Right fire button */}
      <div
        ref={fireBtnRef}
        onTouchStart={handleFireStart}
        onTouchEnd={handleFireEnd}
        style={{
          position: 'absolute',
          bottom: 50,
          right: 40,
          width: 100, height: 100,
          borderRadius: '50%',
          background: firing
            ? 'radial-gradient(circle, #ffdd00 0%, #ff6600 100%)'
            : 'rgba(255,170,0,0.2)',
          border: '3px solid #ffaa00',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, fontWeight: 'bold',
          pointerEvents: 'auto',
          touchAction: 'none',
          boxShadow: firing ? '0 0 25px #ffaa00' : 'none',
          userSelect: 'none',
          letterSpacing: 2,
        }}
      >
        FIRE
      </div>
    </>
  )
}
