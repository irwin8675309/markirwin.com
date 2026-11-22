import type { GameContext, GameDefinition, GameInstance } from '../types';
import type { GestureEvent, HandState } from '../../types';
import { Particles } from '../shared/particles';
import { drawHandCursors, drawHint, drawVignette } from '../shared/hud';
import { TAU, clamp, dist } from '../../utils/math';
import { CANDY } from '../../utils/palette';
import { ellipse, flower, heart, roundRect, sparkle, star } from '../../utils/draw';
import { chance, pick, rand } from '../../utils/random';

type Brush = 'rainbow' | 'glitter' | 'star' | 'bubble' | 'stamp' | 'eraser';

interface DockItem {
  id: Brush;
  label: string;
  x: number;
  y: number;
  r: number;
  touchedAt: number;
  /** Seconds a hand has been resting on the icon (selecting needs a short hold). */
  hover: number;
}

interface Point {
  x: number;
  y: number;
  t: number;
  /** Midpoint of the previous segment, used to draw smooth curves. */
  mid?: { x: number; y: number };
}

/** Hold time needed to pick a brush, and to clear the picture. */
const SELECT_HOLD = 0.3;
const CLEAR_HOLD = 1.2;

const BRUSH_ORDER: Brush[] = ['rainbow', 'glitter', 'star', 'bubble', 'stamp'];

function brushColor(brush: Brush, hue: number): string {
  switch (brush) {
    case 'rainbow':
      return `hsl(${(hue + 360) % 360}, 95%, 62%)`;
    case 'glitter':
      return `hsl(${(hue + 40) % 360}, 90%, 78%)`;
    case 'star':
      return '#ffd93d';
    case 'bubble':
      return `hsl(${(hue + 180) % 360}, 85%, 70%)`;
    case 'stamp':
      return `hsl(${(hue + 300) % 360}, 85%, 68%)`;
    default:
      return '#ffffff';
  }
}

class FingerPaintingGame implements GameInstance {
  private paint: HTMLCanvasElement;
  private pctx: CanvasRenderingContext2D;
  private particles = new Particles();
  private last = new Map<number, Point>();
  private hue = 0;
  private brush: Brush = 'rainbow';
  private dock: DockItem[] = [];
  private time = 0;
  private greeting = 3.5;
  private clearHold = 0;
  private clearFlash = 0;
  private pinchSeen = new Map<number, boolean>();
  private rainbowPulse = 0;
  private lastColorChange = -10;
  private fadeAcc = 0;
  private stampAcc = new Map<number, number>();

  constructor() {
    this.paint = document.createElement('canvas');
    this.paint.width = 1920;
    this.paint.height = 1080;
    this.pctx = this.paint.getContext('2d')!;
    const items: Array<[Brush, string]> = [
      ['rainbow', 'Rainbow'],
      ['glitter', 'Glitter'],
      ['star', 'Stars'],
      ['bubble', 'Bubbles'],
      ['stamp', 'Stamps'],
      ['eraser', 'Clear'],
    ];
    const n = items.length;
    for (let i = 0; i < n; i++) {
      const angle = Math.PI * (0.15 + (0.7 * i) / (n - 1));
      this.dock.push({
        id: items[i][0],
        label: items[i][1],
        x: 960 + Math.cos(angle) * 700,
        y: 1010 + Math.sin(angle) * 34,
        r: 56,
        touchedAt: -10,
        hover: 0,
      });
    }
  }

  enter(): void {
    this.paint.getContext('2d')!.clearRect(0, 0, 1920, 1080);
  }

  private chooseBrush(b: Brush): void {
    if (this.brush === b) return;
    this.brush = b;
    this.particles.sparkleBurst(960, 980, 10, CANDY, 200);
  }

  onGesture(e: GestureEvent, ctx: GameContext): void {
    if (e.type === 'pinch' && e.handId !== undefined && this.time - this.lastColorChange > 0.8) {
      // At most one colour change per 0.8 s, so a wobbly pinch can't flicker colours.
      this.lastColorChange = this.time;
      this.hue = (this.hue + 47) % 360;
      this.pinchSeen.set(e.handId, true);
      ctx.audio.play('chime', Math.floor(this.hue / 47));
      this.particles.sparkleBurst(e.x ?? 960, e.y ?? 540, 12, CANDY, 260);
    }
    if (e.type === 'wave') {
      const h = ctx.frame.hands.find((x) => x.id === e.handId);
      if (h) {
        for (let i = 0; i < 3; i++) {
          this.particles.sparkleBurst(
            h.palm.x + rand(-80, 80),
            h.palm.y + rand(-80, 80),
            6,
            ['#ffffff', ...CANDY],
            220,
          );
        }
      }
      ctx.audio.play('sparkle');
    }
    if (e.type === 'clap') {
      ctx.audio.play('celebrate');
      this.particles.confetti(e.x ?? 960, e.y ?? 540, 40, 520);
    }
  }

