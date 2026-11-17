/**
 * Level generation.
 *
 * Levels are built from a seeded random generator so a given
 * world + difficulty + level number always looks the same, but every new
 * level is different. The difficulty changes *level design* (width, turns,
 * obstacles, moving bumpers) rather than simply making the ball faster.
 */

import { DIFFICULTIES, WORLDS } from './config.js';

const WORLD_HEIGHT = 1500;

function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t
    + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2
    + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t
    + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2
    + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  return { x, y };
}

/** Smooth a control polygon into a dense polyline. */
function smoothPath(controls, perSegment = 18) {
  const pts = [];
  for (let i = 0; i < controls.length - 1; i += 1) {
    const p0 = controls[Math.max(0, i - 1)];
    const p1 = controls[i];
    const p2 = controls[i + 1];
    const p3 = controls[Math.min(controls.length - 1, i + 2)];
    for (let s = 0; s < perSegment; s += 1) {
      pts.push(catmullRom(p0, p1, p2, p3, s / perSegment));
    }
  }
  pts.push({ ...controls[controls.length - 1] });
  return pts;
}

function buildPathMetrics(path) {
  const cum = [0];
  for (let i = 1; i < path.length; i += 1) {
    const d = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    cum.push(cum[i - 1] + d);
  }
  return { cum, total: cum[cum.length - 1] || 1 };
}

function pointAtDistance(path, metrics, dist) {
  const d = clamp(dist, 0, metrics.total);
  let i = 1;
  while (i < metrics.cum.length && metrics.cum[i] < d) i += 1;
  const i0 = Math.max(0, i - 1);
  const segLen = metrics.cum[i] - metrics.cum[i0] || 1;
  const t = (d - metrics.cum[i0]) / segLen;
  const a = path[i0];
  const b = path[Math.min(i, path.length - 1)];
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    nx: -(b.y - a.y) / (segLen || 1),
    ny: (b.x - a.x) / (segLen || 1),
    tx: (b.x - a.x) / (segLen || 1),
    ty: (b.y - a.y) / (segLen || 1),
  };
}

const OBSTACLE_KINDS = {
  garden: ['bush', 'rock', 'mushroom'],
  chase: ['toy', 'block', 'bumper'],
  treasure: ['rock', 'crate', 'barrel'],
};

const DECOR_TYPES = {
  garden: ['flower', 'bush', 'tree', 'mushroom', 'grass', 'rock'],
  chase: ['toy', 'block', 'balloon', 'grass', 'spring'],
  treasure: ['palm', 'rock', 'crate', 'grass', 'shell'],
};

const SURPRISE_ART = {
  garden: 'butterfly',
  chase: 'yarn',
  treasure: 'chest',
};

const LEVEL_KINDS = ['path', 'collect', 'obstacle'];

/**
 * @param {{world:string, difficulty:string, levelIndex:number}} opts
 */
