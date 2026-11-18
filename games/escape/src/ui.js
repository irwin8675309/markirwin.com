/**
 * Ghosty, Spin, and Oakley's Great Escape — UI controller.
 *
 * Owns the DOM: screen navigation, the home-screen choosers, canvas input
 * (tap-to-move + drag-and-drop), modals, the sticker book and settings. It
 * talks to the game controller and never touches rendering directly.
 */

import {
  CHARACTERS,
  CHARACTER_ORDER,
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  GAME_TITLE,
  MESSAGES,
  SPEED_SETTINGS,
  STICKERS,
  STICKER_BY_ID,
  WORLDS,
  WORLD_ORDER,
  getCharacter,
  getDifficulty,
  getWorld,
} from './config.js';
import { LEVELS, LEVEL_BY_ID, levelsForWorld, nextLevel } from './levels.js';
import { WorldArt } from './world-art.js';
import { Art } from './art.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const pick = (list) => list[Math.floor(Math.random() * list.length)];

const STICKER_ART = {
  'char:ghosty': () => Art.petDataURI('ghosty', 'celebrate'),
  'char:spin': () => Art.petDataURI('spin', 'celebrate'),
  'char:oakley': () => Art.petDataURI('oakley', 'celebrate'),
  'item:star': () => Art.itemDataURI('star'),
  'item:heart': () => Art.itemDataURI('heart'),
  'item:sparkle': () => Art.itemDataURI('sparkle'),
  'item:treat': () => Art.itemDataURI('treat'),
  'item:butterfly': () => Art.itemDataURI('butterfly'),
  'item:gem': () => Art.itemDataURI('gem'),
  'obj:pillow': () => WorldArt.object('pillow'),
  'obj:cushion': () => WorldArt.object('cushion'),
  'obj:block': () => WorldArt.object('blockBlue'),
  'obj:box': () => WorldArt.object('box'),
  'obj:ball': () => WorldArt.object('ball'),
  'world:flower': () => WorldArt.decor('flower'),
  'dest:pillowfort': () => WorldArt.destination('pillowfort'),
  'dest:gardentent': () => WorldArt.destination('gardentent'),
  'dest:toychest': () => WorldArt.destination('toychest'),
  'dest:adventure': () => WorldArt.destination('adventure'),
};

function stickerArtURI(artKey) {
  const fn = STICKER_ART[artKey];
  return fn ? fn() : Art.itemDataURI('star');
}

