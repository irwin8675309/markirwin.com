import test from 'node:test';
import assert from 'node:assert/strict';
import { HintHelper } from '../src/games/shared/demo';

const g = globalThis as any;
g.window ??= { setTimeout: () => 0, addEventListener() {}, removeEventListener() {} };

function ctx(speed: number, hands: number, spoken: string[]): any {
  return {
    dt: 0.1,
    audio: { speak: (t: string) => spoken.push(t) },
    frame: { hands: Array.from({ length: hands }, () => ({ speed })) },
  };
}

test('a hint appears after the child stops, goes away when she moves, and is not repeated at once', () => {
  const spoken: string[] = [];
  const h = new HintHelper('color-count', 10);
  for (let i = 0; i < 90; i++) h.update(ctx(0, 1, spoken), false);
  assert.equal(h.showing, false); // 9 s idle: too early
  for (let i = 0; i < 20; i++) h.update(ctx(0, 1, spoken), false);
  assert.equal(h.showing, true);
  assert.equal(spoken.length, 1);
  h.update(ctx(400, 1, spoken), false); // she moves
  for (let i = 0; i < 40; i++) h.update(ctx(400, 1, spoken), false);
  assert.equal(h.showing, false);
  // stops again straight away: the 35 s pause means no new hint yet
  for (let i = 0; i < 150; i++) h.update(ctx(0, 1, spoken), false);
  assert.equal(h.showing, false);
});

test('no hands: the tip asks for a wave; first demo playing: no hint', () => {
  const spoken: string[] = [];
  const h = new HintHelper('animal-sounds', 10);
  for (let i = 0; i < 130; i++) h.update(ctx(0, 0, spoken), false);
  assert.ok(h.showing);
  assert.match(spoken[0], /Wave hello/);
  const h2 = new HintHelper('animal-sounds', 10);
  for (let i = 0; i < 300; i++) h2.update(ctx(0, 0, []), true);
  assert.equal(h2.showing, false);
});
