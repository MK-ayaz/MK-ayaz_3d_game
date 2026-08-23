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

const INITIAL_STATE = {
  score: 0,
  health: 100,
  wave: 1,
  gameState: 'menu', // 'menu' | 'playing' | 'paused' | 'gameover'
  enemiesDestroyed: 0,
  playerPosition: [0, 0, 0],
  activePowerUp: null, // 'health' | 'speed' | 'multishot' | null
  powerUpTimer: 0,
  highScore: getHighScore(),
}

export const useGameStore = create((set, get) => ({
  ...INITIAL_STATE,

  startGame: () => set({
    ...INITIAL_STATE,
    gameState: 'playing',
    highScore: getHighScore(),
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

  addScore: (points) => set((state) => ({
    score: state.score + points,
    enemiesDestroyed: state.enemiesDestroyed + 1,
  })),

  takeDamage: (amount) => {
    const current = get().health - amount
    if (current <= 0) {
      set({ health: 0, gameState: 'gameover' })
    } else {
      set({ health: current })
    }
  },

  heal: (amount) => set((state) => ({
    health: Math.min(100, state.health + amount),
  })),

  nextWave: () => set((state) => ({
    wave: state.wave + 1,
  })),

  setPlayerPosition: (pos) => set({ playerPosition: pos }),

  activatePowerUp: (type, duration = 5000) => {
    set({ activePowerUp: type, powerUpTimer: Date.now() + duration })
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

  resetGame: () => set({ ...INITIAL_STATE, highScore: getHighScore() }),
}))
