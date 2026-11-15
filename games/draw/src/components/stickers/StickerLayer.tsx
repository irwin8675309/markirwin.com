import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { StickerInstance } from '../../types'
import { STICKER_BASE_PERCENT } from '../../config'
import { getSticker, stickerDataUrl } from '../../stickers/stickerLibrary'
import { clamp } from '../../utils/helpers'

interface StickerLayerProps {
  stickers: StickerInstance[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (id: string, patch: Partial<StickerInstance>) => void
  onDelete: (id: string) => void
}

type Interaction =
  | { kind: 'drag'; id: string; startX: number; startY: number; stickerX: number; stickerY: number; pointerId: number }
  | { kind: 'scale'; id: string; startDistance: number; startScale: number; centerX: number; centerY: number; pointerId: number }
  | { kind: 'rotate'; id: string; startAngle: number; startRotation: number; centerX: number; centerY: number; pointerId: number }

function angleFromCenter(clientX: number, clientY: number, centerX: number, centerY: number) {
  return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI)
}

export function StickerLayer({ stickers, selectedId, onSelect, onChange, onDelete }: StickerLayerProps) {
  const layerRef = useRef<HTMLDivElement | null>(null)
  const interactionRef = useRef<Interaction | null>(null)

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>, sticker: StickerInstance) => {
    if (event.button !== undefined && event.button !== 0) return
    event.stopPropagation()
    event.preventDefault()
    onSelect(sticker.id)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture is an enhancement; dragging still works without it.
    }
    interactionRef.current = {
      kind: 'drag',
      id: sticker.id,
      startX: event.clientX,
      startY: event.clientY,
      stickerX: sticker.x,
      stickerY: sticker.y,
      pointerId: event.pointerId,
    }
  }

  const startScale = (event: ReactPointerEvent<HTMLButtonElement>, sticker: StickerInstance) => {
    event.stopPropagation()
    event.preventDefault()
    const rect = layerRef.current?.getBoundingClientRect()
    if (!rect) return
    const centerX = rect.left + sticker.x * rect.width
    const centerY = rect.top + sticker.y * rect.height
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Ignore environments without pointer capture.
    }
    interactionRef.current = {
      kind: 'scale',
      id: sticker.id,
      startDistance: Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY)),
      startScale: sticker.scale,
      centerX,
      centerY,
      pointerId: event.pointerId,
    }
  }

  const startRotate = (event: ReactPointerEvent<HTMLButtonElement>, sticker: StickerInstance) => {
    event.stopPropagation()
    event.preventDefault()
    const rect = layerRef.current?.getBoundingClientRect()
    if (!rect) return
    const centerX = rect.left + sticker.x * rect.width
    const centerY = rect.top + sticker.y * rect.height
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Ignore environments without pointer capture.
    }
    interactionRef.current = {
      kind: 'rotate',
      id: sticker.id,
      startAngle: angleFromCenter(event.clientX, event.clientY, centerX, centerY),
      startRotation: sticker.rotation,
      centerX,
      centerY,
      pointerId: event.pointerId,
    }
  }

  const handleMove = (event: ReactPointerEvent<HTMLButtonElement | HTMLDivElement>) => {
    const interaction = interactionRef.current
    if (!interaction || event.pointerId !== interaction.pointerId) return
    event.preventDefault()
    event.stopPropagation()
    const rect = layerRef.current?.getBoundingClientRect()
    if (!rect) return
    if (interaction.kind === 'drag') {
      const x = clamp(interaction.stickerX + (event.clientX - interaction.startX) / rect.width, 0.04, 0.96)
      const y = clamp(interaction.stickerY + (event.clientY - interaction.startY) / rect.height, 0.04, 0.96)
      onChange(interaction.id, { x, y })
    } else if (interaction.kind === 'scale') {
      const distance = Math.hypot(event.clientX - interaction.centerX, event.clientY - interaction.centerY)
      const scale = clamp((distance / interaction.startDistance) * interaction.startScale, 0.45, 4.5)
      onChange(interaction.id, { scale })
    } else {
      const angle = angleFromCenter(event.clientX, event.clientY, interaction.centerX, interaction.centerY)
      const rotation = interaction.startRotation + (angle - interaction.startAngle)
      onChange(interaction.id, { rotation })
    }
  }

  const finishInteraction = (event: ReactPointerEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (!interactionRef.current) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    interactionRef.current = null
  }

  return (
    <div className="sticker-layer" ref={layerRef}>
      {stickers.map((sticker, index) => {
        const definition = getSticker(sticker.stickerId)
        if (!definition) return null
        const selected = selectedId === sticker.id
        return (
          <div
            key={sticker.id}
            className={`sticker-item ${selected ? 'is-selected' : ''}`}
            style={{
              left: `${sticker.x * 100}%`,
              top: `${sticker.y * 100}%`,
              width: `${STICKER_BASE_PERCENT * sticker.scale}%`,
              transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
              zIndex: selected ? 50 : 10 + index,
            }}
            onPointerDown={(event) => startDrag(event, sticker)}
            onPointerMove={handleMove}
            onPointerUp={finishInteraction}
            onPointerCancel={finishInteraction}
            role="button"
            tabIndex={0}
            aria-label={definition.name}
            onKeyDown={(event) => {
              if (event.key === 'Delete' || event.key === 'Backspace') {
                event.preventDefault()
                onDelete(sticker.id)
              }
            }}
          >
            <img src={stickerDataUrl(definition)} alt="" draggable={false} />
            {selected && (
              <>
                <span className="sticker-selection-ring" />
                <button
                  type="button"
                  className="sticker-handle sticker-rotate"
                  onPointerDown={(event) => startRotate(event, sticker)}
                  onPointerMove={handleMove}
                  onPointerUp={finishInteraction}
                  onPointerCancel={finishInteraction}
                  aria-label="Rotate sticker"
                >
                  <span className="rotate-arrow">↻</span>
                </button>
                <button
                  type="button"
                  className="sticker-handle sticker-scale"
                  onPointerDown={(event) => startScale(event, sticker)}
                  onPointerMove={handleMove}
                  onPointerUp={finishInteraction}
                  onPointerCancel={finishInteraction}
                  aria-label="Resize sticker"
                >
                  <span className="scale-grip" />
                </button>
                <button
                  type="button"
                  className="sticker-delete"
                  onPointerDown={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    onDelete(sticker.id)
                  }}
                  aria-label="Delete sticker"
                >
                  ×
                </button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}