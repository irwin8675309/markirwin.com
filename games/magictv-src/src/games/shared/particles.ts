import { TAU, clamp01, lerp } from '../../utils/math';
import { sparkle, star, heart, ellipse } from '../../utils/draw';
import { CANDY } from '../../utils/palette';
import { pick, rand, chance } from '../../utils/random';
import { FONT_STACK } from '../../utils/font';

export type ParticleShape =
  | 'circle'
  | 'star'
  | 'sparkle'
  | 'petal'
  | 'confetti'
  | 'ring'
  | 'heart'
  | 'bubble'
  | 'text';

export interface ParticleOptions {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  ax?: number;
  ay?: number;
  gravity?: number;
  drag?: number;
  life?: number;
  size?: number;
  sizeEnd?: number;
  color?: string;
  shape?: ParticleShape;
  rotation?: number;
  spin?: number;
  additive?: boolean;
  fade?: 'out' | 'inout' | 'none';
  wobble?: number;
  wobbleSpeed?: number;
  text?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  gravity: number;
  drag: number;
  life: number;
  maxLife: number;
  size: number;
  sizeEnd: number;
  color: string;
  shape: ParticleShape;
  rotation: number;
  spin: number;
  additive: boolean;
  fade: 'out' | 'inout' | 'none';
  wobble: number;
  wobbleSpeed: number;
  phase: number;
  text?: string;
}

const MAX_PARTICLES = 1000;

export class Particles {
  private list: Particle[] = [];

  get count(): number {
    return this.list.length;
  }

  clear(): void {
    this.list.length = 0;
  }

  spawn(o: ParticleOptions): void {
    if (this.list.length >= MAX_PARTICLES) this.list.shift();
    const life = o.life ?? rand(0.5, 1.1);
    this.list.push({
      x: o.x,
      y: o.y,
      vx: o.vx ?? 0,
      vy: o.vy ?? 0,
      ax: o.ax ?? 0,
      ay: o.ay ?? 0,
      gravity: o.gravity ?? 0,
      drag: o.drag ?? 0.9,
      life,
      maxLife: life,
      size: o.size ?? 8,
      sizeEnd: o.sizeEnd ?? o.size ?? 0,
      color: o.color ?? '#ffffff',
      shape: o.shape ?? 'circle',
      rotation: o.rotation ?? 0,
      spin: o.spin ?? 0,
      additive: o.additive ?? false,
      fade: o.fade ?? 'out',
      wobble: o.wobble ?? 0,
      wobbleSpeed: o.wobbleSpeed ?? 4,
      phase: Math.random() * TAU,
      text: o.text,
    });
  }

