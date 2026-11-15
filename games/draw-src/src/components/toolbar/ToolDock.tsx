import type { BrushConfig, BrushType, ExperienceMode, StampShape, StudioMode } from '../../types'
import { ActionButton } from '../common/ActionButton'
import { Icon } from '../common/Icons'
import { BrushPicker } from './BrushPicker'
import { ColorPalette } from './ColorPalette'
import { SizePicker, type SizeKey } from './SizePicker'

interface ToolDockProps {
  mode: StudioMode
  experience: ExperienceMode
  brush: BrushConfig
  sizeKey: SizeKey
  stampShape: StampShape
  fillMode: boolean
  canUndo: boolean
  canRedo: boolean
  saved?: boolean
  paletteExpanded: boolean
  onPaletteExpanded: (expanded: boolean) => void
  onBrush: (brush: BrushType) => void
  onColor: (color: string) => void
  onSize: (size: SizeKey) => void
  onStampShape: (shape: StampShape) => void
  onEraser: () => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onSave: () => void
  onToggleFill: () => void
  onOpenStickers: () => void
  onOpenBackgrounds: () => void
}

export function ToolDock({
  mode,
  experience,
  brush,
  sizeKey,
  stampShape,
  fillMode,
  canUndo,
  canRedo,
  saved = false,
  paletteExpanded,
  onPaletteExpanded,
  onBrush,
  onColor,
  onSize,
  onStampShape,
  onEraser,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onToggleFill,
  onOpenStickers,
  onOpenBackgrounds,
}: ToolDockProps) {
  const easy = experience === 'easy'
  return (
    <div className={`tool-dock ${fillMode ? 'fill-mode' : ''}`}>
      <div className="dock-row dock-main">
        <div className="dock-group history-group">
          <button
            type="button"
            className="dock-icon-button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
          >
            <Icon name="undo" size={26} />
          </button>
          <button
            type="button"
            className="dock-icon-button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
          >
            <Icon name="redo" size={26} />
          </button>
        </div>

        {mode === 'coloring' && (
          <div className="fill-toggle" role="group" aria-label="Coloring method">
            <button
              type="button"
              className={`fill-mode-button ${fillMode ? 'is-active' : ''}`}
              onClick={() => { if (!fillMode) onToggleFill() }}
              aria-pressed={fillMode}
            >
              <Icon name="paint" size={24} />
              <span>Fill</span>
            </button>
            <button
              type="button"
              className={`fill-mode-button ${!fillMode ? 'is-active' : ''}`}
              onClick={() => { if (fillMode) onToggleFill() }}
              aria-pressed={!fillMode}
            >
              <Icon name="brush" size={24} />
              <span>Draw</span>
            </button>
          </div>
        )}

        <BrushPicker
          selected={brush.brush}
          onSelect={(next) => onBrush(next)}
          easy={easy || mode === 'coloring' && fillMode}
          stampShape={stampShape}
          onStampShape={onStampShape}
        />

        <div className="dock-group action-group">
          <button
            type="button"
            className={`dock-icon-button ${brush.brush === 'eraser' ? 'is-active' : ''}`}
            onClick={onEraser}
            aria-label="Eraser"
            aria-pressed={brush.brush === 'eraser'}
          >
            <Icon name="eraser" size={26} />
          </button>
          {mode === 'stickers' && (
            <button type="button" className="dock-icon-button" onClick={onOpenStickers} aria-label="Stickers">
              <Icon name="sticker" size={26} />
            </button>
          )}
          <button type="button" className="dock-icon-button" onClick={onClear} aria-label="Start over">
            <Icon name="trash" size={26} />
          </button>
          <ActionButton
            icon={saved ? 'check' : 'save'}
            label={saved ? 'Saved!' : 'Save'}
            variant="primary"
            onClick={onSave}
            className="dock-save"
          />
        </div>
      </div>

      <div className="dock-row dock-secondary">
        <ColorPalette
          selected={brush.color}
          onSelect={onColor}
          easy={easy}
          expanded={paletteExpanded}
          onToggleExpanded={() => onPaletteExpanded(!paletteExpanded)}
        />
        {!fillMode && <SizePicker selected={sizeKey} onSelect={onSize} easy={easy} />}
        {mode === 'stickers' && (
          <button type="button" className="background-button" onClick={onOpenBackgrounds}>
            <span className="background-swatch" />
            <span>Background</span>
          </button>
        )}
      </div>
      {fillMode && (
        <div className="fill-hint">
          <Icon name="paint" size={22} />
          <span>Tap inside a shape to fill it with color</span>
        </div>
      )}
    </div>
  )
}