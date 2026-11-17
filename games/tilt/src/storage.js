/**
 * Local save data. Everything stays on the device - no accounts, no network.
 */
import {
  SAVE_DEFAULTS,
  SETTINGS_DEFAULTS,
  STORAGE_KEY,
  STICKERS,
  WORLD_ORDER,
  DIFF_ORDER,
} from './config.js';

let storageOK = true;
try {
  const probe = '__pta_probe__';
  window.localStorage.setItem(probe, '1');
  window.localStorage.removeItem(probe);
} catch (err) {
  storageOK = false;
}

function deepMerge(base, extra) {
  if (!extra || typeof extra !== 'object') return { ...base };
  const out = { ...base };
  for (const key of Object.keys(base)) {
    const b = base[key];
    const e = extra[key];
    if (b && typeof b === 'object' && !Array.isArray(b)) {
      out[key] = deepMerge(b, e);
    } else if (e !== undefined && typeof e === typeof b) {
      out[key] = e;
    } else if (Array.isArray(b) && Array.isArray(e)) {
      out[key] = e.slice();
    }
  }
  return out;
}

function defaults() {
  return JSON.parse(JSON.stringify(SAVE_DEFAULTS));
}

export const save = {
  available: storageOK,
  data: defaults(),
};

export function loadSave() {
  if (!storageOK) return save.data;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return save.data;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return save.data;

    const merged = deepMerge(defaults(), parsed);
    merged.settings = deepMerge({ ...SETTINGS_DEFAULTS }, parsed.settings || {});
    if (!WORLD_ORDER.includes(merged.selectedWorld)) merged.selectedWorld = 'garden';
    if (!DIFF_ORDER.includes(merged.selectedDifficulty)) merged.selectedDifficulty = 'happy';
    merged.levelIndex = deepMerge({ garden: 0, chase: 0, treasure: 0 }, parsed.levelIndex || {});
    merged.stickers = Array.isArray(parsed.stickers)
      ? parsed.stickers.filter((id) => STICKERS.some((s) => s.id === id))
      : [];
    merged.completed = parsed.completed && typeof parsed.completed === 'object' ? parsed.completed : {};
    save.data = merged;
    return save.data;
  } catch (err) {
    storageOK = false;
    save.available = false;
    return save.data;
  }
}

let writeTimer = null;

export function persist() {
  if (!storageOK) return;
  // Debounce writes a touch so rapid collection events don't hammer storage.
  if (writeTimer) return;
  writeTimer = true;
  window.setTimeout(() => {
    writeTimer = null;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save.data));
    } catch (err) {
      storageOK = false;
      save.available = false;
    }
  }, 120);
}

export function flushSave() {
  if (!storageOK || writeTimer === null) return;
  writeTimer = null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save.data));
  } catch (err) {
    storageOK = false;
    save.available = false;
  }
}

export function updateSettings(patch) {
  save.data.settings = { ...save.data.settings, ...patch };
  persist();
  return save.data.settings;
}

export function setSelection(world, difficulty) {
  if (WORLD_ORDER.includes(world)) save.data.selectedWorld = world;
  if (DIFF_ORDER.includes(difficulty)) save.data.selectedDifficulty = difficulty;
  persist();
}

export function currentLevelIndex(world) {
  const idx = save.data.levelIndex[world];
  return Number.isFinite(idx) ? Math.max(0, Math.floor(idx)) : 0;
}

export function recordCompletion({ world, difficulty, levelIndex, collected, total }) {
  const data = save.data;
  const key = `${world}:${difficulty}:${levelIndex}`;
  data.completed[key] = {
    collected,
    total,
    at: Date.now(),
  };
  if (Number.isFinite(levelIndex)) {
    data.levelIndex[world] = Math.max(currentLevelIndex(world), levelIndex + 1);
  }

  // Award the next sticker in this world's set.
  const worldStickers = STICKERS.filter((s) => s.world === world);
  const newlyUnlocked = worldStickers.find((s) => !data.stickers.includes(s.id));
  if (newlyUnlocked) {
    data.stickers.push(newlyUnlocked.id);
    persist();
    return { stickers: [newlyUnlocked.id], allStickers: data.stickers.slice() };
  }
  persist();
  return { stickers: [], allStickers: data.stickers.slice() };
}

export function stickerCount() {
  return save.data.stickers.length;
}

export function hasSticker(id) {
  return save.data.stickers.includes(id);
}

export function resetProgress() {
  save.data = defaults();
  save.data.settings = deepMerge({ ...SETTINGS_DEFAULTS }, save.data.settings);
  if (!storageOK) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    /* ignore */
  }
  persist();
}

export function storageStatusText() {
  if (!storageOK) return 'Progress cannot be saved in this browser';
  return 'Progress is safe on this device';
}