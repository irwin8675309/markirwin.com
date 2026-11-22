import type { GameDefinition, GameInstance, GameContext } from '../types';
import type { GestureEvent } from '../../types';
import { Particles } from '../shared/particles';
import { getBuddy, drawAnimalFace } from '../shared/buddies';
import { drawCuteHand, drawHandCursors, drawVignette, handColor } from '../shared/hud';
import { countPlayers } from '../../tracking/players';
import { FONT_STACK } from '../../utils/font';
import { CANDY } from '../../utils/palette';

/** Seconds for the example hands to come together and move apart again. */
const CYCLE = 3.6;

/**
 * "High Five Friends": a practice game for two children. Two example hands show
 * the high five over and over; when two children do it for real, the team stars
 * (drawn on top of every game) light up. A child on her own is invited to clap.
 */
class HighFiveGame implements GameInstance {
  private particles = new Particles();
  private cheer = 0;
  private lastHit = -1;
  private aloneFor = 0;
  private handsSeen = 0;
  private t = 0;

  update(g: GameContext): void {
    this.t = g.time;
    this.particles.update(g.dt);
    this.cheer = Math.max(0, this.cheer - g.dt * 1.4);

    const hands = g.frame.hands.filter((h) => h.tracked);
    if (hands.length > 0) {
      this.handsSeen += g.dt;
      this.aloneFor = countPlayers(hands) <= 1 ? this.aloneFor + g.dt : 0;
    } else {
      this.aloneFor = 0;
    }

    // The example hands meet once per cycle: give them a little sparkle.
    const cycle = Math.floor(g.time / CYCLE);
    const phase = (g.time % CYCLE) / CYCLE;
    if (phase > 0.42 && cycle !== this.lastHit) {
      this.lastHit = cycle;
      this.particles.sparkleBurst(960, 430, 16, CANDY, 360);
      g.audio.play('pop');
    }
  }

  onGesture(e: GestureEvent, g: GameContext): void {
    const x = e.x ?? 960;
    const y = e.y ?? 540;
    if (e.type === 'highFive') {
      this.cheer = 1;
      this.particles.sparkleBurst(x, y, 40, CANDY, 640);
      this.particles.confetti(960, 260, 40, 900);
    } else if (e.type === 'clap') {
      this.particles.sparkleBurst(x, y, 18, CANDY, 420);
      g.audio.play('chime', 2);
    }
  }

  draw(ctx: CanvasRenderingContext2D, g: GameContext): void {
    const w = g.width;
    const h = g.height;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#ff9ad5');
    bg.addColorStop(1, '#7a5bff');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Slowly drifting sparkles.
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 26; i++) {
      const px = ((i * 211 + this.t * (10 + (i % 5) * 4)) % (w + 80)) - 40;
      const py = (i * 137) % h;
      ctx.beginPath();
      ctx.arc(px, py, 3 + (i % 4) * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // The two example hands, in the children's own colours.
    const phase = (this.t % CYCLE) / CYCLE;
    const meet = phase < 0.45 ? phase / 0.45 : phase < 0.62 ? 1 : 1 - (phase - 0.62) / 0.38;
    const e = meet * meet * (3 - 2 * meet);
    const gap = 330 - e * 270; // distance from the centre to each palm
    const bounce = 1 + this.cheer * 0.12 + (phase > 0.45 && phase < 0.6 ? 0.06 : 0);
    const buddies = [getBuddy(0), getBuddy(1)];
    [-1, 1].forEach((side, i) => {
      ctx.save();
      ctx.translate(960 + side * gap, 330);
      ctx.rotate(side * -0.12 * (1 - e) * 0 + side * 0.1);
      const k = 2.0 * bounce;
      ctx.scale(k * side, k);
      drawCuteHand(ctx, 'open', handColor(i), this.t, i * 2, e > 0.9 || this.cheer > 0.1);
      ctx.restore();
    });

    // Buddy faces under the hands.
    buddies.forEach((b, i) => {
      const x = 960 + (i === 0 ? -1 : 1) * (gap + 60);
      drawAnimalFace(ctx, b.id, x, 820, 62);
    });

    // Words.
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = `900 88px ${FONT_STACK}`;
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(70,20,120,0.8)';
    ctx.fillStyle = '#ffffff';
    ctx.strokeText('High five with a friend!', 960, 120);
    ctx.fillText('High five with a friend!', 960, 120);
    if (this.aloneFor > 8) {
      ctx.font = `800 54px ${FONT_STACK}`;
      ctx.lineWidth = 9;
      ctx.strokeText('No friend here? Clap your hands!', 960, 930);
      ctx.fillText('No friend here? Clap your hands!', 960, 930);
    } else {
      ctx.font = `800 50px ${FONT_STACK}`;
      ctx.lineWidth = 9;
      ctx.strokeText('Hold a hand up, then meet in the middle!', 960, 930);
      ctx.fillText('Hold a hand up, then meet in the middle!', 960, 930);
    }
    ctx.restore();

    this.particles.draw(ctx);
    drawVignette(ctx, w, h, 0.22);
    drawHandCursors(ctx, g.frame, g.settings, { scale: 1.0, showRadius: false });
  }
}

export const highFiveGame: GameDefinition = {
  id: 'high-five-friends',
  title: 'High Five Friends',
  voice: 'Give a high five to your friend!',
  adultLabel: 'Two-child high five practice',
  colors: ['#ff9ad5', '#7a5bff'],
  create: () => new HighFiveGame(),
};
