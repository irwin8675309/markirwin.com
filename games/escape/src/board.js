/**
 * Ghosty, Spin, and Oakley's Great Escape — board logic.
 *
 * Pure logic, no DOM. Turns the small ASCII level maps into structured boards
 * and provides tap-to-move pathfinding, drag-and-drop validation and gentle
 * assistance helpers. Keeping this free of rendering makes the whole puzzle
 * model easy to test and reuse.
 */

export const WALL = 1;

/** Small deterministic PRNG so renderers/tests can share a stable stream. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Legend ------------------------------------------------------------ */

const OBJECT_CHARS = {
  P: 'pillow',
  C: 'cushion',
  B: 'block',
  X: 'box',
  O: 'ball',
  K: 'crate',
};

const COLLECTIBLE_CHARS = {
  '*': 'star',
  h: 'heart',
  t: 'treat',
  w: 'sparkle',
  m: 'gem',
  y: 'butterfly',
};

export const BLOCK_KEYS = ['block', 'blockBlue', 'blockYellow'];

export const indexOf = (cols, c, r) => r * cols + c;
export const colOf = (cols, index) => index % cols;
export const rowOf = (cols, index) => Math.floor(index / cols);

export function neighborIndex(cols, rows, index, dc, dr) {
  const c = colOf(cols, index) + dc;
  const r = rowOf(cols, index) + dr;
  if (c < 0 || r < 0 || c >= cols || r >= rows) return -1;
  return indexOf(cols, c, r);
}

const NEIGHBORS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/* Parsing ----------------------------------------------------------- */

function blockKeyFor(kind, index) {
  if (kind === 'block') return BLOCK_KEYS[index % BLOCK_KEYS.length];
  return kind;
}

/**
 * Parse an array of equal-length ASCII rows into a board layout.
 * Throws if the map is malformed so authoring mistakes fail loudly.
 */
export function parseMap(rows) {
  if (!Array.isArray(rows) || rows.length < 3) {
    throw new Error('A level map needs at least 3 rows.');
  }
  const cols = rows[0].length;
  const height = rows.length;
  for (const row of rows) {
    if (row.length !== cols) {
      throw new Error(`Map row length mismatch: "${row}" (expected ${cols}).`);
    }
  }

  const walls = new Uint8Array(cols * height);
  const objects = [];
  const collectibles = [];
  const friends = [];
  let start = -1;
  let goal = -1;

  for (let r = 0; r < height; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const ch = rows[r][c];
      const index = indexOf(cols, c, r);
      if (ch === '#') {
        walls[index] = WALL;
      } else if (ch === 'S') {
        start = index;
      } else if (ch === 'G') {
        goal = index;
      } else if (ch === 'F') {
        friends.push(index);
      } else if (OBJECT_CHARS[ch]) {
        const kind = OBJECT_CHARS[ch];
        objects.push({ index, kind, key: blockKeyFor(kind, index) });
      } else if (COLLECTIBLE_CHARS[ch]) {
        collectibles.push({ index, type: COLLECTIBLE_CHARS[ch], phase: (index % 17) * 0.37 });
      } else if (ch !== '.') {
        throw new Error(`Unknown map character "${ch}" at ${c},${r}.`);
      }
    }
  }

  if (start < 0) throw new Error('Map is missing a start (S).');
  if (goal < 0) throw new Error('Map is missing a destination (G).');

  return {
    cols,
    rows: height,
    walls,
    start,
    goal,
    objects,
    collectibles,
    friends,
    totalCollectibles: collectibles.length,
    hasFriend: friends.length > 0,
  };
}

/* Queries ----------------------------------------------------------- */

export function isWall(layout, index) {
  if (index < 0 || index >= layout.walls.length) return true;
  return layout.walls[index] === WALL;
}

export function objectAt(layout, index, objects = layout.objects) {
  return objects.find((o) => o.index === index) || null;
}

export function isInside(layout, c, r) {
  return c >= 0 && r >= 0 && c < layout.cols && r < layout.rows;
}

/* Pathfinding ------------------------------------------------------- */

/**
 * Breadth-first shortest path from `from` to `to`.
 * `blocked` is a Set of cell indices that cannot be entered (e.g. movable
 * objects currently sitting on the floor). Returns an array of cell indices
 * including both endpoints, or [] when no route exists.
 */
