import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import type {
  ArtworkDocument,
  BrushConfig,
  ColorElement,
  ExperienceMode,
  InputMode,
  Point,
  StudioMode,
} from '../types'
import { COLORING_RESOLUTION } from '../config'
import { DrawingEngine } from '../drawing/DrawingEngine'
import { InputManager } from '../drawing/InputManager'
import {
  coloringTemplateManager,
  type ColoringTemplate,
  type LoadedColoringTemplate,
} from '../templates/coloringPages'
import { soundManager } from '../audio/SoundManager'

export interface DrawingCanvasHandle {
  undo: () => void
  redo: () => void
  clear: () => void
  getElements: () => ColorElement[]
  getCanvas: () => HTMLCanvasElement | null
  getLineImage: () => HTMLImageElement | null
  isEmpty: () => boolean
  loadElements: (elements: ColorElement[]) => void
}

interface DrawingCanvasProps {
  mode: StudioMode
  template?: ColoringTemplate
  brush: BrushConfig
  inputMode: InputMode
  experience: ExperienceMode
  initialDocument?: ArtworkDocument
  fillMode?: boolean
  onElementsChange: (elements: ColorElement[]) => void
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void
  onFill?: () => void
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(function DrawingCanvas(
  {
    mode,
    template,
    brush,
    inputMode,
    experience,
    initialDocument,
    fillMode = false,
    onElementsChange,
    onHistoryChange,
    onFill,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const lineCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const engineRef = useRef<DrawingEngine | null>(null)
  const inputRef = useRef<InputManager | null>(null)
  const loadedTemplateRef = useRef<LoadedColoringTemplate | null>(null)
  const lineImageRef = useRef<HTMLImageElement | null>(null)
  const brushRef = useRef(brush)
  const inputModeRef = useRef(inputMode)
  const fillModeRef = useRef(fillMode)
  const onElementsChangeRef = useRef(onElementsChange)
  const onHistoryChangeRef = useRef(onHistoryChange)
  const onFillRef = useRef(onFill)
  const [loading, setLoading] = useState(Boolean(template))
  const [fillPulse, setFillPulse] = useState<{ x: number; y: number; id: number } | null>(null)

  brushRef.current = brush
  inputModeRef.current = inputMode
  fillModeRef.current = fillMode
  onElementsChangeRef.current = onElementsChange
  onHistoryChangeRef.current = onHistoryChange
  onFillRef.current = onFill

  const emitChange = () => {
    const engine = engineRef.current
    if (!engine) return
    const elements = engine.getElements()
    onElementsChangeRef.current(elements)
    onHistoryChangeRef.current?.(engine.getHistoryState())
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const engine = new DrawingEngine(canvas, {
      onCommit: () => emitChange(),
    })
    engineRef.current = engine

    const input = new InputManager(canvas, {
      getMode: () => inputModeRef.current,
      getRect: () => canvas.getBoundingClientRect(),
      onBegin: (point: Point) => {
        const currentBrush = brushRef.current
        if (fillModeRef.current && currentBrush.brush !== 'eraser' && loadedTemplateRef.current) {
          const changed = engine.fillAt(point.x, point.y, currentBrush.color)
          if (changed) {
            soundManager.play('sparkle')
            const id = Date.now()
            setFillPulse({ x: point.x, y: point.y, id })
            window.setTimeout(() => {
              setFillPulse((current) => current?.id === id ? null : current)
            }, 560)
            onFillRef.current?.()
          }
          return
        }
        engine.begin(currentBrush, point)
      },
      onMove: (points: Point[]) => {
        for (const point of points) engine.addPoint(point)
      },
      onEnd: () => {
        engine.endStroke()
      },
    })
    inputRef.current = input

    let frame = 0
    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      if (mode === 'coloring') {
        engine.resizeToResolution(COLORING_RESOLUTION)
        const lineCanvas = lineCanvasRef.current
        if (lineCanvas) {
          lineCanvas.width = COLORING_RESOLUTION
          lineCanvas.height = COLORING_RESOLUTION
          const lineCtx = lineCanvas.getContext('2d')
          if (lineCtx && loadedTemplateRef.current) {
            lineCtx.clearRect(0, 0, COLORING_RESOLUTION, COLORING_RESOLUTION)
            lineCtx.drawImage(loadedTemplateRef.current.image, 0, 0, COLORING_RESOLUTION, COLORING_RESOLUTION)
          }
        }
      } else {
        engine.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, 3))
      }
    }
    resize()
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(resize)
    })
    observer.observe(wrap)
    window.addEventListener('orientationchange', resize)

    return () => {
      observer.disconnect()
      window.removeEventListener('orientationchange', resize)
      cancelAnimationFrame(frame)
      input.destroy()
      inputRef.current = null
      engineRef.current = null
    }
    // The canvas is intentionally initialized once per mounted artwork. Brush
    // and input-mode changes are read through refs to keep drawing smooth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    if (!initialDocument) return
    engineRef.current?.loadElements(initialDocument.elements)
    onHistoryChangeRef.current?.(engineRef.current?.getHistoryState() ?? { canUndo: false, canRedo: false })
    // Only load when the artwork identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDocument])

  useEffect(() => {
    if (!template) {
      loadedTemplateRef.current = null
      lineImageRef.current = null
      engineRef.current?.setLineArt(null)
      const lineCanvas = lineCanvasRef.current
      const ctx = lineCanvas?.getContext('2d')
      if (lineCanvas && ctx) ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    coloringTemplateManager.load(template).then((loaded) => {
      if (cancelled) return
      loadedTemplateRef.current = loaded
      lineImageRef.current = loaded.image
      engineRef.current?.setLineArt(loaded)
      const lineCanvas = lineCanvasRef.current
      const ctx = lineCanvas?.getContext('2d')
      if (lineCanvas && ctx) {
        lineCanvas.width = COLORING_RESOLUTION
        lineCanvas.height = COLORING_RESOLUTION
        ctx.clearRect(0, 0, COLORING_RESOLUTION, COLORING_RESOLUTION)
        ctx.drawImage(loaded.image, 0, 0, COLORING_RESOLUTION, COLORING_RESOLUTION)
      }
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [template])

  useImperativeHandle(ref, () => ({
    undo: () => { engineRef.current?.undo() },
    redo: () => { engineRef.current?.redo() },
    clear: () => { engineRef.current?.clear() },
    getElements: () => engineRef.current?.getElements() ?? [],
    getCanvas: () => canvasRef.current,
    getLineImage: () => lineImageRef.current,
    isEmpty: () => engineRef.current?.isEmpty() ?? true,
    loadElements: (elements) => {
      engineRef.current?.loadElements(elements)
      onHistoryChangeRef.current?.(engineRef.current?.getHistoryState() ?? { canUndo: false, canRedo: false })
    },
  }), [])

  return (
    <div className={`canvas-wrap ${mode === 'coloring' ? 'is-coloring' : ''} experience-${experience}`} ref={wrapRef}>
      <div className="canvas-paper">
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          aria-label="Drawing canvas"
          role="img"
        />
        {mode === 'coloring' && (
          <canvas ref={lineCanvasRef} className="line-canvas" aria-hidden="true" />
        )}
        {fillPulse && (
          <span
            key={fillPulse.id}
            className="fill-pulse"
            style={{ left: `${fillPulse.x * 100}%`, top: `${fillPulse.y * 100}%` }}
            aria-hidden="true"
          />
        )}
        {loading && (
          <div className="canvas-loading">
            <span className="loading-dot" />
            <span>Getting the crayons ready...</span>
          </div>
        )}
      </div>
    </div>
  )
})