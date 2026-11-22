import { TAU } from './math';
import { FONT_STACK } from './font';

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function starPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outer: number,
  inner: number,
  points = 5,
  rotation = -Math.PI / 2,
): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (i * Math.PI) / points;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function star(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outer: number,
  inner: number,
  color: string,
  rotation = -Math.PI / 2,
  points = 5,
): void {
  starPath(ctx, x, y, outer, inner, points, rotation);
  ctx.fillStyle = color;
  ctx.fill();
}

export function sparklePath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const k = r * 0.26;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + k * 0.4, y - k * 0.4, x + r, y);
  ctx.quadraticCurveTo(x + k * 0.4, y + k * 0.4, x, y + r);
  ctx.quadraticCurveTo(x - k * 0.4, y + k * 0.4, x - r, y);
  ctx.quadraticCurveTo(x - k * 0.4, y - k * 0.4, x, y - r);
  ctx.closePath();
}

export function sparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  rotation = 0,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  sparklePath(ctx, 0, 0, r);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function heartPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x, y + s * 0.05, x - s * 0.5, y - s * 0.15, x - s * 0.5, y - s * 0.45);
  ctx.bezierCurveTo(x - s * 0.5, y - s * 0.85, x - s * 0.05, y - s * 0.85, x, y - s * 0.5);
  ctx.bezierCurveTo(x + s * 0.05, y - s * 0.85, x + s * 0.5, y - s * 0.85, x + s * 0.5, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.15, x, y + s * 0.05, x, y + s * 0.35);
  ctx.closePath();
}

export function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string): void {
  heartPath(ctx, x, y, s);
  ctx.fillStyle = color;
  ctx.fill();
}

