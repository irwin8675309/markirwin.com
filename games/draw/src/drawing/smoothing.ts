import type { Point } from '../types'

export interface XY {
  x: number
  y: number
}

export function midpoint(a: XY, b: XY): XY {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export function distance(a: XY, b: XY): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/**
 * Returns the smooth quadratic segment that ends at the newest point.
 * Keeping the control point at the previous sample produces the familiar
 * flowing curve used by most toy drawing apps.
 */
export function quadraticSegment(points: Point[], index: number): {
  from: XY
  control: XY
  to: XY
} | null {
  if (index < 2 || points.length <= index) return null
  const previous = points[index - 2]
  const control = points[index - 1]
  const current = points[index]
  return {
    from: midpoint(previous, control),
    control: { x: control.x, y: control.y },
    to: midpoint(control, current),
  }
}

/**
 * Light moving-average smoothing for imported or coalesced points. It is used
 * only for the live input stream; raw normalized positions stay in the saved
 * document so re-rendering is deterministic.
 */
export function smoothPoints(points: Point[], strength = 0.35): Point[] {
  if (points.length < 3) return points
  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return point
    const before = points[index - 1]
    const after = points[index + 1]
    return {
      ...point,
      x: point.x * (1 - strength) + ((before.x + after.x) / 2) * strength,
      y: point.y * (1 - strength) + ((before.y + after.y) / 2) * strength,
    }
  })
}

export function simplifyPoints(points: Point[], tolerance = 0.0008): Point[] {
  if (points.length < 3) return points
  const result: Point[] = [points[0]]
  for (let i = 1; i < points.length - 1; i += 1) {
    const previous = result[result.length - 1]
    const current = points[i]
    const next = points[i + 1]
    const dx = next.x - previous.x
    const dy = next.y - previous.y
    const lengthSquared = dx * dx + dy * dy
    const t = lengthSquared === 0
      ? 0
      : ((current.x - previous.x) * dx + (current.y - previous.y) * dy) / lengthSquared
    const projectionX = previous.x + t * dx
    const projectionY = previous.y + t * dy
    if (distance({ x: current.x, y: current.y }, { x: projectionX, y: projectionY }) > tolerance) {
      result.push(current)
    }
  }
  result.push(points[points.length - 1])
  return result
}