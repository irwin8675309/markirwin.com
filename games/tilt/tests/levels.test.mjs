/**
 * Level validation - run with:  node tests/levels.test.mjs
 *
 * 1. Passability: a grid flood-fill proves the marble always has a
 *    continuous, obstacle-free route from the start to the goal.
 * 2. Containment: random tilt input can never push the marble off the trail.
 *
 * No browser or dependencies required.
 */

import { generateLevel } from '../src/levels.js';
import { Ball, PhysicsWorld, stepBallSafe } from '../src/physics.js';

const CELL = 10;
const WORLDS = ['garden', 'chase', 'treasure'];
const DIFFICULTIES = ['little', 'happy', 'super'];

function passable(level, physics, x, y) {
  if (physics.nearestOnPath(x, y).dist > physics.maxCenterDist - 0.5) return false;
  for (const o of level.obstacles) {
    const pos = physics.obstaclePos(o, 0);
    if (Math.hypot(pos.x - x, pos.y - y) < o.r + level.ballRadius + 0.5) return false;
  }
  return true;
}

function routeExists(level, physics) {
  const b = level.bounds;
  const x0 = Math.floor(b.minX / CELL);
  const x1 = Math.ceil(b.maxX / CELL);
  const y0 = Math.floor(b.minY / CELL);
  const y1 = Math.ceil(b.maxY / CELL);
  const W = x1 - x0 + 1;
  const H = y1 - y0 + 1;
  const free = new Uint8Array(W * H);

  for (let j = 0; j < H; j += 1) {
    for (let i = 0; i < W; i += 1) {
      if (passable(level, physics, x0 * CELL + i * CELL + CELL / 2, y0 * CELL + j * CELL + CELL / 2)) {
        free[j * W + i] = 1;
      }
    }
  }

  const sx = Math.round((level.start.x - CELL / 2) / CELL) - x0;
  const sy = Math.round((level.start.y - CELL / 2) / CELL) - y0;
  const gx = Math.round((level.goal.x - CELL / 2) / CELL) - x0;
  const gy = Math.round((level.goal.y - CELL / 2) / CELL) - y0;

  const seen = new Uint8Array(W * H);
  const stack = [sy * W + sx];
  seen[sy * W + sx] = 1;

  while (stack.length) {
    const idx = stack.pop();
    const i = idx % W;
    const j = (idx / W) | 0;
    if (Math.abs(i - gx) <= 2 && Math.abs(j - gy) <= 2) return true;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
      const n = nj * W + ni;
      if (seen[n] || !free[n]) continue;
      seen[n] = 1;
      stack.push(n);
    }
  }
  return false;
}

let failures = 0;
let checks = 0;

for (const world of WORLDS) {
  for (const difficulty of DIFFICULTIES) {
    for (let levelIndex = 0; levelIndex < 6; levelIndex += 1) {
      const level = generateLevel({ world, difficulty, levelIndex });
      const physics = new PhysicsWorld(level);
      checks += 1;

      if (!routeExists(level, physics)) {
        failures += 1;
        console.log(`FAIL  blocked route  ${world}/${difficulty}/L${levelIndex}`);
        continue;
      }

      // Random-input containment: 20 seconds of wild tilting must never
      // leave the marble outside the trail.
      const ball = new Ball(level.start.x, level.start.y, level.ballRadius);
      let escaped = false;
      for (let step = 0; step < 120 * 20; step += 1) {
        const input = { x: Math.sin(step * 0.07), y: Math.cos(step * 0.11) };
        stepBallSafe(ball, input, 1 / 120, physics, level.difficulty.physics, 1);
        if (physics.nearestOnPath(ball.x, ball.y).dist > physics.maxCenterDist + 3) {
          escaped = true;
          break;
        }
      }
      if (escaped) {
        failures += 1;
        console.log(`FAIL  marble escaped the trail  ${world}/${difficulty}/L${levelIndex}`);
      }
    }
  }
}

console.log(`${checks - failures}/${checks} generated levels passed (route + containment)`);
if (failures) process.exitCode = 1;