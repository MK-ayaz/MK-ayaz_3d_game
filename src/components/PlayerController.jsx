import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PLAYER_SPEED = 15
const ARENA_BOUNDS_X = 11
const ARENA_BOUNDS_Y = 6

export function PlayerController({ isPlaying, onPositionUpdate }) {
  const positionRef = useRef([0, 0, 0])
  const keysRef = useRef({})
  const [bulletPositions, setBulletPositions] = useState([])
  const nextBulletId = useRef(0)
  const lastShot = useRef(0)

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.code] = true
    }
    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((_, delta) => {
    if (!isPlaying) return

    const keys = keysRef.current
    const pos = positionRef.current

    if (keys['ArrowLeft'] || keys['KeyA']) {
      pos[0] -= PLAYER_SPEED * delta
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
      pos[0] += PLAYER_SPEED * delta
    }
    if (keys['ArrowUp'] || keys['KeyW']) {
      pos[1] += PLAYER_SPEED * delta
    }
    if (keys['ArrowDown'] || keys['KeyS']) {
      pos[1] -= PLAYER_SPEED * delta
    }

    // Clamp position
    pos[0] = Math.max(-ARENA_BOUNDS_X, Math.min(ARENA_BOUNDS_X, pos[0]))
    pos[1] = Math.max(-ARENA_BOUNDS_Y, Math.min(ARENA_BOUNDS_Y, pos[1]))

    onPositionUpdate([...pos])

    // Shooting
    if (keys['Space']) {
      const now = performance.now()
      if (now - lastShot.current > 180) {
        lastShot.current = now
        const id = nextBulletId.current++
        setBulletPositions((prev) => [
          ...prev,
          { id, position: [pos[0], pos[1], pos[2] + 1.5] },
        ])
      }
    }

    // Update bullet positions
    setBulletPositions((prev) =>
      prev
        .map((b) => ({
          ...b,
          position: [b.position[0], b.position[1], b.position[2] + 60 * delta],
        }))
        .filter((b) => b.position[2] < 60)
    )
  })

  return null
}
