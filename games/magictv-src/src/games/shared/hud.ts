import type { FrameState, HandState } from '../../types';
import type { Settings } from '../../settings';
import { TAU, clamp01, dist } from '../../utils/math';
import { glow, skeleton, sparkle } from '../../utils/draw';
import { FONT_STACK } from '../../utils/font';

export const HAND_COLORS = ['#6ff2ff', '#ff8ad8', '#ffe14d', '#9dff8a'];

export function handColor(index: number): string {
  return HAND_COLORS[index % HAND_COLORS.length];
}

function mixAlpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export interface CursorOptions {
  showSkeleton?: boolean;
  /** Draw the generous touch radius. */
  showRadius?: boolean;
  /** Scale of the whole cursor. */
  scale?: number;
}

/**
 * The "magic hand" feedback: every child sees exactly where the TV thinks
 * their hand is. Large, bright and friendly.
 */
export function drawHandCursors(
  ctx: CanvasRenderingContext2D,
  frame: FrameState,
  settings: Settings,
  opts: CursorOptions = {},
): void {
  const scale = opts.scale ?? 1;
  frame.hands.forEach((h, i) => {
    const color = handColor(i);
    const t = frame.time;
    const pulse = 0.85 + Math.sin(t * 6 + i) * 0.15;

    if (opts.showSkeleton && settings.showSkeleton && h.landmarks.length === 21) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      skeleton(ctx, h.landmarks, mixAlpha(color, 0.9), 4 * scale);
      ctx.restore();
    }

    const x = h.tip.x;
    const y = h.tip.y;
    const r = (h.pinchActive ? 34 : h.open ? 52 : 42) * scale * pulse;

    // soft aura
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y, r * 3.1, mixAlpha(color, 0.28));
    glow(ctx, x, y, r * 1.5, mixAlpha(color, 0.5));
    ctx.restore();

    // touch radius (forgiving)
    if (opts.showRadius !== false) {
      ctx.save();
      ctx.strokeStyle = mixAlpha(color, 0.4);
      ctx.lineWidth = 3 * scale;
      ctx.setLineDash([14 * scale, 12 * scale]);
      ctx.lineDashOffset = -t * 60;
      ctx.beginPath();
      ctx.arc(x, y, h.radius * 0.72 * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    // core
    ctx.save();
    const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, color);
    g.addColorStop(1, mixAlpha(color, 0.9));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3 * scale;
    ctx.stroke();

    // tiny sparkle when pinching
    if (h.pinchActive) {
      sparkle(ctx, x + Math.cos(t * 8) * r * 1.8, y + Math.sin(t * 8) * r * 1.8, 9 * scale, '#ffffff', t);
    }
    ctx.restore();
  });
}

/** Two-hand "together / apart" meter used in a couple of games. */
export function drawHandsMeter(
  ctx: CanvasRenderingContext2D,
  frame: FrameState,
  x: number,
  y: number,
  w: number,
): void {
  if (frame.hands.length < 2) return;
  const v = clamp01(frame.handsApart);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 7, w, 14, 7);
  ctx.fill();
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, '#ff8ad8');
  g.addColorStop(0.5, '#ffe14d');
  g.addColorStop(1, '#6ff2ff');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 7, Math.max(6, w * v), 14, 7);
  ctx.fill();
  ctx.restore();
}

/** Draws a friendly label at the top of the screen. */
export function drawHint(ctx: CanvasRenderingContext2D, label: string, alpha = 0.85): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `700 34px ${FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(label).width + 64;
  ctx.fillStyle = 'rgba(40,20,70,0.28)';
  ctx.beginPath();
  ctx.roundRect(960 - w / 2, 26, w, 58, 29);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillText(label, 960, 56);
  ctx.restore();
}

/** Helper: distance from a hand's forgiving touch area to a circle. */
export function handTouchesCircle(h: HandState, x: number, y: number, r: number): boolean {
  const dTip = Math.hypot(h.tip.x - x, h.tip.y - y);
  if (dTip < r + h.radius * 0.62) return true;
  const dPalm = Math.hypot(h.palm.x - x, h.palm.y - y);
  return dPalm < r + h.radius * 0.95;
}

/**
 * True while a slow hand is closing its thumb and finger together. Games that
 * let children grab things with a pinch (bubbles, balloons) wait instead of
 * popping the object the moment the hand arrives, so the grab can complete.
 * A quick swipe still pops.
 */
export function isPinchReady(h: HandState): boolean {
  return !h.pinchActive && !h.fist && h.pinch > 0.3 && h.speed < 700;
}

export function nearestHand(hands: HandState[], x: number, y: number): HandState | null {
  let best: HandState | null = null;
  let bd = Infinity;
  for (const h of hands) {
    const d = dist(h.palm, { x, y });
    if (d < bd) {
      bd = d;
      best = h;
    }
  }
  return best;
}

/** Darkens the edges for a cosy, TV-friendly vignette. */
export function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.35): void {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(20,5,40,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}