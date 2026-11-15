import { EASY_COLORS, EXTRA_PALETTE, PALETTE } from '../../config'

interface ColorPaletteProps {
  selected: string
  onSelect: (color: string) => void
  easy: boolean
  expanded: boolean
  onToggleExpanded: () => void
}

export function ColorPalette({ selected, onSelect, easy, expanded, onToggleExpanded }: ColorPaletteProps) {
  const colors = easy ? [...EASY_COLORS] : PALETTE.map((item) => item.value)
  return (
    <div className={`color-palette ${expanded ? 'is-expanded' : ''}`} aria-label="Color palette">
      <div className="color-row">
        {colors.map((color, index) => (
          <button
            key={color}
            type="button"
            className={`color-swatch ${selected === color ? 'is-selected' : ''}`}
            style={{ background: color }}
            onClick={() => onSelect(color)}
            aria-label={`Color ${easy ? ['red', 'orange', 'yellow', 'green', 'blue', 'purple'][index] ?? index + 1 : index + 1}`}
            aria-pressed={selected === color}
          >
            <span className="sr-only">Color</span>
          </button>
        ))}
        <button
          type="button"
          className={`color-swatch color-rainbow ${selected === 'rainbow' ? 'is-selected' : ''}`}
          onClick={() => onSelect('rainbow')}
          aria-label="Rainbow color"
          aria-pressed={selected === 'rainbow'}
        />
        {!easy && (
          <button
            type="button"
            className="color-more"
            onClick={onToggleExpanded}
            aria-expanded={expanded}
            aria-label={expanded ? 'Show fewer colors' : 'Show more colors'}
          >
            {expanded ? 'Less' : 'More'}
          </button>
        )}
      </div>
      {expanded && !easy && (
        <div className="color-row extra-colors">
          {EXTRA_PALETTE.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`color-swatch ${selected === item.value ? 'is-selected' : ''}`}
              style={{ background: item.value }}
              onClick={() => onSelect(item.value)}
              aria-label={item.name}
              aria-pressed={selected === item.value}
            />
          ))}
        </div>
      )}
    </div>
  )
}