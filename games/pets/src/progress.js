import { DEFAULT_PROGRESS, LEVELS, PETS, STORAGE_KEY } from './config.js?v=18';

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

function clampLevelList(list) {
  if (!Array.isArray(list)) return [];
  const valid = new Set(LEVELS.map((level) => level.id));
  return [...new Set(list.filter((id) => valid.has(id)))];
}

export class Progress {
  constructor() {
    this.state = this.load();
  }

  load() {
    const stored = safeParse(readStorage());
    if (!stored || typeof stored !== 'object') {
      return cloneDefault();
    }
    const merged = {
      ...cloneDefault(),
      ...stored,
      settings: { ...DEFAULT_PROGRESS.settings, ...(stored.settings || {}) },
      itemCounts: stored.itemCounts && typeof stored.itemCounts === 'object' ? stored.itemCounts : {},
      completed: clampLevelList(stored.completed),
      unlocked: clampLevelList(stored.unlocked),
      rescued: Array.isArray(stored.rescued) ? stored.rescued.filter((r) => r && typeof r.type === 'string') : [],
    };
    if (!PETS[merged.selectedPet]) merged.selectedPet = 'ghosty';
    if (!merged.unlocked.includes('meadow')) merged.unlocked.unshift('meadow');
    for (const id of merged.completed) {
      if (!merged.unlocked.includes(id)) merged.unlocked.push(id);
      const next = this.nextLevelId(id);
      if (next && !merged.unlocked.includes(next)) merged.unlocked.push(next);
    }
    return merged;
  }

  save() {
    try {
      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* Private mode or a full storage area should never stop play. */
    }
  }

  get selectedPet() { return this.state.selectedPet; }
  get settings() { return this.state.settings; }
  get completed() { return [...this.state.completed]; }
  get unlocked() { return [...this.state.unlocked]; }

  selectPet(petId) {
    if (!PETS[petId]) return;
    this.state.selectedPet = petId;
    this.save();
  }

  isUnlocked(levelId) {
    return this.state.unlocked.includes(levelId);
  }

  isCompleted(levelId) {
    return this.state.completed.includes(levelId);
  }

  nextLevelId(levelId) {
    const index = LEVELS.findIndex((level) => level.id === levelId);
    return index >= 0 && index < LEVELS.length - 1 ? LEVELS[index + 1].id : null;
  }

  completeLevel(levelId) {
    const level = LEVELS.find((item) => item.id === levelId);
    if (!level) return { newUnlock: null, firstCompletion: false };
    const firstCompletion = !this.state.completed.includes(levelId);
    if (firstCompletion) this.state.completed.push(levelId);
    if (!this.state.unlocked.includes(levelId)) this.state.unlocked.push(levelId);
    const next = this.nextLevelId(levelId);
    let newUnlock = null;
    if (next && !this.state.unlocked.includes(next)) {
      this.state.unlocked.push(next);
      newUnlock = next;
    }
    this.state.lastPlayed = levelId;
    this.save();
    return { newUnlock, firstCompletion };
  }

  addCollectible(type, amount = 1) {
    this.state.collected += amount;
    this.state.itemCounts[type] = (this.state.itemCounts[type] || 0) + amount;
    this.save();
  }

  hasRescued(levelId, type) {
    return this.state.rescued.some((entry) => entry.level === levelId && entry.type === type);
  }

  rescueAnimal(levelId, type) {
    if (this.hasRescued(levelId, type)) return false;
    this.state.rescued.push({
      level: levelId,
      type,
      at: Date.now(),
    });
    this.save();
    return true;
  }

  get sanctuary() {
    return this.state.rescued.map((entry) => ({ ...entry }));
  }

  setSetting(key, value) {
    if (key !== 'music' && key !== 'sfx') return;
    this.state.settings[key] = Boolean(value);
    this.save();
  }

  toggleSetting(key) {
    this.setSetting(key, !this.state.settings[key]);
    return this.state.settings[key];
  }

  reset() {
    this.state = cloneDefault();
    this.save();
  }
}