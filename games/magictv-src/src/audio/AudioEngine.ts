import type { Settings } from '../settings';

export type SoundName =
  | 'pop'
  | 'balloonPop'
  | 'sparkle'
  | 'chime'
  | 'boing'
  | 'bloom'
  | 'whoosh'
  | 'splash'
  | 'giggle'
  | 'celebrate'
  | 'click'
  | 'magic'
  | 'blow'
  | 'heart';

const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];

/**
 * All audio is synthesised locally with the Web Audio API — no sound files,
 * no network requests. Volumes are deliberately gentle for young ears.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private settings: Settings | null = null;
  private musicTimer: number | null = null;
  private nextNote = 0;
  private step = 0;
  private lastPlayed = new Map<string, number>();
  private lastSpoke = 0;
  private started = false;

  get ready(): boolean {
    return this.ctx !== null;
  }

  /** Must be called from a user gesture (click / key / touch). */
  init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.musicGain = ctx.createGain();
    this.sfxGain = ctx.createGain();
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    // Gentle limiter: many effects at once (confetti + pops + music) can never
    // get suddenly loud or clip, which keeps things comfortable for small ears.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -16;
    limiter.knee.value = 18;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    this.master.connect(limiter);
    limiter.connect(ctx.destination);
    // Ask the browser to load its (local) voice list early so speech is ready.
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();

    // 1 second of white noise, reused for pops and splashes.
    const len = Math.floor(ctx.sampleRate * 1);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buffer;

    if (this.settings) this.applySettings(this.settings);
    this.started = true;
    this.startMusic();
  }

  applySettings(s: Settings): void {
    this.settings = s;
    if (!this.ctx || !this.master || !this.musicGain || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.masterVolume, t, 0.05);
    this.musicGain.gain.setTargetAtTime(s.musicEnabled ? s.musicVolume * 0.5 : 0, t, 0.15);
    this.sfxGain.gain.setTargetAtTime(s.sfxVolume, t, 0.05);
  }

  private tone(opts: {
    freq: number;
    freqEnd?: number;
    type?: OscillatorType;
    duration?: number;
    gain?: number;
    attack?: number;
    delay?: number;
    pan?: number;
  }): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const dur = opts.duration ?? 0.2;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(Math.max(20, opts.freq), t0);
    if (opts.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freqEnd), t0 + dur);
    }
    const peak = opts.gain ?? 0.18;
    const attack = opts.attack ?? 0.006;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node: AudioNode = g;
    if (opts.pan !== undefined && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, opts.pan));
      g.connect(p);
      node = p;
    }
    osc.connect(g);
    node.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noiseBurst(opts: {
    duration?: number;
    gain?: number;
    filter?: BiquadFilterType;
    freq?: number;
    freqEnd?: number;
    q?: number;
    delay?: number;
  }): void {
    const ctx = this.ctx;
    if (!ctx || !this.noise || !this.sfxGain) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const dur = opts.duration ?? 0.12;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filt = ctx.createBiquadFilter();
    filt.type = opts.filter ?? 'bandpass';
    filt.frequency.setValueAtTime(opts.freq ?? 1200, t0);
    if (opts.freqEnd) filt.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqEnd), t0 + dur);
    filt.Q.value = opts.q ?? 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(opts.gain ?? 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.sfxGain);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  play(name: SoundName, variation = 0): void {
    if (!this.ctx || !this.started) return;
    const now = performance.now();
    const throttle: Partial<Record<SoundName, number>> = { pop: 28, balloonPop: 40, sparkle: 60, click: 40 };
    const min = throttle[name] ?? 35;
    if (now - (this.lastPlayed.get(name) ?? 0) < min) return;
    this.lastPlayed.set(name, now);

    switch (name) {
      case 'pop': {
        const base = 520 + Math.random() * 260 + variation * 60;
        this.tone({ freq: base, freqEnd: base * 2.1, type: 'sine', duration: 0.085, gain: 0.16 });
        this.tone({ freq: base * 2.6, freqEnd: base * 3.6, type: 'triangle', duration: 0.05, gain: 0.05 });
        this.noiseBurst({ duration: 0.04, gain: 0.05, freq: 3000, q: 0.8 });
        break;
      }
      case 'balloonPop':
        this.noiseBurst({ duration: 0.16, gain: 0.28, filter: 'lowpass', freq: 2600, freqEnd: 300 });
        this.tone({ freq: 220, freqEnd: 60, type: 'sine', duration: 0.18, gain: 0.2 });
        break;
      case 'sparkle': {
        const n = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          this.tone({
            freq: 1400 + Math.random() * 1400,
            type: 'sine',
            duration: 0.16,
            gain: 0.06,
            delay: i * 0.045,
            pan: Math.random() * 1.4 - 0.7,
          });
        }
        break;
      }
      case 'chime': {
        const note = PENTATONIC[Math.abs(variation) % PENTATONIC.length];
        this.tone({ freq: note, type: 'triangle', duration: 0.5, gain: 0.12 });
        this.tone({ freq: note * 2, type: 'sine', duration: 0.35, gain: 0.04 });
        break;
      }
      case 'boing':
        this.tone({ freq: 180, freqEnd: 420, type: 'sine', duration: 0.22, gain: 0.14 });
        this.tone({ freq: 420, freqEnd: 250, type: 'sine', duration: 0.18, gain: 0.08, delay: 0.16 });
        break;
      case 'bloom':
        this.tone({ freq: 660, type: 'sine', duration: 0.35, gain: 0.1 });
        this.tone({ freq: 990, type: 'sine', duration: 0.4, gain: 0.08, delay: 0.07 });
        this.tone({ freq: 1320, type: 'sine', duration: 0.45, gain: 0.05, delay: 0.14 });
        break;
      case 'whoosh':
        this.noiseBurst({ duration: 0.3, gain: 0.12, filter: 'bandpass', freq: 400, freqEnd: 1800, q: 1.6 });
        break;
      case 'splash':
        this.noiseBurst({ duration: 0.28, gain: 0.14, filter: 'lowpass', freq: 1800, freqEnd: 500 });
        this.tone({ freq: 300, freqEnd: 900, type: 'sine', duration: 0.2, gain: 0.05 });
        break;
      case 'giggle': {
        const base = 620 + Math.random() * 120;
        for (let i = 0; i < 4; i++) {
          this.tone({
            freq: base * (1 + (i % 2) * 0.22),
            freqEnd: base * (1.18 + (i % 2) * 0.2),
            type: 'sine',
            duration: 0.09,
            gain: 0.1,
            delay: i * 0.105,
          });
        }
        break;
      }
      case 'celebrate': {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((f, i) =>
          this.tone({ freq: f, type: 'triangle', duration: 0.4, gain: 0.11, delay: i * 0.09 }),
        );
        this.noiseBurst({ duration: 0.5, gain: 0.06, filter: 'highpass', freq: 4000 });
        break;
      }
      case 'click':
        this.tone({ freq: 900, freqEnd: 1200, type: 'square', duration: 0.05, gain: 0.05 });
        break;
      case 'magic':
        this.tone({ freq: 300, freqEnd: 1600, type: 'sine', duration: 0.5, gain: 0.08 });
        this.tone({ freq: 600, freqEnd: 2400, type: 'triangle', duration: 0.55, gain: 0.04, delay: 0.05 });
        break;
      case 'blow':
        this.noiseBurst({ duration: 0.45, gain: 0.1, filter: 'bandpass', freq: 800, freqEnd: 500, q: 0.7 });
        break;
      case 'heart':
        this.tone({ freq: 700, freqEnd: 1000, type: 'sine', duration: 0.18, gain: 0.08 });
        this.tone({ freq: 1000, freqEnd: 1300, type: 'sine', duration: 0.2, gain: 0.06, delay: 0.1 });
        break;
    }
  }

  // ---------------------------------------------------------------- music
  private startMusic(): void {
    if (!this.ctx || this.musicTimer !== null) return;
    this.nextNote = this.ctx.currentTime + 0.2;
    const tick = () => {
      const ctx = this.ctx;
      if (!ctx || !this.musicGain) return;
      const lookahead = 0.6;
      while (this.nextNote < ctx.currentTime + lookahead) {
        const s = this.settings;
        if (s && s.musicEnabled && !s.muted && s.musicVolume > 0.001) {
          const pattern = [0, 2, 4, 2, 5, 4, 2, 0, 1, 3, 5, 3];
          const idx = pattern[this.step % pattern.length];
          const note = PENTATONIC[idx] * (this.step % 16 < 8 ? 1 : 0.5);
          this.musicNote(note, this.nextNote, 1.1, 0.05);
          if (this.step % 4 === 0) this.musicNote(note / 2, this.nextNote, 1.8, 0.035);
        }
        this.nextNote += 0.52;
        this.step++;
      }
    };
    this.musicTimer = window.setInterval(tick, 220);
    tick();
  }

  private musicNote(freq: number, at: number, dur: number, gain: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  // ---------------------------------------------------------------- speech
  speak(text: string, opts: { force?: boolean; minGap?: number } = {}): void {
    if (!this.settings || !this.settings.voiceEnabled || this.settings.muted) return;
    if (!('speechSynthesis' in window)) return;
    const now = performance.now();
    if (!opts.force && now - this.lastSpokenAt() < (opts.minGap ?? 9000)) return;
    this.lastSpoke = now;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.92;
      u.pitch = 1.25;
      u.volume = Math.min(1, (this.settings.masterVolume ?? 0.8) * 0.9);
      // Privacy: only use voices installed on this computer. Some browsers offer
      // online voices (for example "Google …") that send the spoken text to a
      // server. If there is no local voice, stay quiet rather than go online.
      const voices = window.speechSynthesis.getVoices().filter((v) => v.localService);
      const preferred =
        voices.find((v) => /en(-|_)(US|GB)/i.test(v.lang) && /female|samantha|karen|zira/i.test(v.name)) ??
        voices.find((v) => /^en/i.test(v.lang));
      if (!preferred) return;
      u.voice = preferred;
      window.speechSynthesis.speak(u);
    } catch {
      /* speech is a bonus, never break the game */
    }
  }

  private lastSpokenAt(): number {
    return this.lastSpoke;
  }

  stopSpeech(): void {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  dispose(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.stopSpeech();
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
  }
}

export const audio = new AudioEngine();