export function bfsPath(layout, from, to, blocked) {
  if (from < 0 || to < 0) return [];
  if (from === to) return [from];
  const total = layout.cols * layout.rows;
  const prev = new Int32Array(total).fill(-1);
  const seen = new Uint8Array(total);
  seen[from] = 1;
  const queue = [from];
  let head = 0;
  const isBlocked = (idx) => blocked && blocked.has(idx);
  while (head < queue.length) {
    const current = queue[head];
    head += 1;
    if (current === to) break;
    const c = colOf(layout.cols, current);
    const r = rowOf(layout.cols, current);
    for (const [dc, dr] of NEIGHBORS) {
      const nc = c + dc;
      const nr = r + dr;
      if (!isInside(layout, nc, nr)) continue;
      const n = indexOf(layout.cols, nc, nr);
      if (seen[n] || isWall(layout, n) || isBlocked(n)) continue;
      seen[n] = 1;
      prev[n] = current;
      queue.push(n);
    }
  }
  if (!seen[to]) return [];
  const path = [];
  let cur = to;
  let guard = 0;
  while (cur !== -1 && guard < total + 2) {
    path.push(cur);
    if (cur === from) break;
    cur = prev[cur];
    guard += 1;
  }
  return path.reverse();
}

export function pathExists(layout, from, to, blocked) {
  return bfsPath(layout, from, to, blocked).length > 0;
}

/* Validation -------------------------------------------------------- */

/**
 * A level is considered solvable when a route from start to goal exists once
 * the movable objects are treated as movable (i.e. ignored), because the child
 * can always set an object down on any free floor tile. We also require at
 * least one free floor tile per movable object so there is somewhere to put
 * them, and that every friend and collectible sits on a reachable floor tile.
 */
export function validateLayout(layout) {
  const problems = [];
  const { cols, rows, walls, start, goal } = layout;
  const free = [];
  const freeSet = new Set();
  for (let i = 0; i < walls.length; i += 1) {
    if (walls[i] === WALL) continue;
    if (i === start || i === goal) continue;
    if (objectAt(layout, i)) continue;
    if (layout.collectibles.some((c) => c.index === i)) continue;
    if (layout.friends.includes(i)) continue;
    free.push(i);
    freeSet.add(i);
  }

  const path = bfsPath(layout, start, goal, null);
  const reachableGoal = path.length > 0;

  const reach = reachableSet(layout, start, null);
  const unreachableFriends = layout.friends.filter((i) => !reach.has(i));
  const unreachableCollectibles = layout.collectibles.filter((c) => !reach.has(c.index));

  if (!reachableGoal) problems.push('start cannot reach the destination');
  if (layout.objects.length > free.length) {
    problems.push('not enough free floor tiles to set objects down');
  }
  if (unreachableFriends.length) problems.push('a friend is unreachable');
  if (unreachableCollectibles.length) problems.push('a collectible is unreachable');

  return {
    ok: problems.length === 0,
    problems,
    routeLength: path.length,
    freeTiles: free.length,
    objects: layout.objects.length,
    collectibles: layout.collectibles.length,
    friends: layout.friends.length,
    cols,
    rows,
  };
}

export function reachableSet(layout, from, blocked) {
  const seen = new Set();
  if (from < 0) return seen;
  const queue = [from];
  seen.add(from);
  let head = 0;
  while (head < queue.length) {
    const current = queue[head];
    head += 1;
    const c = colOf(layout.cols, current);
    const r = rowOf(layout.cols, current);
    for (const [dc, dr] of NEIGHBORS) {
      const nc = c + dc;
      const nr = r + dr;
      if (!isInside(layout, nc, nr)) continue;
      const n = indexOf(layout.cols, nc, nr);
      if (seen.has(n) || isWall(layout, n)) continue;
      if (blocked && blocked.has(n)) continue;
      seen.add(n);
      queue.push(n);
    }
  }
  return seen;
}

/* Object dragging --------------------------------------------------- */

/**
 * Decide where a dragged object should land.
 * Accepts any free floor tile that is not a wall, not the start/goal, not
 * another object and not a collectible. Falls back to the object's origin.
 * This is deliberately forgiving — children can drop objects almost anywhere.
 */
