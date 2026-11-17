/**
 * Audio: gentle synthesised music and sound effects.
 *
 * Everything is generated with the WebAudio API - there are no audio files to
 * download. The AudioContext is only created after a real user gesture, as
 * required by mobile browsers.
 */

const SFX = {
  click: { notes: [[660, 0, 0.07, 0.16]], type: 'triangle' },
  back: { notes: [[520, 0, 0.07, 0.12]], type: 'sine' },
  collect: { notes: [[880, 0, 0.1, 0.2], [1320, 0.07, 0.12, 0.16]], type: 'triangle' },
  bump: { notes: [[150, 0, 0.12, 0.5], [96, 0.03, 0.14, 0.35]], type: 'sine' },
  checkpoint: { notes: [[660, 0, 0.1, 0.18], [990, 0.09, 0.16, 0.16]], type: 'sine' },
  surprise: { notes: [[520, 0, 0.09, 0.16], [780, 0.08, 0.1, 0.16], [1170, 0.17, 0.18, 0.14]], type: 'triangle' },
  goal: { notes: [[523, 0, 0.16, 0.2], [659, 0.12, 0.16, 0.2], [784, 0.24, 0.18, 0.2], [1046, 0.36, 0.4, 0.22]], type: 'triangle' },
  celebrate: {
    notes: [[523, 0, 0.14, 0.2], [659, 0.12, 0.14, 0.2], [784, 0.24, 0.14, 0.2], [1046, 0.36, 0.22, 0.22], [1318, 0.6, 0.5, 0.2]],
    type: 'triangle',
  },
  sticker: { notes: [[1046, 0, 0.1, 0.16], [1318, 0.08, 0.1, 0.16], [1568, 0.16, 0.3, 0.16]], type: 'sine' },
  whoosh: { notes: [[300, 0, 0.2, 0.3], [220, 0.06, 0.24, 0.2]], type: 'sawtooth' },
};

const MUSIC = {
  garden: {
    bpm: 92,
    melody: [0, 2, 4, 2, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0, -1],
    bass: [0, 3, 4, 2],
    wave: 'triangle',
  },
  chase: {
    bpm: 108,
    melody: [0, 4, 2, 4, 5, 7, 5, 4, 2, 4, 7, 9, 7, 5, 4, 2],
    bass: [0, 2, 4, 5],
    wave: 'triangle',
  },
  treasure: {
    bpm: 82,
    melody: [0, 2, 4, 2, 3, 4, 6, 4, 0, 2, 4, 7, 6, 4, 2, -1],
    bass: [0, 3, 2, 4],
    wave: 'sine',
  },
};

