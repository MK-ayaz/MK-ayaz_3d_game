import { create } from 'zustand'

// Load high score from localStorage
const getHighScore = () => {
  try {
    return parseInt(localStorage.getItem('spaceShooterHighScore') || '0', 10)
  } catch {
    return 0
  }
}

// Save high score to localStorage
const saveHighScore = (score) => {
  try {
    localStorage.setItem('spaceShooterHighScore', score.toString())
  } catch (e) {
    console.error('Failed to save high score:', e)
  }
}

// Load achievements from localStorage
const getAchievements = () => {
  try {
    return JSON.parse(localStorage.getItem('spaceShooterAchievements') || '[]')
  } catch {
    return []
  }
}

// Save achievements to localStorage
const saveAchievements = (achievements) => {
  try {
    localStorage.setItem('spaceShooterAchievements', JSON.stringify(achievements))
  } catch (e) {
    console.error('Failed to save achievements:', e)
  }
}

// Achievement definitions
const ACHIEVEMENTS = {
  first_blood: { id: 'first_blood', name: 'First Blood', description: 'Destroy your first enemy', icon: '🎯' },
  combo_master: { id: 'combo_master', name: 'Combo Master', description: 'Reach 10x combo', icon: '🔥' },
  wave_survivor: { id: 'wave_survivor', name: 'Wave Survivor', description: 'Reach wave 5', icon: '🌊' },
  score_hunter: { id: 'score_hunter', name: 'Score Hunter', description: 'Score 1000 points', icon: '💯' },
  power_collector: { id: 'power_collector', name: 'Power Collector', description: 'Collect 5 power-ups', icon: '⚡' },
  combo_legend: { id: 'combo_legend', name: 'Combo Legend', description: 'Reach 25x combo', icon: '👑' },
  wave_master: { id: 'wave_master', name: 'Wave Master', description: 'Reach wave 10', icon: '🏆' },
  high_scorer: { id: 'high_scorer', name: 'High Scorer', description: 'Score 5000 points', icon: '🌟' },
  perfect_game: { id: 'perfect_game', name: 'Perfect Game', description: 'Complete a wave without taking damage', icon: '💎' },
}

const INITIAL_STATE = {
  score: 0,
  health: 100,
  maxHealth: 100,
  wave: 1,
  gameState: 'menu', // 'menu' | 'playing' | 'paused' | 'gameover' | 'upgrading'
  enemiesDestroyed: 0,
  playerPosition: [0, 0, 0],
  activePowerUp: null, // 'health' | 'speed' | 'multishot' | 'slowmo' | null
  powerUpTimer: 0,
  highScore: getHighScore(),
  combo: 0,
  comboMultiplier: 1,
  comboTimer: 0,
  maxCombo: 0,
  totalGamesPlayed: 0,
  achievements: getAchievements(),
  unlockedAchievements: [],
  powerUpsCollected: 0,
  waveDamageTaken: 0,
  // Roguelite upgrades
  upgrades: {
    damage: 0,
    fireRate: 0,
    moveSpeed: 0,
    maxHp: 0,
    multishot: 0,
    critChance: 0,
    projSize: 0,
    lifesteal: 0,
  },
  // Combo-based near-miss / heat
  heat: 0,
  overheated: false,
  nearMissFlash: 0,
  // Boss state
  bossActive: false,
  bossId: 0,
}