export function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  inner = 0.0,
): void {
  const g = ctx.createRadialGradient(x, y, r * inner, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

export function softShadow(
  ctx: CanvasRenderingContext2D,
  color: string,
  blur: number,
  offsetY: number,
  draw: () => void,
): void {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = offsetY;
  draw();
  ctx.restore();
}

export function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  rotation = 0,
): void {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rotation, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
}

export interface FaceOptions {
  eyeSpacing?: number;
  eyeSize?: number;
  eyeColor?: string;
  lookX?: number;
  lookY?: number;
  blink?: number;
  mouth?: 'smile' | 'grin' | 'o' | 'flat' | 'wavy' | 'kiss';
  mouthColor?: string;
  blush?: boolean;
  cheekColor?: string;
  scale?: number;
}

/** A friendly cartoon face centred at (x, y). */
export function face(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  opts: FaceOptions = {},
): void {
  const eyeSpacing = (opts.eyeSpacing ?? 0.36) * s;
  const eyeSize = (opts.eyeSize ?? 0.16) * s;
  const eyeColor = opts.eyeColor ?? '#2b1a3a';
  const blink = opts.blink ?? 0;
  const lookX = opts.lookX ?? 0;
  const lookY = opts.lookY ?? 0;

  for (const dir of [-1, 1]) {
    const ex = x + dir * eyeSpacing;
    const ey = y - s * 0.12;
    if (blink > 0.6) {
      ctx.strokeStyle = eyeColor;
      ctx.lineWidth = Math.max(2, s * 0.05);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - eyeSize * 0.7, ey);
      ctx.quadraticCurveTo(ex, ey + eyeSize * 0.4, ex + eyeSize * 0.7, ey);
      ctx.stroke();
    } else {
      ellipse(ctx, ex, ey, eyeSize, eyeSize * (1 - blink * 0.7), eyeColor);
      ellipse(ctx, ex + lookX * eyeSize * 0.4, ey + lookY * eyeSize * 0.4, eyeSize * 0.42, eyeSize * 0.42, '#ffffff');
      ellipse(ctx, ex + lookX * eyeSize * 0.55 + eyeSize * 0.15, ey + lookY * eyeSize * 0.5 - eyeSize * 0.2, eyeSize * 0.18, eyeSize * 0.18, '#ffffff');
    }
    if (opts.blush) {
      ellipse(ctx, ex + dir * s * 0.06, y + s * 0.16, s * 0.12, s * 0.075, opts.cheekColor ?? 'rgba(255,120,160,0.55)');
    }
  }

  const my = y + s * 0.28;
  ctx.strokeStyle = opts.mouthColor ?? eyeColor;
  ctx.lineWidth = Math.max(2, s * 0.055);
  ctx.lineCap = 'round';
  ctx.beginPath();
  switch (opts.mouth ?? 'smile') {
    case 'grin':
      ctx.arc(x, my - s * 0.06, s * 0.22, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.fillStyle = '#5a2340';
      ctx.fill();
      ctx.stroke();
      break;
    case 'o':
      ellipse(ctx, x, my + s * 0.02, s * 0.1, s * 0.13, '#5a2340');
      break;
    case 'flat':
      ctx.moveTo(x - s * 0.14, my);
      ctx.lineTo(x + s * 0.14, my);
      ctx.stroke();
      break;
    case 'wavy':
      ctx.moveTo(x - s * 0.2, my);
      ctx.quadraticCurveTo(x - s * 0.1, my - s * 0.08, x, my);
      ctx.quadraticCurveTo(x + s * 0.1, my + s * 0.08, x + s * 0.2, my);
      ctx.stroke();
      break;
    case 'kiss':
      ellipse(ctx, x + s * 0.02, my, s * 0.09, s * 0.06, '#e0457b');
      break;
    default:
      ctx.arc(x, my - s * 0.1, s * 0.22, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
  }
}

export function cloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string,
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const blobs: Array<[number, number, number]> = [
    [-0.55, 0.08, 0.4],
    [-0.2, -0.12, 0.52],
    [0.22, -0.06, 0.44],
    [0.55, 0.1, 0.34],
    [0, 0.16, 0.5],
  ];
  ctx.beginPath();
  for (const [bx, by, br] of blobs) {
    ctx.moveTo(x + bx * s + br * s, y + by * s);
    ctx.arc(x + bx * s, y + by * s, br * s, 0, TAU);
  }
  ctx.fill();
  ctx.restore();
}

export function sun(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.05);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    ctx.save();
    ctx.rotate(a);
    const g = ctx.createLinearGradient(r * 0.8, 0, r * 1.5, 0);
    g.addColorStop(0, 'rgba(255,240,150,0.9)');
    g.addColorStop(1, 'rgba(255,220,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(r * 0.8, -r * 0.06);
    ctx.lineTo(r * 1.5, 0);
    ctx.lineTo(r * 0.8, r * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#fffbe0');
  g.addColorStop(0.65, '#ffe45c');
  g.addColorStop(1, '#ffc93c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function balloon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  t: number,
): void {
  ctx.save();
  // string
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = Math.max(2, r * 0.035);
  ctx.beginPath();
  ctx.moveTo(x, y + r * 1.18);
  ctx.quadraticCurveTo(x + Math.sin(t * 1.4 + x) * r * 0.22, y + r * 1.6, x + Math.sin(t + x) * r * 0.14, y + r * 2.05);
  ctx.stroke();

  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.08, x, y, r * 1.05);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.35, color);
  g.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.88, r, 0, 0, TAU);
  ctx.fill();

  // knot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.12, y + r * 0.97);
  ctx.lineTo(x + r * 0.12, y + r * 0.97);
  ctx.lineTo(x, y + r * 1.16);
  ctx.closePath();
  ctx.fill();

  // highlight
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.32, y - r * 0.42, r * 0.16, r * 0.24, -0.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export interface FlowerOptions {
  petals?: number;
  petalColor?: string;
  petalColor2?: string;
  centerColor?: string;
  open?: number;
  rotation?: number;
}

export function flower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  opts: FlowerOptions = {},
): void {
  const petals = opts.petals ?? 6;
  const open = opts.open ?? 1;
  const rot = opts.rotation ?? 0;
  if (open <= 0.01) {
    ellipse(ctx, x, y, s * 0.16, s * 0.2, opts.petalColor2 ?? '#4caf50');
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * TAU;
    const px = Math.cos(a) * s * 0.42 * open;
    const py = Math.sin(a) * s * 0.42 * open;
    const c = i % 2 === 0 ? opts.petalColor ?? '#ff6b9d' : opts.petalColor2 ?? opts.petalColor ?? '#ff8fb8';
    ellipse(ctx, px, py, s * 0.34 * open, s * 0.24 * open, c, a);
  }
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.3);
  g.addColorStop(0, '#fff3a0');
  g.addColorStop(1, opts.centerColor ?? '#ffb703');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.26 * open, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function leaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  angle: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.6, -s * 0.5, 0, -s * 1.4);
  ctx.quadraticCurveTo(-s * 0.6, -s * 0.5, 0, 0);
  ctx.fill();
  ctx.restore();
}

