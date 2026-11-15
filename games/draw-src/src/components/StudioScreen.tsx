import { useEffect, useRef, useState } from 'react'
import type {
  AppSettings,
  ArtworkDocument,
  BrushConfig,
  BrushType,
  ColorElement,
  StampShape,
  StickerInstance,
  StudioMode,
} from '../types'
import {
  BRUSH_SIZES,
  EASY_BRUSH_SIZES,
  PALETTE,
} from '../config'
import type { ColoringTemplate } from '../templates/coloringPages'
import type { SizeKey } from './toolbar/SizePicker'
import { DrawingCanvas, type DrawingCanvasHandle } from './DrawingCanvas'
import { ToolDock } from './toolbar/ToolDock'
import { Modal } from './common/Modal'
import { Confetti } from './common/Confetti'
import { Icon } from './common/Icons'
import { StickerLayer } from './stickers/StickerLayer'
import { StickerPicker } from './stickers/StickerPicker'
import { BackgroundPicker } from './stickers/BackgroundPicker'
import {
  backgroundDataUrl,
  getBackground,
  type DecorativeBackground,
  type Sticker,
} from '../stickers/stickerLibrary'
import { artworkStorage } from '../storage/ArtworkStorage'
import { renderArtworkThumbnail } from '../storage/artworkRenderer'
import { soundManager } from '../audio/SoundManager'
import { createId } from '../utils/helpers'

interface StudioScreenProps {
  mode: StudioMode
  settings: AppSettings
  template?: ColoringTemplate
  initialDocument?: ArtworkDocument
  artworkId?: string
  artworkTitle?: string
  onHome: () => void
  onBack: () => void
  onGallery: () => void
  onSaved: () => void
}

