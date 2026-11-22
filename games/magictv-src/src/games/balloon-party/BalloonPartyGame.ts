import type { GameContext, GameDefinition, GameInstance } from '../types';
import type { GestureEvent } from '../../types';
import { Particles } from '../shared/particles';
import { drawHandCursors, drawHint, drawVignette, handTouchesCircle, isPinchReady } from '../shared/hud';
import { TAU, clamp, clamp01, dist, easeOutCubic } from '../../utils/math';
import { CANDY } from '../../utils/palette';
import { balloon, ellipse, sparkle, star } from '../../utils/draw';
import { chance, pick, rand } from '../../utils/random';

type BalloonKind = 'plain' | 'star' | 'face' | 'gift' | 'giant' | 'rainbow';

interface Balloon {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  kind: BalloonKind;
  phase: number;
  sway: number;
  grabbedBy: number | null;
  born: number;
  dead: boolean;
}

const KIND_TABLE: Array<[BalloonKind, number]> = [
  ['plain', 30],
  ['star', 20],
  ['face', 18],
  ['gift', 14],
  ['rainbow', 18],
];

function randomKind(): BalloonKind {
  const total = KIND_TABLE.reduce((s, k) => s + k[1], 0);
  let r = Math.random() * total;
  for (const [k, w] of KIND_TABLE) {
    r -= w;
    if (r <= 0) return k;
  }
  return 'plain';
}

class BalloonPartyGame implements GameInstance {
  private balloons: Balloon[] = [];
  private particles = new Particles();
  private time = 0;
  private nextId = 1;
  private spawnTimer = 0;
  private charge = 0;
  private chargeX = 960;
  private chargeY = 540;
  private lastGiant = -10;
  private greeting = 3.2;
  private confettiTimer = 0;

  enter(): void {
    for (let i = 0; i < 10; i++) this.spawnBalloon(rand(0, 1));
    this.particles.confetti(960, 100, 40, 380);
  }

  private spawnBalloon(progress = 0, kind?: BalloonKind, x?: number): void {
    const k = kind ?? randomKind();
    let r = rand(52, 92);
    if (k === 'gift') r = rand(64, 84);
    if (k === 'giant') r = 175;
    const b: Balloon = {
      id: this.nextId++,
      x: x ?? rand(r + 40, 1920 - r - 40),
      y: k === 'giant' ? 1080 + r : 1080 + r + (1 - progress) * 260,
      vx: rand(-24, 24),
      vy: -(k === 'giant' ? 34 : rand(58, 112)),
      r,
      color: pick(CANDY),
      kind: k,
      phase: rand(0, TAU),
      sway: rand(8, 30),
      grabbedBy: null,
      born: this.time,
      dead: false,
    };
    this.balloons.push(b);
  }

  private spawnGiant(x: number, y: number, ctx: GameContext): void {
    if (this.time - this.lastGiant < 1.2) return;
    this.lastGiant = this.time;
    this.spawnBalloon(1, 'giant', x);
    const b = this.balloons[this.balloons.length - 1];
    b.y = y;
    b.vy = -30;
    ctx.audio.play('magic');
    this.particles.sparkleBurst(x, y, 30, CANDY, 460);
    this.particles.text('Giant balloon!', x, y - b.r - 40, '#fff7b0', 54);
  }

  onGesture(e: GestureEvent, ctx: GameContext): void {
    if (e.type === 'handsApart' && e.handIds && e.handIds.length >= 2) {
      const hands = ctx.frame.hands.filter((h) => e.handIds!.includes(h.id));
      if (hands.length >= 2) {
        this.spawnGiant((hands[0].palm.x + hands[1].palm.x) / 2, (hands[0].palm.y + hands[1].palm.y) / 2 - 120, ctx);
      }
    }
    if (e.type === 'clap' || e.type === 'highFive') {
      this.particles.confetti(e.x ?? 960, e.y ?? 400, 30, 520);
      ctx.audio.play('celebrate');
    }
    if (e.type === 'wave') {
      this.particles.sparkleBurst(e.x ?? 960, e.y ?? 500, 8, CANDY, 240);
    }
  }

