/**
 * Ghosty, Spin, and Oakley's Great Escape — gameplay controller.
 *
 * Owns one play session: grid movement with tap-to-move pathfinding,
 * drag-and-drop of movable objects, collectibles, the hidden friend, gentle
 * assistance and completion detection. The renderer only draws what this class
 * reports; ./board.js only generates and validates layouts. Keeping the three
 * separate makes every part easy to test and reuse.
 */

import {
  CHARACTERS,
  DIFFICULTIES,
  MESSAGES,
  SPEED_SETTINGS,
  getCharacter,
  getDifficulty,
  getWorld,
} from './config.js';
import {
  applyDrop,
  bfsPath,
  computeHint,
  createRuntimeBoard,
  parseMap,
  resolveDrop,
  isWall,
} from './board.js';

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export class EscapeGame {
  constructor(renderer, audio, options = {}) {
    this.renderer = renderer;
    this.audio = audio;
    this.onCollect = options.onCollect || (() => {});
    this.onFriend = options.onFriend || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onToast = options.onToast || (() => {});
    this.onObjectMove = options.onObjectMove || (() => {});

    this.layout = null;
    this.board = null;
    this.world = null;
    this.difficulty = null;
    this.character = 'ghosty';
    this.level = null;

    // Pet state (pixel position within the board's local space).
    this.petCell = 0;
    this.petPos = { x: 0, y: 0 };
    this.petPath = [];
    this.petMoveIndex = 0;
    this.petT = 0;
    this.moving = false;
    this.facing = 1;
    this.speedMultiplier = 1;

    this.collected = new Set();
    this.collectedCount = 0;

    // Drag state.
    this.drag = null;

    // Hints / assistance.
    this.hintState = { active: false, until: 0 };
    this.assistPulse = 0;

    // Effects.
    this.particles = [];
    this.time = 0;
    this.spin = 0;
    this.spinTimer = 4 + Math.random() * 3;
    this.spinElapsed = 0;
    this.spinDuration = 0;

    this.paused = false;
    this.completed = false;
    this.raf = null;
    this.lastFrame = 0;

    this.loop = this.loop.bind(this);
  }

  /* ------------------------------------------------------------------ */
  /* Session lifecycle                                                  */
  /* ------------------------------------------------------------------ */

  start({ level, worldId, difficultyId, character }) {
    this.level = level;
    this.world = getWorld(worldId);
    this.difficulty = getDifficulty(difficultyId);
    this.character = getCharacter(character).id;
    this.audio?.setMusicTheme(this.world.id);

    const layout = parseMap(level.maps[this.difficulty.id]);
    this.layout = layout;
    this.board = createRuntimeBoard(layout);

    this.petCell = this.board.start;
    const startPoint = this.renderer.cellCenter(this.petCell);
    this.petPos = { x: startPoint.x, y: startPoint.y };
    this.petPath = [];
    this.petMoveIndex = 0;
    this.petT = 0;
    this.moving = false;
    this.facing = 1;
    this.speedMultiplier = this.speedMultiplierFor();

    this.collected = new Set();
    this.collectedCount = 0;
    this.drag = null;
    this.hintState = { active: false, until: 0 };
    this.particles = [];
    this.completed = false;
    this.paused = false;
    this.time = 0;
    this.spin = 0;

    this.renderer.setLevel(layout, this.world.id, hashSeed(level.id));
    this.resetFriendPositions();

    this.audio?.sfx('start');
    this.startLoop();

    // Little players benefit from a gentle nudge on the easiest setting.
    if (this.difficulty.guides === 'always') {
      this.showHint(2600);
    }
  }

  speedMultiplierFor() {
    const base = this.difficulty?.speed || 2.4;
    const setting = SPEED_SETTINGS[this.speedSetting] || SPEED_SETTINGS.normal;
    return base * setting.multiplier;
  }

  setSpeedSetting(id) {
    this.speedSetting = id;
    if (!this.completed) this.speedMultiplier = this.speedMultiplierFor();
  }

  resetFriendPositions() {
    this.friendPos = new Map();
    for (const friend of this.board.friends) {
      const p = this.renderer.cellCenter(friend.index);
      this.friendPos.set(friend.index, { x: p.x, y: p.y });
    }
  }

  stop() {
    this.stopLoop();
    this.drag = null;
  }

  /* ------------------------------------------------------------------ */
  /* Main loop                                                          */
  /* ------------------------------------------------------------------ */

  startLoop() {
    this.stopLoop();
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stopLoop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    if (!this.paused) this.update(dt);
    this.render();
    if (this.raf) this.raf = requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.time += dt;
    this.updateMovement(dt);
    this.updateSpin(dt);
    this.updateParticles(dt);
    if (this.hintState.active && this.time > this.hintState.until) {
      this.hintState.active = false;
    }
  }

  updateMovement(dt) {
    if (!this.moving || !this.petPath.length) {
      this.moving = false;
      return;
    }
    // speedMultiplier is in cells/second; convert to pixels/second.
    const cell = this.renderer.metrics?.cell || 40;
    const speed = this.speedMultiplier * cell;
    let remaining = dt * speed;
    let guard = 0;
    while (remaining > 0 && this.petMoveIndex < this.petPath.length && guard < 8) {
      guard += 1;
      const targetCell = this.petPath[this.petMoveIndex];
      const target = this.renderer.cellCenter(targetCell);
      const dx = target.x - this.petPos.x;
      const dy = target.y - this.petPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= remaining || dist < 0.5) {
        this.petPos.x = target.x;
        this.petPos.y = target.y;
        this.petCell = targetCell;
        this.petMoveIndex += 1;
        remaining -= dist;
        this.onEnterCell(targetCell);
      } else {
        this.petPos.x += (dx / dist) * remaining;
        this.petPos.y += (dy / dist) * remaining;
        if (Math.abs(dx) > 0.5) this.facing = dx > 0 ? 1 : -1;
        remaining = 0;
      }
    }
    if (this.petMoveIndex >= this.petPath.length) {
      this.moving = false;
      this.petPath = [];
      this.petMoveIndex = 0;
    }
  }

  updateSpin(dt) {
    if (this.spin > 0) {
      this.spinElapsed += dt;
      const t = Math.min(1, this.spinElapsed / this.spinDuration);
      this.spin = t;
      if (t >= 1) {
        this.spin = 0;
        this.spinTimer = 4 + Math.random() * 4;
      }
    } else if (this.character === 'spin') {
      this.spinTimer -= dt;
      if (this.spinTimer <= 0) {
        this.spinDuration = 0.6;
        this.spinElapsed = 0;
        this.spin = 0.0001;
      }
    }
  }

  updateParticles(dt) {
    if (!this.particles.length) return;
    const alive = [];
    for (const p of this.particles) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity ?? 140) * dt;
      p.rot = (p.rot || 0) + (p.spin || 0) * dt;
      alive.push(p);
    }
    this.particles = alive;
  }

  /* ------------------------------------------------------------------ */
  /* Movement input                                                     */
  /* ------------------------------------------------------------------ */

  /** Tap-to-move: walk the pet toward a cell if a clear route exists. */
  tapCell(cellIndex) {
    if (this.paused || this.completed || cellIndex < 0) return false;
    if (isWall(this.layout, cellIndex)) {
      this.audio?.sfx('bump');
      this.onToast(pick(MESSAGES.bump));
      this.bumpEffect(cellIndex);
      return false;
    }
    const blocked = new Set(this.board.objects.map((o) => o.index));
    const path = bfsPath(this.layout, this.petCell, cellIndex, blocked);
    if (path.length <= 1) {
      if (path.length === 1) this.onEnterCell(cellIndex);
      return path.length > 0;
    }
    // If the pet is mid-step, finish the current cell first, then follow.
    this.petPath = path;
    this.petMoveIndex = this.moving ? Math.max(1, this.petMoveIndex) : 1;
    if (!this.moving) {
      // Snap to the centre of the current cell before starting.
      const c = this.renderer.cellCenter(this.petCell);
      this.petPos.x = c.x;
      this.petPos.y = c.y;
      this.petMoveIndex = 1;
      this.moving = true;
      this.audio?.sfx('step');
    }
    return true;
  }

  onEnterCell(cellIndex) {
    // Collectibles.
    for (const item of this.board.collectibles) {
      if (item.index === cellIndex && !item.collected && !this.collected.has(item.index)) {
        item.collected = true;
        this.collected.add(item.index);
        this.collectedCount += 1;
        this.audio?.sfx('collect');
        this.burst(this.renderer.cellCenter(cellIndex), '#ffd84d', 10, 'star');
        this.onCollect(item.type, this.collectedCount, this.collectedTotal());
      }
    }
    // Friends.
    for (const friend of this.board.friends) {
      if (friend.index === cellIndex && !friend.rescued) {
        friend.rescued = true;
        this.audio?.sfx('friend');
        this.burst(this.renderer.cellCenter(cellIndex), '#ff9ec7', 18, 'star');
        this.onFriend(friend.charId);
      }
    }
    // Destination.
    if (cellIndex === this.board.goal && !this.completed) {
      this.finish();
    }
  }

  collectedTotal() {
    return this.board ? this.board.totalCollectibles : 0;
  }

  /* ------------------------------------------------------------------ */
  /* Drag and drop                                                      */
  /* ------------------------------------------------------------------ */

  /** Begin dragging the movable object under a board-local pixel position. */
  beginDrag(localX, localY) {
    if (this.paused || this.completed) return false;
    const idx = this.localToCell(localX, localY);
    const obj = this.board.objects.find((o) => o.index === idx);
    if (!obj) return false;
    this.drag = {
      objectIndex: obj.index,
      key: obj.key,
      pointerX: localX,
      pointerY: localY,
      targetIndex: obj.index,
      valid: false,
    };
    this.audio?.sfx('pick');
    return true;
  }

  localToCell(localX, localY) {
    if (!this.renderer.metrics) return -1;
    const { cell, boardX, boardY } = this.renderer.metrics;
    const c = Math.floor((localX - boardX) / cell);
    const r = Math.floor((localY - boardY) / cell);
    const cols = this.layout.cols;
    const rows = this.layout.rows;
    if (c < 0 || r < 0 || c >= cols || r >= rows) return -1;
    return r * cols + c;
  }

  updateDrag(localX, localY) {
    if (!this.drag) return;
    this.drag.pointerX = localX;
    this.drag.pointerY = localY;
    const target = this.localToCell(localX, localY);
    const outcome = resolveDrop(this.layout, this.board.objects, this.drag.objectIndex, target);
    this.drag.targetIndex = outcome.ok ? outcome.index : target;
    this.drag.valid = outcome.ok && outcome.moved;
  }

  /** Drop the dragged object. Returns true if it moved to a new tile. */
  endDrag() {
    if (!this.drag) return false;
    const outcome = resolveDrop(this.layout, this.board.objects, this.drag.objectIndex, this.drag.targetIndex);
    const moved = outcome.ok && outcome.moved;
    if (moved) {
      applyDrop(this.board.objects, this.drag.objectIndex, outcome.index);
      this.audio?.sfx('drop');
      this.burst(this.renderer.cellCenter(outcome.index), '#7ce3a8', 8, 'dot');
      this.onObjectMove(outcome.index);
    } else {
      this.audio?.sfx('bump');
    }
    this.drag = null;
    return moved;
  }

  cancelDrag() {
    this.drag = null;
  }

  /* ------------------------------------------------------------------ */
  /* Assistance                                                         */
  /* ------------------------------------------------------------------ */

  showHint(duration = 3200) {
    const hint = computeHint(this.layout, this.petCell, this.board.objects);
    this.hintState = {
      active: true,
      until: this.time + duration / 1000,
      data: hint,
    };
    this.audio?.sfx('hint');
    return hint;
  }

  /** Gently perform the next step for a stuck child. */
  assist() {
    if (this.paused || this.completed) return;
    const hint = computeHint(this.layout, this.petCell, this.board.objects);
    if (hint.type === 'path') {
      this.tapCell(this.board.goal);
      this.showHint(1600);
      return;
    }
    if (hint.type === 'object' && hint.objectIndex != null && hint.dropIndex != null && hint.dropIndex >= 0) {
      applyDrop(this.board.objects, hint.objectIndex, hint.dropIndex);
      this.audio?.sfx('drop');
      this.burst(this.renderer.cellCenter(hint.dropIndex), '#7ce3a8', 10, 'dot');
      this.onObjectMove(hint.dropIndex);
      this.onToast(pick(MESSAGES.drop));
      this.showHint(2200);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Completion                                                         */
  /* ------------------------------------------------------------------ */

  finish() {
    if (this.completed) return;
    this.completed = true;
    this.moving = false;
    this.audio?.sfx('celebrate');
    this.celebrateBurst();
    this.onComplete({
      character: this.character,
      level: this.level,
      collected: this.collectedCount,
      total: this.collectedTotal(),
      friend: this.board.friends.some((f) => f.rescued),
    });
  }

  /* ------------------------------------------------------------------ */
  /* Effects                                                            */
  /* ------------------------------------------------------------------ */

  burst(point, color, count = 12, type = 'dot') {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        type,
        x: point.x,
        y: point.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        gravity: type === 'confetti' ? 90 : 160,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1.1,
        size: 3 + Math.random() * 5,
        color,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 8,
      });
    }
  }

  celebrateBurst() {
    const colors = ['#ff8fb5', '#ffd84d', '#7ce3a8', '#8fdcff', '#c9a7ff'];
    const { boardW, boardH, boardX, boardY } = this.renderer.metrics;
    for (let i = 0; i < 80; i += 1) {
      this.particles.push({
        type: 'confetti',
        x: boardX + Math.random() * boardW,
        y: boardY - 10 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 80,
        vy: 20 + Math.random() * 80,
        gravity: 90,
        life: 1.2 + Math.random() * 1.2,
        maxLife: 2.4,
        size: 6 + Math.random() * 6,
        color: colors[i % colors.length],
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 10,
      });
    }
  }

  bumpEffect(cellIndex) {
    if (cellIndex < 0) return;
    this.burst(this.renderer.cellCenter(cellIndex), '#ffb3c1', 6, 'dot');
  }

  /* ------------------------------------------------------------------ */
  /* Render plumbing                                                    */
  /* ------------------------------------------------------------------ */

  currentHint() {
    if (!this.hintState.active) return { active: false };
    const data = this.hintState.data || {};
    return {
      active: true,
      path: data.path || [],
      objectIndex: data.objectIndex,
      dropIndex: data.dropIndex,
    };
  }

  render() {
    const playerPoint = this.petPos;
    const pose = this.moving ? (Math.floor(this.time * 8) % 2 === 0 ? 'runA' : 'runB') : 'idle';
    this.renderer.draw({
      time: this.time,
      character: this.character,
      player: {
        x: playerPoint.x,
        y: playerPoint.y,
        cell: this.petCell,
        moving: this.moving,
        facing: this.facing,
        pose: this.completed ? 'celebrate' : pose,
      },
      objects: this.board.objects,
      collectibles: this.board.collectibles,
      collected: this.collected,
      friends: this.friendViews(),
      dragging: this.drag
        ? {
            objectIndex: this.drag.objectIndex,
            x: this.drag.pointerX,
            y: this.drag.pointerY,
            targetIndex: this.drag.targetIndex,
            valid: this.drag.valid,
          }
        : null,
      hint: this.currentHint(),
      particles: this.particles,
      spin: this.spin,
    });
  }

  friendViews() {
    const chars = CHARACTER_ORDER_FOR(this.character);
    return this.board.friends.map((f, i) => ({
      index: f.index,
      rescued: f.rescued,
      charId: f.charId || chars[i % chars.length],
    }));
  }
}

function CHARACTER_ORDER_FOR(exclude) {
  return ['ghosty', 'spin', 'oakley'].filter((c) => c !== exclude);
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}