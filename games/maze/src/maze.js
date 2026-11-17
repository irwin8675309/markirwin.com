/**
 * Maze Adventures — procedural maze engine.
 *
 * Pure logic, no DOM. Uses randomized depth-first search (recursive
 * backtracker) for a fully connected maze, optional "braiding" to remove dead
 * ends for younger players, and BFS for shortest paths, reachability checks and
 * assistance features.
 *
 * Walls are stored as a 4-bit mask per cell:
 *   N = 1, E = 2, S = 4, W = 8
 */

export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

export const DIRS = [
  { bit: N, opposite: S, dx: 0, dy: -1, name: 'up' },
  { bit: E, opposite: W, dx: 1, dy: 0, name: 'right' },
  { bit: S, opposite: N, dx: 0, dy: 1, name: 'down' },
  { bit: W, opposite: E, dx: -1, dy: 0, name: 'left' },
];

/* ------------------------------------------------------------------ */
/* Seeded random                                                       */
/* ------------------------------------------------------------------ */

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

function shuffle(list, rng) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ------------------------------------------------------------------ */
/* Grid helpers                                                        */
/* ------------------------------------------------------------------ */

export const indexOf = (cols, c, r) => r * cols + c;
export const colOf = (cols, index) => index % cols;
export const rowOf = (cols, index) => Math.floor(index / cols);

export function neighborIndex(cols, rows, index, dir) {
  const c = colOf(cols, index) + dir.dx;
  const r = rowOf(cols, index) + dir.dy;
  if (c < 0 || r < 0 || c >= cols || r >= rows) return -1;
  return indexOf(cols, c, r);
}

export function neighborsOf(cols, rows, index) {
  const out = [];
  for (const dir of DIRS) {
    const n = neighborIndex(cols, rows, index, dir);
    if (n >= 0) out.push({ index: n, dir });
  }
  return out;
}

export function hasWall(cells, index, dir) {
  return (cells[index] & dir.bit) !== 0;
}

export function canMove(cells, cols, rows, index, dir) {
  const n = neighborIndex(cols, rows, index, dir);
  if (n < 0) return false;
  return !hasWall(cells, index, dir);
}

export function directionBetween(cols, from, to) {
  const dc = colOf(cols, to) - colOf(cols, from);
  const dr = rowOf(cols, to) - rowOf(cols, from);
  return DIRS.find((d) => d.dx === dc && d.dy === dr) || null;
}

function carve(cells, cols, from, to, dir) {
  cells[from] &= ~dir.bit;
  cells[to] &= ~dir.opposite;
}

function popcount(n) {
  let c = 0;
  while (n) {
    n &= n - 1;
    c += 1;
  }
  return c;
}

/* ------------------------------------------------------------------ */
/* Generation                                                          */
/* ------------------------------------------------------------------ */

function carvePerfectMaze(cols, rows, rng) {
  const total = cols * rows;
  const cells = new Uint8Array(total).fill(N | E | S | W);
  const visited = new Uint8Array(total);
  const start = Math.floor(rng() * total);
  const stack = [start];
  visited[start] = 1;

  while (stack.length) {
    const current = stack[stack.length - 1];
    const options = [];
    for (const dir of DIRS) {
      const n = neighborIndex(cols, rows, current, dir);
      if (n >= 0 && !visited[n]) options.push({ n, dir });
    }
    if (!options.length) {
      stack.pop();
      continue;
    }
    const pick = options[Math.floor(rng() * options.length)];
    carve(cells, cols, current, pick.n, pick.dir);
    visited[pick.n] = 1;
    stack.push(pick.n);
  }
  return cells;
}

function braidMaze(cells, cols, rows, rng, amount) {
  if (amount <= 0) return;
  const deadEnds = [];
  for (let i = 0; i < cells.length; i += 1) {
    if (popcount(cells[i]) === 3) deadEnds.push(i);
  }
  const order = shuffle(deadEnds, rng);
  const target = Math.round(deadEnds.length * amount);
  let opened = 0;
  for (const index of order) {
    if (opened >= target) break;
    if (popcount(cells[index]) !== 3) continue;
    const choices = DIRS.filter((dir) => {
      const n = neighborIndex(cols, rows, index, dir);
      return n >= 0 && hasWall(cells, index, dir);
    });
    if (!choices.length) continue;
    const dir = choices[Math.floor(rng() * choices.length)];
    const n = neighborIndex(cols, rows, index, dir);
    carve(cells, cols, index, n, dir);
    opened += 1;
  }
}

