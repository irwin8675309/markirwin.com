/**
 * Canvas renderer for Ghosty, Spin, and Oakley's Great Escape.
 *
 * Static board art (background, floor, walls, destination) is painted once
 * into an offscreen canvas. Each animation frame only redraws the dynamic
 * layer: collectibles, movable objects, the hidden friend, the player pet,
 * hints and particles. Everything is drawn in CSS pixels; the backing store is
 * scaled for high-density iPad screens.
 */

import { Art } from './art.js';
import { WorldArt } from './world-art.js';
import { CHARACTERS, WORLDS, COLLECTIBLES } from './config.js';
import { mulberry32 } from './board.js';

const PET_POSES = ['idle', 'runA', 'runB', 'celebrate'];
const ITEM_KEYS = ['star', 'heart', 'treat', 'sparkle', 'gem', 'butterfly'];
const OBJECT_KEYS = ['pillow', 'cushion', 'block', 'blockBlue', 'blockYellow', 'box', 'ball', 'crate'];
const DECOR_KEYS = ['flower', 'bush', 'cloud', 'balloon'];

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function loadArt() {
  const specs = new Map();

  for (const pet of Object.keys(CHARACTERS)) {
    for (const pose of PET_POSES) {
      specs.set(`char-${pet}-${pose}`, Art.petDataURI(pet, pose));
    }
  }
  for (const key of ITEM_KEYS) specs.set(`item-${key}`, Art.itemDataURI(key));
  for (const key of OBJECT_KEYS) specs.set(`obj-${key}`, WorldArt.object(key));
  for (const world of Object.values(WORLDS)) {
    specs.set(`dest-${world.id}`, WorldArt.destination(destKeyForWorld(world.id)));
  }
  for (const key of DECOR_KEYS) specs.set(`decor-${key}`, WorldArt.decor(key));

  const entries = await Promise.all(
    [...specs.entries()].map(async ([key, src]) => [key, await loadImage(src)]),
  );
  return new Map(entries);
}

function destKeyForWorld(worldId) {
  return (
    {
      pillow: 'pillowfort',
      backyard: 'gardentent',
      toybox: 'toychest',
      adventure: 'adventure',
    }[worldId] || 'pillowfort'
  );
}

