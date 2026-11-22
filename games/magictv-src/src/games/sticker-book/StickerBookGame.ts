import type { GameContext, GameDefinition, GameInstance } from '../types';
import { Particles } from '../shared/particles';
import { STICKERS, hasSticker, ownedStickers, playProgress } from '../shared/stickers';
import { drawHandCursors, drawVignette, handTouchesCircle } from '../shared/hud';
import { FONT_STACK } from '../../utils/font';
import { CANDY } from '../../utils/palette';

const COLS = 7;

/** "My Sticker Book": every sticker earned so far; touch one to make it wiggle and hear its name. */
class StickerBookGame implements GameInstance {
  private particles = new Particles();
  private wiggle = new Map<string, number>();
  private cooldown = new Map<string, number>();
  private t = 0;

  private cell(i: number): { x: number; y: number } {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    return { x: 270 + col * 230, y: 340 + row * 270 };
  }

  update(g: GameContext): void {
    this.t = g.time;
    this.particles.update(g.dt);
    for (const [k, v] of this.wiggle) this.wiggle.set(k, Math.max(0, v - g.dt * 1.5));
    STICKERS.forEach((s, i) => {
      if (!hasSticker(s.id)) return;
      const { x, y } = this.cell(i);
      const cd = (this.cooldown.get(s.id) ?? 0) - g.dt;
      this.cooldown.set(s.id, cd);
      if (cd > 0) return;
      for (const h of g.frame.hands) {
        if (h.tracked && handTouchesCircle(h, x, y, 85)) {
          this.cooldown.set(s.id, 1.4);
          this.wiggle.set(s.id, 1);
          this.particles.sparkleBurst(x, y, 16, CANDY, 320);
          g.audio.play('chime', i % 5);
          g.audio.speak(s.name, { force: true });
          break;
        }
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D, g: GameContext): void {
    const w = g.width;
    const h = g.height;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#ffd9ec');
    bg.addColorStop(1, '#b9a6ff');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const have = ownedStickers().length;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = `900 84px ${FONT_STACK}`;
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(90,30,140,0.85)';
    ctx.fillStyle = '#ffffff';
    ctx.strokeText('My Sticker Book', w / 2, 100);
    ctx.fillText('My Sticker Book', w / 2, 100);
    ctx.font = `800 46px ${FONT_STACK}`;
    ctx.lineWidth = 8;
    const sub = have >= STICKERS.length ? 'Wow! You have them all!' : `${have} of ${STICKERS.length} stickers`;
    ctx.strokeText(sub, w / 2, 178);
    ctx.fillText(sub, w / 2, 178);
    ctx.restore();

    STICKERS.forEach((s, i) => {
      const { x, y } = this.cell(i);
      const got = hasSticker(s.id);
      const wig = this.wiggle.get(s.id) ?? 0;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(this.t * 14) * 0.18 * wig + ((i % 3) - 1) * 0.04);
      const k = 1 + wig * 0.16;
      ctx.scale(k, k);
      ctx.fillStyle = got ? '#ffffff' : 'rgba(255,255,255,0.45)';
      ctx.strokeStyle = got ? '#ffffff' : 'rgba(255,255,255,0.7)';
      ctx.shadowColor = 'rgba(60,20,100,0.3)';
      ctx.shadowBlur = got ? 14 : 0;
      ctx.beginPath();
      ctx.roundRect(-96, -96, 192, 192, 36);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (got) {
        s.draw(ctx, 0, 0, 70);
      } else {
        ctx.globalAlpha = 0.5;
        s.draw(ctx, 0, 0, 70);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(150,130,190,0.92)';
        ctx.fillRect(-96, -96, 192, 192);
        ctx.globalCompositeOperation = 'source-over';
        ctx.font = `900 64px ${FONT_STACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText('?', 0, 4);
      }
      ctx.restore();
    });

    // How close the next play sticker is.
    const p = playProgress();
    if (have < STICKERS.length) {
      ctx.save();
      const bx = w / 2 - 300;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.roundRect(bx, 1000, 600, 26, 13);
      ctx.fill();
      ctx.fillStyle = '#ff8ad8';
      ctx.beginPath();
      ctx.roundRect(bx, 1000, Math.max(26, 600 * p), 26, 13);
      ctx.fill();
      ctx.font = `800 30px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#5a2a7a';
      ctx.fillText('Keep playing for the next sticker!', w / 2, 972);
      ctx.restore();
    }

    this.particles.draw(ctx);
    drawVignette(ctx, w, h, 0.18);
    drawHandCursors(ctx, g.frame, g.settings, { scale: 0.95, showRadius: false });
  }
}

export const stickerBookGame: GameDefinition = {
  id: 'sticker-book',
  title: 'My Sticker Book',
  voice: 'Look at your stickers!',
  adultLabel: 'Sticker collection',
  colors: ['#ff9ad5', '#8e6bff'],
  create: () => new StickerBookGame(),
};