export function bfsDistances(cells, cols, rows, from) {
  const total = cells.length;
  const dist = new Int32Array(total).fill(-1);
  dist[from] = 0;
  const queue = [from];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head];
    head += 1;
    for (const dir of DIRS) {
      const n = neighborIndex(cols, rows, current, dir);
      if (n < 0 || hasWall(cells, current, dir) || dist[n] !== -1) continue;
      dist[n] = dist[current] + 1;
      queue.push(n);
    }
  }
  return dist;
}

export function bfsPath(cells, cols, rows, from, to) {
  if (from === to) return [from];
  const total = cells.length;
  const prev = new Int32Array(total).fill(-1);
  const seen = new Uint8Array(total);
  seen[from] = 1;
  const queue = [from];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head];
    head += 1;
    if (current === to) break;
    for (const dir of DIRS) {
      const n = neighborIndex(cols, rows, current, dir);
      if (n < 0 || hasWall(cells, current, dir) || seen[n]) continue;
      seen[n] = 1;
      prev[n] = current;
      queue.push(n);
    }
  }
  if (!seen[to]) return [];
  const path = [];
  let cur = to;
  while (cur !== -1) {
    path.push(cur);
    if (cur === from) break;
    cur = prev[cur];
  }
  return path.reverse();
}

export function validateMaze(layout) {
  const { cells, cols, rows, start, goal } = layout;
  const dist = bfsDistances(cells, cols, rows, start);
  const reachable = dist[goal] >= 0;
  let allReachable = true;
  for (let i = 0; i < cells.length; i += 1) {
    if (dist[i] < 0) {
      allReachable = false;
      break;
    }
  }
  return { reachable, allReachable, routeLength: dist[goal] };
}

/* ------------------------------------------------------------------ */
/* Public generator                                                    */
/* ------------------------------------------------------------------ */

/**
 * Generate a complete, solvable maze layout.
 *
 * @param {object} options
 * @param {number} options.cols
 * @param {number} options.rows
 * @param {number} [options.seed]
 * @param {number} [options.braid]       0..1 chance to open each dead end
 * @param {number} [options.routeBias]   0..1 fraction of the longest route
 * @param {number} [options.items]       number of collectibles
 * @param {string[]} options.collectibleTypes
 * @param {string} options.surprise
 * @param {boolean} [options.findFriend]
 * @param {string[]} [options.friendChoices]
 */
