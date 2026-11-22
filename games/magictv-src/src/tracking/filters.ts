import type { Vec2 } from '../types';

/**
 * One Euro Filter (Casiez et al.) — low jitter when the hand is still,
 * low lag when the hand moves quickly. Ideal for children's fast movements.
 */
export class OneEuroFilter {
  private xPrev = 0;
  private dxPrev = 0;
  private tPrev = -1;
  private initialized = false;

  constructor(
    freq = 30,
    minCutoff = 1.2,
    beta = 0.5,
    dCutoff = 1.0,
  ) {
    this.freq = freq;
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  freq: number;
  minCutoff: number;
  beta: number;
  dCutoff: number;

  reset(value = 0): void {
    this.xPrev = value;
    this.dxPrev = 0;
    this.tPrev = -1;
    this.initialized = true;
  }

  filter(value: number, dt: number): number {
    if (!this.initialized || this.tPrev < 0) {
      this.reset(value);
      return value;
    }
    const d = Math.max(1e-4, dt);
    const t = this.tPrev + d;
    const dx = (value - this.xPrev) / d;
    const aD = 1 / (1 + (1 / (TAU_LOCAL * this.dCutoff)) / d);
    const dxHat = aD * dx + (1 - aD) * this.dxPrev;
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = 1 / (1 + (1 / (TAU_LOCAL * cutoff)) / d);
    const xHat = a * value + (1 - a) * this.xPrev;
    this.xPrev = xHat;
    this.dxPrev = dxHat;
    this.tPrev = t;
    return xHat;
  }
}

const TAU_LOCAL = Math.PI * 2;

export class Vec2Filter {
  readonly x = new OneEuroFilter();
  readonly y = new OneEuroFilter();

  constructor(freq = 30, minCutoff = 1.2, beta = 0.5) {
    this.x.minCutoff = minCutoff;
    this.x.beta = beta;
    this.x.freq = freq;
    this.y.minCutoff = minCutoff;
    this.y.beta = beta;
    this.y.freq = freq;
  }

  configure(minCutoff: number, beta: number): void {
    this.x.minCutoff = minCutoff;
    this.x.beta = beta;
    this.y.minCutoff = minCutoff;
    this.y.beta = beta;
  }

  reset(v: Vec2): void {
    this.x.reset(v.x);
    this.y.reset(v.y);
  }

  filter(v: Vec2, dt: number): Vec2 {
    return { x: this.x.filter(v.x, dt), y: this.y.filter(v.y, dt) };
  }
}

/** Maps 0..1 smoothing setting to filter parameters. */
export function smoothingToParams(s: number): { minCutoff: number; beta: number } {
  const t = Math.min(1, Math.max(0, s));
  return {
    minCutoff: 4.5 - 3.4 * t, // 4.5 (snappy) .. 1.1 (smooth)
    beta: 0.15 + 1.1 * t, // more speed-adaptive at high smoothing
  };
}