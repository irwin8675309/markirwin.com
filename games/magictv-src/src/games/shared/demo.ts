import type { GameContext } from '../types';
import { drawCuteHand, type HandPose } from './hud';
import { FONT_STACK } from '../../utils/font';

/**
 * "Show me" demos: the first time a game is opened, a friendly ghost hand shows
 * what to do for a few seconds. It disappears as soon as a real hand is moving
 * on screen, and once a child has joined in it is not shown again (this browser).
 */

export interface DemoScript {
  /** Words shown and spoken. */
  text: string;
  /** Where the ghost hand goes (world coordinates), looping. */
  path: Array<[number, number]>;
  pose: HandPose;
  /** Seconds for one trip along the path. */
  seconds: number;
}

export const DEMOS: Record<string, DemoScript> = {
  'bubble-pop': {
    text: 'Wave your hand over the bubbles to pop them!',
    path: [[520, 760], [900, 430], [1350, 650], [1000, 330]],
    pose: 'open',
    seconds: 5,
  },
  'finger-painting': {
    text: 'Point your finger and draw in the air!',
    path: [[520, 600], [760, 420], [1000, 640], [1240, 420], [1480, 640]],
    pose: 'point',
    seconds: 5,
  },
  'magic-character': {
    text: 'Wave your hands, or tickle his tummy!',
    path: [[620, 520], [1300, 420], [620, 520]],
    pose: 'open',
    seconds: 4,
  },
  'butterfly-garden': {
    text: 'Touch the flowers to help them grow!',
    path: [[450, 800], [900, 680], [1450, 800]],
    pose: 'open',
    seconds: 5,
  },
  'balloon-party': {
    text: 'Pop the balloons!',
    path: [[520, 820], [900, 520], [1400, 660], [1100, 360]],
    pose: 'open',
    seconds: 5,
  },
  'underwater-adventure': {
    text: 'Say hello to the fish!',
    path: [[520, 520], [1000, 720], [1400, 460]],
    pose: 'open',
    seconds: 5,
  },
  'color-count': {
    text: 'Pop the bubbles that match the colour!',
    path: [[520, 700], [900, 450], [1350, 650]],
    pose: 'open',
    seconds: 5,
  },
  'animal-sounds': {
    text: 'Hold your hand on the animal that makes the sound!',
    path: [[700, 700], [960, 650], [1460, 700]],
    pose: 'open',
    seconds: 5,
  },
  'shapes-letters': {
    text: 'Touch a shape or letter to hear its name!',
    path: [[620, 560], [960, 560], [1300, 700]],
    pose: 'open',
    seconds: 5,
  },
  'sticker-book': {
    text: 'Touch a sticker to see it sparkle!',
    path: [[520, 520], [900, 640], [1350, 520]],
    pose: 'open',
    seconds: 5,
  },
  buddies: {
    text: 'Hold your hand on an animal friend!',
    path: [[620, 620], [960, 420], [1300, 620]],
    pose: 'point',
    seconds: 5,
  },
};

/** Position along the (looping) path at time t. Pure, so it can be tested. */
export function demoPosition(script: DemoScript, t: number): { x: number; y: number; tap: number } {
  const pts = script.path;
  const n = pts.length;
  const trip = script.seconds;
  const u = ((t % trip) + trip) % trip / trip; // 0..1 around the loop
  const seg = u * n;
  const i = Math.floor(seg) % n;
  const f = seg - Math.floor(seg);
  const a = pts[i];
  const b = pts[(i + 1) % n];
  const e = f * f * (3 - 2 * f); // ease in/out so the hand glides and pauses at each stop
  // "tap" is 1 just as the hand arrives at a stop, fading to 0.
  const tap = f > 0.82 ? (f - 0.82) / 0.18 : 0;
  return { x: a[0] + (b[0] - a[0]) * e, y: a[1] + (b[1] - a[1]) * e, tap };
}

const KEY = 'magictv.demoSeen.';
const MAX_SECONDS = 10;
const PRESENT_SECONDS = 1.5;

function seen(id: string): boolean {
  try {
    return localStorage.getItem(KEY + id) === '1';
  } catch {
    return false;
  }
}

function markSeen(id: string): void {
  try {
    localStorage.setItem(KEY + id, '1');
  } catch {
    /* ignore */
  }
}

/** Makes every "show me" demo play again. */
export function resetDemos(): void {
  try {
    for (const id of Object.keys(DEMOS)) localStorage.removeItem(KEY + id);
  } catch {
    /* ignore */
  }
}

export class DemoOverlay {
  private elapsed = 0;
  private present = 0;
  private done = false;
  private alpha = 0;
  private spoke = false;

  private constructor(
    private id: string,
    private script: DemoScript,
  ) {}

  /** Returns null when there is no demo for this game or a child has already seen it. */
  static create(id: string): DemoOverlay | null {
    const script = DEMOS[id];
    if (!script || seen(id)) return null;
    return new DemoOverlay(id, script);
  }

  update(g: GameContext): void {
    const dt = g.dt;
    this.elapsed += dt;
    if (!this.done) {
      this.present = g.frame.hands.length > 0 ? this.present + dt : 0;
      if (!this.spoke && this.elapsed > 0.9) {
        this.spoke = true;
        g.audio.speak(this.script.text, { minGap: 20000 });
      }
      if (this.present >= PRESENT_SECONDS) {
        markSeen(this.id); // a child joined in: she has got it
        this.done = true;
      } else if (this.elapsed >= MAX_SECONDS) {
        this.done = true; // nobody there yet: try again next time
      }
    }
    const target = this.done ? 0 : this.elapsed > 0.5 ? 1 : 0;
    this.alpha += (target - this.alpha) * Math.min(1, dt * 5);
  }

  draw(ctx: CanvasRenderingContext2D, g: GameContext): void {
    if (this.alpha < 0.02) return;
    const t = this.elapsed;
    const { x, y, tap } = demoPosition(this.script, t);
    ctx.save();
    ctx.globalAlpha = this.alpha * 0.9;

    if (tap > 0) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10 * (1 - tap) + 2;
      ctx.beginPath();
      ctx.arc(x, y, 30 + tap * 90, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.95, 0.95);
    drawCuteHand(ctx, this.script.pose, '#ffd93d', t, 0.5, tap > 0.4);
    ctx.restore();

    // "Watch me!" tag and the instruction.
    ctx.font = `800 30px ${FONT_STACK}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = 'Watch me!';
    const tw = ctx.measureText(label).width + 44;
    const ty = y + 232 * 0.95 + 14;
    ctx.fillStyle = '#c08a00';
    ctx.beginPath();
    ctx.roundRect(x + 30 - tw / 2, ty - 24, tw, 48, 24);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x + 30, ty + 1);

    ctx.font = `800 54px ${FONT_STACK}`;
    const text = this.script.text;
    const w = ctx.measureText(text).width + 90;
    const by = g.height - 120;
    ctx.fillStyle = 'rgba(40,20,70,0.72)';
    ctx.beginPath();
    ctx.roundRect(g.width / 2 - w / 2, by - 48, w, 96, 48);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, g.width / 2, by + 2);
    ctx.restore();
  }
}
