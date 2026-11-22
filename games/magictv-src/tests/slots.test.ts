import test from 'node:test';
import assert from 'node:assert/strict';
import { SlotAssigner } from '../src/tracking/slots';

test('children arriving together are numbered left to right', () => {
  const a = new SlotAssigner();
  const m = a.assign([{ id: 7, x: 1500 }, { id: 3, x: 400 }], 0);
  assert.equal(m.get(3), 0);
  assert.equal(m.get(7), 1);
});

test('a child keeps her slot while in view and through a short gap', () => {
  const a = new SlotAssigner();
  a.assign([{ id: 1, x: 400 }, { id: 2, x: 1500 }], 0);
  const m = a.assign([{ id: 2, x: 1500 }], 1000);
  assert.equal(m.get(2), 1);
  const m2 = a.assign([{ id: 1, x: 420 }, { id: 2, x: 1500 }], 2000);
  assert.equal(m2.get(1), 0);
});

test('after a long break each child returns to the slot of the seat she sat in', () => {
  const a = new SlotAssigner();
  a.assign([{ id: 1, x: 400 }, { id: 2, x: 1500 }], 0);
  a.assign([], 10_000); // both gone
  // the right-hand child comes back first, with new hand ids
  const m = a.assign([{ id: 11, x: 1480 }], 11_000);
  assert.equal(m.get(11), 1);
  const m2 = a.assign([{ id: 11, x: 1480 }, { id: 12, x: 450 }], 12_000);
  assert.equal(m2.get(12), 0);
  assert.equal(m2.get(11), 1);
});