export const useGameStore = create((set, get) => ({
  ...INITIAL_STATE,

  startGame: () => set({
    ...INITIAL_STATE,
    gameState: 'playing',
    highScore: getHighScore(),
    totalGamesPlayed: get().totalGamesPlayed + 1,
    achievements: getAchievements(),
  }),

  pauseGame: () => set({ gameState: 'paused' }),

  resumeGame: () => set({ gameState: 'playing' }),

  gameOver: () => {
    const state = get()
    if (state.score > state.highScore) {
      saveHighScore(state.score)
      set({ health: 0, gameState: 'gameover', highScore: state.score })
    } else {
      set({ health: 0, gameState: 'gameover' })
    }
  },

  addScore: (points) => set((state) => {
    const newCombo = state.combo + 1
    const newMultiplier = Math.min(5, 1 + Math.floor(newCombo / 5)) // Max 5x multiplier
    const comboTimer = Date.now() + 3000 // 3 second combo window
    const newScore = state.score + (points * newMultiplier)
    
    // Check achievements
    const newUnlocked = [...state.unlockedAchievements]
    const achievements = state.achievements
    
    if (!achievements.includes('first_blood') && state.enemiesDestroyed === 0) {
      newUnlocked.push('first_blood')
      achievements.push('first_blood')
      saveAchievements(achievements)
      if (window.__soundManager) window.__soundManager.playAchievement()
    }
    
    if (!achievements.includes('combo_master') && newCombo >= 10) {
      newUnlocked.push('combo_master')
      achievements.push('combo_master')
      saveAchievements(achievements)
      if (window.__soundManager) window.__soundManager.playAchievement()
    }
    
    if (!achievements.includes('combo_legend') && newCombo >= 25) {
      newUnlocked.push('combo_legend')
      achievements.push('combo_legend')
      saveAchievements(achievements)
      if (window.__soundManager) window.__soundManager.playAchievement()
    }
    
    if (!achievements.includes('score_hunter') && newScore >= 1000) {
      newUnlocked.push('score_hunter')
      achievements.push('score_hunter')
      saveAchievements(achievements)
      if (window.__soundManager) window.__soundManager.playAchievement()
    }
    
    if (!achievements.includes('high_scorer') && newScore >= 5000) {
      newUnlocked.push('high_scorer')
      achievements.push('high_scorer')
      saveAchievements(achievements)
      if (window.__soundManager) window.__soundManager.playAchievement()
    }
    
    return {
      score: newScore,
      enemiesDestroyed: state.enemiesDestroyed + 1,
      combo: newCombo,
      comboMultiplier: newMultiplier,
      comboTimer,
      maxCombo: Math.max(state.maxCombo, newCombo),
      unlockedAchievements: newUnlocked,
      achievements,
    }
  }),

  resetCombo: () => set({
    combo: 0,
    comboMultiplier: 1,
    comboTimer: 0,
  }),

  updateCombo: () => {
    const state = get()
    if (state.combo > 0 && Date.now() > state.comboTimer) {
      set({ combo: 0, comboMultiplier: 1, comboTimer: 0 })
    }
  },

  takeDamage: (amount) => {
    const current = get().health - amount
    if (current <= 0) {
      set({ health: 0, gameState: 'gameover' })
    } else {
      set({ health: current, waveDamageTaken: get().waveDamageTaken + amount })
    }
    // Reset combo on damage
    get().resetCombo()
  },

  heal: (amount) => set((state) => ({
    health: Math.min(100, state.health + amount),
  })),

  nextWave: () => set((state) => {
    const newWave = state.wave + 1
    
    // Check wave achievements
    const newUnlocked = [...state.unlockedAchievements]
    const achievements = state.achievements
    
    if (!achievements.includes('wave_survivor') && newWave >= 5) {
      newUnlocked.push('wave_survivor')
      achievements.push('wave_survivor')
      saveAchievements(achievements)
      if (window.__soundManager) window.__soundManager.playAchievement()
    }
    
    if (!achievements.includes('wave_master') && newWave >= 10) {
      newUnlocked.push('wave_master')
      achievements.push('wave_master')
      saveAchievements(achievements)
      if (window.__soundManager) window.__soundManager.playAchievement()
    }
    
    // Check perfect game achievement
    if (!achievements.includes('perfect_game') && state.waveDamageTaken === 0) {
      newUnlocked.push('perfect_game')
      achievements.push('perfect_game')
      saveAchievements(achievements)
      if (window.__soundManager) window.__soundManager.playAchievement()
    }
    
    // Heal player slightly on wave completion
    const healAmount = Math.min(20, 100 - state.health)
    
    return {
      wave: newWave,
      unlockedAchievements: newUnlocked,
      achievements,
      waveDamageTaken: 0, // Reset damage counter for new wave
      health: Math.min(100, state.health + healAmount), // Small heal on wave completion
    }
  }),

  setPlayerPosition: (pos) => set({ playerPosition: pos }),

  activatePowerUp: (type, duration = 5000) => {
    const state = get()
    const newPowerUpsCollected = state.powerUpsCollected + 1
    
    // Check power-up achievement
    const newUnlocked = [...state.unlockedAchievements]
    const achievements = state.achievements
    
    if (!achievements.includes('power_collector') && newPowerUpsCollected >= 5) {
      newUnlocked.push('power_collector')
      achievements.push('power_collector')
      saveAchievements(achievements)
    }
    
    set({ 
      activePowerUp: type, 
      powerUpTimer: Date.now() + duration,
      powerUpsCollected: newPowerUpsCollected,
      unlockedAchievements: newUnlocked,
      achievements,
    })
    
    if (type === 'health') {
      get().heal(30)
    }
  },

  updatePowerUp: () => {
    const state = get()
    if (state.activePowerUp && Date.now() > state.powerUpTimer) {
      set({ activePowerUp: null, powerUpTimer: 0 })
    }
  },

  resetGame: () => set({ ...INITIAL_STATE, highScore: getHighScore(), achievements: getAchievements() }),

  // Apply an upgrade tier (used by UpgradeScreen)
  applyUpgrade: (key) => set((state) => {
    const newUpgrades = { ...state.upgrades, [key]: (state.upgrades[key] || 0) + 1 }
    let newMax = state.maxHealth
    let newHealth = state.health
    if (key === 'maxHp') {
      newMax = 100 + newUpgrades.maxHp * 25
      newHealth = newMax
    }
    return { upgrades: newUpgrades, maxHealth: newMax, health: newHealth }
  }),

  // Heat system
  addHeat: (amount) => set((state) => {
    if (state.overheated) return {}
    const newHeat = Math.min(100, state.heat + amount)
    return { heat: newHeat, overheated: newHeat >= 100 }
  }),
  coolHeat: (amount) => set((state) => {
    if (state.overheated) {
      return { heat: Math.max(0, state.heat - amount), overheated: state.heat - amount > 30 }
    }
    return { heat: Math.max(0, state.heat - amount) }
  }),
  resetHeat: () => set({ heat: 0, overheated: false }),

  // Near miss flash trigger
  triggerNearMiss: () => set({ nearMissFlash: Date.now() + 400 }),

  // Boss state
  setBossActive: (active) => set({ bossActive: active }),

  getAchievements: () => get().achievements,
}))
