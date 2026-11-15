/**
 * Tiny original WebAudio sound engine.
 * No audio files, no network, no autoplay before the first tap.
 */

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

const MUSIC = {
  meadow: {
    notes: [60, 64, 67, 72, 74, 76, 79, 84],
    pattern: [0, 2, 4, 2, 5, 4, 7, 5],
    bass: [48, 55, 53, 55],
    wave: 'triangle',
    tempo: 0.5,
  },
  forest: {
    notes: [62, 65, 69, 72, 74, 77, 81, 86],
    pattern: [0, 2, 3, 5, 4, 2, 7, 4],
    bass: [50, 57, 55, 53],
    wave: 'sine',
    tempo: 0.54,
  },
  cloud: {
    notes: [65, 69, 72, 77, 79, 81, 84, 89],
    pattern: [0, 4, 2, 5, 7, 4, 6, 2],
    bass: [53, 60, 58, 55],
    wave: 'triangle',
    tempo: 0.48,
  },
  candy: {
    notes: [67, 71, 74, 79, 81, 83, 86, 91],
    pattern: [0, 2, 4, 5, 3, 6, 7, 5],
    bass: [55, 62, 60, 59],
    wave: 'sine',
    tempo: 0.46,
  },
};

function makeNoiseBuffer(ctx) {
  const length = Math.floor(ctx.sampleRate * 0.5);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  return buffer;
}

export class AudioManager {
  constructor(progress) {
    this.progress = progress;
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.noise = null;
    this.musicTimer = null;
    this.musicGain = null;
    this.musicTheme = 'meadow';
    this.musicOn = progress?.settings?.music !== false;
    this.sfxOn = progress?.settings?.sfx !== false;
    this.unlocked = false;
    this._onVisibility = () => {
      if (!this.ctx) return;
      if (document.hidden) {
        this.stopMusic();
      } else if (this.musicOn) {
        this.startMusic(this.musicTheme);
      }
    };
    document.addEventListener('visibilitychange', this._onVisibility);
  }

  unlock() {
    if (this.unlocked && this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.52;
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.1;
      this.musicBus.connect(this.master);
      this.noise = makeNoiseBuffer(this.ctx);
      this.unlocked = true;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (this.musicOn) this.startMusic(this.musicTheme);
    } catch {
      this.unlocked = false;
    }
  }

  sync(progress) {
    this.progress = progress;
    this.musicOn = progress.settings.music;
    this.sfxOn = progress.settings.sfx;
    if (!this.musicOn) this.stopMusic();
  }

  setMusic(on) {
    this.musicOn = Boolean(on);
    if (!this.ctx) {
      if (this.musicOn) this.unlock();
      return;
    }
    if (this.musicOn) this.startMusic(this.musicTheme);
    else this.stopMusic();
  }

  setSfx(on) {
    this.sfxOn = Boolean(on);
  }

  setTheme(theme) {
    if (!MUSIC[theme]) return;
    if (this.musicTheme === theme && this.musicTimer) return;
    this.musicTheme = theme;
    if (this.musicOn && this.ctx) this.startMusic(theme);
  }

  startMusic(theme = this.musicTheme) {
    this.musicTheme = MUSIC[theme] ? theme : 'meadow';
    if (!this.unlocked || !this.ctx || !this.musicOn) return;
    this.stopMusic();
    const data = MUSIC[this.musicTheme];
    const now = this.ctx.currentTime + 0.08;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.7);
    gain.connect(this.musicBus);
    this.musicGain = gain;

