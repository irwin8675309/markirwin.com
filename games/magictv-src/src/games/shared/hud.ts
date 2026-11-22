import type { FrameState, HandState } from '../../types';
import type { Settings } from '../../settings';
import { TAU, clamp01, dist } from '../../utils/math';
import { glow, skeleton, sparkle } from '../../utils/draw';
import { FONT_STACK } from '../../utils/font';
import { drawAnimalFace, getBuddy } from './buddies';
import { SlotAssigner } from '../../tracking/slots';

export const HAND_COLORS = ['#6ff2ff', '#ff8ad8', '#ffe14d', '#9dff8a'];

/** Colour of child number `slot`: her buddy's colour. */
export function handColor(slot: number): string {
  return getBuddy(slot).color;
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

/** Which colour/number each child gets. Stable while she stays in view and remembers where she sat. */
const assigner = new SlotAssigner();

/** Which child number (0, 1, ...) each player in this frame is. */
export function slotsForFrame(frame: FrameState): Map<number, number> {
  const xs = new Map<number, number[]>();
  for (const h of frame.hands) {
    const l = xs.get(h.player) ?? [];
    l.push(h.palm.x);
    xs.set(h.player, l);
  }
  const players = Array.from(xs, ([id, l]) => ({ id, x: l.reduce((a, b) => a + b, 0) / l.length }));
  return assigner.assign(players, performance.now());
}

/** Forget who sat where (used by the "wave hello" start-up). */
export function resetSlots(): void {
  assigner.reset();
}

function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${f((n >> 16) & 255)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

function darken(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(c * (1 - amt));
  return `rgb(${f((n >> 16) & 255)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

export type HandPose = 'open' | 'point' | 'closed';

/**
 * One cute cartoon hand with a smiley face, drawn so that the INDEX FINGERTIP is at
 * (0, 0): that is exactly the spot the games use as the touch point.
 * Units are roughly pixels at scale 1. `t` drives the little animations.
 */
export function drawCuteHand(
  ctx: CanvasRenderingContext2D,
  pose: HandPose,
  color: string,
  t: number,
  seed: number,
  happy: boolean,
): void {
  const fill = lighten(color, 0.28);
  const edge = darken(color, 0.38);
  const wig = pose === 'open' ? 1 : 0;

  const finger = (x0: number, y0: number, x1: number, y1: number, w: number) => {
    ctx.lineCap = 'round';
    ctx.strokeStyle = edge;
    ctx.lineWidth = w + 9;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };
  const fingerFill = (x0: number, y0: number, x1: number, y1: number, w: number) => {
    ctx.lineCap = 'round';
    ctx.strokeStyle = fill;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };

  const w = 27;
  // Fingers: [baseX, tipX, tipY] (tip drawn as the capsule end, so the visible top is tipY - w/2).
  const sway = (i: number) => Math.sin(t * 5 + seed + i * 0.9) * 4 * wig;
  let fingers: Array<[number, number, number, number]> = [];
  if (pose === 'open') {
    fingers = [
      [4, 4 + sway(0), 14, 100], // index (tip at the origin)
      [32, 34 + sway(1), 8, 100],
      [58, 62 + sway(2), 20, 104],
      [80, 87 + sway(3), 44, 112],
    ];
  } else if (pose === 'point') {
    fingers = [[4, 4, 14, 100]];
  }

  // Thumb.
  const thumb: [number, number, number, number] =
    pose === 'closed' ? [-40, -30, 70, 96] : [-30, -62 + (wig ? Math.sin(t * 5 + seed) * 4 : 0), 74, 118];

  const drawBody = (outline: boolean) => {
    const f = outline ? finger : fingerFill;
    for (const [bx, tx, ty, by] of fingers) f(bx, by, tx, ty + 13, w);
    if (pose !== 'closed') f(thumb[0], thumb[3], thumb[1], thumb[2] + 6, w - 2);
    ctx.beginPath();
    if (pose === 'closed') {
      // A round mitten; its top is the touch point.
      ctx.ellipse(10, 72, 62, 70, 0, 0, Math.PI * 2);
    } else {
      ctx.roundRect(-34, 70, 138, 108, 44);
    }
    if (outline) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = 9;
      ctx.stroke();
    } else {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (pose === 'closed') {
      // tucked thumb
      f(-40, 96, -22, 66, 26);
    }
  };
  drawBody(true);
  drawBody(false);
  if (pose === 'closed') {
    // Curled fingers on the mitten so it reads as a little fist.
    ctx.strokeStyle = edge;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    for (const cx of [-10, 14, 38]) {
      ctx.beginPath();
      ctx.moveTo(cx, 22);
      ctx.lineTo(cx, 50);
      ctx.stroke();
    }
  }

  // Cuff.
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = edge;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(pose === 'closed' ? -30 : -20, pose === 'closed' ? 134 : 172, pose === 'closed' ? 80 : 110, 28, 12);
  ctx.fill();
  ctx.stroke();

  // Face on the palm.
  const fx = pose === 'closed' ? 10 : 36;
  const fy = pose === 'closed' ? 84 : 124;
  const blink = Math.sin(t * 1.3 + seed * 2) > 0.985;
  ctx.fillStyle = '#3a2350';
  ctx.strokeStyle = '#3a2350';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (const ex of [-17, 17]) {
    if (happy || blink) {
      ctx.beginPath();
      ctx.arc(fx + ex, fy, 8, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(fx + ex, fy, 6.5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(fx + ex + 2, fy - 3, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2350';
    }
  }
  ctx.fillStyle = 'rgba(255,110,140,0.55)';
  for (const ex of [-30, 30]) {
    ctx.beginPath();
    ctx.ellipse(fx + ex, fy + 14, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(fx, fy + 10, happy ? 12 : 9, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

/**
 * The "magic hand" feedback: every child sees exactly where the TV thinks their
 * hand is. Each hand is a cute cartoon hand with a smiley face and a name tag in
 * the child's own colour. The index fingertip is the touch point.
 */
export function drawHandCursors(
  ctx: CanvasRenderingContext2D,
  frame: FrameState,
  settings: Settings,
  opts: CursorOptions = {},
): void {
  const scale = opts.scale ?? 1;
  const slots = slotsForFrame(frame);

  frame.hands.forEach((h, i) => {
    const slot = slots.get(h.player) ?? 0;
    const color = handColor(slot);
    const t = frame.time;

    if (opts.showSkeleton && settings.showSkeleton && h.landmarks.length === 21) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      skeleton(ctx, h.landmarks, mixAlpha(color, 0.9), 4 * scale);
      ctx.restore();
    }

    const x = h.tip.x;
    const y = h.tip.y;

    // soft aura around the touch point
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y, 70 * scale, mixAlpha(color, 0.35));
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

    const pose: HandPose = h.pinchActive || h.fist ? 'closed' : h.pointing ? 'point' : 'open';
    const k = 0.82 * scale * (1 + Math.sin(t * 6 + i) * (pose === 'closed' ? 0.02 : 0.03));
    const tilt = Math.max(-0.3, Math.min(0.3, h.velocity.x / 5000)) + Math.sin(t * 2.4 + i) * 0.04;
    const flip = h.handedness === 'Left' ? -1 : 1;

    ctx.save();
    if (!h.tracked) ctx.globalAlpha = 0.55;
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.scale(k * flip, k);
    ctx.shadowColor = 'rgba(30,10,60,0.35)';
    ctx.shadowBlur = 0;
    drawCuteHand(ctx, pose, color, t, i * 1.7, h.pinchActive);
    ctx.restore();

    // Name tag under the hand: the child's buddy picture and name, in her colour.
    const buddy = getBuddy(slot);
    ctx.save();
    if (!h.tracked) ctx.globalAlpha = 0.55;
    const ty = y + (pose === 'closed' ? 200 : 232) * k + 14;
    const fs = Math.round(30 * Math.max(0.85, scale));
    ctx.font = `800 ${fs}px ${FONT_STACK}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const textW = ctx.measureText(buddy.name).width;
    const iconR = 25;
    const tw = textW + iconR * 2 + 52;
    const cx = x + 30 * k;
    ctx.fillStyle = darken(color, 0.32);
    ctx.beginPath();
    ctx.roundRect(cx - tw / 2, ty - 30, tw, 60, 30);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
    drawAnimalFace(ctx, buddy.id, cx - tw / 2 + 12 + iconR, ty + 2, iconR * 0.8);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(buddy.name, cx - tw / 2 + 24 + iconR * 2, ty + 2);
    ctx.restore();

    // tiny sparkle when pinching
    if (h.pinchActive) {
      sparkle(ctx, x + Math.cos(t * 8) * 60 * scale, y + Math.sin(t * 8) * 60 * scale, 10 * scale, '#ffffff', t);
    }
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