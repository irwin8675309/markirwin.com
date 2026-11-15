import { useCallback, useEffect, useRef, useState } from 'react'
import { HomeScreen } from './components/HomeScreen'
import { StudioScreen } from './components/StudioScreen'
import { ColoringGallery } from './components/ColoringGallery'
import { ArtworkGallery } from './components/ArtworkGallery'
import { ArtWall } from './components/ArtWall'
import { MagicArt } from './components/MagicArt'
import { ParentControls } from './components/parent/ParentControls'
import { Modal } from './components/common/Modal'
import { Icon } from './components/common/Icons'
import type {
  AppSettings,
  ArtworkDocument,
  SavedArtwork,
  StudioMode,
} from './types'
import { DEFAULT_SETTINGS } from './config'
import { COLORING_TEMPLATES, type ColoringTemplate } from './templates/coloringPages'
import {
  loadCompletedPages,
  loadSettings,
  resetLocalData,
  saveCompletedPages,
  saveSettings,
} from './storage/settings'
import { artworkStorage } from './storage/ArtworkStorage'
import {
  downloadArtwork,
  shareArtwork,
} from './storage/artworkRenderer'
import { soundManager } from './audio/SoundManager'
import { createId } from './utils/helpers'

type Screen =
  | 'home'
  | 'draw'
  | 'coloring-gallery'
  | 'coloring'
  | 'stickers'
  | 'gallery'
  | 'art-wall'
  | 'magic'
  | 'parent'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [completed, setCompleted] = useState<string[]>(() => loadCompletedPages())
  const [artworks, setArtworks] = useState<SavedArtwork[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ColoringTemplate | undefined>()
  const [session, setSession] = useState({
    key: 0,
    mode: 'free' as StudioMode,
    document: undefined as ArtworkDocument | undefined,
    artworkId: undefined as string | undefined,
    artworkTitle: undefined as string | undefined,
  })
  const [toast, setToast] = useState<string | null>(null)
  const [shareTarget, setShareTarget] = useState<SavedArtwork | null>(null)

  const refreshArtworks = useCallback(async () => {
    try {
      const list = await artworkStorage.listArtworks()
      setArtworks(list)
    } catch {
      setArtworks([])
    }
  }, [])

  useEffect(() => {
    void refreshArtworks()
  }, [refreshArtworks])

  useEffect(() => {
    soundManager.setEnabled(settings.sound)
  }, [settings.sound])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const updateSettings = (next: AppSettings) => {
    setSettings(next)
    saveSettings(next)
    soundManager.setEnabled(next.sound)
  }

  const startStudio = (mode: StudioMode, template?: ColoringTemplate, artwork?: SavedArtwork) => {
    setSession((previous) => ({
      key: previous.key + 1,
      mode: artwork?.document.mode ?? mode,
      document: artwork?.document,
      artworkId: artwork?.id,
      artworkTitle: artwork?.title,
    }))
    setSelectedTemplate(artwork?.document.templateId
      ? COLORING_TEMPLATES.find((item) => item.id === artwork.document.templateId)
      : template)
    const target: Screen = artwork?.document.mode === 'coloring' || mode === 'coloring'
      ? 'coloring'
      : mode === 'stickers'
        ? 'stickers'
        : 'draw'
    setScreen(target)
  }

  const duplicateArtwork = async (artwork: SavedArtwork) => {
    const now = Date.now()
    const copy: SavedArtwork = {
      id: createId('art'),
      title: `${artwork.title} copy`,
      thumbnail: artwork.thumbnail,
      document: { ...artwork.document, createdAt: now, updatedAt: now },
      createdAt: now,
      updatedAt: now,
    }
    try {
      await artworkStorage.saveArtwork(copy)
      await refreshArtworks()
      setToast('Copy added to My Artwork')
      soundManager.play('pop')
    } catch {
      setToast('Could not make a copy just now')
    }
  }

  const deleteArtwork = async (artwork: SavedArtwork) => {
    try {
      await artworkStorage.deleteArtwork(artwork.id)
      await refreshArtworks()
      setToast('Artwork removed')
    } catch {
      setToast('Could not delete just now')
    }
  }

  const download = async (artwork: SavedArtwork) => {
    try {
      await downloadArtwork(artwork.document, `${artwork.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`)
      setToast('Image saved')
    } catch {
      setToast('Could not save the image just now')
    }
  }

  const share = async (artwork: SavedArtwork) => {
    try {
      const result = await shareArtwork(artwork.document)
      if (result === 'shared') setToast('Shared')
      else if (result === 'downloaded') setToast('Sharing is not available here, so the image was saved')
    } catch {
      setToast('Could not share just now')
    }
    setShareTarget(null)
  }

  const resetEverything = async () => {
    try {
      await artworkStorage.clearArtworks()
    } catch {
      // Continue clearing local settings even if storage fails.
    }
    resetLocalData()
    const fresh = { ...DEFAULT_SETTINGS }
    setSettings(fresh)
    saveSettings(fresh)
    setCompleted([])
    setArtworks([])
    setToast('Little Artists has been reset')
    setScreen('home')
  }

  const handleSaved = () => {
    if (screen === 'coloring' && selectedTemplate) {
      setCompleted((previous) => {
        if (previous.includes(selectedTemplate.id)) return previous
        const next = [...previous, selectedTemplate.id]
        saveCompletedPages(next)
        return next
      })
    }
    void refreshArtworks()
  }

  if (screen === 'home') {
    return (
      <>
        <HomeScreen
          settings={settings}
          artworkCount={artworks.length}
          onNavigate={(destination) => {
            if (destination === 'draw') {
              startStudio('free')
              setScreen('draw')
            } else if (destination === 'stickers') {
              startStudio('stickers')
              setScreen('stickers')
            } else if (destination === 'coloring') {
              setScreen('coloring-gallery')
            } else if (destination === 'magic') {
              setScreen('magic')
            } else {
              setScreen('gallery')
            }
          }}
          onToggleSound={() => {
            const next = { ...settings, sound: !settings.sound }
            updateSettings(next)
          }}
          onParent={() => setScreen('parent')}
        />
        {toast && <div className="toast">{toast}</div>}
      </>
    )
  }

  if (screen === 'draw' || screen === 'coloring' || screen === 'stickers') {
    const mode = screen === 'coloring' ? 'coloring' : screen === 'stickers' ? 'stickers' : 'free'
    return (
      <>
        <StudioScreen
          key={session.key}
          mode={mode}
          settings={settings}
          template={selectedTemplate}
          initialDocument={session.document}
          artworkId={session.artworkId}
          artworkTitle={session.artworkTitle}
          onHome={() => setScreen('home')}
          onBack={() => setScreen(mode === 'coloring' ? 'coloring-gallery' : 'home')}
          onGallery={() => setScreen('gallery')}
          onSaved={handleSaved}
        />
        {toast && <div className="toast">{toast}</div>}
      </>
    )
  }

  if (screen === 'coloring-gallery') {
    return (
      <ColoringGallery
        completed={completed}
        onBack={() => setScreen('home')}
        onSelect={(template) => {
          setSelectedTemplate(template)
          startStudio('coloring', template)
        }}
      />
    )
  }

  if (screen === 'gallery') {
    return (
      <>
        <ArtworkGallery
          artworks={artworks}
          onBack={() => setScreen('home')}
          onNew={() => { startStudio('free'); setScreen('draw') }}
          onEdit={(artwork) => { startStudio(artwork.document.mode, undefined, artwork) }}
          onDuplicate={(artwork) => { void duplicateArtwork(artwork) }}
          onDelete={(artwork) => { void deleteArtwork(artwork) }}
          onDownload={(artwork) => { void download(artwork) }}
          onShare={(artwork) => setShareTarget(artwork)}
          onArtWall={() => setScreen('art-wall')}
        />
        <Modal open={Boolean(shareTarget)} title="Grown-ups: share artwork" onClose={() => setShareTarget(null)}>
          <p className="modal-copy">
            Sharing opens the iPad share sheet where available. If sharing is not supported, a PNG
            will be saved instead.
          </p>
          <div className="share-gate">
            <span className="share-gate-icon"><Icon name="lock" size={30} /></span>
            <p>Ask a grown-up to hold the button for 2 seconds.</p>
            <HoldToShare onComplete={() => { if (shareTarget) void share(shareTarget) }} />
          </div>
        </Modal>
        {toast && <div className="toast">{toast}</div>}
      </>
    )
  }

  if (screen === 'art-wall') {
    return <ArtWall artworks={artworks} onBack={() => setScreen('gallery')} />
  }

  if (screen === 'magic') {
    return <MagicArt onBack={() => setScreen('home')} />
  }

  if (screen === 'parent') {
    return (
      <>
        <ParentControls
          settings={settings}
          artworkCount={artworks.length}
          onBack={() => setScreen('home')}
          onSettings={updateSettings}
          onOpenGallery={() => setScreen('gallery')}
          onReset={() => { void resetEverything() }}
        />
        {toast && <div className="toast">{toast}</div>}
      </>
    )
  }

  return null
}

function HoldToShare({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const startRef = useRef(0)
  const timerRef = useRef(0)
  useEffect(() => {
    return () => window.clearInterval(timerRef.current)
  }, [])
  return (
    <button
      type="button"
      className="hold-button share-hold"
      onPointerDown={(event) => {
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          // Hold-to-share also works without pointer capture.
        }
        startRef.current = performance.now()
        window.clearInterval(timerRef.current)
        timerRef.current = window.setInterval(() => {
          const next = Math.min(1, (performance.now() - startRef.current) / 2000)
          setProgress(next)
          if (next >= 1) {
            window.clearInterval(timerRef.current)
            onComplete()
          }
        }, 30)
      }}
      onPointerUp={() => {
        window.clearInterval(timerRef.current)
        if (progress < 1) setProgress(0)
      }}
      onPointerCancel={() => {
        window.clearInterval(timerRef.current)
        setProgress(0)
      }}
      aria-label="Hold for two seconds to share"
    >
      <span className="hold-fill" style={{ width: `${progress * 100}%` }} />
      <span className="hold-label"><Icon name="share" size={24} /> Hold to share</span>
    </button>
  )
}