import type { GameContext, GameDefinition, GameInstance } from '../types';
import type { GestureEvent, HandState } from '../../types';
import { Particles } from '../shared/particles';
import { drawHandCursors, drawHint, drawVignette, handTouchesCircle } from '../shared/hud';
import { TAU, clamp, clamp01, dist, lerp } from '../../utils/math';
import { FISH_COLORS } from '../../utils/palette';
import { ellipse, fishShape, glow, sparkle } from '../../utils/draw';
import { chance, pick, rand } from '../../utils/random';

type CreatureKind = 'fish' | 'dolphin' | 'turtle' | 'octopus' | 'whale' | 'seahorse';

const KIND_SPEED: Record<CreatureKind, number> = { fish: 90, dolphin: 120, turtle: 34, octopus: 55, whale: 40, seahorse: 45 };
const KIND_NAME: Record<CreatureKind, string> = { fish: 'Fish', dolphin: 'Dolphin', turtle: 'Turtle', octopus: 'Octopus', whale: 'Whale', seahorse: 'Seahorse' };

interface Creature {
  id: number;
  kind: CreatureKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  phase: number;
  dir: number;
  tx: number;
  ty: number;
  wander: number;
  reaction: number;
  leapT: number;
  leaping: boolean;
  baseY: number;
  spin: number;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  phase: number;
}

interface Weed {
  x: number;
  h: number;
  phase: number;
  color: string;
  width: number;
}

class UnderwaterGame implements GameInstance {
  private creatures: Creature[] = [];
  private bubbles: Bubble[] = [];
  private weeds: Weed[] = [];
  private corals: Array<{ x: number; y: number; s: number; color: string; phase: number }> = [];
  private particles = new Particles();
  private time = 0;
  private nextId = 1;
  private greeting = 3.4;
  private current = { x: 0, y: 0 };
  private lastPoint = new Map<number, number>();
  private plankton: Array<{ x: number; y: number; r: number; phase: number }> = [];

  enter(): void {
    for (let i = 0; i < 16; i++) this.spawnFish();
    for (let i = 0; i < 2; i++) this.spawnDolphin();
    this.spawnTurtle();
    this.spawnFriend('octopus', 560, 400, '#ff8fb8', 70);
    this.spawnFriend('whale', 1450, 330, '#6f9be0', 120);
    this.spawnFriend('seahorse', 900, 700, '#ffc24d', 60);
    for (let i = 0; i < 26; i++) this.spawnBubble(rand(0, 1));
    for (let i = 0; i < 26; i++) {
      this.weeds.push({
        x: rand(20, 1900),
        h: rand(120, 320),
        phase: rand(0, TAU),
        color: pick(['#2f8f6b', '#3fae7a', '#267a5b', '#4fbf8f']),
        width: rand(10, 20),
      });
    }
    for (let i = 0; i < 9; i++) {
      this.corals.push({
        x: rand(40, 1880),
        y: rand(940, 1030),
        s: rand(50, 110),
        color: pick(['#ff6b9d', '#ff9f43', '#b78bff', '#ff5d7a', '#ffd93d']),
        phase: rand(0, TAU),
      });
    }
    for (let i = 0; i < 50; i++) {
      this.plankton.push({ x: rand(0, 1920), y: rand(0, 1080), r: rand(1, 3), phase: rand(0, TAU) });
    }
  }

  private spawnFish(): void {
    const dir = chance(0.5) ? 1 : -1;
    this.creatures.push({
      id: this.nextId++,
      kind: 'fish',
      x: rand(100, 1820),
      y: rand(220, 780),
      vx: dir * rand(40, 80),
      vy: rand(-15, 15),
      size: rand(26, 52),
      color: pick(FISH_COLORS),
      phase: rand(0, TAU),
      dir,
      tx: rand(100, 1820),
      ty: rand(200, 800),
      wander: rand(1, 4),
      reaction: 0,
      leapT: 0,
      leaping: false,
      baseY: 0,
      spin: 0,
    });
  }