  update(dt: number): void {
    const list = this.list;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= dt;
      if (p.life <= 0) {
        list.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.vx += p.ax * dt;
      p.vy += p.ay * dt;
      const d = Math.pow(p.drag, dt * 60);
      p.vx *= d;
      p.vy *= d;
      if (p.wobble) {
        p.phase += p.wobbleSpeed * dt;
        p.x += Math.cos(p.phase) * p.wobble * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const list = this.list;
    for (const p of list) {
      const t = 1 - p.life / p.maxLife;
      let alpha = 1;
      if (p.fade === 'out') alpha = 1 - t * t;
      else if (p.fade === 'inout') alpha = Math.sin(Math.PI * clamp01(t));
      if (alpha <= 0.01) continue;
      const size = lerp(p.size, p.sizeEnd, t);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (p.additive) ctx.globalCompositeOperation = 'lighter';
      switch (p.shape) {
        case 'star':
          star(ctx, p.x, p.y, size, size * 0.45, p.color, p.rotation, 5);
          break;
        case 'sparkle':
          sparkle(ctx, p.x, p.y, size, p.color, p.rotation);
          break;
        case 'heart':
          heart(ctx, p.x, p.y, size, p.color);
          break;
        case 'petal':
          ellipse(ctx, p.x, p.y, size, size * 0.55, p.color, p.rotation);
          break;
        case 'confetti':
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-size / 2, -size / 4, size, size / 2);
          break;
        case 'ring': {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1.5, size * 0.14);
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, size), 0, TAU);
          ctx.stroke();
          break;
        }
        case 'bubble': {
          const g = ctx.createRadialGradient(p.x - size * 0.3, p.y - size * 0.3, size * 0.1, p.x, p.y, size);
          g.addColorStop(0, 'rgba(255,255,255,0.9)');
          g.addColorStop(0.5, p.color);
          g.addColorStop(1, 'rgba(255,255,255,0.05)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, TAU);
          ctx.fill();
          break;
        }
        case 'text':
          if (p.text) {
            ctx.font = `900 ${size}px ${FONT_STACK}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = size * 0.18;
            ctx.strokeStyle = 'rgba(60,20,90,0.55)';
            ctx.lineJoin = 'round';
            ctx.strokeText(p.text, p.x, p.y);
            ctx.fillStyle = p.color;
            ctx.fillText(p.text, p.x, p.y);
          }
          break;
        default: {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.5, size), 0, TAU);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  /** Colorful pop burst. */
  popBurst(x: number, y: number, color: string, size = 1): void {
    const n = Math.round(rand(10, 16) * size);
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const sp = rand(160, 520) * size;
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        drag: 0.86,
        life: rand(0.35, 0.8),
        size: rand(5, 13) * size,
        sizeEnd: rand(0, 4),
        color: chance(0.35) ? '#ffffff' : color,
        shape: chance(0.3) ? 'sparkle' : 'circle',
        additive: true,
        spin: rand(-8, 8),
      });
    }
    this.spawn({ x, y, size: 8, sizeEnd: 90 * size, life: 0.32, shape: 'ring', color: 'rgba(255,255,255,0.9)' });
  }

  sparkleBurst(x: number, y: number, count = 14, colors = CANDY, spread = 300): void {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const sp = rand(spread * 0.3, spread);
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        gravity: 240,
        drag: 0.92,
        life: rand(0.5, 1.1),
        size: rand(6, 16),
        sizeEnd: 0,
        color: pick(colors),
        shape: chance(0.5) ? 'sparkle' : 'star',
        additive: true,
        spin: rand(-6, 6),
        rotation: rand(0, TAU),
      });
    }
  }

  confetti(x: number, y: number, count = 40, spread = 500): void {
    for (let i = 0; i < count; i++) {
      const a = rand(-Math.PI * 0.95, -Math.PI * 0.05);
      const sp = rand(spread * 0.4, spread);
      this.spawn({
        x: x + rand(-40, 40),
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        gravity: 900,
        drag: 0.985,
        life: rand(1.4, 2.6),
        size: rand(10, 22),
        sizeEnd: rand(8, 18),
        color: pick(CANDY),
        shape: chance(0.25) ? 'star' : 'confetti',
        spin: rand(-10, 10),
        rotation: rand(0, TAU),
        fade: 'out',
      });
    }
  }

  petalShower(count = 70): void {
    for (let i = 0; i < count; i++) {
      this.spawn({
        x: rand(0, 1920),
        y: rand(-300, -20),
        vx: rand(-40, 40),
        vy: rand(80, 190),
        gravity: 30,
        drag: 0.995,
        life: rand(4, 7),
        size: rand(9, 20),
        sizeEnd: rand(8, 16),
        color: pick(['#ff6b9d', '#ffd93d', '#ff8fb8', '#b78bff', '#ff9f43', '#ffffff']),
        shape: 'petal',
        wobble: rand(30, 90),
        wobbleSpeed: rand(1, 3),
        spin: rand(-3, 3),
        rotation: rand(0, TAU),
      });
    }
  }

  fireworks(x: number, y: number, color = '#ffd93d'): void {
    for (let ring = 0; ring < 2; ring++) {
      const n = 26;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + ring * 0.2;
        const sp = (ring === 0 ? 380 : 220) * rand(0.85, 1.15);
        this.spawn({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          gravity: 260,
          drag: 0.9,
          life: rand(0.8, 1.5),
          size: rand(5, 11),
          sizeEnd: 0,
          color: chance(0.5) ? color : pick(CANDY),
          shape: chance(0.5) ? 'sparkle' : 'circle',
          additive: true,
        });
      }
    }
    this.spawn({ x, y, size: 20, sizeEnd: 260, life: 0.5, shape: 'ring', color: 'rgba(255,255,255,0.8)' });
  }

  hearts(x: number, y: number, count = 5): void {
    for (let i = 0; i < count; i++) {
      this.spawn({
        x: x + rand(-30, 30),
        y: y + rand(-10, 10),
        vx: rand(-60, 60),
        vy: rand(-220, -110),
        gravity: -20,
        drag: 0.96,
        life: rand(1.2, 2),
        size: rand(14, 24),
        sizeEnd: rand(20, 30),
        color: pick(['#ff5d7a', '#ff8ad8', '#ffb3c7']),
        shape: 'heart',
        spin: rand(-2, 2),
      });
    }
  }

  text(str: string, x: number, y: number, color = '#ffffff', size = 64): void {
    this.spawn({
      x,
      y,
      vy: -120,
      drag: 0.94,
      life: 1.4,
      size,
      sizeEnd: size,
      color,
      shape: 'text',
      text: str,
      fade: 'inout',
    });
  }
}