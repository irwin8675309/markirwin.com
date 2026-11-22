import type { TrackingArea } from '../types';
import type { Settings } from '../settings';
import { clamp, clamp01, dist } from '../utils/math';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../types';
import type { Vec2 } from '../types';

export const DEFAULT_AREA: TrackingArea = { minX: 0.14, maxX: 0.86, minY: 0.16, maxY: 0.9 };

export type Mapper = (nx: number, ny: number) => Vec2;

/**
 * Builds a mapping from camera-normalised coordinates to world (1920x1080).
 * Uses the calibrated usable area when present and applies mirroring.
 */
export function createMapper(settings: Settings, area: TrackingArea): Mapper {
  const a = settings.trackingArea ?? area;
  const w = Math.max(0.05, a.maxX - a.minX);
  const h = Math.max(0.05, a.maxY - a.minY);
  return (nx: number, ny: number): Vec2 => {
    let x = settings.mirrored ? 1 - nx : nx;
    const px = clamp01((x - a.minX) / w);
    const py = clamp01((ny - a.minY) / h);
    return { x: px * WORLD_WIDTH, y: py * WORLD_HEIGHT };
  };
}

/** Expands an auto-learned area so small movements still reach the whole screen. */
export function expandArea(area: TrackingArea, p: Vec2): TrackingArea {
  const minW = 0.45;
  const minH = 0.5;
  let { minX, maxX, minY, maxY } = area;
  const padX = (maxX - minX) * 0.04;
  const padY = (maxY - minY) * 0.04;
  minX = Math.min(minX, p.x - padX);
  maxX = Math.max(maxX, p.x + padX);
  minY = Math.min(minY, p.y - padY);
  maxY = Math.max(maxY, p.y + padY);
  if (maxX - minX < minW) {
    const c = (minX + maxX) / 2;
    minX = c - minW / 2;
    maxX = c + minW / 2;
  }
  if (maxY - minY < minH) {
    const c = (minY + maxY) / 2;
    minY = c - minH / 2;
    maxY = c + minH / 2;
  }
  return {
    minX: clamp(minX, 0, 1),
    maxX: clamp(maxX, 0, 1),
    minY: clamp(minY, 0, 1),
    maxY: clamp(maxY, 0, 1),
  };
}

/** Distance between two normalised points, used by calibration. */
export function normalDist(a: Vec2, b: Vec2): number {
  return dist(a, b);
}