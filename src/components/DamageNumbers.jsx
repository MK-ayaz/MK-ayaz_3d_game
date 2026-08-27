import React, { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MAX_NUMBERS = 30
const LIFETIME = 0.9 // seconds

// ─── Generate canvas texture for damage number ───
function makeNumberTexture(text, color = '#ffff00') {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.font = 'bold 48px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = color
  ctx.shadowBlur = 10
  ctx.fillStyle = color
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

let nextId = 0

export function DamageNumbers() {
  const groupRef = useRef()
  const items = useRef([])

  // Expose trigger globally
  useEffect(() => {
    window.__triggerDamageNumber = (pos, text, color = '#ffff00', isCrit = false) => {
      if (items.current.length >= MAX_NUMBERS) {
        items.current.shift()
      }
      const texture = makeNumberTexture(text, color)
      items.current.push({
        id: nextId++,
        pos: [...pos],
        spawn: performance.now(),
        texture,
        isCrit,
      })
    }
    return () => { delete window.__triggerDamageNumber }
  }, [])

  useFrame(() => {
    if (!groupRef.current) return
    const now = performance.now()
    // Filter alive
    items.current = items.current.filter((it) => (now - it.spawn) / 1000 < LIFETIME)
    // Sync group children
    while (groupRef.current.children.length < items.current.length) {
      const mat = new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false })
      const sprite = new THREE.Sprite(mat)
      groupRef.current.add(sprite)
    }
    while (groupRef.current.children.length > items.current.length) {
      const s = groupRef.current.children.pop()
      s.material.map?.dispose()
      s.material.dispose()
    }
    items.current.forEach((it, i) => {
      const sprite = groupRef.current.children[i]
      const age = (now - it.spawn) / 1000
      const t = age / LIFETIME
      sprite.position.set(it.pos[0], it.pos[1] + t * 1.2, it.pos[2])
      const s = (it.isCrit ? 1.8 : 1.0) * (0.8 + t * 0.4)
      sprite.scale.set(s, s * 0.5, 1)
      sprite.material.map = it.texture
      sprite.material.opacity = 1 - t
      sprite.material.needsUpdate = true
    })
  })

  return <group ref={groupRef} />
}
