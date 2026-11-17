/**
 * Marble physics + collision.
 *
 * The walkable area is the thick polyline of the level path. The marble is a
 * circle; it is kept inside the path by pushing it back to the closest point
 * whenever it would cross an edge. Obstacles are circles (static or moving).
 *
 * This module is deliberately free of DOM and rendering code so it can be
 * unit-tested in Node and tuned independently of the visuals.
 */

export class Ball {
  constructor(x = 0, y = 0, radius = 26) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = radius;
    this.roll = 0;
    this.spin = 0;
    this.bumpFlash = 0;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.roll = 0;
    this.spin = 0;
    this.bumpFlash = 0;
  }

  get speed() {
    return Math.hypot(this.vx, this.vy);
  }
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function distanceToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const lenSq = abx * abx + aby * aby;
  let t = lenSq > 0 ? (apx * abx + apy * aby) / lenSq : 0;
  t = clamp(t, 0, 1);
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  return {
    x: cx,
    y: cy,
    dist: Math.hypot(px - cx, py - cy),
    t,
    segIndex: -1,
  };
}

/**
 * Level collision world. Built once per level, reused every frame.
 */
export class PhysicsWorld {
  constructor(level) {
    this.level = level;
    this.path = level.path;
    this.halfWidth = level.pathWidth / 2;
    this.maxCenterDist = Math.max(12, this.halfWidth - level.ballRadius);
    this.obstacles = level.obstacles;
    this._segCache = null;
  }

  buildSegments() {
    const segs = [];
    for (let i = 0; i < this.path.length - 1; i += 1) {
      segs.push({ ax: this.path[i].x, ay: this.path[i].y, bx: this.path[i + 1].x, by: this.path[i + 1].y });
    }
    this._segCache = segs;
    return segs;
  }

  nearestOnPath(px, py) {
    const segs = this._segCache || this.buildSegments();
    let best = { x: px, y: py, dist: Infinity, t: 0, segIndex: 0 };
    for (let i = 0; i < segs.length; i += 1) {
      const s = segs[i];
      const abx = s.bx - s.ax;
      const aby = s.by - s.ay;
      const lenSq = abx * abx + aby * aby;
      let t = lenSq > 0 ? ((px - s.ax) * abx + (py - s.ay) * aby) / lenSq : 0;
      t = clamp(t, 0, 1);
      const cx = s.ax + abx * t;
      const cy = s.ay + aby * t;
      const dist = Math.hypot(px - cx, py - cy);
      if (dist < best.dist) {
        best = { x: cx, y: cy, dist, t, segIndex: i };
      }
    }
    return best;
  }

  isInside(px, py, margin = 0) {
    return this.nearestOnPath(px, py).dist <= this.maxCenterDist + margin;
  }

  /** Obstacle position at a given time (moving bumpers slide side to side). */
  obstaclePos(o, time) {
    if (!o.move) return o;
    const wave = Math.sin(time * o.move.speed + o.move.phase);
    return {
      x: o.x + o.move.x * o.move.amp * wave,
      y: o.y + o.move.y * o.move.amp * wave,
      vx: o.move.x * o.move.amp * o.move.speed * Math.cos(time * o.move.speed + o.move.phase),
      vy: o.move.y * o.move.amp * o.move.speed * Math.cos(time * o.move.speed + o.move.phase),
    };
  }

  /**
   * Keeps the ball on the path. Returns a collision event when a wall was hit.
   */
  resolvePath(ball) {
    const near = this.nearestOnPath(ball.x, ball.y);
    if (near.dist <= this.maxCenterDist) return null;
    let nx = ball.x - near.x;
    let ny = ball.y - near.y;
    const d = Math.hypot(nx, ny) || 1;
    nx /= d;
    ny /= d;
    const push = near.dist - this.maxCenterDist;
    ball.x -= nx * push;
    ball.y -= ny * push;
    const vn = ball.vx * nx + ball.vy * ny;
    if (vn > 0) {
      const restitution = this.level.bounce ?? 0.3;
      ball.vx -= nx * vn * (1 + restitution);
      ball.vy -= ny * vn * (1 + restitution);
      // A touch of tangential friction so wall scrapes feel soft.
      ball.vx *= 0.985;
      ball.vy *= 0.985;
      return { type: 'wall', x: near.x, y: near.y, nx, ny, strength: Math.min(1, vn / 320) };
    }
    return null;
  }

