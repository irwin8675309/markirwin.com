import { TAU, clamp01 } from '../../utils/math';
import { ellipse, heartPath, roundRect, sparkle, star } from '../../utils/draw';

export type CharacterKind = 'teddy' | 'monster' | 'dragon' | 'kitten' | 'puppy' | 'unicorn';

export interface CharacterPose {
  x: number;
  y: number;
  scale: number;
  /** 1 = normal, >1 stretched, <1 squashed. */
  squash: number;
  lean: number;
  armL: number;
  armR: number;
  lookX: number;
  lookY: number;
  blink: number;
  mouth: 'smile' | 'grin' | 'o' | 'wavy' | 'kiss' | 'tongue';
  happy: number;
  jumpY: number;
  spin: number;
  dance: number;
  wave: number;
  /** 0..1: a party hat pops onto the head (celebrations and dancing). */
  hat?: number;
}

interface Palette {
  body: string;
  bodyDark: string;
  belly: string;
  accent: string;
  cheek: string;
}

const PALETTES: Record<CharacterKind, Palette> = {
  teddy: { body: '#c68642', bodyDark: '#8c5a2b', belly: '#f8e1b8', accent: '#ff5d7a', cheek: 'rgba(255,120,140,0.55)' },
  monster: { body: '#b78bff', bodyDark: '#7c4dff', belly: '#e2d4ff', accent: '#ffd93d', cheek: 'rgba(255,120,170,0.55)' },
  dragon: { body: '#5fdc7a', bodyDark: '#2f9e63', belly: '#d9ffe6', accent: '#ffe14d', cheek: 'rgba(255,150,120,0.5)' },
  kitten: { body: '#ffb35c', bodyDark: '#f08a2e', belly: '#ffe3c2', accent: '#ff8ad8', cheek: 'rgba(255,120,120,0.5)' },
  puppy: { body: '#c98a5b', bodyDark: '#9a6238', belly: '#f2d7b8', accent: '#8b5e3c', cheek: 'rgba(255,140,140,0.45)' },
  unicorn: { body: '#ffffff', bodyDark: '#ded4ff', belly: '#ffffff', accent: '#ffd93d', cheek: 'rgba(255,150,190,0.45)' },
};

function bodyMetrics(kind: CharacterKind) {
  switch (kind) {
    case 'monster':
      return { cx: 0, cy: -175, rx: 150, ry: 165, head: null as null | { x: number; y: number; r: number } };
    case 'teddy':
      return { cx: 0, cy: -150, rx: 126, ry: 136, head: { x: 0, y: -312, r: 108 } };
    case 'dragon':
      return { cx: 0, cy: -160, rx: 128, ry: 140, head: { x: 0, y: -315, r: 92 } };
    default:
      return { cx: 0, cy: -145, rx: 116, ry: 126, head: { x: 0, y: -305, r: 102 } };
  }
}

