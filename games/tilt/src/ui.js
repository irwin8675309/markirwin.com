/**
 * Screens, menus, HUD and settings.
 *
 * The UI is plain DOM on top of the canvas. Everything is a large touch
 * target, nothing depends on hover or a keyboard.
 */

import {
  WORLDS,
  DIFFICULTIES,
  STICKERS,
  WORLD_ORDER,
  CHARACTERS,
} from './config.js';
import { itemUrl, petUrl } from './art.js';
import {
  save,
  updateSettings,
  setSelection,
  recordCompletion,
  resetProgress,
  storageStatusText,
  currentLevelIndex,
  stickerCount,
  flushSave,
} from './storage.js';
import { MOTION_STATUS } from './motion.js';
import { audio } from './audio.js';

const $ = (id) => document.getElementById(id);

const COMPLETE_TITLES = ['You did it!', 'Great rolling!', 'Wonderful adventure!', 'Fantastic job!', 'Hooray!'];
const COMPLETE_SUBS = [
  'The marble made it all the way!',
  'What a lovely adventure.',
  'Your pet is doing a happy dance!',
  'So much exploring!',
  'You rolled like a superstar!',
];

function randomOf(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function activate(names) {
  const map = {
    loading: 'screen-loading',
    home: 'screen-home',
    game: 'screen-game',
    pause: 'screen-pause',
    calibrate: 'screen-calibrate',
    complete: 'screen-complete',
    stickers: 'screen-stickers',
    settings: 'screen-settings',
    confirm: 'screen-confirm',
  };
  for (const [key, id] of Object.entries(map)) {
    const el = $(id);
    if (!el) continue;
    el.classList.toggle('is-active', names.includes(key));
  }
}

export class UI {
  constructor({ game, motion, renderer }) {
    this.game = game;
    this.motion = motion;
    this.renderer = renderer;

    this.calMode = 'play';
    this.motionGranted = false;
    this.bubbleRaf = null;
    this.toastTimer = null;
    this.confettiTimer = null;
    this.current = null;
    this.lastSummary = null;
    this.bound = false;

    this.onResize = this.onResize.bind(this);
    this.onOrientation = this.onOrientation.bind(this);
  }

  /* --------------------------------- init -------------------------------- */

  init() {
    if (this.bound) return;
    this.bound = true;

    this.buildWorldCards();
    this.setHomePets();
    this.bindHome();
    this.bindHud();
    this.bindPause();
    this.bindComplete();
    this.bindStickers();
    this.bindSettings();
    this.bindCalibrate();
    this.bindTouch();
    this.bindGlobal();

    this.applySettings();
    this.applySoundUi();
    this.refreshStickerBook();
    this.goHome();
  }

  /* ------------------------------- navigation ----------------------------- */

  goHome() {
    this.stopBubble();
    this.current = null;
    activate(['home']);
    this.refreshHome();
    this.game.stop();
    audio.setWorld(save.data.selectedWorld);
  }

  refreshHome() {
    const world = save.data.selectedWorld;
    const diff = save.data.selectedDifficulty;
    document.querySelectorAll('.world-card').forEach((card) => {
      const on = card.dataset.world === world;
      card.classList.toggle('is-selected', on);
      card.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('#difficulty-row .diff-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.diff === diff);
    });
    const touch = this.effectiveControl() === 'touch';
    const hint = $('home-hint');
    if (hint) hint.textContent = touch ? 'Use the big arrow buttons to roll!' : 'Pick a pet, then tilt the iPad!';
  }

  buildWorldCards() {
    const wrap = $('world-cards');
    if (!wrap) return;
    wrap.innerHTML = WORLD_ORDER.map((id) => {
      const w = WORLDS[id];
      const pet = CHARACTERS[w.pet];
      return `
        <button class="world-card" data-world="${id}" style="--wc:${w.accent};--wc-dark:${w.accentDark};--wc-soft:${w.cardSoft}" aria-label="${w.name}, with ${pet.name}. ${w.tagline}" title="${w.tagline}">
          <span class="wc-art"><img src="${petUrl(pet.id, 'idle')}" alt="" /></span>
          <span class="wc-text">
            <span class="wc-name">${w.name}</span>
            <span class="wc-sub">${pet.name} · ${w.cardTag}</span>
          </span>
          <span class="wc-check" aria-hidden="true">✓</span>
        </button>`;
    }).join('');

    wrap.querySelectorAll('.world-card').forEach((card) => {
      card.addEventListener('click', () => {
        audio.init();
        audio.play('click');
        setSelection(card.dataset.world, save.data.selectedDifficulty);
        this.refreshHome();
        audio.setWorld(card.dataset.world);
      });
    });
  }

  setHomePets() {
    const g = $('home-ghosty');
    const s = $('home-spin');
    const o = $('home-oakley');
    if (g) g.src = petUrl('ghosty', 'idle');
    if (s) s.src = petUrl('spin', 'idle');
    if (o) o.src = petUrl('oakley', 'idle');
  }

  /* --------------------------------- home -------------------------------- */

  bindHome() {
    const play = $('btn-play');
    if (play) {
      play.addEventListener('click', () => {
        audio.init();
        audio.play('click');
        this.beginCalibration('play');
      });
    }

    document.querySelectorAll('#difficulty-row .diff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.init();
        audio.play('click');
        setSelection(save.data.selectedWorld, btn.dataset.diff);
        this.refreshHome();
        const d = DIFFICULTIES[btn.dataset.diff];
        if (d) this.toast(`${d.name} — ${d.blurb}`);
      });
    });

    $('btn-stickers')?.addEventListener('click', () => this.openStickers());
    $('btn-settings')?.addEventListener('click', () => this.openSettings());
    $('btn-sound')?.addEventListener('click', () => this.toggleSound());
  }

  /* ---------------------------------- HUD -------------------------------- */

  bindHud() {
    $('btn-pause')?.addEventListener('click', () => this.pauseGame());
    $('btn-reset')?.addEventListener('click', () => {
      this.game.resetLevel();
      this.toast('Back to the start!');
    });
    $('btn-recal')?.addEventListener('click', () => {
      this.game.pause(true);
      this.beginCalibration('recal');
    });
    $('btn-hint')?.addEventListener('click', () => this.game.showWay());
    $('btn-game-sound')?.addEventListener('click', () => this.toggleSound());
  }

  updateHud({ collected, total }) {
    const world = this.current ? WORLDS[this.current.world] : WORLDS[save.data.selectedWorld];
    const num = $('hud-count-num');
    const tot = $('hud-count-total');
    if (num) num.textContent = String(collected);
    if (tot) tot.textContent = total ? ` / ${total}` : '';
    const icon = $('hud-count-icon');
    if (icon && world) icon.src = itemUrl(world.counterIcon);
  }

  onLevelStart({ level }) {
    this.current = { world: level.worldId, difficulty: level.difficultyId, levelIndex: level.index };
    activate(['game']);
    const w = WORLDS[level.worldId];
    const d = DIFFICULTIES[level.difficultyId];
    if ($('hud-world')) $('hud-world').textContent = w.name;
    if ($('hud-diff')) $('hud-diff').textContent = `${d.name} · Level ${level.index + 1}`;
    this.updateHud({ collected: 0, total: level.collectibles.length });
    this.setTouchVisible(this.effectiveControl() === 'touch');
    this.motion.setTouchMode(this.effectiveControl() === 'touch');
  }

  /* -------------------------------- pause -------------------------------- */

  bindPause() {
    $('btn-resume')?.addEventListener('click', () => {
      audio.play('click');
      this.resumeGame();
    });
    $('btn-pause-recal')?.addEventListener('click', () => {
      audio.play('click');
      this.beginCalibration('recal');
    });
    $('btn-pause-restart')?.addEventListener('click', () => {
      audio.play('click');
      this.game.resetLevel();
      this.resumeGame();
    });
    $('btn-pause-home')?.addEventListener('click', () => {
      audio.play('back');
      this.goHome();
    });
  }

  showPause() {
    activate(['game', 'pause']);
    const pet = this.current ? WORLDS[this.current.world].pet : save.data.selectedWorld;
    const img = $('pause-pet');
    if (img) img.src = petUrl(pet, 'idle');
  }

  pauseGame() {
    if (!this.current) return;
    this.game.pause();
    this.showPause();
  }

  resumeGame() {
    activate(['game']);
    this.game.resume();
  }

  /* ------------------------------- complete ------------------------------ */

  bindComplete() {
    $('btn-again')?.addEventListener('click', () => {
      audio.play('click');
      this.playLevel(this.current.world, this.current.difficulty, this.current.levelIndex);
    });
    $('btn-next')?.addEventListener('click', () => {
      audio.play('click');
      this.playLevel(this.current.world, this.current.difficulty, this.current.levelIndex + 1);
    });
    $('btn-complete-home')?.addEventListener('click', () => {
      audio.play('back');
      this.goHome();
    });
  }

  showComplete(summary) {
    this.lastSummary = summary;
    const world = WORLDS[summary.world];
    const pet = world.pet;
    const result = recordCompletion({
      world: summary.world,
      difficulty: summary.difficulty,
      levelIndex: summary.levelIndex,
      collected: summary.collected,
      total: summary.total,
    });

    activate(['game', 'complete']);
    this.setTouchVisible(false);

    const title = summary.world === 'treasure' ? 'You found the treasure!' : randomOf(COMPLETE_TITLES);
    if ($('complete-title')) $('complete-title').textContent = title;
    if ($('complete-sub')) $('complete-sub').textContent = randomOf(COMPLETE_SUBS);
    if ($('cp-leader')) $('cp-leader').src = petUrl(pet, 'celebrate');
    if ($('cp-ghosty')) $('cp-ghosty').src = petUrl('ghosty', 'happy');
    if ($('cp-oakley')) $('cp-oakley').src = petUrl('oakley', 'happy');
    if ($('stat-icon')) $('stat-icon').src = itemUrl(world.counterIcon);
    if ($('stat-num')) $('stat-num').textContent = String(summary.collected);
    if ($('stat-total')) $('stat-total').textContent = summary.total ? ` / ${summary.total}` : '';

    const award = $('sticker-award');
    if (award) {
      const stickerId = result.stickers[0];
      if (stickerId) {
        const sticker = STICKERS.find((s) => s.id === stickerId);
        award.hidden = false;
        if ($('sticker-award-img')) {
          $('sticker-award-img').src = sticker && CHARACTERS[sticker.id]
            ? petUrl(sticker.id, 'idle')
            : itemUrl(sticker ? sticker.art : 'star');
        }
        award.querySelector('span').textContent = `New sticker: ${sticker ? sticker.name : 'Star'}!`;
        window.setTimeout(() => audio.play('sticker'), 900);
      } else {
        award.hidden = true;
      }
    }

    this.refreshStickerBook();
    this.spawnConfetti();
    this.refreshHome();
  }

  spawnConfetti() {
    const layer = $('confetti-layer');
    if (!layer) return;
    layer.innerHTML = '';
    const colors = ['#ff8fb7', '#ffd84d', '#7fd8ff', '#8f7dff', '#70d58c', '#ffb347', '#ff7a59'];
    const count = 60;
    for (let i = 0; i < count; i += 1) {
      const el = document.createElement('span');
      el.className = 'confetti';
      el.style.left = `${Math.random() * 100}%`;
      el.style.background = colors[i % colors.length];
      el.style.animationDuration = `${2.4 + Math.random() * 2.2}s`;
      el.style.animationDelay = `${Math.random() * 1.4}s`;
      el.style.setProperty('--drift', `${(Math.random() - 0.5) * 160}px`);
      if (i % 3 === 0) el.style.borderRadius = '50%';
      layer.appendChild(el);
    }
    if (this.confettiTimer) window.clearTimeout(this.confettiTimer);
    this.confettiTimer = window.setTimeout(() => { layer.innerHTML = ''; }, 6000);
  }

  playLevel(world, difficulty, levelIndex) {
    setSelection(world, difficulty);
    activate(['game']);
    this.game.startLevel({ world, difficulty, levelIndex });
    this.refreshHome();
  }

  /* ------------------------------- stickers ------------------------------ */

  bindStickers() {
    $('btn-stickers-back')?.addEventListener('click', () => {
      audio.play('back');
      activate(['home']);
      this.refreshHome();
    });
  }

  openStickers() {
    audio.play('click');
    this.refreshStickerBook();
    activate(['stickers']);
  }

  refreshStickerBook() {
    const grid = $('sticker-grid');
    if (!grid) return;
    const owned = save.data.stickers;
    grid.innerHTML = STICKERS.map((s) => {
      const has = owned.includes(s.id);
      const src = CHARACTERS[s.id] ? petUrl(s.id, 'idle') : itemUrl(s.art);
      return `
        <div class="sticker-cell ${has ? '' : 'is-locked'}" aria-label="${has ? s.name : 'Locked sticker'}">
          <img src="${src}" alt="" />
          <span class="sticker-name">${has ? s.name : '???'}</span>
        </div>`;
    }).join('');
    const count = $('sticker-count');
    if (count) count.textContent = String(stickerCount());
  }

  /* ------------------------------- settings ------------------------------ */

  bindSettings() {
    $('btn-settings-back')?.addEventListener('click', () => {
      audio.play('back');
      activate(['home']);
      this.refreshHome();
    });
    $('btn-settings-done')?.addEventListener('click', () => {
      audio.play('click');
      activate(['home']);
      this.refreshHome();
    });

    document.querySelectorAll('#set-sens [data-sens]').forEach((btn) => {
      btn.addEventListener('click', () => {
        updateSettings({ sensitivity: btn.dataset.sens });
        this.applySettings();
        audio.play('click');
      });
    });

    document.querySelectorAll('#set-control [data-control]').forEach((btn) => {
      btn.addEventListener('click', () => {
        updateSettings({ control: btn.dataset.control });
        this.applySettings();
        this.motion.setTouchMode(btn.dataset.control === 'touch');
        this.refreshHome();
        audio.play('click');
      });
    });

    document.querySelectorAll('#set-speed [data-speed]').forEach((btn) => {
      btn.addEventListener('click', () => {
        updateSettings({ ballSpeed: parseFloat(btn.dataset.speed) });
        this.applySettings();
        audio.play('click');
      });
    });

    document.querySelectorAll('#set-difficulty [data-diff]').forEach((btn) => {
      btn.addEventListener('click', () => {
        updateSettings({ difficulty: btn.dataset.diff });
        setSelection(save.data.selectedWorld, btn.dataset.diff);
        this.applySettings();
        this.refreshHome();
        audio.play('click');
      });
    });

    const dz = $('set-deadzone');
    if (dz) {
      dz.value = String(save.data.settings.deadZone);
      dz.addEventListener('input', () => {
        updateSettings({ deadZone: parseInt(dz.value, 10) || 0 });
        if ($('deadzone-val')) $('deadzone-val').textContent = dz.value;
        this.applySettings();
      });
      dz.addEventListener('change', () => audio.play('click'));
    }

    $('set-flip-x')?.addEventListener('click', () => {
      const next = !save.data.settings.flipX;
      updateSettings({ flipX: next });
      this.applySettings();
      audio.play('click');
    });
    $('set-flip-y')?.addEventListener('click', () => {
      const next = !save.data.settings.flipY;
      updateSettings({ flipY: next });
      this.applySettings();
      audio.play('click');
    });

    $('set-guidance')?.addEventListener('click', () => {
      const next = !save.data.settings.guidance;
      updateSettings({ guidance: next });
      this.applySettings();
      audio.play('click');
    });
    $('set-showway')?.addEventListener('click', () => {
      const next = !save.data.settings.showway;
      updateSettings({ showway: next });
      this.applySettings();
      audio.play('click');
    });

    $('set-music')?.addEventListener('click', () => {
      const next = !save.data.settings.music;
      updateSettings({ music: next });
      this.applySettings();
      audio.play('click');
    });
    $('set-sfx')?.addEventListener('click', () => {
      const next = !save.data.settings.sfx;
      updateSettings({ sfx: next });
      this.applySettings();
      if (next) audio.play('collect');
    });

    const vol = $('set-volume');
    if (vol) {
      vol.value = String(Math.round(save.data.settings.volume * 100));
      vol.addEventListener('input', () => {
        updateSettings({ volume: (parseInt(vol.value, 10) || 0) / 100 });
        if ($('volume-val')) $('volume-val').textContent = vol.value;
        this.applySettings();
      });
    }

    $('btn-tilt-test')?.addEventListener('click', () => {
      audio.play('click');
      this.beginCalibration('test');
    });

    $('btn-reset-progress')?.addEventListener('click', () => {
      audio.play('click');
      activate(['settings', 'confirm']);
    });
    $('btn-confirm-no')?.addEventListener('click', () => {
      audio.play('back');
      activate(['settings']);
    });
    $('btn-confirm-yes')?.addEventListener('click', () => {
      resetProgress();
      this.motionGranted = false;
      this.applySettings();
      this.refreshStickerBook();
      this.refreshHome();
      activate(['settings']);
      this.toast('Progress reset. A fresh adventure awaits!');
    });
  }

  openSettings() {
    audio.play('click');
    this.applySettings();
    activate(['settings']);
    const status = $('save-status');
    if (status) status.textContent = storageStatusText();
  }

  effectiveControl() {
    const mode = save.data.settings.control;
    if (mode === 'touch') return 'touch';
    if (mode === 'tilt') return 'tilt';
    // Auto: fall back to arrows when the browser has no motion support.
    if (this.motion.status === MOTION_STATUS.UNSUPPORTED
      || this.motion.status === MOTION_STATUS.INSECURE
      || this.motion.status === MOTION_STATUS.NODATA) {
      return 'touch';
    }
    return 'tilt';
  }

  applySettings() {
    const s = save.data.settings;

    document.querySelectorAll('#set-sens [data-sens]').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.sens === s.sensitivity);
    });
    document.querySelectorAll('#set-control [data-control]').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.control === s.control);
    });
    document.querySelectorAll('#set-speed [data-speed]').forEach((b) => {
      b.classList.toggle('is-active', Math.abs(parseFloat(b.dataset.speed) - s.ballSpeed) < 0.01);
    });
    document.querySelectorAll('#set-difficulty [data-diff]').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.diff === s.difficulty);
    });

    const dz = $('set-deadzone');
    if (dz) dz.value = String(s.deadZone);
    if ($('deadzone-val')) $('deadzone-val').textContent = String(s.deadZone);

    const vol = $('set-volume');
    if (vol) vol.value = String(Math.round(s.volume * 100));
    if ($('volume-val')) $('volume-val').textContent = String(Math.round(s.volume * 100));

    this.setPressed('set-flip-x', !!s.flipX);
    this.setPressed('set-flip-y', !!s.flipY);
    this.setPressed('set-guidance', !!s.guidance);
    this.setPressed('set-showway', !!s.showway);
    this.setPressed('set-music', !!s.music);
    this.setPressed('set-sfx', !!s.sfx);

    this.motion.configure({
      sensitivity: s.sensitivity,
      deadZone: s.deadZone,
      flipX: s.flipX,
      flipY: s.flipY,
    });
    this.game.setSettings({
      guidance: s.guidance,
      speedScale: s.ballSpeed,
      sensitivity: s.sensitivity,
      showway: s.showway,
    });
    audio.setEnabled({ sound: s.sound, music: s.music, sfx: s.sfx, volume: s.volume });
    this.applySoundUi();
  }

  setPressed(id, on) {
    const el = $(id);
    if (!el) return;
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (id === 'set-guidance' || id === 'set-showway' || id === 'set-music' || id === 'set-sfx') {
      el.textContent = on ? 'On' : 'Off';
    }
  }

  toggleSound() {
    audio.init();
    const next = !save.data.settings.sound;
    updateSettings({ sound: next });
    this.applySettings();
    if (next) audio.play('collect');
    this.toast(next ? 'Sound on' : 'Sound off');
  }

  applySoundUi() {
    const muted = !save.data.settings.sound;
    document.body.classList.toggle('is-muted', muted);
    const btn = $('btn-sound');
    if (btn) btn.setAttribute('aria-pressed', muted ? 'false' : 'true');
  }

  /* ------------------------------ calibration ---------------------------- */

  bindCalibrate() {
    $('btn-cal-start')?.addEventListener('click', () => this.onCalStart());
    $('btn-cal-touch')?.addEventListener('click', () => this.useTouchInstead());
  }

  beginCalibration(mode) {
    this.calMode = mode;
    const s = save.data.settings;

    activate(mode === 'recal' ? ['game', 'calibrate'] : ['calibrate']);

    const title = $('cal-title');
    const sub = $('cal-sub');
    const foot = $('cal-foot');
    const startBtn = $('btn-cal-start');
    const touchBtn = $('btn-cal-touch');
    const perm = $('cal-permission');
    const status = $('cal-status');

    if (mode === 'test') {
      if (title) title.textContent = 'Tilt test';
      if (sub) sub.textContent = 'Hold the iPad and tilt it gently. Watch the pink bubble follow your hands.';
      if (foot) foot.textContent = 'Check that all four directions feel right. You can flip an axis in settings if needed.';
      if (startBtn) startBtn.textContent = this.motionGranted ? 'DONE' : 'START';
      if (touchBtn) touchBtn.hidden = true;
      if (perm) perm.hidden = this.motionGranted;
      if (status) status.textContent = this.motionGranted ? 'Ready when you are!' : 'Tap START to allow motion access.';
    } else if (mode === 'recal') {
      if (title) title.textContent = 'Find your comfy spot again';
      if (sub) sub.textContent = 'Hold the iPad the way you like it, then press START. The marble will wait.';
      if (foot) foot.textContent = 'Recalibrating never costs you anything.';
      if (startBtn) startBtn.textContent = 'START';
      if (touchBtn) touchBtn.hidden = this.effectiveControl() === 'touch';
      if (perm) perm.hidden = this.motionGranted || this.effectiveControl() === 'touch';
      if (status) status.textContent = this.motionGranted ? 'Ready when you are!' : 'Tap START to allow motion access.';
    } else {
      if (title) title.textContent = 'Hold your iPad comfortably';
      if (sub) sub.textContent = 'Sit it on your lap, a pillow, or hold it with both hands — whatever feels cosy.';
      if (foot) foot.textContent = 'Hold still for a moment while we find your comfy spot…';
      if (startBtn) startBtn.textContent = 'START';
      if (touchBtn) touchBtn.hidden = false;
      if (perm) perm.hidden = this.motionGranted;
      if (status) status.textContent = this.motionGranted ? 'Ready when you are!' : 'Tap START to allow motion access.';
    }

    const pet = $('cal-pet');
    if (pet) {
      const w = WORLDS[save.data.selectedWorld];
      pet.src = petUrl(w.pet, 'idle');
    }

    // Auto mode with a browser that cannot tilt: mention the fallback early.
    if (this.effectiveControl() === 'touch' && mode === 'play' && s.control === 'auto') {
      if (status) status.textContent = 'This browser cannot tilt, so the arrow buttons will be used.';
    }
    if (this.effectiveControl() === 'touch' && mode === 'test') {
      if (status) status.textContent = 'Arrow buttons are on. Tap DONE to go back.';
      if (startBtn) startBtn.textContent = 'DONE';
    }

    this.startBubble();
  }

  async onCalStart() {
    audio.init();
    audio.play('click');

    if (this.calMode === 'test' && this.motionGranted && this.effectiveControl() !== 'touch') {
      this.finishCalibration();
      return;
    }

    if (this.effectiveControl() === 'touch') {
      this.finishCalibration();
      return;
    }

    if (!this.motionGranted) {
      const status = await this.motion.requestPermission();
      if (status === MOTION_STATUS.GRANTED) {
        this.motionGranted = true;
        this.motion.start();
      } else {
        this.onMotionUnavailable(status);
        return;
      }
    }

    if (!this.motion.hasData() && !this.motion.listening) this.motion.start();

    const statusEl = $('cal-status');
    if (statusEl) statusEl.textContent = 'Hold still…';
    const startBtn = $('btn-cal-start');
    if (startBtn) startBtn.disabled = true;

    const ok = await this.motion.calibrate(1200);

    if (startBtn) startBtn.disabled = false;

    if (!ok) {
      this.onMotionUnavailable(MOTION_STATUS.NODATA);
      return;
    }

    if (statusEl) statusEl.textContent = 'Lovely! Ready to roll.';
    this.finishCalibration();
  }

  onMotionUnavailable(status) {
    const statusEl = $('cal-status');
    const foot = $('cal-foot');
    const touchBtn = $('btn-cal-touch');
    const messages = {
      [MOTION_STATUS.DENIED]: 'Motion access is off. The big arrow buttons work just as well!',
      [MOTION_STATUS.UNSUPPORTED]: 'This browser has no tilt sensor. Arrow buttons it is!',
      [MOTION_STATUS.INSECURE]: 'Tilt needs a secure (https) page. Arrow buttons work here!',
      [MOTION_STATUS.NODATA]: 'No tilt readings yet. Try again, or use the arrow buttons.',
    };
    if (statusEl) statusEl.textContent = messages[status] || 'Let’s use the arrow buttons instead.';
    if (foot) foot.textContent = 'You can turn tilt on later in Grown-up Settings.';
    if (touchBtn) {
      touchBtn.hidden = false;
      touchBtn.textContent = 'Use arrow buttons';
    }
    this.motion.status = status;
    if (save.data.settings.control === 'auto') {
      // Auto mode quietly switches to the reliable fallback and carries on.
      updateSettings({ control: 'touch' });
      this.motion.setTouchMode(true);
      this.toast('Switched to arrow buttons');
      this.finishCalibration();
    }
  }

  useTouchInstead() {
    audio.play('click');
    updateSettings({ control: 'touch' });
    this.motion.setTouchMode(true);
    this.applySettings();
    this.toast('Arrow buttons are on');
    this.finishCalibration();
  }

  finishCalibration() {
    this.stopBubble();
    const s = save.data.settings;

    if (this.calMode === 'test') {
      activate(['settings']);
      this.toast('Tilt test finished');
      return;
    }

    if (this.calMode === 'recal') {
      this.motion.setTouchMode(this.effectiveControl() === 'touch');
      activate(['game']);
      this.game.resume();
      return;
    }

    // Pre-game: either start playing, or (touch mode) head straight in.
    const world = save.data.selectedWorld;
    const difficulty = save.data.selectedDifficulty;
    const levelIndex = currentLevelIndex(world);

    this.motion.setTouchMode(this.effectiveControl() === 'touch');
    this.playLevel(world, difficulty, levelIndex);
    this.toast(this.effectiveControl() === 'touch'
      ? 'Use the big arrows to roll!'
      : 'Tilt gently to roll!');
    if (s.control === 'tilt' || this.effectiveControl() === 'tilt') {
      this.motionGranted = true;
    }
  }

  startBubble() {
    this.stopBubble();
    const tick = () => {
      const meter = document.querySelector('.tilt-meter');
      const bubble = $('tilt-bubble');
      if (bubble && meter) {
        const live = this.motion.liveTilt();
        const w = meter.clientWidth || 180;
        const max = w * 0.32;
        bubble.style.transform = `translate(${live.x * max}px, ${live.y * max}px)`;
      }
      this.bubbleRaf = requestAnimationFrame(tick);
    };
    this.bubbleRaf = requestAnimationFrame(tick);
  }

  stopBubble() {
    if (this.bubbleRaf) cancelAnimationFrame(this.bubbleRaf);
    this.bubbleRaf = null;
  }

  /* -------------------------------- touch -------------------------------- */

  bindTouch() {
    const pad = $('touch-pad');
    if (!pad) return;
    const buttons = pad.querySelectorAll('.touch-btn');
    buttons.forEach((btn) => {
      const dir = btn.dataset.dir;
      const press = (e) => {
        e.preventDefault();
        audio.init();
        btn.classList.add('is-down');
        this.motion.setTouch(dir, true);
        try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      };
      const release = (e) => {
        if (e) e.preventDefault();
        btn.classList.remove('is-down');
        this.motion.setTouch(dir, false);
      };
      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('pointerleave', release);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }

  setTouchVisible(on) {
    const pad = $('touch-pad');
    if (!pad) return;
    pad.classList.toggle('is-on', !!on);
  }

  /* -------------------------------- global ------------------------------- */

  bindGlobal() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onOrientation);
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener?.('change', this.onOrientation);
    }

    // Unlock audio on the first real interaction anywhere.
    const unlock = () => {
      audio.init();
      audio.setEnabled({
        sound: save.data.settings.sound,
        music: save.data.settings.music,
        sfx: save.data.settings.sfx,
        volume: save.data.settings.volume,
      });
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);

    window.addEventListener('pagehide', () => flushSave());
  }

  onResize() {
    this.renderer.resize();
  }

  onOrientation() {
    this.renderer.resize();
    if (this.game.state === 'playing') {
      window.setTimeout(() => {
        if (this.motion.hasData() && this.effectiveControl() !== 'touch') {
          this.motion.captureBaselineNow();
          this.toast('Recalibrated for the new position');
        }
      }, 350);
    }
  }

  toast(message, ms = 2400) {
    const el = $('hud-toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-show');
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      el.classList.remove('is-show');
    }, ms);
  }
}