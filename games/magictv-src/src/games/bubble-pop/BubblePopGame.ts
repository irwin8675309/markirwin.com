import type { GameContext, GameDefinition, GameInstance } from '../types';
import type { GestureEvent, HandState } from '../../types';
import { Particles } from '../shared/particles';
import { drawHandCursors, drawHint, drawVignette, handTouchesCircle, isPinchReady } from '../shared/hud';
import { TAU, clamp, dist, easeOutCubic, lerp } from '../../utils/math';
import { BUBBLE_HUES, CANDY } from '../../utils/palette';
import { ellipse, glow, sparkle, star } from '../../utils/draw';
import { chance, pick, rand, randInt } from '../../utils/random';

type BubbleKind = 'plain' | 'star' | 'face' | 'rainbow' | 'giant' | 'firework' | 'splitter' | 'animal';

interface Bubble {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  baseR: number;
  hue: number;
  kind: BubbleKind;
  phase: number;
  wobble: number;
  wobbleSpeed: number;
  grow: number;
  growingHand: number | null;
  born: number;
  dead: boolean;
}

interface Orb {
  x: number;
  y: number;
  r: number;
  hue: number;
  speed: number;
  phase: number;
}

const KIND_TABLE: Array<[BubbleKind, number]> = [
  ['plain', 34],
  ['star', 14],
  ['face', 13],
  ['rainbow', 9],
  ['animal', 7],
  ['giant', 5],
  ['firework', 9],
  ['splitter', 9],
];

function randomKind(): BubbleKind {
  const total = KIND_TABLE.reduce((s, k) => s + k[1], 0);
  let r = Math.random() * total;
  for (const [kind, w] of KIND_TABLE) {
    r -= w;
    if (r <= 0) return kind;
  }
  return 'plain';
}

class BubblePopGame implements GameInstance {
  private bubbles: Bubble[] = [];
  private particles = new Particles();
  private orbs: Orb[] = [];
  private stars: Array<{ x: number; y: number; r: number; phase: number }> = [];
  private spawnTimer = 0;
  private nextId = 1;
  private time = 0;
  private combo = 0;
  private lastPop = -10;
  private lastAmbient = 0;
  private greeting = 2.6;

  enter(): void {
    for (let i = 0; i < 16; i++) this.spawnBubble(true);
    for (let i = 0; i < 10; i++) {
      this.orbs.push({
        x: rand(0, 1920),
        y: rand(0, 1080),
        r: rand(180, 460),
        hue: pick(BUBBLE_HUES),
        speed: rand(0.05, 0.18),
        phase: rand(0, TAU),
      });
    }
    for (let i = 0; i < 60; i++) {
      this.stars.push({ x: rand(0, 1920), y: rand(0, 1080), r: rand(1.5, 4), phase: rand(0, TAU) });
    }
  }

  private spawnBubble(anywhere = false, at?: { x: number; y: number }, small = false): void {
    const kind = small ? 'plain' : randomKind();
    let r = rand(46, 96);
    if (kind === 'giant') r = rand(150, 210);
    else if (kind === 'firework') r = rand(54, 78);
    else if (small) r = rand(28, 44);
    const x = at ? at.x : rand(r + 30, 1920 - r - 30);
    const y = anywhere && !at ? rand(120, 900) : at ? at.y : 1080 + r + rand(0, 160);
    const bubble: Bubble = {
      id: this.nextId++,
      x,
      y,
      vx: rand(-26, 26),
      vy: -rand(24, 62) * (kind === 'giant' ? 0.6 : 1),
      r,
      baseR: r,
      hue: pick(BUBBLE_HUES),
      kind,
      phase: rand(0, TAU),
      wobble: rand(10, 34),
      wobbleSpeed: rand(0.5, 1.3),
      grow: 0,
      growingHand: null,
      born: this.time,
      dead: false,
    };
    this.bubbles.push(bubble);
  }