function drawEyes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  spacing: number,
  size: number,
  lookX: number,
  lookY: number,
  blink: number,
  happy: number,
): void {
  for (const dir of [-1, 1]) {
    const ex = x + dir * spacing;
    if (blink > 0.55 || happy > 0.85) {
      ctx.strokeStyle = '#3a2350';
      ctx.lineWidth = size * 0.22;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(ex, y + size * 0.1, size * 0.8, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      continue;
    }
    const eh = size * (1 - blink * 0.85);
    ellipse(ctx, ex, y, size * 0.92, eh, '#ffffff');
    ellipse(ctx, ex + lookX * size * 0.32, y + lookY * size * 0.32, size * 0.44, size * 0.44 * (1 - blink * 0.7), '#33204a');
    ellipse(
      ctx,
      ex + lookX * size * 0.32 - size * 0.15,
      y + lookY * size * 0.32 - size * 0.18,
      size * 0.16,
      size * 0.16,
      '#ffffff',
    );
    ellipse(
      ctx,
      ex + lookX * size * 0.4 + size * 0.18,
      y + lookY * size * 0.4 + size * 0.16,
      size * 0.08,
      size * 0.08,
      'rgba(255,255,255,0.9)',
    );
  }
}

function drawMouth(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  kind: CharacterPose['mouth'],
  happy: number,
): void {
  ctx.save();
  ctx.strokeStyle = '#432a55';
  ctx.lineWidth = Math.max(3, s * 0.11);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (kind) {
    case 'grin':
      ctx.beginPath();
      ctx.arc(x, y - s * 0.15, s * 0.75, 0.12 * Math.PI, 0.88 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = '#5c2545';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, x - s * 0.5, y + s * 0.12, s * 0.36, s * 0.2, s * 0.06);
      ctx.fill();
      roundRect(ctx, x + s * 0.14, y + s * 0.12, s * 0.36, s * 0.2, s * 0.06);
      ctx.fill();
      break;
    case 'o':
      ellipse(ctx, x, y + s * 0.05, s * 0.24, s * 0.32, '#5c2545');
      ellipse(ctx, x, y + s * 0.2, s * 0.13, s * 0.1, '#ff7b9c');
      break;
    case 'wavy':
      ctx.beginPath();
      ctx.moveTo(x - s * 0.6, y);
      ctx.quadraticCurveTo(x - s * 0.3, y - s * 0.28, x, y);
      ctx.quadraticCurveTo(x + s * 0.3, y + s * 0.28, x + s * 0.6, y);
      ctx.stroke();
      break;
    case 'kiss':
      ellipse(ctx, x + s * 0.05, y + s * 0.05, s * 0.22, s * 0.16, '#e0457b');
      ellipse(ctx, x + s * 0.05, y + s * 0.02, s * 0.1, s * 0.05, '#ff9ab8');
      break;
    case 'tongue':
      ctx.beginPath();
      ctx.arc(x, y - s * 0.1, s * 0.55, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      ellipse(ctx, x, y + s * 0.38, s * 0.22, s * 0.26, '#ff6f91');
      break;
    default:
      ctx.beginPath();
      ctx.arc(x, y - s * 0.25, s * (0.62 + happy * 0.1), 0.18 * Math.PI, 0.82 * Math.PI);
      ctx.stroke();
  }
  ctx.restore();
}

function drawArm(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  dir: number,
  angle: number,
  length: number,
  color: string,
  dark: string,
  handR: number,
  pad?: string,
): void {
  const ex = sx + Math.sin(angle) * length * dir;
  const ey = sy + Math.cos(angle) * length;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = handR * 1.15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.strokeStyle = dark;
  ctx.lineWidth = handR * 0.3;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(sx, sy + handR * 0.3);
  ctx.lineTo(ex, ey + handR * 0.2);
  ctx.stroke();
  ctx.restore();
  ellipse(ctx, ex, ey, handR, handR, color);
  if (pad) {
    // Teddy paw: a big pad with three little toe beans.
    ellipse(ctx, ex, ey + handR * 0.2, handR * 0.52, handR * 0.42, pad);
    for (const t of [-1, 0, 1]) ellipse(ctx, ex + t * handR * 0.36, ey - handR * 0.36 + Math.abs(t) * handR * 0.1, handR * 0.15, handR * 0.17, pad);
  } else {
    ellipse(ctx, ex - handR * 0.2, ey - handR * 0.25, handR * 0.28, handR * 0.2, 'rgba(255,255,255,0.5)');
  }
}

/** Fuzzy outline: a ring of little bumps around an ellipse (drawn BEHIND the shape). */
function drawFluffRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n: number,
  bump: number,
  c1: string,
  c2: string,
  time: number,
): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const wob = 1 + Math.sin(time * 2.2 + i * 1.7) * 0.035;
    ellipse(
      ctx,
      cx + Math.cos(a) * rx * 0.97 * wob,
      cy + Math.sin(a) * ry * 0.97 * wob,
      bump,
      bump * 0.9,
      i % 2 === 0 ? c1 : c2,
      a,
    );
  }
}

