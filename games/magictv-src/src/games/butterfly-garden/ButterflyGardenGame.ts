import type { GameContext, GameDefinition, GameInstance } from '../types';
import type { GestureEvent, HandState } from '../../types';
import { Particles } from '../shared/particles';
import { drawHandCursors, drawHint, drawVignette, handTouchesCircle } from '../shared/hud';
import { TAU, clamp, clamp01, dist, easeOutCubic } from '../../utils/math';
import { GARDEN_COLORS } from '../../utils/palette';
import {
  butterflyShape,
  cloud,
  ellipse,
  flower,
  leaf,
  sparkle,
  star,
  sun,
  text,
} from '../../utils/draw';
import { chance, pick, rand } from '../../utils/random';

interface Flower {
  id: number;
  x: number;
  baseY: number;
  stem: number;
  size: number;
  growth: number;
  bloom: number;
  celebrated: boolean;
  petals: number;
  color: string;
  color2: string;
  phase: number;
  sway: number;
  lean: number;
}

interface Butterfly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  color2: string;
  phase: number;
  wander: number;
  tx: number;
  ty: number;
  angle: number;
  golden: boolean;
  life: number;
}

interface Blade {
  x: number;
  h: number;
  phase: number;
  color: string;
  lean: number;
}

class ButterflyGardenGame implements GameInstance {
  private time = 0;
  private flowers: Flower[] = [];
  private butterflies: Butterfly[] = [];
  private blades: Blade[] = [];
  private clouds: Array<{ x: number; y: number; s: number; speed: number; alpha: number }> = [];
  private particles = new Particles();
  private nextFlower = 0;
  private nextGolden = 26;
  private golden: Butterfly | null = null;
  private rainbow = 0;
  private wind = 0;
  private greeting = 3.4;
  private bloomedCelebrated = false;
  private ladybug = { x: 500, y: 990, vx: 12, dir: 1, fly: 0 };

  enter(): void {
    for (let i = 0; i < 140; i++) {
      this.blades.push({
        x: rand(-20, 1940),
        h: rand(30, 90),
        phase: rand(0, TAU),
        color: pick(['#4fae4f', '#63c463', '#3f9c45', '#7ad07a']),
        lean: rand(-0.25, 0.25),
      });
    }
    for (let i = 0; i < 6; i++) {
      this.clouds.push({ x: rand(0, 1920), y: rand(80, 360), s: rand(90, 180), speed: rand(4, 12), alpha: rand(0.5, 0.9) });
    }
    for (let i = 0; i < 6; i++) this.addFlower(rand(120, 1800), rand(0.05, 0.3));
    for (let i = 0; i < 4; i++) this.spawnButterfly();
  }

  private addFlower(x: number, growth = 0): void {
    const color = pick(GARDEN_COLORS);
    const color2 = pick(GARDEN_COLORS.filter((c) => c !== color));
    this.flowers.push({
      id: Math.random(),
      x,
      baseY: rand(960, 1060),
      stem: rand(70, 190),
      size: rand(56, 92),
      growth,
      bloom: growth > 0.85 ? 1 : 0,
      celebrated: false,
      petals: Math.round(rand(5, 9)),
      color,
      color2,
      phase: rand(0, TAU),
      sway: rand(0.6, 1.3),
      lean: rand(-0.15, 0.15),
    });
  }

  private spawnButterfly(golden = false): Butterfly {
    const b: Butterfly = {
      x: golden ? -80 : rand(100, 1820),
      y: rand(200, 640),
      vx: rand(-40, 40),
      vy: rand(-20, 20),
      size: golden ? 54 : rand(30, 46),
      color: golden ? '#ffe14d' : pick(['#ff8ad8', '#8b6bff', '#ff9f43', '#4dc4ff', '#5fdc7a']),
      color2: golden ? '#fff7b0' : pick(['#ffd1f0', '#d9c6ff', '#ffe0b0', '#c8f0ff', '#d9ffe6']),
      phase: rand(0, TAU),
      wander: rand(1, 3),
      tx: rand(100, 1820),
      ty: rand(160, 700),
      angle: rand(-0.4, 0.4),
      golden,
      life: golden ? 24 : 9999,
    };
    this.butterflies.push(b);
    return b;
  }

