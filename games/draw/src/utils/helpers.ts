export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function createId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp))
}

export function normalizePoint(x: number, y: number, width: number, height: number) {
  return {
    x: clamp(x / width, 0, 1),
    y: clamp(y / height, 0, 1),
  }
}

export function hexToRgba(hex: string, alpha = 255): [number, number, number, number] {
  const cleaned = hex.replace('#', '')
  const value = cleaned.length === 3
    ? cleaned.split('').map((char) => char + char).join('')
    : cleaned
  const number = Number.parseInt(value, 16)
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255, alpha]
}

export function rgbaToCss(rgba: [number, number, number, number]): string {
  return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3] / 255})`
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}