  private pop(b: Balloon, ctx: GameContext): void {
    if (b.dead) return;
    b.dead = true;
    const big = b.kind === 'giant';
    this.particles.popBurst(b.x, b.y, b.color, big ? 2.4 : clamp(b.r / 70, 0.7, 1.6));
    this.particles.confetti(b.x, b.y, big ? 60 : 14, big ? 700 : 380);
    ctx.audio.play('balloonPop');

    if (b.kind === 'star') {
      this.particles.sparkleBurst(b.x, b.y, 22, ['#fff3a0', '#ffffff', '#ffd93d'], 420);
      ctx.audio.play('chime', Math.floor(rand(0, 5)));
      this.particles.text('Twinkle!', b.x, b.y - 40, '#fff3a0', 54);
    } else if (b.kind === 'face') {
      this.particles.hearts(b.x, b.y, 4);
      ctx.audio.play('giggle');
    } else if (b.kind === 'gift') {
      ctx.audio.play('celebrate');
      this.particles.fireworks(b.x, b.y, pick(CANDY));
      this.particles.text('Surprise!', b.x, b.y - 50, '#ffd1f0', 60);
    } else if (big) {
      ctx.audio.play('celebrate');
      this.particles.fireworks(b.x, b.y, b.color);
      this.particles.fireworks(b.x - 220, b.y - 100, '#6ff2ff');
      this.particles.fireworks(b.x + 220, b.y - 100, '#ff8ad8');
    } else if (b.kind === 'rainbow') {
      ctx.audio.play('sparkle');
      this.particles.sparkleBurst(b.x, b.y, 24, CANDY, 400);
    }
  }

  update(ctx: GameContext): void {
    this.time += ctx.dt;
    this.greeting = Math.max(0, this.greeting - ctx.dt);
    this.spawnTimer -= ctx.dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = rand(0.5, 1.0);
      if (this.balloons.length < 16) this.spawnBalloon();
    }

    this.confettiTimer -= ctx.dt;
    if (this.confettiTimer <= 0) {
      this.confettiTimer = rand(2.2, 4.5);
      this.particles.confetti(rand(200, 1720), -20, 8, 120);
    }

    for (const b of this.balloons) {
      if (b.dead) continue;
      b.phase += ctx.dt * 1.4;

      if (b.grabbedBy !== null) {
        const hand = ctx.frame.hands.find((h) => h.id === b.grabbedBy);
        if (!hand || !hand.pinchActive) {
          b.grabbedBy = null;
          b.vy = -100;
          b.vx = hand ? clamp(hand.velocity.x * 0.18, -220, 220) : 0;
          ctx.audio.play('blow');
          this.particles.sparkleBurst(b.x, b.y, 8, ['#ffffff', b.color], 200);
        } else {
          const k = Math.min(1, ctx.dt * 16);
          b.x += (hand.tip.x - b.x) * k;
          b.y += (hand.tip.y - b.r * 0.25 - b.y) * k;
          b.vx = 0;
          b.vy = 0;
          if (chance(ctx.dt * 5)) {
            this.particles.spawn({
              x: b.x + rand(-b.r, b.r) * 0.6,
              y: b.y + rand(-b.r, b.r) * 0.6,
              vy: rand(-40, 10),
              life: 0.6,
              size: rand(3, 6),
              color: '#ffffff',
              shape: 'sparkle',
              additive: true,
            });
          }
        }
      } else {
        b.x += (b.vx + Math.sin(b.phase) * b.sway) * ctx.dt;
        b.y += b.vy * ctx.dt;
        if (b.x < b.r + 10) {
          b.x = b.r + 10;
          b.vx = Math.abs(b.vx);
        } else if (b.x > 1920 - b.r - 10) {
          b.x = 1920 - b.r - 10;
          b.vx = -Math.abs(b.vx);
        }
        if (b.y < -b.r * 2.4) {
          b.dead = true;
          continue;
        }
      }

      // Grab with a pinch.
      if (b.grabbedBy === null) {
        for (const h of ctx.frame.hands) {
          if (h.pinchActive && dist(h.tip, b) < b.r + Math.max(70, h.radius * 0.9)) {
            b.grabbedBy = h.id;
            ctx.audio.play('whoosh');
            break;
          }
        }
      }

      // Pop on touch (but not by the hand that is holding it).
      if (b.grabbedBy === null || !ctx.frame.hands.find((h) => h.id === b.grabbedBy)?.pinchActive) {
        for (const h of ctx.frame.hands) {
          if (h.id === b.grabbedBy) continue;
          if (isPinchReady(h)) continue; // a pinch is about to grab it
          if (handTouchesCircle(h, b.x, b.y, b.r * 0.92)) {
            this.pop(b, ctx);
            break;
          }
        }
      }
    }
    this.balloons = this.balloons.filter((b) => !b.dead);