    const barLength = data.notes.length * data.tempo;
    const loop = () => {
      if (!this.musicOn || !this.ctx) return;
      const start = this.ctx.currentTime + 0.05;
      const root = data.bass[Math.floor(Math.random() * data.bass.length)];
      this._tone(midi(root), start, barLength * 0.92, 0.032, 'sine', gain, 0.3);
      this._tone(midi(root + 7), start + 0.04, barLength * 0.8, 0.018, 'sine', gain, 0.45);
      for (let i = 0; i < data.pattern.length; i += 1) {
        const note = data.notes[data.pattern[i]];
        const when = start + i * data.tempo;
        const soft = i % 4 === 0 ? 0.055 : 0.038;
        this._tone(midi(note), when, data.tempo * 1.7, soft, data.wave, gain, 0.035);
        if (i % 2 === 0) {
          this._tone(midi(note + 12), when + 0.015, data.tempo * 0.8, 0.012, 'sine', gain, 0.03);
        }
      }
      this.musicTimer = window.setTimeout(loop, barLength * 1000);
    };
    loop();
  }

  stopMusic() {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicGain && this.ctx) {
      const gain = this.musicGain;
      const now = this.ctx.currentTime;
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setTargetAtTime(0.0001, now, 0.08);
      } catch {
        /* noop */
      }
      window.setTimeout(() => {
        try { gain.disconnect(); } catch { /* noop */ }
      }, 350);
    }
    this.musicGain = null;
  }

  _tone(freq, start, duration, volume, type = 'sine', destination = null, attack = 0.01) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    const safeAttack = Math.min(attack, duration * 0.45);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + safeAttack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(destination || this.sfxBus || this.master);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  _noise(start, duration, volume, filterFreq = 1200, destination = null) {
    if (!this.ctx || !this.noise) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination || this.sfxBus || this.master);
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  sfx(name) {
    if (!this.sfxOn || !this.unlocked || !this.ctx) return;
    const now = this.ctx.currentTime + 0.015;
    switch (name) {
      case 'jump':
        this._tone(420, now, 0.16, 0.09, 'sine', null, 0.01);
        this._tone(720, now + 0.06, 0.18, 0.07, 'sine', null, 0.01);
        this._tone(980, now + 0.12, 0.1, 0.04, 'sine', null, 0.01);
        break;
      case 'land':
        this._tone(260, now, 0.1, 0.055, 'triangle', null, 0.005);
        this._noise(now, 0.08, 0.018, 700);
        break;
      case 'collect':
        this._tone(880, now, 0.1, 0.08, 'sine', null, 0.005);
        this._tone(1320, now + 0.07, 0.14, 0.06, 'sine', null, 0.005);
        break;
      case 'rescue':
        [660, 880, 1100, 1320].forEach((freq, i) => {
          this._tone(freq, now + i * 0.08, 0.2, 0.07, 'sine', null, 0.01);
        });
        break;
      case 'celebrate':
        [523, 659, 784, 1046, 1318].forEach((freq, i) => {
          this._tone(freq, now + i * 0.1, 0.3, 0.08, 'triangle', null, 0.015);
        });
        this._noise(now + 0.5, 0.3, 0.02, 2600);
        break;
      case 'splash':
        this._noise(now, 0.22, 0.06, 900);
        this._tone(330, now + 0.02, 0.16, 0.055, 'sine', null, 0.005);
        this._tone(220, now + 0.1, 0.15, 0.04, 'sine', null, 0.005);
        break;
      case 'boing':
        this._tone(180, now, 0.2, 0.08, 'triangle', null, 0.005);
        this._tone(260, now + 0.06, 0.22, 0.055, 'sine', null, 0.005);
        this._tone(320, now + 0.13, 0.2, 0.04, 'sine', null, 0.005);
        break;
      case 'pop':
        this._tone(1200, now, 0.06, 0.06, 'sine', null, 0.003);
        this._tone(600, now + 0.03, 0.08, 0.04, 'sine', null, 0.003);
        break;
      case 'button':
        this._tone(660, now, 0.08, 0.045, 'sine', null, 0.005);
        this._tone(990, now + 0.05, 0.09, 0.035, 'sine', null, 0.005);
        break;
      case 'whoosh':
        this._noise(now, 0.18, 0.025, 2400);
        break;
      case 'unlock':
        [523, 784, 1046].forEach((freq, i) => {
          this._tone(freq, now + i * 0.09, 0.22, 0.07, 'sine', null, 0.01);
        });
        break;
      default:
        this._tone(660, now, 0.08, 0.04, 'sine', null, 0.005);
    }
  }

  destroy() {
    this.stopMusic();
    document.removeEventListener('visibilitychange', this._onVisibility);
    if (this.ctx) this.ctx.close().catch(() => {});
  }
}