import test from 'node:test';
import assert from 'node:assert/strict';
import { getBuddy, setBuddy, resetBuddies, BUDDIES } from '../src/games/shared/buddies';
import { DEMOS, demoPosition } from '../src/games/shared/demo';

test('children start with different buddies', () => {
  resetBuddies();
  assert.equal(getBuddy(0).id, 'bunny');
  assert.equal(getBuddy(1).id, 'kitty');
  assert.notEqual(getBuddy(2).id, getBuddy(0).id);
});

test('choosing a buddy changes only that child; taking a friend\'s buddy swaps them', () => {
  resetBuddies();
  setBuddy(0, 'panda');
  assert.equal(getBuddy(0).id, 'panda');
  assert.equal(getBuddy(1).id, 'kitty');
  setBuddy(1, 'panda'); // child 2 takes child 1's panda: child 1 gets child 2's old kitty
  assert.equal(getBuddy(1).id, 'panda');
  assert.equal(getBuddy(0).id, 'kitty');
  const ids = [0, 1, 2, 3].map((s) => getBuddy(s).id);
  assert.equal(new Set(ids).size, 4, ids.join());
  setBuddy(0, 'not-an-animal');
  assert.equal(getBuddy(0).id, 'kitty');
  resetBuddies();
  assert.equal(getBuddy(1).id, 'kitty');
  assert.ok(BUDDIES.length >= 6);
});

test('demo paths loop and stay on screen', () => {
  for (const [id, script] of Object.entries(DEMOS)) {
    for (let t = 0; t < script.seconds * 2; t += 0.1) {
      const p = demoPosition(script, t);
      assert.ok(p.x > 200 && p.x < 1720 && p.y > 200 && p.y < 900, `${id} t=${t} ${p.x},${p.y}`);
      assert.ok(p.tap >= 0 && p.tap <= 1);
    }
    const a = demoPosition(script, 0.3);
    const b = demoPosition(script, 0.3 + script.seconds);
    assert.ok(Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6, `${id} loops`);
  }
});