function midiToFreq(root, scale, degree) {
  const len = scale.length;
  const idx = ((degree % len) + len) % len;
  const octave = Math.floor(degree / len);
  const semitone = scale[idx] + octave * 12;
  return root * Math.pow(2, semitone / 12);
}

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.delay = null;
    this.enabled = { sound: true, music: true, sfx: true };
    this.volume = 0.7;
    this.musicTimer = null;
    this.nextNoteTime = 0;
    this.step = 0;
    this.currentWorld = null;
    this.musicPlaying = false;
    this.noiseBuffer = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return this.ctx;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      this.ctx = new Ctx();
    } catch (err) {
      this.ctx = null;
      return null;
    }
    const ctx = this.ctx;

    this.master = ctx.createGain();
    this.master.gain.value = this.volume * 0.9;
    this.master.connect(ctx.destination);

    // A little echo makes the soft synth sounds feel warm and spacious.
    this.delay = ctx.createDelay(0.6);
    this.delay.delayTime.value = 0.26;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.22;
    const wet = ctx.createGain();
    wet.gain.value = 0.18;
    this.delay.connect(feedback);
    feedback.connect(this.delay);
    this.delay.connect(wet);
    wet.connect(this.master);

    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = this.enabled.music ? 0.2 : 0;
    this.musicGain.connect(this.master);
    this.musicGain.connect(this.delay);

    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = this.enabled.sfx ? 0.9 : 0;
    this.sfxGain.connect(this.master);

    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  setEnabled(settings) {
    if (settings.sound !== undefined) this.enabled.sound = !!settings.sound;
    if (settings.music !== undefined) this.enabled.music = !!settings.music;
    if (settings.sfx !== undefined) this.enabled.sfx = !!settings.sfx;
    if (settings.volume !== undefined) {
      this.volume = Math.max(0, Math.min(1, settings.volume));
    }
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const masterLevel = this.enabled.sound ? this.volume * 0.9 : 0;
    this.master.gain.setTargetAtTime(masterLevel, now, 0.05);
    this.musicGain.gain.setTargetAtTime(this.enabled.music ? 0.2 : 0, now, 0.08);
    this.sfxGain.gain.setTargetAtTime(this.enabled.sfx ? 0.9 : 0, now, 0.05);
  }

  _tone(freq, start, dur, gain, type = 'triangle', dest = null) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(env);
    env.connect(dest || this.sfxGain);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  play(name) {
    if (!this.enabled.sound || !this.enabled.sfx) return;
    const ctx = this.init();
    if (!ctx) return;
    const def = SFX[name];
    if (!def) return;
    const now = ctx.currentTime + 0.001;
    for (const [freq, delay, dur, gain] of def.notes) {
      this._tone(freq, now + delay, dur, gain * 0.5, def.type);
      // Soft octave shimmer for sparkle.
      if (gain > 0.16) this._tone(freq * 2, now + delay, dur * 0.7, gain * 0.12, 'sine');
    }
  }

  /* ------------------------------- music -------------------------------- */

  setWorld(worldId) {
    if (!worldId || !WORLD_MUSIC[worldId]) return;
    this.currentWorld = worldId;
    if (this.musicPlaying) this._restartLoop();
  }

  startMusic(worldId) {
    if (worldId) this.currentWorld = worldId;
    if (this.musicPlaying) return;
    const ctx = this.init();
    if (!ctx) return;
    this.musicPlaying = true;
    this._restartLoop();
  }

  _restartLoop() {
    if (!this.ctx) return;
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.musicTimer = window.setInterval(() => this._schedule(), 90);
    this._schedule();
  }

  _schedule() {
    if (!this.ctx || !this.musicPlaying || !this.currentWorld) return;
    const conf = MUSIC[this.currentWorld] || MUSIC.garden;
    const world = WORLD_MUSIC[this.currentWorld] || WORLD_MUSIC.garden;
    const stepDur = 60 / conf.bpm / 2; // eighth notes
    const ctx = this.ctx;

    while (this.nextNoteTime < ctx.currentTime + 0.28) {
      const step = this.step % conf.melody.length;
      const degree = conf.melody[step];
      const start = this.nextNoteTime;

      if (degree >= 0) {
        const freq = midiToFreq(world.root, world.scale, degree);
        this._tone(freq, start, stepDur * 1.7, 0.1, conf.wave, this.musicGain);
        if (step % 4 === 0) {
          this._tone(freq * 2, start, stepDur * 1.1, 0.022, 'sine', this.musicGain);
        }
      }

      // Warm bass every four steps.
      if (step % 4 === 0) {
        const bassDegree = conf.bass[Math.floor(step / 4) % conf.bass.length];
        const bassFreq = midiToFreq(world.root / 2, world.scale, bassDegree);
        this._tone(bassFreq, start, stepDur * 3.4, 0.07, 'sine', this.musicGain);
      }

      this.step += 1;
      this.nextNoteTime += stepDur;
    }
  }

  pauseMusic() {
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
  }

  resumeMusic() {
    if (!this.ctx) return;
    this.musicGain.gain.setTargetAtTime(this.enabled.music ? 0.2 : 0, this.ctx.currentTime, 0.12);
    if (this.musicPlaying && !this.musicTimer) this._restartLoop();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

// Music scales live here to avoid a circular import with config.
const WORLD_MUSIC = {
  garden: { root: 261.63, scale: [0, 2, 4, 7, 9, 12, 14, 16] },
  chase: { root: 293.66, scale: [0, 2, 4, 7, 9, 12, 14, 16] },
  treasure: { root: 220.0, scale: [0, 2, 3, 7, 9, 12, 14, 15] },
};

export const audio = new AudioEngine();