function createDocument(mode: StudioMode, template?: ColoringTemplate): ArtworkDocument {
  const now = Date.now()
  return {
    version: 1,
    mode,
    templateId: template?.id,
    elements: [],
    stickers: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function StudioScreen({
  mode,
  settings,
  template,
  initialDocument,
  artworkId,
  artworkTitle,
  onHome,
  onBack,
  onGallery,
  onSaved,
}: StudioScreenProps) {
  const easy = settings.experience === 'easy'
  const sizeFor = (key: SizeKey) => easy
    ? (key === 'extra' ? EASY_BRUSH_SIZES.extra : EASY_BRUSH_SIZES.large)
    : BRUSH_SIZES[key]
  const [doc, setDoc] = useState<ArtworkDocument>(() => initialDocument ?? createDocument(mode, template))
  const [startingDoc, setStartingDoc] = useState<ArtworkDocument | undefined>(initialDocument)
  const docRef = useRef(doc)
  const canvasRef = useRef<DrawingCanvasHandle | null>(null)
  const [brush, setBrush] = useState<BrushConfig>({
    brush: 'crayon',
    color: PALETTE[4].value,
    size: easy ? EASY_BRUSH_SIZES.large : BRUSH_SIZES.medium,
    stampShape: 'star',
  })
  const [sizeKey, setSizeKey] = useState<SizeKey>(easy ? 'large' : 'medium')
  const [stampShape, setStampShape] = useState<StampShape>('star')
  const [fillMode, setFillMode] = useState(mode === 'coloring')
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [paletteExpanded, setPaletteExpanded] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false)
  const [backgroundPickerOpen, setBackgroundPickerOpen] = useState(false)
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [savedId, setSavedId] = useState<string | undefined>(artworkId)
  const [confetti, setConfetti] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const lastBrushRef = useRef<BrushType>('crayon')
  const savedRef = useRef(false)
  const interactedRef = useRef(false)
  const draftKey = mode === 'coloring' && template
    ? `coloring:${template.id}`
    : mode === 'stickers'
      ? 'stickers'
      : 'free'

  useEffect(() => {
    docRef.current = doc
  }, [doc])

  useEffect(() => {
    if (initialDocument || artworkId) return
    let cancelled = false
    artworkStorage.getDraft(draftKey).then((draft) => {
      if (cancelled || interactedRef.current) return
      if (draft && (draft.elements.length > 0 || draft.stickers.length > 0)) {
        setDoc(draft)
        setStartingDoc(draft)
        docRef.current = draft
      }
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [artworkId, draftKey, initialDocument])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2200)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!confetti) return
    const timer = window.setTimeout(() => setConfetti(false), 2000)
    return () => window.clearTimeout(timer)
  }, [confetti])

  useEffect(() => {
    if (!doc.elements.length && !doc.stickers.length) return
    if (savedRef.current) return
    const timer = window.setTimeout(() => {
      if (!interactedRef.current) return
      void artworkStorage.saveDraft(draftKey, docRef.current).catch(() => undefined)
    }, 900)
    return () => window.clearTimeout(timer)
  }, [doc, draftKey])

  useEffect(() => {
    return () => {
      if (savedRef.current) return
      if (!interactedRef.current) return
      if (!docRef.current.elements.length && !docRef.current.stickers.length) return
      void artworkStorage.saveDraft(draftKey, docRef.current).catch(() => undefined)
    }
  }, [draftKey])

  const markChanged = () => {
    savedRef.current = false
    setSaved(false)
    interactedRef.current = true
  }

  const handleElementsChange = (elements: ColorElement[]) => {
    markChanged()
    setDoc((previous) => ({
      ...previous,
      elements,
      updatedAt: Date.now(),
    }))
  }

  const handleHistoryChange = (state: { canUndo: boolean; canRedo: boolean }) => {
    setCanUndo(state.canUndo)
    setCanRedo(state.canRedo)
  }

  const selectBrush = (next: BrushType) => {
    if (next !== 'eraser') {
      lastBrushRef.current = next
      setBrush((previous) => ({ ...previous, brush: next }))
      if (mode === 'coloring') setFillMode(false)
    }
    soundManager.play('tap')
  }

  const toggleEraser = () => {
    setBrush((previous) => ({
      ...previous,
      brush: previous.brush === 'eraser' ? lastBrushRef.current : 'eraser',
    }))
    setFillMode(false)
    soundManager.play('tap')
  }

  const selectColor = (color: string) => {
    setBrush((previous) => ({
      ...previous,
      color,
      brush: previous.brush === 'eraser' ? lastBrushRef.current : previous.brush,
    }))
    soundManager.play('tap')
  }

  const selectSize = (next: SizeKey) => {
    setSizeKey(next)
    setBrush((previous) => ({
      ...previous,
      size: sizeFor(next),
      brush: previous.brush === 'eraser' ? lastBrushRef.current : previous.brush,
    }))
    soundManager.play('tap')
  }

  const toggleFill = () => {
    setFillMode((previous) => {
      if (!previous) {
        setBrush((current) => ({ ...current, brush: current.brush === 'eraser' ? lastBrushRef.current : current.brush }))
      }
      return !previous
    })
    soundManager.play('tap')
  }

  const addSticker = (sticker: Sticker) => {
    const instance: StickerInstance = {
      id: createId('sticker'),
      stickerId: sticker.id,
      x: 0.5 + (Math.random() - 0.5) * 0.16,
      y: 0.52 + (Math.random() - 0.5) * 0.14,
      scale: 1,
      rotation: (Math.random() - 0.5) * 10,
    }
    markChanged()
    setDoc((previous) => ({ ...previous, stickers: [...previous.stickers, instance], updatedAt: Date.now() }))
    setSelectedSticker(instance.id)
    soundManager.play('pop')
  }

  const updateSticker = (id: string, patch: Partial<StickerInstance>) => {
    markChanged()
    setDoc((previous) => ({
      ...previous,
      stickers: previous.stickers.map((sticker) => sticker.id === id ? { ...sticker, ...patch } : sticker),
      updatedAt: Date.now(),
    }))
  }

  const deleteSticker = (id: string) => {
    markChanged()
    setDoc((previous) => ({
      ...previous,
      stickers: previous.stickers.filter((sticker) => sticker.id !== id),
      updatedAt: Date.now(),
    }))
    setSelectedSticker(null)
    soundManager.play('pop')
  }

  const pickBackground = (background: DecorativeBackground | undefined) => {
    markChanged()
    setDoc((previous) => ({ ...previous, backgroundId: background?.id, updatedAt: Date.now() }))
    soundManager.play('pop')
  }

  const clearAll = () => {
    canvasRef.current?.clear()
    markChanged()
    setDoc((previous) => ({
      ...previous,
      elements: [],
      stickers: [],
      updatedAt: Date.now(),
    }))
    setSelectedSticker(null)
    setClearOpen(false)
    soundManager.play('whoosh')
    setNotice('A fresh page!')
  }

  const saveArtwork = async () => {
    const current = docRef.current
    if (!current.elements.length && !current.stickers.length) {
      setNotice('Add a little color first!')
      soundManager.play('pop')
      return
    }
    try {
      const thumbnail = await renderArtworkThumbnail(current)
      const id = savedId ?? artworkId ?? createId('art')
      const title = artworkTitle
        ?? (mode === 'coloring' && template ? template.title : mode === 'stickers' ? 'Sticker Art' : 'My Drawing')
      await artworkStorage.saveArtwork({
        id,
        title,
        thumbnail,
        document: { ...current, updatedAt: Date.now() },
        createdAt: current.createdAt,
        updatedAt: Date.now(),
      })
      await artworkStorage.clearDraft(draftKey).catch(() => undefined)
      savedRef.current = true
      setSavedId(id)
      setSaved(true)
      setConfetti(true)
      soundManager.play('save')
      setNotice('Saved to My Artwork')
      onSaved()
    } catch {
      setNotice('Could not save just now. Please try again.')
    }
  }

  const background = getBackground(doc.backgroundId)
  const backgroundStyle = background ? { background: background.css } : undefined
  const title = mode === 'coloring'
    ? template?.title ?? 'Coloring Book'
    : mode === 'stickers'
      ? 'Sticker Studio'
      : 'Free Draw'

  return (
    <div className="screen studio-screen">
      <header className="screen-header studio-header">
        <button type="button" className="round-button" onClick={onHome} aria-label="Back home">
          <Icon name="home" size={26} />
        </button>
        <div className="screen-title">
          <h1>{title}</h1>
          <p>{mode === 'coloring' ? (fillMode ? 'Tap a space to fill it' : 'Color with your finger or pencil') : mode === 'stickers' ? 'Draw, stick, and decorate' : 'Use your finger or Apple Pencil'}</p>
        </div>
        <div className="studio-header-actions">
          <button type="button" className="pill-button" onClick={onBack}>
            {mode === 'coloring' ? 'Pages' : 'Back'}
          </button>
          <button type="button" className="round-button" onClick={onGallery} aria-label="My artwork">
            <Icon name="gallery" size={26} />
          </button>
        </div>
      </header>

      <main className="studio-main">
        <div className={`studio-stage mode-${mode}`}>
          <div className="art-board" style={backgroundStyle}>
            {background && (
              <img className="board-background" src={backgroundDataUrl(background)} alt="" draggable={false} />
            )}
            <div className="canvas-stack">
              <DrawingCanvas
                ref={canvasRef}
                mode={mode}
                template={template}
                brush={brush}
                inputMode={settings.inputMode}
                experience={settings.experience}
                initialDocument={startingDoc}
                fillMode={fillMode}
                onElementsChange={handleElementsChange}
                onHistoryChange={handleHistoryChange}
                onFill={() => {
                  markChanged()
                  setSaved(false)
                }}
              />
              {mode === 'stickers' && (
                <StickerLayer
                  stickers={doc.stickers}
                  selectedId={selectedSticker}
                  onSelect={(id) => {
                    setSelectedSticker(id)
                    if (id) soundManager.play('tap')
                  }}
                  onChange={updateSticker}
                  onDelete={deleteSticker}
                />
              )}
            </div>
            {mode === 'stickers' && doc.stickers.length === 0 && (
              <div className="sticker-hint">
                <Icon name="sticker" size={26} />
                <span>Tap the sticker button to add a sticker</span>
              </div>
            )}
          </div>
        </div>

        <ToolDock
          mode={mode}
          experience={settings.experience}
          brush={brush}
          sizeKey={sizeKey}
          stampShape={stampShape}
          fillMode={fillMode}
          canUndo={canUndo}
          canRedo={canRedo}
          saved={saved}
          paletteExpanded={paletteExpanded}
          onPaletteExpanded={setPaletteExpanded}
          onBrush={selectBrush}
          onColor={selectColor}
          onSize={selectSize}
          onStampShape={(shape) => {
            setStampShape(shape)
            setBrush((previous) => ({ ...previous, stampShape: shape }))
            soundManager.play('tap')
          }}
          onEraser={toggleEraser}
          onUndo={() => { canvasRef.current?.undo(); soundManager.play('tap') }}
          onRedo={() => { canvasRef.current?.redo(); soundManager.play('tap') }}
          onClear={() => setClearOpen(true)}
          onSave={() => { void saveArtwork() }}
          onToggleFill={toggleFill}
          onOpenStickers={() => { setStickerPickerOpen(true); soundManager.play('tap') }}
          onOpenBackgrounds={() => { setBackgroundPickerOpen(true); soundManager.play('tap') }}
        />
      </main>

      <StickerPicker
        open={stickerPickerOpen}
        onClose={() => setStickerPickerOpen(false)}
        onPick={addSticker}
      />
      <BackgroundPicker
        open={backgroundPickerOpen}
        selected={doc.backgroundId}
        onClose={() => setBackgroundPickerOpen(false)}
        onPick={pickBackground}
      />

      <Modal open={clearOpen} title="Start a fresh page?" onClose={() => setClearOpen(false)}>
        <p className="modal-copy">This will clear the picture. Your saved artwork will stay safe.</p>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={() => setClearOpen(false)}>Keep drawing</button>
          <button type="button" className="danger-button" onClick={clearAll}>Clear page</button>
        </div>
      </Modal>

      <Confetti show={confetti} />
      {notice && <div className="toast">{notice}</div>}
      {saved && (
        <button type="button" className="saved-ribbon" onClick={onGallery}>
          <Icon name="check" size={22} />
          <span>Saved! Tap to see My Artwork</span>
        </button>
      )}
    </div>
  )
}