import type { GameDefinition, GameInstance, GameContext } from '../types';
import { Particles } from '../shared/particles';
import { BUDDIES, getBuddy, setBuddy, drawAnimalFace } from '../shared/buddies';
import { drawHandCursors, drawVignette, slotsForFrame } from '../shared/hud';
import { star } from '../../utils/draw';
import { FONT_STACK } from '../../utils/font';
import { CANDY } from '../../utils/palette';

const HOLD = 0.9;
const CARD_W = 400;
const CARD_H = 300;
const COLS = 3;

interface Card {
  id: string;
  x: number;
  y: number;
  /** Seconds a hand of child `slot` has rested here. */
  hold: number[];
}

/**
 * "Pick your buddy": each child rests a hand on an animal friend for a moment to
 * make it hers. Her glove and name tag then show that animal in every game.
 */
class BuddyGame implements GameInstance {
  private particles = new Particles();
  private cards: Card[] = [];
  private pulse = new Map<string, number>();

  enter(): void {
    this.cards = BUDDIES.map((b, i) => ({
      id: b.id,
      x: 960 + ((i % COLS) - 1) * (CARD_W + 50),
      y: 440 + Math.floor(i / COLS) * (CARD_H + 50),
      hold: [0, 0, 0, 0],
    }));
  }

  update(g: GameContext): void {
    this.particles.update(g.dt);
    const slots = slotsForFrame(g.frame);
    const touching = new Set<string>();
    for (const h of g.frame.hands) {
      if (!h.tracked || h.speed > 900) continue;
      const slot = Math.min(3, slots.get(h.player) ?? 0);
      for (const c of this.cards) {
        if (Math.abs(h.tip.x - c.x) < CARD_W / 2 && Math.abs(h.tip.y - c.y) < CARD_H / 2) {
          touching.add(`${c.id}:${slot}`);
          c.hold[slot] += g.dt;
          if (c.hold[slot] >= HOLD) {
            c.hold[slot] = 0;
            if (getBuddy(slot).id !== c.id) {
              setBuddy(slot, c.id);
              const b = BUDDIES.find((x) => x.id === c.id)!;
              this.particles.sparkleBurst(c.x, c.y, 34, CANDY, 520);
              this.pulse.set(c.id, 1);
              g.audio.play('chime', 3);
              g.audio.speak(`${b.name}!`, { force: true });
            }
          }
        }
      }
    }
    for (const c of this.cards) {
      for (let s = 0; s < c.hold.length; s++) {
        if (!touching.has(`${c.id}:${s}`)) c.hold[s] = Math.max(0, c.hold[s] - g.dt * 2.5);
      }
    }
    for (const [k, v] of this.pulse) this.pulse.set(k, Math.max(0, v - g.dt * 1.6));
  }

  draw(ctx: CanvasRenderingContext2D, g: GameContext): void {
    const w = g.width;
    const h = g.height;
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#5a3fb0');
    bg.addColorStop(1, '#2a1a63');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.font = `900 78px ${FONT_STACK}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(60,20,110,0.8)';
    ctx.fillStyle = '#ffffff';
    ctx.strokeText('Pick your buddy!', w / 2, 90);
    ctx.fillText('Pick your buddy!', w / 2, 90);
    ctx.font = `800 40px ${FONT_STACK}`;
    ctx.lineWidth = 7;
    ctx.strokeText('Hold your hand on an animal friend', w / 2, 170);
    ctx.fillText('Hold your hand on an animal friend', w / 2, 170);
    ctx.restore();

    const shown = Math.max(2, new Set(g.frame.hands.map((x) => x.player)).size);
    for (const c of this.cards) {
      const b = BUDDIES.find((x) => x.id === c.id)!;
      const p = this.pulse.get(c.id) ?? 0;
      const k = 1 + p * 0.06;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(k, k);
      const grad = ctx.createLinearGradient(0, -CARD_H / 2, 0, CARD_H / 2);
      grad.addColorStop(0, b.color);
      grad.addColorStop(1, 'rgba(255,255,255,0.35)');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 40);
      ctx.fill();
      ctx.stroke();
      drawAnimalFace(ctx, b.id, 0, -22, 96);
      ctx.font = `900 54px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(60,20,110,0.75)';
      ctx.lineWidth = 8;
      ctx.strokeText(b.name, 0, 112);
      ctx.fillText(b.name, 0, 112);

      // Progress ring while a hand rests here.
      const hold = Math.max(...c.hold);
      if (hold > 0.02) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(0, -22, 140, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, hold / HOLD));
        ctx.stroke();
      }
      ctx.restore();

      // A gold star with the child's number on every buddy that is already taken.
      for (let s = 0; s < shown; s++) {
        if (getBuddy(s).id !== c.id) continue;
        const sx = c.x + CARD_W / 2 - 46 - s * 70;
        const sy = c.y - CARD_H / 2 + 46;
        star(ctx, sx, sy, 38, 17, '#ffd93d');
        ctx.font = `900 30px ${FONT_STACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#5a3a00';
        ctx.fillText(String(s + 1), sx, sy + 2);
      }
    }

    this.particles.draw(ctx);
    drawVignette(ctx, w, h, 0.25);
    drawHandCursors(ctx, g.frame, g.settings, { scale: 1.0, showRadius: false });
  }
}

export const buddyGame: GameDefinition = {
  id: 'buddies',
  title: 'Pick Your Buddy',
  voice: 'Pick your buddy!',
  adultLabel: 'Choose an animal for each child',
  colors: ['#ff8ad8', '#7a5bff'],
  create: () => new BuddyGame(),
};
