/**
 * Game controller: owns the level, the marble, the loop and the rules.
 * Rendering, sensors and audio are injected so this stays testable.
 */

import { Ball, PhysicsWorld, stepBallSafe } from './physics.js';
import { generateLevel } from './levels.js';
import { DIFFICULTIES } from './config.js';

const FIXED_STEP = 1 / 120;
const MAX_STEPS = 10;

const BALL_COLORS = {
  garden: { main: '#ff8fb7', dark: '#d9548a' },
  chase: { main: '#8f7dff', dark: '#6250d9' },
  treasure: { main: '#2fc4b2', dark: '#1a8f80' },
};

export class Game {
  constructor({ canvas, renderer, motion, audio, callbacks = {} }) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.motion = motion;
    this.audio = audio;
    this.cb = callbacks;

    this.state = 'idle'; // idle | playing | paused | complete
    this.level = null;
    this.ball = null;
    this.physics = null;
    this.accum = 0;
    this.lastTime = 0;
    this.raf = null;
    this.paused = false;

    this.settings = {
      guidance: true,
      speedScale: 1,
      sensitivity: 'normal',
    };

    this.facing = 1;
    this.blinkTimer = 3.4;
    this.blinkFor = 0;
    this.petHappy = 0;
    this.bumpCooldown = 0;
    this.stuckTimer = 0;
    this.slowUntil = 0;
    this.lastHud = { collected: 0, total: 0 };
    this.elapsed = 0;

