/**
 * Canvas renderer.
 *
 * Draws the top-down world: grass, path, decorations, collectibles, the
 * marble, the pet companion, checkpoints, the goal hole and particles.
 * All artwork is drawn locally; sprites are cached in offscreen canvases.
 */

import { ART } from './art.js';

const TAU = Math.PI * 2;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
}

function starPath(ctx, cx, cy, outer, inner, points = 5, rotation = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (i * Math.PI) / points;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/* ------------------------------------------------------------------ */
/* Decoration sprites (cached)                                        */
/* ------------------------------------------------------------------ */

const SPRITE_SIZE = 200;
const spriteCache = new Map();

function makeSprite(key, draw) {
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = document.createElement('canvas');
  c.width = SPRITE_SIZE;
  c.height = SPRITE_SIZE;
  const g = c.getContext('2d');
  g.translate(SPRITE_SIZE / 2, SPRITE_SIZE / 2);
  draw(g);
  spriteCache.set(key, c);
  return c;
}

function drawTreeSprite(g, tint = 0) {
  const leaf = tint > 0.5 ? '#5cc47a' : '#6fd08a';
  const leafDark = tint > 0.5 ? '#3f9b5c' : '#4aa96b';
  ellipse(g, 0, 62, 46, 10, 'rgba(62,49,85,.14)');
  g.fillStyle = '#a56f4a';
  roundRect(g, -9, -6, 18, 68, 8);
  g.fill();
  g.fillStyle = leafDark;
  for (const [x, y, r] of [[-30, -18, 30], [30, -22, 32], [0, -42, 32], [-12, -54, 24], [20, -50, 22]]) {
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  g.fillStyle = leaf;
  for (const [x, y, r] of [[-26, -24, 22], [26, -28, 24], [0, -46, 24], [-8, -58, 16]]) {
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  g.fillStyle = '#ff8fb5';
  for (const [x, y] of [[-24, -10], [26, -16], [2, -34]]) {
    g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill();
  }
}

function drawBushSprite(g, tint = 0) {
  const base = tint > 0.5 ? '#5cc47a' : '#69cf7f';
  ellipse(g, 0, 50, 58, 10, 'rgba(62,49,85,.12)');
  g.fillStyle = base;
  for (const [x, y, r] of [[-38, 18, 30], [0, 2, 36], [38, 18, 30], [0, 26, 30]]) {
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,.28)';
  for (const [x, y, r] of [[-30, 8, 15], [4, -10, 18], [34, 10, 13]]) {
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  g.fillStyle = '#ffb1c9';
  for (const [x, y] of [[-18, 22], [14, 16], [30, 30]]) {
    g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill();
  }
}

function drawFlowerSprite(g, tint = 0) {
  const petal = tint > 0.66 ? '#a9dcff' : tint > 0.33 ? '#ffd866' : '#ff8fb5';
  g.strokeStyle = '#47a55c';
  g.lineWidth = 7;
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 58); g.quadraticCurveTo(-4, 26, 0, 6); g.stroke();
  g.fillStyle = '#73d182';
  g.beginPath(); g.ellipse(-14, 34, 14, 8, -0.5, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(14, 26, 14, 8, 0.5, 0, TAU); g.fill();
  g.fillStyle = petal;
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * TAU - Math.PI / 2;
    g.beginPath(); g.arc(Math.cos(a) * 20, -14 + Math.sin(a) * 20, 15, 0, TAU); g.fill();
  }
  g.fillStyle = '#ffe27a';
  g.beginPath(); g.arc(0, -14, 13, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.7)';
  g.beginPath(); g.arc(-4, -18, 4, 0, TAU); g.fill();
}

function drawMushroomSprite(g) {
  ellipse(g, 0, 54, 34, 8, 'rgba(62,49,85,.12)');
  g.fillStyle = '#fff2da';
  roundRect(g, -12, 4, 24, 50, 10); g.fill();
  g.strokeStyle = '#d7b98d'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#a782e8';
  g.beginPath();
  g.moveTo(-46, 8);
  g.quadraticCurveTo(-40, -52, 0, -56);
  g.quadraticCurveTo(40, -52, 46, 8);
  g.quadraticCurveTo(20, 26, 0, 26);
  g.quadraticCurveTo(-20, 26, -46, 8);
  g.fill();
  g.strokeStyle = '#7354b8'; g.lineWidth = 4; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.85)';
  for (const [x, y, r] of [[-20, -22, 8], [8, -34, 7], [24, -12, 6], [-4, -6, 5]]) {
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
}

function drawRockSprite(g, tint = 0) {
  ellipse(g, 0, 44, 44, 10, 'rgba(62,49,85,.14)');
  g.fillStyle = tint > 0.5 ? '#b9a7c9' : '#c7b9b0';
  g.beginPath();
  g.moveTo(-44, 30);
  g.quadraticCurveTo(-50, -12, -18, -34);
  g.quadraticCurveTo(14, -50, 38, -16);
  g.quadraticCurveTo(50, 12, 32, 34);
  g.quadraticCurveTo(0, 46, -44, 30);
  g.fill();
  g.strokeStyle = '#8d7f8f'; g.lineWidth = 4; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.4)';
  g.beginPath(); g.ellipse(-12, -14, 18, 10, -0.4, 0, TAU); g.fill();
  g.fillStyle = 'rgba(90,80,100,.22)';
  g.beginPath(); g.ellipse(18, 14, 14, 8, 0.3, 0, TAU); g.fill();
}

function drawPalmSprite(g) {
  ellipse(g, 0, 58, 40, 9, 'rgba(62,49,85,.14)');
  g.strokeStyle = '#b9834f';
  g.lineWidth = 16;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, 58);
  g.quadraticCurveTo(-12, 10, 6, -34);
  g.stroke();
  g.strokeStyle = '#d9a066';
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(-2, 56);
  g.quadraticCurveTo(-12, 10, 4, -32);
  g.stroke();
  g.fillStyle = '#4fbf72';
  for (let i = 0; i < 6; i += 1) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.42;
    g.save();
    g.translate(6, -34);
    g.rotate(a);
    g.beginPath();
    g.ellipse(34, 0, 38, 13, 0, 0, TAU);
    g.fill();
    g.restore();
  }
  g.fillStyle = '#8a5d2a';
  for (const [x, y] of [[0, -30], [10, -26], [-6, -24]]) {
    g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill();
  }
}

