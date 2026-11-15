import { DEFAULT_SETTINGS } from '../config'
import type { AppSettings } from '../types'

const SETTINGS_KEY = 'little-artists:settings'
const COMPLETED_KEY = 'little-artists:completed-pages'

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : DEFAULT_SETTINGS.sound,
      experience: parsed.experience === 'creative' ? 'creative' : 'easy',
      inputMode: parsed.inputMode === 'pencil' || parsed.inputMode === 'finger'
        ? parsed.inputMode
        : 'auto',
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // A blocked localStorage should never prevent a child from drawing.
  }
}

export function loadCompletedPages(): string[] {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
  } catch {
    return []
  }
}

export function saveCompletedPages(ids: string[]): void {
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...new Set(ids)]))
  } catch {
    // Non-critical persistence.
  }
}

export function resetLocalData(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY)
    localStorage.removeItem(COMPLETED_KEY)
  } catch {
    // Ignore storage failures.
  }
}