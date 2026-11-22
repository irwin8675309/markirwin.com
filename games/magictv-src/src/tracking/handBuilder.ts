import type { HandState, Landmark, Vec2 } from '../types';
import { clamp, clamp01, dist } from '../utils/math';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../types';
import type { RawHand } from './landmarker';

const FINGER_TIPS = [8, 12, 16, 20];
const FINGER_PIPS = [6, 10, 14, 18];
const FINGER_MCPS = [5, 9, 13, 17];

function landmark(list: Landmark[], i: number): Vec2 {
  const p = list[i];
  return { x: p.x, y: p.y };
}

/**
 * Thumb-to-index distance relative to hand size. Hand size is the larger of the
 * wrist→middle-knuckle length and the knuckle width, so tilting the hand toward
 * the camera (which shortens one of them) does not fake or hide a pinch.
 */
export function pinchRatioOf(lm: Vec2[]): number {
  const length = dist(lm[0], lm[9]);
  const width = dist(lm[5], lm[17]) * 1.15;
  const size = Math.max(20, length, width);
  return dist(lm[4], lm[8]) / size;
}

/** Derives all child-friendly hand properties from 21 world-space landmarks. */
export function buildHandState(
  id: number,
  raw: RawHand,
  landmarks: Landmark[],
  velocity: Vec2,
  pinchActive: boolean,
  pinchStartedAt: number,
  history: Vec2[],
  tracked = true,
): HandState {
  const lm = landmarks.map((p) => ({ x: p.x, y: p.y }));
  const wrist = lm[0];
  const palm: Vec2 = {
    x: (lm[0].x + lm[5].x + lm[9].x + lm[13].x + lm[17].x) / 5,
    y: (lm[0].y + lm[5].y + lm[9].y + lm[13].y + lm[17].y) / 5,
  };
  const palmSize = Math.max(18, dist(wrist, lm[9]));

  const extended: boolean[] = [];
  for (let f = 0; f < 4; f++) {
    const tip = FINGER_TIPS[f];
    const pip = FINGER_PIPS[f];
    const ratio = dist(wrist, lm[tip]) / Math.max(1, dist(wrist, lm[pip]));
    extended.push(ratio > 1.1 && dist(lm[pip], lm[tip]) > palmSize * 0.18);
  }
  const thumbExtended =
    dist(wrist, lm[4]) > dist(wrist, lm[3]) * 1.06 && dist(lm[4], lm[5]) > palmSize * 1.15;

  let openness =
    (extended.filter(Boolean).length + (thumbExtended ? 0.65 : 0)) / 4.65;
  openness = clamp01(openness);

  const pinchRatio = pinchRatioOf(lm);
  const pinchAmount = clamp01((0.95 - pinchRatio) / 0.55);
  const pointing = extended[0] && !extended[1] && !extended[2];
  const fist = openness < 0.34 && !pinchActive;
  const open = openness > 0.62;

  const index = lm[8];
  const tip: Vec2 = pinchActive
    ? { x: (lm[4].x + lm[8].x) / 2, y: (lm[4].y + lm[8].y) / 2 }
    : pointing || fist
      ? index
      : open
        ? { x: (lm[8].x + lm[12].x + lm[16].x) / 3, y: (lm[8].y + lm[12].y + lm[16].y) / 3 }
        : index;

  let radius = palmSize * (open ? 0.95 : pointing ? 0.72 : pinchActive ? 0.6 : 0.8);
  if (fist) radius = palmSize * 0.6;
  radius = clamp(radius, 62, 200);

  return {
    id,
    handedness: raw.handedness,
    landmarks,
    wrist,
    palm,
    thumb: lm[4],
    index,
    middle: lm[12],
    ring: lm[16],
    pinky: lm[20],
    tip,
    radius,
    pinch: pinchAmount,
    pinchActive,
    openness,
    pointing,
    fist,
    open,
    velocity,
    speed: Math.hypot(velocity.x, velocity.y),
    palmSize,
    confidence: raw.confidence,
    tracked,
    player: id,
    pinchStartedAt,
    history,
  };
}

export { WORLD_WIDTH, WORLD_HEIGHT, FINGER_MCPS };