  onGesture(e: GestureEvent, ctx: GameContext): void {
    if (e.type === 'wave') {
      this.wind = 1;
      ctx.audio.play('whoosh');
      const x = e.x ?? 960;
      const y = e.y ?? 540;
      for (const f of this.flowers) {
        const headY = f.baseY - f.stem;
        if (dist({ x, y }, { x: f.x, y: headY }) < 620) {
          f.growth = clamp01(f.growth + 0.26);
        }
      }
      this.particles.sparkleBurst(x, y, 16, ['#ffffff', '#ffe14d', '#ff8ad8'], 320);
    } else if (e.type === 'clap') {
      ctx.audio.play('celebrate');
      this.particles.petalShower(60);
      for (const f of this.flowers) f.growth = clamp01(f.growth + 0.18);
      this.particles.confetti(e.x ?? 960, e.y ?? 400, 20, 460);
    } else if (e.type === 'handsApart') {
      this.wind = 0.7;
    }
  }

  update(ctx: GameContext): void {
    this.time += ctx.dt;
    this.greeting = Math.max(0, this.greeting - ctx.dt);
    this.wind = Math.max(0, this.wind - ctx.dt * 0.8);

    for (const c of this.clouds) {
      c.x += c.speed * ctx.dt;
      if (c.x > 2100) c.x = -200;
    }

    // Grow flowers near moving hands.
    for (const f of this.flowers) {
      const headX = f.x + Math.sin(this.time * f.sway + f.phase) * 8;
      const headY = f.baseY - f.stem * (0.55 + 0.45 * f.growth);
      let touched = false;
      for (const h of ctx.frame.hands) {
        const d = Math.min(dist(h.tip, { x: headX, y: headY }), dist(h.palm, { x: headX, y: headY }));
        if (d < 250 + h.radius) {
          touched = true;
          const speedFactor = clamp(h.speed / 900, 0, 1.6);
          f.growth = clamp01(f.growth + ctx.dt * (0.22 + speedFactor * 0.7));
          if (d < 90 && f.growth > 0.35 && f.bloom < 0.2) {
            f.growth = 1;
            f.bloom = 0.15;
          }
        }
      }
      if (touched && chance(ctx.dt * 3)) {
        this.particles.spawn({
          x: headX + rand(-20, 20),
          y: headY + rand(-20, 20),
          vy: rand(-80, -20),
          life: 0.9,
          size: rand(4, 8),
          color: chance(0.5) ? f.color : '#fff3a0',
          shape: chance(0.5) ? 'sparkle' : 'petal',
          additive: true,
        });
      }
      if (f.growth > 0.86 && f.bloom < 1) {
        f.bloom = Math.min(1, f.bloom + ctx.dt * 1.8);
        if (f.bloom >= 1 && !f.celebrated) {
          f.celebrated = true;
          ctx.audio.play('bloom');
          this.particles.sparkleBurst(headX, headY, 18, [f.color, f.color2, '#ffffff'], 260);
          this.particles.spawn({
            x: headX,
            y: headY - 30,
            vy: -60,
            life: 1.1,
            size: 44,
            sizeEnd: 54,
            color: '#ffffff',
            shape: 'text',
            text: pick(['Bloom!', 'Grow!', 'Flower!']),
          });
        }
      }
    }

    // New buds appear as the garden grows.
    this.nextFlower -= ctx.dt;
    if (this.nextFlower <= 0) {
      this.nextFlower = rand(4, 7);
      if (this.flowers.length < 28) this.addFlower(rand(100, 1820), rand(0, 0.15));
    }

    const bloomed = this.flowers.filter((f) => f.bloom >= 1).length;
    const ratio = this.flowers.length ? bloomed / this.flowers.length : 0;
    if (ratio > 0.78 && !this.bloomedCelebrated) {
      this.bloomedCelebrated = true;
      ctx.audio.speak('What a beautiful garden!', { force: true });
      ctx.audio.play('celebrate');
      this.particles.confetti(960, 200, 50, 620);
    }
    this.rainbow = clamp01(this.rainbow + (ratio > 0.78 ? ctx.dt * 0.4 : -ctx.dt * 0.3));

    // Butterflies.
    const targetCount = Math.min(9, 4 + Math.floor(bloomed / 3));
    if (this.butterflies.filter((b) => !b.golden).length < targetCount && chance(ctx.dt * 0.5)) {
      this.spawnButterfly();
    }
    for (const b of this.butterflies) {
      b.phase += ctx.dt * (b.golden ? 16 : 12);
      b.wander -= ctx.dt;
      b.life -= ctx.dt;

      // Find a hand to follow.
      let target: HandState | null = null;
      let best = 520;
      for (const h of ctx.frame.hands) {
        const d = dist(h.palm, b);
        if (d < best) {
          best = d;
          target = h;
        }
      }
      if (target) {
        b.tx = target.palm.x + Math.sin(this.time * 1.3 + b.phase) * 120;
        b.ty = target.palm.y - 40 + Math.cos(this.time * 1.1 + b.phase) * 90;
        b.wander = 1.4;
      } else if (b.wander <= 0) {
        b.wander = rand(1.5, 3.5);
        b.tx = clamp(b.x + rand(-420, 420), 80, 1840);
        b.ty = clamp(b.y + rand(-260, 260), 140, 760);
      }

      const dx = b.tx - b.x;
      const dy = b.ty - b.y;
      const d = Math.hypot(dx, dy) || 1;
      const speed = b.golden ? 130 : 95;
      const desiredVx = (dx / d) * speed;
      const desiredVy = (dy / d) * speed;
      const steer = 1 - Math.pow(0.06, ctx.dt);
      b.vx += (desiredVx - b.vx) * steer;
      b.vy += (desiredVy - b.vy) * steer;
      b.x += b.vx * ctx.dt;
      b.y += b.vy * ctx.dt + Math.sin(b.phase) * 12 * ctx.dt;
      b.angle = Math.atan2(b.vy, Math.abs(b.vx) + 40) * 0.5;

      if (b.x < 60 || b.x > 1860) b.vx *= -0.8;
      if (b.y < 120 || b.y > 800) b.vy *= -0.8;

      // Touching a butterfly makes it sparkle.
      for (const h of ctx.frame.hands) {
        if (handTouchesCircle(h, b.x, b.y, b.size * 0.7)) {
          if (b.golden && b.life > 0) {
            this.collectGolden(b, ctx);
            b.life = 0;
          } else if (chance(ctx.dt * 4)) {
            this.particles.sparkleBurst(b.x, b.y, 6, [b.color, '#ffffff'], 180);
            ctx.audio.play('sparkle');
          }
        }
      }
    }
    this.butterflies = this.butterflies.filter((b) => b.life > 0 && b.x > -200 && b.x < 2120);

    // Golden butterfly surprise.
    this.nextGolden -= ctx.dt;
    if (this.nextGolden <= 0 && !this.golden) {
      this.nextGolden = rand(30, 45);
      this.golden = this.spawnButterfly(true);
      this.particles.sparkleBurst(this.golden.x, this.golden.y, 20, ['#ffe14d', '#ffffff'], 300);
    }
    if (this.golden && this.golden.life <= 0) this.golden = null;

    // Ladybug.
    const lb = this.ladybug;
    if (lb.fly > 0) {
      lb.fly -= ctx.dt;
      lb.y -= 160 * ctx.dt;
      lb.x += Math.sin(this.time * 3) * 60 * ctx.dt;
      if (lb.fly <= 0) {
        lb.y = 990;
        lb.x = rand(100, 1800);
      }
    } else {
      lb.x += lb.vx * lb.dir * ctx.dt;
      if (lb.x < 80 || lb.x > 1840) lb.dir *= -1;
      for (const h of ctx.frame.hands) {
        if (handTouchesCircle(h, lb.x, lb.y, 26)) {
          lb.fly = 1.4;
          ctx.audio.play('boing');
          this.particles.sparkleBurst(lb.x, lb.y, 10, ['#ff5d7a', '#ffffff'], 200);
        }
      }
    }

    this.particles.update(ctx.dt);
  }

