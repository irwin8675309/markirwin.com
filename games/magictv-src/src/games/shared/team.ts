import type { GestureEvent } from '../../types';
import type { GameContext } from '../types';
import { Particles } from './particles';
import { countPlayers } from '../../tracking/players';
import { star } from '../../utils/draw';
import { FONT_STACK } from '../../utils/font';
import { CANDY } from '../../utils/palette';
import { drawHint } from './hud';

/** High fives needed to fill the team stars and trigger the big celebration. */
export const TEAM_STARS = 5;

/**
 * Team play, shared by every game (GameCanvas draws it on top of the game).
 * When two children high-five, a ring and "High five!" appear and a team star
 * lights up; five stars make a big "Teamwork!" fireworks show. Also gently
 * suggests a high five once, when two children seem to be playing.
 */
export class TeamPlay {
  private particles = new Particles();
  private rings: Array<{ x: number; y: number; age: number }> = [];
  stars = 0;
  private celebrating = 0;
  private lastFiveAt = -100;
  private twoSince = 0;
  private hintLeft = 0;
  private hintShown = false;
  private fireworkTimer = 0;
  private time = 0;

  onHighFive(e: GestureEvent, g: GameContext): void {
    if (this.celebrating > 0) return;
    const x = e.x ?? 960;
    const y = e.y ?? 540;
    this.lastFiveAt = this.time;
    this.hintLeft = 0;
    this.hintShown = true;
    this.rings.push({ x, y, age: 0 });
    this.particles.sparkleBurst(x, y, 22, CANDY, 420);
    this.particles.text('High five!', x, y - 120, '#ffffff', 84);
    g.audio.play('chime', this.stars);
    g.audio.play('sparkle');
    this.stars++;
    if (this.stars >= TEAM_STARS) {
      this.celebrating = 4;
      this.fireworkTimer = 0;
      g.audio.play('celebrate');
      g.audio.speak('Teamwork! You did it together!', { force: true });
      this.particles.confetti(960, 300, 70, 900);
    }
  }

  update(g: GameContext): void {
    const dt = g.dt;
    this.time += dt;
    this.particles.update(dt);
    for (const r of this.rings) r.age += dt;
    this.rings = this.rings.filter((r) => r.age < 0.8);

    if (this.celebrating > 0) {
      this.celebrating -= dt;
      this.fireworkTimer -= dt;
      if (this.fireworkTimer <= 0) {
        this.fireworkTimer = 0.45;
        this.particles.fireworks(300 + Math.random() * 1320, 220 + Math.random() * 420, CANDY[Math.floor(Math.random() * CANDY.length)]);
      }
      if (this.celebrating <= 0) this.stars = 0;
    }

    // Stars fade away if the children wander off to do something else.
    if (this.stars > 0 && this.celebrating <= 0 && this.time - this.lastFiveAt > 60) this.stars = 0;

    // Once per game: two children seem to be playing, so suggest a high five.
    const two = countPlayers(g.frame.hands) >= 2;
    this.twoSince = two ? this.twoSince + dt : 0;
    if (!this.hintShown && this.twoSince > 4) {
      this.hintShown = true;
      this.hintLeft = 5;
      g.audio.speak('Try a high five with your friend!', { minGap: 60000 });
    }
    this.hintLeft = Math.max(0, this.hintLeft - dt);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const r of this.rings) {
      const t = r.age / 0.8;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = '#ffd93d';
      ctx.lineWidth = 14 * (1 - t) + 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 40 + t * 260, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    this.particles.draw(ctx);

    if (this.hintLeft > 0) drawHint(ctx, '🖐️ Try a high five with your friend! 🖐️', Math.min(1, this.hintLeft));

    if (this.stars > 0 || this.celebrating > 0) {
      const y = 150;
      const gap = 74;
      const x0 = 960 - gap * (TEAM_STARS - 1) * 0.5;
      ctx.save();
      ctx.fillStyle = 'rgba(40,20,70,0.28)';
      ctx.beginPath();
      ctx.roundRect(x0 - 56, y - 46, gap * (TEAM_STARS - 1) + 112, 92, 46);
      ctx.fill();
      for (let i = 0; i < TEAM_STARS; i++) {
        const on = i < this.stars;
        const pulse = this.celebrating > 0 ? 1 + 0.18 * Math.sin(this.time * 12 + i) : 1;
        star(ctx, x0 + i * gap, y, 30 * pulse, 13 * pulse, on ? '#ffd93d' : 'rgba(255,255,255,0.25)');
      }
      if (this.celebrating > 0) {
        ctx.font = `900 64px ${FONT_STACK}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(120,40,160,0.7)';
        ctx.lineWidth = 8;
        ctx.strokeText('Teamwork!', 960, 260);
        ctx.fillText('Teamwork!', 960, 260);
      }
      ctx.restore();
    }
  }
}
