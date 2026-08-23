import { create } from 'zustand'

const INITIAL_STATE = {
  score: 0,
  health: 100,
  wave: 1,
  gameState: 'menu', // 'menu' | 'playing' | 'paused' | 'gameover'
  enemiesDestroyed: 0,
}

export const useGameStore = create((set, get) => ({
  ...INITIAL_STATE,

  startGame: () => set({
    ...INITIAL_STATE,
    gameState: 'playing',
  }),

  pauseGame: () => set({ gameState: 'paused' }),

  resumeGame: () => set({ gameState: 'playing' }),

  gameOver: () => set({ gameState: 'gameover' }),

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

  nextWave: () => set((state) => ({
    wave: state.wave + 1,
  })),

  resetGame: () => set({ ...INITIAL_STATE }),
}))
