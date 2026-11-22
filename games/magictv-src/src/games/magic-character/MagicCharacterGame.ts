import type { GameContext, GameDefinition, GameInstance } from '../types';
import type { GestureEvent } from '../../types';
import { Particles } from '../shared/particles';
import { drawHandCursors, drawHint, drawVignette } from '../shared/hud';
import { TAU, clamp01, dist, damp, lerp } from '../../utils/math';
import { CANDY } from '../../utils/palette';
import { ellipse, glow, heart, roundRect, sparkle, star } from '../../utils/draw';
import { chance, pick, rand } from '../../utils/random';
import { FONT_STACK } from '../../utils/font';
import {
  CHARACTER_KINDS,
  CHARACTER_NAMES,
  drawCharacter,
  type CharacterKind,
  type CharacterPose,
} from './character';

type Action = 'idle' | 'wave' | 'jump' | 'dance' | 'celebrate' | 'funny' | 'kiss' | 'peek';

const ACTION_DURATION: Record<Action, number> = {
  idle: 0,
  wave: 2.2,
  jump: 1.5,
  dance: 3.2,
  celebrate: 2.6,
  funny: 1.8,
  kiss: 1.8,
  peek: 2.2,
};

class MagicCharacterGame implements GameInstance {
  private time = 0;
  private kindIndex = 0;
  private kind: CharacterKind = 'monster';
  private pose: CharacterPose = {
    x: 960,
    y: 900,
    scale: 1.18,
    squash: 1,
    lean: 0,
    armL: 0.25,
    armR: 0.25,
    lookX: 0,
    lookY: 0,
    blink: 0,
    mouth: 'smile',
    happy: 0.4,
    jumpY: 0,
    spin: 0,
    dance: 0,
    wave: 0,
  };
  private action: Action = 'idle';
  private actionT = 0;
  private jumpVel = 0;
  private jumpY = 0;
  private danceDir = 0;
  private blinkAt = 3;
  private blinkT = 0;
  private nextIdle = 6;
  private nextLook = 0;
  private lookTarget = { x: 0, y: 0 };
  private nextAppearance = 48;
  private lastDance = -10;
  private happyTarget = 0.35;
  private particles = new Particles();
  private greeting = 3;
  private speech = { text: '', until: 0 };
  private stars: Array<{ x: number; y: number; r: number; p: number }> = [];
  private lastVx = 0;

  enter(): void {
    for (let i = 0; i < 50; i++) {
      this.stars.push({ x: rand(0, 1920), y: rand(0, 900), r: rand(1.5, 4.5), p: rand(0, TAU) });
    }
    this.say(`Hi! I'm ${CHARACTER_NAMES[this.kind].split(' ')[0]}!`, 3.4);
  }

  private say(text: string, seconds = 2.6): void {
    this.speech = { text, until: this.time + seconds };
  }

  private startAction(action: Action, ctx: GameContext): void {
    if (this.action === action && this.actionT < 0.4) return;
    this.action = action;
    this.actionT = 0;
    if (action === 'jump') {
      this.jumpVel = -1080;
      ctx.audio.play('boing');
      this.particles.sparkleBurst(this.pose.x, 900, 12, CANDY, 260);
    } else if (action === 'wave') {
      ctx.audio.play('giggle');
      this.particles.hearts(this.pose.x + 140, 620, 3);
    } else if (action === 'celebrate') {
      ctx.audio.play('celebrate');
      this.particles.confetti(this.pose.x, 380, 60, 620);
      this.particles.fireworks(400, 300, '#ffd93d');
      this.particles.fireworks(1500, 260, '#6ff2ff');
      this.jumpVel = -780;
      this.say('Yay! We did it!', 2.4);
    } else if (action === 'funny') {
      ctx.audio.play('boing');
      this.say('Hee hee!', 1.8);
    } else if (action === 'kiss') {
      ctx.audio.play('heart');
      this.particles.hearts(this.pose.x, 480, 7);
      this.say('Mwah!', 1.6);
    } else if (action === 'dance') {
      ctx.audio.play('whoosh');
    } else if (action === 'peek') {
      ctx.audio.play('boing');
    }
  }

