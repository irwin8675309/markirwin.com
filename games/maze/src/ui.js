/**
 * Maze Adventures — screens, menus, settings and glue.
 */

import {
  CHARACTERS,
  CHARACTER_ORDER,
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  MESSAGES,
  STICKERS,
  WORLDS,
  WORLD_ORDER,
  getCharacter,
  getDifficulty,
  getWorld,
} from './config.js';
import { WorldArt } from './world-art.js';
import { generateLayout } from './maze.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

const SPEAKER_ON = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 25h9l13-10v34L21 39h-9z" fill="currentColor"/><path d="M43 22c5 5 5 15 0 20" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M50 15c9 9 9 25 0 34" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`;
const SPEAKER_OFF = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 25h9l13-10v34L21 39h-9z" fill="currentColor"/><path d="M43 20l12 24M55 20L43 44" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`;

const CONFETTI_COLORS = ['#ff8fb7', '#ffe27a', '#7ce3c2', '#8fdcff', '#b98bf0', '#ff9e7a', '#ffffff', '#70d58c'];

function stickerSrc(art) {
  if (!art) return WorldArt.character('ghosty', 'idle');
  const [kind, a, b] = art.split(':');
  if (kind === 'char') return WorldArt.character(a, b || 'idle');
  if (kind === 'item' || kind === 'world') return WorldArt.item(a);
  return WorldArt.item('star');
}

export class App {
  constructor({ progress, audio, renderer, game }) {
    this.progress = progress;
    this.audio = audio;
    this.renderer = renderer;
    this.game = game;
    this.currentScreen = 'loading';
    this.toastTimer = null;
    this.appToastTimer = null;
    this.resetArmed = false;
    this.resetTimer = null;
    this.swipe = null;
    this.resizeObserver = null;
    this.bound = false;
    this.completeToken = 0;

    this.screens = {
      loading: $('#screen-loading'),
      home: $('#screen-home'),
      game: $('#screen-game'),
      stickers: $('#screen-stickers'),
    };
    this.modals = {
      pause: $('#modal-pause'),
      complete: $('#modal-complete'),
      settings: $('#modal-settings'),
    };
    this.playfield = $('#playfield');
    this.canvas = $('#maze-canvas');
    this.controls = $('#controls');
    this.toastEl = $('#game-toast');
    this.appToastEl = $('#app-toast');

    this.game.onCollect = (data) => this.onCollect(data);
    this.game.onFriendFound = () => {};
    this.game.onComplete = (data) => this.onComplete(data);
    this.game.onToast = (text, tone) => this.toast(text, tone);
    this.game.onTrailToggle = (on) => {
      $('#btn-trail').classList.toggle('is-on', on);
      $('#btn-trail').setAttribute('aria-pressed', String(on));
    };
  }

  init() {
    this.buildHome();
    this.bindEvents();
    this.syncSelections();
    this.updateSoundUI();
    this.updateControlsMode();
    this.showScreen('home');
    this.observeResize();
    this.updatePlaySummary();
  }

  /* ------------------------------ home build -------------------------- */

