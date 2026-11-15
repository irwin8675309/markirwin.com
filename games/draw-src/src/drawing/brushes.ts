import type { Point, StampShape, StrokeElement } from '../types'
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../config'
import { clamp, hexToRgba, seededRandom } from '../utils/helpers'
import { midpoint } from './smoothing'
import { pressureToWidth, tiltMagnitude } from './pressure'

interface PixelPoint {
  x: number
  y: number
}

function toPixel(point: Point, width: number, height: number): PixelPoint {
  return { x: point.x * width, y: point.y * height }
}

function hsl(hue: number, saturation = 82, lightness = 58, alpha = 1): string {
  return `hsla(${hue % 360}, ${saturation}%, ${lightness}%, ${alpha})`
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, size * 0.3)
  ctx.bezierCurveTo(-size * 0.55, -size * 0.18, -size * 0.25, -size * 0.58, 0, -size * 0.25)
  ctx.bezierCurveTo(size * 0.25, -size * 0.58, size * 0.55, -size * 0.18, 0, size * 0.3)
  ctx.fill()
  ctx.restore()
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? size * 0.5 : size * 0.22
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const px = Math.cos(angle) * radius
    const py = Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.fillStyle = color
  for (let i = 0; i < 5; i += 1) {
    const angle = (Math.PI * 2 * i) / 5
    ctx.beginPath()
    ctx.ellipse(
      Math.cos(angle) * size * 0.23,
      Math.sin(angle) * size * 0.23,
      size * 0.21,
      size * 0.28,
      angle,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  ctx.fillStyle = '#ffd93d'
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.16, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawButterfly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(-size * 0.22, -size * 0.08, size * 0.25, size * 0.2, -0.45, 0, Math.PI * 2)
  ctx.ellipse(size * 0.22, -size * 0.08, size * 0.25, size * 0.2, 0.45, 0, Math.PI * 2)
  ctx.ellipse(-size * 0.16, size * 0.18, size * 0.16, size * 0.18, 0.3, 0, Math.PI * 2)
  ctx.ellipse(size * 0.16, size * 0.18, size * 0.16, size * 0.18, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(48, 48, 68, 0.75)'
  ctx.lineWidth = Math.max(1, size * 0.05)
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.28)
  ctx.lineTo(0, size * 0.3)
  ctx.stroke()
  ctx.restore()
}

function drawSmile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#303044'
  ctx.beginPath()
  ctx.arc(-size * 0.17, -size * 0.08, size * 0.055, 0, Math.PI * 2)
  ctx.arc(size * 0.17, -size * 0.08, size * 0.055, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#303044'
  ctx.lineWidth = Math.max(1.5, size * 0.05)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.24, 0.15, Math.PI - 0.15)
  ctx.stroke()
  ctx.restore()
}

function drawStampShape(
  ctx: CanvasRenderingContext2D,
  shape: StampShape,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
) {
  switch (shape) {
    case 'heart':
      drawHeart(ctx, x, y, size, rotation, color)
      break
    case 'star':
      drawStar(ctx, x, y, size, rotation, color)
      break
    case 'flower':
      drawFlower(ctx, x, y, size, rotation, color)
      break
    case 'butterfly':
      drawButterfly(ctx, x, y, size, rotation, color)
      break
    case 'smile':
      drawSmile(ctx, x, y, size, rotation, color)
      break
  }
}

/**
 * Incremental stroke renderer. It is deliberately stateful so pointer moves can
 * be painted immediately without re-rendering the whole document each frame.
 */
export class StrokeRenderer {
  private readonly ctx: CanvasRenderingContext2D
  private readonly stroke: StrokeElement
  private readonly width: number
  private readonly height: number
  private readonly scale: number
  private readonly random: () => number
  private lastPoint: PixelPoint | null = null
  private previousMid: PixelPoint | null = null
  private pointCount = 0
  private totalDistance = 0
  private stampAccumulator = 0
  private stampIndex = 0

