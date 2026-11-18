/**
 * Tiny original WebAudio sound engine for Great Escape.
 *
 * No audio files, no network, no autoplay before the first tap. Soft, cheerful
 * tones only — nothing startling for little ears. All music is a gentle
 * generative loop synthesised at runtime.
 */

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

const MUSIC = {
  pillow: {
    notes: [60, 64, 67, 72, 71, 67, 64, 62],
    pattern: [0, 2, 4, 2, 5, 4, 2, 1],
    bass: [48, 53, 55, 48],
    wave: 'triangle',
    tempo: 0.58,
  },
  backyard: {
    notes: [62, 66, 69, 74, 72, 69, 66, 64],
    pattern: [0, 2, 4, 5, 4, 2, 1, 3],
    bass: [50, 57, 54, 55],
    wave: 'sine',
    tempo: 0.52,
  },
  toybox: {
    notes: [67, 71, 74, 79, 76, 74, 71, 69],
    pattern: [0, 1, 2, 4, 3, 2, 4, 5],
    bass: [55, 60, 57, 62],
    wave: 'triangle',
    tempo: 0.5,
  },
  adventure: {
    notes: [60, 64, 67, 72, 74, 76, 79, 84],
    pattern: [0, 2, 4, 7, 5, 4, 2, 1],
    bass: [48, 55, 53, 55],
    wave: 'sine',
    tempo: 0.54,
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
    this.musicTheme = 'pillow';
    this.soundOn = progress?.settings?.sound !== false;
    this.musicOn = progress?.settings?.music !== false;
    this.sfxOn = progress?.settings?.sfx !== false;
    this.musicVolume = progress?.settings?.musicVolume ?? 0.5;
    this.sfxVolume = progress?.settings?.sfxVolume ?? 0.7;
    this.unlocked = false;
    this._onVisibility = () => {
      if (!this.ctx) return;
      if (document.hidden) this.stopMusic();
      else if (this.musicOn) this.startMusic(this.musicTheme);
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
      this.master.gain.value = this.soundOn ? 1 : 0;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxVolume * 0.55;
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicVolume * 0.18;
      this.musicBus.connect(this.master);
      this.noise = makeNoiseBuffer(this.ctx);
      this.unlocked = true;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (this.soundOn && this.musicOn) this.startMusic(this.musicTheme);
    } catch {
      this.unlocked = false;
    }
  }

  sync(progress) {
    this.progress = progress;
    const s = progress.settings;
    this.soundOn = s.sound !== false;
    this.musicOn = s.music !== false && this.soundOn;
    this.sfxOn = s.sfx !== false && this.soundOn;
    this.musicVolume = s.musicVolume ?? 0.5;
    this.sfxVolume = s.sfxVolume ?? 0.7;
    this.applyVolumes();
    if (!this.musicOn) this.stopMusic();
    else if (this.unlocked) this.startMusic(this.musicTheme);
  }

  applyVolumes() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const target = this.soundOn ? 1 : 0;
    this.master.gain.setTargetAtTime(target, now, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.sfxVolume * 0.55, now, 0.05);
    this.musicBus.gain.setTargetAtTime(this.musicVolume * 0.18, now, 0.05);
  }

  setMusicTheme(theme) {
    if (!MUSIC[theme] || this.musicTheme === theme) return;
    this.musicTheme = theme;
    if (this.musicOn && this.unlocked) this.startMusic(theme);
  }

  setSound(on) {
    this.soundOn = Boolean(on);
    this.applyVolumes();
    if (this.soundOn && this.unlocked && this.musicOn) this.startMusic(this.musicTheme);
    if (!this.soundOn) this.stopMusic();
  }

  setMusic(on) {
    this.musicOn = Boolean(on);
    if (this.musicOn) {
      this.unlock();
      if (this.ctx) this.startMusic(this.musicTheme);
    } else {
      this.stopMusic();
    }
  }

  setSfx(on) {
    this.sfxOn = Boolean(on);
  }

  startMusic(theme = this.musicTheme) {
    this.musicTheme = MUSIC[theme] ? theme : 'pillow';
    if (!this.unlocked || !this.ctx || !this.soundOn || !this.musicOn) return;
    this.stopMusic();
    const data = MUSIC[this.musicTheme];
    const now = this.ctx.currentTime + 0.08;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.7);
    gain.connect(this.musicBus);
    this.musicGain = gain;

    const barLength = data.notes.length * data.tempo;
    const loop = () => {
      if (!this.musicOn || !this.ctx || !this.soundOn) return;
      const start = this.ctx.currentTime + 0.05;
      const root = data.bass[Math.floor(Math.random() * data.bass.length)];
      this._tone(midi(root), start, barLength * 0.92, 0.03, 'sine', gain, 0.3);
      this._tone(midi(root + 7), start + 0.04, barLength * 0.8, 0.016, 'sine', gain, 0.45);
      for (let i = 0; i < data.pattern.length; i += 1) {
        const note = data.notes[data.pattern[i]];
        const when = start + i * data.tempo;
        const soft = i % 4 === 0 ? 0.05 : 0.032;
        this._tone(midi(note), when, data.tempo * 1.7, soft, data.wave, gain, 0.035);
        if (i % 2 === 0) {
          this._tone(midi(note + 12), when + 0.015, data.tempo * 0.8, 0.01, 'sine', gain, 0.03);
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
    if (!this.sfxOn || !this.unlocked || !this.ctx || !this.soundOn) return;
    const now = this.ctx.currentTime + 0.015;
    switch (name) {
      case 'step':
        this._tone(300 + Math.random() * 40, now, 0.055, 0.02, 'sine', null, 0.004);
        break;
      case 'bump':
        this._tone(180, now, 0.12, 0.045, 'triangle', null, 0.005);
        this._tone(140, now + 0.05, 0.12, 0.03, 'sine', null, 0.005);
        break;
      case 'collect':
        this._tone(880, now, 0.1, 0.07, 'sine', null, 0.005);
        this._tone(1320, now + 0.07, 0.15, 0.05, 'sine', null, 0.005);
        break;
      case 'friend':
        [523, 659, 784, 1046].forEach((f, i) => this._tone(f, now + i * 0.08, 0.26, 0.065, 'triangle', null, 0.012));
        break;
      case 'drop':
        this._tone(420, now, 0.09, 0.05, 'sine', null, 0.005);
        this._tone(640, now + 0.06, 0.12, 0.04, 'sine', null, 0.005);
        break;
      case 'pick':
        this._tone(520, now, 0.07, 0.04, 'sine', null, 0.005);
        break;
      case 'celebrate':
        [523, 659, 784, 1046, 1318].forEach((f, i) => this._tone(f, now + i * 0.1, 0.32, 0.07, 'triangle', null, 0.015));
        this._noise(now + 0.5, 0.3, 0.016, 2600);
        break;
      case 'hint':
        this._tone(660, now, 0.1, 0.045, 'sine', null, 0.005);
        this._tone(990, now + 0.08, 0.16, 0.04, 'sine', null, 0.005);
        break;
      case 'button':
        this._tone(620, now, 0.075, 0.035, 'sine', null, 0.005);
        this._tone(930, now + 0.045, 0.09, 0.028, 'sine', null, 0.005);
        break;
      case 'start':
        [523, 659, 880].forEach((f, i) => this._tone(f, now + i * 0.08, 0.22, 0.055, 'sine', null, 0.01));
        break;
      default:
        this._tone(660, now, 0.08, 0.03, 'sine', null, 0.005);
    }
  }

  destroy() {
    this.stopMusic();
    document.removeEventListener('visibilitychange', this._onVisibility);
    if (this.ctx) this.ctx.close().catch(() => {});
  }
}