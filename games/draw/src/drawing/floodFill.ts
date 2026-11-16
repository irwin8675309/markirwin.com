export interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3
    ? normalized.split("").map((part) => part + part).join("")
    : normalized;
  const value = Number.parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
    a: 255,
  };
}

/**
 * Builds a barrier mask from the original black line art. Dark or translucent
 * pixels block the fill, while the white page remains fillable. A one-pixel
 * dilation helps antialiasing and tiny joins keep paint from leaking.
 */
export function buildBarrierMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8Array {
  const mask = new Uint8Array(width * height);
  for (let index = 0; index < mask.length; index += 1) {
    const offset = index * 4;
    const alpha = data[offset + 3];
    if (alpha < 20) continue;
    const luminance = data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
    if (luminance < 232) mask[index] = 1;
  }

  const dilated = new Uint8Array(mask);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!mask[index]) continue;
      if (x > 0) dilated[index - 1] = 1;
      if (x < width - 1) dilated[index + 1] = 1;
      if (y > 0) dilated[index - width] = 1;
      if (y < height - 1) dilated[index + width] = 1;
    }
  }
  return dilated;
}

function colorMatches(
  data: Uint8ClampedArray,
  offset: number,
  target: Rgb,
  toleranceSquared: number,
): boolean {
  const alpha = data[offset + 3];
  if (target.a < 24) return alpha < 24;
  if (alpha < 24) return false;

  const dr = data[offset] - target.r;
  const dg = data[offset + 1] - target.g;
  const db = data[offset + 2] - target.b;
  const da = alpha - target.a;
  return dr * dr + dg * dg + db * db + da * da <= toleranceSquared;
}

/**
 * Fills one connected, line-bounded region. Returns the number of pixels
 * changed so callers can provide gentle feedback when a tap misses a region.
 */
export function floodFillRegion(
  data: Uint8ClampedArray,
  barrier: Uint8Array,
  width: number,
  height: number,
  startX: number,
  startY: number,
  fill: Rgb,
  tolerance = 42,
): number {
  const x = Math.max(0, Math.min(width - 1, Math.floor(startX)));
  const y = Math.max(0, Math.min(height - 1, Math.floor(startY)));
  const startIndex = y * width + x;

  let start = startIndex;
  if (barrier[start]) {
    let found = false;
    for (let radius = 1; radius <= 5 && !found; radius += 1) {
      for (let dy = -radius; dy <= radius && !found; dy += 1) {
        for (let dx = -radius; dx <= radius && !found; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const candidate = ny * width + nx;
          if (!barrier[candidate]) {
            start = candidate;
            found = true;
          }
        }
      }
    }
    if (!found) return 0;
  }

  const startOffset = start * 4;
  const target: Rgb = {
    r: data[startOffset],
    g: data[startOffset + 1],
    b: data[startOffset + 2],
    a: data[startOffset + 3],
  };

  if (target.a >= 24 && target.r === fill.r && target.g === fill.g && target.b === fill.b) {
    return 0;
  }

  const visited = new Uint8Array(width * height);
  const stack = new Int32Array(width * height);
  let stackLength = 0;
  stack[stackLength] = start;
  visited[start] = 1;
  stackLength += 1;
  const toleranceSquared = tolerance * tolerance;
  let changed = 0;

  while (stackLength > 0) {
    stackLength -= 1;
    const index = stack[stackLength];

    if (barrier[index]) {
      visited[index] = 2;
      continue;
    }
    const offset = index * 4;
    if (!colorMatches(data, offset, target, toleranceSquared)) {
      visited[index] = 2;
      continue;
    }

    data[offset] = fill.r;
    data[offset + 1] = fill.g;
    data[offset + 2] = fill.b;
    data[offset + 3] = 255;
    visited[index] = 2;
    changed += 1;

    const px = index % width;
    const py = (index - px) / width;
    if (px > 0 && visited[index - 1] === 0) {
      visited[index - 1] = 1;
      stack[stackLength] = index - 1;
      stackLength += 1;
    }
    if (px < width - 1 && visited[index + 1] === 0) {
      visited[index + 1] = 1;
      stack[stackLength] = index + 1;
      stackLength += 1;
    }
    if (py > 0 && visited[index - width] === 0) {
      visited[index - width] = 1;
      stack[stackLength] = index - width;
      stackLength += 1;
    }
    if (py < height - 1 && visited[index + width] === 0) {
      visited[index + width] = 1;
      stack[stackLength] = index + width;
      stackLength += 1;
    }
  }

  return changed;
}