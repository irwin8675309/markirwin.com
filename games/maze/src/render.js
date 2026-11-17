/**
 * Canvas renderer for Maze Adventures.
 *
 * Static maze art is painted once into an offscreen canvas (background,
 * island, floor, walls, destination). Each animation frame only redraws the
 * dynamic layer: trail, hints, collectibles, hidden friend, player and
 * particles. Everything is drawn in CSS pixels; the backing store is scaled
 * for high-density iPad screens.
 */

import { Art } from './art.js';
import { WorldArt } from './world-art.js';
import { CHARACTERS, WORLDS, DIFFICULTIES } from './config.js';
import { mulberry32 } from './maze.js';

/* ------------------------------------------------------------------ */
/* Art loading                                                         */
/* ------------------------------------------------------------------ */

const PET_POSES = ['idle', 'runA', 'runB', 'celebrate'];
const ITEM_KEYS = ['star', 'heart', 'butterfly', 'sparkle', 'gem', 'treat'];
const WORLD_ITEM_KEYS = ['flower', 'acorn', 'mushroom', 'candy', 'lollipop', 'coin', 'treasure'];
const SURPRISE_KEYS = ['ladybug', 'firefly', 'sprinkle', 'crab'];
const PROP_KEYS = [
  'treeMeadow', 'treeForest', 'flower', 'bush', 'mushroomProp', 'starFlower',
  'lollipop', 'gumdropProp', 'candyCane', 'cloudIsland', 'sun',
];
const DECOR_KEYS = ['palmTree', 'treasureChest', 'rock', 'shell'];

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
  for (const key of WORLD_ITEM_KEYS) specs.set(`world-${key}`, WorldArt.item(key));
  for (const key of SURPRISE_KEYS) specs.set(`surprise-${key}`, WorldArt.surprise(key));
  for (const world of Object.values(WORLDS)) {
    specs.set(`dest-${world.id}`, WorldArt.destination(world.destination));
  }
  for (const key of PROP_KEYS) specs.set(`prop-${key}`, WorldArt.prop(key));
  for (const key of DECOR_KEYS) specs.set(`decor-${key}`, WorldArt.decor(key));

  const entries = await Promise.all(
    [...specs.entries()].map(async ([key, src]) => [key, await loadImage(src)]),
  );
  return new Map(entries);
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

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