/** Short curly fur strokes scattered inside an ellipse (clipped to it). */
function drawFurTicks(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n: number,
  color: string,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const t = i * 2.39996;
    const rr = Math.sqrt((i + 0.5) / n);
    const x = cx + Math.cos(t) * rx * 0.94 * rr;
    const y = cy + Math.sin(t) * ry * 0.94 * rr;
    const a = Math.cos(t) * 0.6 + 0.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * 6, y + 3, x + Math.cos(a) * 9, y + 10);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  kind: CharacterKind,
  pose: CharacterPose,
  time: number,
): void {
  const pal = PALETTES[kind];
  const m = bodyMetrics(kind);
  const squash = pose.squash;
  const sy = squash;
  const sx = 1 / Math.max(0.6, squash);

  // ground shadow
  ctx.save();
  ctx.globalAlpha = 0.22;
  ellipse(ctx, pose.x, pose.y + 8, 150 * pose.scale * sx, 26 * pose.scale, '#2a1240');
  ctx.restore();

  ctx.save();
  ctx.translate(pose.x, pose.y + pose.jumpY);
  ctx.rotate(pose.lean + pose.spin * 0.12);
  ctx.scale(pose.scale * sx, pose.scale * sy);
  const bob = Math.sin(pose.dance) * 5;

  // tail / wings behind body
  if (kind === 'dragon') {
    ctx.save();
    ctx.translate(m.cx + 120, m.cy - 10);
    ctx.rotate(0.2 + Math.sin(time * 2) * 0.1);
    ctx.fillStyle = pal.bodyDark;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(90, -30, 150, 30);
    ctx.quadraticCurveTo(80, 40, 0, 20);
    ctx.fill();
    ctx.restore();
    // wings
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(m.cx + dir * 95, m.cy - 60);
      ctx.rotate(dir * (0.5 + Math.sin(time * 3) * 0.25));
      ctx.fillStyle = 'rgba(150,255,190,0.85)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(dir * 90, -100, dir * 150, -10);
      ctx.quadraticCurveTo(dir * 90, 30, 0, 20);
      ctx.fill();
      ctx.strokeStyle = pal.bodyDark;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }
  }

  if (kind === 'kitten' || kind === 'puppy' || kind === 'unicorn') {
    // tail
    ctx.save();
    ctx.strokeStyle = kind === 'unicorn' ? '#ff8ad8' : pal.body;
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(m.cx + 90, m.cy + 40);
    ctx.quadraticCurveTo(m.cx + 190, m.cy + 10, m.cx + 165, m.cy - 80 + Math.sin(time * 2.2) * 14);
    ctx.stroke();
    if (kind === 'unicorn') {
      ctx.strokeStyle = '#6ff2ff';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(m.cx + 90, m.cy + 40);
      ctx.quadraticCurveTo(m.cx + 190, m.cy + 10, m.cx + 165, m.cy - 80 + Math.sin(time * 2.2) * 14);
      ctx.stroke();
    }
    ctx.restore();
  }

  // feet
  for (const dir of [-1, 1]) {
    const step = Math.sin(pose.dance + (dir > 0 ? Math.PI : 0)) * 6;
    ellipse(ctx, m.cx + dir * 62, -18 + step, 48, 30, pal.bodyDark);
    ellipse(ctx, m.cx + dir * 62, -22 + step, 44, 26, pal.body);
    if (kind === 'teddy') {
      ellipse(ctx, m.cx + dir * 62, -20 + step, 26, 15, '#f2b68a');
      for (const t of [-1, 0, 1]) ellipse(ctx, m.cx + dir * 62 + t * 14, -36 + step + Math.abs(t) * 3, 6, 7, '#f2b68a');
    }
  }

  // teddy: fuzzy outline behind the body
  if (kind === 'teddy') {
    drawFluffRing(ctx, m.cx, m.cy + bob, m.rx, m.ry, 22, 24, pal.body, pal.bodyDark, time);
  }

  // body
  const bg = ctx.createRadialGradient(m.cx - 40, m.cy - 60, 20, m.cx, m.cy, m.rx * 1.25);
  bg.addColorStop(0, kind === 'teddy' ? '#e9b27c' : '#ffffff');
  bg.addColorStop(0.18, pal.body);
  bg.addColorStop(1, pal.bodyDark);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.ellipse(m.cx, m.cy + bob, m.rx, m.ry, 0, 0, TAU);
  ctx.fill();

  if (kind === 'teddy') drawFurTicks(ctx, m.cx, m.cy + bob, m.rx, m.ry, 70, 'rgba(110,64,24,0.3)');

  // monster fluff
  if (kind === 'monster') {
    ctx.fillStyle = pal.body;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU;
      const rr = 1 + Math.sin(time * 2 + i) * 0.02;
      ellipse(
        ctx,
        m.cx + Math.cos(a) * m.rx * 0.92 * rr,
        m.cy + bob + Math.sin(a) * m.ry * 0.9 * rr,
        34,
        30,
        i % 2 === 0 ? pal.body : pal.bodyDark,
      );
    }
  }

  // belly
  ctx.save();
  ctx.globalAlpha = 0.9;
  ellipse(ctx, m.cx, m.cy + 40 + bob, m.rx * 0.58, m.ry * 0.55, pal.belly);
  ctx.restore();
  if (kind === 'teddy') {
    // a little stitched heart on the tummy
    heartPath(ctx, m.cx, m.cy + 52 + bob, 62);
    ctx.fillStyle = '#ff8aa5';
    ctx.fill();
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = '#fff4f7';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // head (animals)
  if (m.head) {
    const h = m.head;
    // ears
    if (kind === 'teddy') {
      drawFluffRing(ctx, h.x, h.y, h.r, h.r * 0.96, 24, 22, pal.body, pal.bodyDark, time);
      for (const dir of [-1, 1]) {
        const wig = Math.sin(time * 3 + dir) * 0.06 + Math.sin(pose.dance * 2 + dir) * 0.05;
        ctx.save();
        ctx.translate(h.x + dir * 82, h.y - 82);
        ctx.rotate(dir * wig);
        ellipse(ctx, 0, 0, 46, 44, pal.bodyDark);
        ellipse(ctx, 0, 1, 42, 40, pal.body);
        ellipse(ctx, 0, 4, 26, 24, '#f2b68a');
        ctx.restore();
      }
    } else if (kind === 'kitten') {
      for (const dir of [-1, 1]) {
        ctx.fillStyle = pal.body;
        ctx.beginPath();
        ctx.moveTo(h.x + dir * 78, h.y - 60);
        ctx.lineTo(h.x + dir * 112, h.y - 150);
        ctx.lineTo(h.x + dir * 30, h.y - 92);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff9ab8';
        ctx.beginPath();
        ctx.moveTo(h.x + dir * 72, h.y - 70);
        ctx.lineTo(h.x + dir * 96, h.y - 126);
        ctx.lineTo(h.x + dir * 46, h.y - 88);
        ctx.closePath();
        ctx.fill();
      }
    } else if (kind === 'puppy') {
      for (const dir of [-1, 1]) {
        ctx.save();
        ctx.translate(h.x + dir * 88, h.y - 40);
        ctx.rotate(dir * (0.35 + Math.sin(time * 1.5) * 0.06));
        ellipse(ctx, 0, 60, 40, 92, pal.bodyDark);
        ellipse(ctx, 0, 60, 34, 84, pal.body);
        ctx.restore();
      }
    } else if (kind === 'dragon') {
      for (const dir of [-1, 1]) {
        ctx.fillStyle = pal.accent;
        ctx.beginPath();
        ctx.moveTo(h.x + dir * 58, h.y - 70);
        ctx.lineTo(h.x + dir * 84, h.y - 148);
        ctx.lineTo(h.x + dir * 30, h.y - 88);
        ctx.closePath();
        ctx.fill();
      }
      // snout
      ellipse(ctx, h.x, h.y + 42, 58, 40, pal.belly);
      ellipse(ctx, h.x - 20, h.y + 32, 7, 5, '#2f6b4a');
      ellipse(ctx, h.x + 20, h.y + 32, 7, 5, '#2f6b4a');
    } else if (kind === 'unicorn') {
      // horn
      ctx.save();
      ctx.translate(h.x, h.y - 96);
      ctx.fillStyle = '#ffe14d';
      ctx.beginPath();
      ctx.moveTo(-18, 10);
      ctx.lineTo(0, -92);
      ctx.lineTo(18, 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e0a800';
      ctx.lineWidth = 3;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-14 + i * 3, 2 - i * 18);
        ctx.lineTo(14 - i * 3, 6 - i * 18);
        ctx.stroke();
      }
      ctx.restore();
      // mane
      const maneColors = ['#ff5d7a', '#ff9f43', '#ffe14d', '#5fdc7a', '#4dc4ff', '#9a7bff'];
      for (let i = 0; i < 7; i++) {
        const a = -0.2 + i * 0.24;
        ellipse(
          ctx,
          h.x + Math.cos(a) * 105,
          h.y - 30 + Math.sin(a) * 90,
          30,
          26,
          maneColors[i % maneColors.length],
        );
      }
      // ears
      for (const dir of [-1, 1]) {
        ctx.fillStyle = pal.body;
        ctx.beginPath();
        ctx.moveTo(h.x + dir * 70, h.y - 62);
        ctx.lineTo(h.x + dir * 92, h.y - 118);
        ctx.lineTo(h.x + dir * 40, h.y - 80);
        ctx.closePath();
        ctx.fill();
      }
    }

    const hg = ctx.createRadialGradient(h.x - 30, h.y - 40, 10, h.x, h.y, h.r * 1.2);
    hg.addColorStop(0, kind === 'teddy' ? '#e9b27c' : '#ffffff');
    hg.addColorStop(0.25, pal.body);
    hg.addColorStop(1, pal.bodyDark);
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.r, 0, TAU);
    ctx.fill();

    if (kind === 'teddy') {
      drawFurTicks(ctx, h.x, h.y, h.r, h.r * 0.96, 60, 'rgba(110,64,24,0.3)');
      // forehead curl
      ctx.strokeStyle = pal.bodyDark;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(h.x - 6, h.y - 96);
      ctx.quadraticCurveTo(h.x - 26, h.y - 80, h.x - 8, h.y - 70);
      ctx.moveTo(h.x + 10, h.y - 98);
      ctx.quadraticCurveTo(h.x + 30, h.y - 84, h.x + 14, h.y - 72);
      ctx.stroke();
      // muzzle, nose
      ellipse(ctx, h.x, h.y + 36, 56, 44, pal.belly);
      ellipse(ctx, h.x, h.y + 36, 56, 44, 'rgba(255,255,255,0.0)');
      ellipse(ctx, h.x, h.y + 20, 22, 15, '#4a2a1c');
      ellipse(ctx, h.x - 7, h.y + 15, 7, 4, 'rgba(255,255,255,0.55)');
    }
    if (kind === 'puppy') {
      ellipse(ctx, h.x, h.y + 46, 62, 44, pal.belly);
      ellipse(ctx, h.x, h.y + 30, 18, 13, '#4a2c35');
      ctx.strokeStyle = '#4a2c35';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(h.x, h.y + 34, 24, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }
    if (kind === 'kitten') {
      ctx.strokeStyle = 'rgba(90,60,70,0.65)';
      ctx.lineWidth = 3;
      for (const dir of [-1, 1]) {
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(h.x + dir * 42, h.y + 30 + i * 10);
          ctx.lineTo(h.x + dir * 108, h.y + 16 + i * 22);
          ctx.stroke();
        }
      }
      ellipse(ctx, h.x, h.y + 34, 13, 9, '#e0457b');
    }

    if (kind === 'teddy') {
      drawEyes(ctx, h.x, h.y - 16, 46, 30, pose.lookX, pose.lookY, pose.blink, pose.happy);
      drawMouth(ctx, h.x, h.y + 56, 30, pose.mouth, pose.happy);
    } else {
      drawEyes(ctx, h.x, h.y - 12, 44, 34, pose.lookX, pose.lookY, pose.blink, pose.happy);
      drawMouth(ctx, h.x, h.y + 58, 34, pose.mouth, pose.happy);
    }
    if (pose.happy > 0.5) {
      ctx.save();
      ctx.globalAlpha = pose.happy * 0.5;
      ellipse(ctx, h.x - 72, h.y + 30, 20, 12, pal.cheek);
      ellipse(ctx, h.x + 72, h.y + 30, 20, 12, pal.cheek);
      ctx.restore();
    }
  } else {
    // monster face on the body
    drawEyes(ctx, m.cx, m.cy - 55 + bob, 58, 42, pose.lookX, pose.lookY, pose.blink, pose.happy);
    drawMouth(ctx, m.cx, m.cy + 42 + bob, 44, pose.mouth, pose.happy);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ellipse(ctx, m.cx - 96, m.cy + 6 + bob, 22, 13, pal.cheek);
    ellipse(ctx, m.cx + 96, m.cy + 6 + bob, 22, 13, pal.cheek);
    ctx.restore();

    // antennae
    for (const dir of [-1, 1]) {
      const sway = Math.sin(time * 2 + dir) * 0.15;
      ctx.save();
      ctx.translate(m.cx + dir * 52, m.cy - m.ry + 10);
      ctx.rotate(dir * (0.25 + sway));
      ctx.strokeStyle = pal.bodyDark;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(dir * 12, -60, dir * 22, -95);
      ctx.stroke();
      ellipse(ctx, dir * 22, -100, 18, 18, pal.accent);
      ellipse(ctx, dir * 18, -105, 6, 6, 'rgba(255,255,255,0.8)');
      ctx.restore();
    }
  }

  // arms
  const shoulderY = m.head ? m.cy - 10 : m.cy - 30;
  const shoulderX = m.rx * 0.82;
  const armLen = m.head ? 105 : 115;
  const handR = m.head ? 30 : 34;
  const pad = kind === 'teddy' ? '#f2b68a' : undefined;
  drawArm(ctx, -shoulderX, shoulderY + bob, -1, pose.armL, armLen, pal.body, pal.bodyDark, handR, pad);
  drawArm(ctx, shoulderX, shoulderY + bob, 1, pose.armR, armLen, pal.body, pal.bodyDark, handR, pad);

  if (kind === 'teddy' && m.head) {
    // bow tie at the neck
    const bx = 0;
    const by = m.head.y + m.head.r - 12;
    for (const dir of [-1, 1]) {
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + dir * 54, by - 30);
      ctx.lineTo(bx + dir * 54, by + 30);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c93a5a';
      ctx.lineWidth = 4;
      ctx.stroke();
      ellipse(ctx, bx + dir * 34, by - 8, 5, 5, '#fff4f7');
      ellipse(ctx, bx + dir * 34, by + 10, 5, 5, '#fff4f7');
    }
    ellipse(ctx, bx, by, 15, 17, '#ff8aa5');
    ellipse(ctx, bx, by, 15, 17, 'rgba(0,0,0,0)');

    // party hat for celebrations and dances
    const hat = pose.hat ?? 0;
    if (hat > 0.02) {
      const hx = m.head.x + 24;
      const hy = m.head.y - m.head.r + 10;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(0.22);
      ctx.scale(hat, hat);
      ctx.fillStyle = '#4dc4ff';
      ctx.beginPath();
      ctx.moveTo(-42, 8);
      ctx.lineTo(0, -118);
      ctx.lineTo(42, 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 9;
      for (const t of [0.3, 0.62]) {
        ctx.beginPath();
        ctx.moveTo(-42 * (1 - t) - 2, 8 - 126 * t);
        ctx.lineTo(42 * (1 - t) + 2, 8 - 126 * t + 8);
        ctx.stroke();
      }
      ellipse(ctx, 0, -122, 16, 16, '#ffd93d');
      ctx.restore();
    }
  }

  // dragon back spikes
  if (kind === 'dragon') {
    for (let i = 0; i < 4; i++) {
      const y = m.cy - 70 + i * 42;
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.moveTo(-m.rx * 0.9, y);
      ctx.lineTo(-m.rx * 1.18, y + 16);
      ctx.lineTo(-m.rx * 0.9, y + 30);
      ctx.fill();
    }
  }

  // happy sparkles
  if (pose.happy > 0.75) {
    ctx.save();
    ctx.globalAlpha = (pose.happy - 0.75) * 4;
    sparkle(ctx, -m.rx - 40, m.cy - 100, 18, '#fff3a0', time * 2);
    sparkle(ctx, m.rx + 50, m.cy - 40, 13, '#ffffff', -time * 2);
    ctx.restore();
  }

  ctx.restore();

  // little floating hearts from kisses
  if (pose.mouth === 'kiss' && pose.wave > 0.2) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    star(ctx, pose.x + 40, pose.y - 420 + pose.jumpY, 10, 4, '#ff8ad8', time);
    ctx.restore();
  }
}

export const CHARACTER_KINDS: CharacterKind[] = ['teddy'];

export const CHARACTER_NAMES: Record<CharacterKind, string> = {
  teddy: 'Teddy the Fuzzy Bear',
  monster: 'Momo the Fluffy Monster',
  dragon: 'Dizzy the Friendly Dragon',
  kitten: 'Mittens the Kitten',
  puppy: 'Biscuit the Puppy',
  unicorn: 'Twinkle the Unicorn',
};

export function clampPose(p: CharacterPose): CharacterPose {
  return {
    ...p,
    squash: Math.max(0.7, Math.min(1.35, p.squash)),
    lookX: Math.max(-1, Math.min(1, p.lookX)),
    lookY: Math.max(-1, Math.min(1, p.lookY)),
    blink: clamp01(p.blink),
  };
}