  private popBubble(b: Bubble, ctx: GameContext, byHand?: HandState): void {
    if (b.dead) return;
    b.dead = true;
    const color = `hsl(${b.hue}, 95%, 72%)`;
    this.particles.popBurst(b.x, b.y, color, clamp(b.r / 70, 0.7, 2));
    ctx.audio.play('pop', Math.round((120 - b.r) / 12));

    if (this.time - this.lastPop < 0.75) this.combo++;
    else this.combo = 1;
    this.lastPop = this.time;

    switch (b.kind) {
      case 'rainbow':
        this.particles.sparkleBurst(b.x, b.y, 26, CANDY, 420);
        ctx.audio.play('sparkle');
        break;
      case 'giant':
        this.particles.confetti(b.x, b.y, 26, 420);
        this.particles.text('POP!', b.x, b.y - 40, '#fff7b0', 82);
        ctx.audio.play('balloonPop');
        break;
      case 'firework':
        this.particles.fireworks(b.x, b.y, `hsl(${b.hue}, 95%, 65%)`);
        ctx.audio.play('sparkle');
        break;
      case 'splitter':
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * TAU + rand(0, 0.6);
          const child = {
            ...b,
            id: this.nextId++,
            kind: 'plain' as BubbleKind,
            x: b.x + Math.cos(a) * b.r * 0.55,
            y: b.y + Math.sin(a) * b.r * 0.55,
            vx: Math.cos(a) * rand(90, 160),
            vy: Math.sin(a) * rand(70, 130) - 30,
            baseR: b.r * 0.45,
            r: b.r * 0.45,
            grow: 0,
            growingHand: null,
            dead: false,
            born: this.time,
          };
          this.bubbles.push(child);
        }
        break;
      case 'animal':
        this.particles.hearts(b.x, b.y, 3);
        ctx.audio.play('giggle');
        break;
      case 'star':
        this.particles.sparkleBurst(b.x, b.y, 10, ['#fff3a0', '#ffffff'], 260);
        ctx.audio.play('chime', Math.floor(rand(0, 5)));
        break;
      case 'face':
        ctx.audio.play('boing');
        break;
      default:
        if (chance(0.25)) this.particles.sparkleBurst(b.x, b.y, 5, CANDY, 180);
    }