export class App {
  constructor({ progress, audio, renderer, game }) {
    this.progress = progress;
    this.audio = audio;
    this.renderer = renderer;
    this.game = game;

    this.screen = 'loading';
    this.canvas = $('#game-canvas');
    this.playfield = $('#playfield');
    this.resizeObserver = null;
    this.toastTimer = null;
    this.appToastTimer = null;
    this.pendingStickers = [];

    this.setupHome();
    this.setupGameInput();
    this.setupSettings();
    this.bindStaticButtons();
    this.setupResize();

    this.game.onCollect = (type, count, total) => this.handleCollect(type, count, total);
    this.game.onFriend = (charId) => this.handleFriend(charId);
    this.game.onComplete = (result) => this.handleComplete(result);
    this.game.onToast = (msg) => this.showToast(msg);
    this.game.onObjectMove = () => this.refreshHud();
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                               */
  /* ------------------------------------------------------------------ */

  init() {
    this.applySoundState();
    this.renderCharacterRow();
    this.renderWorldRow();
    this.renderDifficultyRow();
    this.refreshHomeSummary();
    this.show('home');
    this.audio.sync(this.progress);
  }

  applySoundState() {
    document.body.classList.toggle('sound-off', !this.progress.settings.sound);
  }

  /* ------------------------------------------------------------------ */
  /* Screen management                                                  */
  /* ------------------------------------------------------------------ */

  show(name) {
    this.screen = name;
    $$('.screen').forEach((el) => el.classList.remove('is-active'));
    const el = $(`#screen-${name}`);
    if (el) el.classList.add('is-active');

    if (name !== 'game') {
      this.game.stop();
    }
    if (name === 'home') {
      this.refreshHomeSummary();
      this.audio.setMusicTheme(this.progress.world);
      this.audio.startMusic(this.progress.world);
    }
    if (name === 'stickers') {
      this.renderStickerBook();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Home choosers                                                      */
  /* ------------------------------------------------------------------ */

  setupHome() {
    $('#btn-play').addEventListener('click', () => this.startPlay());
    $('#btn-stickers').addEventListener('click', () => {
      this.audio.sfx('button');
      this.show('stickers');
    });
    $('#btn-settings').addEventListener('click', () => this.openSettings());
    $('#btn-sound').addEventListener('click', () => this.toggleSound());
  }

  renderCharacterRow() {
    const row = $('#character-row');
    row.innerHTML = '';
    for (const id of CHARACTER_ORDER) {
      const ch = CHARACTERS[id];
      const card = document.createElement('button');
      card.className = 'pick-card char-card';
      card.dataset.char = id;
      card.setAttribute('aria-label', `Choose ${ch.name}`);
      card.innerHTML = `
        <img src="${Art.petDataURI(id, 'idle')}" alt="" />
        <span class="pick-name">${ch.name}</span>
        <span class="pick-sub">${ch.kind.replace('The ', '')}</span>`;
      card.addEventListener('click', () => {
        this.progress.setCharacter(id);
        this.audio.sfx('button');
        this.audio.unlock();
        this.renderCharacterRow();
        this.refreshHomeSummary();
      });
      row.appendChild(card);
    }
    this.markSelected(row, 'char', this.progress.character);
  }

  renderWorldRow() {
    const row = $('#world-row');
    row.innerHTML = '';
    for (const id of WORLD_ORDER) {
      const w = WORLDS[id];
      const card = document.createElement('button');
      card.className = 'pick-card world-card';
      card.dataset.world = id;
      card.setAttribute('aria-label', `Choose ${w.name}`);
      card.innerHTML = `
        <img src="${WorldArt.preview(id)}" alt="" />
        <span class="pick-name">${w.short}</span>
        <span class="pick-sub">${w.subtitle}</span>`;
      card.addEventListener('click', () => {
        this.progress.setWorld(id);
        this.audio.sfx('button');
        this.audio.unlock();
        this.renderWorldRow();
        this.refreshHomeSummary();
      });
      row.appendChild(card);
    }
    this.markSelected(row, 'world', this.progress.world);
  }

  renderDifficultyRow() {
    const row = $('#difficulty-row');
    row.innerHTML = '';
    for (const id of DIFFICULTY_ORDER) {
      const d = DIFFICULTIES[id];
      const card = document.createElement('button');
      card.className = 'pick-card diff-card';
      card.dataset.diff = id;
      card.setAttribute('aria-label', `Choose ${d.name}`);
      card.innerHTML = `
        <span class="diff-dot" style="background:${d.accent}"></span>
        <span class="diff-text">
          <span class="pick-name">${d.name}</span>
          <span class="pick-sub">${d.tag} · ${d.description}</span>
        </span>`;
      card.addEventListener('click', () => {
        this.progress.setDifficulty(id);
        this.audio.sfx('button');
        this.audio.unlock();
        this.renderDifficultyRow();
        this.refreshHomeSummary();
      });
      row.appendChild(card);
    }
    this.markSelected(row, 'diff', this.progress.difficulty);
  }

  markSelected(row, dataKey, value) {
    Array.from(row.children).forEach((child) => {
      child.classList.toggle('is-selected', child.dataset[dataKey] === value);
    });
  }

  refreshHomeSummary() {
    const ch = getCharacter(this.progress.character);
    const w = getWorld(this.progress.world);
    const d = getDifficulty(this.progress.difficulty);
    $('#play-summary').textContent = `${ch.name} · ${w.short} · ${d.name}`;
    const msgMap = {
      ghosty: 'Let’s explore together!',
      spin: 'Ready for an adventure?',
      oakley: 'Let’s find some treats!',
    };
    $('#hero-message').textContent = msgMap[ch.id] || 'Let’s go!';
    // Reflect the pet currently chosen in the hero message bubble style.
  }

  /* ------------------------------------------------------------------ */
  /* Play                                                               */
  /* ------------------------------------------------------------------ */

  startPlay(levelId = null) {
    this.audio.unlock();
    this.audio.sfx('start');

    const worldId = this.progress.world;
    const worldLevels = levelsForWorld(worldId);
    let level;
    if (levelId && LEVEL_BY_ID[levelId]) {
      level = LEVEL_BY_ID[levelId];
    } else {
      // Prefer the first unfinished level in this world, else the first.
      level = worldLevels.find((l) => !this.progress.isCompleted(l.id)) || worldLevels[0] || LEVELS[0];
    }

    this.show('game');
    this.game.setSpeedSetting(this.progress.settings.speed);
    this.game.start({
      level,
      worldId: level.world,
      difficultyId: this.progress.difficulty,
      character: this.progress.character,
    });
    this.updateHudForLevel(level);
    // Size the canvas now that the screen is visible.
    requestAnimationFrame(() => this.resizeCanvas());
  }

  updateHudForLevel(level) {
    const ch = getCharacter(this.progress.character);
    const world = getWorld(level.world);
    $('#hud-pet').src = Art.petDataURI(ch.id, 'idle');
    $('#hud-pet-name').textContent = ch.name;
    $('#hud-level-name').textContent = `${level.name} · ${world.short}`;
    this.refreshHud();
  }

  refreshHud() {
    const collected = this.game.collectedCount || 0;
    const total = this.game.collectedTotal ? this.game.collectedTotal() : 0;
    const el = $('#hud-collect');
    if (el) el.textContent = String(collected);
    const tot = $('#hud-total');
    if (tot) tot.textContent = `/ ${total}`;
  }

  /* ------------------------------------------------------------------ */
  /* Canvas input                                                       */
  /* ------------------------------------------------------------------ */

  setupGameInput() {
    const canvas = this.canvas;
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let pointerId = null;

    const localPoint = (e) => {
      const rect = canvas.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return { x: p.clientX - rect.left, y: p.clientY - rect.top, rect };
    };

    const onDown = (e) => {
      if (this.screen !== 'game' || this.game.paused || this.game.completed) return;
      this.audio.unlock();
      const pt = localPoint(e);
      startX = pt.x;
      startY = pt.y;
      moved = false;
      pointerId = e.pointerId != null ? e.pointerId : 1;

      // If the touch lands on a movable object, begin a potential drag.
      const onObject = this.game.beginDrag(pt.x, pt.y);
      if (onObject) {
        dragging = true;
        canvas.setPointerCapture?.(pointerId);
        e.preventDefault?.();
      }
    };

    const onMove = (e) => {
      if (!dragging) return;
      const pt = localPoint(e);
      if (Math.hypot(pt.x - startX, pt.y - startY) > 6) moved = true;
      this.game.updateDrag(pt.x, pt.y);
      e.preventDefault?.();
    };

    const finishDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      const pt = localPoint(e);
      if (moved) {
        this.game.updateDrag(pt.x, pt.y);
        const didMove = this.game.endDrag();
        if (didMove) this.audio.sfx('drop');
      } else {
        // A simple tap on the object: cancel the drag, no penalty.
        this.game.cancelDrag();
      }
      if (e.pointerId != null) canvas.releasePointerCapture?.(pointerId);
      e.preventDefault?.();
    };

    const onTap = (e) => {
      if (this.screen !== 'game' || this.game.paused || this.game.completed) return;
      if (dragging) return;
      const pt = localPoint(e);
      const cell = this.renderer.pixelToCell(
        pt.x + pt.rect.left,
        pt.y + pt.rect.top,
        pt.rect,
      );
      if (cell >= 0) {
        this.game.tapCell(cell);
        this.audio.unlock();
        e.preventDefault?.();
      }
    };

    if (window.PointerEvent) {
      let downCell = null;
      canvas.addEventListener('pointerdown', (e) => {
        const pt = localPoint(e);
        downCell = pt;
        onDown(e);
      });
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerup', (e) => {
        const wasDragging = dragging;
        finishDrag(e);
        if (!wasDragging && downCell) {
          // Distinguish a tap from a drag that began on empty floor.
          const pt = localPoint(e);
          if (Math.hypot(pt.x - startX, pt.y - startY) < 8) {
            onTap(e);
          }
        }
        downCell = null;
      });
      canvas.addEventListener('pointercancel', () => {
        dragging = false;
        this.game.cancelDrag();
      });
    } else {
      // Touch + mouse fallback.
      canvas.addEventListener('touchstart', onDown, { passive: false });
      canvas.addEventListener('touchmove', onMove, { passive: false });
      canvas.addEventListener('touchend', (e) => {
        const wasDragging = dragging;
        finishDrag(e);
        if (!wasDragging) onTap(e);
      }, { passive: false });
      canvas.addEventListener('mousedown', onDown);
      canvas.addEventListener('mousemove', onMove);
      canvas.addEventListener('mouseup', (e) => {
        const wasDragging = dragging;
        finishDrag(e);
        if (!wasDragging) onTap(e);
      });
    }

    // Suppress double-tap zoom and long-press menus on the play field.
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /* ------------------------------------------------------------------ */
  /* HUD / game buttons                                                 */
  /* ------------------------------------------------------------------ */

  bindStaticButtons() {
    $('#btn-game-home').addEventListener('click', () => {
      this.audio.sfx('button');
      this.game.stop();
      this.show('home');
    });

    $('#btn-restart').addEventListener('click', () => {
      this.audio.sfx('button');
      const level = this.game.level;
      if (level) this.startPlay(level.id);
    });

    $('#btn-pause').addEventListener('click', () => this.openPause());
    $('#btn-resume').addEventListener('click', () => this.closePause());
    $('#btn-pause-restart').addEventListener('click', () => {
      this.closePause();
      const level = this.game.level;
      if (level) this.startPlay(level.id);
    });
    $('#btn-pause-home').addEventListener('click', () => {
      this.closePause();
      this.game.stop();
      this.show('home');
    });

    $('#btn-help').addEventListener('click', () => {
      if (this.screen !== 'game' || this.game.completed) return;
      this.game.showHint(3200);
      this.audio.sfx('hint');
      this.showToast('Follow the glowing paw prints!');
    });

    $('#btn-auto').addEventListener('click', () => {
      if (this.screen !== 'game' || this.game.completed) return;
      this.game.assist();
    });

    $('#btn-stickers-back').addEventListener('click', () => {
      this.audio.sfx('button');
      this.show('home');
    });

    // Completion actions.
    $('#btn-complete-again').addEventListener('click', () => {
      this.closeComplete();
      const level = this.game.level;
      if (level) this.startPlay(level.id);
    });
    $('#btn-complete-next').addEventListener('click', () => {
      this.closeComplete();
      const current = this.game.level;
      const next = current ? nextLevel(current.id) : null;
      const worldLevels = levelsForWorld(this.progress.world);
      const idx = current ? worldLevels.findIndex((l) => l.id === current.id) : -1;
      const nextInWorld = idx >= 0 ? worldLevels[idx + 1] : null;
      const target = nextInWorld || next;
      if (target) {
        this.progress.setWorld(target.world);
        this.startPlay(target.id);
      } else {
        this.show('home');
      }
    });
    $('#btn-complete-home').addEventListener('click', () => {
      this.closeComplete();
      this.game.stop();
      this.show('home');
    });

    // Sound button in the top bar.
    $('#btn-sound').addEventListener('click', () => this.toggleSound());
  }

  openPause() {
    this.game.paused = true;
    $('#modal-pause').classList.add('is-show');
    this.audio.sfx('button');
  }

  closePause() {
    this.game.paused = false;
    $('#modal-pause').classList.remove('is-show');
  }

  /* ------------------------------------------------------------------ */
  /* Collect / friend / complete                                        */
  /* ------------------------------------------------------------------ */

  handleCollect(type, count, total) {
    this.refreshHud();
    this.progress.recordCollect(type);
    if (count === total && total > 0) {
      this.showToast('You found every treasure!');
    }
  }

  handleFriend(charId) {
    const name = getCharacter(charId)?.name || 'Your friend';
    this.showToast(`${name} found you! Hooray!`);
  }

  handleComplete(result) {
    this.game.paused = true;

    const ch = getCharacter(result.character);
    const level = result.level;

    // Award: character sticker + destination sticker for this world.
    const worldStickerId = {
      pillow: 'pillowfort',
      backyard: 'gardentent',
      toybox: 'toychest',
      adventure: 'escape',
    }[level.world];

    const candidateStickers = [ch.id];
    if (worldStickerId) candidateStickers.push(worldStickerId);
    // Award collectible stickers the child actually found this run.
    const foundTypes = Array.from(this.game.collected);
    for (const item of this.game.board.collectibles) {
      if (foundTypes.includes(item.index) && STICKER_BY_ID[item.type]) {
        candidateStickers.push(item.type);
      }
    }

    const earned = this.progress.completeLevel(level.id, candidateStickers);
    this.pendingStickers = earned;
    this.audio.sync(this.progress);

    // Fill the modal.
    const msg = pick(MESSAGES.complete);
    $('#complete-title').textContent = msg;
    $('#complete-message').textContent = this.petMessage(ch.id);
    $('#complete-stats').textContent = result.total > 0
      ? `You found ${result.collected} of ${result.total} treasures${result.friend ? ' and a friend!' : '!'}`
      : (result.friend ? 'You found your friend!' : 'A wonderful adventure!');

    // Friends row: the helper + any rescued friend.
    const friends = $('#complete-friends');
    friends.innerHTML = '';
    const helperImg = document.createElement('img');
    helperImg.src = Art.petDataURI(ch.id, 'celebrate');
    helperImg.alt = '';
    friends.appendChild(helperImg);
    if (result.friend) {
      const others = CHARACTER_ORDER.filter((c) => c !== ch.id);
      const f = document.createElement('img');
      f.src = Art.petDataURI(others[0], 'celebrate');
      f.alt = '';
      friends.appendChild(f);
    }

    // Sticker award: show the most relevant newly-earned sticker, or a hint.
    const awardImg = $('#sticker-award-img');
    const awardName = $('#sticker-award-name');
    const awardLabel = document.querySelector('.sticker-award-label');
    if (earned.length) {
      const top = STICKER_BY_ID[earned[0]];
      awardImg.src = stickerArtURI(top.art);
      awardImg.alt = top.name;
      awardName.textContent = top.name;
      awardLabel.textContent = earned.length > 1 ? `${earned.length} stickers earned!` : 'Sticker earned!';
      $('#sticker-award').style.display = 'inline-flex';
    } else {
      awardLabel.textContent = 'Great helping!';
      awardImg.src = stickerArtURI(`char:${ch.id}`);
      awardImg.alt = ch.name;
      awardName.textContent = 'You did it!';
      $('#sticker-award').style.display = 'inline-flex';
    }

    // Next button label.
    const nextBtn = $('#btn-complete-next');
    const next = nextLevel(level.id);
    const worldLevels = levelsForWorld(this.progress.world);
    const idx = worldLevels.findIndex((l) => l.id === level.id);
    const hasNext = Boolean(worldLevels[idx + 1] || next);
    nextBtn.style.display = hasNext ? '' : 'none';

    $('#modal-complete').classList.add('is-show');
    this.launchConfetti();
    this.audio.sfx('celebrate');
  }

  petMessage(charId) {
    const list = MESSAGES.pet[charId] || MESSAGES.complete;
    return pick(list);
  }

  closeComplete() {
    $('#modal-complete').classList.remove('is-show');
    this.clearConfetti();
    this.game.paused = false;
  }

  launchConfetti() {
    const box = $('#confetti');
    box.innerHTML = '';
    const colors = ['#ff8fb5', '#ffd84d', '#7ce3a8', '#8fdcff', '#c9a7ff', '#ff9f5c'];
    for (let i = 0; i < 40; i += 1) {
      const s = document.createElement('span');
      s.style.left = `${Math.random() * 100}%`;
      s.style.background = colors[i % colors.length];
      s.style.animationDuration = `${1.8 + Math.random() * 1.6}s`;
      s.style.animationDelay = `${Math.random() * 0.6}s`;
      s.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(s);
    }
    setTimeout(() => { box.innerHTML = ''; }, 3800);
  }

  clearConfetti() {
    $('#confetti').innerHTML = '';
  }

  /* ------------------------------------------------------------------ */
  /* Sticker book                                                       */
  /* ------------------------------------------------------------------ */

  renderStickerBook() {
    const grid = $('#sticker-grid');
    grid.innerHTML = '';
    let count = 0;
    for (const sticker of STICKERS) {
      const owned = this.progress.hasSticker(sticker.id);
      if (owned) count += 1;
      const cell = document.createElement('div');
      cell.className = `sticker-cell${owned ? '' : ' is-locked'}`;
      const img = document.createElement('img');
      img.src = stickerArtURI(sticker.art);
      img.alt = '';
      const name = document.createElement('span');
      name.className = 'sticker-name';
      name.textContent = owned ? sticker.name : sticker.name;
      cell.title = owned ? sticker.name : sticker.hint;
      cell.appendChild(img);
      cell.appendChild(name);
      grid.appendChild(cell);
    }
    $('#sticker-count').textContent = `${count} / ${STICKERS.length}`;
  }

  /* ------------------------------------------------------------------ */
  /* Settings                                                           */
  /* ------------------------------------------------------------------ */

  setupSettings() {
    const s = this.progress.settings;

    const bindSwitch = (id, key) => {
      const el = $(id);
      el.setAttribute('aria-checked', String(s[key] !== false));
      el.addEventListener('click', () => {
        const next = el.getAttribute('aria-checked') !== 'true';
        el.setAttribute('aria-checked', String(next));
        this.progress.setSetting(key, next);
        this.audio.sync(this.progress);
        this.applySoundState();
        this.audio.sfx('button');
        if (key === 'sound') this.syncSoundSwitch(el);
      });
    };
    bindSwitch('#set-sound', 'sound');
    bindSwitch('#set-music', 'music');
    bindSwitch('#set-sfx', 'sfx');

    const bindSlider = (id, key) => {
      const el = $(id);
      el.value = String(s[key]);
      el.addEventListener('input', () => {
        this.progress.setSetting(key, Number(el.value));
        this.audio.sync(this.progress);
      });
      el.addEventListener('change', () => this.audio.sfx('button'));
    };
    bindSlider('#set-music-volume', 'musicVolume');
    bindSlider('#set-sfx-volume', 'sfxVolume');

    // Speed segmented control.
    const speedWrap = $('#set-speed');
    const markSpeed = () => {
      Array.from(speedWrap.children).forEach((b) => {
        b.classList.toggle('is-active', b.dataset.value === this.progress.settings.speed);
      });
    };
    Array.from(speedWrap.children).forEach((b) => {
      b.addEventListener('click', () => {
        this.progress.setSetting('speed', b.dataset.value);
        this.game.setSpeedSetting(b.dataset.value);
        this.audio.sfx('button');
        markSpeed();
      });
    });
    markSpeed();

    $('#btn-settings-close').addEventListener('click', () => this.closeSettings());

    let resetArmed = false;
    const resetBtn = $('#btn-reset-progress');
    const hint = $('#reset-hint');
    resetBtn.addEventListener('click', () => {
      if (!resetArmed) {
        resetArmed = true;
        resetBtn.textContent = 'Tap again to really reset';
        hint.textContent = 'This clears all stickers and finished adventures.';
        clearTimeout(this._resetTimer);
        this._resetTimer = setTimeout(() => {
          resetArmed = false;
          resetBtn.textContent = 'Reset all progress';
          hint.textContent = 'Stickers and finished adventures will be cleared.';
        }, 4000);
        return;
      }
      this.progress.reset();
      resetArmed = false;
      resetBtn.textContent = 'Reset all progress';
      hint.textContent = 'All progress cleared.';
      this.audio.sync(this.progress);
      this.renderCharacterRow();
      this.renderWorldRow();
      this.renderDifficultyRow();
      this.refreshHomeSummary();
      this.applySoundState();
      this.syncAllSettingInputs();
      this.showAppToast('Progress reset. A fresh adventure awaits!');
    });
  }

  syncAllSettingInputs() {
    const s = this.progress.settings;
    $('#set-sound').setAttribute('aria-checked', String(s.sound !== false));
    $('#set-music').setAttribute('aria-checked', String(s.music !== false));
    $('#set-sfx').setAttribute('aria-checked', String(s.sfx !== false));
    $('#set-music-volume').value = String(s.musicVolume);
    $('#set-sfx-volume').value = String(s.sfxVolume);
    const speedWrap = $('#set-speed');
    Array.from(speedWrap.children).forEach((b) => {
      b.classList.toggle('is-active', b.dataset.value === s.speed);
    });
  }

  syncSoundSwitch(el) {
    if (el) el.setAttribute('aria-checked', String(this.progress.settings.sound !== false));
  }

  openSettings() {
    this.audio.unlock();
    this.syncAllSettingInputs();
    $('#modal-settings').classList.add('is-show');
    this.audio.sfx('button');
  }

  closeSettings() {
    $('#modal-settings').classList.remove('is-show');
    this.audio.sfx('button');
  }

  toggleSound() {
    const on = !this.progress.settings.sound;
    this.progress.setSetting('sound', on);
    this.audio.unlock();
    this.audio.sync(this.progress);
    this.applySoundState();
    const sw = $('#set-sound');
    this.syncSoundSwitch(sw);
    if (on) this.audio.sfx('button');
    this.showAppToast(on ? 'Sound on' : 'Sound off');
  }

  /* ------------------------------------------------------------------ */
  /* Toasts                                                             */
  /* ------------------------------------------------------------------ */

  showToast(msg) {
    const el = $('#game-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove('is-show'), 2200);
  }

  showAppToast(msg) {
    const el = $('#app-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(this.appToastTimer);
    this.appToastTimer = setTimeout(() => el.classList.remove('is-show'), 1900);
  }

  /* ------------------------------------------------------------------ */
  /* Resize                                                             */
  /* ------------------------------------------------------------------ */

  setupResize() {
    const handler = () => {
      if (this.screen === 'game') this.resizeCanvas();
    };
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', () => setTimeout(handler, 250));
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handler);
    }
  }

  resizeCanvas() {
    if (!this.playfield) return;
    const rect = this.playfield.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    if (w > 0 && h > 0) {
      this.renderer.resize(w, h);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Pause on tab hide                                                  */
  /* ------------------------------------------------------------------ */

  handleVisibility() {
    if (document.hidden && this.screen === 'game' && !this.game.completed) {
      this.openPause();
    }
  }
}