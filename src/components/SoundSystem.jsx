import React, { useEffect, useRef } from 'react'

class SoundManager {
  constructor() {
    this.context = null
    this.masterGain = null
    this.initialized = false
  }

  init() {
    if (this.initialized) return
    this.context = new (window.AudioContext || window.webkitAudioContext)()
    this.masterGain = this.context.createGain()
    this.masterGain.gain.value = 0.3
    this.masterGain.connect(this.context.destination)
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

  setVolume(value) {
    if (this.masterGain) {
      this.masterGain.gain.value = value
    }
  }
}

const soundManager = new SoundManager()

export function SoundSystem() {
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

  return null
}

export default soundManager
