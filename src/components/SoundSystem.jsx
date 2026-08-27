import React, { useEffect, useRef } from 'react'
import { useGameStore } from '../store'

class SoundManager {
  constructor() {
    this.context = null
    this.masterGain = null
    this.musicGain = null
    this.initialized = false
    this.musicOscillators = []
    this.musicPlaying = false
  }

  init() {
    if (this.initialized) return
    this.context = new (window.AudioContext || window.webkitAudioContext)()
    this.masterGain = this.context.createGain()
    this.masterGain.gain.value = 0.3
    this.masterGain.connect(this.context.destination)
    
    this.musicGain = this.context.createGain()
    this.musicGain.gain.value = 0.15
    this.musicGain.connect(this.masterGain)
    
    this.initialized = true
  }

  playShoot() {
    if (!this.initialized) this.init()
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    
    osc.type = 'square'
    osc.frequency.setValueAtTime(880, this.context.currentTime)
    osc.frequency.exponentialRampToValueAtTime(220, this.context.currentTime + 0.1)
    
    gain.gain.setValueAtTime(0.3, this.context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1)
    
    osc.connect(gain)
    gain.connect(this.masterGain)
    
    osc.start()
    osc.stop(this.context.currentTime + 0.1)
  }

  playExplosion() {
    if (!this.initialized) this.init()
    const bufferSize = this.context.sampleRate * 0.5
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
    }
    
    const noise = this.context.createBufferSource()
    noise.buffer = buffer
    
    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1000, this.context.currentTime)
    filter.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.5)
    
    const gain = this.context.createGain()
    gain.gain.setValueAtTime(0.5, this.context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5)
    
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    
    noise.start()
  }

  playHit() {
    if (!this.initialized) this.init()
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, this.context.currentTime)
    osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.2)
    
    gain.gain.setValueAtTime(0.4, this.context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2)
    
    osc.connect(gain)
    gain.connect(this.masterGain)
    
    osc.start()
    osc.stop(this.context.currentTime + 0.2)
  }

  playPowerUp() {
    if (!this.initialized) this.init()
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, this.context.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, this.context.currentTime + 0.3)
    
    gain.gain.setValueAtTime(0.3, this.context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3)
    
    osc.connect(gain)
    gain.connect(this.masterGain)
    
    osc.start()
    osc.stop(this.context.currentTime + 0.3)
  }

  playAchievement() {
    if (!this.initialized) this.init()
    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.context.createOscillator()
      const gain = this.context.createGain()
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, this.context.currentTime + i * 0.1)
      
      gain.gain.setValueAtTime(0, this.context.currentTime + i * 0.1)
      gain.gain.linearRampToValueAtTime(0.2, this.context.currentTime + i * 0.1 + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + i * 0.1 + 0.3)
      
      osc.connect(gain)
      gain.connect(this.masterGain)
      
      osc.start(this.context.currentTime + i * 0.1)
      osc.stop(this.context.currentTime + i * 0.1 + 0.3)
    })
  }

  startMusic() {
    if (!this.initialized) this.init()
    if (this.musicPlaying) return
    
    this.musicPlaying = true
    const bassNotes = [65.41, 73.42, 82.41, 87.31] // C2, D2, E2, F2
    const melodyNotes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00] // C4, D4, E4, F4, G4, A4
    
    // Bass line
    const bassOsc = this.context.createOscillator()
    const bassGain = this.context.createGain()
    bassOsc.type = 'triangle'
    bassOsc.frequency.value = bassNotes[0]
    bassGain.gain.value = 0.3
    bassOsc.connect(bassGain)
    bassGain.connect(this.musicGain)
    bassOsc.start()
    this.musicOscillators.push(bassOsc)
    
    // Change bass note every 2 seconds
    let bassIndex = 0
    this.bassInterval = setInterval(() => {
      bassIndex = (bassIndex + 1) % bassNotes.length
      bassOsc.frequency.setValueAtTime(bassNotes[bassIndex], this.context.currentTime)
    }, 2000)
    
    // Simple melody
    let melodyIndex = 0
    this.melodyInterval = setInterval(() => {
      if (!this.musicPlaying) return
      
      const osc = this.context.createOscillator()
      const gain = this.context.createGain()
      
      osc.type = 'sine'
      osc.frequency.value = melodyNotes[melodyIndex]
      gain.gain.setValueAtTime(0.1, this.context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3)
      
      osc.connect(gain)
      gain.connect(this.musicGain)
      
      osc.start()
      osc.stop(this.context.currentTime + 0.3)
      
      melodyIndex = (melodyIndex + 1) % melodyNotes.length
    }, 500)
  }

  stopMusic() {
    this.musicPlaying = false
    this.musicOscillators.forEach(osc => osc.stop())
    this.musicOscillators = []
    
    if (this.bassInterval) clearInterval(this.bassInterval)
    if (this.melodyInterval) clearInterval(this.melodyInterval)
  }

  setVolume(value) {
    if (this.masterGain) {
      this.masterGain.gain.value = value
    }
  }

  setMusicVolume(value) {
    if (this.musicGain) {
      this.musicGain.gain.value = value
    }
  }
}

const soundManager = new SoundManager()

export function SoundSystem() {
  const gameState = useRef('menu')

  useEffect(() => {
    // Initialize on first user interaction
    const handleInit = () => {
      soundManager.init()
      window.removeEventListener('click', handleInit)
      window.removeEventListener('keydown', handleInit)
    }

    window.addEventListener('click', handleInit)
    window.addEventListener('keydown', handleInit)

    // Expose to window for game entities
    window.__soundManager = soundManager

    return () => {
      window.removeEventListener('click', handleInit)
      window.removeEventListener('keydown', handleInit)
    }
  }, [])

  // Subscribe to gameState changes via Zustand (no polling)
  useEffect(() => {
    const handleStateChange = (state) => {
      const currentState = state.gameState
      if (currentState !== gameState.current) {
        const prev = gameState.current
        gameState.current = currentState

        if (currentState === 'playing' && prev !== 'playing') {
          soundManager.startMusic()
        } else if (currentState !== 'playing' && prev === 'playing') {
          soundManager.stopMusic()
        }
      }
    }

    // Initial sync
    handleStateChange(useGameStore.getState())

    // Subscribe to changes
    const unsubscribe = useGameStore.subscribe(handleStateChange)

    return () => unsubscribe()
  }, [])

  return null
}

export default soundManager