function drawCrateSprite(g) {
  ellipse(g, 0, 48, 42, 9, 'rgba(62,49,85,.14)');
  g.fillStyle = '#c98a4f';
  roundRect(g, -40, -36, 80, 80, 10); g.fill();
  g.strokeStyle = '#8a5a2b'; g.lineWidth = 5; g.stroke();
  g.strokeStyle = '#a9702f'; g.lineWidth = 7;
  g.beginPath();
  g.moveTo(-34, -30); g.lineTo(34, 38);
  g.moveTo(34, -30); g.lineTo(-34, 38);
  g.stroke();
  g.fillStyle = '#e0a86a';
  roundRect(g, -40, -36, 80, 16, 6); g.fill();
}

function drawBarrelSprite(g) {
  ellipse(g, 0, 50, 36, 9, 'rgba(62,49,85,.14)');
  g.fillStyle = '#a9663f';
  roundRect(g, -32, -40, 64, 84, 20); g.fill();
  g.strokeStyle = '#7d4a1e'; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#6d6f78';
  roundRect(g, -34, -24, 68, 12, 5); g.fill();
  roundRect(g, -34, 16, 68, 12, 5); g.fill();
  g.fillStyle = 'rgba(255,255,255,.18)';
  roundRect(g, -22, -36, 12, 74, 6); g.fill();
}

function drawToySprite(g) {
  ellipse(g, 0, 48, 40, 9, 'rgba(62,49,85,.12)');
  g.fillStyle = '#ff8fb7';
  g.beginPath(); g.arc(0, 0, 42, 0, TAU); g.fill();
  g.strokeStyle = '#d9548a'; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#fff';
  starPath(g, 0, 0, 22, 10, 5);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.5)';
  g.beginPath(); g.arc(-14, -16, 9, 0, TAU); g.fill();
}

function drawBlockSprite(g) {
  ellipse(g, 0, 46, 40, 9, 'rgba(62,49,85,.12)');
  g.fillStyle = '#8f7dff';
  roundRect(g, -40, -40, 80, 80, 14); g.fill();
  g.strokeStyle = '#6a55d6'; g.lineWidth = 4; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.35)';
  roundRect(g, -30, -30, 60, 16, 8); g.fill();
  g.fillStyle = '#ffe27a';
  starPath(g, 0, 6, 18, 8, 5);
  g.fill();
}