export function resolveDrop(layout, objects, objectIndex, targetCell) {
  const moving = objects.find((o) => o.index === objectIndex);
  if (!moving) return { ok: false, index: objectIndex, reason: 'missing' };

  const occupied = new Set();
  for (const o of objects) {
    if (o.index !== objectIndex) occupied.add(o.index);
  }
  for (const c of layout.collectibles) occupied.add(c.index);
  occupied.add(layout.start);
  occupied.add(layout.goal);

  const valid = (idx) =>
    idx >= 0 &&
    idx < layout.walls.length &&
    layout.walls[idx] !== WALL &&
    !occupied.has(idx);

  if (valid(targetCell) && targetCell !== objectIndex) {
    return { ok: true, index: targetCell, moved: true };
  }
  return { ok: false, index: objectIndex, moved: false };
}

export function applyDrop(objects, objectIndex, newIndex) {
  const obj = objects.find((o) => o.index === objectIndex);
  if (obj) obj.index = newIndex;
  return objects;
}

/* Assistance -------------------------------------------------------- */

/**
 * Work out the next helpful thing to do.
 *  - If a clear route exists, suggest walking the pet to the destination.
 *  - Otherwise find the movable object whose removal best opens the route and
 *    suggest moving it, returning a good free destination cell for it.
 */
export function computeHint(layout, petIndex, objects) {
  const blocked = new Set(objects.map((o) => o.index));
  const direct = bfsPath(layout, petIndex, layout.goal, blocked);
  if (direct.length > 0) {
    return { type: 'path', path: direct };
  }

  // Try removing each object and see which one restores a route soonest.
  let best = null;
  for (const obj of objects) {
    const trial = new Set(blocked);
    trial.delete(obj.index);
    const p = bfsPath(layout, petIndex, layout.goal, trial);
    if (p.length > 0) {
      if (!best || p.length < best.path.length) {
        best = { type: 'object', objectIndex: obj.index, path: p };
      }
    }
  }
  if (best) {
    const spot = findFreeNeighbor(layout, petIndex, best.objectIndex, objects);
    return { ...best, dropIndex: spot };
  }

  // No single object clears it: pick any object and a free tile.
  if (objects.length) {
    const obj = objects[0];
    const spot = findFreeNeighbor(layout, petIndex, obj.index, objects);
    return { type: 'object', objectIndex: obj.index, dropIndex: spot, path: [] };
  }
  return { type: 'none' };
}

function findFreeNeighbor(layout, fromIndex, avoidIndex, objects) {
  const occupied = new Set(objects.map((o) => o.index));
  occupied.delete(avoidIndex);
  occupied.add(layout.start);
  occupied.add(layout.goal);
  for (const c of layout.collectibles) occupied.add(c.index);
  const seen = reachableSet(layout, fromIndex, occupied);
  let best = -1;
  let bestDist = Infinity;
  const fromC = colOf(layout.cols, fromIndex);
  const fromR = rowOf(layout.cols, fromIndex);
  for (const idx of seen) {
    if (occupied.has(idx)) continue;
    if (idx === avoidIndex) continue;
    const d = Math.abs(colOf(layout.cols, idx) - fromC) + Math.abs(rowOf(layout.cols, idx) - fromR);
    if (d < bestDist) {
      bestDist = d;
      best = idx;
    }
  }
  if (best < 0) {
    for (let i = 0; i < layout.walls.length; i += 1) {
      if (layout.walls[i] === WALL || occupied.has(i)) continue;
      best = i;
      break;
    }
  }
  return best;
}

/* Runtime board ----------------------------------------------------- */

/**
 * Create a fresh, mutable runtime copy of a parsed layout for one play
 * session: objects get live positions and collectibles/friends are reset.
 */
export function createRuntimeBoard(layout) {
  return {
    cols: layout.cols,
    rows: layout.rows,
    walls: layout.walls.slice(),
    start: layout.start,
    goal: layout.goal,
    objects: layout.objects.map((o) => ({ ...o, fromIndex: o.index })),
    collectibles: layout.collectibles.map((c) => ({ ...c, collected: false })),
    friends: layout.friends.map((index) => ({ index, rescued: false, charId: null })),
    totalCollectibles: layout.collectibles.length,
    hasFriend: layout.friends.length > 0,
  };
}

/**
 * Deterministic shuffle helper re-exported for renderers/tests that want a
 * stable random stream without importing anything else.
 */
export { mulberry32 as seededRandom };