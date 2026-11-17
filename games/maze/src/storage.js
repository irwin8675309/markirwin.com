/**
 * Save data for Maze Adventures. Everything stays in the browser on this
 * device — no accounts, no personal information, no network calls.
 */

import {
  CHARACTERS,
  DEFAULT_PROGRESS,
  DIFFICULTIES,
  SPEED_SETTINGS,
  STICKERS,
  STICKER_BY_ID,
  STORAGE_KEY,
  WORLDS,
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

function cloneDefault() {
  return JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
}

function num(value, fallback, min = 0, max = 1) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export class Progress {
  constructor() {
    this.state = this.load();
  }

  load() {
    const stored = safeParse(readStorage());
    if (!stored || typeof stored !== 'object') return cloneDefault();

    const base = cloneDefault();
    const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
    const merged = {
      ...base,
      ...stored,
      settings: isPlainObject(stored.settings) ? { ...base.settings, ...stored.settings } : { ...base.settings },
      stickers: isPlainObject(stored.stickers) ? stored.stickers : {},
      completed: isPlainObject(stored.completed) ? stored.completed : {},
      totalCollected: isPlainObject(stored.totalCollected) ? stored.totalCollected : {},
    };

    if (!CHARACTERS[merged.selectedCharacter]) merged.selectedCharacter = 'ghosty';
    if (!WORLDS[merged.world]) merged.world = 'garden';
    if (!DIFFICULTIES[merged.difficulty]) merged.difficulty = 'easy';
    merged.findFriend = Boolean(merged.findFriend);

    const s = merged.settings;
    s.sound = s.sound !== false;
    s.music = s.music !== false;
    s.sfx = s.sfx !== false;
    s.musicVolume = num(s.musicVolume, 0.55);
    s.sfxVolume = num(s.sfxVolume, 0.75);
    if (!['buttons', 'swipe', 'both'].includes(s.controls)) s.controls = 'both';
    if (!SPEED_SETTINGS[s.speed]) s.speed = 'normal';

    // Drop any sticker ids that are not in the current sticker book.
    const stickers = {};
    for (const [id, count] of Object.entries(merged.stickers)) {
      if (STICKER_BY_ID[id] && Number.isFinite(count) && count > 0) stickers[id] = Math.floor(count);
    }
    merged.stickers = stickers;

    return merged;
  }

  save() {
    try {
      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* Private mode or full storage should never stop play. */
    }
  }

  get settings() { return this.state.settings; }
  get selectedCharacter() { return this.state.selectedCharacter; }
  get world() { return this.state.world; }
  get difficulty() { return this.state.difficulty; }
  get findFriend() { return this.state.findFriend; }

  setCharacter(id) {
    if (!CHARACTERS[id]) return;
    this.state.selectedCharacter = id;
    this.save();
  }

  setWorld(id) {
    if (!WORLDS[id]) return;
    this.state.world = id;
    this.save();
  }

  setDifficulty(id) {
    if (!DIFFICULTIES[id]) return;
    this.state.difficulty = id;
    this.save();
  }

  setFindFriend(on) {
    this.state.findFriend = Boolean(on);
    this.save();
  }

  setSetting(key, value) {
    const s = this.state.settings;
    if (key === 'sound' || key === 'music' || key === 'sfx') s[key] = Boolean(value);
    else if (key === 'musicVolume' || key === 'sfxVolume') s[key] = num(value, s[key]);
    else if (key === 'controls' && ['buttons', 'swipe', 'both'].includes(value)) s.controls = value;
    else if (key === 'speed' && SPEED_SETTINGS[value]) s.speed = value;
    else return false;
    this.save();
    return true;
  }

  toggleSetting(key) {
    const next = !this.state.settings[key];
    this.setSetting(key, next);
    return next;
  }

  recordCompletion(worldId, difficultyId) {
    const world = WORLDS[worldId] ? worldId : 'garden';
    const diff = DIFFICULTIES[difficultyId] ? difficultyId : 'easy';
    if (!this.state.completed[world]) this.state.completed[world] = {};
    this.state.completed[world][diff] = (this.state.completed[world][diff] || 0) + 1;
    this.state.lastPlayed = { world, difficulty: diff, at: Date.now() };
    this.save();
  }

  addCollected(type, amount = 1) {
    this.state.totalCollected[type] = (this.state.totalCollected[type] || 0) + amount;
    this.save();
  }

  ownsSticker(id) {
    return Boolean(this.state.stickers[id]);
  }

  get stickerCount() {
    return Object.keys(this.state.stickers).length;
  }

  get totalStickers() {
    return STICKERS.length;
  }

  get stickerList() {
    return Object.entries(this.state.stickers).map(([id, count]) => ({
      sticker: STICKER_BY_ID[id],
      count,
    })).filter((entry) => entry.sticker);
  }

  /**
   * Award one sticker. Prefers stickers from the world just played, then any
   * uncollected sticker, then a random duplicate. Always returns something
   * celebratory — there are no empty rewards.
   */
  awardSticker(worldId) {
    const owned = new Set(Object.keys(this.state.stickers));
    const unowned = STICKERS.filter((s) => !owned.has(s.id));
    let sticker;
    if (unowned.length) {
      const local = unowned.filter((s) => s.world === worldId);
      const pool = local.length ? local : unowned;
      sticker = pool[Math.floor(Math.random() * pool.length)];
    } else {
      sticker = STICKERS[Math.floor(Math.random() * STICKERS.length)];
    }
    this.state.stickers[sticker.id] = (this.state.stickers[sticker.id] || 0) + 1;
    this.save();
    return sticker;
  }

  reset() {
    this.state = cloneDefault();
    this.save();
  }
}