function drawPaw(ctx, x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y + size * 0.18, size * 0.36, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  const toes = [
    [-0.34, -0.16], [-0.13, -0.34], [0.13, -0.34], [0.34, -0.16],
  ];
  for (const [tx, ty] of toes) {
    ctx.beginPath();
    ctx.ellipse(x + tx * size, y + ty * size, size * 0.13, size * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
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

/* ------------------------------------------------------------------ */
/* Renderer                                                            */
/* ------------------------------------------------------------------ */

export class MazeRenderer {
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
    this.difficulty = null;
    this.metrics = null;
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
    // Repaint immediately so a throttled/background tab is never left blank.
    if (this.layout) this.paintFrame();
  }

  setLevel(layout, worldId, difficultyId) {
    this.layout = layout;
    this.world = WORLDS[worldId] || WORLDS.garden;
    this.difficulty = DIFFICULTIES[difficultyId] || DIFFICULTIES.easy;
    this.computeMetrics();
    this.renderStatic();
    if (this.w) this.paintFrame();
  }

  computeMetrics() {
    if (!this.layout || !this.w || !this.h) return;
    const { cols, rows } = this.layout;
    const pad = Math.max(12, Math.min(26, this.w * 0.02));
    const controlsH = this.measureControlsHeight();
    const bottomReserve = Math.max(118, controlsH + 14);
    const topReserve = Math.max(8, this.h * 0.012);
    const availW = this.w - pad * 2;
    const availH = this.h - bottomReserve - topReserve - pad;
    const cell = Math.max(18, Math.min(availW / cols, availH / rows));
    const boardW = cell * cols;
    const boardH = cell * rows;
    this.metrics = {
      cell,
      boardW,
      boardH,
      boardX: (this.w - boardW) / 2,
      boardY: topReserve + Math.max(0, (availH - boardH) / 2),
      wall: Math.max(5, Math.min(cell * 0.24, 17)),
    };
  }

  measureControlsHeight() {
    const el = document.querySelector('.controls');
    if (!el) return 150;
    const h = el.getBoundingClientRect().height;
    return h > 0 ? h : 150;
  }

  cellCenter(index) {
    if (!this.metrics) return { x: 0, y: 0 };
    const { cell, boardX, boardY } = this.metrics;
    const cols = this.layout.cols;
    const c = index % cols;
    const r = Math.floor(index / cols);
    return {
      x: boardX + (c + 0.5) * cell,
      y: boardY + (r + 0.5) * cell,
    };
  }

  cellRect(index) {
    const { cell, boardX, boardY } = this.metrics;
    const cols = this.layout.cols;
    const c = index % cols;
    const r = Math.floor(index / cols);
    return { x: boardX + c * cell, y: boardY + r * cell, w: cell, h: cell };
  }

  /* ---------------------------- static art ---------------------------- */

  renderStatic() {
    if (!this.layout || !this.metrics) return;
    const ctx = this.staticCtx;
    const { w, h } = this;
    ctx.clearRect(0, 0, w, h);
    this.drawSky(ctx);
    this.drawIsland(ctx);
    this.drawCornerDecor(ctx);
    this.drawFloor(ctx);
    this.drawWalls(ctx);
    this.drawStart(ctx);
    this.drawDestination(ctx);
  }

  drawSky(ctx) {
    const { w, h } = this;
    const world = this.world;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, world.sky[0]);
    grad.addColorStop(0.65, world.sky[1]);
    grad.addColorStop(1, world.hillBack);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Sun with a soft halo.
    const sunX = w * 0.84;
    const sunY = h * 0.12;
    const sunR = Math.min(w, h) * 0.075;
    const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 2.4);
    glow.addColorStop(0, 'rgba(255, 248, 190, .95)');
    glow.addColorStop(0.55, 'rgba(255, 244, 160, .35)');
    glow.addColorStop(1, 'rgba(255, 244, 160, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff6b0';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy clouds.
    const rng = mulberry32((this.layout?.seed || 1) ^ 0x51ab);
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.72)';
    for (let i = 0; i < 4; i += 1) {
      const cx = (rng() * 0.9 + 0.05) * w;
      const cy = (rng() * 0.22 + 0.04) * h;
      const s = Math.min(w, h) * (0.035 + rng() * 0.03);
      ctx.beginPath();
      ctx.arc(cx, cy, s, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.9, cy + s * 0.12, s * 0.78, 0, Math.PI * 2);
      ctx.arc(cx - s * 0.85, cy + s * 0.14, s * 0.68, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.2, cy - s * 0.42, s * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Rolling hills.
    ctx.fillStyle = world.hillBack;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.78);
    ctx.quadraticCurveTo(w * 0.2, h * 0.66, w * 0.42, h * 0.77);
    ctx.quadraticCurveTo(w * 0.66, h * 0.88, w, h * 0.72);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = world.hill;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.86);
    ctx.quadraticCurveTo(w * 0.28, h * 0.76, w * 0.55, h * 0.86);
    ctx.quadraticCurveTo(w * 0.8, h * 0.94, w, h * 0.84);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  }

  drawIsland(ctx) {
    const { boardX, boardY, boardW, boardH, wall } = this.metrics;
    const pad = wall * 1.6;
    ctx.save();
    ctx.shadowColor = 'rgba(54, 40, 80, .28)';
    ctx.shadowBlur = wall * 2.2;
    ctx.shadowOffsetY = wall * 0.9;
    fillRoundRect(
      ctx,
      boardX - pad,
      boardY - pad,
      boardW + pad * 2,
      boardH + pad * 2,
      wall * 2.4,
      this.world.board.outside,
    );
    ctx.restore();

    // A soft highlight rim.
    ctx.save();
    roundRectPath(ctx, boardX - pad, boardY - pad, boardW + pad * 2, boardH + pad * 2, wall * 2.4);
    ctx.strokeStyle = 'rgba(255,255,255,.4)';
    ctx.lineWidth = Math.max(2, wall * 0.22);
    ctx.stroke();
    ctx.restore();
  }

  drawFloor(ctx) {
    const { boardX, boardY, boardW, boardH, cell, wall } = this.metrics;
    const b = this.world.board;
    ctx.save();
    roundRectPath(ctx, boardX, boardY, boardW, boardH, wall * 1.2);
    ctx.clip();

    const grad = ctx.createLinearGradient(boardX, boardY, boardX, boardY + boardH);
    grad.addColorStop(0, b.floor[0]);
    grad.addColorStop(1, b.floor[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(boardX, boardY, boardW, boardH);

    // Subtle checkerboard tiles help children read the grid.
    const cols = this.layout.cols;
    const rows = this.layout.rows;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if ((r + c) % 2 === 0) continue;
        ctx.fillStyle = b.floorAlt;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(boardX + c * cell, boardY + r * cell, cell, cell);
      }
    }
    ctx.globalAlpha = 1;

    const rng = mulberry32((this.layout.seed || 1) ^ 0x9e37);
    this.drawFloorTexture(ctx, rng);
    ctx.restore();
  }

  drawFloorTexture(ctx, rng) {
    const { boardX, boardY, boardW, boardH, cell } = this.metrics;
    const b = this.world.board;
    const count = Math.round((boardW * boardH) / (cell * cell) * 0.55);
    ctx.save();
    for (let i = 0; i < count; i += 1) {
      const x = boardX + rng() * boardW;
      const y = boardY + rng() * boardH;
      if (b.pattern === 'grass') {
        ctx.strokeStyle = 'rgba(71, 160, 80, .35)';
        ctx.lineWidth = Math.max(1, cell * 0.025);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - cell * 0.03, y - cell * 0.07);
        ctx.moveTo(x, y);
        ctx.lineTo(x + cell * 0.03, y - cell * 0.08);
        ctx.stroke();
      } else if (b.pattern === 'moss') {
        ctx.fillStyle = 'rgba(69, 143, 99, .28)';
        ctx.beginPath();
        ctx.arc(x, y, cell * 0.035, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.pattern === 'candy') {
        ctx.strokeStyle = i % 3 === 0 ? 'rgba(255,255,255,.75)' : 'rgba(244,132,176,.4)';
        ctx.lineWidth = Math.max(1, cell * 0.035);
        ctx.beginPath();
        ctx.moveTo(x - cell * 0.05, y);
        ctx.lineTo(x + cell * 0.05, y);
        ctx.stroke();
      } else if (b.pattern === 'sand') {
        ctx.fillStyle = 'rgba(190, 140, 74, .32)';
        ctx.beginPath();
        ctx.arc(x, y, cell * 0.025, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawWalls(ctx) {
    const { cell, boardX, boardY, wall } = this.metrics;
    const b = this.world.board;
    const { cols, rows, cells } = this.layout;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const segments = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const index = r * cols + c;
        const x = boardX + c * cell;
        const y = boardY + r * cell;
        if (cells[index] & 1) segments.push([x, y, x + cell, y]);
        if (cells[index] & 8) segments.push([x, y, x, y + cell]);
        if (r === rows - 1 && cells[index] & 4) segments.push([x, y + cell, x + cell, y + cell]);
        if (c === cols - 1 && cells[index] & 2) segments.push([x + cell, y, x + cell, y + cell]);
      }
    }

    // Dark outline first for strong contrast.
    ctx.strokeStyle = b.wallEdge;
    ctx.lineWidth = wall + Math.max(2, wall * 0.28);
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of segments) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();

    // Main hedge/candy/wood color.
    ctx.strokeStyle = b.wall;
    ctx.lineWidth = wall;
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of segments) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();

    // Soft top highlight gives the walls a rounded, toy-like feel.
    ctx.strokeStyle = b.wallHi;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = Math.max(1.5, wall * 0.28);
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of segments) {
      const horizontal = Math.abs(y2 - y1) < 0.5;
      const off = wall * 0.16;
      if (horizontal) {
        ctx.moveTo(x1 + wall * 0.3, y1 - off);
        ctx.lineTo(x2 - wall * 0.3, y2 - off);
      } else {
        ctx.moveTo(x1 - off, y1 + wall * 0.3);
        ctx.lineTo(x2 - off, y2 - wall * 0.3);
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Occasional round "pebbles" / candy dots on walls for texture.
    if (b.pattern === 'candy' || b.pattern === 'sand' || b.pattern === 'grass') {
      ctx.fillStyle = b.wallHi;
      ctx.globalAlpha = 0.35;
      const rng = mulberry32((this.layout.seed || 1) ^ 0x2f17);
      for (const [x1, y1, x2, y2] of segments) {
        if (rng() > 0.4) continue;
        const t = 0.2 + rng() * 0.6;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1.2, wall * 0.16), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  drawStart(ctx) {
    const { x, y } = this.cellCenter(this.layout.start);
    const { cell } = this.metrics;
    const r = cell * 0.36;
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
    grad.addColorStop(0, 'rgba(255,255,255,.95)');
    grad.addColorStop(0.7, 'rgba(255,255,255,.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    drawPaw(ctx, x, y, cell * 0.34, this.world.accentDark);
    ctx.restore();
  }

  drawDestination(ctx) {
    const { x, y } = this.cellCenter(this.layout.goal);
    const { cell, boardY, wall } = this.metrics;
    const baseSize = cell * 1.9;
    const img = this.img(`dest-${this.world.id}`);
    const aspect = img ? img.height / img.width : 1;
    const anchorY = y + cell * 0.5;
    const minTop = Math.max(2, boardY - wall * 1.4);
    let size = baseSize;
    let h = size * aspect;
    if (anchorY - h < minTop) {
      const available = Math.max(cell * 0.7, anchorY - minTop);
      const scale = Math.max(0.55, available / h);
      size = baseSize * scale;
      h = size * aspect;
    }
    const top = Math.max(minTop, anchorY - h);
    const glowY = top + h / 2;
    ctx.save();
    const glow = ctx.createRadialGradient(x, glowY, size * 0.1, x, glowY, size * 0.75);
    glow.addColorStop(0, 'rgba(255, 246, 180, .75)');
    glow.addColorStop(0.6, 'rgba(255, 246, 180, .25)');
    glow.addColorStop(1, 'rgba(255, 246, 180, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, glowY, size * 0.75, 0, Math.PI * 2);
    ctx.fill();
    if (img) {
      ctx.drawImage(img, x - size / 2, top, size, h);
    } else {
      fillRoundRect(ctx, x - size * 0.4, top, size * 0.8, size * 0.8, size * 0.2, this.world.accent);
    }
    ctx.restore();
  }

  drawCornerDecor(ctx) {
    const { boardX, boardY, boardW, boardH, cell } = this.metrics;
    const world = this.world;
    const picks = {
      garden: ['prop-treeMeadow', 'prop-bush', 'prop-flower', 'prop-flower'],
      forest: ['prop-treeForest', 'prop-mushroomProp', 'prop-starFlower', 'prop-bush'],
      candy: ['prop-lollipop', 'prop-gumdropProp', 'prop-candyCane', 'prop-lollipop'],
      treasure: ['decor-palmTree', 'decor-rock', 'decor-shell', 'decor-treasureChest'],
    }[world.id] || [];

    const spots = [
      { x: boardX - cell * 0.1, y: boardY + cell * 0.3, anchor: 'bottom', scale: 1.7 },
      { x: boardX + boardW + cell * 0.1, y: boardY + cell * 0.5, anchor: 'bottom', scale: 1.5 },
      { x: boardX + boardW * 0.18, y: boardY + boardH + cell * 0.2, anchor: 'top', scale: 1.1 },
      { x: boardX + boardW * 0.82, y: boardY + boardH + cell * 0.2, anchor: 'top', scale: 1.1 },
    ];

    ctx.save();
    for (let i = 0; i < picks.length && i < spots.length; i += 1) {
      const key = picks[i];
      const img = this.img(key);
      if (!img) continue;
      const spot = spots[i];
      let size = Math.min(cell * spot.scale, boardH * 0.34);
      size = Math.max(size, cell * 0.7);
      const h = size * (img.height / img.width);
      ctx.globalAlpha = 0.96;
      if (spot.anchor === 'bottom') {
        ctx.drawImage(img, spot.x - size / 2, spot.y - h, size, h);
      } else {
        ctx.drawImage(img, spot.x - size / 2, spot.y, size, h);
      }
    }
    ctx.restore();
  }

  /* ---------------------------- dynamic art --------------------------- */

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
    this.drawTrail(ctx, state, time);
    this.drawHint(ctx, state, time);
    this.drawCollectibles(ctx, state, time);
    this.drawFriend(ctx, state, time);
    this.drawPlayer(ctx, state, time);
    this.drawParticles(ctx, state);
  }

  drawAmbient(ctx, time) {
    const world = this.world;
    const { boardX, boardY, boardW, boardH } = this.metrics;
    const rng = mulberry32((this.layout.seed || 1) ^ 0x77aa);
    const count = world.id === 'forest' ? 7 : 4;
    ctx.save();
    for (let i = 0; i < count; i += 1) {
      const baseX = boardX + rng() * boardW;
      const baseY = boardY + rng() * boardH;
      const phase = rng() * Math.PI * 2;
      const amp = 12 + rng() * 22;
      const x = baseX + Math.sin(time * 0.5 + phase) * amp;
      const y = baseY + Math.cos(time * 0.7 + phase) * amp * 0.6;
      if (world.id === 'garden') {
        const img = this.img('item-butterfly');
        if (!img) continue;
        const s = this.metrics.cell * 0.5;
        ctx.globalAlpha = 0.75;
        ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
      } else if (world.id === 'forest') {
        ctx.globalAlpha = 0.5 + Math.sin(time * 2 + phase) * 0.3;
        ctx.fillStyle = '#fff2a0';
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (world.id === 'candy') {
        ctx.globalAlpha = 0.4 + Math.sin(time * 1.5 + phase) * 0.25;
        drawStar(ctx, x, y, 4, '#fff6b0');
      } else {
        ctx.globalAlpha = 0.35 + Math.sin(time * 1.2 + phase) * 0.2;
        ctx.fillStyle = '#fff8d0';
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawTrail(ctx, state, time) {
    const trail = state.trail;
    const showWay = state.showWay;
    const paths = [];
    if (trail?.active && trail.path?.length) paths.push({ path: trail.path, alpha: 0.8, color: '#ffe27a' });
    if (showWay?.active && showWay.path?.length) paths.push({ path: showWay.path, alpha: 0.95, color: '#fff6b0' });
    if (!paths.length) return;

    const { cell } = this.metrics;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const { path, alpha, color } of paths) {
      // Dark halo first so the path reads on light grass, sand or candy.
      ctx.globalAlpha = alpha * 0.32;
      ctx.strokeStyle = 'rgba(62, 49, 85, .9)';
      ctx.lineWidth = Math.max(6, cell * 0.28);
      ctx.beginPath();
      path.forEach((index, i) => {
        const p = this.cellCenter(index);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Bright glowing line.
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(3, cell * 0.14);
      ctx.beginPath();
      path.forEach((index, i) => {
        const p = this.cellCenter(index);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      ctx.globalAlpha = alpha;
      const pulse = 0.5 + Math.sin(time * 4) * 0.2;
      for (let i = 0; i < path.length; i += 1) {
        const p = this.cellCenter(path[i]);
        const r = cell * (0.12 + pulse * 0.04);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha * 0.25;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha;
      }
    }
    ctx.restore();
  }

  drawHint(ctx, state, time) {
    const hint = state.hint;
    if (!hint?.active) return;
    const { cell } = this.metrics;
    const pulse = 0.5 + Math.sin(time * 6) * 0.5;
    const from = this.cellCenter(hint.cell);
    ctx.save();
    const ringR = cell * (0.42 + pulse * 0.06);
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = 'rgba(62, 49, 85, .8)';
    ctx.lineWidth = Math.max(5, cell * 0.16);
    ctx.beginPath();
    ctx.arc(from.x, from.y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.65 + pulse * 0.3;
    ctx.strokeStyle = '#fff3a0';
    ctx.lineWidth = Math.max(2.5, cell * 0.08);
    ctx.beginPath();
    ctx.arc(from.x, from.y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Chevron pointing at the next cell.
    const next = this.cellCenter(hint.next);
    const dx = next.x - from.x;
    const dy = next.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const cx = from.x + ux * cell * 0.26;
    const cy = from.y + uy * cell * 0.26;
    const s = cell * 0.22;
    ctx.fillStyle = '#fff6b0';
    ctx.strokeStyle = '#e0a52a';
    ctx.lineWidth = Math.max(1.5, cell * 0.03);
    ctx.beginPath();
    ctx.moveTo(cx + ux * s, cy + uy * s);
    ctx.lineTo(cx - ux * s * 0.3 + px * s, cy - uy * s * 0.3 + py * s);
    ctx.lineTo(cx - ux * s * 0.3 - px * s, cy - uy * s * 0.3 - py * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawCollectibles(ctx, state, time) {
    const { cell } = this.metrics;
    const collected = state.collected || new Set();
    ctx.save();
    for (const item of this.layout.collectibles) {
      if (collected.has(item.index)) continue;
      const p = this.cellCenter(item.index);
      const bob = Math.sin(time * 2.2 + item.phase) * cell * 0.055;
      const pulse = 1 + Math.sin(time * 2.6 + item.phase) * 0.045;
      let img;
      let key;
      if (item.kind === 'surprise') {
        key = `surprise-${item.type}`;
      } else if (['flower', 'acorn', 'mushroom', 'candy', 'lollipop', 'coin', 'treasure'].includes(item.type)) {
        key = `world-${item.type}`;
      } else {
        key = `item-${item.type}`;
      }
      img = this.img(key);
      const size = cell * (item.kind === 'surprise' ? 0.66 : 0.62) * pulse;

      // Soft glow behind collectibles so they pop against every world.
      const glow = ctx.createRadialGradient(p.x, p.y + bob, size * 0.1, p.x, p.y + bob, size * 0.75);
      glow.addColorStop(0, 'rgba(255, 250, 200, .45)');
      glow.addColorStop(1, 'rgba(255, 250, 200, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y + bob, size * 0.75, 0, Math.PI * 2);
      ctx.fill();

      if (img) {
        const h = size * (img.height / img.width);
        ctx.drawImage(img, p.x - size / 2, p.y + bob - h / 2, size, h);
      } else {
        drawStar(ctx, p.x, p.y + bob, size * 0.35, '#ffd84d');
      }

      if (item.kind === 'surprise') {
        ctx.globalAlpha = 0.5 + Math.sin(time * 3 + item.phase) * 0.3;
        drawStar(ctx, p.x + size * 0.34, p.y - size * 0.34, size * 0.16, '#fff3a0');
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  drawFriend(ctx, state, time) {
    const friend = state.friend;
    if (!friend) return;
    const { cell } = this.metrics;
    const p = friend.rescued ? state.friendVisual || this.cellCenter(friend.index) : this.cellCenter(friend.index);
    const img = this.img(`char-${friend.charId}-idle`);
    const size = cell * (friend.rescued ? 1.65 : 1.55);
    if (!img) {
      ctx.save();
      ctx.fillStyle = CHARACTERS[friend.charId]?.accent || '#ffffff';
      ctx.strokeStyle = 'rgba(62, 49, 85, .4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, cell * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }
    const h = size * (img.height / img.width);
    ctx.save();
    if (!friend.rescued) {
      const glow = ctx.createRadialGradient(p.x, p.y, size * 0.1, p.x, p.y, size * 0.85);
      glow.addColorStop(0, 'rgba(255, 246, 180, .55)');
      glow.addColorStop(1, 'rgba(255, 246, 180, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.92;
      const bob = Math.sin(time * 2 + 1.3) * cell * 0.04;
      ctx.save();
      ctx.shadowColor = 'rgba(62, 49, 85, .32)';
      ctx.shadowBlur = size * 0.07;
      ctx.drawImage(img, p.x - size / 2, p.y - h / 2 + bob, size, h);
      ctx.restore();
      ctx.globalAlpha = 0.5 + Math.sin(time * 3) * 0.3;
      drawStar(ctx, p.x + size * 0.32, p.y - size * 0.36, size * 0.1, '#fff3a0');
    } else {
      const bob = Math.abs(Math.sin(time * 6)) * cell * 0.06;
      ctx.save();
      ctx.shadowColor = 'rgba(62, 49, 85, .32)';
      ctx.shadowBlur = size * 0.07;
      ctx.drawImage(img, p.x - size / 2, p.y - h / 2 - bob, size, h);
      ctx.restore();
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

    let size = cell * 1.72;
    let x = player.x;
    let y = player.y;
    const walkBob = player.moving ? Math.abs(Math.sin(time * 12)) * cell * 0.045 : 0;
    const floatBob = state.character === 'ghosty' ? Math.sin(time * 1.8) * cell * 0.035 : 0;
    y += walkBob + floatBob;

    if (state.character === 'oakley') size *= 1.03;

    const h = size * (img.height / img.width);
    ctx.save();
    ctx.translate(x, y);
    if (player.facing < 0) ctx.scale(-1, 1);
    if (state.spin > 0) ctx.rotate(state.spin * Math.PI * 2);
    if (state.character === 'oakley') ctx.rotate(Math.sin(time * 7) * 0.022);
    ctx.shadowColor = 'rgba(62, 49, 85, .38)';
    ctx.shadowBlur = size * 0.075;
    ctx.shadowOffsetY = size * 0.035;
    ctx.drawImage(img, -size / 2, -h / 2 - size * 0.03, size, h);
    ctx.restore();

    // Ghosty's soft sparkle trail.
    if (state.character === 'ghosty' && Math.sin(time * 2.1) > 0.86) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      drawStar(ctx, x + cell * 0.5, y - cell * 0.35, cell * 0.08, '#ffffff');
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

  /* ---------------------------- conversions --------------------------- */

  pixelToCell(clientX, clientY, rect) {
    if (!this.metrics) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const { cell, boardX, boardY } = this.metrics;
    const c = Math.floor((x - boardX) / cell);
    const r = Math.floor((y - boardY) / cell);
    const cols = this.layout.cols;
    const rows = this.layout.rows;
    if (c < 0 || r < 0 || c >= cols || r >= rows) return null;
    return r * cols + c;
  }
}