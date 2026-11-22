import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal browser stand-ins so every game can run a few seconds without a screen.
const g = globalThis as any;
g.window ??= { dispatchEvent() { return true; }, setTimeout: (fn: () => void) => 0, addEventListener() {}, removeEventListener() {}, innerWidth: 1920, innerHeight: 1080 };
g.document ??= { createElement: () => Object.assign(fakeCtxFactory(), { width: 0, height: 0, getContext: () => fakeCtxFactory(), toBlob() {}, toDataURL: () => '', click() {} }), body: { appendChild() {}, removeChild() {} } };
g.Event ??= class { constructor(public type: string) {} };

function fakeCtxFactory(): any {
  return fakeCtx();
}

function fakeCtx(): CanvasRenderingContext2D {
  const handler: ProxyHandler<any> = {
    get(_t, prop) {
      if (prop === Symbol.toPrimitive) return () => 0;
      if (prop === 'measureText') return () => ({ width: 100 });
      return stub;
    },
    set() { return true; },
    apply() { return stub; },
  };
  const stub: any = new Proxy(function () {}, handler);
  return stub as CanvasRenderingContext2D;
}

function hand(id: number, x: number, y: number, extra: object = {}) {
  return {
    id, player: id, handedness: id % 2 ? 'Right' : 'Left', tip: { x, y }, radius: 90,
    velocity: { x: 300, y: 0 }, speed: 300, landmarks: [], tracked: true, pinchActive: false,
    fist: false, pointing: true, palm: { x, y: y + 100 }, palmSize: 90, ...extra,
  };
}

test('every game opens and runs 8 seconds with moving hands, no errors', async () => {
  const { GAMES } = await import('../src/games/registry');
  const { helloGame } = await import('../src/games/hello/HelloGame');
  const audio: any = { play() {}, speak() {}, stopSpeech() {} };
  for (const def of [...GAMES, helloGame]) {
    const ctx = fakeCtx();
    const inst = def.create();
    const gc: any = {
      width: 1920, height: 1080, time: 0, dt: 1 / 30, audio,
      settings: { showSkeleton: false, demoMode: false },
      frame: { hands: [], time: 0, handsApart: 1, events: [], frameId: 0, fps: 30, demo: false },
    };
    try {
      inst.enter?.(gc);
      for (let i = 0; i < 240; i++) {
        const t = i / 30;
        gc.time = t; gc.frame.time = t; gc.frame.frameId = i;
        const x = 960 + Math.sin(t * 1.3) * 600;
        const y = 540 + Math.cos(t * 0.9) * 300;
        gc.frame.hands = i < 20 ? [] : [hand(1, x, y), hand(2, 1920 - x, 1080 - y, { pointing: false })];
        gc.frame.events = i % 40 === 0 ? [{ type: 'wave', x, y }] : [];
        inst.update(gc);
        for (const e of gc.frame.events) inst.onGesture?.(e, gc);
        inst.draw(ctx, gc);
      }
      inst.exit?.();
    } catch (e) {
      assert.fail(`${def.id} crashed: ${(e as Error).stack}`);
    }
  }
});