  onGesture(e: GestureEvent, ctx: GameContext): void {
    switch (e.type) {
      case 'wave':
        if (this.action !== 'celebrate') this.startAction('wave', ctx);
        break;
      case 'bothHandsUp':
        this.startAction('jump', ctx);
        break;
      case 'clap':
      case 'highFive':
        this.startAction('celebrate', ctx);
        break;
      case 'handsTogether':
        this.startAction('funny', ctx);
        break;
      case 'fastSwipe':
        this.startAction('dance', ctx);
        this.lastDance = this.time;
        break;
      case 'pinch':
        if (this.action === 'idle') this.startAction('kiss', ctx);
        break;
    }
  }

  update(ctx: GameContext): void {
    this.time += ctx.dt;
    this.greeting = Math.max(0, this.greeting - ctx.dt);
    this.actionT += ctx.dt;

    // Appearance changes now and then, to keep things fresh.
    if (this.time > this.nextAppearance) {
      this.nextAppearance = this.time + 52;
      this.kindIndex = (this.kindIndex + 1) % CHARACTER_KINDS.length;
      this.kind = CHARACTER_KINDS[this.kindIndex];
      this.particles.sparkleBurst(this.pose.x, 500, 40, CANDY, 500);
      ctx.audio.play('magic');
      this.say(`I'm ${CHARACTER_NAMES[this.kind].split(' ')[0]}!`, 2.8);
    }

    // Find the most interesting hand.
    const hands = ctx.frame.hands;
    let focus: { x: number; y: number; pointing: boolean } | null = null;
    let best = Infinity;
    for (const h of hands) {
      const d = dist(h.tip, { x: this.pose.x, y: 500 });
      const score = d - (h.pointing ? 260 : 0) - (h.pinchActive ? 160 : 0);
      if (score < best) {
        best = score;
        focus = { x: h.tip.x, y: h.tip.y, pointing: h.pointing || h.pinchActive };
      }
    }

    // Eyes follow the nearest hand.
    if (focus) {
      const dx = focus.x - this.pose.x;
      const dy = focus.y - 480;
      this.lookTarget = { x: clamp01((dx / 500 + 1) / 2) * 2 - 1, y: clamp01((dy / 500 + 1) / 2) * 2 - 1 };
      const near = dist(focus, { x: this.pose.x, y: 520 }) < 330;
      this.happyTarget = near || focus.pointing ? 1 : 0.6;
      if (near && focus.pointing && this.action === 'idle' && chance(ctx.dt * 0.7)) {
        this.startAction('peek', ctx);
      }
    } else {
      this.happyTarget = 0.35;
      if (this.time > this.nextLook) {
        this.nextLook = this.time + rand(2.5, 5);
        this.lookTarget = { x: rand(-0.7, 0.7), y: rand(-0.4, 0.4) };
      }
    }
    this.pose.lookX = damp(this.pose.lookX, this.lookTarget.x, 0.02, ctx.dt);
    this.pose.lookY = damp(this.pose.lookY, this.lookTarget.y, 0.02, ctx.dt);
    this.pose.happy = damp(this.pose.happy, this.happyTarget, 0.04, ctx.dt);

    // Blink every few seconds.
    if (this.time > this.blinkAt) {
      this.blinkT = 0.16;
      this.blinkAt = this.time + rand(2.6, 5.5);
    }
    this.blinkT = Math.max(0, this.blinkT - ctx.dt);
    this.pose.blink = this.blinkT > 0 ? 1 : 0;

    // Hands moving left/right make the character dance.
    if (hands.length > 0) {
      const avgVx = hands.reduce((s, h) => s + h.velocity.x, 0) / hands.length;
      this.lastVx = damp(this.lastVx, avgVx, 0.05, ctx.dt);
      if (Math.abs(this.lastVx) > 420 && this.time - this.lastDance > 2.2 && this.action === 'idle') {
        this.startAction('dance', ctx);
        this.lastDance = this.time;
        this.danceDir = Math.sign(this.lastVx);
      }
    }

    // Action state machine.
    const dur = ACTION_DURATION[this.action];
    if (this.action !== 'idle' && this.actionT > dur) {
      this.action = 'idle';
      this.actionT = 0;
    }

    // Idle initiative: the character invites play.
    if (this.action === 'idle' && this.time > this.nextIdle) {
      this.nextIdle = this.time + rand(6.5, 11);
      const opts: Action[] = ['wave', 'kiss', 'peek', 'wave', 'dance'];
      this.startAction(pick(opts), ctx);
    }

    // Jump physics.
    if (this.jumpY < 0 || this.jumpVel !== 0) {
      this.jumpY += this.jumpVel * ctx.dt;
      this.jumpVel += 2900 * ctx.dt;
      if (this.jumpY >= 0) {
        this.jumpY = 0;
        this.jumpVel = 0;
        this.pose.squash = 0.82;
        this.particles.sparkleBurst(this.pose.x, 905, 10, ['#ffffff', '#ffd1f0'], 200);
      }
    }

    // Pose targets.
    let armL = 0.25;
    let armR = 0.25;
    let lean = 0;
    let mouth: CharacterPose['mouth'] = 'smile';
    let happy = this.pose.happy;
    switch (this.action) {
      case 'wave':
        armR = 2.25 + Math.sin(this.time * 13) * 0.45;
        armL = 0.3;
        mouth = 'grin';
        happy = 1;
        break;
      case 'jump':
        armL = 2.5;
        armR = 2.5;
        mouth = 'o';
        happy = 1;
        break;
      case 'dance':
        this.pose.dance += ctx.dt * 9;
        armL = 1.15 + Math.sin(this.pose.dance) * 0.9;
        armR = 1.15 - Math.sin(this.pose.dance) * 0.9;
        lean = Math.sin(this.pose.dance) * 0.12 + this.danceDir * 0.05;
        mouth = this.pose.dance % TAU > Math.PI ? 'tongue' : 'grin';
        happy = 1;
        break;
      case 'celebrate':
        armL = 2.5 + Math.sin(this.time * 10) * 0.25;
        armR = 2.5 + Math.cos(this.time * 10) * 0.25;
        lean = Math.sin(this.time * 9) * 0.1;
        mouth = 'grin';
        happy = 1;
        break;
      case 'funny':
        armL = 1.9;
        armR = 2.1;
        lean = Math.sin(this.time * 7) * 0.08;
        mouth = 'wavy';
        happy = 1;
        break;
      case 'kiss':
        armR = 1.5 + Math.sin(this.time * 3) * 0.1;
        armL = 0.4;
        mouth = 'kiss';
        happy = 1;
        break;
      case 'peek':
        lean = Math.sin(this.time * 2) * 0.05;
        armR = 1.2;
        mouth = 'smile';
        happy = 1;
        break;
      default: {
        armL = 0.25 + Math.sin(this.time * 1.6) * 0.06;
        armR = 0.25 - Math.sin(this.time * 1.6) * 0.06;
        mouth = happy > 0.8 ? 'grin' : 'smile';
      }
    }

    this.pose.armL = damp(this.pose.armL, armL, 0.001, ctx.dt);
    this.pose.armR = damp(this.pose.armR, armR, 0.001, ctx.dt);
    this.pose.lean = damp(this.pose.lean, lean, 0.002, ctx.dt);
    this.pose.mouth = mouth;
    this.pose.jumpY = this.jumpY;
    this.pose.squash = damp(this.pose.squash, 1, 0.0005, ctx.dt);
    this.pose.wave = this.action === 'wave' ? 1 : 0;

    // Occasional hearts.
    if (this.pose.happy > 0.9 && chance(ctx.dt * 1.2)) {
      this.particles.spawn({
        x: this.pose.x + rand(-160, 160),
        y: 380,
        vy: rand(-90, -40),
        life: rand(1.4, 2.2),
        size: rand(12, 22),
        color: pick(['#ff8ad8', '#ff5d7a', '#ffd1f0']),
        shape: 'heart',
      });
    }

    this.particles.update(ctx.dt);
  }