    if (this.combo === 3) this.particles.text('Pop pop pop!', b.x, b.y - 50, '#fff3a0', 60);
    if (this.combo === 6) {
      this.particles.text('Wow!', b.x, b.y - 70, '#ffd1f0', 78);
      this.particles.confetti(b.x, b.y, 18, 380);
    }
    if (this.combo === 10) {
      this.particles.text('Amazing!', b.x, b.y - 70, '#b8fff2', 84);
      this.particles.fireworks(b.x, b.y, '#ffd93d');
    }
    if (byHand && this.combo === 2) {
      this.particles.spawn({ x: b.x, y: b.y, life: 0.5, size: 10, color: '#ffffff', shape: 'sparkle', additive: true });
    }
  }

  onGesture(e: GestureEvent, ctx: GameContext): void {
    if (e.type === 'clap' || e.type === 'highFive') {
      this.particles.confetti(e.x ?? 960, e.y ?? 540, 30, 520);
      ctx.audio.play('celebrate');
    }
    if (e.type === 'wave' && chance(0.5)) {
      this.particles.sparkleBurst(e.x ?? 960, e.y ?? 540, 8, CANDY, 220);
    }
  }

  update(ctx: GameContext): void {
    this.time += ctx.dt;
    this.greeting = Math.max(0, this.greeting - ctx.dt);
    const target = 15 + Math.min(9, ctx.frame.hands.length * 3);
    this.spawnTimer -= ctx.dt;
    if (this.bubbles.length < target && this.spawnTimer <= 0) {
      this.spawnBubble();
      this.spawnTimer = rand(0.22, 0.5);
    }

    for (const o of this.orbs) {
      o.phase += o.speed * ctx.dt;
      o.x += Math.cos(o.phase) * 8 * ctx.dt;
      o.y += Math.sin(o.phase * 0.8) * 6 * ctx.dt;
      if (o.x < -o.r) o.x = 1920 + o.r;
      if (o.x > 1920 + o.r) o.x = -o.r;
    }

    // Ambient magic keeps the screen alive when nobody is moving.
    if (this.time - this.lastAmbient > 2.6) {
      this.lastAmbient = this.time;
      this.particles.spawn({
        x: rand(80, 1840),
        y: rand(120, 900),
        vy: rand(-40, -12),
        life: rand(1.4, 2.4),
        size: rand(4, 9),
        sizeEnd: 0,
        color: pick(CANDY),
        shape: chance(0.5) ? 'sparkle' : 'star',
        additive: true,
      });
    }

    for (const b of this.bubbles) {
      if (b.dead) continue;
      b.phase += b.wobbleSpeed * ctx.dt;
      b.x += (b.vx + Math.cos(b.phase) * b.wobble) * ctx.dt;
      b.y += b.vy * ctx.dt;
      b.vy += (-46 - b.vy) * 0.35 * ctx.dt; // drift gently upward

      if (b.x < b.r) {
        b.x = b.r;
        b.vx = Math.abs(b.vx);
      } else if (b.x > 1920 - b.r) {
        b.x = 1920 - b.r;
        b.vx = -Math.abs(b.vx);
      }
      if (b.y < -b.r * 2.2) {
        b.dead = true;
        continue;
      }

      // Pinch to grow, release to pop.
      if (b.growingHand !== null) {
        const hand = ctx.frame.hands.find((h) => h.id === b.growingHand);
        const stillPinching = hand?.pinchActive && dist(hand.tip, b) < b.r + 220;
        if (!stillPinching) {
          this.popBubble(b, ctx, hand);
          continue;
        }
        b.grow = Math.min(1.35, b.grow + ctx.dt * 1.15);
        b.r = b.baseR * (1 + b.grow * 0.9);
        b.vy *= 0.9;
        if (chance(ctx.dt * 14)) {
          this.particles.spawn({
            x: b.x + rand(-b.r, b.r) * 0.8,
            y: b.y + rand(-b.r, b.r) * 0.8,
            vy: rand(-60, -20),
            life: 0.5,
            size: rand(3, 6),
            color: '#ffffff',
            additive: true,
            shape: 'sparkle',
          });
        }
        continue;
      }

      for (const h of ctx.frame.hands) {
        if (h.pinchActive && dist(h.tip, b) < b.r + Math.max(90, h.radius * 1.1)) {
          b.growingHand = h.id;
          b.grow = 0.04;
          ctx.audio.play('boing');
          this.particles.sparkleBurst(b.x, b.y, 6, ['#ffffff', `hsl(${b.hue}, 95%, 80%)`], 140);
          break;
        }
        if (handTouchesCircle(h, b.x, b.y, b.r * 0.9)) {
          if (isPinchReady(h)) continue; // a pinch is about to grab it
          this.popBubble(b, ctx, h);
          break;
        }
      }
    }

    this.bubbles = this.bubbles.filter((b) => !b.dead);
    if (this.combo > 0 && this.time - this.lastPop > 1.1) this.combo = 0;
    this.particles.update(ctx.dt);
  }

  draw(ctx: CanvasRenderingContext2D, g: GameContext): void {
    // Dreamy sky
    const bg = ctx.createLinearGradient(0, 0, 0, 1080);
    bg.addColorStop(0, '#1d1150');
    bg.addColorStop(0.55, '#3f2380');
    bg.addColorStop(1, '#7447b8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1920, 1080);

    for (const o of this.orbs) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, o.x, o.y, o.r, `hsla(${o.hue}, 90%, 70%, 0.10)`);
      ctx.restore();
    }
    for (const s of this.stars) {
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(this.time * 1.5 + s.phase));
      ctx.globalAlpha = tw * 0.8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const b of this.bubbles) this.drawBubble(ctx, b);
    this.particles.draw(ctx);
    drawVignette(ctx, 1920, 1080, 0.3);
    drawHandCursors(ctx, g.frame, g.settings, { scale: 1.05 });
    if (this.greeting > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.greeting);
      drawHint(ctx, 'Pop the bubbles!', 0.95);
      ctx.restore();
    }
    drawHint(ctx, 'Magic Bubble Pop', 0.35);
  }

  private drawBubble(ctx: CanvasRenderingContext2D, b: Bubble): void {
    const age = clamp((this.time - b.born) / 0.4, 0, 1);
    const scale = easeOutCubic(age) * (1 + Math.sin(this.time * 2 + b.phase) * 0.015);
    const r = b.r * scale;
    if (r <= 1) return;
    const x = b.x;
    const y = b.y;
    const hue = b.hue;

    ctx.save();
    // outer glow
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y, r * 1.7, `hsla(${hue}, 95%, 70%, 0.20)`);
    ctx.globalCompositeOperation = 'source-over';

    // body
    if (b.kind === 'rainbow') {
      const anyCtx = ctx as CanvasRenderingContext2D & {
        createConicGradient?: (start: number, x: number, y: number) => CanvasGradient;
      };
      if (anyCtx.createConicGradient) {
        const cg = anyCtx.createConicGradient(this.time * 0.6, x, y);
        CANDY.forEach((c, i) => cg.addColorStop(i / CANDY.length, c));
        cg.addColorStop(1, CANDY[0]);
        ctx.fillStyle = cg;
      } else {
        ctx.fillStyle = `hsl(${(this.time * 60) % 360}, 90%, 72%)`;
      }
      ctx.globalAlpha = 0.85;
    } else {
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r);
      g.addColorStop(0, `hsla(${hue}, 100%, 96%, 0.95)`);
      g.addColorStop(0.42, `hsla(${hue}, 95%, 76%, 0.8)`);
      g.addColorStop(0.82, `hsla(${hue}, 92%, 62%, 0.72)`);
      g.addColorStop(1, `hsla(${hue + 20}, 90%, 55%, 0.55)`);
      ctx.fillStyle = g;
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    // rim
    ctx.strokeStyle = `hsla(${hue}, 100%, 92%, 0.75)`;
    ctx.lineWidth = Math.max(2, r * 0.045);
    ctx.stroke();

    // highlight
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.36, y - r * 0.42, r * 0.2, r * 0.13, -0.7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(x + r * 0.4, y + r * 0.3, r * 0.07, 0, TAU);
    ctx.fill();

    // contents
    if (b.kind === 'star') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(this.time + b.phase) * 0.2);
      star(ctx, 0, 0, r * 0.42, r * 0.19, '#fff7b0');
      ctx.restore();
    } else if (b.kind === 'face') {
      const look = Math.sin(this.time * 0.8 + b.phase) * r * 0.04;
      ellipse(ctx, x - r * 0.22, y - r * 0.08, r * 0.09, r * 0.11, '#3b2350');
      ellipse(ctx, x + r * 0.22, y - r * 0.08, r * 0.09, r * 0.11, '#3b2350');
      ellipse(ctx, x - r * 0.2 + look, y - r * 0.11, r * 0.03, r * 0.035, '#ffffff');
      ellipse(ctx, x + r * 0.24 + look, y - r * 0.11, r * 0.03, r * 0.035, '#ffffff');
      ctx.strokeStyle = '#3b2350';
      ctx.lineWidth = Math.max(2, r * 0.05);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x, y + r * 0.1, r * 0.22, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else if (b.kind === 'animal') {
      this.drawAnimalFace(ctx, x, y, r, b.phase);
    } else if (b.kind === 'giant') {
      ctx.save();
      ctx.globalAlpha = 0.75;
      sparkle(ctx, x - r * 0.3, y - r * 0.3, r * 0.16, '#ffffff', this.time);
      sparkle(ctx, x + r * 0.35, y + r * 0.1, r * 0.1, '#ffffff', -this.time);
      ctx.restore();
    } else if (b.kind === 'firework') {
      const hue2 = (hue + 180) % 360;
      star(ctx, x, y, r * 0.4, r * 0.16, `hsl(${hue2}, 100%, 75%)`, this.time * 0.8, 6);
    } else if (b.kind === 'splitter') {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = Math.max(2, r * 0.05);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU + this.time * 0.4;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3, r * 0.14, 0, TAU);
        ctx.stroke();
      }
    }

    // pinch grow hint ring
    if (b.growingHand !== null) {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 5;
      ctx.setLineDash([10, 10]);
      ctx.lineDashOffset = -this.time * 80;
      ctx.beginPath();
      ctx.arc(x, y, r + 16, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  private drawAnimalFace(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, phase: number): void {
    // little bear/cat face inside the bubble
    const wob = Math.sin(this.time * 1.2 + phase) * 0.08;
    ctx.save();
    ctx.translate(x, y + r * 0.05);
    ctx.rotate(wob);
    const s = r * 0.55;
    ellipse(ctx, -s * 0.62, -s * 0.5, s * 0.24, s * 0.24, '#ffd9a0');
    ellipse(ctx, s * 0.62, -s * 0.5, s * 0.24, s * 0.24, '#ffd9a0');
    ellipse(ctx, 0, 0, s * 0.72, s * 0.62, '#ffe6bd');
    ellipse(ctx, -s * 0.26, -s * 0.08, s * 0.1, s * 0.12, '#4a2c35');
    ellipse(ctx, s * 0.26, -s * 0.08, s * 0.1, s * 0.12, '#4a2c35');
    ellipse(ctx, -s * 0.24, -s * 0.12, s * 0.035, s * 0.04, '#ffffff');
    ellipse(ctx, s * 0.28, -s * 0.12, s * 0.035, s * 0.04, '#ffffff');
    ellipse(ctx, 0, s * 0.18, s * 0.09, s * 0.07, '#7a4a52');
    ctx.strokeStyle = '#7a4a52';
    ctx.lineWidth = Math.max(2, s * 0.05);
    ctx.beginPath();
    ctx.arc(0, s * 0.18, s * 0.2, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }
}

export const bubblePopGame: GameDefinition = {
  id: 'bubble-pop',
  title: 'Magic Bubble Pop',
  adultLabel: 'Bubble Pop',
  voice: 'Pop the bubbles!',
  colors: ['#5ad1ff', '#b78bff'],
  create: () => new BubblePopGame(),
};

export { BubblePopGame };