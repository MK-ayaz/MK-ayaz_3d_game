import React, { useRef, useCallback, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'
import { ENEMY_TYPES, pickEnemyType, createEnemyGeometry, getEnemyMaterial, shieldRingGeometry, shieldRingMaterial, getSniperBarrelMaterial, sniperBarrelGeometry } from './EnemyTypes'
import { Boss, BOSS_DEFAULT_MAX_HP } from './Boss'

const ENEMY_SPAWN_DISTANCE = 50
const ARENA_SIZE = 12
const BULLET_SPEED = 40
const ENEMY_SPEED_BASE = 8

// ─── Shared bullet visuals ───
const bulletGeometry = new THREE.SphereGeometry(0.15, 8, 8)
const bulletMaterial = new THREE.MeshStandardMaterial({
  color: '#00ffff', emissive: '#00ffff', emissiveIntensity: 5,
})
const chargedBulletMaterial = new THREE.MeshStandardMaterial({
  color: '#ffaa00', emissive: '#ffaa00', emissiveIntensity: 6,
})

// ─── Shared asteroid geometry pool ───
function createAsteroidGeometry() {
  const geo = new THREE.IcosahedronGeometry(1, 1)
  const positions = geo.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const offset = 0.8 + Math.random() * 0.4
    positions.setX(i, positions.getX(i) * offset)
    positions.setY(i, positions.getY(i) * offset)
    positions.setZ(i, positions.getZ(i) * offset)
  }
  geo.computeVertexNormals()
  return geo
}
const asteroidGeometries = Array.from({ length: 20 }, () => createAsteroidGeometry())
const asteroidMaterial = new THREE.MeshStandardMaterial({
  color: '#888888', roughness: 0.9, metalness: 0.1, flatShading: true,
})

// ─── Visual: Player bullet ───
function BulletMesh({ posRef, isCharged }) {
  const meshRef = useRef()
  useFrame(() => {
    if (meshRef.current && posRef.current) {
      meshRef.current.position.set(posRef.current[0], posRef.current[1], posRef.current[2])
    }
  })
  return (
    <mesh ref={meshRef} geometry={bulletGeometry} material={isCharged ? chargedBulletMaterial : bulletMaterial} />
  )
}

// ─── Visual: Asteroid ───
function AsteroidMesh({ posRef, rotRef, geoIdx, scale }) {
  const meshRef = useRef()
  useFrame(() => {
    if (meshRef.current && posRef.current) {
      meshRef.current.position.set(posRef.current[0], posRef.current[1], posRef.current[2])
      if (rotRef.current) {
        meshRef.current.rotation.set(rotRef.current[0], rotRef.current[1], rotRef.current[2])
      }
    }
  })
  return (
    <mesh ref={meshRef} geometry={asteroidGeometries[geoIdx % 20]} material={asteroidMaterial} scale={scale} />
  )
}

// ─── Visual: Enemy (multi-type) ───
function EnemyMesh({ posRef, rotRef, type, hp, maxHp, scale, lastHitTime }) {
  const groupRef = useRef()
  const cfg = ENEMY_TYPES[type]
  const geometry = createEnemyGeometry(cfg.visual.kind)
  const material = getEnemyMaterial(cfg.visual)

  useFrame((_, delta) => {
    if (groupRef.current && posRef.current) {
      groupRef.current.position.set(posRef.current[0], posRef.current[1], posRef.current[2])
      if (rotRef.current) {
        groupRef.current.rotation.set(rotRef.current[0], rotRef.current[1], rotRef.current[2])
      }
      // Damage flash
      if (lastHitTime.current) {
        const t = (performance.now() - lastHitTime.current) / 1000
        if (t < 0.15) {
          const k = 1 - t / 0.15
          material.emissiveIntensity = 0.6 + k * 4
        } else {
          material.emissiveIntensity = 0.6
          lastHitTime.current = 0
        }
      }
    }
  })

  return (
    <group ref={groupRef} scale={scale * cfg.visual.scale}>
      <mesh geometry={geometry} material={material} />
      {/* Shield ring for tanks */}
      {type === 'tank' && (
        <mesh rotation={[Math.PI / 2, 0, 0]} geometry={shieldRingGeometry} material={shieldRingMaterial} />
      )}
      {/* Sniper barrel */}
      {type === 'sniper' && (
        <mesh position={[0, 0, 0.7]} rotation={[Math.PI / 2, 0, 0]} geometry={sniperBarrelGeometry} material={getSniperBarrelMaterial()} />
      )}
      {/* HP bar above enemy if hp > 1 */}
      {maxHp > 1 && (
        <group position={[0, 1.2, 0]}>
          <mesh>
            <planeGeometry args={[1.0, 0.08]} />
            <meshBasicMaterial color="#330000" transparent opacity={0.7} />
          </mesh>
          <mesh position={[-(1 - hp / maxHp) * 0.5, 0, 0.01]}>
            <planeGeometry args={[1.0 * (hp / maxHp), 0.08]} />
            <meshBasicMaterial color="#ff4444" />
          </mesh>
        </group>
      )}
    </group>
  )
}