export function fishShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  dir: number,
  phase: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  const w = size * 0.9;
  const h = size * 0.55;
  const tail = Math.sin(phase) * size * 0.22;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-w * 0.7, 0);
  ctx.quadraticCurveTo(-w * 1.1, -h * 1.2 + tail, -w * 1.35, -h * 0.1 + tail * 1.4);
  ctx.quadraticCurveTo(-w * 1.1, h * 1.2 + tail, -w * 0.7, 0);
  ctx.fill();

  const g = ctx.createLinearGradient(0, -h, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.5, color);
  g.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, w, h, 0, 0, TAU);
  ctx.fill();

  // fin
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(-size * 0.05, -h * 0.85);
  ctx.quadraticCurveTo(size * 0.1, -h * 1.7, size * 0.35, -h * 0.8);
  ctx.fill();

  // eye
  ellipse(ctx, w * 0.55, -h * 0.22, size * 0.11, size * 0.11, '#ffffff');
  ellipse(ctx, w * 0.58, -h * 0.22, size * 0.055, size * 0.055, '#2b1a3a');
  ctx.restore();
}

export function butterflyShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  color2: string,
  wing: number,
  angle: number,
): void {
  const flap = 0.25 + Math.abs(Math.sin(wing)) * 0.75;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.scale(dir * flap, 1);
    const g = ctx.createRadialGradient(size * 0.3, 0, size * 0.05, size * 0.3, 0, size * 0.75);
    g.addColorStop(0, color);
    g.addColorStop(1, color2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(size * 0.38, -size * 0.22, size * 0.45, size * 0.34, -0.5, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.3, size * 0.24, size * 0.32, size * 0.26, 0.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(size * 0.4, -size * 0.28, size * 0.1, size * 0.08, -0.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ellipse(ctx, 0, 0, size * 0.07, size * 0.3, '#4a3358');
  ctx.strokeStyle = '#4a3358';
  ctx.lineWidth = Math.max(1.5, size * 0.03);
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.26);
  ctx.quadraticCurveTo(size * 0.12, -size * 0.48, size * 0.22, -size * 0.46);
  ctx.moveTo(0, -size * 0.26);
  ctx.quadraticCurveTo(-size * 0.12, -size * 0.48, -size * 0.22, -size * 0.46);
  ctx.stroke();
  ctx.restore();
}

export function text(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'center',
  weight = 800,
  outline?: string,
): void {
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT_STACK}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (outline) {
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = outline;
    ctx.lineJoin = 'round';
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.restore();
}

/** Draws a hand skeleton with rounded joints, for the tracking overlay. */
export function skeleton(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  color: string,
  width: number,
): void {
  const connections: Array<[number, number]> = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17],
  ];
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (const [a, b] of connections) {
    ctx.moveTo(points[a].x, points[a].y);
    ctx.lineTo(points[b].x, points[b].y);
  }
  ctx.stroke();
  for (let i = 0; i < points.length; i++) {
    ctx.fillStyle = i === 8 || i === 4 ? '#ffffff' : color;
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, width * (i === 0 ? 0.9 : 0.7), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}