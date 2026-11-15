type SoundName = 'tap' | 'pop' | 'sparkle' | 'save' | 'success' | 'whoosh'

class SoundManager {
  private context: AudioContext | null = null
  private enabled = true
  private lastPlayed = new Map<SoundName, number>()

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  unlock() {
    if (!this.enabled) return
    const context = this.getContext()
    if (context?.state === 'suspended') void context.resume()
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.context) {
      const AudioContextClass = window.AudioContext ?? (window as unknown as {
        webkitAudioContext?: typeof AudioContext
      }).webkitAudioContext
      if (!AudioContextClass) return null
      this.context = new AudioContextClass()
    }
    return this.context
  }

  private tone(
    frequency: number,
    duration: number,
    options: {
      type?: OscillatorType
      volume?: number
      delay?: number
      endFrequency?: number
    } = {},
  ) {
    const context = this.getContext()
    if (!context) return
    const start = context.currentTime + (options.delay ?? 0)
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = options.type ?? 'sine'
    oscillator.frequency.setValueAtTime(frequency, start)
    if (options.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFrequency), start + duration)
    }
    const volume = options.volume ?? 0.055
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.03)
  }

  play(name: SoundName) {
    if (!this.enabled) return
    const context = this.getContext()
    if (!context) return
    if (context.state === 'suspended') void context.resume()
    const now = performance.now()
    const last = this.lastPlayed.get(name) ?? 0
    if (now - last < 70) return
    this.lastPlayed.set(name, now)

    switch (name) {
      case 'tap':
        this.tone(620, 0.09, { type: 'sine', volume: 0.035, endFrequency: 820 })
        break
      case 'pop':
        this.tone(420, 0.13, { type: 'triangle', volume: 0.05, endFrequency: 760 })
        break
      case 'sparkle':
        this.tone(880, 0.12, { type: 'sine', volume: 0.03 })
        this.tone(1320, 0.16, { type: 'sine', volume: 0.025, delay: 0.05 })
        break
      case 'save':
        this.tone(523.25, 0.16, { type: 'sine', volume: 0.045 })
        this.tone(659.25, 0.16, { type: 'sine', volume: 0.045, delay: 0.1 })
        this.tone(783.99, 0.26, { type: 'sine', volume: 0.05, delay: 0.2 })
        break
      case 'success':
        this.tone(523.25, 0.14, { type: 'triangle', volume: 0.04 })
        this.tone(659.25, 0.14, { type: 'triangle', volume: 0.04, delay: 0.1 })
        this.tone(783.99, 0.14, { type: 'triangle', volume: 0.04, delay: 0.2 })
        this.tone(1046.5, 0.3, { type: 'triangle', volume: 0.045, delay: 0.3 })
        break
      case 'whoosh':
        this.tone(300, 0.18, { type: 'sine', volume: 0.025, endFrequency: 640 })
        break
    }
  }
}

export const soundManager = new SoundManager()