    this._loop = this._loop.bind(this);
    this._onVisibility = this._onVisibility.bind(this);
    document.addEventListener('visibilitychange', this._onVisibility);
    window.addEventListener('blur', this._onVisibility);
  }

  /* ------------------------------- lifecycle ------------------------------ */

  startLoop() {
    if (this.raf) return;
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this._loop);
  }

  stopLoop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  _onVisibility() {
    if (document.hidden && this.state === 'playing') {
      this.pause(true);
    }
  }

  /** Stop playing and return to the menus. */
  stop() {
    this.state = 'idle';
    this.accum = 0;
    if (this.ball) {
      this.ball.vx = 0;
      this.ball.vy = 0;
    }
    this.motion.resetSmoothing();
    this.motion.clearTouch();
  }

  setSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    if (this.motion) this.motion.configure(settings);
  }

  startLevel({ world, difficulty, levelIndex = 0 }) {
    const level = generateLevel({ world, difficulty, levelIndex });
    this.level = level;
    this.difficulty = DIFFICULTIES[difficulty] || DIFFICULTIES.happy;
    this.ball = new Ball(level.start.x, level.start.y, level.ballRadius);
    this.physics = new PhysicsWorld(level);

    this.state = 'playing';
    this.paused = false;
    this.accum = 0;
    this.elapsed = 0;
    this.stuckTimer = 0;
    this.slowUntil = 0;
    this.facing = 1;
    this.blinkTimer = 3;
    this.blinkFor = 0;
    this.petHappy = 0;
    this.lastHud = { collected: 0, total: level.collectibles.length };
    this.motion.resetSmoothing();
    this.motion.clearTouch();

    this.renderer.setLevel(level);
    this.renderer.updateCamera(0, this.ball, true);

    const colors = BALL_COLORS[world] || BALL_COLORS.garden;
    this.ballColor = colors.main;
    this.ballDark = colors.dark;

    this.audio.setWorld(world);
    this.audio.startMusic(world);

    this.emitHud();
    if (this.cb.onLevelStart) this.cb.onLevelStart({ level });
  }

  pause(fromVisibility = false) {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.motion.resetSmoothing();
    this.motion.clearTouch();
    this.audio.pauseMusic();
    if (!fromVisibility && this.cb.onPause) this.cb.onPause();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.accum = 0;
    this.lastTime = performance.now();
    this.motion.resetSmoothing();
    // If the iPad was moved while paused, adopt the new position as neutral so
    // the marble never lurches when play resumes.
    if (!this.motion.touchMode) {
      const live = this.motion.liveTilt();
      if (Math.hypot(live.x, live.y) > 0.55) this.motion.captureBaselineNow();
    }
    this.audio.resumeMusic();
    if (this.cb.onResume) this.cb.onResume();
  }

  resetLevel() {
    if (!this.level || !this.ball) return;
    this.ball.reset(this.level.start.x, this.level.start.y);
    this.motion.resetSmoothing();
    this.stuckTimer = 0;
    this.slowUntil = 0;
    this.renderer.updateCamera(0, this.ball, true);
    this.audio.play('whoosh');
    if (this.cb.onReset) this.cb.onReset();
  }

  /** Put the marble back at the last checkpoint (or the start). */
  recover(manual = false) {
    if (!this.level || !this.ball) return;
    let target = this.level.start;
    for (const cp of this.level.checkpoints) {
      if (cp.active) target = { x: cp.x, y: cp.y };
    }
    this.ball.reset(target.x, target.y);
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.motion.resetSmoothing();
    this.stuckTimer = 0;
    this.renderer.updateCamera(0, this.ball, true);
    this.audio.play('back');
    this.renderer.emitBurst(target.x, target.y, 'puff', '#ffffff', 10);
    if (this.cb.onRecover) this.cb.onRecover(manual);
  }

  showWay() {
    this.renderer.showWay(4.5);
    this.audio.play('checkpoint');
    if (this.cb.onHint) this.cb.onHint();
  }

  setGuidance(on) {
    this.settings.guidance = !!on;
  }

  /* --------------------------------- loop --------------------------------- */

  _loop(now) {
    this.raf = requestAnimationFrame(this._loop);
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    dt = Math.min(dt, 0.05);

    if (this.state === 'playing') {
      this.accum += dt;
      let steps = 0;
      while (this.accum >= FIXED_STEP && steps < MAX_STEPS) {
        this.fixedUpdate(FIXED_STEP);
        this.accum -= FIXED_STEP;
        steps += 1;
        if (this.state !== 'playing') break;
      }
      if (steps >= MAX_STEPS) this.accum = 0;
    }

    this.renderer.draw(this.renderState(), dt);
  }

  fixedUpdate(dt) {
    if (this.state !== 'playing') return;
    this.elapsed += dt;
    this.level.time += dt;
    this.bumpCooldown = Math.max(0, this.bumpCooldown - dt);
    if (this.petHappy > 0) this.petHappy = Math.max(0, this.petHappy - dt);
    if (this.blinkFor > 0) {
      this.blinkFor -= dt;
      if (this.blinkFor <= 0) this.blinkTimer = 2.6 + Math.random() * 2.4;
    } else {
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) this.blinkFor = 0.14;
    }

    const input = this.motion.sample(dt);
    const speedScale = this.settings.speedScale * (this.level.time < this.slowUntil ? 0.62 : 1);

    const res = stepBallSafe(this.ball, input, dt, this.physics, this.level.difficulty.physics, speedScale);

    if (res.wall && this.bumpCooldown <= 0 && res.wall.strength > 0.18) {
      this.audio.play('bump');
      this.bumpCooldown = 0.14;
    }
    if (res.obstacles.length && this.bumpCooldown <= 0) {
      const hit = res.obstacles[0];
      this.audio.play('bump');
      this.bumpCooldown = 0.14;
      this.renderer.emitBurst(hit.x, hit.y, 'puff', '#ffffff', 7);
    }

    // Companion faces the direction of travel.
    if (Math.abs(this.ball.vx) > 24) this.facing = this.ball.vx > 0 ? 1 : -1;

    this.checkPickups();
    this.checkCheckpoints();
    this.checkStuck(dt, input);

    if (this.physics.reachedGoal(this.ball)) {
      this.completeLevel();
    }
  }

  checkPickups() {
    const ball = this.ball;
    const reach = ball.radius + 24;
    for (const c of this.level.collectibles) {
      if (c.taken) continue;
      if (Math.hypot(c.x - ball.x, c.y - ball.y) < reach) {
        c.taken = true;
        this.level.collected += 1;
        this.petHappy = 0.9;
        this.renderer.emitBurst(c.x, c.y, 'star', '#ffe27a', 10);
        this.renderer.floater(c.x, c.y - 20, '+1', '#fff6a8');
        this.audio.play('collect');
        this.emitHud();
        if (this.cb.onCollect) this.cb.onCollect({ type: c.type, x: c.x, y: c.y, count: this.level.collected });
      }
    }

    for (const s of this.level.surprises) {
      if (s.taken) continue;
      if (Math.hypot(s.x - ball.x, s.y - ball.y) < reach + 6) {
        s.taken = true;
        this.level.surprisesFound += 1;
        this.petHappy = 1.4;
        this.renderer.emitBurst(s.x, s.y, 'star', '#fff6a8', 18);
        this.renderer.emitBurst(s.x, s.y, 'puff', '#ffffff', 8);
        this.renderer.floater(s.x, s.y - 26, 'Surprise!', '#fff');
        this.audio.play('surprise');
        if (this.cb.onSurprise) this.cb.onSurprise({ type: s.type, x: s.x, y: s.y });
      }
    }
  }

  checkCheckpoints() {
    const ball = this.ball;
    for (const cp of this.level.checkpoints) {
      if (cp.active) continue;
      if (Math.hypot(cp.x - ball.x, cp.y - ball.y) < cp.r + ball.radius * 0.4) {
        cp.active = true;
        this.renderer.emitBurst(cp.x, cp.y, 'puff', '#70d58c', 12);
        this.audio.play('checkpoint');
        this.renderer.floater(cp.x, cp.y - 30, 'Checkpoint!', '#d9ffd9');
        if (this.cb.onCheckpoint) this.cb.onCheckpoint({ index: cp.index });
      }
    }
  }

  checkStuck(dt, input) {
    const mag = Math.hypot(input.x, input.y);
    const speed = this.ball.speed;
    if (mag > 0.25 && speed < 16 && this.state === 'playing') {
      this.stuckTimer += dt;
    } else {
      this.stuckTimer = Math.max(0, this.stuckTimer - dt * 2);
    }

    if (this.stuckTimer > 2.6 && this.level.time > this.slowUntil) {
      this.slowUntil = this.level.time + 4;
      this.stuckTimer = 0;
      this.audio.play('back');
      if (this.cb.onAssist) this.cb.onAssist('slow');
    }

    // A long, completely stuck marble is gently returned to safety. No
    // penalty, no lost collectibles - just a helping hand.
    if (this.stuckTimer > 7) {
      this.stuckTimer = 0;
      this.recover(false);
    }

    // If the marble somehow ends up far from the trail, bring it home.
    if (!this.physics.isInside(this.ball.x, this.ball.y, 220)) {
      this.recover(false);
    }
  }

  completeLevel() {
    if (this.state === 'complete') return;
    this.state = 'complete';
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.motion.resetSmoothing();
    this.motion.clearTouch();
    this.renderer.emitConfetti(110);
    this.renderer.emitBurst(this.level.goal.x, this.level.goal.y, 'star', '#ffe27a', 26);
    this.audio.play('goal');
    window.setTimeout(() => this.audio.play('celebrate'), 420);
    if (this.cb.onComplete) {
      this.cb.onComplete({
        level: this.level,
        world: this.level.worldId,
        difficulty: this.level.difficultyId,
        levelIndex: this.level.index,
        collected: this.level.collected,
        total: this.level.collectibles.length,
        surprises: this.level.surprisesFound,
        elapsed: this.elapsed,
      });
    }
  }

  emitHud() {
    if (!this.level) return;
    this.lastHud = { collected: this.level.collected, total: this.level.collectibles.length };
    if (this.cb.onHud) this.cb.onHud(this.lastHud);
  }

  renderState() {
    return {
      ball: this.ball || { x: 0, y: 0, vx: 0, vy: 0, radius: 26, roll: 0, spin: 0, bumpFlash: 0 },
      pet: this.level ? this.level.worldId === 'garden' ? 'ghosty' : this.level.worldId === 'chase' ? 'spin' : 'oakley' : null,
      petBlink: this.blinkFor > 0,
      petHappy: this.petHappy,
      facing: this.facing,
      time: this.level ? this.level.time : 0,
      guidance: this.settings.guidance,
      ballColor: this.ballColor,
      ballDark: this.ballDark,
    };
  }

  destroy() {
    this.stopLoop();
    document.removeEventListener('visibilitychange', this._onVisibility);
    window.removeEventListener('blur', this._onVisibility);
  }
}