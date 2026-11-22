import { BUDDIES, drawAnimalFace } from './buddies';
import { FONT_STACK } from '../../utils/font';

/** Teddy's animal friends (same animals as the buddies). */
export const FRIENDS = BUDDIES;

const KEY = 'magictv.friendsMet';
let met: string[] = load();

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function friendsMet(): string[] {
  return met.slice();
}

/** Records that a child has met this friend. True the first time ever. */
export function meetFriend(id: string): boolean {
  if (met.includes(id)) return false;
  met = [...met, id];
  try {
    localStorage.setItem(KEY, JSON.stringify(met));
  } catch {
    /* ignore */
  }
  return true;
}

export function resetFriends(): void {
  met = [];
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

function tint(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${f((n >> 16) & 255)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

/**
 * A little animal friend standing with feet at (x, y): round body, waving arm, face.
 * `hop` (0..1) makes it jump for joy.
 */
export function drawFriend(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  t: number,
  hop: number,
): void {
  const b = FRIENDS.find((f) => f.id === id) ?? FRIENDS[0];
  const jump = Math.sin(Math.min(1, hop) * Math.PI) * 70 * Math.min(1, hop * 2);
  const body = tint(b.color, 0.1);
  const edge = 'rgba(70,30,60,0.55)';
  ctx.save();
  ctx.translate(x, y - jump);
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#2a1240';
  ctx.beginPath();
  ctx.ellipse(0, jump + 6, 80, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 6;
  ctx.strokeStyle = edge;

  const blob = (cx: number, cy: number, rx: number, ry: number, fill: string) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.stroke();
  };
  // feet, body, belly
  blob(-34, -14, 34, 20, body);
  blob(34, -14, 34, 20, body);
  blob(0, -78, 66, 74, body);
  blob(0, -62, 38, 44, tint(b.color, 0.65));
  // arms: left rests, right waves
  blob(-78, -70, 22, 30, body);
  const wave = Math.sin(t * 8 + id.length) * 0.35 + (hop > 0 ? 0.6 : 0);
  ctx.save();
  ctx.translate(66, -100);
  ctx.rotate(-1.0 - wave);
  blob(0, -26, 22, 34, body);
  ctx.restore();
  drawAnimalFace(ctx, id, 0, -190, 76 + hop * 6);
  ctx.restore();

  // name tag
  ctx.save();
  ctx.font = `800 34px ${FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(b.name).width + 44;
  ctx.fillStyle = 'rgba(70,30,100,0.7)';
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y + 22, w, 48, 24);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(b.name, x, y + 47);
  ctx.restore();
}
