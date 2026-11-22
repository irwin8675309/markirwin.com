// Run with:  npm test      (uses tsx through npx; development only)
import test from 'node:test';
import assert from 'node:assert/strict';
import { HandTracker, COAST_SECONDS } from '../src/tracking/tracker';
import { GestureEngine } from '../src/tracking/gestures';
import { DEFAULT_SETTINGS } from '../src/settings';
import { DEFAULT_AREA } from '../src/tracking/mapping';
import type { RawHand } from '../src/tracking/landmarker';
import type { HandState } from '../src/types';

const settings = { ...DEFAULT_SETTINGS, mirrored: false, trackingArea: null };

/**
 * Builds a camera-space hand (21 landmarks, normalised 0..1).
 * `gap` is the thumb-tip to index-tip distance as a fraction of the hand length.
 */
function rawHand(cx: number, cy: number, gap: number, handedness: 'Left' | 'Right' = 'Right'): RawHand {
  const L = 0.12; // wrist → middle knuckle
  const lm = Array.from({ length: 21 }, () => ({ x: cx, y: cy, z: 0 }));
  const set = (i: number, x: number, y: number) => (lm[i] = { x: cx + x, y: cy + y, z: 0 });
  set(0, 0, 0);
  set(5, -0.5 * L * 0.9, -L);
  set(9, 0, -L);
  set(13, 0.4 * L * 0.9, -L);
  set(17, 0.9 * L * 0.9, -L * 0.95);
  set(3, -0.9 * L, -0.7 * L);
  set(8, -0.5 * L, -2 * L);
  set(4, -0.5 * L + gap * L, -2 * L);
  return { landmarks: lm, handedness, confidence: 0.95 };
}

function run(tracker: HandTracker, raw: RawHand[], t: number) {
  return tracker.update(raw, t, 1 / 30, settings, DEFAULT_AREA);
}

test('a hand keeps being reported (untracked) through a short detection dropout', () => {
  const tr = new HandTracker();
  let t = 0;
  for (let i = 0; i < 5; i++) run(tr, [rawHand(0.5, 0.6, 1.5)], (t += 1 / 30));
  const dropped = run(tr, [], (t += 1 / 30));
  assert.equal(dropped.length, 1);
  assert.equal(dropped[0].tracked, false);
  const later = run(tr, [], (t += COAST_SECONDS + 0.1));
  assert.equal(later.length, 0);
});

test('a hand that returns after a dropout keeps its id', () => {
  const tr = new HandTracker();
  let t = 0;
  const first = run(tr, [rawHand(0.5, 0.6, 1.5)], (t += 1 / 30))[0].id;
  run(tr, [], (t += 1 / 30));
  const back = run(tr, [rawHand(0.51, 0.6, 1.5)], (t += 1 / 30));
  assert.equal(back[0].id, first);
  assert.equal(back[0].tracked, true);
});

test('pinch needs a sustained close; a short blip cannot pre-arm it', () => {
  const tr = new HandTracker();
  let t = 0;
  for (let i = 0; i < 4; i++) run(tr, [rawHand(0.5, 0.6, 1.5)], (t += 1 / 30));
  // one-frame blip
  run(tr, [rawHand(0.5, 0.6, 0.05)], (t += 1 / 30));
  for (let i = 0; i < 30; i++) run(tr, [rawHand(0.5, 0.6, 1.5)], (t += 1 / 30)); // a second later
  // pinch again: must NOT be active on the very first closed frame
  const first = run(tr, [rawHand(0.5, 0.6, 0.05)], (t += 1 / 30));
  assert.equal(first[0].pinchActive, false);
  let active = false;
  for (let i = 0; i < 6; i++) active = run(tr, [rawHand(0.5, 0.6, 0.05)], (t += 1 / 30))[0].pinchActive;
  assert.equal(active, true);
});

test('pinch has hysteresis: it stays on until the fingers clearly open', () => {
  const tr = new HandTracker();
  let t = 0;
  for (let i = 0; i < 8; i++) run(tr, [rawHand(0.5, 0.6, 0.05)], (t += 1 / 30));
  // a bit looser than the closing threshold, still inside the release threshold
  const loose = run(tr, [rawHand(0.5, 0.6, 0.7)], (t += 1 / 30))[0];
  assert.equal(loose.pinchActive, true);
  let open = true;
  for (let i = 0; i < 4; i++) open = run(tr, [rawHand(0.5, 0.6, 1.6)], (t += 1 / 30))[0].pinchActive;
  assert.equal(open, false);
});

function mkHand(p: Partial<HandState> & { id: number }): HandState {
  return {
    handedness: 'Right',
    landmarks: [],
    wrist: { x: 0, y: 0 },
    palm: { x: 960, y: 540 },
    thumb: { x: 0, y: 0 },
    index: { x: 0, y: 0 },
    middle: { x: 0, y: 0 },
    ring: { x: 0, y: 0 },
    pinky: { x: 0, y: 0 },
    tip: { x: 960, y: 540 },
    radius: 100,
    pinch: 0,
    pinchActive: false,
    openness: 0.5,
    pointing: false,
    fist: false,
    open: false,
    velocity: { x: 0, y: 0 },
    speed: 0,
    palmSize: 100,
    confidence: 1,
    tracked: true,
    pinchStartedAt: 0,
    history: [],
    ...p,
  } as HandState;
}

test('a coasting (untracked) hand never fires gesture events', () => {
  const g = new GestureEngine();
  g.update([mkHand({ id: 1 })], 0);
  const r = g.update([mkHand({ id: 1, pinchActive: true, tracked: false })], 0.05);
  assert.equal(r.events.filter((e) => e.type === 'pinch').length, 0);
  const r2 = g.update([mkHand({ id: 1, pinchActive: true, tracked: true })], 0.1);
  assert.equal(r2.events.filter((e) => e.type === 'pinch').length, 1);
});

test('two-hand gestures use the closest Left+Right pair, not just the first two ids', () => {
  const g = new GestureEngine();
  const hands = [
    mkHand({ id: 1, handedness: 'Left', palm: { x: 900, y: 540 } }),
    mkHand({ id: 2, handedness: 'Left', palm: { x: 1000, y: 540 } }),
    mkHand({ id: 3, handedness: 'Right', palm: { x: 1400, y: 540 } }),
  ];
  const { handsApart } = g.update(hands, 0);
  // pair 2↔3 is 400 px apart (not the 100 px between ids 1 and 2)
  assert.ok(Math.abs(handsApart - 400 / (1920 * 0.85)) < 0.01, `got ${handsApart}`);
});
