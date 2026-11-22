import type { Landmark } from '../types';
import type { RawHand } from './landmarker';

/**
 * "Far-away hands" helper.
 *
 * MediaPipe finds hands in a small copy of the picture, so a child standing 3 m
 * from the TV has hands only a few pixels wide and is often missed. When nothing
 * has been seen for a while we also look at zoomed-in crops of the picture
 * (a sweep). Once a crop finds a hand we lock on and keep zooming in around it,
 * with an occasional full-picture look to notice when the zoom is no longer needed.
 *
 * Everything here is plain geometry and bookkeeping (no camera or MediaPipe), so it
 * can be unit-tested. Rectangles are in normalised, unmirrored camera coordinates.
 */

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Width and height of the zoomed crop as a fraction of the full picture. */
export const CROP_SIZE = 0.45;
/** Nothing seen for this long (ms) before the sweep starts. */
export const SWEEP_AFTER_MS = 2000;
/** While sweeping, one detection in this many also tries a crop. */
const SWEEP_EVERY = 3;
/** While locked, one detection in this many looks at the full picture instead. */
const PROBE_EVERY = 4;
/** Crop detections in a row without any hand before the lock is dropped. */
const MAX_MISSES = 8;
/** A hand at least this big in the full picture does not need the zoom. */
export const NEAR_SPAN = 0.07;
/** The crop only recentres when the hand drifts this far (fraction of crop) from its centre. */
const DEADZONE = 0.2;

const SWEEP_CENTRES: Array<[number, number]> = [
  [0.5, 0.5],
  [0.3, 0.5],
  [0.7, 0.5],
  [0.5, 0.32],
  [0.5, 0.68],
];

/** A crop of the given size centred on (cx, cy), kept inside the picture. */
export function cropAround(cx: number, cy: number, size = CROP_SIZE): CropRect {
  const x = Math.min(1 - size, Math.max(0, cx - size / 2));
  const y = Math.min(1 - size, Math.max(0, cy - size / 2));
  return { x, y, w: size, h: size };
}

/** Converts landmarks found inside a crop back to full-picture coordinates. */
export function uncropLandmarks(lm: Landmark[], rect: CropRect): Landmark[] {
  return lm.map((p) => ({ x: rect.x + p.x * rect.w, y: rect.y + p.y * rect.h, z: p.z }));
}

/** Rough size of a hand: wrist to middle-finger knuckle, as a fraction of picture width. */
export function handSpan(lm: Landmark[]): number {
  if (lm.length < 10) return 0;
  return Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y);
}

export type FarPlan = { kind: 'full' } | { kind: 'crop'; rect: CropRect };

export class FarController {
  private lastSeenMs = 0;
  private startedMs = 0;
  private lock: CropRect | null = null;
  private misses = 0;
  private counter = 0;
  private sweepIndex = 0;

  get locked(): boolean {
    return this.lock !== null;
  }

  reset(nowMs = 0): void {
    this.lock = null;
    this.misses = 0;
    this.counter = 0;
    this.lastSeenMs = nowMs;
    this.startedMs = nowMs;
  }

  /**
   * What to look at on this detection. 'full' = the whole picture as usual.
   * In sweep mode a 'crop' plan is an EXTRA look on top of the full one.
   */
  plan(nowMs: number): FarPlan {
    if (this.startedMs === 0) this.startedMs = nowMs;
    this.counter++;
    if (this.lock) {
      if (this.counter % PROBE_EVERY === 0) return { kind: 'full' };
      return { kind: 'crop', rect: this.lock };
    }
    const quietFor = nowMs - Math.max(this.lastSeenMs, this.startedMs);
    if (quietFor >= SWEEP_AFTER_MS && this.counter % SWEEP_EVERY === 0) {
      const [cx, cy] = SWEEP_CENTRES[this.sweepIndex++ % SWEEP_CENTRES.length];
      return { kind: 'crop', rect: cropAround(cx, cy) };
    }
    return { kind: 'full' };
  }

  /** Report what the full picture showed. Returns true if the zoom lock was dropped. */
  onFull(hands: RawHand[], nowMs: number): boolean {
    if (hands.length === 0) return false;
    this.lastSeenMs = nowMs;
    if (this.lock && hands.some((h) => handSpan(h.landmarks) >= NEAR_SPAN)) {
      this.lock = null;
      this.misses = 0;
      return true;
    }
    return false;
  }

  /** Report what a crop showed (hands already converted to full-picture coordinates). */
  onCrop(hands: RawHand[], rect: CropRect, nowMs: number): void {
    if (hands.length === 0) {
      if (this.lock && ++this.misses >= MAX_MISSES) {
        this.lock = null;
        this.misses = 0;
      }
      return;
    }
    this.misses = 0;
    this.lastSeenMs = nowMs;
    let cx = 0;
    let cy = 0;
    for (const h of hands) {
      cx += h.landmarks[9].x;
      cy += h.landmarks[9].y;
    }
    cx /= hands.length;
    cy /= hands.length;
    const base = this.lock ?? rect;
    const mx = base.x + base.w / 2;
    const my = base.y + base.h / 2;
    const drifted = Math.abs(cx - mx) > base.w * DEADZONE || Math.abs(cy - my) > base.h * DEADZONE;
    this.lock = !this.lock || drifted ? cropAround(cx, cy) : this.lock;
  }
}
