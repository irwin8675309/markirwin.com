/** Bright, cheerful, child-friendly palettes. Original colour choices. */

export const BUBBLE_HUES = [190, 320, 45, 275, 150, 350, 210, 25];

export const RAINBOW = ['#ff5d7a', '#ff9f43', '#ffe14d', '#5fdc7a', '#4dc4ff', '#9a7bff'];

export const CANDY = ['#ff5d7a', '#ff9f43', '#ffe14d', '#5fdc7a', '#4dc4ff', '#b78bff', '#ff8ad8'];

export const GARDEN_COLORS = ['#ff6b9d', '#ffd93d', '#8b6bff', '#ff8c42', '#4ecdc4', '#ff5d8f', '#a78bfa'];

export const FISH_COLORS = ['#ffd93d', '#ff8c42', '#ff6b9d', '#4ecdc4', '#8b6bff', '#5ad1ff', '#ff5d7a'];

export const SKY_TOP = '#2b1b5a';
export const SKY_BOTTOM = '#6a3fb5';

export const PAPER = '#fffdf7';

export function rainbowAt(t: number, alpha = 1): string {
  const n = RAINBOW.length;
  const x = (((t % 1) + 1) % 1) * n;
  const i = Math.floor(x);
  const f = x - i;
  const a = RAINBOW[i % n];
  const b = RAINBOW[(i + 1) % n];
  return mixHex(a, b, f, alpha);
}

export function mixHex(a: string, b: string, t: number, alpha = 1): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255;
  const ag = (pa >> 8) & 255;
  const ab = pa & 255;
  const br = (pb >> 16) & 255;
  const bg = (pb >> 8) & 255;
  const bb = pb & 255;
  return `rgba(${Math.round(ar + (br - ar) * t)}, ${Math.round(ag + (bg - ag) * t)}, ${Math.round(
    ab + (bb - ab) * t,
  )}, ${alpha})`;
}