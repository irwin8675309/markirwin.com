import type { GameContext, GameDefinition, GameInstance } from '../types';
import { Particles } from '../shared/particles';
import { getBuddy, drawAnimalFace } from '../shared/buddies';
import { drawHandCursors, drawVignette, slotsForFrame, resetSlots } from '../shared/hud';
import { drawBanner } from '../shared/ui';
import { FONT_STACK } from '../../utils/font';
import { CANDY } from '../../utils/palette';

export const HELLO_DONE_EVENT = 'magictv:hello-done';
const WAVE_NEEDED = 0.9; // seconds of waving
const WAVE_SPEED = 150; // px/s of fingertip movement that counts as a wave
const HOLD_RATE = 0.5; // a hand just held up still counts, at half the speed of a wave
const FINISH_AFTER = 2.6; // seconds after the last greeting
const GIVE_UP = 28; // seconds with nobody waving

interface Greeted {
  slot: number;
  x: number;
  at: number;
}

/**
 * Start-up "Wave hello!": each child waves once. That tells the game she is
 * there and that the camera can see her, and she meets her animal buddy. The
 * children are numbered left to right, and the game remembers where each sat.
 */
class HelloGame implements GameInstance {
  private particles = new Particles();
  private wave = [0, 0, 0, 0];
  private greeted: Greeted[] = [];
  private lastGreet = -1;
  private elapsed = 0;
  private done = false;
  private lastSeen = 0;

  enter(): void {
    resetSlots();
  }

  update(g: GameContext): void {
    this.elapsed += g.dt;
    this.particles.update(g.dt);
    if (g.frame.hands.length > 0) this.lastSeen = this.elapsed;
    const slots = slotsForFrame(g.frame);
    const waving = new Set<number>();
    const present = new Set<number>();
    const where = new Map<number, number>();
    for (const h of g.frame.hands) {
      if (!h.tracked) continue;
      const slot = Math.min(3, slots.get(h.player) ?? 0);
      where.set(slot, h.palm.x);
      present.add(slot);
      if (h.speed > WAVE_SPEED) waving.add(slot);
    }
    for (let s = 0; s < 4; s++) {
      if (this.greeted.some((x) => x.slot === s)) continue;
      this.wave[s] = waving.has(s)
        ? this.wave[s] + g.dt
        : present.has(s)
          ? this.wave[s] + g.dt * HOLD_RATE
          : Math.max(0, this.wave[s] - g.dt * 0.25);
      if (this.wave[s] >= WAVE_NEEDED) {
        const x = Math.max(300, Math.min(1620, where.get(s) ?? 960));
        this.greeted.push({ slot: s, x, at: this.elapsed });
        this.lastGreet = this.elapsed;
        const b = getBuddy(s);
        this.particles.sparkleBurst(x, 620, 40, CANDY, 560);
        g.audio.play('chime', 3);
        g.audio.speak(`Hi ${b.name}!`, { force: true });
      }
    }
    if (this.done) return;
    const finished =
      (this.greeted.length > 0 && this.elapsed - this.lastGreet > FINISH_AFTER) ||
      this.elapsed > GIVE_UP + (this.greeted.length > 0 ? 100 : 0);
    if (finished) {
      this.done = true;
      window.dispatchEvent(new Event(HELLO_DONE_EVENT));
    }
  }

  draw(ctx: CanvasRenderingContext2D, g: GameContext): void {
    const w = g.width;
    const h = g.height;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ffd9f1');
    grad.addColorStop(1, '#a9a0f5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const first = this.greeted.length === 0;
    drawBanner(ctx, first ? 'Wave hello!' : 'Hello!', w / 2, 150, 120);
    const t = g.time;
    if (first) {
      // A friendly pulsing hint hand.
      ctx.save();
      ctx.translate(w / 2, 470);
      ctx.rotate(Math.sin(t * 6) * 0.3);
      ctx.font = `900 220px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👋', 0, 0);
      ctx.restore();
      ctx.font = `800 44px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#5a2a7a';
      const hint =
        this.elapsed - this.lastSeen > 6 ? 'Stand where the camera can see you, then wave!' : 'Hold up your hand and wave at the TV';
      ctx.fillText(hint, w / 2, 700);
    }

    for (const gr of this.greeted) {
      const age = this.elapsed - gr.at;
      const pop = Math.min(1, age * 3);
      const b = getBuddy(gr.slot);
      ctx.save();
      ctx.translate(gr.x, 600 + Math.sin(t * 3 + gr.slot) * 10);
      ctx.scale(0.4 + 0.6 * pop, 0.4 + 0.6 * pop);
      drawAnimalFace(ctx, b.id, 0, 0, 150);
      ctx.restore();
      drawBanner(ctx, b.name, gr.x, 820, 64, '#ffffff', 'rgba(70,20,120,0.85)');
    }

    // Wave progress rings so a child (or grown-up) sees the camera noticed.
    this.particles.draw(ctx);
    drawVignette(ctx, w, h, 0.15);
    drawHandCursors(ctx, g.frame, g.settings, { scale: 1, showRadius: false });
  }
}

export const helloGame: GameDefinition = {
  id: 'hello',
  title: 'Wave Hello',
  voice: 'Wave hello!',
  adultLabel: 'Start-up hello',
  colors: ['#ffd9f1', '#a9a0f5'],
  create: () => new HelloGame(),
};
