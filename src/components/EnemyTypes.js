import * as THREE from 'three'

/**
 * Enemy type catalog. The spawner in GameEntities uses this to pick
 * which type to create, what AI to apply, and how to render it.
 *
 * Each entry:
 *  - type: string id
 *  - hp: hit points (1 = one-shot)
 *  - baseSpeed: world units per second
 *  - ai: 'linear' | 'homing' | 'stationary'
 *  - fireRate: ms between shots (0 = never)
 *  - projectileColor: emitted bullet color
 *  - scoreValue: points awarded on kill
 *  - unlockWave: earliest wave this can spawn
 *  - weightFn: (currentWave) => relative weight; higher = more common
 *  - hitRadius: collision sphere radius
 *  - visual: { kind, color, scale, emissive } - used by EnemyVisual
 */
export const ENEMY_TYPES = {
  drone: {
    type: 'drone',
    hp: 1,
    baseSpeed: 1.0,
    ai: 'linear',
    fireRate: 0,
    projectileColor: null,
    scoreValue: 25,
    unlockWave: 1,
    weightFn: (w) => Math.max(0.1, 1.2 - w * 0.05),
    hitRadius: 1.2,
    visual: { kind: 'octahedron', color: '#ff3333', emissive: '#ff0000', scale: 1 },
  },
  kamikaze: {
    type: 'kamikaze',
    hp: 1,
    baseSpeed: 1.6,
    ai: 'homing',
    fireRate: 0,
    projectileColor: null,
    scoreValue: 30,
    unlockWave: 2,
    weightFn: (w) => Math.max(0.05, 0.5 + (w - 1) * 0.1),
    hitRadius: 0.7,
    visual: { kind: 'tetrahedron', color: '#ff66ff', emissive: '#ff00ff', scale: 0.9 },
  },
  sniper: {
    type: 'sniper',
    hp: 2,
    baseSpeed: 0, // stationary
    ai: 'stationary',
    fireRate: 2200,
    projectileColor: '#ffaa00',
    scoreValue: 50,
    unlockWave: 3,
    weightFn: (w) => Math.max(0, 0.2 + (w - 2) * 0.08),
    hitRadius: 1.1,
    visual: { kind: 'cylinder', color: '#ffaa00', emissive: '#ff6600', scale: 1 },
  },
  tank: {
    type: 'tank',
    hp: 3,
    baseSpeed: 0.5,
    ai: 'linear',
    fireRate: 0,
    projectileColor: null,
    scoreValue: 75,
    unlockWave: 4,
    weightFn: (w) => Math.max(0, 0.1 + (w - 3) * 0.06),
    hitRadius: 1.6,
    visual: { kind: 'cube', color: '#8888ff', emissive: '#4444ff', scale: 1.4 },
  },
  swarmer: {
    type: 'swarmer',
    hp: 1,
    baseSpeed: 1.4,
    ai: 'homing',
    fireRate: 0,
    projectileColor: null,
    scoreValue: 15,
    unlockWave: 2,
    weightFn: (w) => Math.max(0, 0.4 + (w - 1) * 0.08),
    hitRadius: 0.5,
    visual: { kind: 'octahedron_small', color: '#ffff66', emissive: '#ffaa00', scale: 0.6 },
  },
}

/**
 * Pick an enemy type for a given wave, weighted by unlockWave + weightFn.
 * Returns the type key.
 */
export function pickEnemyType(wave, rng = Math.random) {
  const candidates = Object.values(ENEMY_TYPES).filter((e) => e.unlockWave <= wave)
  if (candidates.length === 0) return 'drone'
  const totalWeight = candidates.reduce((sum, e) => sum + e.weightFn(wave), 0)
  let r = rng() * totalWeight
  for (const e of candidates) {
    r -= e.weightFn(wave)
    if (r <= 0) return e.type
  }
  return candidates[candidates.length - 1].type
}

// ─── Shared geometries (per visual kind) ───
export function createEnemyGeometry(kind) {
  switch (kind) {
    case 'octahedron':
      return new THREE.OctahedronGeometry(0.6, 0)
    case 'octahedron_small':
      return new THREE.OctahedronGeometry(0.6, 0)
    case 'tetrahedron':
      return new THREE.TetrahedronGeometry(0.7, 0)
    case 'cylinder':
      return new THREE.CylinderGeometry(0.5, 0.5, 1.0, 12)
    case 'cube':
      return new THREE.BoxGeometry(1.0, 1.0, 1.0)
    default:
      return new THREE.OctahedronGeometry(0.6, 0)
  }
}

// ─── Per-enemy procedural colors → materials ───
const materialCache = new Map()
export function getEnemyMaterial(visual) {
  const key = `${visual.kind}-${visual.color}-${visual.emissive}`
  if (materialCache.has(key)) return materialCache.get(key)
  const mat = new THREE.MeshStandardMaterial({
    color: visual.color,
    emissive: visual.emissive,
    emissiveIntensity: 0.6,
    metalness: 0.6,
    roughness: 0.3,
  })
  materialCache.set(key, mat)
  return mat
}

export const shieldRingGeometry = new THREE.TorusGeometry(1.1, 0.04, 8, 24)
export const shieldRingMaterial = new THREE.MeshStandardMaterial({
  color: '#00aaff',
  emissive: '#0088ff',
  emissiveIntensity: 1.5,
  transparent: true,
  opacity: 0.7,
})

export const sniperBarrelGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8)
export function getSniperBarrelMaterial() {
  return new THREE.MeshStandardMaterial({
    color: '#ffaa00',
    emissive: '#ff6600',
    emissiveIntensity: 2,
  })
}