  constructor(
    ctx: CanvasRenderingContext2D,
    stroke: StrokeElement,
    width: number,
    height: number,
  ) {
    this.ctx = ctx
    this.stroke = stroke
    this.width = width
    this.height = height
    this.scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT)
    this.random = seededRandom(stroke.seed)
  }

  addPoint(point: Point) {
    const pixel = toPixel(point, this.width, this.height)
    if (!this.lastPoint) {
      this.drawDot(pixel, point)
      this.lastPoint = pixel
      this.pointCount = 1
      return
    }

    if (this.pointCount === 1) {
      this.drawSegment(this.lastPoint, pixel, point)
      this.previousMid = midpoint(this.lastPoint, pixel)
      this.pointCount = 2
    } else {
      const from = this.previousMid ?? this.lastPoint
      const control = this.lastPoint
      const to = midpoint(control, pixel)
      this.drawCurve(from, control, to, point)
      this.previousMid = to
      this.pointCount += 1
    }

    const segmentLength = Math.hypot(
      pixel.x - this.lastPoint.x,
      pixel.y - this.lastPoint.y,
    )
    this.totalDistance += segmentLength
    this.stampAccumulator += segmentLength
    this.lastPoint = pixel
  }

  finish() {
    if (!this.lastPoint) return
    if (this.previousMid && this.pointCount > 1) {
      const lastPoint = this.stroke.points[this.stroke.points.length - 1]
      this.drawSegment(this.previousMid, this.lastPoint, lastPoint ?? {
        x: this.lastPoint.x / this.width,
        y: this.lastPoint.y / this.height,
        pressure: 0.55,
        time: 0,
      })
    }
    if (this.stroke.brush === 'stamp' && this.pointCount === 1) {
      // The initial dot already placed a stamp.
    }
  }

  private brushColor(_point: Point): string {
    if (this.stroke.brush === 'rainbow' || this.stroke.color === 'rainbow') {
      const hue = (this.totalDistance * 0.42 + this.stroke.seed * 11) % 360
      return hsl(hue)
    }
    return this.stroke.color
  }

  private lineWidth(point: Point): number {
    return Math.max(
      1,
      this.stroke.size * this.scale * pressureToWidth(
        point.pressure,
        tiltMagnitude(point.tiltX, point.tiltY),
      ),
    )
  }

  private drawDot(point: PixelPoint, source: Point) {
    const ctx = this.ctx
    const width = this.lineWidth(source)
    const color = this.brushColor(source)
    ctx.save()
    if (this.stroke.brush === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(point.x, point.y, width / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      return
    }

    if (this.stroke.brush === 'stamp') {
      this.placeStamp(point, source)
      ctx.restore()
      return
    }

    if (this.stroke.brush === 'glitter') {
      this.paintLine(point, point, source, color, width, true)
      ctx.restore()
      return
    }

    if (this.stroke.brush === 'crayon') {
      this.paintCrayonDot(point, source, color, width)
      ctx.restore()
      return
    }

    if (this.stroke.brush === 'paintbrush') {
      ctx.fillStyle = color
      ctx.globalAlpha = 0.35
      ctx.beginPath()
      ctx.arc(point.x, point.y, width * 0.62, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 0.7
      ctx.beginPath()
      ctx.arc(point.x, point.y, width * 0.32, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      return
    }

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(point.x, point.y, width / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  private drawSegment(from: PixelPoint, to: PixelPoint, point: Point) {
    const color = this.brushColor(point)
    const width = this.lineWidth(point)
    if (this.stroke.brush === 'stamp') {
      this.placeStampsAlong(from, to, point)
      return
    }
    if (this.stroke.brush === 'crayon') {
      this.paintCrayonSegment(from, to, point, color, width)
      return
    }
    this.paintLine(from, to, point, color, width, this.stroke.brush === 'glitter')
  }

  private drawCurve(from: PixelPoint, control: PixelPoint, to: PixelPoint, point: Point) {
    const color = this.brushColor(point)
    const width = this.lineWidth(point)
    if (this.stroke.brush === 'stamp') {
      this.placeStampsAlong(from, to, point)
      return
    }
    if (this.stroke.brush === 'crayon') {
      this.paintCrayonCurve(from, control, to, point, color, width)
      return
    }
    this.paintCurve(from, control, to, point, color, width, this.stroke.brush === 'glitter')
  }

  private paintLine(
    from: PixelPoint,
    to: PixelPoint,
    _point: Point,
    color: string,
    width: number,
    sparkle: boolean,
  ) {
    const ctx = this.ctx
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (this.stroke.brush === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = '#000'
      ctx.lineWidth = width
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
      ctx.restore()
      return
    }

    if (this.stroke.brush === 'paintbrush') {
      ctx.strokeStyle = color
      ctx.globalAlpha = 0.34
      ctx.lineWidth = width * 1.1
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
      ctx.globalAlpha = 0.72
      ctx.lineWidth = width * 0.55
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
      ctx.restore()
      return
    }

    if (sparkle) {
      ctx.strokeStyle = color
      ctx.globalAlpha = 0.55
      ctx.lineWidth = Math.max(1.5, width * 0.3)
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
      ctx.globalAlpha = 1
      const length = Math.hypot(to.x - from.x, to.y - from.y)
      const count = Math.max(2, Math.ceil(length / Math.max(5, width * 0.32)))
      for (let i = 0; i < count; i += 1) {
        const t = this.random()
        const jitter = width * (0.55 + this.random() * 0.8)
        const angle = this.random() * Math.PI * 2
        const x = from.x + (to.x - from.x) * t + Math.cos(angle) * jitter
        const y = from.y + (to.y - from.y) * t + Math.sin(angle) * jitter
        const size = Math.max(1.5, width * (0.05 + this.random() * 0.1))
        ctx.fillStyle = this.random() > 0.35 ? color : '#ffffff'
        ctx.beginPath()
        ctx.moveTo(x, y - size)
        ctx.lineTo(x + size * 0.35, y)
        ctx.lineTo(x, y + size)
        ctx.lineTo(x - size * 0.35, y)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
      return
    }

    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    ctx.restore()
  }

  private paintCurve(
    from: PixelPoint,
    control: PixelPoint,
    to: PixelPoint,
    _point: Point,
    color: string,
    width: number,
    sparkle: boolean,
  ) {
    const ctx = this.ctx
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (this.stroke.brush === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = '#000'
      ctx.lineWidth = width
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.quadraticCurveTo(control.x, control.y, to.x, to.y)
      ctx.stroke()
      ctx.restore()
      return
    }
    if (this.stroke.brush === 'paintbrush') {
      ctx.strokeStyle = color
      ctx.globalAlpha = 0.32
      ctx.lineWidth = width * 1.1
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.quadraticCurveTo(control.x, control.y, to.x, to.y)
      ctx.stroke()
      ctx.globalAlpha = 0.7
      ctx.lineWidth = width * 0.52
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.quadraticCurveTo(control.x, control.y, to.x, to.y)
      ctx.stroke()
      ctx.restore()
      return
    }
    if (sparkle) {
      ctx.strokeStyle = color
      ctx.globalAlpha = 0.5
      ctx.lineWidth = Math.max(1.5, width * 0.3)
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.quadraticCurveTo(control.x, control.y, to.x, to.y)
      ctx.stroke()
      ctx.globalAlpha = 1
      for (let i = 0; i < 3; i += 1) {
        const t = this.random()
        const mt = 1 - t
        const x = mt * mt * from.x + 2 * mt * t * control.x + t * t * to.x + (this.random() - 0.5) * width * 1.7
        const y = mt * mt * from.y + 2 * mt * t * control.y + t * t * to.y + (this.random() - 0.5) * width * 1.7
        const size = Math.max(1.5, width * (0.05 + this.random() * 0.1))
        ctx.fillStyle = this.random() > 0.3 ? color : '#fff'
        ctx.beginPath()
        ctx.moveTo(x, y - size)
        ctx.lineTo(x + size * 0.35, y)
        ctx.lineTo(x, y + size)
        ctx.lineTo(x - size * 0.35, y)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
      return
    }
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.quadraticCurveTo(control.x, control.y, to.x, to.y)
    ctx.stroke()
    ctx.restore()
  }

  private paintCrayonDot(point: PixelPoint, pointData: Point, color: string, width: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = color
    ctx.globalAlpha = 0.74
    ctx.beginPath()
    ctx.arc(point.x, point.y, width / 2, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 3; i += 1) {
      const angle = this.random() * Math.PI * 2
      const radius = this.random() * width * 0.45
      const jitter = width * 0.08
      ctx.globalAlpha = 0.22
      ctx.beginPath()
      ctx.arc(
        point.x + Math.cos(angle) * radius + (this.random() - 0.5) * jitter,
        point.y + Math.sin(angle) * radius + (this.random() - 0.5) * jitter,
        Math.max(0.8, width * (0.06 + this.random() * 0.1)),
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }
    void pointData
    ctx.restore()
  }

  private paintCrayonSegment(from: PixelPoint, to: PixelPoint, point: Point, color: string, width: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.68
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    for (let i = 0; i < 3; i += 1) {
      const offset = width * (0.28 + this.random() * 0.2)
      const angle = this.random() * Math.PI * 2
      const dx = Math.cos(angle) * offset
      const dy = Math.sin(angle) * offset
      ctx.globalAlpha = 0.2
      ctx.lineWidth = Math.max(1, width * (0.16 + this.random() * 0.2))
      ctx.beginPath()
      ctx.moveTo(from.x + dx, from.y + dy)
      ctx.lineTo(to.x + dx, to.y + dy)
      ctx.stroke()
    }
    ctx.restore()
    void point
  }

  private paintCrayonCurve(
    from: PixelPoint,
    control: PixelPoint,
    to: PixelPoint,
    point: Point,
    color: string,
    width: number,
  ) {
    const ctx = this.ctx
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.66
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.quadraticCurveTo(control.x, control.y, to.x, to.y)
    ctx.stroke()
    for (let i = 0; i < 3; i += 1) {
      const dx = (this.random() - 0.5) * width * 0.72
      const dy = (this.random() - 0.5) * width * 0.72
      ctx.globalAlpha = 0.2
      ctx.lineWidth = Math.max(1, width * (0.14 + this.random() * 0.18))
      ctx.beginPath()
      ctx.moveTo(from.x + dx, from.y + dy)
      ctx.quadraticCurveTo(control.x + dx, control.y + dy, to.x + dx, to.y + dy)
      ctx.stroke()
    }
    ctx.restore()
    void point
  }

  private placeStamp(point: PixelPoint, pointData: Point) {
    const shape = this.stroke.stampShape ?? 'star'
    const size = Math.max(10, this.stroke.size * this.scale * 1.2)
    const rotation = (this.stampIndex * 0.7 + this.stroke.seed % 6) % (Math.PI * 2)
    drawStampShape(
      this.ctx,
      shape,
      point.x,
      point.y,
      size,
      rotation,
      this.stroke.brush === 'rainbow' || this.stroke.color === 'rainbow' ? hsl(this.totalDistance * 0.8) : this.stroke.color,
    )
    this.stampIndex += 1
    void pointData
  }

  private placeStampsAlong(from: PixelPoint, to: PixelPoint, point: Point) {
    const spacing = Math.max(18, this.stroke.size * this.scale * 1.35)
    if (spacing <= 0) return
    const length = Math.hypot(to.x - from.x, to.y - from.y)
    if (length === 0) return
    while (this.stampAccumulator >= spacing) {
      this.stampAccumulator -= spacing
      const t = clamp(1 - this.stampAccumulator / length, 0, 1)
      const x = from.x + (to.x - from.x) * t
      const y = from.y + (to.y - from.y) * t
      this.placeStamp({ x, y }, point)
    }
  }
}

export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: StrokeElement,
  width: number,
  height: number,
) {
  const renderer = new StrokeRenderer(ctx, stroke, width, height)
  for (const point of stroke.points) renderer.addPoint(point)
  renderer.finish()
}

export function strokeColorForPreview(brush: StrokeElement['brush'], color: string): string {
  if (brush === 'rainbow') return 'conic-gradient(#ff5b5b, #ffd93d, #5ec96d, #4aa8ff, #a879f2, #ff5b5b)'
  return color
}

export function colorWithAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgba(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}