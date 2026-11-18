/**
 * Save data for Ghosty, Spin, and Oakley's Great Escape.
 *
 * Everything stays in the browser on this device — no accounts, no personal
 * information, no network calls. A grown-up can reset it from Settings.
 */

import {
  CHARACTER_ORDER,
  DEFAULT_PROGRESS,
  DIFFICULTIES,
  STICKER_BY_ID,
  STORAGE_KEY,
  WORLD_ORDER,
} from './config.js';

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readStorage() {
  try {
    return window.localStorage?.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function writeStorage(value) {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function cloneDefault() {
  return JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
}

function num(value, fallback, min = 0, max = 1) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

export class Progress {
  constructor() {
    this.state = this.load();
  }

  load() {
    const stored = safeParse(readStorage());
    if (!stored || typeof stored !== 'object') return cloneDefault();

    const base = cloneDefault();
    const merged = {
      ...base,
      ...stored,
      character: CHARACTER_ORDER.includes(stored.character) ? stored.character : base.character,
      world: WORLD_ORDER.includes(stored.world) ? stored.world : base.world,
      difficulty: DIFFICULTIES[stored.difficulty] ? stored.difficulty : base.difficulty,
      settings: isPlainObject(stored.settings) ? { ...base.settings, ...stored.settings } : { ...base.settings },
      stickers: isPlainObject(stored.stickers) ? stored.stickers : {},
      completed: isPlainObject(stored.completed) ? stored.completed : {},
      collected: isPlainObject(stored.collected) ? stored.collected : {},
    };
    merged.settings.musicVolume = num(merged.settings.musicVolume, base.settings.musicVolume);
    merged.settings.sfxVolume = num(merged.settings.sfxVolume, base.settings.sfxVolume);
    return merged;
  }

  save() {
    return writeStorage(this.state);
  }

  get settings() {
    return this.state.settings;
  }

  get character() {
    return this.state.character;
  }

  get world() {
    return this.state.world;
  }

  get difficulty() {
    return this.state.difficulty;
  }

  setCharacter(id) {
    if (!CHARACTER_ORDER.includes(id)) return;
    this.state.character = id;
    this.save();
  }

  setWorld(id) {
    if (!WORLD_ORDER.includes(id)) return;
    this.state.world = id;
    this.save();
  }

  setDifficulty(id) {
    if (!DIFFICULTIES[id]) return;
    this.state.difficulty = id;
    this.save();
  }

  setSetting(key, value) {
    this.state.settings[key] = value;
    this.save();
  }

  isCompleted(levelId) {
    return Boolean(this.state.completed[levelId]);
  }

  completedCount() {
    return Object.keys(this.state.completed).length;
  }

  /** Record a finished level and award its sticker. Returns newly-earned ids. */
  completeLevel(levelId, stickerIds = []) {
    const earned = [];
    if (!this.state.completed[levelId]) {
      this.state.completed[levelId] = { at: Date.now() };
    }
    for (const id of stickerIds) {
      if (!STICKER_BY_ID[id]) continue;
      if (!this.state.stickers[id]) {
        this.state.stickers[id] = { at: Date.now() };
        earned.push(id);
      }
    }
    this.state.lastPlayed = levelId;
    this.save();
    return earned;
  }

  hasSticker(id) {
    return Boolean(this.state.stickers[id]);
  }

  stickerCount() {
    return Object.keys(this.state.stickers).length;
  }

  /** Record an optional collectible find (for the sticker book + stats). */
  recordCollect(type) {
    if (!type) return;
    this.state.collected[type] = (this.state.collected[type] || 0) + 1;
    this.save();
  }

  reset() {
    this.state = cloneDefault();
    this.save();
  }
}