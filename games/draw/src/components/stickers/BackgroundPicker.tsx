import { Modal } from '../common/Modal'
import {
  DECORATIVE_BACKGROUNDS,
  backgroundDataUrl,
  type DecorativeBackground,
} from '../../stickers/stickerLibrary'

interface BackgroundPickerProps {
  open: boolean
  selected: string | undefined
  onClose: () => void
  onPick: (background: DecorativeBackground | undefined) => void
}

export function BackgroundPicker({ open, selected, onClose, onPick }: BackgroundPickerProps) {
  return (
    <Modal open={open} title="Backgrounds" onClose={onClose} wide>
      <div className="background-grid">
        <button
          type="button"
          className={`background-tile ${!selected ? 'is-active' : ''}`}
          onClick={() => { onPick(undefined); onClose() }}
        >
          <span className="background-preview plain" />
          <span>Paper</span>
        </button>
        {DECORATIVE_BACKGROUNDS.map((background) => (
          <button
            key={background.id}
            type="button"
            className={`background-tile ${selected === background.id ? 'is-active' : ''}`}
            onClick={() => { onPick(background); onClose() }}
          >
            <span
              className="background-preview"
              style={{ background: background.css }}
            >
              <img src={backgroundDataUrl(background)} alt="" />
            </span>
            <span>{background.name}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}