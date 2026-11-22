import type { GameContext } from '../types';
import { Particles } from './particles';
import { onSticker, type Sticker } from './stickers';
import { FONT_STACK } from '../../utils/font';
import { CANDY } from '../../utils/palette';

/**
 * Pops up whenever a sticker is earned, on top of whatever game is running:
 * the new sticker bounces in with sparkles and a cheer. Needs `attach()` /
 * `detach()` so it only listens while its game is on screen.
 */
export class StickerToast {
  private particles = new Particles();
  private current: { sticker: Sticker; reason: string; age: number } | null = null;
  private queue: Array<{ sticker: Sticker; reason: string }> = [];
  private stop: (() => void) | null = null;
  private justStarted = false;

  attach(): void {
    this.stop = onSticker((sticker, reason) => {
      this.queue.push({ sticker, reason });
    });
  }

  detach(): void {
    this.stop?.();
    this.stop = null;
  }

  update(g: GameContext): void {
    this.particles.update(g.dt);
    if (!this.current && this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.current = { ...next, age: 0 };
      this.justStarted = true;
    }
    if (this.current) {
      if (this.justStarted) {
        this.justStarted = false;
        g.audio.play('celebrate');
        g.audio.speak(
          this.current.reason === 'friend' ? 'A new friend and a new sticker!' : 'You got a new sticker!',
          { force: true },
        );
        this.particles.confetti(960, 300, 50, 700);
        this.particles.sparkleBurst(960, 430, 36, CANDY, 520);
      }
      this.current.age += g.dt;
      if (this.current.age > 5) this.current = null;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.particles.draw(ctx);
    const c = this.current;
    if (!c) return;
    const t = c.age;
    const pop = t < 0.5 ? 1 + Math.sin((t / 0.5) * Math.PI) * 0.25 : 1;
    const appear = Math.min(1, t / 0.35);
    const leave = t > 4.4 ? Math.max(0, 1 - (t - 4.4) / 0.6) : 1;
    const a = appear * leave;
    if (a <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = a;
    // soft backing card
    ctx.translate(960, 430);
    ctx.scale(pop * (0.6 + 0.4 * appear), pop * (0.6 + 0.4 * appear));
    ctx.fillStyle = 'rgba(40,20,80,0.55)';
    ctx.beginPath();
    ctx.roundRect(-330, -250, 660, 500, 60);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffd93d';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, -20, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.rotate(Math.sin(t * 4) * 0.08);
    c.sticker.draw(ctx, 0, -20, 120);
    ctx.restore();

    ctx.font = `900 58px ${FONT_STACK}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 9;
    ctx.strokeStyle = 'rgba(70,20,120,0.85)';
    ctx.fillStyle = '#ffffff';
    ctx.strokeText('New sticker!', 0, -205);
    ctx.fillText('New sticker!', 0, -205);
    ctx.font = `800 46px ${FONT_STACK}`;
    ctx.strokeText(c.sticker.name, 0, 175);
    ctx.fillText(c.sticker.name, 0, 175);
    ctx.restore();
  }
}