  private stampAt(brush: Brush, x: number, y: number, hue: number, scale = 1): void {
    const p = this.pctx;
    p.save();
    if (brush === 'star') {
      p.translate(x, y);
      p.rotate(rand(0, TAU));
      star(p, 0, 0, 34 * scale, 15 * scale, `hsl(${(hue + 45) % 360}, 100%, 66%)`);
    } else if (brush === 'bubble') {
      const g = p.createRadialGradient(x - 10, y - 10, 2, x, y, 30 * scale);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.6, `hsla(${(hue + 180) % 360}, 95%, 78%, 0.7)`);
      g.addColorStop(1, 'rgba(255,255,255,0.05)');
      p.fillStyle = g;
      p.beginPath();
      p.arc(x, y, 30 * scale, 0, TAU);
      p.fill();
    } else if (brush === 'stamp') {
      if (chance(0.5)) heart(p, x, y, 46 * scale, `hsl(${(hue + 300) % 360}, 88%, 70%)`);
      else flower(p, x, y, 52 * scale, { petalColor: `hsl(${(hue + 300) % 360}, 88%, 72%)`, open: 1 });
    }
    p.restore();
  }

  private hueAt(x: number, y: number): number {
    return this.hue + (x / 1920) * 90 + (y / 1080) * 60;
  }

  /** Draws one short straight piece of the stroke. `share` thins out sparkles per piece. */
  private paintStroke(from: Point, to: Point, width: number, alpha: number, share: number): void {
    const p = this.pctx;
    const hue = this.hueAt(to.x, to.y);
    const color = brushColor(this.brush, hue);
    p.save();
    p.lineCap = 'round';
    p.lineJoin = 'round';
    p.globalAlpha = alpha;

    if (this.brush === 'rainbow') {
      p.strokeStyle = color;
      p.lineWidth = width * 2.1;
      p.globalAlpha = alpha * 0.28;
      p.beginPath();
      p.moveTo(from.x, from.y);
      p.lineTo(to.x, to.y);
      p.stroke();
      p.globalAlpha = alpha;
      p.lineWidth = width;
      p.strokeStyle = color;
      p.beginPath();
      p.moveTo(from.x, from.y);
      p.lineTo(to.x, to.y);
      p.stroke();
      p.globalAlpha = alpha * 0.75;
      p.strokeStyle = '#ffffff';
      p.lineWidth = Math.max(2, width * 0.22);
      p.beginPath();
      p.moveTo(from.x, from.y);
      p.lineTo(to.x, to.y);
      p.stroke();
    } else {
      // A soft wider stroke under the main one gives the glow. (This replaces
      // canvas shadowBlur, which is very slow on a 1080p canvas.)
      p.strokeStyle = color;
      p.globalAlpha = alpha * (this.brush === 'glitter' ? 0.3 : 0.2);
      p.lineWidth = width * (this.brush === 'glitter' ? 2.2 : 1.7);
      p.beginPath();
      p.moveTo(from.x, from.y);
      p.lineTo(to.x, to.y);
      p.stroke();
      p.globalAlpha = alpha;
      p.lineWidth = width;
      p.beginPath();
      p.moveTo(from.x, from.y);
      p.lineTo(to.x, to.y);
      p.stroke();
      if (this.brush === 'glitter') {
        p.strokeStyle = 'rgba(255,255,255,0.9)';
        p.lineWidth = Math.max(2, width * 0.3);
        p.beginPath();
        p.moveTo(from.x, from.y);
        p.lineTo(to.x, to.y);
        p.stroke();
      }
    }
    p.restore();

    if (this.brush === 'glitter' && chance(0.5 * share)) {
      this.particles.spawn({
        x: to.x + rand(-width, width) * 0.6,
        y: to.y + rand(-width, width) * 0.6,
        vx: rand(-40, 40),
        vy: rand(-60, 10),
        gravity: 160,
        life: rand(0.4, 0.9),
        size: rand(3, 7),
        color: chance(0.5) ? '#ffffff' : `hsl(${(hue + 200) % 360}, 100%, 80%)`,
        shape: chance(0.6) ? 'sparkle' : 'star',
        additive: true,
      });
    }
    if (this.brush === 'rainbow' && chance(0.08 * share)) {
      this.particles.spawn({
        x: to.x,
        y: to.y,
        vy: rand(-50, -10),
        life: 0.7,
        size: rand(3, 7),
        color: `hsl(${(hue + 180) % 360}, 100%, 75%)`,
        shape: 'sparkle',
        additive: true,
      });
    }
  }

  /** Stamps (stars, bubbles, hearts/flowers) are placed at even distances along the path. */
  private stampAlong(handId: number, a: Point, b: Point): void {
    if (this.brush !== 'star' && this.brush !== 'bubble' && this.brush !== 'stamp') return;
    const d = dist(a, b);
    if (d < 0.5) return;
    const step = this.brush === 'stamp' ? 130 : 46;
    let acc = (this.stampAcc.get(handId) ?? step) + d; // first stamp lands right away
    let guard = 8;
    while (acc >= step && guard-- > 0) {
      const t = clamp(1 - (acc - step) / d, 0, 1);
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      this.stampAt(this.brush, x, y, this.hueAt(x, y), this.brush === 'stamp' ? 1.2 : 1);
      acc -= step;
    }
    this.stampAcc.set(handId, Math.min(acc, step));
  }

  /**
   * Paints from the previous midpoint to the new midpoint through the previous
   * point (a quadratic curve), so strokes are smooth even when the hand moves
   * fast between tracking frames. Returns the new midpoint.
   */
  private paintCurve(handId: number, prev: Point, cur: Point, width: number, alpha: number): { x: number; y: number } {
    const m0 = prev.mid ?? { x: prev.x, y: prev.y };
    const m1 = { x: (prev.x + cur.x) / 2, y: (prev.y + cur.y) / 2 };
    const n = Math.min(10, Math.max(1, Math.ceil(dist(m0, m1) / 26)));
    let a: Point = { x: m0.x, y: m0.y, t: cur.t };
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const u = 1 - t;
      const q: Point = {
        x: u * u * m0.x + 2 * u * t * prev.x + t * t * m1.x,
        y: u * u * m0.y + 2 * u * t * prev.y + t * t * m1.y,
        t: cur.t,
      };
      this.paintStroke(a, q, width, alpha, 1 / n);
      this.stampAlong(handId, a, q);
      a = q;
    }
    return m1;
  }

  private overDock(p: { x: number; y: number }): boolean {
    return this.dock.some((item) => dist(p, item) < item.r + 40);
  }

  update(ctx: GameContext): void {
    this.time += ctx.dt;
    this.greeting = Math.max(0, this.greeting - ctx.dt);
    this.rainbowPulse = Math.max(0, this.rainbowPulse - ctx.dt);
    this.clearFlash = Math.max(0, this.clearFlash - ctx.dt);

    // Very slow fade so drawings stay for a long while but never saturate.
    // Applied in small steps every 0.15 s (tiny per-frame alphas get rounded away
    // by the 8-bit canvas, so they would never actually fade).
    this.fadeAcc += ctx.dt;
    if (this.fadeAcc >= 0.15) {
      const p = this.pctx;
      p.save();
      p.globalCompositeOperation = 'destination-out';
      p.fillStyle = `rgba(0,0,0,${0.02 + (this.clearFlash > 0 ? 0.25 : 0)})`;
      p.fillRect(0, 0, 1920, 1080);
      p.restore();
      this.fadeAcc = 0;
    }

    // Dock selection: rest a hand on a big icon for a moment. A painting hand
    // sweeping past never changes the brush, and "Clear" needs a longer hold.
    for (const item of this.dock) {
      const over = ctx.frame.hands.some((h) => h.tracked && dist(h.tip, item) < item.r + 34 && h.speed < 1100);
      if (over) item.hover += ctx.dt;
      else item.hover = Math.max(0, item.hover - ctx.dt * 3);
      const need = item.id === 'eraser' ? CLEAR_HOLD : SELECT_HOLD;
      if (item.hover >= need && this.time - item.touchedAt > 0.55) {
        item.touchedAt = this.time;
        item.hover = 0;
        if (item.id === 'eraser') {
          this.clearPaint(ctx);
        } else {
          this.chooseBrush(item.id);
          ctx.audio.play('click');
          this.particles.sparkleBurst(item.x, item.y, 10, CANDY, 180);
        }
      }
    }

    // Both fists held = clear canvas.
    const hands = ctx.frame.hands;
    const bothFists = hands.length >= 2 && hands.every((h) => h.fist);
    if (bothFists) {
      this.clearHold += ctx.dt;
      if (this.clearHold > 1.5) {
        this.clearPaint(ctx);
        this.clearHold = 0;
      }
    } else {
      this.clearHold = Math.max(0, this.clearHold - ctx.dt * 2);
    }

    // Paint with every hand that isn't a fist (and isn't resting on the dock).
    for (const h of hands) {
      if (!h.tracked) continue; // hand briefly lost: wait, don't paint a jump
      if ((h.fist && !h.open) || this.overDock(h.tip)) {
        this.last.delete(h.id);
        this.stampAcc.delete(h.id);
        continue;
      }
      const width = h.open ? 62 : h.pointing ? 26 : h.pinchActive ? 22 : 34;
      const prev = this.last.get(h.id);
      const cur: Point = { x: h.tip.x, y: h.tip.y, t: this.time };
      if (prev && this.time - prev.t < 0.5 && dist(prev, cur) < 600) {
        cur.mid = this.paintCurve(h.id, prev, cur, width, h.open ? 0.42 : 0.8);
        if (dist(prev, cur) > 6 && h.open) {
          this.particles.spawn({
            x: h.tip.x + rand(-40, 40),
            y: h.tip.y + rand(-40, 40),
            vx: rand(-60, 60),
            vy: rand(-90, -20),
            life: rand(0.4, 0.9),
            size: rand(4, 9),
            color: `hsl(${(this.hue + rand(0, 360)) % 360}, 95%, 75%)`,
            shape: chance(0.5) ? 'sparkle' : 'circle',
            additive: true,
          });
        }
      }
      this.last.set(h.id, cur);
    }

    // Rainbow ribbon between two open hands.
    if (hands.length >= 2) {
      const [a, b] = hands;
      if (a.open && b.open) {
        const p2 = this.pctx;
        const mx = (a.palm.x + b.palm.x) / 2;
        const my = (a.palm.y + b.palm.y) / 2 - 60;
        p2.save();
        p2.lineCap = 'round';
        p2.globalAlpha = 0.22;
        p2.lineWidth = 58;
        const grad = p2.createLinearGradient(a.palm.x, 0, b.palm.x, 0);
        ['#ff5d7a', '#ff9f43', '#ffe14d', '#5fdc7a', '#4dc4ff', '#9a7bff'].forEach((c, i, arr) =>
          grad.addColorStop(i / (arr.length - 1), c),
        );
        p2.strokeStyle = grad;
        p2.beginPath();
        p2.moveTo(a.palm.x, a.palm.y);
        p2.quadraticCurveTo(mx, my, b.palm.x, b.palm.y);
        p2.stroke();
        p2.globalAlpha = 0.4;
        p2.lineWidth = 10;
        p2.strokeStyle = 'rgba(255,255,255,0.8)';
        p2.stroke();
        p2.restore();
        if (chance(ctx.dt * 8)) {
          this.particles.spawn({
            x: mx + rand(-40, 40),
            y: my + rand(-30, 30),
            vy: -60,
            life: 0.8,
            size: rand(4, 8),
            color: pick(CANDY),
            shape: 'sparkle',
            additive: true,
          });
        }
      }
    }

    // Clean stale pointers.
    for (const [id, pnt] of this.last) {
      if (this.time - pnt.t > 0.6) {
        this.last.delete(id);
        this.stampAcc.delete(id);
      }
    }

    this.particles.update(ctx.dt);
  }

  private clearPaint(ctx: GameContext): void {
    this.clearFlash = 0.5;
    this.pctx.clearRect(0, 0, 1920, 1080);
    this.last.clear();
    this.stampAcc.clear();
    this.particles.sparkleBurst(960, 540, 60, CANDY, 700);
    ctx.audio.play('sparkle');
    ctx.audio.speak('A fresh canvas!', { force: true });
  }

  draw(ctx: CanvasRenderingContext2D, g: GameContext): void {
    const bg = ctx.createLinearGradient(0, 0, 0, 1080);
    bg.addColorStop(0, '#fff8ec');
    bg.addColorStop(0.6, '#fdf1ff');
    bg.addColorStop(1, '#e8f4ff');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1920, 1080);

    // faint paper dots
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#b9a7d9';
    for (let y = 60; y < 1080; y += 90) {
      for (let x = 60; x < 1920; x += 90) {
        ctx.beginPath();
        ctx.arc(x + ((y / 90) % 2) * 45, y, 3, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();

    ctx.drawImage(this.paint, 0, 0);

    this.drawDock(ctx, g);
    this.particles.draw(ctx);
    drawVignette(ctx, 1920, 1080, 0.16);
    drawHandCursors(ctx, g.frame, g.settings, { scale: 1.0, showRadius: false });

    if (this.clearHold > 0.15) {
      const t = clamp(this.clearHold / 1.5, 0, 1);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(960, 1010, 78, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.strokeStyle = '#ffd93d';
      ctx.beginPath();
      ctx.arc(960, 1010, 78, Math.PI * 0.15, Math.PI * 0.15 + Math.PI * 0.7 * t);
      ctx.stroke();
      ctx.restore();
    }

    if (this.greeting > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.greeting);
      drawHint(ctx, 'Point your finger and make magic!', 0.95);
      ctx.restore();
    }
  }

  private drawDock(ctx: CanvasRenderingContext2D, g: GameContext): void {
    ctx.save();
    ctx.globalAlpha = 0.92;
    for (const item of this.dock) {
      const selected = item.id === this.brush;
      const hovered = g.frame.hands.some((h) => dist(h.tip, item) < item.r + 40);
      const r = item.r * (selected ? 1.12 : hovered ? 1.06 : 1);
      ctx.save();
      ctx.shadowColor = selected ? 'rgba(255,180,60,0.7)' : 'rgba(80,50,120,0.25)';
      ctx.shadowBlur = selected ? 28 : 12;
      ctx.shadowOffsetY = 6;
      const grad = ctx.createLinearGradient(item.x, item.y - r, item.x, item.y + r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, selected ? '#ffe9b0' : '#ece4ff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(item.x, item.y, r, 0, TAU);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = selected ? '#ffb703' : 'rgba(120,90,170,0.35)';
      ctx.lineWidth = selected ? 6 : 3;
      ctx.beginPath();
      ctx.arc(item.x, item.y, r, 0, TAU);
      ctx.stroke();

      this.drawBrushIcon(ctx, item, r);

      // Progress ring while a hand rests on the icon.
      if (item.hover > 0.03) {
        const need = item.id === 'eraser' ? CLEAR_HOLD : SELECT_HOLD;
        ctx.save();
        ctx.strokeStyle = '#ffd93d';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(item.x, item.y, r + 12, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(item.hover / need, 0, 1));
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  private drawBrushIcon(ctx: CanvasRenderingContext2D, item: DockItem, r: number): void {
    const { x, y } = item;
    ctx.save();
    ctx.translate(x, y);
    switch (item.id) {
      case 'rainbow':
        ['#ff5d7a', '#ff9f43', '#ffe14d', '#5fdc7a', '#4dc4ff', '#9a7bff'].forEach((c, i) => {
          ctx.strokeStyle = c;
          ctx.lineWidth = r * 0.11;
          ctx.beginPath();
          ctx.arc(0, r * 0.18, r * (0.68 - i * 0.085), Math.PI * 1.08, Math.PI * 1.92);
          ctx.stroke();
        });
        break;
      case 'glitter':
        sparkle(ctx, 0, 0, r * 0.5, '#b78bff', this.time * 0.5);
        sparkle(ctx, r * 0.3, -r * 0.28, r * 0.24, '#ffd93d', -this.time * 0.7);
        sparkle(ctx, -r * 0.32, r * 0.2, r * 0.18, '#6ff2ff', this.time);
        break;
      case 'star':
        star(ctx, 0, 0, r * 0.5, r * 0.22, '#ffb703', this.time * 0.2);
        break;
      case 'bubble':
        ellipse(ctx, -r * 0.2, r * 0.08, r * 0.3, r * 0.3, 'rgba(120,210,255,0.55)');
        ellipse(ctx, r * 0.26, -r * 0.16, r * 0.2, r * 0.2, 'rgba(160,230,255,0.6)');
        ellipse(ctx, -r * 0.28, r * 0.0, r * 0.08, r * 0.08, 'rgba(255,255,255,0.9)');
        break;
      case 'stamp':
        flower(ctx, 0, 0, r * 0.62, { petalColor: '#ff8ad8', petalColor2: '#b78bff', open: 1 });
        break;
      case 'eraser':
        ctx.rotate(-0.5);
        roundRect(ctx, -r * 0.36, -r * 0.24, r * 0.72, r * 0.48, r * 0.12);
        ctx.fillStyle = '#ffb3c7';
        ctx.fill();
        ctx.strokeStyle = '#e0457b';
        ctx.lineWidth = 3;
        ctx.stroke();
        sparkle(ctx, r * 0.3, -r * 0.3, r * 0.18, '#ffffff', this.time);
        break;
    }
    ctx.restore();
  }
}

export const fingerPaintingGame: GameDefinition = {
  id: 'finger-painting',
  title: 'Magic Finger Painting',
  adultLabel: 'Finger Painting',
  voice: 'Let us make some magic!',
  colors: ['#ffd93d', '#ff8ad8'],
  create: () => new FingerPaintingGame(),
};

export { FingerPaintingGame };