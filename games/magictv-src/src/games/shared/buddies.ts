/**
 * "Buddies": each child gets an animal (bunny, kitty ...) so her hands have a
 * picture and a colour that she recognises as hers. Pictures are drawn in code,
 * so they never depend on an emoji font being installed.
 */

export interface Buddy {
  id: string;
  name: string;
  /** Glove / tag colour. */
  color: string;
}

export const BUDDIES: Buddy[] = [
  { id: 'bunny', name: 'Bunny', color: '#ff8ad8' },
  { id: 'kitty', name: 'Kitty', color: '#ffa94d' },
  { id: 'puppy', name: 'Puppy', color: '#d9a066' },
  { id: 'unicorn', name: 'Unicorn', color: '#b78bff' },
  { id: 'panda', name: 'Panda', color: '#9fb4d0' },
  { id: 'froggy', name: 'Froggy', color: '#5fdc7a' },
];

const DEFAULTS = ['bunny', 'kitty', 'puppy', 'unicorn'];
const KEY = 'magictv.buddies';

let chosen: string[] = load();

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(chosen));
  } catch {
    /* private mode etc.: choices just last until the page is closed */
  }
}

function byId(id: string): Buddy | undefined {
  return BUDDIES.find((b) => b.id === id);
}

/** The buddy for child number `slot` (0 = first child seen, 1 = second ...). */
export function getBuddy(slot: number): Buddy {
  const id = chosen[slot] ?? DEFAULTS[slot % DEFAULTS.length];
  return byId(id) ?? BUDDIES[slot % BUDDIES.length];
}

/** Gives `slot` this buddy. If another child has it, the two swap so nobody is left without. */
export function setBuddy(slot: number, id: string): void {
  if (!byId(id)) return;
  const before = getBuddy(slot).id;
  const next = chosen.slice();
  for (let i = 0; i < Math.max(next.length, 4); i++) next[i] = getBuddy(i).id;
  for (let i = 0; i < next.length; i++) {
    if (i !== slot && next[i] === id) next[i] = before;
  }
  next[slot] = id;
  chosen = next;
  save();
}

export function resetBuddies(): void {
  chosen = [];
  save();
}

function mix(hex: string, amt: number, toward: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(c + (toward - c) * amt);
  return `rgb(${f((n >> 16) & 255)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

/** A friendly animal face centred on (x, y) with head radius r. */
export function drawAnimalFace(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, r: number): void {
  const b = byId(id) ?? BUDDIES[0];
  const edge = mix(b.color, 0.42, 0);
  const skin = id === 'panda' ? '#ffffff' : mix(b.color, 0.62, 255);
  const ink = '#3a2350';
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.strokeStyle = edge;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, rot = 0) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.stroke();
  };
  const poly = (pts: Array<[number, number]>, fill: string) => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px * r, py * r) : ctx.moveTo(px * r, py * r)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.stroke();
  };

  // Things behind the head.
  switch (id) {
    case 'bunny':
      ellipse(-0.42 * r, -1.05 * r, 0.24 * r, 0.7 * r, skin, -0.12);
      ellipse(0.42 * r, -1.05 * r, 0.24 * r, 0.7 * r, skin, 0.12);
      ellipse(-0.42 * r, -1.0 * r, 0.1 * r, 0.5 * r, '#ffb3d9', -0.12);
      ellipse(0.42 * r, -1.0 * r, 0.1 * r, 0.5 * r, '#ffb3d9', 0.12);
      break;
    case 'kitty':
      poly([[-0.95, -0.15], [-0.78, -1.1], [-0.12, -0.7]], skin);
      poly([[0.95, -0.15], [0.78, -1.1], [0.12, -0.7]], skin);
      break;
    case 'puppy':
      ellipse(-0.92 * r, -0.05 * r, 0.3 * r, 0.62 * r, '#8a5a35', 0.25);
      ellipse(0.92 * r, -0.05 * r, 0.3 * r, 0.62 * r, '#8a5a35', -0.25);
      break;
    case 'panda':
      ellipse(-0.78 * r, -0.78 * r, 0.3 * r, 0.3 * r, '#2b2236');
      ellipse(0.78 * r, -0.78 * r, 0.3 * r, 0.3 * r, '#2b2236');
      break;
    case 'unicorn':
      ellipse(-0.7 * r, -0.8 * r, 0.2 * r, 0.3 * r, skin, -0.3);
      ellipse(0.7 * r, -0.8 * r, 0.2 * r, 0.3 * r, skin, 0.3);
      break;
    case 'froggy':
      ellipse(-0.5 * r, -0.85 * r, 0.34 * r, 0.34 * r, mix(b.color, 0.3, 255));
      ellipse(0.5 * r, -0.85 * r, 0.34 * r, 0.34 * r, mix(b.color, 0.3, 255));
      break;
  }

  // Head.
  ellipse(0, 0, r, r * 0.92, skin);

  // Extras on the head.
  if (id === 'unicorn') {
    poly([[-0.14, -0.78], [0.14, -0.78], [0, -1.5]], '#ffd93d');
    ctx.fillStyle = '#ff8ad8';
    ctx.beginPath();
    ctx.ellipse(-0.62 * r, -0.4 * r, 0.2 * r, 0.34 * r, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (id === 'panda') {
    ellipse(-0.38 * r, -0.08 * r, 0.22 * r, 0.3 * r, '#2b2236', 0.4);
    ellipse(0.38 * r, -0.08 * r, 0.22 * r, 0.3 * r, '#2b2236', -0.4);
  }

  // Eyes.
  ctx.fillStyle = id === 'panda' ? '#ffffff' : ink;
  for (const ex of [-0.38, 0.38]) {
    ctx.beginPath();
    ctx.ellipse(ex * r, -0.08 * r, 0.1 * r, 0.13 * r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (id !== 'panda') {
    ctx.fillStyle = '#ffffff';
    for (const ex of [-0.38, 0.38]) {
      ctx.beginPath();
      ctx.arc(ex * r + 0.035 * r, -0.13 * r, 0.035 * r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Nose and mouth.
  ctx.fillStyle = id === 'bunny' || id === 'unicorn' ? '#ff6fa8' : ink;
  ctx.beginPath();
  ctx.ellipse(0, 0.2 * r, id === 'puppy' ? 0.17 * r : 0.1 * r, 0.08 * r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.beginPath();
  if (id === 'froggy') {
    ctx.arc(0, 0.12 * r, 0.5 * r, 0.12 * Math.PI, 0.88 * Math.PI);
  } else {
    ctx.moveTo(0, 0.28 * r);
    ctx.quadraticCurveTo(-0.1 * r, 0.46 * r, -0.26 * r, 0.38 * r);
    ctx.moveTo(0, 0.28 * r);
    ctx.quadraticCurveTo(0.1 * r, 0.46 * r, 0.26 * r, 0.38 * r);
  }
  ctx.stroke();
  if (id === 'kitty') {
    ctx.lineWidth = Math.max(1.5, r * 0.05);
    for (const s of [-1, 1]) {
      for (const dy of [0.12, 0.26]) {
        ctx.beginPath();
        ctx.moveTo(s * 0.5 * r, dy * r);
        ctx.lineTo(s * 1.15 * r, (dy - 0.06 + (dy - 0.19) * 0.6) * r);
        ctx.stroke();
      }
    }
  }
  // Cheeks.
  ctx.fillStyle = 'rgba(255,110,140,0.45)';
  for (const ex of [-0.65, 0.65]) {
    ctx.beginPath();
    ctx.ellipse(ex * r, 0.22 * r, 0.14 * r, 0.09 * r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