  private collectGolden(b: Butterfly, ctx: GameContext): void {
    ctx.audio.play('celebrate');
    this.particles.fireworks(b.x, b.y, '#ffe14d');
    this.particles.confetti(b.x, b.y, 50, 620);
    this.particles.text('Golden Butterfly!', b.x, b.y - 60, '#fff7b0', 64);
    ctx.audio.speak('You found the golden butterfly!', { force: true });
    for (const f of this.flowers) {
      f.growth = 1;
      f.bloom = Math.max(f.bloom, 0.4);
    }
    this.golden = null;
  }

  draw(ctx: CanvasRenderingContext2D, g: GameContext): void {
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, 780);
    sky.addColorStop(0, '#79d0ff');
    sky.addColorStop(0.55, '#bfeaff');
    sky.addColorStop(1, '#e9fbff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1920, 800);

    sun(ctx, 1600, 170, 92, this.time);
    for (const c of this.clouds) cloud(ctx, c.x, c.y, c.s, '#ffffff', c.alpha);

    // rainbow
    if (this.rainbow > 0.02) {
      ctx.save();
      ctx.globalAlpha = this.rainbow * 0.5;
      const colors = ['#ff5d7a', '#ff9f43', '#ffe14d', '#5fdc7a', '#4dc4ff', '#9a7bff'];
      for (let i = 0; i < colors.length; i++) {
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 22;
        ctx.beginPath();
        ctx.arc(960, 900, 640 - i * 22, Math.PI * 1.08, Math.PI * 1.92);
        ctx.stroke();
      }
      ctx.restore();
    }

    // hills
    ellipse(ctx, 320, 830, 620, 190, '#8fdc7a');
    ellipse(ctx, 1500, 820, 700, 200, '#7fd06a');
    ellipse(ctx, 960, 860, 780, 180, '#a6e88a');

    // ground
    const ground = ctx.createLinearGradient(0, 780, 0, 1080);
    ground.addColorStop(0, '#7cc95a');
    ground.addColorStop(1, '#3e8b3c');
    ctx.fillStyle = ground;
    ctx.fillRect(0, 790, 1920, 290);

    // grass blades
    for (const b of this.blades) {
      const sway = Math.sin(this.time * 1.6 + b.phase) * (6 + this.wind * 18);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x, 1080);
      ctx.quadraticCurveTo(b.x + b.lean * 40, 1080 - b.h * 0.6, b.x + b.lean * 60 + sway, 1080 - b.h);
      ctx.stroke();
    }

