/* =========================================================
   audio.js — synthesised music, sound effects and voice
   (no external audio files, works offline)
   ========================================================= */
(function () {
  'use strict';

  const AudioEngine = {
    ctx: null,
    musicOn: true,
    sfxOn: true,
    started: false,
    master: null,
    musicBus: null,
    sfxBus: null,
    _timer: null,
    _step: 0,
    _nextTime: 0,
    _noiseBuf: null,
    _brushNode: null,
    _voice: null
  };

  const A4 = 440;
  const midi = n => A4 * Math.pow(2, (n - 69) / 12);

  /* ---------------------------------------------------------
     setup
     --------------------------------------------------------- */
  function ensureContext() {
    if (AudioEngine.ctx) return AudioEngine.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;

    const ctx = new AC();
    AudioEngine.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    const musicBus = ctx.createGain();
    musicBus.gain.value = AudioEngine.musicOn ? 0.16 : 0;
    musicBus.connect(master);

    const sfxBus = ctx.createGain();
    sfxBus.gain.value = AudioEngine.sfxOn ? 0.5 : 0;
    sfxBus.connect(master);

    // gentle master limiter-ish
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 22;
    comp.ratio.value = 6;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;
    master.disconnect();
    master.connect(comp);
    comp.connect(ctx.destination);

    AudioEngine.master = master;
    AudioEngine.musicBus = musicBus;
    AudioEngine.sfxBus = sfxBus;

    // reusable noise buffer
    const len = Math.floor(ctx.sampleRate * 1.2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    AudioEngine._noiseBuf = buf;

    return ctx;
  }

  function unlock() {
    const ctx = ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!AudioEngine.started) {
      AudioEngine.started = true;
      startMusic();
    }
    primeVoice();
  }

  /* ---------------------------------------------------------
     music
     --------------------------------------------------------- */
  const MELODY = [
    72, 76, 79, 76, 74, 72, 69, 72,
    74, 76, 79, 81, 79, 76, 74, 72
  ];
  const BASS = [48, 45, 41, 43];

  function scheduleMusic() {
    const ctx = AudioEngine.ctx;
    if (!ctx) return;
    const spb = 60 / 88;              // seconds per beat
    const stepDur = spb / 2;          // eighth notes

    while (AudioEngine._nextTime < ctx.currentTime + 0.6) {
      const s = AudioEngine._step;
      const t = AudioEngine._nextTime;

      // melody (skip some steps for breathing room)
      const note = MELODY[s % MELODY.length];
      if (s % 8 !== 3 && s % 8 !== 6) {
        playMusicNote(midi(note), t, stepDur * 1.9, 0.24, 'triangle');
        // sparkle octave above, quieter
        if (s % 8 === 0 || s % 8 === 4) {
          playMusicNote(midi(note + 12), t, stepDur * 1.1, 0.07, 'sine');
        }
      }

      // bass on every bar
      if (s % 8 === 0) {
        const root = BASS[Math.floor(s / 8) % BASS.length];
        playMusicNote(midi(root), t, stepDur * 6.4, 0.20, 'sine');
        playMusicNote(midi(root + 7), t, stepDur * 5.6, 0.10, 'sine');
      }

      AudioEngine._nextTime += stepDur;
      AudioEngine._step = (s + 1) % 64;
    }
  }

  function playMusicNote(freq, when, dur, vol, type) {
    const ctx = AudioEngine.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 2600;
    o.type = type;
    o.frequency.value = freq;

    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    o.connect(f);
    f.connect(g);
    g.connect(AudioEngine.musicBus);
    o.start(when);
    o.stop(when + dur + 0.1);
    o.onended = () => { try { o.disconnect(); g.disconnect(); f.disconnect(); } catch (e) {} };
  }

  function startMusic() {
    const ctx = ensureContext();
    if (!ctx) return;
    AudioEngine._nextTime = ctx.currentTime + 0.12;
    AudioEngine._step = 0;
    if (AudioEngine._timer) clearInterval(AudioEngine._timer);
    AudioEngine._timer = setInterval(scheduleMusic, 120);
    scheduleMusic();
  }

  function stopMusic() {
    if (AudioEngine._timer) { clearInterval(AudioEngine._timer); AudioEngine._timer = null; }
  }

  /* ---------------------------------------------------------
     sfx primitives
     --------------------------------------------------------- */
  function tone(freq, dur, opts) {
    const ctx = ensureContext();
    if (!ctx || !AudioEngine.sfxOn) return;
    opts = opts || {};
    const t0 = ctx.currentTime + (opts.delay || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = opts.type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);

    const vol = opts.vol == null ? 0.22 : opts.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    o.connect(g);
    g.connect(AudioEngine.sfxBus);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
    o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (e) {} };
  }

  function noise(dur, opts) {
    const ctx = ensureContext();
    if (!ctx || !AudioEngine.sfxOn) return;
    opts = opts || {};
    const t0 = ctx.currentTime + (opts.delay || 0);
    const src = ctx.createBufferSource();
    src.buffer = AudioEngine._noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = opts.filter || 'bandpass';
    f.frequency.setValueAtTime(opts.freq || 1200, t0);
    if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
    f.Q.value = opts.q == null ? 1.2 : opts.q;
    const g = ctx.createGain();
    const vol = opts.vol == null ? 0.16 : opts.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(AudioEngine.sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
    src.onended = () => { try { src.disconnect(); f.disconnect(); g.disconnect(); } catch (e) {} };
  }

  /* ---------------------------------------------------------
     named effects
     --------------------------------------------------------- */
  const SFX = {
    sparkle() {
      const base = 1500 + Math.random() * 900;
      tone(base, 0.16, { type: 'sine', vol: 0.12 });
      tone(base * 1.5, 0.2, { type: 'sine', vol: 0.08, delay: 0.06 });
      tone(base * 2, 0.22, { type: 'sine', vol: 0.05, delay: 0.12 });
    },

    pop() {
      tone(420, 0.13, { type: 'sine', to: 880, vol: 0.2 });
    },

    tap() {
      tone(760, 0.09, { type: 'triangle', vol: 0.14 });
    },

    chime() {
      tone(midi(84), 0.28, { type: 'triangle', vol: 0.16 });
      tone(midi(88), 0.36, { type: 'triangle', vol: 0.13, delay: 0.08 });
      tone(midi(91), 0.5, { type: 'sine', vol: 0.1, delay: 0.16 });
    },

    eat() {
      noise(0.13, { freq: 900, to: 380, q: 0.9, vol: 0.2 });
      tone(180, 0.12, { type: 'sine', to: 110, vol: 0.16, delay: 0.02 });
    },

    yum() {
      tone(midi(79), 0.16, { type: 'triangle', vol: 0.16 });
      tone(midi(84), 0.22, { type: 'triangle', vol: 0.13, delay: 0.09 });
    },

    neigh() {
      const ctx = ensureContext();
      if (!ctx || !AudioEngine.sfxOn) return;
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const vib = ctx.createOscillator();
      const vibGain = ctx.createGain();
      const f = ctx.createBiquadFilter();

      o.type = 'sawtooth';
      o.frequency.setValueAtTime(420, t0);
      o.frequency.exponentialRampToValueAtTime(900, t0 + 0.14);
      o.frequency.exponentialRampToValueAtTime(560, t0 + 0.34);
      o.frequency.exponentialRampToValueAtTime(300, t0 + 0.6);

      vib.frequency.value = 22;
      vibGain.gain.value = 38;
      vib.connect(vibGain);
      vibGain.connect(o.frequency);

      f.type = 'lowpass';
      f.frequency.value = 1800;
      f.Q.value = 3;

      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.05);
      g.gain.setValueAtTime(0.14, t0 + 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.66);

      o.connect(f); f.connect(g); g.connect(AudioEngine.sfxBus);
      o.start(t0); vib.start(t0);
      o.stop(t0 + 0.72); vib.stop(t0 + 0.72);
      o.onended = () => { try { o.disconnect(); g.disconnect(); f.disconnect(); vibGain.disconnect(); vib.disconnect(); } catch (e) {} };
    },

    success() {
      [72, 76, 79, 84, 88].forEach((n, i) => {
        tone(midi(n), 0.34, { type: 'triangle', vol: 0.15, delay: i * 0.085 });
      });
      noise(0.5, { freq: 3000, to: 6000, q: 0.7, vol: 0.05, delay: 0.1 });
    },

    fanfare() {
      [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => {
        tone(midi(n), 0.4, { type: 'triangle', vol: 0.15, delay: i * 0.11 });
      });
      tone(midi(48), 1.2, { type: 'sine', vol: 0.14, delay: 0.1 });
    },

    splash() {
      noise(0.35, { freq: 2400, to: 700, q: 0.6, vol: 0.13 });
    },

    whoosh() {
      noise(0.3, { freq: 500, to: 2200, q: 1.4, vol: 0.1 });
    },

    boing() {
      tone(300, 0.22, { type: 'sine', to: 700, vol: 0.16 });
    }
  };

  function play(name) {
    if (!AudioEngine.sfxOn) return;
    const fn = SFX[name];
    if (fn) { try { fn(); } catch (e) { /* ignore */ } }
  }

  /* continuous brushing sound */
  function startBrush() {
    const ctx = ensureContext();
    if (!ctx || !AudioEngine.sfxOn || AudioEngine._brushNode) return;
    const src = ctx.createBufferSource();
    src.buffer = AudioEngine._noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 2200;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    src.connect(f); f.connect(g); g.connect(AudioEngine.sfxBus);
    src.start();
    g.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.08);
    AudioEngine._brushNode = { src, g, f };
  }

  function stopBrush() {
    const n = AudioEngine._brushNode;
    if (!n) return;
    AudioEngine._brushNode = null;
    const ctx = AudioEngine.ctx;
    try {
      n.g.gain.cancelScheduledValues(ctx.currentTime);
      n.g.gain.setValueAtTime(Math.max(n.g.gain.value, 0.0001), ctx.currentTime);
      n.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      n.src.stop(ctx.currentTime + 0.16);
    } catch (e) {}
  }

  /* ---------------------------------------------------------
     voice
     --------------------------------------------------------- */
  function primeVoice() {
    if (!('speechSynthesis' in window)) return;
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      const prefer = [
        /Samantha/i, /Karen/i, /Moira/i, /Google UK English Female/i,
        /Microsoft .*(Aria|Jenny|Zira|Sonia)/i, /Female/i
      ];
      let v = null;
      for (const rx of prefer) {
        v = voices.find(x => rx.test(x.name) && /^en/i.test(x.lang));
        if (v) break;
      }
      if (!v) v = voices.find(x => /^en(-|_)?/i.test(x.lang)) || voices[0];
      AudioEngine._voice = v;
    };
    load();
    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', load);
    } else {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  function say(text) {
    if (!AudioEngine.sfxOn) return;
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (AudioEngine._voice) u.voice = AudioEngine._voice;
      u.rate = 0.94;
      u.pitch = 1.35;
      u.volume = 1;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ---------------------------------------------------------
     toggles
     --------------------------------------------------------- */
  function setMusic(on) {
    AudioEngine.musicOn = !!on;
    if (AudioEngine.musicBus && AudioEngine.ctx) {
      AudioEngine.musicBus.gain.cancelScheduledValues(AudioEngine.ctx.currentTime);
      AudioEngine.musicBus.gain.linearRampToValueAtTime(on ? 0.16 : 0, AudioEngine.ctx.currentTime + 0.35);
    }
    if (!on) {
      stopMusic();
    } else if (AudioEngine.ctx && AudioEngine.started) {
      startMusic();
    }
  }

  function setSfx(on) {
    AudioEngine.sfxOn = !!on;
    if (AudioEngine.sfxBus && AudioEngine.ctx) {
      AudioEngine.sfxBus.gain.linearRampToValueAtTime(on ? 0.5 : 0, AudioEngine.ctx.currentTime + 0.2);
    }
    if (!on) { stopBrush(); try { window.speechSynthesis.cancel(); } catch (e) {} }
  }

  window.Sound = {
    unlock,
    play,
    say,
    setMusic,
    setSfx,
    startBrush,
    stopBrush,
    get musicOn() { return AudioEngine.musicOn; },
    get sfxOn() { return AudioEngine.sfxOn; }
  };
})();