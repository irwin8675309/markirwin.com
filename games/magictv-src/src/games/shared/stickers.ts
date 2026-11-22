import { drawAnimalFace } from './buddies';
import { heartPath, starPath } from '../../utils/draw';

/**
 * Sticker book. Play earns stickers: one after every few minutes of active play,
 * one for each new friend Teddy meets and one for Teamwork. Stickers are drawn in
 * code and saved in this browser.
 */

export interface Sticker {
  id: string;
  name: string;
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => void;
}

function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke = 'rgba(60,30,90,0.55)'): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function face(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = '#3a2350';
  for (const dx of [-0.3, 0.3]) {
    ctx.beginPath();
    ctx.ellipse(x + dx * r, y, r * 0.07, r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#3a2350';
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y + r * 0.08, r * 0.22, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

const OUT = 'rgba(60,30,90,0.55)';

export const STICKERS: Sticker[] = [
  {
    id: 'star',
    name: 'Shiny Star',
    draw: (c, x, y, r) => {
      starPath(c, x, y, r * 0.95, r * 0.42, 5, -Math.PI / 2);
      c.fillStyle = '#ffd93d';
      c.fill();
      c.lineWidth = r * 0.07;
      c.strokeStyle = '#d99a00';
      c.lineJoin = 'round';
      c.stroke();
      face(c, x, y + r * 0.05, r * 0.7);
    },
  },
  {
    id: 'heart',
    name: 'Big Heart',
    draw: (c, x, y, r) => {
      heartPath(c, x, y + r * 0.1, r * 1.9);
      c.fillStyle = '#ff5d7a';
      c.fill();
      c.lineWidth = r * 0.07;
      c.strokeStyle = '#c93a5a';
      c.stroke();
      face(c, x, y - r * 0.05, r * 0.7);
    },
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    draw: (c, x, y, r) => {
      const cols = ['#ff5d7a', '#ff9f43', '#ffe14d', '#5fdc7a', '#4dc4ff', '#9a7bff'];
      c.lineWidth = r * 0.14;
      c.lineCap = 'butt';
      cols.forEach((col, i) => {
        c.strokeStyle = col;
        c.beginPath();
        c.arc(x, y + r * 0.45, r * (0.95 - i * 0.14), Math.PI, 0);
        c.stroke();
      });
      disc(c, x - r * 0.85, y + r * 0.52, r * 0.22, '#ffffff', OUT);
      disc(c, x + r * 0.85, y + r * 0.52, r * 0.22, '#ffffff', OUT);
    },
  },
  {
    id: 'sun',
    name: 'Happy Sun',
    draw: (c, x, y, r) => {
      c.strokeStyle = '#ffb300';
      c.lineWidth = r * 0.12;
      c.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        c.beginPath();
        c.moveTo(x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72);
        c.lineTo(x + Math.cos(a) * r * 0.98, y + Math.sin(a) * r * 0.98);
        c.stroke();
      }
      disc(c, x, y, r * 0.64, '#ffd93d', '#d99a00');
      face(c, x, y, r * 0.8);
    },
  },
  {
    id: 'fish',
    name: 'Silly Fish',
    draw: (c, x, y, r) => {
      c.fillStyle = '#ff9f43';
      c.beginPath();
      c.moveTo(x - r * 0.45, y);
      c.lineTo(x - r * 0.98, y - r * 0.38);
      c.lineTo(x - r * 0.98, y + r * 0.38);
      c.closePath();
      c.fill();
      c.beginPath();
      c.ellipse(x + r * 0.1, y, r * 0.66, r * 0.46, 0, 0, Math.PI * 2);
      c.fillStyle = '#4dc4ff';
      c.fill();
      c.lineWidth = r * 0.06;
      c.strokeStyle = '#2a82b8';
      c.stroke();
      disc(c, x + r * 0.38, y - r * 0.1, r * 0.11, '#ffffff', '#2a82b8');
      disc(c, x + r * 0.4, y - r * 0.1, r * 0.05, '#3a2350', '#3a2350');
    },
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    draw: (c, x, y, r) => {
      for (const d of [-1, 1]) {
        c.beginPath();
        c.ellipse(x + d * r * 0.42, y - r * 0.28, r * 0.46, r * 0.5, d * 0.5, 0, Math.PI * 2);
        c.fillStyle = '#ff8ad8';
        c.fill();
        c.lineWidth = r * 0.05;
        c.strokeStyle = '#c0559f';
        c.stroke();
        c.beginPath();
        c.ellipse(x + d * r * 0.34, y + r * 0.34, r * 0.32, r * 0.34, -d * 0.4, 0, Math.PI * 2);
        c.fillStyle = '#b78bff';
        c.fill();
        c.stroke();
      }
      c.fillStyle = '#3a2350';
      c.beginPath();
      c.ellipse(x, y, r * 0.1, r * 0.55, 0, 0, Math.PI * 2);
      c.fill();
    },
  },
  {
    id: 'flower',
    name: 'Pretty Flower',
    draw: (c, x, y, r) => {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        disc(c, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.34, '#ff8ad8', '#c0559f');
      }
      disc(c, x, y, r * 0.38, '#ffd93d', '#d99a00');
      face(c, x, y, r * 0.55);
    },
  },
  {
    id: 'balloon',
    name: 'Red Balloon',
    draw: (c, x, y, r) => {
      c.strokeStyle = '#6a4a8a';
      c.lineWidth = r * 0.05;
      c.beginPath();
      c.moveTo(x, y + r * 0.6);
      c.quadraticCurveTo(x - r * 0.2, y + r * 0.85, x + r * 0.1, y + r * 1.0);
      c.stroke();
      c.beginPath();
      c.ellipse(x, y - r * 0.12, r * 0.62, r * 0.74, 0, 0, Math.PI * 2);
      c.fillStyle = '#ff5d7a';
      c.fill();
      c.lineWidth = r * 0.06;
      c.strokeStyle = '#c93a5a';
      c.stroke();
      c.beginPath();
      c.moveTo(x - r * 0.1, y + r * 0.62);
      c.lineTo(x + r * 0.1, y + r * 0.62);
      c.lineTo(x, y + r * 0.74);
      c.closePath();
      c.fillStyle = '#c93a5a';
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.6)';
      c.beginPath();
      c.ellipse(x - r * 0.25, y - r * 0.4, r * 0.1, r * 0.18, 0.5, 0, Math.PI * 2);
      c.fill();
    },
  },
  {
    id: 'cupcake',
    name: 'Cupcake',
    draw: (c, x, y, r) => {
      c.beginPath();
      c.moveTo(x - r * 0.62, y + r * 0.05);
      c.lineTo(x - r * 0.45, y + r * 0.85);
      c.lineTo(x + r * 0.45, y + r * 0.85);
      c.lineTo(x + r * 0.62, y + r * 0.05);
      c.closePath();
      c.fillStyle = '#ffd0a0';
      c.fill();
      c.lineWidth = r * 0.06;
      c.strokeStyle = '#b8743a';
      c.stroke();
      disc(c, x, y - r * 0.12, r * 0.66, '#ff8ad8', '#c0559f');
      disc(c, x, y - r * 0.58, r * 0.36, '#ffb3e6', '#c0559f');
      disc(c, x, y - r * 0.92, r * 0.1, '#ff5d7a', '#c93a5a');
      face(c, x, y - r * 0.12, r * 0.7);
    },
  },
  {
    id: 'crown',
    name: 'Royal Crown',
    draw: (c, x, y, r) => {
      c.beginPath();
      c.moveTo(x - r * 0.8, y + r * 0.5);
      c.lineTo(x - r * 0.9, y - r * 0.5);
      c.lineTo(x - r * 0.4, y - r * 0.05);
      c.lineTo(x, y - r * 0.7);
      c.lineTo(x + r * 0.4, y - r * 0.05);
      c.lineTo(x + r * 0.9, y - r * 0.5);
      c.lineTo(x + r * 0.8, y + r * 0.5);
      c.closePath();
      c.fillStyle = '#ffd93d';
      c.fill();
      c.lineWidth = r * 0.07;
      c.strokeStyle = '#d99a00';
      c.lineJoin = 'round';
      c.stroke();
      disc(c, x, y + r * 0.2, r * 0.13, '#ff5d7a', '#c93a5a');
      disc(c, x - r * 0.45, y + r * 0.25, r * 0.1, '#4dc4ff', '#2a82b8');
      disc(c, x + r * 0.45, y + r * 0.25, r * 0.1, '#5fdc7a', '#2f9e63');
    },
  },
  {
    id: 'rocket',
    name: 'Rocket',
    draw: (c, x, y, r) => {
      c.fillStyle = '#ff9f43';
      c.beginPath();
      c.moveTo(x - r * 0.15, y + r * 0.7);
      c.lineTo(x, y + r * 1.0);
      c.lineTo(x + r * 0.15, y + r * 0.7);
      c.closePath();
      c.fill();
      c.beginPath();
      c.ellipse(x, y - r * 0.05, r * 0.38, r * 0.82, 0, 0, Math.PI * 2);
      c.fillStyle = '#e8eefc';
      c.fill();
      c.lineWidth = r * 0.06;
      c.strokeStyle = '#7d8bb0';
      c.stroke();
      disc(c, x, y - r * 0.2, r * 0.2, '#4dc4ff', '#2a82b8');
      for (const d of [-1, 1]) {
        c.beginPath();
        c.moveTo(x + d * r * 0.3, y + r * 0.3);
        c.lineTo(x + d * r * 0.7, y + r * 0.72);
        c.lineTo(x + d * r * 0.3, y + r * 0.62);
        c.closePath();
        c.fillStyle = '#ff5d7a';
        c.fill();
        c.stroke();
      }
    },
  },
  {
    id: 'icecream',
    name: 'Ice Cream',
    draw: (c, x, y, r) => {
      c.beginPath();
      c.moveTo(x - r * 0.42, y + r * 0.0);
      c.lineTo(x, y + r * 1.0);
      c.lineTo(x + r * 0.42, y + r * 0.0);
      c.closePath();
      c.fillStyle = '#ffd0a0';
      c.fill();
      c.lineWidth = r * 0.06;
      c.strokeStyle = '#b8743a';
      c.stroke();
      disc(c, x, y - r * 0.15, r * 0.5, '#ff8ad8', '#c0559f');
      disc(c, x - r * 0.18, y - r * 0.55, r * 0.34, '#fff1b3', '#d9b84a');
      disc(c, x + r * 0.2, y - r * 0.5, r * 0.3, '#b3f0ff', '#4aa0b8');
      disc(c, x, y - r * 0.88, r * 0.09, '#ff5d7a', '#c93a5a');
    },
  },
  {
    id: 'moon',
    name: 'Sleepy Moon',
    draw: (c, x, y, r) => {
      c.beginPath();
      c.arc(x, y, r * 0.82, 0, Math.PI * 2);
      c.fillStyle = '#fff1b3';
      c.fill();
      c.lineWidth = r * 0.06;
      c.strokeStyle = '#d9b84a';
      c.stroke();
      disc(c, x + r * 0.38, y - r * 0.18, r * 0.62, '#2b2260', 'rgba(0,0,0,0)');
      c.strokeStyle = '#3a2350';
      c.lineWidth = r * 0.06;
      c.beginPath();
      c.arc(x - r * 0.28, y + r * 0.02, r * 0.1, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
    },
  },
  ...(['bunny', 'kitty', 'puppy', 'unicorn', 'panda', 'froggy'] as const).map(
    (id): Sticker => ({
      id: `pal-${id}`,
      name: { bunny: 'Bunny Pal', kitty: 'Kitty Pal', puppy: 'Puppy Pal', unicorn: 'Unicorn Pal', panda: 'Panda Pal', froggy: 'Froggy Pal' }[id],
      draw: (c, x, y, r) => drawAnimalFace(c, id, x, y + r * 0.12, r * 0.72),
    }),
  ),
];

const KEY = 'magictv.stickers';
const PROGRESS_KEY = 'magictv.stickerProgress';
/** Seconds of play (with a hand on screen) that earn one sticker. */
export const SECONDS_PER_STICKER = 150;

let owned: string[] = loadList(KEY);
let progress = loadNumber(PROGRESS_KEY);
let sinceSave = 0;

function loadList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
function loadNumber(key: string): number {
  try {
    const n = Number(localStorage.getItem(key));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}
function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(owned));
    localStorage.setItem(PROGRESS_KEY, String(Math.floor(progress)));
  } catch {
    /* private mode: stickers last until the page closes */
  }
}

type Listener = (s: Sticker, reason: string) => void;
const listeners = new Set<Listener>();

/** Be told whenever a sticker is earned. Returns a function that stops listening. */
export function onSticker(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function ownedStickers(): string[] {
  return owned.slice();
}

export function hasSticker(id: string): boolean {
  return owned.includes(id);
}

/** Gives the next sticker the child does not have yet. Returns null once she has them all. */
export function grantSticker(reason: string): Sticker | null {
  const next = STICKERS.find((s) => !owned.includes(s.id));
  if (!next) return null;
  owned = [...owned, next.id];
  persist();
  for (const fn of listeners) fn(next, reason);
  return next;
}

/** Call every frame while a child is playing. Earns a sticker after enough play. */
export function addPlaySeconds(dt: number): void {
  progress += dt;
  sinceSave += dt;
  if (progress >= SECONDS_PER_STICKER) {
    progress = 0;
    grantSticker('play');
  } else if (sinceSave > 10) {
    sinceSave = 0;
    persist();
  }
}

/** 0..1 towards the next play sticker. */
export function playProgress(): number {
  return Math.min(1, progress / SECONDS_PER_STICKER);
}

export function resetStickers(): void {
  owned = [];
  progress = 0;
  persist();
}