  /**
   * Circle-vs-circle obstacle response. Returns collision events.
   */
  resolveObstacles(ball, time) {
    const events = [];
    for (const o of this.obstacles) {
      const pos = this.obstaclePos(o, time);
      let dx = ball.x - pos.x;
      let dy = ball.y - pos.y;
      let d = Math.hypot(dx, dy);
      const minD = ball.radius + o.r;
      if (d >= minD) continue;
      if (d < 0.0001) {
        dx = 1;
        dy = 0;
        d = 1;
      }
      const nx = dx / d;
      const ny = dy / d;
      const push = minD - d;
      ball.x += nx * push;
      ball.y += ny * push;

      const rvx = ball.vx - (pos.vx || 0);
      const rvy = ball.vy - (pos.vy || 0);
      const vn = rvx * nx + rvy * ny;
      if (vn < 0) {
        const restitution = o.move ? (this.level.bumpBounce ?? 0.45) : (this.level.bounce ?? 0.3);
        ball.vx -= nx * vn * (1 + restitution);
        ball.vy -= ny * vn * (1 + restitution);
        if (pos.vx || pos.vy) {
          ball.vx += (pos.vx || 0) * 0.35;
          ball.vy += (pos.vy || 0) * 0.35;
        }
        ball.bumpFlash = 1;
        events.push({
          type: 'obstacle',
          x: pos.x + nx * o.r,
          y: pos.y + ny * o.r,
          nx,
          ny,
          strength: Math.min(1, -vn / 300),
          obstacle: o,
        });
      }
    }
    return events;
  }

  /** True when the ball is close enough to the target hole to finish. */
  reachedGoal(ball) {
    const g = this.level.goal;
    const d = Math.hypot(ball.x - g.x, ball.y - g.y);
    return d < g.r * 0.72;
  }
}

/**
 * Advance the marble one fixed step.
 *
 * @param {Ball} ball
 * @param {{x:number,y:number}} input  normalised tilt, -1..1
 * @param {number} dt seconds
 * @param {PhysicsWorld} world
 * @param {object} physics {accel, drag, maxSpeed}
 * @param {number} speedScale global speed multiplier
 * @returns {{wall: object|null, obstacles: object[]}}
 */
export function stepBall(ball, input, dt, world, physics, speedScale = 1) {
  const accel = physics.accel * speedScale;
  const maxSpeed = physics.maxSpeed * speedScale;
  const drag = physics.drag;

  ball.vx += input.x * accel * dt;
  ball.vy += input.y * accel * dt;

  // Exponential drag keeps deceleration smooth and frame-rate independent.
  const damp = Math.exp(-drag * dt);
  ball.vx *= damp;
  ball.vy *= damp;

  // Stop almost-still balls instead of letting them creep forever.
  if (Math.abs(ball.vx) < 1.2 && Math.abs(ball.vy) < 1.2 && Math.abs(input.x) < 0.02 && Math.abs(input.y) < 0.02) {
    ball.vx = 0;
    ball.vy = 0;
  }

  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed > maxSpeed) {
    const k = maxSpeed / speed;
    ball.vx *= k;
    ball.vy *= k;
  }

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  const wall = world.resolvePath(ball);
  const obstacles = world.resolveObstacles(ball, world.level.time || 0);

  // Keep the roll angle in sync so the marble visibly spins.
  ball.roll += (ball.vx * dt) / Math.max(8, ball.radius);
  ball.spin += (ball.vy * dt) / Math.max(8, ball.radius);
  if (ball.bumpFlash > 0) ball.bumpFlash = Math.max(0, ball.bumpFlash - dt * 3.5);

  return { wall, obstacles };
}

/**
 * Sub-stepped integration so a fast marble can never tunnel through a wall.
 */
export function stepBallSafe(ball, input, dt, world, physics, speedScale = 1) {
  const speed = ball.speed;
  const maxTravel = Math.max(4, ball.radius * 0.45);
  const steps = Math.min(6, Math.max(1, Math.ceil((speed * dt) / maxTravel)));
  const sub = dt / steps;
  let wall = null;
  let obstacles = [];
  for (let i = 0; i < steps; i += 1) {
    const res = stepBall(ball, input, sub, world, physics, speedScale);
    if (res.wall) wall = res.wall;
    if (res.obstacles.length) obstacles = obstacles.concat(res.obstacles);
  }
  return { wall, obstacles };
}