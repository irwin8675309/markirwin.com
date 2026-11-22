import test from 'node:test';
import assert from 'node:assert/strict';
import { PlayerTracker, countPlayers } from '../src/tracking/players';
import { GestureEngine } from '../src/tracking/gestures';
import type { HandState } from '../src/types';

let nextId = 1;
function hand(id: number, x: number, y: number, handedness: 'Left' | 'Right', over: Partial<HandState> = {}): HandState {
  return {
    id,
    handedness,
    palm: { x, y },
    palmSize: 90,
    tracked: true,
    fist: false,
    player: id,
    ...over,
  } as unknown as HandState;
}

test('a Left and a Right hand close together are one player', () => {
  const pt = new PlayerTracker();
  const hands = [hand(1, 600, 500, 'Left'), hand(2, 900, 520, 'Right')];
  pt.assign(hands);
  assert.equal(hands[0].player, hands[1].player);
  assert.equal(countPlayers(hands), 1);
});

test('hands far apart, or of the same side, are different players', () => {
  const pt = new PlayerTracker();
  const far = [hand(1, 200, 500, 'Left'), hand(2, 1700, 520, 'Right')];
  pt.assign(far);
  assert.notEqual(far[0].player, far[1].player);
  const pt2 = new PlayerTracker();
  const same = [hand(3, 600, 500, 'Right'), hand(4, 800, 520, 'Right')];
  pt2.assign(same);
  assert.equal(countPlayers(same), 2);
});

test('grouping is sticky: two children bringing hands together stay two players', () => {
  const pt = new PlayerTracker();
  const frame = (ax: number, bx: number) => [
    hand(1, 200, 500, 'Left'),
    hand(2, ax, 500, 'Right'), // child A
    hand(3, bx, 500, 'Left'),
    hand(4, 1750, 500, 'Right'), // child B
  ];
  let hands = frame(450, 1450);
  pt.assign(hands);
  assert.equal(countPlayers(hands), 2);
  hands = frame(900, 1000); // A's right and B's left now touching
  pt.assign(hands);
  assert.equal(countPlayers(hands), 2);
  assert.notEqual(hands[1].player, hands[2].player);
});

test('single hands approaching each other do not merge', () => {
  const pt = new PlayerTracker();
  let hands = [hand(1, 200, 500, 'Right'), hand(2, 1700, 500, 'Left')];
  pt.assign(hands);
  hands = [hand(1, 900, 500, 'Right'), hand(2, 1000, 500, 'Left')];
  pt.assign(hands);
  assert.equal(countPlayers(hands), 2);
});

function run(eng: GestureEngine, frames: HandState[][], t0 = 10) {
  const events: string[] = [];
  frames.forEach((hands, i) => {
    for (const e of eng.update(hands, t0 + i / 30).events) events.push(e.type);
  });
  return events;
}

test('two children meeting hands fires one high five', () => {
  const eng = new GestureEngine();
  const pt = new PlayerTracker();
  const frames: HandState[][] = [];
  for (let i = 0; i <= 40; i++) {
    const gap = 1200 - i * 28; // closes from 1200 to ~80
    const hands = [hand(1, 300, 500, 'Left'), hand(2, 300 + gap, 500, 'Right')];
    // children are far enough apart to be separate players at first sight
    pt.assign(hands);
    frames.push(hands);
  }
  const events = run(eng, frames);
  assert.equal(events.filter((e) => e === 'highFive').length, 1);
});

test('one child clapping their own hands is not a high five', () => {
  const eng = new GestureEngine();
  const pt = new PlayerTracker();
  const frames: HandState[][] = [];
  for (let i = 0; i <= 30; i++) {
    const gap = 600 - i * 18;
    const hands = [hand(1, 700, 500, 'Left'), hand(2, 700 + gap, 500, 'Right')];
    pt.assign(hands);
    frames.push(hands);
  }
  assert.equal(run(eng, frames).filter((e) => e === 'highFive').length, 0);
});

test('hands that were never apart do not high five, and it does not repeat while held together', () => {
  const eng = new GestureEngine();
  const together = [hand(1, 900, 500, 'Left', { player: 1 }), hand(2, 960, 500, 'Right', { player: 2 })];
  const frames = Array.from({ length: 60 }, () => together);
  assert.equal(run(eng, frames).filter((e) => e === 'highFive').length, 0);
  void nextId;
});
