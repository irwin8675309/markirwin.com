import test from 'node:test';
import assert from 'node:assert/strict';
import { HandTracker } from '../src/tracking/tracker';
import { DEFAULT_SETTINGS } from '../src/settings';
import { DEFAULT_AREA } from '../src/tracking/mapping';
import type { RawHand } from '../src/tracking/landmarker';

const g = globalThis as any;
g.window ??= { dispatchEvent() { return true; }, setTimeout: () => 0, addEventListener() {}, removeEventListener() {} };
g.Event ??= class { constructor(public type: string) {} };
g.document ??= { createElement: () => fakeCtx() };

function fakeCtx(): any {
  const stub: any = new Proxy(function () {}, {
    get(_t, p) { return p === Symbol.toPrimitive ? () => 0 : p === 'measureText' ? () => ({ width: 100 }) : stub; },
    set() { return true; },
    apply() { return stub; },
  });
  return stub;
}

/** A plausible open hand in camera coordinates, like MediaPipe returns. */
function openHand(cx: number, cy: number, s = 0.12, wob = 0): RawHand {
  const lm = Array.from({ length: 21 }, () => ({ x: cx, y: cy, z: 0 }));
  lm[0] = { x: cx, y: cy + s, z: 0 };
  const bases = [1, 5, 9, 13, 17];
  const dx = [-0.5, -0.3, 0, 0.3, 0.5];
  bases.forEach((b, f) => {
    const isThumb = f === 0;
    for (let k = 0; k < 4; k++) {
      const t = (k + 1) / 4;
      lm[b + k] = {
        x: cx + dx[f] * s * (isThumb ? 1 + t : 0.6 + t * 0.2) + wob,
        y: cy + s * (isThumb ? 0.6 - t * 0.3 : 0.3 - t * 1.0),
        z: 0,
      };
    }
  });
  return { landmarks: lm, handedness: 'Right', confidence: 0.9 };
}

test('real tracker output draws in every game (no crash with real HandState)', async () => {
  const { GAMES } = await import('../src/games/registry');
  const { helloGame } = await import('../src/games/hello/HelloGame');
  const audio: any = { play() {}, speak() {}, stopSpeech() {} };
  for (const def of [...GAMES, helloGame]) {
    const tracker = new HandTracker();
    const inst = def.create();
    const ctx = fakeCtx();
    const gc: any = { width: 1920, height: 1080, time: 0, dt: 1 / 30, audio, settings: { ...DEFAULT_SETTINGS }, frame: { hands: [], time: 0, events: [], handsApart: 1, frameId: 0, fps: 30, demo: false } };
    try {
      inst.enter?.(gc);
      let seenHands = 0;
      for (let i = 0; i < 150; i++) {
        const t = i / 30;
        const raw = [openHand(0.4 + Math.sin(t) * 0.1, 0.5, 0.12), openHand(0.7, 0.5 + Math.cos(t) * 0.1, 0.1)];
        const hands = tracker.update(raw, t, 1 / 30, DEFAULT_SETTINGS, { ...DEFAULT_AREA });
        seenHands = Math.max(seenHands, hands.length);
        gc.time = t;
        gc.frame = { hands, time: t, events: [], handsApart: 1, frameId: i, fps: 30, demo: false };
        inst.update(gc);
        inst.draw(ctx, gc);
      }
      assert.ok(seenHands >= 1, `${def.id}: tracker produced no hands from plausible landmarks`);
    } catch (e) {
      assert.fail(`${def.id}: ${(e as Error).stack}`);
    }
  }
});
