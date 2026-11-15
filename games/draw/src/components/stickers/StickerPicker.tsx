import { useState } from 'react'
import { Modal } from '../common/Modal'
import {
  STICKER_CATEGORIES,
  STICKERS,
  stickerDataUrl,
  stickersByCategory,
  type Sticker,
  type StickerCategory,
} from '../../stickers/stickerLibrary'

interface StickerPickerProps {
  open: boolean
  onClose: () => void
  onPick: (sticker: Sticker) => void
}

export function StickerPicker({ open, onClose, onPick }: StickerPickerProps) {
  const [category, setCategory] = useState<StickerCategory>('Animals')
  const stickers = stickersByCategory(category)
  return (
    <Modal open={open} title="Sticker Box" onClose={onClose} wide>
      <div className="sticker-category-row" role="tablist" aria-label="Sticker categories">
        {STICKER_CATEGORIES.map((item) => {
          const first = STICKERS.find((sticker) => sticker.category === item)
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              className={`category-chip ${category === item ? 'is-active' : ''}`}
              onClick={() => setCategory(item)}
            >
              {first && <img src={stickerDataUrl(first)} alt="" />}
              <span>{item}</span>
            </button>
          )
        })}
      </div>
      <div className="sticker-grid">
        {stickers.map((sticker) => (
          <button
            key={sticker.id}
            type="button"
            className="sticker-tile"
            onClick={() => {
              onPick(sticker)
              onClose()
            }}
            aria-label={`Add ${sticker.name} sticker`}
          >
            <img src={stickerDataUrl(sticker)} alt="" draggable={false} />
            <span>{sticker.name}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}