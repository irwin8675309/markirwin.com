import type { GameContext, GameDefinition, GameInstance } from '../types';
import { Particles } from '../shared/particles';
import { drawHandCursors, drawVignette, handTouchesCircle } from '../shared/hud';
import { drawBanner } from '../shared/ui';
import { grantSticker } from '../shared/stickers';
import { rand, randInt } from '../../utils/random';

const COLORS = [
  { name: 'red', c: '#ff5d7a' },
  { name: 'blue', c: '#4dc4ff' },
  { name: 'green', c: '#5fdc7a' },
  { name: 'yellow', c: '#ffd93d' },
  { name: 'purple', c: '#b78bff' },
];
const NUMBERS = ['One', 'Two', 'Three', 'Four', 'Five'];

interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  color: number;
  phase: number;
  nudged: number;
}

/**
 * "Pop & Count": pop the bubbles of the asked-for colour and count them out loud
 * (One, Two, Three...). Other colours just bounce away, so there are no mistakes.
 */
class ColorCountGame implements GameInstance {
  private particles = new Particles();
  private bubbles: Bubble[] = [];
  private target = 0;
  private need = 3;
  private got = 0;
  private rounds = 0;
  private pause = 0;

  enter(g: GameContext): void {
    for (let i = 0; i < 9; i++) this.spawn(true);
    this.newRound(g, false);
  }

  private spawn(anywhere = false, colorOverride?: number): void {
    this.bubbles.push({
      x: rand(160, 1760),
      y: anywhere ? rand(250, 1000) : 1150,
      r: rand(70, 105),
      vy: -rand(55, 105),
      vx: 0,
      color: colorOverride ?? randInt(0, COLORS.length - 1),
      phase: rand(0, 6),
      nudged: 0,
    });
  }

  private newRound(g: GameContext, speak = true): void {
    let next = randInt(0, COLORS.length - 1);
    if (COLORS.length > 1) while (next === this.target && this.rounds > 0) next = randInt(0, COLORS.length - 1);
    this.target = next;
    this.need = 3 + (this.rounds >= 3 ? 1 : 0) + (this.rounds >= 6 ? 1 : 0);
    this.got = 0;
    if (speak) g.audio.play('sparkle');
    g.audio.speak(`Pop ${this.need} ${COLORS[this.target].name} bubbles!`, { force: true });
  }

  update(g: GameContext): void {
    const dt = g.dt;
    this.particles.update(dt);
    if (this.pause > 0) {
      this.pause -= dt;
      if (this.pause <= 0) this.newRound(g);
    }

    for (const b of this.bubbles) {
      b.phase += dt;
      b.y += b.vy * dt;
      b.x += (Math.sin(b.phase * 1.4) * 22 + b.vx) * dt;
      b.vx *= Math.pow(0.2, dt);
      b.nudged = Math.max(0, b.nudged - dt);
    }
    this.bubbles = this.bubbles.filter((b) => b.y > -160);
    while (this.bubbles.length < 10) this.spawn();
    // Always plenty of the asked-for colour on screen.
    const have = this.bubbles.filter((b) => b.color === this.target).length;
    if (have < Math.max(3, this.need - this.got + 1) && Math.random() < dt * 2) this.spawn(false, this.target);

    if (this.pause > 0) return;
    for (const h of g.frame.hands) {
      if (!h.tracked) continue;
      for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i];
        if (!handTouchesCircle(h, b.x, b.y, b.r)) continue;
        if (b.color === this.target) {
          this.bubbles.splice(i, 1);
          this.got++;
          this.particles.popBurst(b.x, b.y, COLORS[b.color].c, 1.2);
          g.audio.play('pop', this.got);
          g.audio.speak(NUMBERS[Math.min(this.got, NUMBERS.length) - 1], { force: true });
          if (this.got >= this.need) {
            this.rounds++;
            this.pause = 2.4;
            g.audio.play('celebrate');
            this.particles.confetti(960, 400, 50, 800);
            g.audio.speak('Great counting!', { force: true });
            if (this.rounds % 4 === 0) window.setTimeout(() => grantSticker('learn'), 1800);
          }
          break;
        } else if (b.nudged <= 0) {
          // Not this colour: a friendly bounce instead of a pop.
          b.nudged = 0.7;
          b.vx = (b.x < h.tip.x ? -1 : 1) * 380;
          b.vy = -Math.abs(b.vy) - 30;
          g.audio.play('boing');
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, g: GameContext): void {
    const w = g.width;
    const h = g.height;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#3a6bd6');
    bg.addColorStop(1, '#8ee0ff');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    for (const b of this.bubbles) {
      const col = COLORS[b.color].c;
      const wob = 1 + Math.sin(b.phase * 3) * 0.03 + (b.nudged > 0 ? Math.sin(b.nudged * 30) * 0.05 : 0);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(wob, 1 / wob);
      const grad = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.35, b.r * 0.1, 0, 0, b.r);
      grad.addColorStop(0, 'rgba(255,255,255,0.95)');
      grad.addColorStop(0.45, col);
      grad.addColorStop(1, col);
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.ellipse(-b.r * 0.38, -b.r * 0.42, b.r * 0.16, b.r * 0.26, 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Instruction: colour word in its own colour, and counting dots.
    const t = COLORS[this.target];
    ctx.save();
    ctx.fillStyle = 'rgba(40,20,90,0.55)';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 520, 40, 1040, 190, 60);
    ctx.fill();
    ctx.restore();
    drawBanner(ctx, `Pop ${this.need} ${t.name.toUpperCase()} bubbles!`, w / 2, 100, 74, t.c);
    const gap = 76;
    const x0 = w / 2 - ((this.need - 1) * gap) / 2;
    for (let i = 0; i < this.need; i++) {
      ctx.beginPath();
      ctx.arc(x0 + i * gap, 185, 28, 0, Math.PI * 2);
      ctx.fillStyle = i < this.got ? t.c : 'rgba(255,255,255,0.3)';
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }

    this.particles.draw(ctx);
    drawVignette(ctx, w, h, 0.2);
    drawHandCursors(ctx, g.frame, g.settings, { scale: 1.0 });
  }
}

export const colorCountGame: GameDefinition = {
  id: 'color-count',
  title: 'Pop & Count',
  voice: 'Let us pop and count!',
  adultLabel: 'Colours and counting',
  colors: ['#4d8dff', '#7be0ff'],
  create: () => new ColorCountGame(),
};
