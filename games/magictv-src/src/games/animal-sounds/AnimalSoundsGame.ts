import type { GameContext, GameDefinition, GameInstance } from '../types';
import { Particles } from '../shared/particles';
import { BUDDIES, drawAnimalFace } from '../shared/buddies';
import { drawHandCursors, drawVignette } from '../shared/hud';
import { drawBanner } from '../shared/ui';
import { grantSticker } from '../shared/stickers';
import { shuffle } from '../../utils/random';
import { FONT_STACK } from '../../utils/font';
import { star } from '../../utils/draw';

const SOUNDS: Record<string, string> = {
  bunny: 'Squeak',
  kitty: 'Meow',
  puppy: 'Woof',
  unicorn: 'Neigh',
  panda: 'Growl',
  froggy: 'Ribbit',
};
const CARD_W = 400;
const CARD_H = 440;
const HOLD = 0.45;
const ROUNDS_FOR_STAR = 5;

interface Card {
  id: string;
  x: number;
  y: number;
  hold: number;
  hop: number;
  shake: number;
}

/** "Who Says?": hear an animal sound, then touch the animal that makes it. No wrong-answer penalty. */
class AnimalSoundsGame implements GameInstance {
  private particles = new Particles();
  private cards: Card[] = [];
  private answer = 'kitty';
  private won = 0;
  private done = 0;
  private pause = 0;
  private answered = false;
  private lastTry = -10;
  private time = 0;

  enter(g: GameContext): void {
    this.newRound(g);
  }

  private newRound(g: GameContext): void {
    const ids = shuffle(BUDDIES.map((b) => b.id)).slice(0, 3);
    this.answer = ids[Math.floor(Math.random() * 3)];
    this.cards = ids.map((id, i) => ({ id, x: 460 + i * 500, y: 640, hold: 0, hop: 0, shake: 0 }));
    this.answered = false;
    g.audio.speak(`Who says ${SOUNDS[this.answer]}?`, { force: true });
  }

  update(g: GameContext): void {
    this.time = g.time;
    const dt = g.dt;
    this.particles.update(dt);
    for (const c of this.cards) {
      c.hop = Math.max(0, c.hop - dt * 1.3);
      c.shake = Math.max(0, c.shake - dt * 2.2);
    }
    if (this.pause > 0) {
      this.pause -= dt;
      if (this.pause <= 0) this.newRound(g);
      return;
    }
    if (this.answered) return;

    const touching = new Set<string>();
    for (const h of g.frame.hands) {
      if (!h.tracked || h.speed > 900) continue;
      for (const c of this.cards) {
        if (Math.abs(h.tip.x - c.x) < CARD_W / 2 && Math.abs(h.tip.y - c.y) < CARD_H / 2) {
          touching.add(c.id);
          c.hold += dt;
          if (c.hold >= HOLD) {
            c.hold = 0;
            this.choose(c, g);
            return;
          }
        }
      }
    }
    for (const c of this.cards) if (!touching.has(c.id)) c.hold = Math.max(0, c.hold - dt * 2.5);
  }

  private choose(c: Card, g: GameContext): void {
    if (c.id === this.answer) {
      this.answered = true;
      c.hop = 1;
      this.particles.sparkleBurst(c.x, c.y - 60, 30, undefined, 480);
      g.audio.play('boing');
      g.audio.speak(`${SOUNDS[c.id]}!`, { force: true });
      this.won++;
      this.pause = 2.6;
      if (this.won >= ROUNDS_FOR_STAR) {
        this.won = 0;
        this.done++;
        this.particles.confetti(960, 300, 60, 800);
        g.audio.play('celebrate');
        window.setTimeout(() => grantSticker('learn'), 1800);
      }
    } else {
      c.shake = 1;
      c.hold = 0;
      g.audio.play('boing');
      if (this.time - this.lastTry > 3) {
        this.lastTry = this.time;
        g.audio.speak('Hmm, try again!', { minGap: 3000 });
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, g: GameContext): void {
    const w = g.width;
    const h = g.height;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#7ad98b');
    bg.addColorStop(1, '#2f9e8f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    drawBanner(ctx, `Who says "${SOUNDS[this.answer]}"?`, w / 2, 120, 96, '#ffffff', 'rgba(20,80,70,0.85)');

    // progress stars
    for (let i = 0; i < ROUNDS_FOR_STAR; i++) {
      star(ctx, w / 2 - (ROUNDS_FOR_STAR - 1) * 38 + i * 76, 225, 28, 12, i < this.won ? '#ffd93d' : 'rgba(255,255,255,0.35)');
    }

    for (const c of this.cards) {
      const b = BUDDIES.find((x) => x.id === c.id)!;
      const correct = this.answered && c.id === this.answer;
      const jump = Math.sin(Math.min(1, c.hop) * Math.PI) * 60;
      const sx = Math.sin(c.shake * 30) * 14 * c.shake;
      ctx.save();
      ctx.translate(c.x + sx, c.y - jump);
      const grad = ctx.createLinearGradient(0, -CARD_H / 2, 0, CARD_H / 2);
      grad.addColorStop(0, b.color);
      grad.addColorStop(1, 'rgba(255,255,255,0.4)');
      ctx.fillStyle = grad;
      ctx.strokeStyle = correct ? '#ffd93d' : '#ffffff';
      ctx.lineWidth = correct ? 14 : 7;
      ctx.beginPath();
      ctx.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 48);
      ctx.fill();
      ctx.stroke();
      drawAnimalFace(ctx, b.id, 0, -30, 118);
      ctx.font = `900 56px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 9;
      ctx.strokeStyle = 'rgba(40,20,80,0.75)';
      ctx.fillStyle = '#ffffff';
      ctx.strokeText(b.name, 0, 160);
      ctx.fillText(b.name, 0, 160);
      if (c.hold > 0.02) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(0, -30, 170, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, c.hold / HOLD));
        ctx.stroke();
      }
      ctx.restore();
      if (correct) drawBanner(ctx, `${SOUNDS[c.id]}!`, c.x, c.y - CARD_H / 2 - 40 - jump, 80, '#ffd93d', 'rgba(60,30,0,0.85)');
    }

    this.particles.draw(ctx);
    drawVignette(ctx, w, h, 0.2);
    drawHandCursors(ctx, g.frame, g.settings, { scale: 1.0, showRadius: false });
  }
}

export const animalSoundsGame: GameDefinition = {
  id: 'animal-sounds',
  title: 'Who Says?',
  voice: 'Who says meow?',
  adultLabel: 'Animal sounds',
  colors: ['#5fdc7a', '#1f9e8f'],
  create: () => new AnimalSoundsGame(),
};