  private spawnDolphin(): void {
    const dir = chance(0.5) ? 1 : -1;
    this.creatures.push({
      id: this.nextId++,
      kind: 'dolphin',
      x: rand(300, 1600),
      y: rand(300, 650),
      vx: dir * 90,
      vy: 0,
      size: rand(74, 96),
      color: '#7fc8e8',
      phase: rand(0, TAU),
      dir,
      tx: rand(200, 1700),
      ty: rand(280, 680),
      wander: rand(2, 5),
      reaction: 0,
      leapT: 0,
      leaping: false,
      baseY: rand(300, 650),
      spin: 0,
    });
  }

  private spawnFriend(kind: CreatureKind, x: number, y: number, color: string, size: number): void {
    this.creatures.push({
      id: this.nextId++, kind, x, y, vx: 0, vy: 0, size, color,
      phase: rand(0, TAU), dir: chance(0.5) ? 1 : -1, tx: x, ty: y, wander: rand(1, 3),
      reaction: 0, leapT: 0, leaping: false, baseY: y, spin: 0,
    });
  }

  private spawnTurtle(): void {
    this.creatures.push({
      id: this.nextId++,
      kind: 'turtle',
      x: 1500,
      y: 520,
      vx: -30,
      vy: 0,
      size: 64,
      color: '#7fbf6a',
      phase: rand(0, TAU),
      dir: -1,
      tx: 500,
      ty: 520,
      wander: 8,
      reaction: 0,
      leapT: 0,
      leaping: false,
      baseY: 520,
      spin: 0,
    });
  }

  private spawnBubble(progress = 0): void {
    this.bubbles.push({
      x: rand(40, 1880),
      y: 1080 + rand(0, 200) - progress * 1100,
      r: rand(12, 42),
      vy: -rand(40, 100),
      phase: rand(0, TAU),
    });
  }

  onGesture(e: GestureEvent, ctx: GameContext): void {
    if (e.type === 'wave') {
      ctx.audio.play('splash');
      const x = e.x ?? 960;
      const y = e.y ?? 500;
      this.particles.sparkleBurst(x, y, 18, ['#bff6ff', '#ffffff', '#7fe3ff'], 380);
      for (const c of this.creatures) {
        if (c.kind === 'dolphin' && !c.leaping && dist({ x, y }, c) < 700) this.leap(c);
      }
      for (const b of this.bubbles) b.vy -= 40;
    }
    if (e.type === 'clap' || e.type === 'highFive') {
      ctx.audio.play('splash');
      for (let i = 0; i < 14; i++) this.spawnBubble(0.3);
      this.particles.sparkleBurst(e.x ?? 960, e.y ?? 500, 20, ['#bff6ff', '#ffffff'], 320);
    }
    if (e.type === 'fastSwipe') {
      ctx.audio.play('whoosh');
    }
  }

  private leap(c: Creature): void {
    c.leaping = true;
    c.leapT = 0;
    c.baseY = c.y;
  }