    // Two pinching hands charge a giant balloon between them.
    const pinching = ctx.frame.hands.filter((h) => h.pinchActive);
    if (pinching.length >= 2) {
      const [a, b] = pinching;
      const d = dist(a.palm, b.palm);
      this.chargeX = (a.palm.x + b.palm.x) / 2;
      this.chargeY = (a.palm.y + b.palm.y) / 2;
      this.charge = Math.min(1.4, this.charge + ctx.dt * (0.55 + d / 1400));
      if (chance(ctx.dt * 14)) {
        this.particles.spawn({
          x: this.chargeX + rand(-30, 30),
          y: this.chargeY + rand(-30, 30),
          vx: rand(-60, 60),
          vy: rand(-60, 60),
          life: 0.5,
          size: rand(4, 9),
          color: pick(CANDY),
          shape: 'sparkle',
          additive: true,
        });
      }
      if (this.charge >= 1.4) {
        this.spawnGiant(this.chargeX, this.chargeY, ctx);
        this.charge = 0;
      }
    } else {
      this.charge = Math.max(0, this.charge - ctx.dt * 1.6);
    }

    this.particles.update(ctx.dt);
  }

  draw(ctx: CanvasRenderingContext2D, g: GameContext): void {
    const bg = ctx.createLinearGradient(0, 0, 0, 1080);
    bg.addColorStop(0, '#2b1458');
    bg.addColorStop(0.45, '#8f2f9e');
    bg.addColorStop(0.8, '#ff6f91');
    bg.addColorStop(1, '#ffb35c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1920, 1080);

    // glowing party lights
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const x = 180 + i * 320;
      const hue = (i * 60 + this.time * 20) % 360;
      sparkle(ctx, x, 150 + Math.sin(this.time + i) * 30, 26, `hsla(${hue}, 100%, 75%, 0.28)`, this.time + i);
    }
    ctx.restore();

    this.drawBunting(ctx);

    // floor glow
    const fg = ctx.createRadialGradient(960, 1120, 60, 960, 1120, 900);
    fg.addColorStop(0, 'rgba(255,230,150,0.35)');
    fg.addColorStop(1, 'rgba(255,230,150,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, 700, 1920, 380);

    for (const b of this.balloons) this.drawBalloon(ctx, b);

    // charging magic ball
    if (this.charge > 0.02) {
      const r = 30 + this.charge * 90;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      sparkle(ctx, this.chargeX, this.chargeY, r * 1.6, `hsla(${(this.time * 120) % 360}, 100%, 70%, 0.35)`, this.time * 2);
      ctx.restore();
      const grad = ctx.createRadialGradient(this.chargeX, this.chargeY, 2, this.chargeX, this.chargeY, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.6, `hsl(${(this.time * 90) % 360}, 95%, 75%)`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.chargeX, this.chargeY, r, 0, TAU);
      ctx.fill();
    }

    this.particles.draw(ctx);
    drawVignette(ctx, 1920, 1080, 0.26);
    drawHandCursors(ctx, g.frame, g.settings, { scale: 1.0 });
    if (this.greeting > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.greeting);
      drawHint(ctx, 'Pop the balloons!', 0.95);
      ctx.restore();
    }
    drawHint(ctx, 'Balloon Party', 0.3);
  }

  private drawBunting(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (let row = 0; row < 2; row++) {
      const y0 = 40 + row * 70;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-20, y0);
      ctx.quadraticCurveTo(960, y0 + 90 + row * 20, 1940, y0);
      ctx.stroke();
      for (let i = 0; i < 18; i++) {
        const t = i / 17;
        const x = -20 + t * 1960;
        const y = y0 + Math.sin(t * Math.PI) * (45 + row * 10);
        ctx.fillStyle = CANDY[(i + row * 3) % CANDY.length];
        ctx.beginPath();
        ctx.moveTo(x - 20, y);
        ctx.lineTo(x + 20, y);
        ctx.lineTo(x, y + 42);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawBalloon(ctx: CanvasRenderingContext2D, b: Balloon): void {
    const age = clamp01((this.time - b.born) / 0.5);
    const scale = easeOutCubic(age);
    const x = b.x;
    const y = b.y;
    const r = b.r * scale;
    if (r < 2) return;
    const color = b.kind === 'rainbow' ? `hsl(${(this.time * 80 + b.phase * 60) % 360}, 92%, 70%)` : b.color;

    balloon(ctx, x, y, r, color, this.time + b.phase);

    if (b.kind === 'star') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(this.time * 1.4 + b.phase) * 0.25);
      star(ctx, 0, 0, r * 0.38, r * 0.16, '#fff7b0', 0, 5);
      ctx.restore();
    } else if (b.kind === 'face') {
      ellipse(ctx, x - r * 0.24, y - r * 0.08, r * 0.075, r * 0.1, '#3b2350');
      ellipse(ctx, x + r * 0.24, y - r * 0.08, r * 0.075, r * 0.1, '#3b2350');
      ellipse(ctx, x - r * 0.22, y - r * 0.11, r * 0.025, r * 0.03, '#ffffff');
      ellipse(ctx, x + r * 0.26, y - r * 0.11, r * 0.025, r * 0.03, '#ffffff');
      ctx.strokeStyle = '#3b2350';
      ctx.lineWidth = Math.max(2, r * 0.045);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x, y + r * 0.12, r * 0.18, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else if (b.kind === 'gift') {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(3, r * 0.07);
      ctx.beginPath();
      ctx.moveTo(x - r * 0.5, y);
      ctx.lineTo(x + r * 0.5, y);
      ctx.moveTo(x, y - r * 0.55);
      ctx.lineTo(x, y + r * 0.5);
      ctx.stroke();
      ctx.restore();
      sparkle(ctx, x + r * 0.4, y - r * 0.45, r * 0.12, '#ffffff', this.time);
    } else if (b.kind === 'giant') {
      ctx.save();
      ctx.globalAlpha = 0.55;
      sparkle(ctx, x - r * 0.4, y - r * 0.35, r * 0.14, '#ffffff', this.time * 2);
      sparkle(ctx, x + r * 0.3, y + r * 0.2, r * 0.09, '#fff3a0', -this.time * 2);
      ctx.restore();
    }
  }
}

export const balloonPartyGame: GameDefinition = {
  id: 'balloon-party',
  title: 'Balloon Party',
  adultLabel: 'Balloon Party',
  voice: 'Pop the balloons!',
  colors: ['#ff8ad8', '#ffd93d'],
  create: () => new BalloonPartyGame(),
};

export { BalloonPartyGame };