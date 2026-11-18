/**
 * Level validation tests for Ghosty, Spin, and Oakley's Great Escape.
 *
 * Run with:  node tests/levels.test.mjs
 *
 * These check the things that are easy to get wrong when authoring ASCII maps:
 * every row is the right width, each map has a start and a destination, every
 * difficulty map parses, all maps are solvable, and the intended mechanics
 * (movable objects, collectibles, friends) are actually present.
 */

import { LEVELS, LEVEL_BY_ID, levelsForWorld, nextLevel } from '../src/levels.js';
import { parseMap, validateLayout, bfsPath, resolveDrop, createRuntimeBoard, computeHint } from '../src/board.js';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
  } else {
    failed += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const DIFFICULTIES = ['little', 'happy', 'super'];

check('there are at least 8 levels', LEVELS.length >= 8, `found ${LEVELS.length}`);
check('there are exactly 4 worlds', new Set(LEVELS.map((l) => l.world)).size === 4);
check('level ids are unique', new Set(LEVELS.map((l) => l.id)).size === LEVELS.length);
check('LEVEL_BY_ID matches LEVELS', Object.keys(LEVEL_BY_ID).length === LEVELS.length);

for (const level of LEVELS) {
  check(`${level.id}: has all three difficulties`, DIFFICULTIES.every((d) => Array.isArray(level.maps[d]) && level.maps[d].length > 0));
  check(`${level.id}: has a name`, typeof level.name === 'string' && level.name.length > 0);
  check(`${level.id}: has a story`, typeof level.story === 'string' && level.story.length > 0);

  for (const diff of DIFFICULTIES) {
    const rows = level.maps[diff];
    if (!rows) continue;
    const cols = rows[0].length;
    check(`${level.id}/${diff}: rows are rectangular`, rows.every((r) => r.length === cols), `width ${cols}`);

    let layout;
    try {
      layout = parseMap(rows);
    } catch (err) {
      check(`${level.id}/${diff}: parses`, false, err.message);
      continue;
    }
    check(`${level.id}/${diff}: parses`, true);

    const report = validateLayout(layout);
    check(`${level.id}/${diff}: solvable`, report.ok, report.problems.join(', '));

    // The straight-line route (ignoring movable objects) must exist.
    const path = bfsPath(layout, layout.start, layout.goal, null);
    check(`${level.id}/${diff}: start reaches goal`, path.length > 0);

    // Difficulty flavour: Little should have movable objects to move but be
    // gentle; harder maps should generally have at least as many objects.
    if (diff === 'little') {
      check(`${level.id}/little: has at least one movable object`, layout.objects.length >= 1);
    }
    check(`${level.id}/${diff}: has at least one collectible`, layout.collectibles.length >= 1);

    // Difficulty comes from longer, more walled routes rather than more objects.
    const wallCount = layout.walls.reduce((a, b) => a + b, 0);

    // Runtime board creation and hinting must not throw.
    const board = createRuntimeBoard(layout);
    const hint = computeHint(
      { ...layout, collectibles: layout.collectibles },
      board.start,
      board.objects,
    );
    check(`${level.id}/${diff}: computeHint returns a hint`, hint && typeof hint.type === 'string');

    // resolveDrop always returns a landing cell for the first object.
    if (board.objects.length) {
      const drop = resolveDrop(layout, board.objects, board.objects[0].index, board.goal);
      check(`${level.id}/${diff}: resolveDrop returns a cell`, Number.isInteger(drop.index));
    }
  }

  // Harder difficulties should not be shorter in route length than easier ones.
  const routeLen = (d) => bfsPath(parseMap(level.maps[d]), parseMap(level.maps[d]).start, parseMap(level.maps[d]).goal, null).length;
  if (DIFFICULTIES.every((d) => level.maps[d])) {
    const rl = routeLen('little');
    const rh = routeLen('happy');
    const rs = routeLen('super');
    check(`${level.id}: happy is not shorter than little`, rh >= rl, `happy ${rh} < little ${rl}`);
    check(`${level.id}: super is not shorter than happy`, rs >= rh, `super ${rs} < happy ${rh}`);
  }
}

// World helpers
for (const worldId of ['pillow', 'backyard', 'toybox', 'adventure']) {
  check(`world ${worldId} has levels`, levelsForWorld(worldId).length >= 2);
}

// nextLevel chain
check('nextLevel of first is second', nextLevel(LEVELS[0].id)?.id === LEVELS[1].id);
check('nextLevel of last is null', nextLevel(LEVELS[LEVELS.length - 1].id) === null);
check('nextLevel of unknown is null', nextLevel('nope') === null);

// Difficulty scaling: harder maps should be longer and more walled.
const totalWalls = (d) => LEVELS.reduce((sum, l) => sum + parseMap(l.maps[d]).walls.reduce((a, b) => a + b, 0), 0);
const littleWalls = totalWalls('little');
const happyWalls = totalWalls('happy');
const superWalls = totalWalls('super');
check('total walls trend upward', superWalls >= happyWalls && happyWalls >= littleWalls, `little ${littleWalls}, happy ${happyWalls}, super ${superWalls}`);

// Report
const total = passed + failed;
if (failed === 0) {
  console.log(`\n✅ All ${total} level checks passed across ${LEVELS.length} levels × 3 difficulties.`);
  process.exit(0);
} else {
  console.error(`\n❌ ${failed} of ${total} checks failed:\n`);
  for (const f of failures) console.error('  • ' + f);
  process.exit(1);
}