  update(ctx: GameContext): void {
    this.time += ctx.dt;
    this.greeting = Math.max(0, this.greeting - ctx.dt);

    // Current from two hands.
    const hands = ctx.frame.hands;
    if (hands.length >= 2) {
      this.current.x = lerp(this.current.x, (hands[0].velocity.x + hands[1].velocity.x) / 2, 0.1);
      this.current.y = lerp(this.current.y, (hands[0].velocity.y + hands[1].velocity.y) / 2, 0.1);
    } else {
      this.current.x *= 0.95;
      this.current.y *= 0.95;
    }
    const currentMag = Math.hypot(this.current.x, this.current.y);
    if (currentMag > 120 && chance(ctx.dt * 6)) {
      this.particles.spawn({
        x: rand(0, 1920),
        y: rand(100, 900),
        vx: this.current.x * 0.5,
        vy: this.current.y * 0.5,
        life: 0.8,
        size: rand(3, 7),
        color: 'rgba(200,245,255,0.8)',
        shape: 'ring',
      });
    }

    // Bubbles.
    if (this.bubbles.length < 28 && chance(ctx.dt * 2)) this.spawnBubble();
    for (const b of this.bubbles) {
      b.phase += ctx.dt * 2;
      b.y += (b.vy + this.current.y * 0.25) * ctx.dt;
      b.x += (Math.sin(b.phase) * 22 + this.current.x * 0.25) * ctx.dt;
      if (b.x < 20) b.x = 20;
      if (b.x > 1900) b.x = 1900;
      if (b.y < -60) {
        b.y = 1120;
        b.x = rand(40, 1880);
      }
      for (const h of hands) {
        if (handTouchesCircle(h, b.x, b.y, b.r)) {
          this.particles.popBurst(b.x, b.y, 'rgba(200,245,255,0.9)', 0.6);
          ctx.audio.play('pop', 2);
          b.y = 1120;
          b.x = rand(40, 1880);
          break;
        }
      }
    }

    // Creatures.
    for (const c of this.creatures) {
      c.phase += ctx.dt * (c.kind === 'turtle' || c.kind === 'whale' ? 2 : c.kind === 'octopus' ? 3.5 : 6);
      c.wander -= ctx.dt;
      c.reaction = Math.max(0, c.reaction - ctx.dt);
      c.spin = Math.max(0, c.spin - ctx.dt * 2);

      if (c.leaping) {
        c.leapT += ctx.dt * 1.1;
        c.x += c.vx * 1.4 * ctx.dt;
        c.y = c.baseY - Math.sin(clamp01(c.leapT) * Math.PI) * 260;
        if (c.leapT >= 1) {
          c.leaping = false;
          c.y = c.baseY;
          this.particles.sparkleBurst(c.x, c.y, 16, ['#bff6ff', '#ffffff'], 300);
          ctx.audio.play('splash');
        }
        continue;
      }

      // Follow a hand.
      let target: HandState | null = null;
      let best = 620;
      for (const h of hands) {
        const d = dist(h.palm, c);
        if (d < best) {
          best = d;
          target = h;
        }
      }
      if (target) {
        c.tx = target.palm.x + Math.sin(this.time * 1.1 + c.phase) * (c.kind === 'turtle' || c.kind === 'whale' ? 60 : 130);
        c.ty = target.palm.y + Math.cos(this.time * 0.9 + c.phase) * 80;
        c.wander = 1.2;
      } else if (c.wander <= 0) {
        c.wander = rand(2, 5);
        c.tx = clamp(c.x + rand(-500, 500), 80, 1840);
        c.ty = clamp(c.y + rand(-240, 240), 160, 860);
      }

      const dx = c.tx - c.x;
      const dy = c.ty - c.y;
      const d = Math.hypot(dx, dy) || 1;
      const speed = KIND_SPEED[c.kind];
      const steer = 1 - Math.pow(0.1, ctx.dt);
      c.vx += ((dx / d) * speed - c.vx) * steer;
      c.vy += ((dy / d) * speed - c.vy) * steer;
      if (currentMag > 150) {
        c.vx += this.current.x * 0.25 * ctx.dt;
        c.vy += this.current.y * 0.25 * ctx.dt;
      }
      c.x += c.vx * ctx.dt;
      c.y += c.vy * ctx.dt;
      if (Math.abs(c.vx) > 8) c.dir = Math.sign(c.vx);
      if (c.x < 60) {
        c.x = 60;
        c.vx = Math.abs(c.vx);
        c.dir = 1;
      } else if (c.x > 1860) {
        c.x = 1860;
        c.vx = -Math.abs(c.vx);
        c.dir = -1;
      }
      if (c.y < 130) {
        c.y = 130;
        c.vy = Math.abs(c.vy);
      } else if (c.y > 880) {
        c.y = 880;
        c.vy = -Math.abs(c.vy);
      }

      // Pointing at a creature makes it react.
      for (const h of hands) {
        if (!h.pointing && !h.pinchActive) continue;
        if (dist(h.tip, c) < c.size * 1.5 + 40) {
          const last = this.lastPoint.get(c.id) ?? -10;
          if (this.time - last > 1.6) {
            this.lastPoint.set(c.id, this.time);
            c.reaction = 1.2;
            c.spin = c.kind === 'turtle' || c.kind === 'octopus' ? 1 : 0;
            if (c.kind === 'whale') this.particles.sparkleBurst(c.x + c.dir * c.size * 0.6, c.y - c.size * 0.9, 22, ['#bff6ff', '#ffffff'], 380);
            if (c.kind !== 'fish') ctx.audio.speak(KIND_NAME[c.kind], { force: false });
            if (c.kind === 'dolphin') this.leap(c);
            this.particles.hearts(c.x, c.y - c.size, 3);
            ctx.audio.play(c.kind === 'turtle' || c.kind === 'octopus' ? 'boing' : 'sparkle');
          }
        }
      }
    }

    this.particles.update(ctx.dt);
  }

