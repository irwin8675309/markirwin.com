import { BRUSH_SIZES, EASY_BRUSH_SIZES } from '../../config'

type SizeKey = keyof typeof BRUSH_SIZES

interface SizePickerProps {
  selected: SizeKey
  onSelect: (size: SizeKey) => void
  easy: boolean
}

export function SizePicker({ selected, onSelect, easy }: SizePickerProps) {
  const sizes: Array<{ key: SizeKey; label: string }> = easy
    ? [{ key: 'large', label: 'Big' }, { key: 'extra', label: 'Extra big' }]
    : [
        { key: 'medium', label: 'Medium' },
        { key: 'large', label: 'Large' },
        { key: 'extra', label: 'Extra large' },
      ]
  const values: Record<SizeKey, number> = easy
    ? { ...BRUSH_SIZES, ...EASY_BRUSH_SIZES }
    : BRUSH_SIZES
  return (
    <div className="size-picker" aria-label="Brush size">
      {sizes.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`size-button ${selected === key ? 'is-selected' : ''}`}
          onClick={() => onSelect(key)}
          aria-label={label}
          aria-pressed={selected === key}
        >
          <span className={`size-dot size-${key}`} style={{ width: Math.min(26, values[key] / 3.5) }} />
          <span className="size-label">{label}</span>
        </button>
      ))}
    </div>
  )
}

export type { SizeKey }