export function generateLevel({ world, difficulty, levelIndex = 0 }) {
  const wd = WORLDS[world] || WORLDS.garden;
  const diff = DIFFICULTIES[difficulty] || DIFFICULTIES.happy;
  const seed = hashString(`${world}|${difficulty}|${levelIndex}`);
  const rng = mulberry32(seed);

  const kind = LEVEL_KINDS[levelIndex % LEVEL_KINDS.length];

  /* ------------------------------- path -------------------------------- */
  const controls = [{ x: 280, y: 780 }];
  let heading = 0;
  let x = 280;
  let y = 780;
  const segCount = diff.segments + (levelIndex % 2 === 0 ? 0 : 1);

  for (let i = 0; i < segCount; i += 1) {
    const len = 260 + rng() * 140;
    heading += (rng() * 2 - 1) * diff.turnAmount;
    heading = clamp(heading, -0.9, 0.9);
    let nx = x + Math.cos(heading) * len;
    let ny = y + Math.sin(heading) * len;

    // Keep the trail inside a comfortable vertical band.
    if (ny < 340) {
      ny = 340 + rng() * 90;
      heading = Math.abs(heading) * 0.6 + 0.12;
    } else if (ny > WORLD_HEIGHT - 320) {
      ny = WORLD_HEIGHT - 320 - rng() * 90;
      heading = -Math.abs(heading) * 0.6 - 0.12;
    }
    x = nx;
    y = ny;
    controls.push({ x, y });
  }

  const path = smoothPath(controls, 20);
  const metrics = buildPathMetrics(path);
  const total = metrics.total;

  /* ----------------------------- obstacles ----------------------------- */
  const obstacles = [];
  const kinds = OBSTACLE_KINDS[world] || OBSTACLE_KINDS.garden;
  const halfWidth = diff.pathWidth / 2;
  const ballR = diff.ballRadius;

  // An obstacle must never be able to seal the path. This caps the radius so
  // the marble always has a clear gap of at least ~26px to roll through.
  const maxObstacleR = Math.max(16, (diff.pathWidth - 2 * ballR - 26) / 2);
  const obstacleR = Math.min(diff.obstacleRadius, maxObstacleR);

  let obstacleCount = diff.obstacleCount;
  if (kind === 'obstacle') obstacleCount += difficulty === 'little' ? 1 : 2;
  if (kind === 'collect') obstacleCount = Math.max(1, obstacleCount - 1);
  const movingCount = diff.movingObstacles + (kind === 'obstacle' && difficulty !== 'little' ? 1 : 0);
  const totalObstacles = obstacleCount + movingCount;

  // Obstacles are spaced evenly along the trail so two of them can never
  // combine to seal the path. The radius cap above guarantees a side gap.
  for (let i = 0; i < totalObstacles; i += 1) {
    const frac = (i + 0.5) / totalObstacles;
    let dist = total * (0.14 + 0.72 * frac) + (rng() - 0.5) * 26;
    dist = clamp(dist, 90, total - 150);
    const p = pointAtDistance(path, metrics, dist);
    const isMoving = i >= obstacleCount;
    const side = (i % 2 === 0 ? 1 : -1);
    const r = isMoving ? obstacleR * 0.78 : obstacleR * (0.9 + rng() * 0.18);
    const base = side * (halfWidth - r - (isMoving ? 9 : 7));

    if (isMoving) {
      const room = Math.max(6, Math.min(18, halfWidth - r - ballR - 14));
      obstacles.push({
        x: p.x + p.nx * base,
        y: p.y + p.ny * base,
        r,
        kind: 'bumper',
        moving: true,
        move: {
          x: p.nx * -side,
          y: p.ny * -side,
          amp: room,
          speed: 1.0 + rng() * 0.5,
          phase: rng() * Math.PI * 2,
        },
      });
    } else {
      obstacles.push({
        x: p.x + p.nx * base,
        y: p.y + p.ny * base,
        r,
        kind: kinds[i % kinds.length],
        seed: rng() * 100,
      });
    }
  }

  /* ---------------------------- collectibles --------------------------- */
  const collectibles = [];
  let collectCount = diff.collectibleCount;
  if (kind === 'collect') collectCount += 3;
  if (kind === 'obstacle') collectCount = Math.max(4, collectCount - 2);
  const lateralRoom = Math.max(12, halfWidth - ballR - 12) * 0.86;

  for (let i = 0; i < collectCount; i += 1) {
    const t = 0.06 + 0.86 * ((i + 0.5) / collectCount);
    const p = pointAtDistance(path, metrics, total * t);
    const lateral = (rng() * 2 - 1) * lateralRoom;
    const type = wd.collectibles[i % wd.collectibles.length];
    collectibles.push({
      x: p.x + p.nx * lateral,
      y: p.y + p.ny * lateral,
      type: type === 'star' && i % 3 === 2 ? wd.collectibles[0] : type,
      phase: rng() * Math.PI * 2,
      taken: false,
      hidden: false,
    });
  }

  /* -------------------------- hidden surprises ------------------------- */
  const surprises = [];
  for (let i = 0; i < diff.hiddenCount; i += 1) {
    const t = 0.22 + 0.6 * ((i + 0.5) / Math.max(1, diff.hiddenCount));
    const p = pointAtDistance(path, metrics, total * t);
    const side = i % 2 === 0 ? 1 : -1;
    const lateral = side * lateralRoom * 0.92;
    surprises.push({
      x: p.x + p.nx * lateral,
      y: p.y + p.ny * lateral,
      type: SURPRISE_ART[world] || 'sparkle',
      phase: rng() * Math.PI * 2,
      taken: false,
      hidden: true,
    });
  }

  /* ---------------------------- checkpoints ---------------------------- */
  const checkpoints = [];
  for (let i = 0; i < diff.checkpoints; i += 1) {
    const t = (i + 1) / (diff.checkpoints + 1);
    const p = pointAtDistance(path, metrics, total * t);
    checkpoints.push({ x: p.x, y: p.y, r: 46, active: false, index: i });
  }

  /* ------------------------------- goal -------------------------------- */
  const last = path[path.length - 1];
  const goal = { x: last.x, y: last.y, r: Math.min(diff.goalRadius, diff.pathWidth * 0.4) };

  /* ----------------------------- features ------------------------------ */
  const features = [];
  if (difficulty !== 'little' || levelIndex % 2 === 1) {
    const bridgeT = 0.3 + rng() * 0.4;
    const bridgeDist = total * bridgeT;
    const bridgeLen = 150 + rng() * 60;
    features.push({ type: 'bridge', from: bridgeDist, to: bridgeDist + bridgeLen });
  }
  if (difficulty !== 'little') {
    const tunnelT = 0.55 + rng() * 0.25;
    features.push({ type: 'tunnel', at: total * tunnelT });
  }

  /* ---------------------------- decorations ---------------------------- */
  const minX = Math.min(...path.map((p) => p.x)) - 560;
  const maxX = Math.max(...path.map((p) => p.x)) + 560;
  const minY = Math.min(...path.map((p) => p.y)) - 420;
  const maxY = Math.max(...path.map((p) => p.y)) + 420;

  const decorations = [];
  const decorKinds = DECOR_TYPES[world] || DECOR_TYPES.garden;
  let attempts = 0;
  while (decorations.length < 46 && attempts < 400) {
    attempts += 1;
    const dx = minX + rng() * (maxX - minX);
    const dy = minY + rng() * (maxY - minY);
    // Keep decorations off the walking surface.
    let minDist = Infinity;
    for (let i = 1; i < path.length; i += 3) {
      const d = Math.hypot(path[i].x - dx, path[i].y - dy);
      if (d < minDist) minDist = d;
    }
    if (minDist < diff.pathWidth * 0.62 + 34) continue;
    if (Math.hypot(dx - goal.x, dy - goal.y) < goal.r + 90) continue;
    if (Math.hypot(dx - path[0].x, dy - path[0].y) < 120) continue;
    decorations.push({
      x: dx,
      y: dy,
      type: decorKinds[Math.floor(rng() * decorKinds.length)],
      scale: 0.75 + rng() * 0.6,
      rot: (rng() * 2 - 1) * 0.14,
      flip: rng() > 0.5 ? -1 : 1,
      tint: rng(),
    });
  }

  // A soft ring of trees/bushes along the outside for a cosy frame.
  for (let i = 0; i < path.length; i += Math.max(6, Math.floor(path.length / 14))) {
    const p = path[i];
    const side = i % 2 === 0 ? 1 : -1;
    const off = diff.pathWidth * 0.62 + 90 + rng() * 70;
    decorations.push({
      x: p.x + p.nx * off * side,
      y: p.y + p.ny * off * side,
      type: decorKinds[i % 3 === 0 ? 1 : 0] || decorKinds[0],
      scale: 0.8 + rng() * 0.5,
      rot: (rng() * 2 - 1) * 0.1,
      flip: 1,
      tint: rng(),
      frame: true,
    });
  }

  return {
    id: `${world}-${difficulty}-${levelIndex}`,
    worldId: world,
    world: wd,
    difficultyId: difficulty,
    difficulty: diff,
    index: levelIndex,
    kind,
    path,
    metrics,
    total,
    pathWidth: diff.pathWidth,
    ballRadius: diff.ballRadius,
    bounce: diff.physics.bounce,
    bumpBounce: diff.physics.bumpBounce,
    start: { x: path[0].x, y: path[0].y },
    goal,
    obstacles,
    collectibles,
    surprises,
    checkpoints,
    features,
    decorations,
    bounds: { minX, minY, maxX, maxY },
    time: 0,
    collected: 0,
    totalCollectibles: collectibles.length,
    surprisesFound: 0,
  };
}

export function pointAlongPath(level, t) {
  return pointAtDistance(level.path, level.metrics, level.total * t);
}

export function levelLabel(level) {
  const names = {
    path: ['Marble Path', 'Winding Trail'],
    collect: ['Collect the Treats', 'Gather the Goodies'],
    obstacle: ['Obstacle Course', 'Bumpy Trail'],
  };
  const list = names[level.kind] || names.path;
  return list[level.index % list.length];
}