import test from 'node:test';
import assert from 'node:assert/strict';
import { FarController, cropAround, uncropLandmarks, handSpan, CROP_SIZE, SWEEP_AFTER_MS, NEAR_SPAN } from '../src/tracking/farTracker';
import type { RawHand } from '../src/tracking/landmarker';

function hand(cx: number, cy: number, span = 0.03): RawHand {
  const landmarks = Array.from({ length: 21 }, () => ({ x: cx, y: cy, z: 0 }));
  landmarks[0] = { x: cx, y: cy + span, z: 0 };
  landmarks[9] = { x: cx, y: cy, z: 0 };
  return { landmarks, handedness: 'Right', confidence: 0.9 };
}

test('cropAround stays inside the picture', () => {
  for (const [cx, cy] of [[0, 0], [1, 1], [0.5, 0.5], [0.95, 0.05]]) {
    const r = cropAround(cx, cy);
    assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= 1 + 1e-9 && r.y + r.h <= 1 + 1e-9);
    assert.equal(r.w, CROP_SIZE);
  }
});

test('uncropLandmarks maps crop coordinates back to the full picture', () => {
  const rect = { x: 0.3, y: 0.2, w: 0.5, h: 0.5 };
  const [p] = uncropLandmarks([{ x: 0.5, y: 0.5, z: 0 }, ], rect);
  assert.ok(Math.abs(p.x - 0.55) < 1e-9 && Math.abs(p.y - 0.45) < 1e-9);
});

test('no sweep while hands are being seen; sweep starts after a quiet period', () => {
  const far = new FarController();
  far.reset(1000);
  // hands seen recently -> always full
  for (let t = 1000; t < 1000 + SWEEP_AFTER_MS - 100; t += 33) {
    far.onFull([hand(0.5, 0.5, 0.1)], t);
    assert.equal(far.plan(t).kind, 'full');
  }
  // quiet for a while -> some crops
  let crops = 0;
  for (let t = 10000; t < 10000 + 1000; t += 33) if (far.plan(t).kind === 'crop') crops++;
  assert.ok(crops > 5 && crops < 20, `crops=${crops}`);
});

test('a crop that finds a hand locks on, then drops the lock after repeated misses', () => {
  const far = new FarController();
  far.reset(0);
  const rect = cropAround(0.5, 0.5);
  far.onCrop([hand(0.45, 0.5)], rect, 5000);
  assert.equal(far.locked, true);
  // while locked most plans are crops around the hand
  let crops = 0;
  for (let i = 0; i < 8; i++) if (far.plan(5000 + i * 33).kind === 'crop') crops++;
  assert.ok(crops >= 5);
  for (let i = 0; i < 8; i++) far.onCrop([], rect, 6000 + i * 33);
  assert.equal(far.locked, false);
});

test('lock follows a drifting hand but ignores small wobble', () => {
  const far = new FarController();
  far.reset(0);
  far.onCrop([hand(0.5, 0.5)], cropAround(0.5, 0.5), 1);
  const a = far.plan(2);
  const first = a.kind === 'crop' ? a.rect : null;
  far.onCrop([hand(0.51, 0.5)], first!, 3); // tiny wobble
  let again = far.plan(4);
  while (again.kind !== 'crop') again = far.plan(5);
  assert.deepEqual((again as { rect: unknown }).rect, first);
  far.onCrop([hand(0.5 + CROP_SIZE * 0.4, 0.5)], first!, 6); // big drift
  let moved = far.plan(7);
  while (moved.kind !== 'crop') moved = far.plan(8);
  assert.ok((moved as { rect: { x: number } }).rect.x > first!.x);
});

test('a large hand in the full picture drops the zoom lock', () => {
  const far = new FarController();
  far.reset(0);
  far.onCrop([hand(0.5, 0.5)], cropAround(0.5, 0.5), 1);
  assert.equal(far.onFull([hand(0.5, 0.5, 0.03)], 2), false);
  assert.equal(far.locked, true);
  assert.equal(far.onFull([hand(0.5, 0.5, NEAR_SPAN + 0.02)], 3), true);
  assert.equal(far.locked, false);
  assert.ok(handSpan(hand(0.5, 0.5, 0.05).landmarks) > 0.049);
});
