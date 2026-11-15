import { hexToRgba } from '../utils/helpers'

export interface FloodFillResult {
  imageData: ImageData
  changed: number
}

/**
 * Builds a one-pixel-per-cell barrier mask from the transparent line-art layer.
 * A small dilation closes hairline gaps in SVG outlines without visibly
 * shrinking the colorable area.
 */
export function buildBarrier(
  imageData: ImageData,
  alphaThreshold = 24,
  dilation = 1,
): Uint8Array {
  const { width, height, data } = imageData
  const source = new Uint8Array(width * height)
  for (let i = 0; i < source.length; i += 1) {
    if (data[i * 4 + 3] > alphaThreshold) source[i] = 1
  }
  if (dilation <= 0) return source
  return dilate(source, width, height, dilation)
}

export function dilate(source: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  if (radius <= 0) return source
  const horizontal = new Uint8Array(source.length)
  const window = radius * 2 + 1
  for (let y = 0; y < height; y += 1) {
    const row = y * width
    let count = 0
    for (let x = -radius; x <= radius; x += 1) {
      if (x >= 0 && x < width && source[row + x]) count += 1
    }
    for (let x = 0; x < width; x += 1) {
      horizontal[row + x] = count > 0 ? 1 : 0
      const removeX = x - radius
      const addX = x + radius + 1
      if (removeX >= 0 && source[row + removeX]) count -= 1
      if (addX < width && source[row + addX]) count += 1
    }
  }

  const result = new Uint8Array(source.length)
  for (let x = 0; x < width; x += 1) {
    let count = 0
    for (let y = -radius; y <= radius; y += 1) {
      if (y >= 0 && y < height && horizontal[y * width + x]) count += 1
    }
    for (let y = 0; y < height; y += 1) {
      result[y * width + x] = count > 0 ? 1 : 0
      const removeY = y - radius
      const addY = y + radius + 1
      if (removeY >= 0 && horizontal[removeY * width + x]) count -= 1
      if (addY < height && horizontal[addY * width + x]) count += 1
    }
  }
  void window
  return result
}

export function findOpenStart(
  barrier: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  searchRadius = 10,
): { x: number; y: number } | null {
  const startX = Math.max(0, Math.min(width - 1, Math.round(x)))
  const startY = Math.max(0, Math.min(height - 1, Math.round(y)))
  if (!barrier[startY * width + startX]) return { x: startX, y: startY }
  for (let radius = 1; radius <= searchRadius; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue
        const nx = startX + dx
        const ny = startY + dy
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
        if (!barrier[ny * width + nx]) return { x: nx, y: ny }
      }
    }
  }
  return null
}

function matches(
  data: Uint8ClampedArray,
  index: number,
  target: [number, number, number, number],
  tolerance: number,
): boolean {
  const offset = index * 4
  return (
    Math.abs(data[offset] - target[0]) <= tolerance &&
    Math.abs(data[offset + 1] - target[1]) <= tolerance &&
    Math.abs(data[offset + 2] - target[2]) <= tolerance &&
    Math.abs(data[offset + 3] - target[3]) <= tolerance
  )
}

/**
 * Iterative scanline flood fill. It runs against the color layer's pixel data,
 * uses the line-art barrier to stop at outlines, and compares against the
 * sampled target color so neighboring already-colored areas stay intact.
 */
export function floodFill(
  imageData: ImageData,
  barrier: Uint8Array,
  x: number,
  y: number,
  color: string,
  tolerance = 20,
): FloodFillResult {
  const start = findOpenStart(barrier, imageData.width, imageData.height, x, y)
  if (!start) return { imageData, changed: 0 }

  const { width, height, data } = imageData
  const startIndex = start.y * width + start.x
  const target: [number, number, number, number] = [
    data[startIndex * 4],
    data[startIndex * 4 + 1],
    data[startIndex * 4 + 2],
    data[startIndex * 4 + 3],
  ]
  const fill = hexToRgba(color, 255)
  if (
    Math.abs(target[0] - fill[0]) <= 1 &&
    Math.abs(target[1] - fill[1]) <= 1 &&
    Math.abs(target[2] - fill[2]) <= 1 &&
    target[3] === fill[3]
  ) {
    return { imageData, changed: 0 }
  }

  const stack: number[] = [startIndex]
  let changed = 0

  while (stack.length > 0) {
    const index = stack.pop() as number
    if (barrier[index]) continue
    if (!matches(data, index, target, tolerance)) continue
    const yIndex = Math.floor(index / width)
    let left = index % width
    let right = left
    while (left > 0 && !barrier[yIndex * width + left - 1] && matches(data, yIndex * width + left - 1, target, tolerance)) {
      left -= 1
    }
    while (
      right < width - 1 &&
      !barrier[yIndex * width + right + 1] &&
      matches(data, yIndex * width + right + 1, target, tolerance)
    ) {
      right += 1
    }

    for (let x = left; x <= right; x += 1) {
      const pixel = yIndex * width + x
      const offset = pixel * 4
      data[offset] = fill[0]
      data[offset + 1] = fill[1]
      data[offset + 2] = fill[2]
      data[offset + 3] = fill[3]
      changed += 1
    }

    for (const nextY of [yIndex - 1, yIndex + 1]) {
      if (nextY < 0 || nextY >= height) continue
      let inSpan = false
      let spanStart = left
      for (let x = left; x <= right + 1; x += 1) {
        const pixel = nextY * width + x
        const canFill = x <= right && !barrier[pixel] && matches(data, pixel, target, tolerance)
        if (canFill && !inSpan) {
          inSpan = true
          spanStart = x
        } else if (!canFill && inSpan) {
          inSpan = false
          if (x - 1 >= spanStart) stack.push(nextY * width + spanStart)
        }
      }
    }
  }

  return { imageData, changed }
}

export function floodFillCanvas(
  ctx: CanvasRenderingContext2D,
  barrier: Uint8Array,
  x: number,
  y: number,
  color: string,
  tolerance = 20,
): number {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
  const result = floodFill(imageData, barrier, x, y, color, tolerance)
  if (result.changed > 0) ctx.putImageData(result.imageData, 0, 0)
  return result.changed
}