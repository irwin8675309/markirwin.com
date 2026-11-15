import { Art, THEMES } from './art.js?v=18';
import { LEVELS, LEVEL_BY_ID, PETS, RESCUE_COPY } from './config.js?v=18';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const SPEAKER_ON = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 25h9l13-10v34L21 39h-9z" fill="currentColor"/><path d="M43 22c5 5 5 15 0 20" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M50 15c9 9 9 25 0 34" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`;
const SPEAKER_OFF = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 25h9l13-10v34L21 39h-9z" fill="currentColor"/><path d="M43 20l12 24M55 20L43 44" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`;

function lockSVG() {
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="27" width="36" height="27" rx="8" fill="currentColor"/><path d="M22 27v-6a10 10 0 0120 0v6" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>`;
}

export class UI {
  constructor(game, progress, audio) {
    this.game = game;
    this.progress = progress;
    this.audio = audio;
    this.currentScreen = 'loading';
    this.petsBack = 'menu';
    this.activeLevel = null;
    this.toastTimer = null;
    this.resetFrame = null;
    this.completePayload = null;
    this.transitioning = false;
    this.ready = false;

    this.screens = {
      loading: $('#screen-loading'),
      menu: $('#screen-menu'),
      pets: $('#screen-pets'),
      map: $('#screen-map'),
      sanctuary: $('#screen-sanctuary'),
    };
    this.hud = $('#game-hud');
    this.modalPause = $('#modal-pause');
    this.modalComplete = $('#modal-complete');
    this.modalParent = $('#modal-parent');
    this.rescuePrompt = $('#rescue-prompt');
    this.toast = $('#game-toast');
    this.wipe = $('#fade-wipe');

    this.petCards = $('#pet-cards');
    this.levelGrid = $('#level-grid');
    this.sanctuaryGrid = $('#sanctuary-grid');
    this.pausePets = $('#pause-pets');

    this.buildStaticUI();
    this.bindEvents();
    this.updateSoundUI();
    this.updateMenuPetImages();
    this.updateHUDPet();
    this.renderPausePets();
    this.renderSanctuary();
  }

  buildStaticUI() {
    $('#menu-ghosty').src = Art.petDataURI('ghosty', 'idle');
    $('#menu-spin').src = Art.petDataURI('spin', 'idle');
    $('#menu-oakley').src = Art.petDataURI('oakley', 'idle');

    for (const pet of Object.values(PETS)) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'pet-card';
      card.dataset.pet = pet.id;
      card.style.setProperty('--card-accent', pet.accent);
      card.style.setProperty('--card-dark', pet.accentDark);
      card.style.setProperty('--card-glow', pet.glow);
      card.setAttribute('aria-label', `Choose ${pet.name}`);
      card.innerHTML = `
        <img src="${Art.petDataURI(pet.id, 'idle')}" alt="${pet.name}" />
        <div class="pet-name">${pet.name}</div>
        <div class="pet-personality">${pet.personality}</div>`;
      card.addEventListener('click', () => this.selectPet(pet.id, true));
      this.petCards.appendChild(card);
    }

    this.selectPet(this.progress.selectedPet, false);
  }

  bindEvents() {
    $('#btn-play').addEventListener('click', () => this.openPets('menu'));
    $('#btn-choose-pet').addEventListener('click', () => this.openPets('menu'));
    $('#btn-pets-go').addEventListener('click', () => this.goMap());
    $('#btn-map-pet').addEventListener('click', () => this.openPets('map'));
    $('#btn-sanctuary').addEventListener('click', () => this.openSanctuary());
    $('#btn-parents').addEventListener('click', () => this.openParent());
    $('#btn-parent-close').addEventListener('click', () => this.closeParent());
    $('#btn-reset-hold').addEventListener('pointerdown', (event) => this.startResetHold(event));
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((name) => {
      $('#btn-reset-hold').addEventListener(name, () => this.cancelResetHold());
    });
    $('#btn-reset-hold').addEventListener('contextmenu', (event) => event.preventDefault());

    $('#btn-music').addEventListener('click', () => this.toggleMusic());
    $('#btn-sfx').addEventListener('click', () => this.toggleSfx());
    $('#btn-hud-music').addEventListener('click', () => this.toggleMusic());
    $('#btn-pause').addEventListener('click', () => this.openPause());
    $('#btn-resume').addEventListener('click', () => this.closePause());
    $('#btn-pause-home').addEventListener('click', () => {
      this.closePause();
      this.goMenu();
    });
    $('#btn-complete-next').addEventListener('click', () => this.continueAfterComplete());
    $('#btn-complete-home').addEventListener('click', () => this.goMenu());
    $('#btn-rescue').addEventListener('pointerdown', (event) => {
      event.preventDefault();
      const scene = this.game.scene.getScene('Adventure');
      if (scene?.completeRescue) scene.completeRescue();
    });

    $('#btn-jump').addEventListener('pointerdown', (event) => {
      event.preventDefault();
      const scene = this.game.scene.getScene('Adventure');
      scene?.tryJump?.();
    });

    $$('.back-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const screen = button.closest('.screen');
        if (screen?.id === 'screen-pets') {
          if (this.petsBack === 'map') this.goMap();
          else this.goMenu();
          return;
        }
        if (screen?.id === 'screen-map') {
          this.goMenu();
          return;
        }
        this.goMenu();
      });
    });

    this.game.events.on('pets:ready', () => {
      this.ready = true;
      this.setWorldBackdrop('meadow');
      this.showScreen('menu');
      this.audio.setTheme('meadow');
    });
    this.game.events.on('pets:loading', () => {});
    this.game.events.on('pets:collect', (data) => this.updateHUD(data.count));
    this.game.events.on('pets:progress', (ratio) => this.setProgress(ratio));
    this.game.events.on('pets:toast', (text) => this.showToast(text));
    this.game.events.on('pets:rescue-offer', (data) => this.showRescue(data));
    this.game.events.on('pets:rescue-complete', () => this.hideRescue());
    this.game.events.on('pets:complete', (data) => this.showComplete(data));
    this.game.events.on('pets:level-start', () => {
      this.updateHUD(0);
      this.setProgress(0);
      this.updateHUDPet();
    });

    const unlock = () => {
      this.audio.unlock();
      if (this.currentScreen === 'menu' || this.currentScreen === 'map' || this.currentScreen === 'pets') {
        this.audio.setTheme('meadow');
      }
    };
    document.addEventListener('pointerdown', unlock, { capture: true, once: true });
    document.addEventListener('keydown', unlock, { capture: true, once: true });
    document.addEventListener('click', (event) => {
      const button = event.target.closest?.('button');
      if (button && !button.classList.contains('jump-btn') && !button.classList.contains('danger-btn')) {
        this.audio.sfx('button');
      }
    });
    document.addEventListener('contextmenu', (event) => {
      if (!event.target.closest('input')) event.preventDefault();
    });

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape' && this.hud.classList.contains('is-active') && !this.modalPause.classList.contains('is-visible') && !this.modalComplete.classList.contains('is-visible')) {
        this.openPause();
      }
    });
  }

  /* ----------------------------- navigation ----------------------------- */

  showScreen(name) {
    for (const [key, screen] of Object.entries(this.screens)) {
      const active = key === name;
      screen.classList.toggle('is-active', active);
      screen.setAttribute('aria-hidden', String(!active));
    }
    this.currentScreen = name;
    if (name !== 'loading') {
      this.hud.classList.remove('is-active');
      this.hud.setAttribute('aria-hidden', 'true');
      this.hideModals();
      this.hideRescue();
    }
  }

  showGameHUD() {
    for (const screen of Object.values(this.screens)) {
      screen.classList.remove('is-active');
      screen.setAttribute('aria-hidden', 'true');
    }
    this.currentScreen = 'game';
    this.hud.classList.add('is-active');
    this.hud.setAttribute('aria-hidden', 'false');
    this.hideModals();
    this.hideRescue();
  }

  setWorldBackdrop(theme = 'meadow') {
    const palette = THEMES[theme] || THEMES.meadow;
    const root = document.documentElement;
    root.style.setProperty('--world-sky', palette.sky[0]);
    root.style.setProperty('--world-mid', palette.sky[1]);
    root.style.setProperty('--world-ground', palette.ground[0]);
  }

  openPets(back = 'menu') {
    this.petsBack = back;
    this.selectPet(this.progress.selectedPet, false);
    this.showScreen('pets');
  }

  goMap() {
    this.renderLevelGrid();
    this.updateMapPet();
    this.showScreen('map');
  }

  goMenu() {
    this.cancelResetHold();
    this.hideRescue();
    this.closeParent();
    if (this.game.scene.isActive('Adventure') || this.game.scene.isPaused('Adventure')) {
      this.game.scene.stop('Adventure');
    }
    if (!this.game.scene.isActive('Menu')) this.game.scene.start('Menu');
    this.activeLevel = null;
    this.audio?.setTheme('meadow');
    this.setWorldBackdrop('meadow');
    this.showScreen('menu');
  }

  startLevel(levelId) {
    const level = LEVEL_BY_ID[levelId];
    if (!level || !this.progress.isUnlocked(levelId)) return;
    this.withWipe(() => {
      if (this.game.scene.isActive('Menu')) this.game.scene.stop('Menu');
      if (this.game.scene.isActive('Adventure') || this.game.scene.isPaused('Adventure')) {
        this.game.scene.stop('Adventure');
      }
      this.activeLevel = levelId;
      this.audio?.setTheme(level.theme);
      this.setWorldBackdrop(level.theme);
      this.game.scene.start('Adventure', { levelId, petId: this.progress.selectedPet });
      this.showGameHUD();
      this.updateHUD(0);
      this.setProgress(0);
      this.updateHUDPet();
    });
  }

  openSanctuary() {
    this.renderSanctuary();
    this.showScreen('sanctuary');
  }

  withWipe(callback) {
    if (this.transitioning) return;
    this.transitioning = true;
    if (!this.wipe) {
      callback();
      this.transitioning = false;
      return;
    }
    this.wipe.classList.add('is-on');
    window.setTimeout(() => {
      callback();
      window.setTimeout(() => {
        this.wipe.classList.remove('is-on');
        this.transitioning = false;
      }, 70);
    }, 240);
  }

  /* ------------------------------- pets --------------------------------- */

  selectPet(petId, animate = false) {
    if (!PETS[petId]) return;
    this.progress.selectPet(petId);
    for (const card of this.petCards.children) {
      card.classList.toggle('is-selected', card.dataset.pet === petId);
    }
    this.updateHUDPet();
    this.renderPausePets();
    if (animate) {
      const card = [...this.petCards.children].find((item) => item.dataset.pet === petId);
      if (card) {
        card.classList.remove('is-selected');
        void card.offsetWidth;
        card.classList.add('is-selected');
      }
      this.audio?.sfx('collect');
    }
  }

  updateMenuPetImages() {
    for (const pet of Object.values(PETS)) {
      const image = $(`#menu-${pet.id}`);
      if (image) image.src = Art.petDataURI(pet.id, 'idle');
    }
  }

  updateHUDPet() {
    const pet = PETS[this.progress.selectedPet] || PETS.ghosty;
    const hud = $('#hud-pet-img');
    const map = $('#map-pet-img');
    if (hud) hud.src = Art.petDataURI(pet.id, 'idle');
    if (map) map.src = Art.petDataURI(pet.id, 'idle');
    this.renderPausePets();
  }

  updateMapPet() {
    const pet = PETS[this.progress.selectedPet] || PETS.ghosty;
    const image = $('#map-pet-img');
    if (image) image.src = Art.petDataURI(pet.id, 'idle');
  }

  renderPausePets() {
    if (!this.pausePets) return;
    this.pausePets.innerHTML = '';
    for (const pet of Object.values(PETS)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pause-pet' + (this.progress.selectedPet === pet.id ? ' is-active' : '');
      button.setAttribute('aria-label', `Play as ${pet.name}`);
      button.innerHTML = `<img src="${Art.petDataURI(pet.id, 'idle')}" alt="${pet.name}" />`;
      button.addEventListener('click', () => {
        this.progress.selectPet(pet.id);
        const scene = this.game.scene.getScene('Adventure');
        scene?.changePet?.(pet.id);
        this.updateHUDPet();
        this.renderPausePets();
      });
      this.pausePets.appendChild(button);
    }
  }

  /* ------------------------------- levels ------------------------------- */

  renderLevelGrid() {
    this.levelGrid.innerHTML = '';
    let currentAssigned = false;
    for (const level of LEVELS) {
      const unlocked = this.progress.isUnlocked(level.id);
      const completed = this.progress.isCompleted(level.id);
      const current = unlocked && !completed && !currentAssigned;
      if (current) currentAssigned = true;
      const palette = THEMES[level.theme];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'level-card' + (unlocked ? '' : ' is-locked') + (current ? ' is-current' : '');
      card.style.setProperty('--level-a', palette.sky[0]);
      card.style.setProperty('--level-b', palette.sky[2]);
      card.setAttribute('aria-label', unlocked ? `Play ${level.name}` : `${level.name} is locked`);
      card.innerHTML = `
        <img class="level-thumb" src="${Art.thumbDataURI(level.theme)}" alt="" />
        <div class="level-content">
          <div class="level-name">${level.name}</div>
          <div class="level-stars">${completed ? '★★★' : unlocked ? '★' : ''}</div>
        </div>
        ${unlocked ? '' : `<span class="level-badge">${lockSVG()}</span>`}`;
      card.addEventListener('click', () => {
        if (!unlocked) {
          card.classList.remove('nudge');
          void card.offsetWidth;
          card.classList.add('nudge');
          this.audio?.sfx('pop');
          return;
        }
        this.startLevel(level.id);
      });
      this.levelGrid.appendChild(card);
    }
  }

  /* ----------------------------- sanctuary ------------------------------ */

  renderSanctuary() {
    const entries = this.progress.sanctuary;
    const unique = new Map();
    for (const entry of entries) {
      const item = unique.get(entry.type) || { type: entry.type, count: 0 };
      item.count += 1;
      unique.set(entry.type, item);
    }
    $('#sanctuary-count').textContent = unique.size
      ? `${unique.size} friend${unique.size === 1 ? '' : 's'} helped`
      : 'Friends you help will live here';

    this.sanctuaryGrid.innerHTML = '';
    if (!unique.size) {
      const empty = document.createElement('div');
      empty.className = 'sanctuary-empty';
      empty.innerHTML = `<div class="empty-hearts">♥ ♥ ♥</div>
        <div>Your sanctuary is waiting for little friends.</div>`;
      this.sanctuaryGrid.appendChild(empty);
      return;
    }

    for (const item of unique.values()) {
      const animal = Art.ANIMALS[item.type];
      if (!animal) continue;
      const card = document.createElement('div');
      card.className = 'animal-card';
      card.innerHTML = `<img src="${Art.animalDataURI(item.type)}" alt="${animal.name}" />
        <div class="animal-name">${animal.name}${item.count > 1 ? ` ×${item.count}` : ''}</div>`;
      this.sanctuaryGrid.appendChild(card);
    }
  }

  /* -------------------------------- HUD --------------------------------- */

  updateHUD(count = 0) {
    const element = $('#hud-count');
    if (!element) return;
    element.textContent = String(count);
    element.parentElement.classList.remove('is-pop');
    void element.parentElement.offsetWidth;
    element.parentElement.classList.add('is-pop');
  }

  setProgress(ratio = 0) {
    const clamped = Math.max(0, Math.min(1, ratio));
    $('#progress-fill').style.width = `${clamped * 100}%`;
    $('#progress-paw').style.left = `${clamped * 100}%`;
  }

  showRescue(data) {
    const type = data?.type;
    const animal = Art.ANIMALS[type];
    if (!animal) return;
    $('#rescue-img').src = Art.animalDataURI(type);
    this.rescuePrompt.classList.add('is-visible');
    this.rescuePrompt.setAttribute('aria-hidden', 'false');
    $('#btn-jump').classList.add('is-waiting');
    const copy = RESCUE_COPY[type];
    this.showToast(copy?.greeting || 'A little friend needs help!');
  }

  hideRescue() {
    this.rescuePrompt?.classList.remove('is-visible');
    this.rescuePrompt?.setAttribute('aria-hidden', 'true');
    $('#btn-jump').classList.remove('is-waiting');
  }

  showToast(text, duration = 1500) {
    if (!text) return;
    this.toast.textContent = text;
    this.toast.classList.add('is-visible');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.classList.remove('is-visible');
      this.toastTimer = null;
    }, duration);
  }

  /* ------------------------------ modals -------------------------------- */

  openPause() {
    this.renderPausePets();
    this.game.scene.pause('Adventure');
    this.openModal(this.modalPause);
  }

  closePause() {
    this.closeModal(this.modalPause);
    if (this.game.scene.isPaused('Adventure')) this.game.scene.resume('Adventure');
  }

  openParent() {
    this.openModal(this.modalParent);
  }

  closeParent() {
    this.cancelResetHold();
    this.closeModal(this.modalParent);
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.add('is-visible');
    modal.setAttribute('aria-hidden', 'false');
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'true');
  }

  hideModals() {
    this.closeModal(this.modalPause);
    this.closeModal(this.modalComplete);
    this.closeModal(this.modalParent);
  }

  showComplete(data) {
    this.completePayload = data;
    const level = LEVEL_BY_ID[data.levelId] || LEVELS[0];
    const pet = PETS[data.petId] || PETS.ghosty;
    this.progress.completeLevel(level.id);
    this.renderLevelGrid();
    this.updateMapPet();
    $('#complete-pet').textContent = pet.name;
    $('#complete-pet-img').src = Art.petDataURI(pet.id, 'celebrate');
    this.openModal(this.modalComplete);
  }

  continueAfterComplete() {
    const data = this.completePayload;
    this.closeModal(this.modalComplete);
    if (!data) {
      this.goMap();
      return;
    }
    const index = LEVELS.findIndex((level) => level.id === data.levelId);
    const next = LEVELS[index + 1];
    if (next && this.progress.isUnlocked(next.id)) {
      this.startLevel(next.id);
    } else {
      this.goMap();
    }
  }

  /* ------------------------------ settings ------------------------------ */

  toggleMusic() {
    const on = this.progress.toggleSetting('music');
    this.audio.setMusic(on);
    this.updateSoundUI();
  }

  toggleSfx() {
    const on = this.progress.toggleSetting('sfx');
    this.audio.setSfx(on);
    this.updateSoundUI();
  }

  updateSoundUI() {
    const music = this.progress.settings.music;
    const sfx = this.progress.settings.sfx;
    const musicButtons = [$('#btn-music'), $('#btn-hud-music')];
    for (const button of musicButtons) {
      if (!button) continue;
      button.innerHTML = music ? SPEAKER_ON : SPEAKER_OFF;
      button.classList.toggle('is-off', !music);
      button.setAttribute('aria-pressed', String(music));
      button.setAttribute('aria-label', music ? 'Turn music off' : 'Turn music on');
    }
    const sfxButton = $('#btn-sfx');
    if (sfxButton) {
      sfxButton.innerHTML = sfx ? SPEAKER_ON : SPEAKER_OFF;
      sfxButton.classList.toggle('is-off', !sfx);
      sfxButton.setAttribute('aria-pressed', String(sfx));
      sfxButton.setAttribute('aria-label', sfx ? 'Turn sound effects off' : 'Turn sound effects on');
    }
  }

  /* ----------------------------- parent reset --------------------------- */

  startResetHold(event) {
    event.preventDefault();
    this.cancelResetHold();
    const button = $('#btn-reset-hold');
    const fill = $('#reset-fill');
    const start = performance.now();
    const duration = 2300;
    const step = (now) => {
      const ratio = Math.min(1, (now - start) / duration);
      if (fill) fill.style.width = `${ratio * 100}%`;
      if (ratio >= 1) {
        this.resetProgress();
        return;
      }
      this.resetFrame = requestAnimationFrame(step);
    };
    this.resetFrame = requestAnimationFrame(step);
    button?.classList.add('is-holding');
  }

  cancelResetHold() {
    if (this.resetFrame) cancelAnimationFrame(this.resetFrame);
    this.resetFrame = null;
    const fill = $('#reset-fill');
    if (fill) fill.style.width = '0%';
    $('#btn-reset-hold')?.classList.remove('is-holding');
  }

  resetProgress() {
    this.cancelResetHold();
    this.progress.reset();
    this.audio.sync(this.progress);
    this.audio.stopMusic();
    this.audio.setTheme('meadow');
    this.closeParent();
    this.updateSoundUI();
    this.selectPet(this.progress.selectedPet, false);
    this.renderLevelGrid();
    this.renderSanctuary();
    this.showToast('Progress reset');
    this.audio?.sfx('unlock');
    this.goMenu();
  }
}