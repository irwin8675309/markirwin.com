import test from 'node:test';
import assert from 'node:assert/strict';
import { recordPlay, summarize, resetStats, dayKey } from '../src/games/shared/stats';

test('play time adds up per day and game, and ignores bad frames', () => {
  resetStats();
  const now = new Date(2026, 10, 22, 12, 0, 0);
  const yesterday = new Date(2026, 10, 21, 12, 0, 0);
  for (let i = 0; i < 60; i++) recordPlay('bubble-pop', 1, now);
  for (let i = 0; i < 30; i++) recordPlay('underwater-adventure', 1, now);
  for (let i = 0; i < 10; i++) recordPlay('bubble-pop', 1, yesterday);
  recordPlay('bubble-pop', 50, now); // a long stall is not play
  recordPlay('bubble-pop', -1, now);
  const s = summarize(now);
  assert.equal(s.todaySeconds, 90);
  assert.equal(s.week.length, 7);
  assert.equal(s.week[5].seconds, 10);
  assert.equal(s.topGames[0].id, 'bubble-pop');
  assert.equal(s.topGames[0].seconds, 70);
  assert.equal(dayKey(now), '2026-11-22');
  resetStats();
  assert.equal(summarize(now).todaySeconds, 0);
});
