import { describe, expect, it } from 'vitest'
import { midpoint, quadraticSegment, simplifyPoints } from '../src/drawing/smoothing'
import { normalizePressure, pressureToWidth, tiltMagnitude } from '../src/drawing/pressure'
import { seededRandom } from '../src/utils/helpers'

describe('stroke smoothing', () => {
  it('returns a quadratic segment from three points', () => {
    const points = [
      { x: 0, y: 0, pressure: 0.5, time: 0 },
      { x: 0.2, y: 0.4, pressure: 0.6, time: 1 },
      { x: 0.5, y: 0.2, pressure: 0.7, time: 2 },
    ]
    const segment = quadraticSegment(points, 2)
    expect(segment).not.toBeNull()
    expect(segment?.from).toEqual(midpoint(points[0], points[1]))
    expect(segment?.control).toEqual({ x: 0.2, y: 0.4 })
    expect(segment?.to).toEqual(midpoint(points[1], points[2]))
  })

  it('simplifies nearly collinear points without dropping the endpoints', () => {
    const points = [
      { x: 0, y: 0, pressure: 0.5, time: 0 },
      { x: 0.25, y: 0.25, pressure: 0.5, time: 1 },
      { x: 0.5, y: 0.5, pressure: 0.5, time: 2 },
      { x: 0.75, y: 0.75, pressure: 0.5, time: 3 },
    ]
    const result = simplifyPoints(points, 0.001)
    expect(result[0]).toEqual(points[0])
    expect(result.at(-1)).toEqual(points.at(-1))
    expect(result.length).toBeLessThanOrEqual(2)
  })
})

describe('pressure and tilt', () => {
  it('makes light pressure visible but not too thin', () => {
    expect(pressureToWidth(0.05)).toBeGreaterThan(0.55)
    expect(pressureToWidth(1)).toBeGreaterThan(pressureToWidth(0.5))
    expect(pressureToWidth(1)).toBeLessThanOrEqual(1.34)
  })

  it('normalizes touch pressure to a comfortable finger value', () => {
    expect(normalizePressure(0.5, 'touch')).toBe(0.58)
    expect(normalizePressure(0, 'pen')).toBeGreaterThan(0.5)
  })

  it('computes tilt magnitude from pointer tilt values', () => {
    expect(tiltMagnitude(0, 0)).toBe(0)
    expect(tiltMagnitude(90, 0)).toBe(1)
    expect(tiltMagnitude(200, 0)).toBe(1)
  })
})

describe('deterministic randomness', () => {
  it('produces the same sequence for the same seed', () => {
    const a = seededRandom(12345)
    const b = seededRandom(12345)
    expect(Array.from({ length: 10 }, a)).toEqual(Array.from({ length: 10 }, b))
  })
})