    // flowers sorted by depth
    const sorted = [...this.flowers].sort((a, b) => a.baseY - b.baseY);
    for (const f of sorted) this.drawFlower(ctx, f);

    // ladybug
    const lb = this.ladybug;
    if (lb.y > 900) {
      ellipse(ctx, lb.x, lb.y, 20, 16, '#e63946');
      ellipse(ctx, lb.x, lb.y - 6, 12, 10, '#2b1a3a');
      ellipse(ctx, lb.x - 6, lb.y + 2, 3.5, 3.5, '#2b1a3a');
      ellipse(ctx, lb.x + 7, lb.y + 3, 3.5, 3.5, '#2b1a3a');
      ctx.strokeStyle = '#2b1a3a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(lb.x, lb.y - 14);
      ctx.lineTo(lb.x + lb.dir * 8, lb.y - 22);
      ctx.stroke();
    }

    for (const b of this.butterflies) {
      if (b.golden) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        sparkle(ctx, b.x, b.y, 60, 'rgba(255,225,77,0.35)', this.time);
        ctx.restore();
      }
      butterflyShape(ctx, b.x, b.y, b.size, b.color, b.color2, b.phase, b.angle + Math.sin(b.phase * 0.2) * 0.1);
    }

    this.particles.draw(ctx);
    drawVignette(ctx, 1920, 1080, 0.22);
    drawHandCursors(ctx, g.frame, g.settings, { scale: 1.0 });
    if (this.greeting > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.greeting);
      drawHint(ctx, 'Help the flowers grow!', 0.95);
      ctx.restore();
    }
    drawHint(ctx, 'Butterfly Garden', 0.3);
  }

  private drawFlower(ctx: CanvasRenderingContext2D, f: Flower): void {
    const grow = easeOutCubic(clamp01(f.growth));
    const stemH = f.stem * (0.5 + 0.5 * grow);
    const sway = Math.sin(this.time * f.sway * 1.2 + f.phase) * (4 + this.wind * 10);
    const headX = f.x + sway + f.lean * stemH;
    const headY = f.baseY - stemH;

    ctx.save();
    ctx.strokeStyle = '#3f8f3f';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(f.x, f.baseY);
    ctx.quadraticCurveTo(f.x + sway * 0.3, f.baseY - stemH * 0.55, headX, headY);
    ctx.stroke();

    // leaves
    if (grow > 0.2) {
      leaf(ctx, f.x + sway * 0.2, f.baseY - stemH * 0.42, 22 * grow, -0.9, '#4fae4f');
      leaf(ctx, f.x + sway * 0.3, f.baseY - stemH * 0.6, 18 * grow, 0.9, '#63c463');
    }

    const s = f.size * (0.45 + 0.55 * grow);
    flower(ctx, headX, headY, s, {
      petals: f.petals,
      petalColor: f.color,
      petalColor2: f.color2,
      open: 0.25 + 0.75 * f.bloom,
      rotation: f.phase + this.time * 0.05,
    });

    if (f.bloom > 0.9) {
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(this.time * 2 + f.phase);
      sparkle(ctx, headX + s * 0.7, headY - s * 0.5, 10, '#ffffff', this.time);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

export const butterflyGardenGame: GameDefinition = {
  id: 'butterfly-garden',
  title: 'Butterfly Garden',
  adultLabel: 'Butterfly Garden',
  voice: 'Help the flowers grow!',
  colors: ['#5fdc7a', '#ffd93d'],
  create: () => new ButterflyGardenGame(),
};

export { ButterflyGardenGame };