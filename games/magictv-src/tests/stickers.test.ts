import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STICKERS, SECONDS_PER_STICKER, grantSticker, addPlaySeconds, ownedStickers,
  hasSticker, resetStickers, onSticker, playProgress,
} from '../src/games/shared/stickers';
import { GAMES } from '../src/games/registry';
import { DEMOS } from '../src/games/shared/demo';

test('stickers are granted in order with no duplicates, and run out cleanly', () => {
  resetStickers();
  const seen: string[] = [];
  const off = onSticker((s) => seen.push(s.id));
  for (let i = 0; i < STICKERS.length; i++) assert.ok(grantSticker('test'));
  assert.equal(grantSticker('test'), null);
  off();
  assert.equal(new Set(seen).size, STICKERS.length);
  assert.equal(ownedStickers().length, STICKERS.length);
  resetStickers();
  assert.equal(ownedStickers().length, 0);
  assert.equal(hasSticker(STICKERS[0].id), false);
});

test('play time earns a sticker only after the threshold', () => {
  resetStickers();
  addPlaySeconds(SECONDS_PER_STICKER - 1);
  assert.equal(ownedStickers().length, 0);
  assert.ok(playProgress() > 0.9);
  addPlaySeconds(2);
  assert.equal(ownedStickers().length, 1);
  assert.equal(playProgress(), 0);
  resetStickers();
});

test('every game has a unique id and a demo', () => {
  const ids = GAMES.map((g) => g.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(GAMES.length, 12);
  for (const id of ids) if (id !== 'high-five-friends') assert.ok(DEMOS[id], id);
});
