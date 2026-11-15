import { renderStroke, StrokeRenderer } from './brushes'
import { floodFillCanvas } from '../coloring/floodFill'
import type {
  BrushConfig,
  ColorElement,
  FillElement,
  Point,
  StrokeElement,
} from '../types'
import type { LoadedColoringTemplate } from '../templates/coloringPages'
import { createId } from '../utils/helpers'

export interface DrawingEngineOptions {
  onCommit?: (elements: ColorElement[]) => void
}

export class DrawingEngine {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private width = 1
  private height = 1
  private elements: ColorElement[] = []
  private redoStack: ColorElement[] = []
  private activeStroke: StrokeElement | null = null
  private activeRenderer: import('./brushes').StrokeRenderer | null = null
  private lineArt: LoadedColoringTemplate | null = null
  private readonly options: DrawingEngineOptions

  constructor(canvas: HTMLCanvasElement, options: DrawingEngineOptions = {}) {
    this.canvas = canvas
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('A drawing canvas could not be created')
    this.ctx = context
    this.options = options
  }

  resize(cssWidth: number, cssHeight: number, dpr = 1) {
    const width = Math.max(1, Math.round(cssWidth * dpr))
    const height = Math.max(1, Math.round(cssHeight * dpr))
    this.width = width
    this.height = height
    if (this.canvas.width === width && this.canvas.height === height) return
    this.canvas.width = width
    this.canvas.height = height
    this.renderAll()
  }

  resizeToResolution(resolution: number) {
    this.width = resolution
    this.height = resolution
    if (this.canvas.width === resolution && this.canvas.height === resolution) return
    this.canvas.width = resolution
    this.canvas.height = resolution
    this.renderAll()
  }

  setLineArt(lineArt: LoadedColoringTemplate | null) {
    this.lineArt = lineArt
    if (this.elements.some((element) => element.kind === 'fill')) this.renderAll()
  }

  getLineArt(): LoadedColoringTemplate | null {
    return this.lineArt
  }

  loadElements(elements: ColorElement[]) {
    this.elements = [...elements]
    this.redoStack = []
    this.activeStroke = null
    this.activeRenderer = null
    this.renderAll()
  }

  getElements(): ColorElement[] {
    return this.elements.map((element) => ({ ...element }))
  }

  isEmpty(): boolean {
    return this.elements.length === 0
  }

  begin(config: BrushConfig, point: Point) {
    const stroke: StrokeElement = {
      kind: 'stroke',
      id: createId('stroke'),
      brush: config.brush,
      color: config.color,
      size: config.size,
      seed: Math.floor(Math.random() * 2 ** 31),
      stampShape: config.stampShape,
      points: [point],
    }
    this.activeStroke = stroke
    this.activeRenderer = new StrokeRenderer(this.ctx, stroke, this.width, this.height)
    this.activeRenderer.addPoint(point)
  }

  addPoint(point: Point) {
    if (!this.activeStroke || !this.activeRenderer) return
    this.activeStroke.points.push(point)
    this.activeRenderer.addPoint(point)
  }

  endStroke() {
    if (!this.activeStroke || !this.activeRenderer) return
    this.activeRenderer.finish()
    this.elements.push(this.activeStroke)
    this.redoStack = []
    this.activeStroke = null
    this.activeRenderer = null
    this.options.onCommit?.(this.getElements())
  }

  cancelStroke() {
    if (!this.activeStroke) return
    this.activeStroke = null
    this.activeRenderer = null
    this.renderAll()
  }

  undo(): boolean {
    if (this.activeStroke) this.endStroke()
    const element = this.elements.pop()
    if (!element) return false
    this.redoStack.push(element)
    this.renderAll()
    this.options.onCommit?.(this.getElements())
    return true
  }

  redo(): boolean {
    const element = this.redoStack.pop()
    if (!element) return false
    this.elements.push(element)
    this.renderAll()
    this.options.onCommit?.(this.getElements())
    return true
  }

  clear(): boolean {
    if (this.elements.length === 0) return false
    this.elements = []
    this.redoStack = []
    this.renderAll()
    this.options.onCommit?.(this.getElements())
    return true
  }

  fillAt(x: number, y: number, color: string): boolean {
    if (!this.lineArt) return false
    const fill: FillElement = {
      kind: 'fill',
      id: createId('fill'),
      x,
      y,
      color,
    }
    const changed = this.applyFill(fill)
    if (!changed) return false
    this.elements.push(fill)
    this.redoStack = []
    this.options.onCommit?.(this.getElements())
    return true
  }

  private applyFill(fill: FillElement): boolean {
    if (!this.lineArt) return false
    const x = fill.x * this.canvas.width
    const y = fill.y * this.canvas.height
    const changed = floodFillCanvas(this.ctx, this.lineArt.barrier, x, y, fill.color, 18)
    return changed > 0
  }

  renderAll() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    for (const element of this.elements) {
      if (element.kind === 'stroke') {
        renderStroke(this.ctx, element, this.width, this.height)
      } else {
        this.applyFill(element)
      }
    }
  }

  canUndo(): boolean {
    return this.elements.length > 0 || this.activeStroke !== null
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  getHistoryState() {
    return { canUndo: this.canUndo(), canRedo: this.canRedo() }
  }
}