// ─── Main entity manager ───
export function GameEntities({ isPlaying }) {
  const entitiesRef = useRef({ obstacles: [], bullets: [] })
  const nextIdRef = useRef(0)
  const lastSpawnRef = useRef(0)
  const lastShotRef = useRef(0)
  const bossStateRef = useRef({ active: false, id: 0, spawnWave: 0, defeated: false })
  const [renderKey, setRenderKey] = useState(0)
  const [bossKey, setBossKey] = useState(0)

  const spawnBullet = useCallback((pos, opts = {}) => {
    const id = nextIdRef.current++
    entitiesRef.current.bullets.push({
      id,
      posRef: { current: [...pos] },
      vel: opts.vel || [0, 0, -1],
      speed: opts.speed || BULLET_SPEED,
      damage: opts.damage ?? 1,
      isCharged: !!opts.isCharged,
      active: true,
    })
    setRenderKey((k) => k + 1)
  }, [])

  // Expose shoot APIs (used by PlayerShip)
  useEffect(() => {
    window.__gameFire = (pos) => {
      const store = useGameStore.getState()
      const damage = 1 + (store.upgrades?.damage || 0)
      spawnBullet([pos[0], pos[1], pos[2] - 1.5], {
        vel: [0, 0, -1],
        damage,
        isCharged: false,
      })
      const multi = store.upgrades?.multishot || 0
      if (multi > 0) {
        for (let i = 1; i <= multi; i++) {
          const side = i * 0.4
          spawnBullet([pos[0] - side, pos[1], pos[2] - 1.5], {
            vel: [-side * 0.3, 0, -1], damage,
          })
          spawnBullet([pos[0] + side, pos[1], pos[2] - 1.5], {
            vel: [side * 0.3, 0, -1], damage,
          })
        }
      }
      if (window.__soundManager) window.__soundManager.playShoot()
    }

    window.__gameFireSpread = (pos, charge) => {
      const store = useGameStore.getState()
      const damage = (1 + (store.upgrades?.damage || 0)) * Math.ceil(charge * 3 + 1)
      const count = 5
      const spreadAngle = 0.35
      for (let i = 0; i < count; i++) {
        const t = (i / (count - 1)) - 0.5
        const angle = t * spreadAngle * 2
        const dirX = Math.sin(angle)
        const dirZ = -Math.cos(angle)
        spawnBullet([pos[0], pos[1], pos[2] - 1.5], {
          vel: [dirX, 0, dirZ], damage, isCharged: true,
        })
      }
      if (window.__soundManager) window.__soundManager.playShoot()
      if (window.__triggerCameraShake) window.__triggerCameraShake(0.3)
      if (window.__triggerScreenFlash) window.__triggerScreenFlash('#ffaa00', 0.2)
    }

    return () => {
      delete window.__gameFire
      delete window.__gameFireSpread
    }
  }, [spawnBullet])

  useFrame(() => {
    if (!isPlaying) return

    const now = performance.now()
    const delta = 1 / 60
    const ents = entitiesRef.current
    const store = useGameStore.getState()

    store.updateCombo()

    // Wave progression
    const destroyed = store.enemiesDestroyed
    const currentWave = store.wave
    const enemiesPerWave = 5 + currentWave * 3
    if (destroyed > 0 && destroyed % enemiesPerWave === 0 && store.gameState === 'playing') {
      store.nextWave()
    }

    // Boss wave detection: every 5 waves (5, 10, 15...)
    const isBossWave = currentWave > 0 && currentWave % 5 === 0
    if (isBossWave && !bossStateRef.current.active && !bossStateRef.current.defeated) {
      // Clear field of regular enemies, spawn boss
      ents.obstacles = ents.obstacles.filter((o) => o.type === 'asteroid') // Keep asteroids only
      bossStateRef.current.active = true
      bossStateRef.current.spawnWave = currentWave
      bossStateRef.current.id = nextIdRef.current++
      store.setBossActive(true)
      setBossKey((k) => k + 1)
      setRenderKey((k) => k + 1)
      if (window.__soundManager) {
        window.__soundManager.startBossMusic?.()
      }
      if (window.__triggerScreenFlash) {
        window.__triggerScreenFlash('#ff00ff', 0.5)
      }
    }
    if (!isBossWave && bossStateRef.current.active) {
      // Wave advanced past boss
      bossStateRef.current.active = false
      bossStateRef.current.defeated = false
      store.setBossActive(false)
    }

    // Spawn enemies (skip during boss wave)
    if (bossStateRef.current.active) {
      // Don't spawn regular enemies while boss is alive
    } else {
    const speed = ENEMY_SPEED_BASE + currentWave * 1.5
    const spawnInterval = Math.max(0.4, 2.2 - currentWave * 0.2)
    if (now - lastSpawnRef.current > spawnInterval * 1000) {
      lastSpawnRef.current = now
      const id = nextIdRef.current++
      const x = (Math.random() - 0.5) * ARENA_SIZE * 2
      const y = (Math.random() - 0.5) * ARENA_SIZE
      const z = -ENEMY_SPAWN_DISTANCE

      // 30% chance asteroid, 70% enemy (asteroids still scale with wave)
      if (Math.random() < 0.3) {
        ents.obstacles.push({
          id,
          posRef: { current: [x, y, z] },
          rotRef: { current: [0, 0, 0] },
          rotSpeed: [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2],
          geoIdx: id % 20,
          scale: 0.3 + Math.random() * 0.7,
          speed: speed + Math.random() * 3,
          type: 'asteroid',
          hp: 1,
          maxHp: 1,
          lastHitTime: { current: 0 },
          active: true,
        })
      } else {
        const enemyType = pickEnemyType(currentWave)
        const cfg = ENEMY_TYPES[enemyType]
        const baseScale = 0.9 + Math.random() * 0.3
        ents.obstacles.push({
          id,
          posRef: { current: [x, y, z] },
          rotRef: { current: [0, 0, 0] },
          rotSpeed: enemyType === 'drone' ? [0, 3, 0] :
                    enemyType === 'sniper' ? [0, 0.5, 0] :
                    [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2],
          geoIdx: -1,
          scale: baseScale,
          speed: speed * cfg.baseSpeed + Math.random() * 2,
          type: 'enemy',
          enemyType,
          hp: cfg.hp,
          maxHp: cfg.hp,
          lastFire: now - Math.random() * cfg.fireRate, // stagger first shot
          lastHitTime: { current: 0 },
          active: true,
        })
      }
      setRenderKey((k) => k + 1)
    }
    } // end boss-wave else block

    // Auto-shoot
    const fireRate = store.upgrades?.fireRate ?? 0
    const SHOOT_COOLDOWN = Math.max(60, 180 - fireRate * 25)
    if (!store.overheated && now - lastShotRef.current > SHOOT_COOLDOWN) {
      lastShotRef.current = now
      const playerPos = store.playerPosition
      if (playerPos && window.__gameFire) {
        window.__gameFire(playerPos)
        // Heat builds with auto-fire
        store.addHeat?.(3)
      }
    } else if (store.overheated) {
      // Cool down
      store.coolHeat?.(delta * 12)
      if (store.heat < 30) {
        // Resume firing
        store.resetHeat?.()
      }
    } else {
      // Cool slowly when not firing
      store.coolHeat?.(delta * 4)
    }

    // Move obstacles (with per-type AI)
    const playerPos = store.playerPosition || [0, 0, 0]
    let obstaclesChanged = false

    ents.obstacles.forEach((o) => {
      if (!o.active) return
      const dt = delta

      if (o.type === 'asteroid') {
        o.posRef.current[2] += o.speed * dt
        if (o.rotRef.current) {
          o.rotRef.current[0] += o.rotSpeed[0] * dt
          o.rotRef.current[1] += o.rotSpeed[1] * dt
          o.rotRef.current[2] += o.rotSpeed[2] * dt
        }
      } else {
        // Enemy with type-based AI
        const cfg = ENEMY_TYPES[o.enemyType]
        if (cfg.ai === 'homing') {
          // Accelerate toward player
          const dx = playerPos[0] - o.posRef.current[0]
          const dy = playerPos[1] - o.posRef.current[1]
          const dz = playerPos[2] - o.posRef.current[2]
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
          const homingStrength = 0.6
          o.posRef.current[0] += (o.speed * dt * (dx / d)) * homingStrength + (o.speed * dt * 0.3) * (dx > 0 ? 1 : -1)
          o.posRef.current[1] += (o.speed * dt * (dy / d)) * homingStrength + (o.speed * dt * 0.3) * (dy > 0 ? 1 : -1)
          o.posRef.current[2] += (o.speed * dt * (dz / d)) * homingStrength + (o.speed * dt * 0.3) * (dz > 0 ? 1 : -1)
          // Simplify: just lerp toward player
          o.posRef.current[0] = o.posRef.current[0] + (playerPos[0] - o.posRef.current[0]) * 0.012
          o.posRef.current[1] = o.posRef.current[1] + (playerPos[1] - o.posRef.current[1]) * 0.012
          o.posRef.current[2] = o.posRef.current[2] + o.speed * dt
        } else if (cfg.ai === 'stationary') {
          // Don't move on x/y; only z forward
          o.posRef.current[2] += o.speed * dt
        } else {
          // linear
          o.posRef.current[2] += o.speed * dt
        }

        if (o.rotRef.current) {
          o.rotRef.current[0] += o.rotSpeed[0] * dt
          o.rotRef.current[1] += o.rotSpeed[1] * dt
          o.rotRef.current[2] += o.rotSpeed[2] * dt
        }

        // Firing
        if (cfg.fireRate > 0 && now - o.lastFire > cfg.fireRate) {
          o.lastFire = now
          // Aim at player
          const dx = playerPos[0] - o.posRef.current[0]
          const dy = playerPos[1] - o.posRef.current[1]
          const dz = playerPos[2] - o.posRef.current[2]
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
          if (window.__enemyFire) {
            window.__enemyFire(
              [o.posRef.current[0], o.posRef.current[1], o.posRef.current[2]],
              [dx / d, dy / d, dz / d],
              cfg.projectileColor || '#ffaa00'
            )
          }
        }
      }

      // Off-screen → damage player
      if (o.posRef.current[2] > 10) {
        o.active = false
        store.takeDamage(o.type === 'asteroid' ? 15 : 20)
        obstaclesChanged = true
        if (window.__soundManager) window.__soundManager.playHit()
        if (window.__triggerCameraShake) window.__triggerCameraShake(0.8)
      }
    })

    // Move bullets
    ents.bullets.forEach((b) => {
      if (!b.active) return
      b.posRef.current[0] += b.vel[0] * b.speed * delta
      b.posRef.current[1] += b.vel[1] * b.speed * delta
      b.posRef.current[2] += b.vel[2] * b.speed * delta
      if (b.posRef.current[2] < -55 || Math.abs(b.posRef.current[0]) > 30) {
        b.active = false
      }
    })

    // Collision detection
    const upgrades = store.upgrades || {}
    const projSize = 1 + (upgrades.projSize || 0) * 0.2
    const critChance = (upgrades.critChance || 0) * 0.1
    const lifesteal = (upgrades.lifesteal || 0) * 0.01

    ents.bullets.forEach((b) => {
      if (!b.active) return
      ents.obstacles.forEach((o) => {
        if (!o.active) return
        const dx = b.posRef.current[0] - o.posRef.current[0]
        const dy = b.posRef.current[1] - o.posRef.current[1]
        const dz = b.posRef.current[2] - o.posRef.current[2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        const cfg = o.type === 'enemy' ? ENEMY_TYPES[o.enemyType] : null
        const baseRadius = o.type === 'asteroid' ? 1.0 : (cfg?.hitRadius || 1.2)
        const hitRadius = baseRadius * projSize
        if (dist < hitRadius) {
          b.active = false
          o.hp -= b.damage
          o.lastHitTime.current = performance.now()
          if (o.hp <= 0) {
            o.active = false
            const isCrit = Math.random() < critChance
            const dmg = b.damage * (isCrit ? 2 : 1)
            const baseScore = o.type === 'asteroid' ? 15 : (cfg?.scoreValue || 25)
            store.addScore(baseScore * dmg)

            if (lifesteal > 0) {
              store.heal(b.damage * lifesteal)
            }

            // Floating damage number
            if (window.__triggerDamageNumber) {
              const color = isCrit ? '#ff00ff' : '#ffff00'
              const text = isCrit ? `CRIT ${dmg * baseScore}` : `+${dmg * baseScore}`
              window.__triggerDamageNumber(o.posRef.current, text, color, isCrit)
            }

            if (window.__triggerExplosion) {
              const explosionColor = o.type === 'asteroid' ? '#ffaa00' :
                                    (cfg?.visual?.emissive || '#ff4444')
              window.__triggerExplosion(o.posRef.current, explosionColor, 25)
            }
            if (window.__soundManager) window.__soundManager.playExplosion()

            if (store.comboMultiplier >= 3 && window.__triggerScreenFlash) {
              const flashColor = store.comboMultiplier >= 5 ? '#ff00ff' : '#ff6600'
              window.__triggerScreenFlash(flashColor, 0.2)
            }
          } else {
            // Hit but not killed - small feedback
            if (window.__triggerExplosion) {
              window.__triggerExplosion(o.posRef.current, '#ffaa00', 5)
            }
          }
          obstaclesChanged = true
        }
      })
    })

    // Cleanup
    const prevObsCount = ents.obstacles.length
    ents.obstacles = ents.obstacles.filter((o) => o.active)
    const prevBulCount = ents.bullets.length
    ents.bullets = ents.bullets.filter((b) => b.active)

    if (ents.obstacles.length !== prevObsCount || ents.bullets.length !== prevBulCount || obstaclesChanged) {
      setRenderKey((k) => k + 1)
    }

    // Expose enemy list for NearMissDetector
    window.__gameEnemies = ents.obstacles.filter((o) => o.type === 'enemy').map((o) => ({
      active: o.active,
      pos: o.posRef.current,
    }))

    // Boss damage check - check if any bullet is near the boss
    if (bossStateRef.current.active && window.__bossCheckHit) {
      ents.bullets.forEach((b) => {
        if (!b.active) return
        window.__bossCheckHit({
          x: b.posRef.current[0],
          y: b.posRef.current[1],
          z: b.posRef.current[2],
          damage: b.damage,
        })
      })
    }
  })

  const ents = entitiesRef.current

  const handleBossDefeat = useCallback(() => {
    bossStateRef.current.active = false
    bossStateRef.current.defeated = true
    useGameStore.getState().addScore(500)
    useGameStore.getState().setBossActive(false)
    setBossKey((k) => k + 1)
    if (window.__triggerExplosion) {
      window.__triggerExplosion([0, 0, -30], '#ff00ff', 100)
    }
    if (window.__triggerScreenFlash) {
      window.__triggerScreenFlash('#ff00ff', 0.6)
    }
    if (window.__triggerCameraShake) {
      window.__triggerCameraShake(1.5)
    }
    if (window.__soundManager) {
      window.__soundManager.playExplosion?.()
      window.__soundManager.stopBossMusic?.()
    }
  }, [])

  return (
    <>
      {bossStateRef.current.active && (
        <Boss key={bossKey} bossId={bossStateRef.current.id} onDefeat={handleBossDefeat} />
      )}
      {ents.obstacles.map((o) =>
        o.type === 'asteroid' ? (
          <AsteroidMesh
            key={o.id}
            posRef={o.posRef}
            rotRef={o.rotRef}
            geoIdx={o.geoIdx}
            scale={o.scale}
          />
        ) : (
          <EnemyMesh
            key={o.id}
            posRef={o.posRef}
            rotRef={o.rotRef}
            type={o.enemyType}
            hp={o.hp}
            maxHp={o.maxHp}
            scale={o.scale}
            lastHitTime={o.lastHitTime}
          />
        )
      )}
      {ents.bullets.map((b) => (
        <BulletMesh key={b.id} posRef={b.posRef} isCharged={b.isCharged} />
      ))}
    </>
  )
}
