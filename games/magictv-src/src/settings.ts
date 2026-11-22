import type { TrackingArea } from './types';

export interface Settings {
  /** Selected webcam device id ('' = system default). */
  cameraId: string;
  /** Friendly device label, used to survive Chrome re-plugging a camera. */
  cameraLabel: string;
  /** Capture width: 640 | 1280 | 1920. */
  cameraWidth: 640 | 1280 | 1920;
  /** How many hands to track: 2 or 4. */
  numHands: 2 | 4;
  /** Tracking loop target: 30 or 60 fps. */
  trackingFps: 30 | 60;
  /** 0..1 — higher means hands are detected more easily (lower confidence threshold). */
  sensitivity: number;
  /** 0..1 — higher means smoother but slightly softer tracking. */
  smoothing: number;
  /** Mirror the camera so movement feels natural. */
  mirrored: boolean;
  /** Show the hand skeleton overlay. */
  showSkeleton: boolean;
  /** Built-in synthetic hands (used for testing / when no camera is available). */
  demoMode: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  musicEnabled: boolean;
  voiceEnabled: boolean;
  fullscreen: boolean;
  /** Usable tracking area learned during calibration (normalised). */
  trackingArea: TrackingArea | null;
}

export const DEFAULT_SETTINGS: Settings = {
  cameraId: '',
  cameraLabel: '',
  cameraWidth: 1280,
  numHands: 4,
  trackingFps: 30,
  sensitivity: 0.55,
  smoothing: 0.5,
  mirrored: true,
  showSkeleton: true,
  demoMode: false,
  masterVolume: 0.8,
  musicVolume: 0.35,
  sfxVolume: 0.8,
  muted: false,
  musicEnabled: true,
  voiceEnabled: true,
  fullscreen: false,
  trackingArea: null,
};

const KEY = 'grandkids-magic-tv/settings/v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage can be unavailable in private mode — settings just won't persist */
  }
}

export function clampSettings(s: Settings): Settings {
  return {
    ...s,
    sensitivity: Math.min(1, Math.max(0, s.sensitivity)),
    smoothing: Math.min(1, Math.max(0, s.smoothing)),
    masterVolume: Math.min(1, Math.max(0, s.masterVolume)),
    musicVolume: Math.min(1, Math.max(0, s.musicVolume)),
    sfxVolume: Math.min(1, Math.max(0, s.sfxVolume)),
    cameraWidth: ([640, 1280, 1920].includes(s.cameraWidth) ? s.cameraWidth : 1280) as 640 | 1280 | 1920,
    numHands: s.numHands === 2 ? 2 : 4,
    trackingFps: s.trackingFps === 60 ? 60 : 30,
  };
}