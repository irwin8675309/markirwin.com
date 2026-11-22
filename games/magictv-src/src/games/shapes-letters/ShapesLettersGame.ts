import type { GameContext, GameDefinition, GameInstance } from '../types';
import { Particles } from '../shared/particles';
import { drawHandCursors, drawVignette, handTouchesCircle } from '../shared/hud';
import { drawBanner } from '../shared/ui';
import { grantSticker } from '../shared/stickers';
import { shuffle } from '../../utils/random';
import { CANDY } from '../../utils/palette';
import { FONT_STACK } from '../../utils/font';
import { heartPath, starPath } from '../../utils/draw';

type ShapeKind = 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'diamond';
const SHAPES: Array<{ kind: ShapeKind; name: string }> = [
  { kind: 'circle', name: 'Circle' },
  { kind: 'square', name: 'Square' },
  { kind: 'triangle', name: 'Triangle' },
  { kind: 'star', name: 'Star' },
  { kind: 'heart', name: 'Heart' },
  { kind: 'diamond', name: 'Diamond' },
];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface Item {
  label: string;
  kind: ShapeKind | 'letter';
  x: number;
  y: number;
  color: string;
  lit: number; // 0 = dim, 1 = lit
  litNow: boolean;
  bob: number;
}

function shapePath(ctx: CanvasRenderingContext2D, kind: ShapeKind, r: number): void {
  ctx.beginPath();
  switch (kind) {
    case 'circle':
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      break;
    case 'square':
      ctx.roundRect(-r * 0.9, -r * 0.9, r * 1.8, r * 1.8, r * 0.18);
      break;
    case 'triangle':
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 1.0, r * 0.8);
      ctx.lineTo(-r * 1.0, r * 0.8);
      ctx.closePath();
      break;
    case 'diamond':
      ctx.moveTo(0, -r * 1.1);
      ctx.lineTo(r * 0.85, 0);
      ctx.lineTo(0, r * 1.1);
      ctx.lineTo(-r * 0.85, 0);
      ctx.closePath();
      break;
    case 'star':
      starPath(ctx, 0, 0, r * 1.05, r * 0.46, 5, -Math.PI / 2);
      break;
    case 'heart':
      heartPath(ctx, 0, r * 0.1, r * 2.1);
      break;
  }
}

/** "Shapes & Letters": touch floating shapes and letters to light them up and hear their names. */
class ShapesLettersGame implements GameInstance {
  private particles = new Particles();
  private items: Item[] = [];
  private mode: 'shapes' | 'letters' = 'shapes';
  private rounds = 0;
  private pause = 0;
  private time = 0;

  enter(g: GameContext): void {
    this.newRound(g);
  }

  private newRound(g: GameContext): void {
    const picks =
      this.mode === 'shapes'
        ? SHAPES.map((s) => ({ label: s.name, kind: s.kind as Item['kind'] }))
        : shuffle(LETTERS)
            .slice(0, 6)
            .map((l) => ({ label: l, kind: 'letter' as Item['kind'] }));
    const order = shuffle(picks);
    this.items = order.map((p, i) => ({
      ...p,
      x: 400 + (i % 3) * 560,
      y: 480 + Math.floor(i / 3) * 360,
      color: CANDY[(i * 2 + this.rounds) % CANDY.length],
      lit: 0,
      litNow: false,
      bob: i * 1.3,
    }));
    g.audio.speak(this.mode === 'shapes' ? 'Touch the shapes!' : 'Touch the letters!', { force: true });
  }

  update(g: GameContext): void {
    this.time = g.time;
    const dt = g.dt;
    this.particles.update(dt);
    for (const it of this.items) {
      it.lit += ((it.litNow ? 1 : 0) - it.lit) * Math.min(1, dt * 8);
    }
    if (this.pause > 0) {
      this.pause -= dt;
      if (this.pause <= 0) {
        this.mode = this.mode === 'shapes' ? 'letters' : 'shapes';
        this.newRound(g);
      }
      return;
    }
    for (const h of g.frame.hands) {
      if (!h.tracked) continue;
      for (const it of this.items) {
        if (it.litNow) continue;
        const y = it.y + Math.sin(this.time * 1.2 + it.bob) * 14;
        if (!handTouchesCircle(h, it.x, y, 120)) continue;
        it.litNow = true;
        this.particles.sparkleBurst(it.x, y, 26, [it.color, '#ffffff'], 420);
        g.audio.play('chime', this.items.filter((x) => x.litNow).length);
        g.audio.speak(it.kind === 'letter' ? `Letter ${it.label}` : it.label, { force: true });
        if (this.items.every((x) => x.litNow)) {
          this.rounds++;
          this.pause = 2.8;
          this.particles.confetti(960, 400, 50, 800);
          g.audio.play('celebrate');
          if (this.rounds % 3 === 0) window.setTimeout(() => grantSticker('learn'), 2000);
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, g: GameContext): void {
    const w = g.width;
    const h = g.height;
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#2b1a63');
    bg.addColorStop(1, '#5a2f9e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc((i * 197) % w, (i * 113 + this.time * (6 + (i % 4) * 3)) % h, 2 + (i % 3) * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    drawBanner(ctx, this.mode === 'shapes' ? 'Touch the shapes!' : 'Touch the letters!', w / 2, 120, 90);

    for (const it of this.items) {
      const y = it.y + Math.sin(this.time * 1.2 + it.bob) * 14;
      const pop = 1 + Math.sin(Math.min(1, it.lit) * Math.PI) * 0.18;
      ctx.save();
      ctx.translate(it.x, y);
      ctx.scale(pop, pop);
      // glow
      if (it.lit > 0.05) {
        ctx.globalAlpha = it.lit * 0.5;
        ctx.fillStyle = it.color;
        ctx.beginPath();
        ctx.arc(0, 0, 190, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = it.lit > 0.5 ? it.color : 'rgba(255,255,255,0.16)';
      if (it.kind === 'letter') {
        ctx.font = `900 280px ${FONT_STACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.strokeText(it.label, 0, 14);
        ctx.fillText(it.label, 0, 14);
      } else {
        shapePath(ctx, it.kind, 100);
        ctx.fill();
        ctx.stroke();
      }
      if (it.lit > 0.5 && it.kind !== 'letter') {
        ctx.font = `800 40px ${FONT_STACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(it.label, 0, 160);
      }
      ctx.restore();
    }

    this.particles.draw(ctx);
    drawVignette(ctx, w, h, 0.22);
    drawHandCursors(ctx, g.frame, g.settings, { scale: 1.0, showRadius: false });
  }
}

export const shapesLettersGame: GameDefinition = {
  id: 'shapes-letters',
  title: 'Shapes & Letters',
  voice: 'Touch the shapes!',
  adultLabel: 'Shapes and letters',
  colors: ['#7a4dff', '#ff8ad8'],
  create: () => new ShapesLettersGame(),
};
