import { useEffect, useState } from 'react'
import type { AppSettings, ExperienceMode, InputMode } from '../../types'
import { Icon } from '../common/Icons'
import { Modal } from '../common/Modal'
import { artworkStorage } from '../../storage/ArtworkStorage'
import { soundManager } from '../../audio/SoundManager'
import { ParentGate } from './ParentGate'

interface ParentControlsProps {
  settings: AppSettings
  artworkCount: number
  onBack: () => void
  onSettings: (settings: AppSettings) => void
  onOpenGallery: () => void
  onReset: () => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ParentControls({
  settings,
  artworkCount,
  onBack,
  onSettings,
  onOpenGallery,
  onReset,
}: ParentControlsProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null)

  useEffect(() => {
    if (!unlocked) return
    artworkStorage.estimateUsage().then(setUsage).catch(() => setUsage(null))
  }, [unlocked, artworkCount])

  if (!unlocked) {
    return <ParentGate onUnlock={() => { setUnlocked(true); soundManager.play('success') }} />
  }

  return (
    <div className="screen parent-screen">
      <header className="screen-header">
        <button type="button" className="round-button" onClick={onBack} aria-label="Back home">
          <Icon name="home" size={26} />
        </button>
        <div className="screen-title">
          <h1>Grown-up Corner</h1>
          <p>Settings and artwork</p>
        </div>
        <button type="button" className="pill-button" onClick={() => setUnlocked(false)}>
          <Icon name="lock" size={20} />
          Lock
        </button>
      </header>

      <main className="parent-content">
        <section className="parent-section">
          <div className="parent-section-head">
            <span className="parent-section-icon sound-section"><Icon name="sound" size={26} /></span>
            <div>
              <h2>Sounds</h2>
              <p>Gentle pops, sparkles, and celebrations</p>
            </div>
            <button
              type="button"
              className={`toggle-switch ${settings.sound ? 'is-on' : ''}`}
              onClick={() => {
                const next = { ...settings, sound: !settings.sound }
                onSettings(next)
                soundManager.setEnabled(next.sound)
                if (next.sound) soundManager.play('tap')
              }}
              aria-label={settings.sound ? 'Turn sounds off' : 'Turn sounds on'}
              aria-pressed={settings.sound}
            >
              <span />
            </button>
          </div>
        </section>

        <section className="parent-section">
          <div className="parent-section-head">
            <span className="parent-section-icon mode-section"><Icon name="palette" size={26} /></span>
            <div>
              <h2>Experience level</h2>
              <p>Easy mode has fewer choices and bigger controls</p>
            </div>
          </div>
          <div className="option-row">
            {(['easy', 'creative'] as ExperienceMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`option-card ${settings.experience === mode ? 'is-selected' : ''}`}
                onClick={() => {
                  onSettings({ ...settings, experience: mode })
                  soundManager.play('tap')
                }}
                aria-pressed={settings.experience === mode}
              >
                <span className={`option-icon option-${mode}`}>
                  <Icon name={mode === 'easy' ? 'heart' : 'sparkle'} size={26} />
                </span>
                <span>
                  <strong>{mode === 'easy' ? 'Easy' : 'Creative'}</strong>
                  <small>{mode === 'easy' ? 'Simple and roomy' : 'All brushes and colors'}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="parent-section">
          <div className="parent-section-head">
            <span className="parent-section-icon pencil-section"><Icon name="pencil" size={26} /></span>
            <div>
              <h2>Apple Pencil & touch</h2>
              <p>Choose which input can draw</p>
            </div>
          </div>
          <div className="option-row three">
            {([
              { id: 'auto', title: 'Auto', detail: 'Pencil and finger' },
              { id: 'pencil', title: 'Pencil only', detail: 'Most palm protection' },
              { id: 'finger', title: 'Finger only', detail: 'No Pencil marks' },
            ] as Array<{ id: InputMode; title: string; detail: string }>).map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`option-card compact ${settings.inputMode === mode.id ? 'is-selected' : ''}`}
                onClick={() => {
                  onSettings({ ...settings, inputMode: mode.id })
                  soundManager.play('tap')
                }}
                aria-pressed={settings.inputMode === mode.id}
              >
                <span>
                  <strong>{mode.title}</strong>
                  <small>{mode.detail}</small>
                </span>
              </button>
            ))}
          </div>
          <p className="parent-note">
            Browsers cannot guarantee native iPad palm rejection. Auto mode ignores touch briefly
            after Pencil use. For the strongest palm protection, choose Pencil only.
          </p>
        </section>

        <section className="parent-section">
          <div className="parent-section-head">
            <span className="parent-section-icon art-section"><Icon name="gallery" size={26} /></span>
            <div>
              <h2>Artwork</h2>
              <p>{artworkCount} saved picture{artworkCount === 1 ? '' : 's'} on this iPad</p>
            </div>
          </div>
          <div className="parent-action-row">
            <button type="button" className="secondary-button" onClick={onOpenGallery}>
              <Icon name="gallery" size={22} />
              Open My Artwork
            </button>
            <div className="storage-pill">
              <span>Storage</span>
              <strong>{usage ? formatBytes(usage.usage) : 'Available'}</strong>
            </div>
          </div>
        </section>

        <section className="parent-section danger-section">
          <div className="parent-section-head">
            <span className="parent-section-icon danger-icon"><Icon name="trash" size={26} /></span>
            <div>
              <h2>Reset this iPad</h2>
              <p>Remove all artwork and settings from this device</p>
            </div>
          </div>
          <button type="button" className="danger-button" onClick={() => setResetOpen(true)}>
            Reset Little Artists
          </button>
        </section>

        <p className="privacy-note">
          Little Artists has no accounts, ads, purchases, or social features. Artwork stays in
          this browser on this device.
        </p>
      </main>

      <Modal open={resetOpen} title="Reset all Little Artists data?" onClose={() => setResetOpen(false)}>
        <p className="modal-copy">
          Every saved drawing, draft, completed coloring page, and setting will be removed from
          this device. This cannot be undone.
        </p>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={() => setResetOpen(false)}>Cancel</button>
          <button
            type="button"
            className="danger-button"
            onClick={() => {
              setResetOpen(false)
              onReset()
            }}
          >
            Reset everything
          </button>
        </div>
      </Modal>
    </div>
  )
}