import { clamp } from '../utils/helpers'

/**
 * Converts pointer pressure into a comfortable, visible brush width.
 * The curve intentionally starts above zero so a light preschool grip still
 * produces a satisfying mark. Tilt is used as a subtle width/opacity accent
 * where the browser exposes it.
 */
export function pressureToWidth(pressure: number, tiltMagnitude = 0): number {
  const safePressure = clamp(Number.isFinite(pressure) ? pressure : 0.55, 0.02, 1)
  const curved = 0.58 + 0.72 * Math.pow(safePressure, 0.65)
  const tiltBonus = clamp(tiltMagnitude, 0, 1) * 0.08
  return clamp(curved + tiltBonus, 0.5, 1.34)
}

export function tiltMagnitude(tiltX = 0, tiltY = 0): number {
  return Math.min(1, Math.hypot(tiltX, tiltY) / 90)
}

export function normalizePressure(rawPressure: number, pointerType: string): number {
  if (pointerType === 'pen') {
    return clamp(rawPressure > 0 ? rawPressure : 0.55, 0.04, 1)
  }
  // Touch screens on iPad usually report a constant mid pressure. A fixed,
  // child-friendly value keeps finger strokes consistent and predictable.
  return 0.58
}