/* Small helpers ----------------------------------------------------- */

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, w, h, r, fill) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawStar(ctx, x, y, r, color, points = 5) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPaw(ctx, x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.2, size * 0.36, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  const toes = [
    [-0.34, -0.14],
    [-0.13, -0.32],
    [0.13, -0.32],
    [0.34, -0.14],
  ];
  for (const [tx, ty] of toes) {
    ctx.beginPath();
    ctx.ellipse(x + tx * size, y + ty * size, size * 0.13, size * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* Renderer ---------------------------------------------------------- */

export class EscapeRenderer {
  constructor(canvas, images) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.images = images;
    this.staticCanvas = document.createElement('canvas');
    this.staticCtx = this.staticCanvas.getContext('2d');
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.layout = null;
    this.world = null;
    this.metrics = null;
    this.seed = 1;
  }

  img(key) {
    return this.images.get(key) || null;
  }

  resize(cssW, cssH) {
    const nextW = Math.max(1, Math.round(cssW));
    const nextH = Math.max(1, Math.round(cssH));
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2.5);
    if (nextW === this.w && nextH === this.h && nextDpr === this.dpr && this.canvas.width > 0) {
      return;
    }
    this.w = nextW;
    this.h = nextH;
    this.dpr = nextDpr;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.staticCanvas.width = this.canvas.width;
    this.staticCanvas.height = this.canvas.height;
    this.staticCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.computeMetrics();
    this.renderStatic();
    if (this.layout) this.paintFrame();
  }

  setLevel(layout, worldId, seed = 1) {
    this.layout = layout;
    this.world = WORLDS[worldId] || WORLDS.pillow;
    this.seed = seed || 1;
    this.computeMetrics();
    this.renderStatic();
    if (this.w) this.paintFrame();
  }

  computeMetrics() {
    if (!this.layout || !this.w || !this.h) return;
    const { cols, rows } = this.layout;
    const pad = Math.max(10, Math.min(26, this.w * 0.02));
    const reserve = this.measureBottomReserve();
    const topReserve = Math.max(6, this.h * 0.012);
    const availW = this.w - pad * 2;
    const availH = this.h - reserve - topReserve - pad;
    const cell = Math.max(20, Math.min(availW / cols, availH / rows));
    const boardW = cell * cols;
    const boardH = cell * rows;
    this.metrics = {
      cell,
      boardW,
      boardH,
      boardX: (this.w - boardW) / 2,
      boardY: topReserve + Math.max(0, (availH - boardH) / 2),
      radius: Math.max(6, cell * 0.26),
    };
  }

  measureBottomReserve() {
    const el = document.querySelector('.game-controls');
    if (!el) return 96;
    const h = el.getBoundingClientRect().height;
    return (h > 0 ? h : 96) + 16;
  }

  cellCenter(index) {
    if (!this.metrics || !this.layout) return { x: 0, y: 0 };
    const { cell, boardX, boardY } = this.metrics;
    const cols = this.layout.cols;
    const c = index % cols;
    const r = Math.floor(index / cols);
    return { x: boardX + (c + 0.5) * cell, y: boardY + (r + 0.5) * cell };
  }

  cellRect(index) {
    const { cell, boardX, boardY } = this.metrics;
    const cols = this.layout.cols;
    const c = index % cols;
    const r = Math.floor(index / cols);
    return { x: boardX + c * cell, y: boardY + r * cell, w: cell, h: cell };
  }

  /* Static art ------------------------------------------------------ */

  renderStatic() {
    if (!this.layout || !this.metrics) return;
    const ctx = this.staticCtx;
    ctx.clearRect(0, 0, this.w, this.h);
    this.drawBackground(ctx);
    this.drawBoardBase(ctx);
    this.drawFloor(ctx);
    this.drawWalls(ctx);
    this.drawStart(ctx);
    this.drawDestination(ctx);
  }

  drawBackground(ctx) {
    const { w, h } = this;
    const world = this.world;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, world.render.bgTop);
    grad.addColorStop(1, world.render.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft sun / glow.
    const sunX = w * 0.85;
    const sunY = h * 0.12;
    const sunR = Math.min(w, h) * 0.07;
    const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 2.6);
    glow.addColorStop(0, 'rgba(255, 250, 205, .9)');
    glow.addColorStop(1, 'rgba(255, 250, 205, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 2.6, 0, Math.PI * 2);
    ctx.fill();

    // Decorative clouds / shapes, deterministic per level.
    const rng = mulberry32((this.seed || 1) ^ 0x51ab);
    ctx.save();
    for (let i = 0; i < 3; i += 1) {
      const cx = (rng() * 0.9 + 0.05) * w;
      const cy = (rng() * 0.2 + 0.04) * h;
      const s = Math.min(w, h) * (0.04 + rng() * 0.03);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, s, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.9, cy + s * 0.14, s * 0.76, 0, Math.PI * 2);
      ctx.arc(cx - s * 0.86, cy + s * 0.16, s * 0.66, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.15, cy - s * 0.44, s * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // Ground strip behind the board.
    const groundY = h * 0.82;
    ctx.fillStyle = world.render.outside;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.quadraticCurveTo(w * 0.3, groundY - h * 0.05, w * 0.55, groundY);
    ctx.quadraticCurveTo(w * 0.8, groundY + h * 0.04, w, groundY - h * 0.01);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawBoardBase(ctx) {
    const { boardX, boardY, boardW, boardH, radius } = this.metrics;
    const pad = this.metrics.cell * 0.18;
    ctx.save();
    ctx.shadowColor = 'rgba(74, 54, 96, .26)';
    ctx.shadowBlur = this.metrics.cell * 0.5;
    ctx.shadowOffsetY = this.metrics.cell * 0.22;
    fillRoundRect(
      ctx,
      boardX - pad,
      boardY - pad,
      boardW + pad * 2,
      boardH + pad * 2,
      radius * 1.6,
      this.world.render.outside,
    );
    ctx.restore();

    ctx.save();
    roundRectPath(ctx, boardX - pad, boardY - pad, boardW + pad * 2, boardH + pad * 2, radius * 1.6);
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = Math.max(2, this.metrics.cell * 0.05);
    ctx.stroke();
    ctx.restore();
  }

  drawFloor(ctx) {
    const { boardX, boardY, boardW, boardH, cell, radius } = this.metrics;
    const cols = this.layout.cols;
    const rows = this.layout.rows;
    const r = this.world.render;
    ctx.save();
    roundRectPath(ctx, boardX, boardY, boardW, boardH, radius);
    ctx.clip();

    const grad = ctx.createLinearGradient(boardX, boardY, boardX, boardY + boardH);
    grad.addColorStop(0, r.floorA);
    grad.addColorStop(1, r.floorB);
    ctx.fillStyle = grad;
    ctx.fillRect(boardX, boardY, boardW, boardH);

    for (let row = 0; row < rows; row += 1) {
      for (let c = 0; c < cols; c += 1) {
        if ((row + c) % 2 === 0) continue;
        ctx.fillStyle = r.floorLine;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(boardX + c * cell, boardY + row * cell, cell, cell);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawWalls(ctx) {
    const { cell, boardX, boardY } = this.metrics;
    const cols = this.layout.cols;
    const rows = this.layout.rows;
    const walls = this.layout.walls;
    const style = this.world.render.wallStyle;
    ctx.save();
    for (let row = 0; row < rows; row += 1) {
      for (let c = 0; c < cols; c += 1) {
        const index = row * cols + c;
        if (walls[index] !== 1) continue;
        this.drawWallTile(ctx, boardX + c * cell, boardY + row * cell, cell, style);
      }
    }
    ctx.restore();
  }

  drawWallTile(ctx, x, y, cell, style) {
    const r = this.world.render;
    const inset = cell * 0.06;
    const w = cell - inset * 2;
    const rad = Math.max(4, cell * 0.24);
    const px = x + inset;
    const py = y + inset;

    ctx.save();
    ctx.shadowColor = 'rgba(60, 44, 82, .2)';
    ctx.shadowBlur = cell * 0.14;
    ctx.shadowOffsetY = cell * 0.06;

    if (style === 'block') {
      // Toy block: bright cube with a stud.
      fillRoundRect(ctx, px, py, w, w, rad, r.wall);
      ctx.strokeStyle = r.wallEdge;
      ctx.lineWidth = Math.max(1.5, cell * 0.04);
      roundRectPath(ctx, px, py, w, w, rad);
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = r.wallHi;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.ellipse(px + w / 2, py + w * 0.24, w * 0.16, w * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // little star
      drawStar(ctx, px + w * 0.5, py + w * 0.62, w * 0.14, r.wallHi);
    } else if (style === 'fence') {
      // Wooden fence: vertical planks.
      fillRoundRect(ctx, px, py, w, w, rad * 0.6, r.wall);
      ctx.strokeStyle = r.wallEdge;
      ctx.lineWidth = Math.max(1.5, cell * 0.04);
      roundRectPath(ctx, px, py, w, w, rad * 0.6);
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = r.wallEdge;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = Math.max(1, cell * 0.03);
      for (let i = 1; i < 3; i += 1) {
        const lx = px + (w / 3) * i;
        ctx.beginPath();
        ctx.moveTo(lx, py + w * 0.12);
        ctx.lineTo(lx, py + w * 0.88);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (style === 'hedge') {
      // Hedge: leafy green rounded blob with dots.
      fillRoundRect(ctx, px, py, w, w, rad, r.wall);
      ctx.strokeStyle = r.wallEdge;
      ctx.lineWidth = Math.max(1.5, cell * 0.04);
      roundRectPath(ctx, px, py, w, w, rad);
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = r.wallHi;
      ctx.globalAlpha = 0.7;
      const rng = mulberry32((x * 13 + y * 7) | 0);
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(px + w * (0.25 + rng() * 0.5), py + w * (0.25 + rng() * 0.5), w * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      // Pillow (default): puffy lavender cushion with a tuft button.
      fillRoundRect(ctx, px, py, w, w, rad, r.wall);
      ctx.strokeStyle = r.wallEdge;
      ctx.lineWidth = Math.max(1.5, cell * 0.04);
      roundRectPath(ctx, px, py, w, w, rad);
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = r.wallHi;
      ctx.globalAlpha = 0.6;
      roundRectPath(ctx, px + w * 0.14, py + w * 0.14, w * 0.72, w * 0.72, rad * 0.8);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = r.wallEdge;
      ctx.beginPath();
      ctx.arc(px + w / 2, py + w / 2, w * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = r.wallHi;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(px + w / 2 - w * 0.02, py + w / 2 - w * 0.02, w * 0.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  drawStart(ctx) {
    const { x, y } = this.cellCenter(this.layout.start);
    const { cell } = this.metrics;
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, cell * 0.05, x, y, cell * 0.4);
    grad.addColorStop(0, 'rgba(255,255,255,.9)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, cell * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    drawPaw(ctx, x, y, cell * 0.34, this.world.accentDark);
    ctx.restore();
  }

  drawDestination(ctx) {
    const { x, y } = this.cellCenter(this.layout.goal);
    const { cell, boardY } = this.metrics;
    const baseSize = cell * 2.0;
    const img = this.img(`dest-${this.world.id}`);
    const aspect = img ? img.height / img.width : 1;
    const anchorY = y + cell * 0.55;
    const minTop = Math.max(2, boardY - cell * 1.2);
    let size = baseSize;
    let h = size * aspect;
    if (anchorY - h < minTop) {
      const available = Math.max(cell * 0.8, anchorY - minTop);
      const scale = Math.max(0.5, available / h);
      size = baseSize * scale;
      h = size * aspect;
    }
    const top = Math.max(minTop, anchorY - h);
    const glowY = top + h / 2;
    ctx.save();
    const glow = ctx.createRadialGradient(x, glowY, size * 0.1, x, glowY, size * 0.8);
    glow.addColorStop(0, 'rgba(255, 246, 180, .7)');
    glow.addColorStop(1, 'rgba(255, 246, 180, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, glowY, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    if (img) {
      ctx.drawImage(img, x - size / 2, top, size, h);
    } else {
      fillRoundRect(ctx, x - size * 0.4, top, size * 0.8, size * 0.8, size * 0.2, this.world.accent);
    }
    ctx.restore();
  }

  /* Dynamic frame --------------------------------------------------- */

  paintFrame() {
    if (!this.layout || !this.metrics || !this.w) return;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.staticCanvas, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  draw(state) {
    if (!this.layout || !this.metrics) return;
    const ctx = this.ctx;
    this.paintFrame();
    const time = state.time || 0;
    this.drawAmbient(ctx, time);
    this.drawHint(ctx, state, time);
    this.drawCollectibles(ctx, state, time);
    this.drawFriends(ctx, state, time);
    this.drawObjects(ctx, state, time);
    this.drawPlayer(ctx, state, time);
    this.drawParticles(ctx, state);
  }

  drawAmbient(ctx, time) {
    const { boardX, boardY, boardW, boardH } = this.metrics;
    const rng = mulberry32((this.seed || 1) ^ 0x77aa);
    const count = 5;
    ctx.save();
    for (let i = 0; i < count; i += 1) {
      const baseX = boardX + rng() * boardW;
      const baseY = boardY + rng() * boardH;
      const phase = rng() * Math.PI * 2;
      const amp = 8 + rng() * 14;
      const x = baseX + Math.sin(time * 0.5 + phase) * amp;
      const y = baseY + Math.cos(time * 0.7 + phase) * amp * 0.6;
      ctx.globalAlpha = 0.25 + Math.sin(time * 1.5 + phase) * 0.18;
      drawStar(ctx, x, y, this.metrics.cell * 0.05, '#fff6b0');
    }
    ctx.restore();
  }

  drawHint(ctx, state, time) {
    const hint = state.hint;
    if (!hint || !hint.active) return;
    const { cell } = this.metrics;
    const pulse = 0.5 + Math.sin(time * 5) * 0.5;

    if (hint.path && hint.path.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = 'rgba(62, 49, 85, .9)';
      ctx.lineWidth = Math.max(6, cell * 0.26);
      ctx.beginPath();
      hint.path.forEach((index, i) => {
        const p = this.cellCenter(index);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#ffe27a';
      ctx.lineWidth = Math.max(3, cell * 0.13);
      ctx.beginPath();
      hint.path.forEach((index, i) => {
        const p = this.cellCenter(index);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.restore();
    }

    // Pulse ring around the suggested cell (object to move, or goal).
    let targetIndex = -1;
    if (hint.objectIndex != null && hint.objectIndex >= 0) targetIndex = hint.objectIndex;
    else if (hint.dropIndex != null && hint.dropIndex >= 0) targetIndex = hint.dropIndex;
    else if (state.pet) targetIndex = state.pet.cell;

    if (targetIndex >= 0) {
      const p = this.cellCenter(targetIndex);
      const ringR = cell * (0.4 + pulse * 0.08);
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = 'rgba(62, 49, 85, .8)';
      ctx.lineWidth = Math.max(5, cell * 0.14);
      ctx.beginPath();
      ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.6 + pulse * 0.35;
      ctx.strokeStyle = '#fff3a0';
      ctx.lineWidth = Math.max(2.5, cell * 0.07);
      ctx.beginPath();
      ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawCollectibles(ctx, state, time) {
    const { cell } = this.metrics;
    const collected = state.collected || new Set();
    ctx.save();
    for (const item of state.collectibles) {
      if (collected.has(item.index)) continue;
      const p = this.cellCenter(item.index);
      const bob = Math.sin(time * 2.2 + item.phase) * cell * 0.06;
      const pulse = 1 + Math.sin(time * 2.6 + item.phase) * 0.05;
      const key = `item-${COLLECTIBLES[item.type] ? item.type : 'star'}`;
      const img = this.img(key);
      const size = cell * 0.58 * pulse;
      const glow = ctx.createRadialGradient(p.x, p.y + bob, size * 0.1, p.x, p.y + bob, size * 0.8);
      glow.addColorStop(0, 'rgba(255, 250, 200, .5)');
      glow.addColorStop(1, 'rgba(255, 250, 200, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y + bob, size * 0.8, 0, Math.PI * 2);
      ctx.fill();
      if (img) {
        const h = size * (img.height / img.width);
        ctx.drawImage(img, p.x - size / 2, p.y + bob - h / 2, size, h);
      } else {
        drawStar(ctx, p.x, p.y + bob, size * 0.35, '#ffd84d');
      }
    }
    ctx.restore();
  }

  drawObjects(ctx, state, time) {
    const { cell } = this.metrics;
    const drag = state.dragging;
    ctx.save();
    for (const obj of state.objects) {
      const isDragging = drag && drag.objectIndex === obj.index;
      let p;
      let scale = 1;
      if (isDragging) {
        p = { x: drag.x, y: drag.y - cell * 0.1 };
        scale = 1.12;
      } else {
        p = this.cellCenter(obj.index);
      }
      const key = `obj-${obj.key}`;
      const img = this.img(key) || this.img('obj-pillow');
      const size = cell * 0.82 * scale;
      // shadow
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = '#4b3c62';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + cell * 0.34, size * 0.4, size * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (img) {
        const h = size * (img.height / img.width);
        ctx.drawImage(img, p.x - size / 2, p.y - h * 0.62, size, h);
      } else {
        fillRoundRect(ctx, p.x - size / 2, p.y - size / 2, size, size, size * 0.2, '#c9a7ff');
      }
      // Gentle sparkle on movable objects so children notice them.
      const twinkle = 0.4 + Math.sin(time * 3 + obj.index) * 0.35;
      ctx.globalAlpha = Math.max(0, twinkle) * 0.8;
      drawStar(ctx, p.x + size * 0.36, p.y - size * 0.4, size * 0.08, '#fff3a0');
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Drop target highlight while dragging.
    if (drag && drag.targetIndex != null && drag.targetIndex >= 0 && drag.valid) {
      const target = this.cellRect(drag.targetIndex);
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(time * 8) * 0.12;
      fillRoundRect(ctx, target.x + 3, target.y + 3, target.w - 6, target.h - 6, cell * 0.2, '#7ce3a8');
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#3fae7a';
      ctx.lineWidth = Math.max(2, cell * 0.05);
      roundRectPath(ctx, target.x + 3, target.y + 3, target.w - 6, target.h - 6, cell * 0.2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawFriends(ctx, state, time) {
    const friends = state.friends || [];
    const { cell } = this.metrics;
    ctx.save();
    for (const friend of friends) {
      const p = this.cellCenter(friend.index);
      const size = cell * 1.5;
      const img = this.img(`char-${friend.charId}-idle`) || this.img(`char-${friend.charId}-celebrate`);
      if (!img) continue;
      const h = size * (img.height / img.width);
      if (!friend.rescued) {
        const glow = ctx.createRadialGradient(p.x, p.y, size * 0.1, p.x, p.y, size * 0.8);
        glow.addColorStop(0, 'rgba(255, 246, 180, .6)');
        glow.addColorStop(1, 'rgba(255, 246, 180, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.95;
        const bob = Math.sin(time * 2 + 1.3) * cell * 0.04;
        ctx.drawImage(img, p.x - size / 2, p.y - h * 0.6 + bob, size, h);
        ctx.globalAlpha = 0.5 + Math.sin(time * 3) * 0.3;
        drawStar(ctx, p.x + size * 0.3, p.y - size * 0.36, size * 0.08, '#fff3a0');
        ctx.globalAlpha = 1;
      } else {
        const bob = Math.abs(Math.sin(time * 6)) * cell * 0.05;
        ctx.drawImage(img, p.x - size / 2, p.y - h * 0.6 - bob, size, h);
      }
    }
    ctx.restore();
  }

  drawPlayer(ctx, state, time) {
    const player = state.player;
    if (!player) return;
    const pet = state.character;
    const { cell } = this.metrics;
    const pose = player.pose || 'idle';
    const img = this.img(`char-${pet}-${pose}`) || this.img(`char-${pet}-idle`);
    if (!img) {
      ctx.save();
      ctx.fillStyle = CHARACTERS[pet]?.accent || '#ffffff';
      ctx.strokeStyle = 'rgba(62, 49, 85, .45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, cell * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }

    let size = cell * 1.7;
    let y = player.y;
    const walkBob = player.moving ? Math.abs(Math.sin(time * 12)) * cell * 0.05 : 0;
    const floatBob = state.character === 'ghosty' ? Math.sin(time * 1.8) * cell * 0.04 : 0;
    y += walkBob + floatBob;
    if (state.character === 'oakley') size *= 1.04;

    const h = size * (img.height / img.width);
    ctx.save();
    ctx.translate(player.x, y);
    if (player.facing < 0) ctx.scale(-1, 1);
    if (state.spin > 0) ctx.rotate(state.spin * Math.PI * 2);
    if (state.character === 'oakley') ctx.rotate(Math.sin(time * 7) * 0.02);
    ctx.shadowColor = 'rgba(62, 49, 85, .38)';
    ctx.shadowBlur = size * 0.08;
    ctx.shadowOffsetY = size * 0.04;
    ctx.drawImage(img, -size / 2, -h * 0.62 - size * 0.03, size, h);
    ctx.restore();

    if (state.character === 'ghosty' && Math.sin(time * 2.1) > 0.86) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      drawStar(ctx, player.x + cell * 0.5, y - cell * 0.35, cell * 0.08, '#ffffff');
      ctx.restore();
    }
  }

  drawParticles(ctx, state) {
    const particles = state.particles || [];
    if (!particles.length) return;
    ctx.save();
    for (const p of particles) {
      const t = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.globalAlpha = t;
      if (p.type === 'star') {
        drawStar(ctx, p.x, p.y, p.size * (0.5 + t * 0.5), p.color, 5);
      } else if (p.type === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + t * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /* Coordinate conversion ------------------------------------------- */

  /** Convert a client coordinate to a cell index, or -1 if outside the board. */
  pixelToCell(clientX, clientY, rect) {
    if (!this.metrics || !this.layout) return -1;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const { cell, boardX, boardY } = this.metrics;
    const c = Math.floor((x - boardX) / cell);
    const r = Math.floor((y - boardY) / cell);
    const cols = this.layout.cols;
    const rows = this.layout.rows;
    if (c < 0 || r < 0 || c >= cols || r >= rows) return -1;
    return r * cols + c;
  }

  /** Convert a client coordinate to board-local pixel coordinates. */
  pixelToLocal(clientX, clientY, rect) {
    return { x: clientX - rect.left, y: clientY - rect.top };
  }
}