  buildHome() {
    const characterRow = $('#character-row');
    characterRow.innerHTML = '';
    for (const id of CHARACTER_ORDER) {
      const c = CHARACTERS[id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'character-card';
      btn.dataset.character = id;
      btn.style.setProperty('--card-accent', c.accent);
      btn.style.setProperty('--card-dark', c.accentDark);
      btn.style.setProperty('--card-soft', c.soft);
      btn.setAttribute('aria-label', `Choose ${c.name}, ${c.kind}`);
      btn.innerHTML = `
        <img src="${WorldArt.character(id, 'idle')}" alt="${c.name}" draggable="false" />
        <span class="c-name">${c.name}</span>
        <span class="c-kind">${c.kind}</span>`;
      btn.addEventListener('click', () => this.selectCharacter(id, true));
      characterRow.appendChild(btn);
    }

    const worldRow = $('#world-row');
    worldRow.innerHTML = '';
    for (const id of WORLD_ORDER) {
      const w = WORLDS[id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'world-card';
      btn.dataset.world = id;
      btn.style.setProperty('--card-accent', w.accent);
      btn.style.setProperty('--card-dark', w.accentDark);
      btn.style.setProperty('--card-soft', w.soft);
      btn.setAttribute('aria-label', `Choose ${w.name}`);
      btn.innerHTML = `
        <img src="${WorldArt.preview(id)}" alt="" draggable="false" />
        <span class="w-name">${w.name}</span>`;
      btn.addEventListener('click', () => this.selectWorld(id));
      worldRow.appendChild(btn);
    }

    const difficultyRow = $('#difficulty-row');
    difficultyRow.innerHTML = '';
    for (const id of DIFFICULTY_ORDER) {
      const d = DIFFICULTIES[id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'difficulty-btn';
      btn.dataset.difficulty = id;
      btn.style.setProperty('--card-accent', d.accent);
      btn.style.setProperty('--card-soft', `${d.accent}22`);
      btn.style.setProperty('--card-dark', d.accent);
      btn.setAttribute('aria-label', `${d.name}: ${d.description}`);
      btn.innerHTML = `<span class="d-name">${d.short}</span><span class="d-tag">${d.tag}</span>`;
      btn.addEventListener('click', () => this.selectDifficulty(id));
      difficultyRow.appendChild(btn);
    }

    for (const img of $$('[data-pet-img]')) {
      img.src = WorldArt.character(img.dataset.petImg, 'idle');
    }
  }

  syncSelections() {
    const charId = this.progress.selectedCharacter;
    const worldId = this.progress.world;
    const diffId = this.progress.difficulty;

    $$('.character-card').forEach((el) => {
      const on = el.dataset.character === charId;
      el.classList.toggle('is-selected', on);
      el.setAttribute('aria-pressed', String(on));
    });
    $$('.world-card').forEach((el) => {
      const on = el.dataset.world === worldId;
      el.classList.toggle('is-selected', on);
      el.setAttribute('aria-pressed', String(on));
    });
    $$('.difficulty-btn').forEach((el) => {
      const on = el.dataset.difficulty === diffId;
      el.classList.toggle('is-selected', on);
      el.setAttribute('aria-pressed', String(on));
    });

    const friendBtn = $('#btn-find-friend');
    friendBtn.setAttribute('aria-checked', String(this.progress.findFriend));

    const c = getCharacter(charId);
    $('#hero-message').textContent = c.message;
    $('#hud-pet').src = WorldArt.character(charId, 'idle');
    $('#hud-pet-name').textContent = c.name;
    this.updatePlaySummary();
  }

  updatePlaySummary() {
    const c = getCharacter(this.progress.selectedCharacter);
    const w = getWorld(this.progress.world);
    const d = getDifficulty(this.progress.difficulty);
    $('#play-summary').textContent = `${c.name} · ${w.short} · ${d.name}`;
  }

  selectCharacter(id, animate = false) {
    if (!CHARACTERS[id]) return;
    this.progress.setCharacter(id);
    this.syncSelections();
    this.audio.unlock();
    this.audio.sfx('button');
    const msg = $('#hero-message');
    msg.textContent = CHARACTERS[id].message;
    msg.classList.remove('pop');
    void msg.offsetWidth;
    msg.classList.add('pop');
    if (animate) {
      const card = $(`.character-card[data-character="${id}"]`);
      if (card) {
        card.classList.remove('bounce');
        void card.offsetWidth;
        card.classList.add('bounce');
      }
    }
  }

  selectWorld(id) {
    if (!WORLDS[id]) return;
    this.progress.setWorld(id);
    this.syncSelections();
    this.audio.sfx('button');
  }

  selectDifficulty(id) {
    if (!DIFFICULTIES[id]) return;
    this.progress.setDifficulty(id);
    this.syncSelections();
    this.audio.sfx('button');
  }

  /* ------------------------------ events ------------------------------ */

  bindEvents() {
    if (this.bound) return;
    this.bound = true;

    $('#btn-play').addEventListener('click', () => this.startGame());
    $('#btn-stickers').addEventListener('click', () => this.openStickers());
    $('#btn-stickers-back').addEventListener('click', () => this.showScreen('home'));
    $('#btn-sound').addEventListener('click', () => this.toggleSound());
    $('#btn-settings').addEventListener('click', () => this.openSettings());
    $('#btn-find-friend').addEventListener('click', () => {
      this.progress.setFindFriend(!this.progress.findFriend);
      this.syncSelections();
      this.audio.sfx('button');
    });

    $('#btn-game-home').addEventListener('click', () => this.goHome());
    $('#btn-reset').addEventListener('click', () => this.restartMaze());
    $('#btn-pause').addEventListener('click', () => this.openPause());
    $('#btn-resume').addEventListener('click', () => this.closePause());
    $('#btn-pause-restart').addEventListener('click', () => {
      this.closePause();
      this.restartMaze();
    });
    $('#btn-pause-home').addEventListener('click', () => {
      this.closePause();
      this.goHome();
    });
    $('#btn-pause-sound').addEventListener('click', () => this.toggleSound());

    $('#btn-complete-again').addEventListener('click', () => {
      this.hideComplete();
      this.playAgain();
    });
    $('#btn-complete-next').addEventListener('click', () => {
      this.hideComplete();
      this.newMaze();
    });
    $('#btn-complete-home').addEventListener('click', () => {
      this.hideComplete();
      this.goHome();
    });

    $('#btn-show-way').addEventListener('click', () => {
      this.audio.sfx('button');
      this.game.showWay();
    });
    $('#btn-trail').addEventListener('click', () => {
      this.audio.sfx('button');
      this.game.toggleTrail();
    });
    $('#btn-hint').addEventListener('click', () => {
      this.audio.sfx('button');
      this.game.hint();
    });

    // D-pad — press and hold.
    for (const btn of $$('.dpad-btn')) {
      const dir = btn.dataset.dir;
      btn.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        btn.classList.add('is-pressed');
        try { btn.setPointerCapture(event.pointerId); } catch { /* noop */ }
        this.game.pressDirection(dir);
      });
      const release = () => {
        btn.classList.remove('is-pressed');
        this.game.releaseDirection(dir);
      };
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('lostpointercapture', release);
    }

    // Swipe anywhere on the maze canvas.
    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      this.swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
      try { this.canvas.setPointerCapture(event.pointerId); } catch { /* noop */ }
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.swipe || this.swipe.id !== event.pointerId) return;
      const dx = event.clientX - this.swipe.x;
      const dy = event.clientY - this.swipe.y;
      const threshold = 26;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
      const dir = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');
      this.game.swipe(dir);
      this.swipe.x = event.clientX;
      this.swipe.y = event.clientY;
    });
    const endSwipe = (event) => {
      if (this.swipe && this.swipe.id === event.pointerId) this.swipe = null;
    };
    this.canvas.addEventListener('pointerup', endSwipe);
    this.canvas.addEventListener('pointercancel', endSwipe);
    this.canvas.addEventListener('pointerleave', endSwipe);

    // Keyboard for desktop.
    window.addEventListener('keydown', (event) => {
      if (this.currentScreen !== 'game') return;
      if (event.code === 'Escape') {
        event.preventDefault();
        if (this.modals.pause.classList.contains('is-visible')) this.closePause();
        else if (!this.modals.complete.classList.contains('is-visible')) this.openPause();
        return;
      }
      if (this.game.paused || this.game.completed) return;
      const map = {
        ArrowUp: 'up', KeyW: 'up',
        ArrowDown: 'down', KeyS: 'down',
        ArrowLeft: 'left', KeyA: 'left',
        ArrowRight: 'right', KeyD: 'right',
      };
      const dir = map[event.code];
      if (dir) {
        event.preventDefault();
        this.game.pressDirection(dir);
      }
    });
    window.addEventListener('keyup', (event) => {
      const map = {
        ArrowUp: 'up', KeyW: 'up',
        ArrowDown: 'down', KeyS: 'down',
        ArrowLeft: 'left', KeyA: 'left',
        ArrowRight: 'right', KeyD: 'right',
      };
      const dir = map[event.code];
      if (dir) this.game.releaseDirection(dir);
    });

    // Settings.
    $('#btn-settings-close').addEventListener('click', () => this.closeSettings());
    $('#set-sound').addEventListener('click', () => this.setToggle('sound', $('#set-sound')));
    $('#set-music').addEventListener('click', () => this.setToggle('music', $('#set-music')));
    $('#set-sfx').addEventListener('click', () => this.setToggle('sfx', $('#set-sfx')));
    $('#set-music-volume').addEventListener('input', (event) => {
      this.progress.setSetting('musicVolume', Number(event.target.value));
      this.audio.sync(this.progress.state);
    });
    $('#set-sfx-volume').addEventListener('input', (event) => {
      this.progress.setSetting('sfxVolume', Number(event.target.value));
      this.audio.sync(this.progress.state);
    });
    for (const btn of $$('#set-controls button')) {
      btn.addEventListener('click', () => {
        this.progress.setSetting('controls', btn.dataset.value);
        this.updateControlsMode();
        this.audio.sfx('button');
      });
    }
    for (const btn of $$('#set-speed button')) {
      btn.addEventListener('click', () => {
        this.progress.setSetting('speed', btn.dataset.value);
        this.syncSettings();
        this.audio.sfx('button');
      });
    }
    $('#btn-reset-progress').addEventListener('click', () => this.handleResetProgress());

    // Generic button sound (avoid double sounds on special controls).
    document.addEventListener('click', (event) => {
      const btn = event.target.closest?.('button');
      if (!btn) return;
      if (btn.closest('.dpad') || btn.closest('.helper-cluster') || btn.classList.contains('danger-btn')) return;
      if (btn.id === 'btn-play' || btn.id === 'btn-complete-next' || btn.id === 'btn-complete-again') return;
      this.audio.sfx('button');
    });

    // Unlock audio on the very first interaction.
    const unlock = () => this.audio.unlock();
    document.addEventListener('pointerdown', unlock, { capture: true, once: true });
    document.addEventListener('keydown', unlock, { capture: true, once: true });

    // Keep the iPad from scrolling or zooming during play.
    document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('contextmenu', (e) => {
      if (!e.target.closest?.('input')) e.preventDefault();
    });
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('orientationchange', () => {
      window.setTimeout(() => this.resizeCanvas(), 250);
    });

    this.observeResize();
  }

  observeResize() {
    if (this.resizeObserver) return;
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.playfield);
  }

  resizeCanvas() {
    if (this.currentScreen !== 'game') return;
    const rect = this.playfield.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    this.renderer.resize(rect.width, rect.height);
  }

  /* ------------------------------ screens ----------------------------- */

  showScreen(name) {
    for (const [key, el] of Object.entries(this.screens)) {
      const on = key === name;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-hidden', String(!on));
    }
    this.currentScreen = name;
    if (name !== 'game') {
      this.completeToken += 1;
      this.game.stop();
      this.hideModals();
      this.toastHide();
    }
    if (name === 'home') this.syncSelections();
    if (name === 'game') {
      this.resizeCanvas();
      requestAnimationFrame(() => this.resizeCanvas());
    }
  }

  hideModals() {
    for (const modal of Object.values(this.modals)) modal.classList.remove('is-visible');
  }

  /* ------------------------------ game flow --------------------------- */

  buildLayout() {
    const diff = getDifficulty(this.progress.difficulty);
    const world = getWorld(this.progress.world);
    const friends = CHARACTER_ORDER.filter((id) => id !== this.progress.selectedCharacter);
    return generateLayout({
      cols: diff.grid,
      rows: diff.grid,
      braid: diff.braid,
      routeBias: diff.routeBias,
      items: diff.items,
      collectibleTypes: world.collectibles,
      surprise: world.surprise,
      findFriend: this.progress.findFriend,
      friendChoices: friends,
      seed: (Math.random() * 0xffffffff) >>> 0,
    });
  }

  startGame() {
    this.audio.unlock();
    this.hideModals();
    this.hideComplete();
    this.showScreen('game');
    this.resizeCanvas();
    const layout = this.buildLayout();
    this.game.load({
      layout,
      world: this.progress.world,
      difficulty: this.progress.difficulty,
      character: this.progress.selectedCharacter,
      findFriend: this.progress.findFriend,
      speed: this.progress.settings.speed,
    });
    this.applyWorldTheme();
    this.updateHUD();
    this.updateControlsMode();
    this.audio.setMusicTheme(this.progress.world);
    this.audio.sfx('start');
    requestAnimationFrame(() => this.resizeCanvas());
  }

  newMaze() {
    this.hideComplete();
    this.showScreen('game');
    this.resizeCanvas();
    const layout = this.buildLayout();
    this.game.load({
      layout,
      world: this.progress.world,
      difficulty: this.progress.difficulty,
      character: this.progress.selectedCharacter,
      findFriend: this.progress.findFriend,
      speed: this.progress.settings.speed,
    });
    this.applyWorldTheme();
    this.updateHUD();
    this.updateControlsMode();
    this.audio.setMusicTheme(this.progress.world);
    this.audio.sfx('start');
    requestAnimationFrame(() => this.resizeCanvas());
  }

  playAgain() {
    this.hideComplete();
    this.showScreen('game');
    this.resizeCanvas();
    this.game.restart();
    this.updateHUD();
    this.updateControlsMode();
    this.audio.sfx('start');
    requestAnimationFrame(() => this.resizeCanvas());
  }

  restartMaze() {
    this.hideModals();
    this.hideComplete();
    this.showScreen('game');
    this.resizeCanvas();
    this.game.restart();
    this.updateHUD();
    this.updateControlsMode();
    this.audio.sfx('button');
  }

  goHome() {
    this.game.stop();
    this.game.clearInput();
    this.hideModals();
    this.hideComplete();
    this.showScreen('home');
    this.audio.setMusicTheme(this.progress.world);
    this.audio.sfx('button');
  }

  applyWorldTheme() {
    const w = getWorld(this.progress.world);
    const root = document.documentElement;
    root.style.setProperty('--world-sky', w.sky[0]);
    root.style.setProperty('--world-mid', w.sky[1]);
    root.style.setProperty('--world-ground', w.ground);
    root.style.setProperty('--world-accent', w.accent);
  }

  updateHUD() {
    const c = getCharacter(this.progress.selectedCharacter);
    $('#hud-pet').src = WorldArt.character(c.id, 'idle');
    $('#hud-pet-name').textContent = c.name;
    $('#hud-collect').textContent = '0';
    $('#hud-total').textContent = `/ ${this.game.layout?.itemTotal || 0}`;
    const trailBtn = $('#btn-trail');
    trailBtn.classList.remove('is-on');
    trailBtn.setAttribute('aria-pressed', 'false');
  }

  updateControlsMode() {
    const mode = this.progress.settings.controls;
    this.controls.classList.toggle('swipe-mode', mode === 'swipe');
    this.controls.classList.toggle('buttons-mode', mode === 'buttons');
    // The board reserves room for the controls, so reflow after CSS changes.
    requestAnimationFrame(() => this.resizeCanvas());
  }

  onCollect(data) {
    $('#hud-collect').textContent = String(data.count);
    this.progress.addCollected(data.item.kind === 'surprise' ? 'surprise' : data.item.type, 1);
  }

  openPause() {
    if (this.currentScreen !== 'game' || this.game.completed) return;
    this.game.setPaused(true);
    this.modals.pause.classList.add('is-visible');
  }

  closePause() {
    this.modals.pause.classList.remove('is-visible');
    if (this.currentScreen === 'game') this.game.setPaused(false);
  }

  /* ------------------------------ complete ---------------------------- */

  onComplete(data) {
    this.progress.recordCompletion(data.world, data.difficulty);
    const sticker = this.progress.awardSticker(data.world);
    const friendFound = data.findFriend && data.friend?.rescued;

    const friends = this.renderCompleteFriends(data.character);
    $('#complete-friends').innerHTML = friends;

    $('#complete-title').textContent = friendFound ? 'You found your friend!' : pick(MESSAGES.complete);
    $('#complete-message').textContent = friendFound
      ? 'A happy reunion — and a wonderful adventure!'
      : pick(['What a happy adventure!', 'Wonderful exploring!', 'You did it!']);

    const collected = data.collected;
    const total = data.total;
    $('#complete-stats').textContent = collected > 0
      ? `You collected ${collected} of ${total} treasures!`
      : 'You explored the whole maze!';

    $('#sticker-award-img').src = stickerSrc(sticker.art);
    $('#sticker-award-img').alt = sticker.name;
    $('#sticker-award-name').textContent = sticker.name;
    $('#sticker-award').style.display = 'flex';
    this.buildConfetti();
    $('#btn-trail').classList.remove('is-on');
    $('#btn-trail').setAttribute('aria-pressed', 'false');
    const token = ++this.completeToken;
    window.setTimeout(() => {
      if (token !== this.completeToken) return;
      if (this.currentScreen !== 'game') return;
      this.modals.complete.classList.add('is-visible');
      this.audio.sfx('unlock');
    }, 550);
  }

  renderCompleteFriends(selectedId) {
    const order = [selectedId, ...CHARACTER_ORDER.filter((id) => id !== selectedId)];
    return order.map((id) => `<img src="${WorldArt.character(id, 'celebrate')}" alt="${CHARACTERS[id].name}" />`).join('');
  }

  hideComplete() {
    this.completeToken += 1;
    this.modals.complete.classList.remove('is-visible');
    $('#confetti').innerHTML = '';
  }

  buildConfetti() {
    const wrap = $('#confetti');
    wrap.innerHTML = '';
    for (let i = 0; i < 56; i += 1) {
      const span = document.createElement('span');
      span.style.left = `${Math.random() * 100}%`;
      span.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      span.style.animationDuration = `${2.4 + Math.random() * 2.4}s`;
      span.style.animationDelay = `${Math.random() * 1.8}s`;
      span.style.width = `${6 + Math.random() * 8}px`;
      span.style.height = `${10 + Math.random() * 10}px`;
      span.style.opacity = String(0.7 + Math.random() * 0.3);
      wrap.appendChild(span);
    }
  }

  /* ------------------------------ settings ---------------------------- */

  openSettings() {
    this.syncSettings();
    this.modals.settings.classList.add('is-visible');
    this.audio.sfx('button');
  }

  closeSettings() {
    this.modals.settings.classList.remove('is-visible');
    this.resetArmed = false;
    this.updateResetButton();
  }

  syncSettings() {
    const s = this.progress.settings;
    $('#set-sound').setAttribute('aria-checked', String(s.sound));
    $('#set-music').setAttribute('aria-checked', String(s.music && s.sound));
    $('#set-sfx').setAttribute('aria-checked', String(s.sfx && s.sound));
    $('#set-music-volume').value = String(s.musicVolume);
    $('#set-sfx-volume').value = String(s.sfxVolume);
    for (const btn of $$('#set-controls button')) {
      const on = btn.dataset.value === s.controls;
      btn.classList.toggle('is-selected', on);
      btn.setAttribute('aria-pressed', String(on));
    }
    for (const btn of $$('#set-speed button')) {
      const on = btn.dataset.value === s.speed;
      btn.classList.toggle('is-selected', on);
      btn.setAttribute('aria-pressed', String(on));
    }
    this.updateResetButton();
  }

  setToggle(key, button) {
    const next = !this.progress.settings[key];
    this.progress.setSetting(key, next);
    if (key === 'sound' && next) this.audio.unlock();
    this.audio.sync(this.progress.state);
    this.updateSoundUI();
    this.syncSettings();
  }

  updateSoundUI() {
    const on = this.progress.settings.sound;
    const btn = $('#btn-sound');
    btn.innerHTML = on ? SPEAKER_ON : SPEAKER_OFF;
    btn.classList.toggle('is-off', !on);
    btn.setAttribute('aria-pressed', String(on));
    $('#btn-pause-sound').textContent = `Sound: ${on ? 'On' : 'Off'}`;
    $('#btn-pause-sound').setAttribute('aria-pressed', String(on));
  }

  toggleSound() {
    this.audio.unlock();
    const on = !this.progress.settings.sound;
    this.progress.setSetting('sound', on);
    this.audio.sync(this.progress.state);
    this.updateSoundUI();
    this.syncSettings();
    if (on) this.audio.sfx('button');
  }

  handleResetProgress() {
    const btn = $('#btn-reset-progress');
    if (!this.resetArmed) {
      this.resetArmed = true;
      btn.classList.add('is-armed');
      $('#reset-hint').textContent = 'Tap again to clear stickers and completed mazes.';
      btn.textContent = 'Tap again to reset everything';
      if (this.resetTimer) clearTimeout(this.resetTimer);
      this.resetTimer = window.setTimeout(() => {
        this.resetArmed = false;
        this.updateResetButton();
      }, 4500);
      return;
    }
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.progress.reset();
    this.resetArmed = false;
    this.audio.sync(this.progress.state);
    this.updateSoundUI();
    this.syncSettings();
    this.syncSelections();
    this.updateResetButton();
    this.closeSettings();
    this.goHome();
    this.appToast('Progress reset — a fresh adventure awaits!');
  }

  updateResetButton() {
    const btn = $('#btn-reset-progress');
    if (!btn) return;
    btn.classList.toggle('is-armed', this.resetArmed);
    btn.textContent = this.resetArmed ? 'Tap again to reset everything' : 'Reset all progress';
    const hint = $('#reset-hint');
    if (hint) {
      hint.textContent = this.resetArmed
        ? 'This clears stickers and completed mazes on this device.'
        : 'Stickers and completed mazes will be cleared.';
    }
  }

  /* ------------------------------ stickers ---------------------------- */

  openStickers() {
    this.renderStickers();
    this.showScreen('stickers');
    this.audio.sfx('button');
  }

  renderStickers() {
    const grid = $('#sticker-grid');
    grid.innerHTML = '';
    for (const sticker of STICKERS) {
      const count = this.progress.state.stickers[sticker.id] || 0;
      const card = document.createElement('div');
      card.className = `sticker-card${count ? '' : ' is-locked'}`;
      card.innerHTML = `
        <img src="${stickerSrc(sticker.art)}" alt="${count ? sticker.name : 'Mystery sticker'}" draggable="false" />
        <span class="s-name">${count ? sticker.name : '???'}</span>
        ${count > 1 ? `<span class="s-count">×${count}</span>` : ''}`;
      grid.appendChild(card);
    }
    $('#sticker-count').textContent = `${this.progress.stickerCount} / ${this.progress.totalStickers}`;
  }

  /* ------------------------------ toasts ------------------------------ */

  toast(text, tone = '') {
    if (!text) return;
    this.toastEl.textContent = text;
    this.toastEl.className = `toast is-visible${tone ? ` tone-${tone}` : ''}`;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastHide(), 2100);
  }

  toastHide() {
    this.toastEl.classList.remove('is-visible');
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  appToast(text) {
    this.appToastEl.textContent = text;
    this.appToastEl.classList.add('is-visible');
    if (this.appToastTimer) clearTimeout(this.appToastTimer);
    this.appToastTimer = window.setTimeout(() => {
      this.appToastEl.classList.remove('is-visible');
    }, 2400);
  }
}