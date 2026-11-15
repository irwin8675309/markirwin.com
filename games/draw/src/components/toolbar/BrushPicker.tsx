import { BRUSHES } from '../../config'
import type { BrushType, StampShape } from '../../types'
import { Icon } from '../common/Icons'
import { StampShapeIcon } from './StampShapeIcon'

interface BrushPickerProps {
  selected: BrushType
  onSelect: (brush: BrushType) => void
  easy: boolean
  stampShape: StampShape
  onStampShape: (shape: StampShape) => void
}

const shapes: StampShape[] = ['heart', 'star', 'flower', 'butterfly', 'smile']

export function BrushPicker({ selected, onSelect, easy, stampShape, onStampShape }: BrushPickerProps) {
  const brushes = easy ? BRUSHES.slice(0, 3) : BRUSHES
  return (
    <div className="brush-picker" aria-label="Brushes">
      <div className="brush-row">
        {brushes.map((brush) => (
          <button
            key={brush.id}
            type="button"
            className={`brush-button ${selected === brush.id ? 'is-selected' : ''} brush-${brush.id}`}
            onClick={() => onSelect(brush.id)}
            aria-label={brush.name}
            aria-pressed={selected === brush.id}
          >
            <span className="brush-icon">
              <Icon name={brush.id === 'paintbrush' ? 'paint' : brush.id} size={28} />
            </span>
            <span className="brush-name">{brush.name}</span>
          </button>
        ))}
      </div>
      {selected === 'stamp' && (
        <div className="stamp-shapes" aria-label="Stamp shapes">
          {shapes.map((shape) => (
            <button
              key={shape}
              type="button"
              className={`stamp-shape ${stampShape === shape ? 'is-selected' : ''}`}
              onClick={() => onStampShape(shape)}
              aria-label={shape}
              aria-pressed={stampShape === shape}
            >
              <StampShapeIcon shape={shape} size={22} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}