  draw(ctx: CanvasRenderingContext2D, g: GameContext): void {
    // Stage
    const bg = ctx.createLinearGradient(0, 0, 0, 1080);
    bg.addColorStop(0, '#241150');
    bg.addColorStop(0.55, '#5a2380');
    bg.addColorStop(1, '#a63f86');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1920, 1080);

    // spotlight
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 960, 430, 780, 'rgba(255,240,200,0.16)');
    glow(ctx, 960, 900, 700, 'rgba(255,180,240,0.16)');
    ctx.restore();

    // curtains
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(dir < 0 ? 0 : 1920, 0);
      ctx.scale(dir < 0 ? 1 : -1, 1);
      const cg = ctx.createLinearGradient(0, 0, 240, 0);
      cg.addColorStop(0, '#3b1350');
      cg.addColorStop(0.6, '#7a2a72');
      cg.addColorStop(1, '#c0448f');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(230, 0);
      ctx.quadraticCurveTo(150, 520, 200, 1080);
      ctx.lineTo(0, 1080);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,240,0.18)';
      ctx.lineWidth = 6;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 55, 0);
        ctx.quadraticCurveTo(i * 42, 540, i * 50, 1080);
        ctx.stroke();
      }
      ctx.restore();
    }

    // stars
    for (const s of this.stars) {
      const tw = 0.3 + 0.7 * Math.abs(Math.sin(this.time * 1.4 + s.p));
      ctx.globalAlpha = tw * 0.75;
      sparkle(ctx, s.x, s.y, s.r * 2.2, '#ffffff', s.p);
    }
    ctx.globalAlpha = 1;

    // floor
    const fg = ctx.createLinearGradient(0, 820, 0, 1080);
    fg.addColorStop(0, 'rgba(255,190,240,0.05)');
    fg.addColorStop(1, 'rgba(90,30,90,0.65)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, 820, 1920, 260);
    ellipse(ctx, 960, 930, 520, 70, 'rgba(255,210,250,0.10)');

    drawCharacter(ctx, this.kind, this.pose, this.time);
    this.particles.draw(ctx);

    // Speech bubble
    if (this.speech.until > this.time) {
      this.drawSpeech(ctx, this.speech.text, clamp01((this.speech.until - this.time) / 0.4));
    }

    drawVignette(ctx, 1920, 1080, 0.32);
    drawHandCursors(ctx, g.frame, g.settings, { scale: 1.05, showRadius: false });

    if (this.greeting > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.greeting);
      drawHint(ctx, 'Can you make me dance?', 0.95);
      ctx.restore();
    }
    drawHint(ctx, 'Magic Character', 0.32);
  }

  private drawSpeech(ctx: CanvasRenderingContext2D, text: string, alpha: number): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `800 46px ${FONT_STACK}`;
    const w = ctx.measureText(text).width + 90;
    const x = 960 - w / 2;
    const y = 220;
    ctx.shadowColor = 'rgba(40,10,60,0.35)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#fffdf7';
    roundRect(ctx, x, y, w, 92, 46);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.beginPath();
    ctx.moveTo(930, y + 88);
    ctx.lineTo(960, y + 132);
    ctx.lineTo(990, y + 88);
    ctx.fill();
    ctx.fillStyle = '#4a2a5a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 960, y + 48);
    ctx.restore();
  }
}

export const magicCharacterGame: GameDefinition = {
  id: 'magic-character',
  title: 'Magic Character',
  adultLabel: 'Magic Character',
  voice: 'Can you make me dance?',
  colors: ['#b78bff', '#ff8ad8'],
  create: () => new MagicCharacterGame(),
};

export { MagicCharacterGame };