export function generateLayout(options) {
  const {
    cols,
    rows,
    seed = Math.floor(Math.random() * 0xffffffff),
    braid = 0,
    routeBias = 1,
    items = 8,
    collectibleTypes = ['star'],
    surprise = 'ladybug',
    findFriend = false,
    friendChoices = [],
  } = options;

  const rng = mulberry32(seed);
  const cells = carvePerfectMaze(cols, rows, rng);
  braidMaze(cells, cols, rows, rng, braid);

  // Start in a random corner — easy for little players to spot.
  const corners = [
    indexOf(cols, 0, 0),
    indexOf(cols, cols - 1, 0),
    indexOf(cols, 0, rows - 1),
    indexOf(cols, cols - 1, rows - 1),
  ];
  const start = corners[Math.floor(rng() * corners.length)];

  const dist = bfsDistances(cells, cols, rows, start);
  let maxDist = 0;
  for (let i = 0; i < dist.length; i += 1) {
    if (dist[i] > maxDist) maxDist = dist[i];
  }

  const targetDist = Math.max(2, Math.round(maxDist * Math.min(1, Math.max(0.2, routeBias))));
  const candidates = [];
  for (let i = 0; i < cells.length; i += 1) {
    if (i === start) continue;
    if (dist[i] >= 2) candidates.push(i);
  }
  candidates.sort((a, b) => Math.abs(dist[a] - targetDist) - Math.abs(dist[b] - targetDist));
  const pool = candidates.slice(0, Math.max(1, Math.min(12, candidates.length)));
  const goal = pool.length ? pool[Math.floor(rng() * pool.length)] : start;

  const solution = bfsPath(cells, cols, rows, start, goal);
  const pathSet = new Set(solution);

  const used = new Set([start, goal]);
  const collectibles = [];
  const types = collectibleTypes.length ? collectibleTypes : ['star'];

  const sideCells = [];
  const routeCells = [];
  for (let i = 0; i < cells.length; i += 1) {
    if (used.has(i)) continue;
    if (pathSet.has(i)) routeCells.push(i);
    else sideCells.push(i);
  }

  const shuffledRoute = shuffle(routeCells, rng);
  const shuffledSide = shuffle(sideCells, rng);
  const onRoute = Math.round(items * 0.6);
  const chosen = [];
  for (let i = 0; i < onRoute && i < shuffledRoute.length; i += 1) chosen.push(shuffledRoute[i]);
  for (let i = 0; i < items - onRoute && i < shuffledSide.length; i += 1) chosen.push(shuffledSide[i]);
  // Fill from whichever pool is left if one ran out.
  if (chosen.length < items) {
    for (const cell of [...shuffledSide, ...shuffledRoute]) {
      if (chosen.length >= items) break;
      if (!chosen.includes(cell)) chosen.push(cell);
    }
  }

  chosen.forEach((index, i) => {
    collectibles.push({
      index,
      type: types[i % types.length],
      kind: 'collect',
      phase: rng() * Math.PI * 2,
    });
    used.add(index);
  });

  // One delightful hidden surprise somewhere off the main route.
  let surpriseCell = -1;
  const surpriseOptions = shuffledSide.filter((i) => !used.has(i));
  if (surpriseOptions.length) {
    surpriseCell = surpriseOptions[Math.floor(rng() * surpriseOptions.length)];
  } else {
    const spare = shuffledRoute.find((i) => !used.has(i));
    if (spare !== undefined) surpriseCell = spare;
  }
  if (surpriseCell >= 0) {
    collectibles.push({
      index: surpriseCell,
      type: surprise,
      kind: 'surprise',
      phase: rng() * Math.PI * 2,
    });
    used.add(surpriseCell);
  }

  // Optional hidden friend, tucked on a side branch near the middle of the
  // route so young players stumble on them without too much searching.
  let friend = null;
  if (findFriend && friendChoices.length) {
    const midStart = Math.floor(solution.length * 0.3);
    const midEnd = Math.ceil(solution.length * 0.7);
    const pathMid = new Set(solution.slice(midStart, midEnd));
    const candidatesFriend = [];
    for (let i = 0; i < cells.length; i += 1) {
      if (pathSet.has(i) || used.has(i)) continue;
      for (const dir of DIRS) {
        const n = neighborIndex(cols, rows, i, dir);
        if (n >= 0 && pathMid.has(n) && !hasWall(cells, i, dir)) {
          candidatesFriend.push(i);
          break;
        }
      }
    }
    let friendIndex = -1;
    if (candidatesFriend.length) {
      friendIndex = candidatesFriend[Math.floor(rng() * candidatesFriend.length)];
    } else {
      const fallback = solution.slice(midStart, midEnd).find((i) => !used.has(i));
      if (fallback !== undefined) friendIndex = fallback;
    }
    // Guarantee a friend even on very short or unusually braided mazes: use
    // any reachable cell that is not the start, the goal or a collectible.
    if (friendIndex < 0) {
      const spare = [];
      for (let i = 0; i < cells.length; i += 1) {
        if (i !== start && i !== goal && !used.has(i)) spare.push(i);
      }
      if (spare.length) friendIndex = spare[Math.floor(rng() * spare.length)];
    }
    // Last resort: a solution cell between start and goal (shared with a
    // collectible is fine — both interactions simply happen together).
    if (friendIndex < 0) {
      const mid = solution.filter((i) => i !== start && i !== goal);
      if (mid.length) friendIndex = mid[Math.floor(rng() * mid.length)];
    }
    if (friendIndex >= 0) {
      const charId = friendChoices[Math.floor(rng() * friendChoices.length)];
      friend = { index: friendIndex, charId, rescued: false };
    }
  }

  const layout = {
    cols,
    rows,
    cells,
    start,
    goal,
    solution,
    pathSet,
    collectibles,
    friend,
    seed,
    itemTotal: collectibles.length,
  };

  // Guarantee the contract: never hand back an unsolvable maze.
  const check = validateMaze(layout);
  if (!check.reachable) {
    return generateLayout({ ...options, seed: (seed + 1) >>> 0 });
  }
  return layout;
}

export function restartLayout(layout) {
  // Deep-enough clone: cells are copied, collectibles/friend are reset.
  return {
    ...layout,
    cells: layout.cells.slice(),
    collectibles: layout.collectibles.map((item) => ({ ...item })),
    friend: layout.friend ? { ...layout.friend, rescued: false } : null,
  };
}

export function mazeStats(layout) {
  let deadEnds = 0;
  for (let i = 0; i < layout.cells.length; i += 1) {
    if (popcount(layout.cells[i]) === 3) deadEnds += 1;
  }
  return {
    deadEnds,
    routeLength: layout.solution.length,
    cells: layout.cells.length,
    items: layout.collectibles.length,
  };
}