import type { InputMode, Point } from '../types'
import { clamp } from '../utils/helpers'
import { normalizePressure } from './pressure'

export interface InputManagerCallbacks {
  getMode: () => InputMode
  getRect: () => DOMRect
  onBegin: (point: Point, pointerType: string) => void
  onMove: (points: Point[]) => void
  onEnd: () => void
}

/**
 * Translates Pointer Events into normalized drawing points.
 *
 * Palm protection is best-effort in a browser: when a Pencil pointer is seen,
 * touch pointers are ignored until the Pencil lifts and a short grace period
 * passes. This avoids most accidental palm marks while still letting fingers
 * draw normally when no Pencil is in use.
 */
export class InputManager {
  private readonly element: HTMLCanvasElement
  private readonly callbacks: InputManagerCallbacks
  private activePointerId: number | null = null
  private penEngaged = false
  private penGraceUntil = 0
  private attached = false

  constructor(element: HTMLCanvasElement, callbacks: InputManagerCallbacks) {
    this.element = element
    this.callbacks = callbacks
    this.attach()
  }

  private attach() {
    if (this.attached) return
    this.element.addEventListener('pointerdown', this.handlePointerDown)
    this.element.addEventListener('pointermove', this.handlePointerMove)
    this.element.addEventListener('pointerup', this.handlePointerUp)
    this.element.addEventListener('pointercancel', this.handlePointerCancel)
    this.element.addEventListener('lostpointercapture', this.handleLostCapture)
    this.element.addEventListener('contextmenu', this.handleContextMenu)
    this.attached = true
  }

  destroy() {
    this.element.removeEventListener('pointerdown', this.handlePointerDown)
    this.element.removeEventListener('pointermove', this.handlePointerMove)
    this.element.removeEventListener('pointerup', this.handlePointerUp)
    this.element.removeEventListener('pointercancel', this.handlePointerCancel)
    this.element.removeEventListener('lostpointercapture', this.handleLostCapture)
    this.element.removeEventListener('contextmenu', this.handleContextMenu)
  }

  private handleContextMenu = (event: Event) => {
    event.preventDefault()
  }

  private isAllowed(pointerType: string): boolean {
    const mode = this.callbacks.getMode()
    const isPen = pointerType === 'pen'
    if (mode === 'pencil') return isPen
    if (mode === 'finger') return !isPen
    if (isPen) return true
    const now = performance.now()
    if (this.penEngaged) return false
    if (now < this.penGraceUntil) return false
    return true
  }

  private handlePointerDown = (event: PointerEvent) => {
    if (this.activePointerId !== null) return
    if (!this.isAllowed(event.pointerType)) return
    event.preventDefault()
    if (event.pointerType === 'pen') {
      this.penEngaged = true
      this.penGraceUntil = 0
    }
    this.activePointerId = event.pointerId
    try {
      this.element.setPointerCapture(event.pointerId)
    } catch {
      // Synthetic pointer events and a few older browsers do not support
      // pointer capture. Drawing still works without it.
    }
    const point = this.toPoint(event)
    this.callbacks.onBegin(point, event.pointerType)
  }

  private handlePointerMove = (event: PointerEvent) => {
    if (event.pointerId !== this.activePointerId) return
    event.preventDefault()
    const coalesced = typeof event.getCoalescedEvents === 'function'
      ? event.getCoalescedEvents()
      : [event]
    const events = coalesced.length > 0 ? coalesced : [event]
    const points = events.map((item) => this.toPoint(item))
    if (points.length > 0) this.callbacks.onMove(points)
  }

  private handlePointerUp = (event: PointerEvent) => {
    if (event.pointerId !== this.activePointerId) return
    event.preventDefault()
    const point = this.toPoint(event)
    this.callbacks.onMove([point])
    this.finishPointer(event.pointerType)
  }

  private handlePointerCancel = (event: PointerEvent) => {
    if (event.pointerId !== this.activePointerId) return
    this.finishPointer(event.pointerType)
  }

  private handleLostCapture = (event: PointerEvent) => {
    if (event.pointerId !== this.activePointerId) return
    this.finishPointer(event.pointerType)
  }

  private finishPointer(pointerType: string) {
    if (this.activePointerId !== null && this.element.hasPointerCapture(this.activePointerId)) {
      this.element.releasePointerCapture(this.activePointerId)
    }
    this.activePointerId = null
    if (pointerType === 'pen') {
      this.penEngaged = false
      this.penGraceUntil = performance.now() + 1200
    }
    this.callbacks.onEnd()
  }

  private toPoint(event: PointerEvent): Point {
    const rect = this.callbacks.getRect()
    const x = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1)
    const y = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1)
    const pointerType = event.pointerType
    return {
      x,
      y,
      pressure: normalizePressure(event.pressure, pointerType),
      tiltX: event.tiltX,
      tiltY: event.tiltY,
      time: event.timeStamp,
    }
  }
}