function drawBalloonSprite(g) {
  ellipse(g, 0, 54, 20, 6, 'rgba(62,49,85,.1)');
  g.strokeStyle = '#c9b8e0'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, 6); g.quadraticCurveTo(10, 30, 0, 50); g.stroke();
  g.fillStyle = '#7fd8ff';
  g.beginPath(); g.ellipse(0, -16, 26, 32, 0, 0, TAU); g.fill();
  g.strokeStyle = '#3fa9d9'; g.lineWidth = 3; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.6)';
  g.beginPath(); g.ellipse(-8, -26, 7, 11, -0.4, 0, TAU); g.fill();
  g.fillStyle = '#3fa9d9';
  g.beginPath(); g.moveTo(-5, 14); g.lineTo(5, 14); g.lineTo(0, 22); g.fill();
}

function drawSpringSprite(g) {
  ellipse(g, 0, 46, 34, 8, 'rgba(62,49,85,.12)');
  g.strokeStyle = '#ffb347'; g.lineWidth = 8; g.lineCap = 'round';
  g.beginPath();
  for (let i = 0; i <= 40; i += 1) {
    const y = 40 - i * 2;
    const x = Math.sin(i * 0.55) * 26;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.stroke();
  g.fillStyle = '#ff7a59';
  roundRect(g, -30, -40, 60, 14, 7); g.fill();
}

function drawShellSprite(g) {
  ellipse(g, 0, 36, 30, 8, 'rgba(62,49,85,.1)');
  g.fillStyle = '#ffd9e6';
  g.beginPath();
  g.moveTo(0, 34);
  g.arc(0, 34, 32, Math.PI, 0);
  g.closePath();
  g.fill();
  g.strokeStyle = '#e8a8bd'; g.lineWidth = 3;
  for (let i = 1; i < 4; i += 1) {
    g.beginPath();
    g.moveTo(0, 34);
    g.lineTo(Math.cos(Math.PI + (i * Math.PI) / 4) * 30, 34 + Math.sin(Math.PI + (i * Math.PI) / 4) * 30);
    g.stroke();
  }
}

function drawGrassSprite(g) {
  g.strokeStyle = 'rgba(63,155,92,.55)';
  g.lineWidth = 4;
  g.lineCap = 'round';
  for (const [x, h] of [[-14, 26], [0, 34], [14, 24]]) {
    g.beginPath();
    g.moveTo(x, 18);
    g.quadraticCurveTo(x - 4, 18 - h / 2, x + (x > 0 ? 4 : -4), 18 - h);
    g.stroke();
  }
}

const DECOR_DRAW = {
  tree: (g, t) => drawTreeSprite(g, t),
  bush: (g, t) => drawBushSprite(g, t),
  flower: (g, t) => drawFlowerSprite(g, t),
  mushroom: (g, t) => drawMushroomSprite(g),
  rock: (g, t) => drawRockSprite(g, t),
  palm: (g, t) => drawPalmSprite(g),
  crate: (g, t) => drawCrateSprite(g),
  barrel: (g, t) => drawBarrelSprite(g),
  toy: (g, t) => drawToySprite(g),
  block: (g, t) => drawBlockSprite(g),
  balloon: (g, t) => drawBalloonSprite(g),
  spring: (g, t) => drawSpringSprite(g),
  shell: (g, t) => drawShellSprite(g),
  grass: (g, t) => drawGrassSprite(g),
};

function decorSprite(type, variant) {
  const key = `${type}:${variant}`;
  const draw = DECOR_DRAW[type] || DECOR_DRAW.grass;
  return makeSprite(key, (g) => draw(g, variant));
}

function obstacleSprite(kind, radius) {
  const key = `obs:${kind}:${Math.round(radius / 6)}`;
  const scale = radius / 40;
  return makeSprite(key, (g) => {
    g.scale(scale, scale);
    switch (kind) {
      case 'bush': drawBushSprite(g, 0.3); break;
      case 'rock': drawRockSprite(g, 0.7); break;
      case 'mushroom': drawMushroomSprite(g); break;
      case 'toy': drawToySprite(g); break;
      case 'block': drawBlockSprite(g); break;
      case 'bumper': {
        ellipse(g, 0, 44, 40, 9, 'rgba(62,49,85,.14)');
        g.fillStyle = '#ff7a59';
        g.beginPath(); g.arc(0, 0, 42, 0, TAU); g.fill();
        g.strokeStyle = '#d9502f'; g.lineWidth = 5; g.stroke();
        g.fillStyle = '#fff';
        g.beginPath(); g.arc(0, 0, 26, 0, TAU); g.fill();
        g.fillStyle = '#ff7a59';
        starPath(g, 0, 0, 18, 8, 6, 0);
        g.fill();
        g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 5;
        g.beginPath(); g.arc(0, 0, 40, 0, TAU); g.stroke();
        break;
      }
      case 'crate': drawCrateSprite(g); break;
      case 'barrel': drawBarrelSprite(g); break;
      default: drawRockSprite(g, 0.5);
    }
  });
}

/* ------------------------------------------------------------------ */
/* Renderer                                                           */
/* ------------------------------------------------------------------ */

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(2.5, window.devicePixelRatio || 1);
    this.w = 0;
    this.h = 0;
    this.level = null;
    this.world = null;
    this.cam = { x: 0, y: 0 };
    this.zoom = 1;
    this.camInit = false;
    this.particles = [];
    this.floaters = [];
    this.showWayUntil = 0;
    this.time = 0;
    this.bgMarks = [];
    this.pathDots = [];
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, rect.width || window.innerWidth);
    this.h = Math.max(1, rect.height || window.innerHeight);
    this.dpr = Math.min(2.5, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.updateZoom();
  }

  updateZoom() {
    // Show a comfortable slice of the world on any screen size.
    const z = Math.min(this.w / 1020, this.h / 700);
    this.zoom = clamp(z, 0.5, 1.25);
  }

  setLevel(level) {
    this.level = level;
    this.world = level.world;
    this.particles = [];
    this.floaters = [];
    this.showWayUntil = 0;
    this.camInit = false;
    this.buildBackdrop();
    this.buildPathDots();
  }

  buildBackdrop() {
    if (!this.level) return;
    const b = this.level.bounds;
    const rnd = mulberry32(1234 + this.level.index * 7 + this.level.worldId.length);
    this.bgMarks = [];
    const count = 150;
    for (let i = 0; i < count; i += 1) {
      const x = b.minX + rnd() * (b.maxX - b.minX);
      const y = b.minY + rnd() * (b.maxY - b.minY);
      this.bgMarks.push({
        x,
        y,
        s: 0.5 + rnd() * 1.2,
        kind: Math.floor(rnd() * 3),
        a: 0.06 + rnd() * 0.1,
      });
    }
  }

  buildPathDots() {
    if (!this.level) return;
    const rnd = mulberry32(99 + this.level.index);
    const dots = [];
    const step = 34;
    const total = this.level.total;
    for (let d = 0; d < total; d += step) {
      const p = pointAtDistance(this.level, d);
      const lat = (rnd() * 2 - 1) * this.level.pathWidth * 0.36;
      dots.push({
        x: p.x + p.nx * lat,
        y: p.y + p.ny * lat,
        r: 2 + rnd() * 3.4,
        a: 0.1 + rnd() * 0.22,
        c: rnd() > 0.6 ? '#ffffff' : null,
      });
    }
    this.pathDots = dots;
  }

  updateCamera(dt, ball, snap = false) {
    if (!this.level) return;
    const halfW = this.w / (2 * this.zoom);
    const halfH = this.h / (2 * this.zoom);
    const b = this.level.bounds;

    let tx = ball.x;
    let ty = ball.y;
    if (b.maxX - b.minX <= halfW * 2) tx = (b.minX + b.maxX) / 2;
    else tx = clamp(tx, b.minX + halfW, b.maxX - halfW);
    if (b.maxY - b.minY <= halfH * 2) ty = (b.minY + b.maxY) / 2;
    else ty = clamp(ty, b.minY + halfH, b.maxY - halfH);

    if (!this.camInit || snap) {
      this.cam.x = tx;
      this.cam.y = ty;
      this.camInit = true;
    } else {
      const k = 1 - Math.exp(-5.5 * dt);
      this.cam.x += (tx - this.cam.x) * k;
      this.cam.y += (ty - this.cam.y) * k;
    }
  }

  showWay(seconds = 4) {
    this.showWayUntil = this.time + seconds;
  }

  worldToScreen(x, y) {
    return {
      x: (x - this.cam.x) * this.zoom + this.w / 2,
      y: (y - this.cam.y) * this.zoom + this.h / 2,
    };
  }

  /* ------------------------------ particles ----------------------------- */

  emitBurst(x, y, type, color, count = 12) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * TAU;
      const sp = 40 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 30,
        life: 0.5 + Math.random() * 0.5,
        max: 1,
        size: 3 + Math.random() * 5,
        color,
        type,
        rot: Math.random() * TAU,
      });
    }
  }

  emitConfetti(count = 90) {
    const colors = ['#ff8fb7', '#ffd84d', '#7fd8ff', '#8f7dff', '#70d58c', '#ffb347', '#ff7a59'];
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        screen: true,
        x: Math.random() * this.w,
        y: -20 - Math.random() * this.h * 0.4,
        vx: (Math.random() - 0.5) * 60,
        vy: 80 + Math.random() * 140,
        life: 2.6 + Math.random() * 1.6,
        max: 4,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'confetti',
        rot: Math.random() * TAU,
        spin: (Math.random() - 0.5) * 8,
      });
    }
  }

  floater(x, y, text, color = '#fff') {
    this.floaters.push({ x, y, text, color, life: 1.1, max: 1.1 });
  }

  updateEffects(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      if (p.screen) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 40 * dt;
        p.rot += p.spin * dt;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 260 * dt;
        p.vx *= 1 - 1.6 * dt;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) {
      f.life -= dt;
      f.y -= 42 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.life > 0);
  }

  /* -------------------------------- draw -------------------------------- */

  draw(state, dt) {
    const ctx = this.ctx;
    const { w, h } = this;
    if (!this.level) {
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.fillStyle = '#9fe3ff';
      ctx.fillRect(0, 0, w, h);
      return;
    }

    this.time += dt;
    this.updateCamera(dt, state.ball);
    this.updateEffects(dt);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    this.drawBackdrop();

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.cam.x, -this.cam.y);

    this.drawGroundMarks();
    this.drawPath();
    this.drawFeaturesBase();
    this.drawCheckpoints(state);
    this.drawGoal(state);
    this.drawCollectibles(state);
    this.drawDecorations();
    this.drawObstacles(state);
    this.drawShowWay();
    this.drawGuidance(state);
    this.drawPet(state);
    this.drawBall(state);
    this.drawTunnelsTop();
    this.drawWorldParticles();

    ctx.restore();

    this.drawScreenParticles();
    this.drawFloaters();
    this.drawVignette();
  }

  drawBackdrop() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, this.world.sky[0]);
    g.addColorStop(1, this.world.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Soft sun glow in the corner.
    const sun = ctx.createRadialGradient(w * 0.82, h * 0.12, 10, w * 0.82, h * 0.12, h * 0.7);
    sun.addColorStop(0, 'rgba(255,250,200,.55)');
    sun.addColorStop(1, 'rgba(255,250,200,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);
  }

  drawGroundMarks() {
    const ctx = this.ctx;
    const b = this.level.bounds;
    const view = {
      x0: this.cam.x - this.w / (2 * this.zoom) - 100,
      x1: this.cam.x + this.w / (2 * this.zoom) + 100,
      y0: this.cam.y - this.h / (2 * this.zoom) - 100,
      y1: this.cam.y + this.h / (2 * this.zoom) + 100,
    };

    // Opaque ground so the world reads as grass (or sand) rather than sky.
    const ground = ctx.createLinearGradient(0, b.minY, 0, b.maxY);
    ground.addColorStop(0, this.world.grass[0]);
    ground.addColorStop(0.55, this.world.grass[1]);
    ground.addColorStop(1, this.world.grass[0]);
    ctx.fillStyle = ground;
    ctx.fillRect(b.minX - 400, b.minY - 400, b.maxX - b.minX + 800, b.maxY - b.minY + 800);

    // Warm sunlight pooling in the middle of the map.
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    const glow = ctx.createRadialGradient(cx, cy, 60, cx, cy, Math.max(b.maxX - b.minX, b.maxY - b.minY) * 0.7);
    glow.addColorStop(0, 'rgba(255,250,210,.20)');
    glow.addColorStop(1, 'rgba(255,250,210,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(b.minX - 400, b.minY - 400, b.maxX - b.minX + 800, b.maxY - b.minY + 800);

    for (const m of this.bgMarks) {
      if (m.x < view.x0 || m.x > view.x1 || m.y < view.y0 || m.y > view.y1) continue;
      ctx.globalAlpha = m.a;
      ctx.fillStyle = m.kind === 0 ? '#ffffff' : m.kind === 1 ? this.world.grassDark : '#ffffff';
      if (m.kind === 2) {
        ctx.beginPath();
        ctx.arc(m.x, m.y, 2.4 * m.s, 0, TAU);
        ctx.fill();
      } else {
        roundRect(ctx, m.x, m.y, 10 * m.s, 3.2 * m.s, 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawPath() {
    const ctx = this.ctx;
    const level = this.level;
    const path = level.path;
    if (path.length < 2) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Outer soft edge
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i += 1) ctx.lineTo(path[i].x, path[i].y);
    ctx.strokeStyle = 'rgba(62,49,85,.16)';
    ctx.lineWidth = level.pathWidth + 30;
    ctx.stroke();

    // Border
    ctx.strokeStyle = this.world.pathEdge;
    ctx.lineWidth = level.pathWidth + 16;
    ctx.stroke();

    // Surface
    ctx.strokeStyle = this.world.path;
    ctx.lineWidth = level.pathWidth;
    ctx.stroke();

    // Centre light
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = this.world.pathLight;
    ctx.lineWidth = level.pathWidth * 0.55;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Pebbles / speckles
    for (const d of this.pathDots) {
      ctx.globalAlpha = d.a;
      ctx.fillStyle = d.c || this.world.pathEdge;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Start pad
    const s = level.start;
    ctx.beginPath();
    ctx.arc(s.x, s.y, level.pathWidth * 0.42, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.lineWidth = 5;
    ctx.setLineDash([14, 12]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawFeaturesBase() {
    const ctx = this.ctx;
    for (const f of this.level.features) {
      if (f.type === 'bridge') {
        for (let d = f.from; d <= f.to; d += 26) {
          const p = pointAtDistance(this.level, d);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.atan2(p.ty, p.tx));
          ctx.fillStyle = '#c98a4f';
          roundRect(ctx, -14, -this.level.pathWidth / 2 + 4, 28, this.level.pathWidth - 8, 6);
          ctx.fill();
          ctx.strokeStyle = '#8a5a2b';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
        // railings
        ctx.strokeStyle = '#8a5a2b';
        ctx.lineWidth = 7;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          let first = true;
          for (let d = f.from - 20; d <= f.to + 20; d += 20) {
            const p = pointAtDistance(this.level, d);
            const off = (this.level.pathWidth / 2 - 2) * side;
            const x = p.x + p.nx * off;
            const y = p.y + p.ny * off;
            if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
    }
  }

  drawTunnelsTop() {
    const ctx = this.ctx;
    for (const f of this.level.features) {
      if (f.type !== 'tunnel') continue;
      const p = pointAtDistance(this.level, f.at);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.ty, p.tx));
      const half = this.level.pathWidth / 2 + 12;
      ctx.strokeStyle = 'rgba(120,90,140,.85)';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-46, -half);
      ctx.lineTo(-46, -half - 22);
      ctx.moveTo(-46, half);
      ctx.lineTo(-46, half + 22);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(160,125,190,.5)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(-24, -half - 4);
      ctx.quadraticCurveTo(0, -half - 34, 24, -half - 4);
      ctx.moveTo(-24, half + 4);
      ctx.quadraticCurveTo(0, half + 34, 24, half + 4);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawCheckpoints(state) {
    const ctx = this.ctx;
    for (const cp of this.level.checkpoints) {
      const pulse = 1 + Math.sin(this.time * 2.2 + cp.index) * 0.06;
      ctx.save();
      ctx.translate(cp.x, cp.y);
      ctx.globalAlpha = cp.active ? 0.95 : 0.55;
      ctx.beginPath();
      ctx.arc(0, 0, cp.r * 0.62 * pulse, 0, TAU);
      ctx.fillStyle = cp.active ? 'rgba(112,213,140,.55)' : 'rgba(255,255,255,.35)';
      ctx.fill();
      ctx.strokeStyle = cp.active ? '#2f9d5b' : 'rgba(255,255,255,.9)';
      ctx.lineWidth = 4;
      ctx.setLineDash(cp.active ? [] : [10, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = cp.active ? '#2f9d5b' : 'rgba(255,255,255,.85)';
      ctx.font = '700 26px "Baloo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cp.active ? '✓' : '★', 0, 1);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  drawGoal(state) {
    const ctx = this.ctx;
    const g = this.level.goal;
    const pulse = 1 + Math.sin(this.time * 2.6) * 0.05;

    ctx.save();
    ctx.translate(g.x, g.y);

    // Pulsing rings
    for (let i = 0; i < 3; i += 1) {
      const t = (this.time * 0.6 + i / 3) % 1;
      ctx.beginPath();
      ctx.arc(0, 0, g.r * (0.8 + t * 0.8), 0, TAU);
      ctx.strokeStyle = `rgba(255,255,255,${0.45 * (1 - t)})`;
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // Hole
    ctx.beginPath();
    ctx.ellipse(0, 6, g.r * pulse, g.r * 0.78 * pulse, 0, 0, TAU);
    ctx.fillStyle = 'rgba(62,49,85,.28)';
    ctx.fill();
    const grad = ctx.createRadialGradient(0, -6, 4, 0, 0, g.r);
    grad.addColorStop(0, '#2b2340');
    grad.addColorStop(0.7, '#4a3c66');
    grad.addColorStop(1, '#6b5a8c');
    ctx.beginPath();
    ctx.ellipse(0, 0, g.r * 0.82 * pulse, g.r * 0.66 * pulse, 0, 0, TAU);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#fff6d8';
    ctx.lineWidth = 7;
    ctx.stroke();

    // Little flag / chest marker
    const img = this.world.id === 'treasure' ? ART.chest : this.world.id === 'chase' ? ART.yarn : ART.flower;
    if (img) {
      const s = g.r * 1.15;
      ctx.globalAlpha = 0.98;
      ctx.drawImage(img, -s / 2, -g.r * 1.75 - s / 2, s, s);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  drawCollectibles(state) {
    const ctx = this.ctx;
    const t = this.time;
    const all = this.level.collectibles.concat(this.level.surprises);
    for (const c of all) {
      if (c.taken) continue;
      const bob = Math.sin(t * 2.4 + c.phase) * 5;
      const scale = c.hidden ? 0.82 : 1;
      const size = 54 * scale;
      const img = ART[c.type] || ART.star;
      if (!img) continue;

      // shadow
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = '#3e3155';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + size * 0.42, size * 0.3, size * 0.11, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (c.hidden) {
        const glow = ctx.createRadialGradient(c.x, c.y + bob, 4, c.x, c.y + bob, size * 0.9);
        glow.addColorStop(0, 'rgba(255,246,168,.55)');
        glow.addColorStop(1, 'rgba(255,246,168,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(c.x, c.y + bob, size * 0.9, 0, TAU);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(c.x, c.y + bob);
      const wob = c.hidden ? Math.sin(t * 3 + c.phase) * 0.12 : 0;
      ctx.rotate(wob);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }

  drawDecorations() {
    const ctx = this.ctx;
    const b = this.level.bounds;
    const view = {
      x0: this.cam.x - this.w / (2 * this.zoom) - 160,
      x1: this.cam.x + this.w / (2 * this.zoom) + 160,
      y0: this.cam.y - this.h / (2 * this.zoom) - 160,
      y1: this.cam.y + this.h / (2 * this.zoom) + 160,
    };
    for (const d of this.level.decorations) {
      if (d.x < view.x0 || d.x > view.x1 || d.y < view.y0 || d.y > view.y1) continue;
      if (d.x < b.minX - 50 || d.x > b.maxX + 50 || d.y < b.minY - 50 || d.y > b.maxY + 50) continue;
      const variant = d.tint > 0.66 ? 2 : d.tint > 0.33 ? 1 : 0;
      const sprite = decorSprite(d.type, variant);
      const base = d.type === 'tree' || d.type === 'palm' ? 220 : 150;
      const size = base * d.scale;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.scale(d.flip, 1);
      if (d.frame) ctx.globalAlpha = 0.96;
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  drawObstacles(state) {
    const ctx = this.ctx;
    const t = state.time || 0;
    for (const o of this.level.obstacles) {
      let ox = o.x;
      let oy = o.y;
      if (o.move) {
        const wave = Math.sin(t * o.move.speed + o.move.phase);
        ox += o.move.x * o.move.amp * wave;
        oy += o.move.y * o.move.amp * wave;
      }
      const sprite = obstacleSprite(o.kind, o.r);
      // Sprite art spans ~45% of its canvas half-width, so scale it up to
      // match the real collision radius (players must see what they bump).
      const size = o.r * 4.4;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }

  drawShowWay() {
    if (this.time > this.showWayUntil) return;
    const ctx = this.ctx;
    const path = this.level.path;
    const alpha = Math.min(1, (this.showWayUntil - this.time) / 0.8);
    ctx.save();
    ctx.globalAlpha = 0.55 * alpha;
    ctx.strokeStyle = '#fff6a8';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.setLineDash([22, 18]);
    ctx.lineDashOffset = -this.time * 60;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i += 1) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.9 * alpha;
    ctx.fillStyle = '#fff6a8';
    for (let d = 200; d < this.level.total - 100; d += 300) {
      const p = pointAtDistance(this.level, d);
      starPath(ctx, p.x, p.y, 12, 5, 5);
      ctx.fill();
    }
    ctx.restore();
  }

  drawGuidance(state) {
    if (!state.guidance || !this.level) return;
    const ball = state.ball;
    const goal = this.level.goal;
    const dx = goal.x - ball.x;
    const dy = goal.y - ball.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 240) return;
    const a = Math.atan2(dy, dx);
    const radius = 74;
    const x = ball.x + Math.cos(a) * radius;
    const y = ball.y + Math.sin(a) * radius;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.globalAlpha = 0.5 + Math.sin(this.time * 3) * 0.12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-8, -11);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-8, 11);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(62,49,85,.35)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  drawBall(state) {
    const ctx = this.ctx;
    const ball = state.ball;
    const r = ball.radius;

    // shadow
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#3e3155';
    ctx.beginPath();
    ctx.ellipse(ball.x + 3, ball.y + r * 0.82, r * 0.94, r * 0.38, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    const color = state.ballColor || '#ff8fb7';
    const dark = state.ballDark || '#d9548a';

    const grad = ctx.createRadialGradient(
      ball.x - r * 0.35,
      ball.y - r * 0.4,
      r * 0.15,
      ball.x,
      ball.y,
      r * 1.05
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.28, lighten(color, 0.35));
    grad.addColorStop(0.72, color);
    grad.addColorStop(1, dark);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r, 0, TAU);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.stroke();

    // Rolling pattern (three dots) so movement reads clearly.
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.roll * 1.2 + ball.spin * 0.3);
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * TAU;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.12, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // Highlight
    ctx.beginPath();
    ctx.ellipse(ball.x - r * 0.34, ball.y - r * 0.4, r * 0.26, r * 0.18, -0.6, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fill();

    if (ball.bumpFlash > 0.02) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, r + 5 + ball.bumpFlash * 6, 0, TAU);
      ctx.strokeStyle = `rgba(255,255,255,${0.6 * ball.bumpFlash})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }

  drawPet(state) {
    const pet = state.pet;
    if (!pet) return;
    const key = state.petHappy > 0 ? `${pet}Happy` : state.petBlink ? `${pet}Blink` : pet;
    const img = ART[key] || ART[pet];
    if (!img) return;
    const ball = state.ball;
    const moving = Math.hypot(state.ball.vx, state.ball.vy) > 26;
    const bob = Math.sin(this.time * (moving ? 9 : 2.2)) * (moving ? 3.5 : 2);
    const face = state.facing < 0 ? -1 : 1;

    const h = 124;
    const w = (img.width / img.height) * h;

    // Companion runs beside the marble, slightly behind it.
    const offX = -face * (ball.radius + w * 0.34);
    const offY = 14;
    const x = ball.x + offX;
    const y = ball.y + offY + bob;

    ctxShadow(this.ctx, x, y + h * 0.42, w * 0.34, 8);
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(face, 1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  drawWorldParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      if (p.screen) continue;
      const a = clamp(p.life / 0.5, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.type === 'star') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        starPath(ctx, 0, 0, p.size, p.size * 0.45, 5);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawScreenParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      if (!p.screen) continue;
      const a = clamp(p.life / 0.8, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      roundRect(ctx, -p.size / 2, -p.size / 3, p.size, p.size * 0.66, 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  drawFloaters() {
    const ctx = this.ctx;
    for (const f of this.floaters) {
      const s = this.worldToScreen(f.x, f.y);
      const a = clamp(f.life / 0.5, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = '800 26px "Baloo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(62,49,85,.35)';
      ctx.strokeText(f.text, s.x, s.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, s.x, s.y);
    }
    ctx.globalAlpha = 1;
  }

  drawVignette() {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(this.w / 2, this.h / 2, this.h * 0.35, this.w / 2, this.h / 2, this.h * 0.95);
    g.addColorStop(0, 'rgba(62,49,85,0)');
    g.addColorStop(1, 'rgba(62,49,85,.16)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
  }
}

function ctxShadow(ctx, x, y, rx, ry) {
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#3e3155';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function lighten(hex, amount) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function pointAtDistance(level, dist) {
  const { path, metrics } = level;
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
    nx: -(b.y - a.y) / segLen,
    ny: (b.x - a.x) / segLen,
    tx: (b.x - a.x) / segLen,
    ty: (b.y - a.y) / segLen,
  };
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

export { pointAtDistance };