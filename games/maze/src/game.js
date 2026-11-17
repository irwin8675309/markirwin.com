/**
 * Maze Adventures — gameplay controller.
 *
 * Owns the run: grid movement with wall collision, collectibles, the optional
 * hidden-friend rescue, assistance features and completion detection. The
 * renderer only draws what this class reports; the maze engine only generates
 * layouts. Keeping the three separate makes every part easy to test and reuse.
 */

import {
  COLLECTIBLES,
  DIFFICULTIES,
  MESSAGES,
  SPEED_SETTINGS,
  WORLDS,
  getCharacter,
  getDifficulty,
  getWorld,
} from './config.js';
import {
  DIRS,
  bfsPath,
  hasWall,
  neighborIndex,
  restartLayout,
} from './maze.js';

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export class MazeGame {
  constructor(renderer, audio, options = {}) {
    this.renderer = renderer;
    this.audio = audio;
    this.onCollect = options.onCollect || (() => {});
    this.onFriendFound = options.onFriendFound || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onToast = options.onToast || (() => {});
    this.onTrailToggle = options.onTrailToggle || (() => {});

    this.layout = null;
    this.baseLayout = null;
    this.world = null;
    this.difficulty = null;
    this.character = 'ghosty';
    this.findFriend = false;

    this.current = 0;
    this.fromIndex = 0;
    this.toIndex = 0;
    this.t = 0;
    this.moving = false;
    this.facing = 1;
    this.heldDir = null;
    this.queuedDir = null;
    this.paused = false;
    this.completed = false;

    this.collected = new Set();
    this.collectedCount = 0;
    this.friend = null;
    this.friendVisual = null;

    this.trail = { active: false, path: [] };
    this.showWayState = { active: false, path: [], cell: -1, until: 0 };
    this.hintState = { active: false, cell: -1, next: -1, until: 0 };

    this.particles = [];
    this.time = 0;
    this.spin = 0;
    this.spinTimer = 4 + Math.random() * 3;
    this.spinElapsed = 0;
    this.spinDuration = 0;
    this.lastBump = -10;
    this.speedMultiplier = 1;

    this.raf = null;
    this.lastFrame = 0;
    this.loop = this.loop.bind(this);
  }

  /* ----------------------------- lifecycle ---------------------------- */

  load({ layout, world, difficulty, character, findFriend, speed = 'normal' }) {
    this.baseLayout = layout;
    this.layout = restartLayout(layout);
    this.world = getWorld(world);
    this.difficulty = getDifficulty(difficulty);
    this.character = getCharacter(character).id;
    this.findFriend = Boolean(findFriend);
    this.speedMultiplier = SPEED_SETTINGS[speed]?.multiplier || 1;

    this.current = this.layout.start;
    this.fromIndex = this.layout.start;
    this.toIndex = this.layout.start;
    this.t = 0;
    this.moving = false;
    this.facing = 1;
    this.heldDir = null;
    this.queuedDir = null;
    this.paused = false;
    this.completed = false;

    this.collected = new Set();
    this.collectedCount = 0;
    this.friend = this.layout.friend ? { ...this.layout.friend, rescued: false } : null;
    this.friendVisual = null;

    this.trail = { active: false, path: [] };
    this.showWayState = { active: false, path: [], cell: -1, until: 0 };
    this.hintState = { active: false, cell: -1, next: -1, until: 0 };
    this.particles = [];
    this.spin = 0;
    this.spinTimer = 4 + Math.random() * 3;
    this.spinDuration = 0;
    this.lastBump = -10;

    this.renderer.setLevel(this.layout, this.world.id, this.difficulty.id);
    this.updatePlayerVisual();
    this.draw();
    this.start();
  }

  restart() {
    if (!this.baseLayout) return;
    const worldId = this.world.id;
    const difficultyId = this.difficulty.id;
    const character = this.character;
    const findFriend = this.findFriend;
    const speed = this.speedMultiplier;
    this.load({
      layout: this.baseLayout,
      world: worldId,
      difficulty: difficultyId,
      character,
      findFriend,
      speed: speed === 0.78 ? 'chill' : speed >= 1.2 ? 'zippy' : 'normal',
    });
  }

  start() {
    if (this.raf) return;
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  destroy() {
    this.stop();
  }

  setPaused(value) {
    this.paused = Boolean(value);
    if (this.paused) {
      this.heldDir = null;
      this.queuedDir = null;
    }
  }

  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = multiplier;
  }

  /* ------------------------------- input ------------------------------ */

  pressDirection(name) {
    if (this.paused || this.completed) return;
    this.heldDir = name;
    if (!this.moving) this.startStep(name);
    else this.queuedDir = name;
  }

  releaseDirection(name) {
    if (this.heldDir === name) this.heldDir = null;
  }

  clearInput() {
    this.heldDir = null;
    this.queuedDir = null;
  }

  swipe(name) {
    if (this.paused || this.completed) return;
    if (this.moving) this.queuedDir = name;
    else this.startStep(name);
  }

  startStep(name) {
    const dir = DIRS.find((d) => d.name === name);
    if (!dir || !this.layout) return false;
    const next = neighborIndex(this.layout.cols, this.layout.rows, this.current, dir);
    if (next < 0 || hasWall(this.layout.cells, this.current, dir)) {
      this.bump();
      return false;
    }
    this.fromIndex = this.current;
    this.toIndex = next;
    this.t = 0;
    this.moving = true;
    if (dir.dx !== 0) this.facing = dir.dx > 0 ? 1 : -1;
    return true;
  }

  bump() {
    if (this.time - this.lastBump < 1.1) return;
    this.lastBump = this.time;
    this.audio.sfx('bump');
    this.onToast(pick(MESSAGES.bump), 'bump');
  }

  /* ------------------------------ assistance -------------------------- */

  targetIndex() {
    if (this.findFriend && this.friend && !this.friend.rescued) return this.friend.index;
    return this.layout.goal;
  }

  computeTrailPath() {
    const { cols, rows, cells, start, goal } = this.layout;
    if (this.findFriend && this.friend && !this.friend.rescued) {
      const toFriend = bfsPath(cells, cols, rows, start, this.friend.index);
      const toGoal = bfsPath(cells, cols, rows, this.friend.index, goal);
      return [...toFriend, ...toGoal.slice(1)];
    }
    return bfsPath(cells, cols, rows, start, goal);
  }

  toggleTrail() {
    if (this.completed) return;
    this.trail.active = !this.trail.active;
    if (this.trail.active) {
      this.trail.path = this.computeTrailPath();
      this.audio.sfx('hint');
      this.onToast('Follow the glowing trail!', 'help');
    } else {
      this.trail.path = [];
    }
    this.onTrailToggle(this.trail.active);
  }

  showWay() {
    if (this.completed) return;
    this.showWayState.active = true;
    this.showWayState.until = this.time + 5.2;
    this.recomputeShowWay();
    this.audio.sfx('hint');
  }

  recomputeShowWay() {
    if (!this.showWayState.active) return;
    const { cols, rows, cells } = this.layout;
    const from = this.moving ? this.fromIndex : this.current;
    const target = this.targetIndex();
    this.showWayState.path = bfsPath(cells, cols, rows, from, target);
    this.showWayState.cell = from;
  }

  hint() {
    if (this.completed) return;
    this.hintState.active = true;
    this.hintState.until = this.time + 3;
    this.recomputeHint();
    this.audio.sfx('hint');
  }

  recomputeHint() {
    if (!this.hintState.active) return;
    const { cols, rows, cells } = this.layout;
    const from = this.current;
    const target = this.targetIndex();
    if (from === target) {
      this.hintState.active = false;
      return;
    }
    const path = bfsPath(cells, cols, rows, from, target);
    if (path.length < 2) {
      this.hintState.active = false;
      return;
    }
    this.hintState.cell = from;
    this.hintState.next = path[1];
  }

  /* ------------------------------ update ------------------------------ */

  loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    this.time += dt;

    if (!this.paused) this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  }

  update(dt) {
    if (this.layout) {
      this.updateMovement(dt);
      this.updateAssistance();
      this.updateCharacterFlourishes(dt);
      this.updateFriend(dt);
      this.updateParticles(dt);
    }
  }

  updateMovement(dt) {
    if (this.completed) return;

    if (this.moving) {
      const speed = (this.difficulty?.speed || 3) * this.speedMultiplier;
      this.t += dt * speed;
      if (this.t >= 1) {
        const arrived = this.toIndex;
        this.current = arrived;
        this.fromIndex = arrived;
        this.toIndex = arrived;
        this.moving = false;
        this.t = 0;
        this.audio.sfx('step');
        this.checkCell(arrived);
        if (!this.completed && this.heldDir) this.startStep(this.heldDir);
        else if (!this.completed && this.queuedDir) {
          const q = this.queuedDir;
          this.queuedDir = null;
          this.startStep(q);
        }
      }
      return;
    }

    if (this.heldDir) {
      this.startStep(this.heldDir);
    } else if (this.queuedDir) {
      const q = this.queuedDir;
      this.queuedDir = null;
      this.startStep(q);
    }
  }

  checkCell(index) {
    // Collectible?
    const item = this.layout.collectibles.find((c) => c.index === index && !this.collected.has(c.index));
    if (item) {
      this.collected.add(item.index);
      this.collectedCount += 1;
      this.audio.sfx(item.kind === 'surprise' ? 'surprise' : 'collect');
      const p = this.renderer.cellCenter(index);
      const tint = COLLECTIBLES[item.type]?.tint || this.world.accent;
      this.spawnBurst(p.x, p.y, [tint, '#fff3a0', '#ffffff'], item.kind === 'surprise' ? 18 : 10, 'star');
      if (item.kind === 'surprise') {
        this.onToast(pick([
          'A little surprise!',
          'Look what you found!',
          'A friendly visitor!',
          'Surprise!',
        ]), 'surprise');
      }
      this.onCollect({
        item,
        count: this.collectedCount,
        total: this.layout.itemTotal,
      });
    }

    // Hidden friend?
    if (this.friend && !this.friend.rescued && index === this.friend.index) {
      this.friend.rescued = true;
      const p = this.renderer.cellCenter(index);
      this.friendVisual = { x: p.x, y: p.y };
      this.audio.sfx('rescue');
      this.spawnBurst(p.x, p.y, ['#ff8fb7', '#fff3a0', '#ffffff', '#a98bf2'], 20, 'heart');
      if (this.trail.active) this.trail.path = this.computeTrailPath();
      this.onFriendFound(this.friend.charId);
      this.onToast(pick(MESSAGES.friendFound), 'friend');
    }

    // Destination?
    if (index === this.layout.goal) this.handleGoal();
  }

  handleGoal() {
    if (this.completed) return;
    if (this.findFriend && this.friend && !this.friend.rescued) {
      this.audio.sfx('hint');
      this.onToast('Your friend is waiting! Follow the glow.', 'friend');
      this.showWayState.active = true;
      this.showWayState.until = this.time + 6;
      this.recomputeShowWay();
      return;
    }
    this.complete();
  }

  complete() {
    if (this.completed) return;
    this.completed = true;
    this.heldDir = null;
    this.queuedDir = null;
    this.moving = false;
    this.audio.sfx('celebrate');
    const { cell, boardX, boardY, boardW, boardH } = this.renderer.metrics;
    this.spawnConfetti(boardX + boardW / 2, boardY + boardH * 0.3, 90);
    this.onComplete({
      character: this.character,
      world: this.world.id,
      difficulty: this.difficulty.id,
      collected: this.collectedCount,
      total: this.layout.itemTotal,
      friend: this.friend ? { ...this.friend } : null,
      findFriend: this.findFriend,
    });
  }

  updateAssistance() {
    if (this.showWayState.active) {
      if (this.time > this.showWayState.until) {
        this.showWayState.active = false;
        this.showWayState.path = [];
      } else {
        const from = this.moving ? this.fromIndex : this.current;
        if (from !== this.showWayState.cell) this.recomputeShowWay();
      }
    }
    if (this.hintState.active) {
      if (this.time > this.hintState.until) {
        this.hintState.active = false;
      } else if (!this.moving && this.current !== this.hintState.cell) {
        this.recomputeHint();
      }
    }
  }

  updateCharacterFlourishes(dt) {
    if (this.character === 'spin' && !this.completed) {
      if (this.spinDuration > 0) {
        this.spinElapsed += dt;
        this.spin = Math.min(1, this.spinElapsed / this.spinDuration);
        if (this.spin >= 1) {
          this.spinDuration = 0;
          this.spin = 0;
        }
      } else if (!this.moving) {
        this.spinTimer -= dt;
        if (this.spinTimer <= 0) {
          this.spinDuration = 0.55;
          this.spinElapsed = 0;
          this.spinTimer = 5 + Math.random() * 4;
        }
      }
    }
    if (this.character === 'ghosty' && Math.random() < dt * 1.2) {
      const p = this.playerPixels();
      this.particles.push({
        x: p.x + (Math.random() - 0.5) * this.renderer.metrics.cell,
        y: p.y - this.renderer.metrics.cell * 0.2,
        vx: (Math.random() - 0.5) * 14,
        vy: -18 - Math.random() * 16,
        life: 0.9,
        maxLife: 0.9,
        size: this.renderer.metrics.cell * 0.06,
        color: '#ffffff',
        type: 'star',
        rot: 0,
        vr: 0,
      });
    }
  }

  updateFriend(dt) {
    if (!this.friend?.rescued) return;
    const player = this.playerPixels();
    const cell = this.renderer.metrics.cell;
    if (!this.friendVisual) this.friendVisual = { x: player.x, y: player.y };
    const targetX = player.x - this.facing * cell * 0.38;
    const targetY = player.y + cell * 0.14;
    const k = Math.min(1, dt * 6);
    this.friendVisual.x += (targetX - this.friendVisual.x) * k;
    this.friendVisual.y += (targetY - this.friendVisual.y) * k;
  }

  updateParticles(dt) {
    if (!this.particles.length) return;
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.type === 'confetti' ? 190 : 60) * dt;
      p.rot += p.vr * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  spawnBurst(x, y, colors, count, type = 'star') {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1.1,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: type === 'heart' && Math.random() > 0.5 ? 'circle' : type,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 6,
      });
    }
  }

  spawnConfetti(x, y, count) {
    const colors = ['#ff8fb7', '#ffe27a', '#7ce3c2', '#8fdcff', '#b98bf0', '#ff9e7a', '#ffffff'];
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 200,
        y: y - Math.random() * 80,
        vx: (Math.random() - 0.5) * 180,
        vy: -80 - Math.random() * 160,
        life: 1.6 + Math.random() * 1.4,
        maxLife: 3,
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'confetti',
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 10,
      });
    }
  }

  /* ------------------------------- draw ------------------------------- */

  playerPixels() {
    if (!this.renderer.metrics) return { x: 0, y: 0 };
    const a = this.renderer.cellCenter(this.fromIndex);
    const b = this.renderer.cellCenter(this.toIndex);
    if (!this.moving) return a;
    const t = Math.min(1, Math.max(0, this.t));
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  updatePlayerVisual() {
    // Kept for clarity; playerPixels() is computed on demand.
  }

  draw() {
    if (!this.layout || !this.renderer.metrics) return;
    const p = this.playerPixels();
    let pose = 'idle';
    if (this.completed) pose = 'celebrate';
    else if (this.moving) pose = Math.floor(this.time * 9) % 2 === 0 ? 'runA' : 'runB';

    this.renderer.draw({
      time: this.time,
      character: this.character,
      player: {
        x: p.x,
        y: p.y,
        facing: this.facing,
        pose,
        moving: this.moving,
      },
      spin: this.spin,
      collected: this.collected,
      friend: this.friend,
      friendVisual: this.friendVisual,
      trail: this.trail,
      showWay: this.showWayState,
      hint: this.hintState,
      particles: this.particles,
    });
  }

  /* ------------------------------ debugging --------------------------- */

  snapshot() {
    return {
      world: this.world?.id,
      difficulty: this.difficulty?.id,
      character: this.character,
      current: this.current,
      goal: this.layout?.goal,
      moving: this.moving,
      collected: this.collectedCount,
      total: this.layout?.itemTotal,
      friend: this.friend ? { ...this.friend } : null,
      trail: this.trail.active,
      completed: this.completed,
      stats: this.layout ? { cells: this.layout.cells.length, items: this.layout.itemTotal } : null,
    };
  }
}