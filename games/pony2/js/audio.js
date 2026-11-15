/* Enchanted Pony Palace - audio: every sound is synthesized with WebAudio (no files needed) */
(function () {
  'use strict';
  var NS = (window.PPA = window.PPA || {});

  var ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  var A = NS.audio = { musicOn: true, sfxOn: true, ready: false };

  var N = { // note frequencies
    G3: 196, A3: 220, B3: 246.9, C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9,
    C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568
  };

  A.init = function () {
    if (ctx) { A.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
      var len = ctx.sampleRate * 1.5;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      // iOS unlock: play one silent sample
      var b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource();
      src.buffer = b; src.connect(ctx.destination); src.start(0);
      A.ready = true;
    } catch (e) { ctx = null; }
    A.resume();
    if (A.musicOn) A.startMusic();
  };
  A.resume = function () { if (ctx && ctx.state !== 'running') { try { ctx.resume(); } catch (e) {} } };

  /* ---------- building blocks ---------- */
  function tone(freq, t0, dur, type, vol, dest, opt) {
    opt = opt || {};
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (opt.to) o.frequency.exponentialRampToValueAtTime(opt.to, t0 + dur);
    var a = opt.attack || 0.008;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.05);
    return o;
  }
  function noise(t0, dur, type, f0, f1, q, vol) {
    var s = ctx.createBufferSource(); s.buffer = noiseBuf;
    var f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t0);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.02, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(sfxBus);
    s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
  }
  function ok() { return ctx && A.sfxOn && ctx.state !== 'closed'; }
  function bell(f, t, vol, dur) {
    tone(f, t, dur || 0.7, 'sine', vol);
    tone(f * 2.01, t, (dur || 0.7) * 0.5, 'sine', vol * 0.35);
  }

  /* ---------- sound effects ---------- */
  var PENTA = [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6, N.E6, N.G6];
  A.sparkle = function () {
    if (!ok()) return; var t = ctx.currentTime;
    for (var i = 0; i < 4; i++) bell(PENTA[Math.floor(Math.random() * PENTA.length)], t + i * 0.055, 0.1, 0.5);
  };
  A.tick = function () { // tiny sparkle for rapid actions
    if (!ok()) return; bell(PENTA[2 + Math.floor(Math.random() * 6)], ctx.currentTime, 0.07, 0.35);
  };
  A.star = function (i) {
    if (!ok()) return; var t = ctx.currentTime, f = [N.C5, N.E5, N.G5, N.C6][Math.min(3, i || 0)];
    bell(f, t, 0.16, 0.9); bell(f * 1.5, t + 0.07, 0.08, 0.7);
  };
  A.pop = function () {
    if (!ok()) return; var t = ctx.currentTime;
    tone(500 + Math.random() * 300, t, 0.09, 'sine', 0.16, null, { to: 1300 });
  };
  A.boop = function () {
    if (!ok()) return; var t = ctx.currentTime;
    tone(420, t, 0.12, 'sine', 0.16, null, { to: 620 });
  };
  A.munch = function () {
    if (!ok()) return; var t = ctx.currentTime;
    for (var i = 0; i < 3; i++) {
      noise(t + i * 0.2, 0.09, 'bandpass', 1100 - i * 100, 500, 2, 0.5);
      tone(170, t + i * 0.2, 0.09, 'sine', 0.22, null, { to: 90 });
    }
  };
  A.brush = function () {
    if (!ok()) return; var t = ctx.currentTime;
    noise(t, 0.16, 'bandpass', 2200, 4600, 1.4, 0.16);
  };
  A.splash = function () {
    if (!ok()) return; var t = ctx.currentTime;
    noise(t, 0.4, 'lowpass', 2400, 600, 0.8, 0.28);
    for (var i = 0; i < 3; i++) tone(500 + Math.random() * 500, t + 0.05 + i * 0.07, 0.07, 'sine', 0.08, null, { to: 1100 });
  };
  A.scrub = function () {
    if (!ok()) return; var t = ctx.currentTime;
    noise(t, 0.12, 'bandpass', 1400, 2400, 1.2, 0.14);
    tone(700 + Math.random() * 500, t, 0.07, 'sine', 0.05, null, { to: 1400 });
  };
  A.whoosh = function () {
    if (!ok()) return; var t = ctx.currentTime;
    noise(t, 0.9, 'bandpass', 300, 5000, 1.2, 0.3);
    [N.C5, N.E5, N.G5, N.C6, N.E6, N.G6].forEach(function (f, i) { bell(f, t + 0.15 + i * 0.09, 0.1, 0.8); });
  };
  A.fanfare = function () {
    if (!ok()) return; var t = ctx.currentTime;
    [[N.C5, 0], [N.E5, 0.14], [N.G5, 0.28], [N.C6, 0.42]].forEach(function (p) {
      tone(p[0], t + p[1], 0.5, 'triangle', 0.16); bell(p[0] * 2, t + p[1], 0.07, 0.8);
    });
    tone(N.C5, t + 0.56, 1.1, 'triangle', 0.14); tone(N.E5, t + 0.56, 1.1, 'triangle', 0.12); tone(N.G5, t + 0.56, 1.1, 'triangle', 0.12);
  };
  A.firework = function () {
    if (!ok()) return; var t = ctx.currentTime;
    tone(300, t, 0.35, 'sine', 0.12, null, { to: 1100 });
    noise(t + 0.33, 0.35, 'lowpass', 900, 200, 0.7, 0.35);
    for (var i = 0; i < 5; i++) bell(PENTA[Math.floor(Math.random() * PENTA.length)], t + 0.35 + i * 0.05, 0.06, 0.5);
  };
  // happy pony sound: whinny / nicker, pitch varies per character
  A.neigh = function (p) {
    if (!ok()) return; p = p || 1; var t = ctx.currentTime, dur = 0.75;
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    var f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sawtooth'; o2.type = 'square';
    var f = function (x) { return x * p; };
    [o, o2].forEach(function (x, i) {
      x.frequency.setValueAtTime(f(380) * (i ? 0.5 : 1), t);
      x.frequency.exponentialRampToValueAtTime(f(820) * (i ? 0.5 : 1), t + 0.16);
      x.frequency.exponentialRampToValueAtTime(f(640) * (i ? 0.5 : 1), t + 0.35);
      x.frequency.exponentialRampToValueAtTime(f(300) * (i ? 0.5 : 1), t + dur);
    });
    lfo.frequency.value = 26; lg.gain.value = 22 * p; lfo.connect(lg); lg.connect(o.frequency);
    f1.type = 'bandpass'; f1.frequency.value = 900; f1.Q.value = 2.5;
    f2.type = 'bandpass'; f2.frequency.setValueAtTime(1500, t); f2.frequency.linearRampToValueAtTime(2300, t + 0.2); f2.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.05);
    g.gain.setValueAtTime(0.28, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f1); o2.connect(f1); f1.connect(g); o.connect(f2); f2.connect(g); g.connect(sfxBus);
    o.start(t); o2.start(t); lfo.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  };
  A.giggle = function (p) {
    if (!ok()) return; p = p || 1; var t = ctx.currentTime;
    for (var i = 0; i < 4; i++) tone(520 * p + (i % 2) * 110, t + i * 0.09, 0.08, 'triangle', 0.14, null, { to: 700 * p });
  };

  /* ---------- gentle music box lullaby ---------- */
  var CH = [[N.C4, N.E4, N.G4, N.C5], [N.A3, N.C4, N.E4, N.A4], [N.F4 / 2, N.A3, N.C4, N.F4], [N.G3, N.B3, N.D4, N.G4]];
  var ARP = [0, 1, 2, 1, 3, 2, 1, 2];
  var MEL = [
    [N.E5, N.G5, N.E5, N.D5], [N.C5, N.E5, N.D5, N.C5], [N.A4, N.C5, N.D5, N.C5], [N.B4, N.D5, N.G5, N.D5],
    [N.G5, N.E5, N.C5, N.E5], [N.E5, N.D5, N.C5, N.A4], [N.C5, N.F5, N.E5, N.C5], [N.D5, N.G4, N.B4, N.D5]
  ];
  var music = { timer: null, step: 0, next: 0 };
  function pluck(f, t, vol, dur) {
    tone(f, t, dur, 'sine', vol, musicBus, { attack: 0.006 });
    tone(f * 2, t, dur * 0.4, 'sine', vol * 0.3, musicBus, { attack: 0.006 });
  }
  function schedule() {
    if (!ctx || !A.musicOn) return;
    var eighth = 60 / 92 / 2;
    while (music.next < ctx.currentTime + 0.4) {
      var bar = Math.floor(music.step / 8) % 8, inBar = music.step % 8;
      var chord = CH[bar % 4];
      pluck(chord[ARP[inBar]], music.next, 0.07, 0.7);
      if (inBar % 2 === 0) pluck(MEL[bar][inBar / 2], music.next, 0.1, 1.1);
      music.next += eighth; music.step++;
    }
  }
  A.startMusic = function () {
    if (!ctx || music.timer) return;
    music.next = ctx.currentTime + 0.1;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.2);
    music.timer = setInterval(schedule, 120);
    schedule();
  };
  A.stopMusic = function () {
    if (music.timer) { clearInterval(music.timer); music.timer = null; }
  };
  A.setMusic = function (on) {
    A.musicOn = on;
    if (on) A.startMusic(); else A.stopMusic();
  };
  A.setSfx = function (on) {
    A.sfxOn = on;
    if (!on && window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  };
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) { try { ctx.suspend(); } catch (e) {} } else { A.resume(); }
  });

  /* ---------- friendly spoken encouragement ---------- */
  var voice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    var vs = window.speechSynthesis.getVoices() || [];
    var prefs = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Google US English', 'Zira', 'Aria', 'Jenny'];
    for (var i = 0; i < prefs.length && !voice; i++) {
      for (var j = 0; j < vs.length; j++) if (vs[j].name.indexOf(prefs[i]) > -1 && /^en/i.test(vs[j].lang)) { voice = vs[j]; break; }
    }
    if (!voice) for (var k = 0; k < vs.length; k++) if (/^en/i.test(vs[k].lang)) { voice = vs[k]; break; }
  }
  if (window.speechSynthesis) {
    pickVoice();
    try { window.speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}
  }
  A.speak = function (text, pitch) {
    if (!A.sfxOn || !window.speechSynthesis || !ctx) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      if (!voice) pickVoice();
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || 'en-US';
      u.pitch = Math.min(2, 1.35 * (pitch || 1)); u.rate = 0.92; u.volume = 1;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  };
})();