  draw(ctx: CanvasRenderingContext2D, g: GameContext): void {
    const bg = ctx.createLinearGradient(0, 0, 0, 1080);
    bg.addColorStop(0, '#8ce7ff');
    bg.addColorStop(0.28, '#2ba8cf');
    bg.addColorStop(0.65, '#0b5f8a');
    bg.addColorStop(1, '#042a4d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1920, 1080);

    // light rays
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const x = 180 + i * 290 + Math.sin(this.time * 0.2 + i) * 40;
      const grad = ctx.createLinearGradient(x, 0, x + 160, 900);
      grad.addColorStop(0, 'rgba(200,250,255,0.16)');
      grad.addColorStop(1, 'rgba(200,250,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 90, 0);
      ctx.lineTo(x + 330, 900);
      ctx.lineTo(x + 150, 900);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // plankton
    for (const p of this.plankton) {
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(this.time + p.phase));
      ctx.globalAlpha = tw * 0.5;
      ctx.fillStyle = '#dffbff';
      ctx.beginPath();
      ctx.arc(p.x + Math.sin(this.time * 0.3 + p.phase) * 12, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // sea floor
    const sand = ctx.createLinearGradient(0, 880, 0, 1080);
    sand.addColorStop(0, 'rgba(240,220,170,0)');
    sand.addColorStop(0.35, '#e8d39a');
    sand.addColorStop(1, '#c9a86a');
    ctx.fillStyle = sand;
    ctx.beginPath();
    ctx.moveTo(0, 940);
    ctx.quadraticCurveTo(480, 890, 960, 930);
    ctx.quadraticCurveTo(1440, 970, 1920, 920);
    ctx.lineTo(1920, 1080);
    ctx.lineTo(0, 1080);
    ctx.closePath();
    ctx.fill();

    // weeds
    for (const w of this.weeds) {
      const sway = Math.sin(this.time * 1.2 + w.phase) * 26;
      ctx.strokeStyle = w.color;
      ctx.lineWidth = w.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w.x, 1080);
      ctx.bezierCurveTo(w.x + sway, 1080 - w.h * 0.4, w.x - sway * 0.7, 1080 - w.h * 0.75, w.x + sway * 0.4, 1080 - w.h);
      ctx.stroke();
    }

    // corals
    for (const c of this.corals) this.drawCoral(ctx, c);

    // creatures
    for (const c of this.creatures) {
      if (c.kind === 'fish') {
        const wiggle = c.reaction > 0 ? Math.sin(this.time * 20) * 0.25 : 0;
        fishShape(ctx, c.x, c.y + Math.sin(c.phase) * 6, c.size, c.color, c.dir, c.phase + wiggle);
        if (c.reaction > 0) {
          ctx.save();
          ctx.globalAlpha = 0.7;
          sparkle(ctx, c.x - c.dir * c.size, c.y - c.size * 0.6, 12, '#ffffff', this.time);
          ctx.restore();
        }
      } else if (c.kind === 'dolphin') {
        this.drawDolphin(ctx, c);
      } else if (c.kind === 'turtle') {
        this.drawTurtle(ctx, c);
      } else if (c.kind === 'octopus') {
        this.drawOctopus(ctx, c);
      } else if (c.kind === 'whale') {
        this.drawWhale(ctx, c);
      } else {
        this.drawSeahorse(ctx, c);
      }
    }

    // bubbles
    for (const b of this.bubbles) {
      const g2 = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.1, b.x, b.y, b.r);
      g2.addColorStop(0, 'rgba(255,255,255,0.85)');
      g2.addColorStop(0.55, 'rgba(190,240,255,0.35)');
      g2.addColorStop(1, 'rgba(150,220,255,0.12)');
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    this.particles.draw(ctx);
    drawVignette(ctx, 1920, 1080, 0.32);
    drawHandCursors(ctx, g.frame, g.settings, { scale: 1.0 });
    if (this.greeting > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.greeting);
      drawHint(ctx, 'Let us explore!', 0.95);
      ctx.restore();
    }
    drawHint(ctx, 'Underwater Adventure', 0.3);
  }

  private drawCoral(
    ctx: CanvasRenderingContext2D,
    c: { x: number; y: number; s: number; color: string; phase: number },
  ): void {
    const sway = Math.sin(this.time * 0.8 + c.phase) * 0.06;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(sway);
    ctx.strokeStyle = c.color;
    ctx.lineCap = 'round';
    ctx.lineWidth = c.s * 0.16;
    const branches = 5;
    for (let i = 0; i < branches; i++) {
      const a = -Math.PI / 2 + (i - (branches - 1) / 2) * 0.38;
      const len = c.s * (0.7 + (i % 3) * 0.18);
      const ex = Math.cos(a) * len;
      const ey = Math.sin(a) * len;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(ex * 0.4 + (i % 2 ? 14 : -14), ey * 0.6, ex, ey);
      ctx.stroke();
      ellipse(ctx, ex, ey, c.s * 0.09, c.s * 0.09, c.color);
    }
    ctx.restore();
  }

  private drawDolphin(ctx: CanvasRenderingContext2D, c: Creature): void {
    const angle = c.leaping ? Math.atan2(-Math.cos(clamp01(c.leapT) * Math.PI) * 260, c.vx * 1.4) * 0.6 : 0;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(c.dir, 1);
    ctx.rotate(angle * c.dir);
    const s = c.size;
    // tail
    ctx.fillStyle = '#5aa9cf';
    ctx.beginPath();
    ctx.moveTo(-s * 0.75, 0);
    ctx.quadraticCurveTo(-s * 1.25, -s * 0.42, -s * 1.45, -s * 0.05);
    ctx.quadraticCurveTo(-s * 1.2, s * 0.42, -s * 0.75, s * 0.05);
    ctx.fill();
    // body
    const grad = ctx.createLinearGradient(0, -s * 0.4, 0, s * 0.4);
    grad.addColorStop(0, '#bfeaf7');
    grad.addColorStop(0.5, '#7fc8e8');
    grad.addColorStop(1, '#4f9fc4');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.36, 0, 0, TAU);
    ctx.fill();
    // snout
    ctx.beginPath();
    ctx.moveTo(s * 0.75, -s * 0.12);
    ctx.quadraticCurveTo(s * 1.3, -s * 0.05, s * 1.32, s * 0.08);
    ctx.quadraticCurveTo(s * 1.0, s * 0.18, s * 0.72, s * 0.16);
    ctx.fill();
    // dorsal fin
    ctx.beginPath();
    ctx.moveTo(-s * 0.05, -s * 0.32);
    ctx.quadraticCurveTo(s * 0.08, -s * 0.85, s * 0.42, -s * 0.3);
    ctx.fill();
    // flipper
    ctx.beginPath();
    ctx.moveTo(s * 0.1, s * 0.2);
    ctx.quadraticCurveTo(-s * 0.05, s * 0.62, -s * 0.35, s * 0.3);
    ctx.fill();
    // eye + smile
    ellipse(ctx, s * 0.72, -s * 0.08, s * 0.07, s * 0.07, '#12324a');
    ellipse(ctx, s * 0.74, -s * 0.1, s * 0.025, s * 0.025, '#ffffff');
    ctx.strokeStyle = '#2a6a8a';
    ctx.lineWidth = Math.max(2, s * 0.03);
    ctx.beginPath();
    ctx.arc(s * 0.95, s * 0.06, s * 0.18, 0.15 * Math.PI, 0.7 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  private face(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, happy: boolean): void {
    ellipse(ctx, x - r, y, r * 0.5, r * 0.6, '#ffffff');
    ellipse(ctx, x + r, y, r * 0.5, r * 0.6, '#ffffff');
    ellipse(ctx, x - r, y + r * 0.1, r * 0.25, r * 0.3, '#2a1a40');
    ellipse(ctx, x + r, y + r * 0.1, r * 0.25, r * 0.3, '#2a1a40');
    ctx.strokeStyle = '#2a1a40';
    ctx.lineWidth = Math.max(3, r * 0.22);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y + r * 0.9, r * (happy ? 0.7 : 0.5), 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  private drawOctopus(ctx: CanvasRenderingContext2D, c: Creature): void {
    ctx.save();
    ctx.translate(c.x, c.y + Math.sin(c.phase) * 8);
    if (c.spin > 0) ctx.rotate(Math.sin((1 - c.spin) * TAU) * 0.5);
    const s = c.size;
    ctx.strokeStyle = c.color;
    ctx.lineCap = 'round';
    ctx.lineWidth = s * 0.2;
    for (let i = 0; i < 8; i++) {
      const bx = (i - 3.5) * s * 0.22;
      ctx.beginPath();
      ctx.moveTo(bx, s * 0.5);
      const w = Math.sin(c.phase * 1.3 + i) * s * 0.22;
      ctx.bezierCurveTo(bx + w, s * 0.9, bx - w, s * 1.2, bx + w * 1.4, s * 1.5);
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(-s * 0.2, -s * 0.3, s * 0.1, 0, 0, s * 0.9);
    g.addColorStop(0, '#ffc2da');
    g.addColorStop(1, c.color);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.78, s * 0.85, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#b0467a';
    ctx.lineWidth = 3;
    ctx.stroke();
    this.face(ctx, 0, s * 0.05, s * 0.22, true);
    ctx.restore();
  }

  private drawWhale(ctx: CanvasRenderingContext2D, c: Creature): void {
    ctx.save();
    ctx.translate(c.x, c.y + Math.sin(c.phase) * 6);
    ctx.scale(c.dir, 1);
    const s = c.size;
    const tail = Math.sin(c.phase * 1.5) * 0.25;
    ctx.save();
    ctx.translate(-s * 1.45, 0);
    ctx.rotate(tail);
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.moveTo(s * 0.3, 0);
    ctx.quadraticCurveTo(-s * 0.1, -s * 0.2, -s * 0.35, -s * 0.6);
    ctx.quadraticCurveTo(-s * 0.1, -s * 0.05, -s * 0.25, 0);
    ctx.quadraticCurveTo(-s * 0.1, s * 0.05, -s * 0.35, s * 0.6);
    ctx.quadraticCurveTo(-s * 0.1, s * 0.2, s * 0.3, 0);
    ctx.fill();
    ctx.restore();
    const g = ctx.createLinearGradient(0, -s * 0.7, 0, s * 0.7);
    g.addColorStop(0, '#86aef0');
    g.addColorStop(1, '#4f78c8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.5, s * 0.78, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#2f4f98';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#e8f0ff';
    ctx.beginPath();
    ctx.ellipse(s * 0.1, s * 0.34, s * 1.2, s * 0.36, 0, 0.1, Math.PI - 0.1);
    ctx.fill();
    ellipse(ctx, -s * 0.1, s * 0.5, s * 0.34, s * 0.12, '#4f78c8');
    this.face(ctx, s * 0.85, -s * 0.1, s * 0.14, true);
    ctx.restore();
  }

  private drawSeahorse(ctx: CanvasRenderingContext2D, c: Creature): void {
    ctx.save();
    ctx.translate(c.x, c.y + Math.sin(c.phase * 0.8) * 10);
    ctx.scale(c.dir, 1);
    const s = c.size;
    ctx.strokeStyle = c.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // curly tail
    ctx.lineWidth = s * 0.22;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.4);
    ctx.bezierCurveTo(-s * 0.4, s * 0.9, s * 0.1, s * 1.3, -s * 0.2, s * 1.1);
    ctx.stroke();
    // body
    ctx.lineWidth = s * 0.55;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.1);
    ctx.quadraticCurveTo(s * 0.2, s * 0.2, 0, s * 0.5);
    ctx.stroke();
    // head and snout
    ellipse(ctx, s * 0.05, -s * 0.42, s * 0.34, s * 0.3, c.color);
    ellipse(ctx, s * 0.5, -s * 0.38, s * 0.3, s * 0.11, c.color);
    // fin
    ellipse(ctx, -s * 0.3, s * 0.1 + Math.sin(c.phase * 3) * 4, s * 0.16, s * 0.28, 'rgba(255,230,160,0.9)');
    ellipse(ctx, s * 0.12, -s * 0.46, s * 0.07, s * 0.08, '#2a1a40');
    ctx.fillStyle = '#ff8a4d';
    for (let i = 0; i < 3; i++) ellipse(ctx, -s * 0.12 - i * s * 0.04, -s * 0.7 + i * s * 0.1, s * 0.06, s * 0.06, '#ff8a4d');
    ctx.restore();
  }

  private drawTurtle(ctx: CanvasRenderingContext2D, c: Creature): void {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(c.dir, 1);
    if (c.spin > 0) ctx.rotate((1 - c.spin) * TAU * c.dir);
    const s = c.size;
    const flap = Math.sin(this.time * 2.5 + c.phase);
    // flippers
    ctx.fillStyle = '#8fce7a';
    for (const [fx, fy, rot] of [
      [s * 0.15, -s * 0.32, -0.6 + flap * 0.3],
      [s * 0.15, s * 0.32, 0.6 - flap * 0.3],
      [-s * 0.45, -s * 0.25, 0.4 - flap * 0.2],
      [-s * 0.45, s * 0.25, -0.4 + flap * 0.2],
    ] as Array<[number, number, number]>) {
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(rot);
      ellipse(ctx, 0, 0, s * 0.32, s * 0.12, '#8fce7a');
      ctx.restore();
    }
    // head
    ellipse(ctx, s * 0.92, 0, s * 0.28, s * 0.24, '#a8dd92');
    ellipse(ctx, s * 1.02, -s * 0.05, s * 0.05, s * 0.06, '#1f3a22');
    ctx.strokeStyle = '#3f6b3a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(s * 1.0, s * 0.06, s * 0.12, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    // shell
    const g = ctx.createRadialGradient(-s * 0.1, -s * 0.1, s * 0.1, 0, 0, s * 0.7);
    g.addColorStop(0, '#6fae5a');
    g.addColorStop(1, '#3f7a45');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.72, s * 0.6, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#2f5f35';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(210,255,190,0.5)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.72 * (i / 4), s * 0.6 * (i / 4), 0, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * s * 0.7, Math.sin(a) * s * 0.58);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export const underwaterGame: GameDefinition = {
  id: 'underwater-adventure',
  title: 'Underwater Adventure',
  adultLabel: 'Underwater',
  voice: 'Let us explore!',
  colors: ['#4dc4ff', '#5fdc7a'],
  create: () => new UnderwaterGame(),
};

export { UnderwaterGame };