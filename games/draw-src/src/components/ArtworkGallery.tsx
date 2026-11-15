import { useState } from 'react'
import type { SavedArtwork } from '../types'
import { formatDate } from '../utils/helpers'
import { Icon } from './common/Icons'
import { Modal } from './common/Modal'
import { soundManager } from '../audio/SoundManager'

interface ArtworkGalleryProps {
  artworks: SavedArtwork[]
  onBack: () => void
  onNew: () => void
  onEdit: (artwork: SavedArtwork) => void
  onDuplicate: (artwork: SavedArtwork) => void
  onDelete: (artwork: SavedArtwork) => void
  onDownload: (artwork: SavedArtwork) => void
  onShare: (artwork: SavedArtwork) => void
  onArtWall: () => void
}

export function ArtworkGallery({
  artworks,
  onBack,
  onNew,
  onEdit,
  onDuplicate,
  onDelete,
  onDownload,
  onShare,
  onArtWall,
}: ArtworkGalleryProps) {
  const [pendingDelete, setPendingDelete] = useState<SavedArtwork | null>(null)

  return (
    <div className="screen gallery-screen">
      <header className="screen-header">
        <button type="button" className="round-button" onClick={onBack} aria-label="Back home">
          <Icon name="home" size={26} />
        </button>
        <div className="screen-title">
          <h1>My Artwork</h1>
          <p>{artworks.length === 0 ? 'Your gallery is waiting' : `${artworks.length} lovely creation${artworks.length === 1 ? '' : 's'}`}</p>
        </div>
        <div className="gallery-header-actions">
          {artworks.length > 1 && (
            <button type="button" className="pill-button" onClick={onArtWall}>
              <Icon name="play" size={22} />
              Art Wall
            </button>
          )}
          <button type="button" className="primary-button" onClick={onNew}>
            <Icon name="plus" size={24} />
            New
          </button>
        </div>
      </header>

      {artworks.length === 0 ? (
        <main className="empty-gallery">
          <div className="empty-art" aria-hidden="true">
            <span className="empty-frame frame-one" />
            <span className="empty-frame frame-two" />
            <span className="empty-frame frame-three" />
            <span className="empty-star">★</span>
          </div>
          <h2>Nothing here yet</h2>
          <p>Draw a picture and tap Save. It will appear right here.</p>
          <button type="button" className="primary-button big" onClick={onNew}>
            <Icon name="brush" size={28} />
            Make something
          </button>
        </main>
      ) : (
        <main className="artwork-grid">
          {artworks.map((artwork) => (
            <article className="artwork-card" key={artwork.id}>
              <button
                type="button"
                className="artwork-preview"
                onClick={() => { soundManager.play('pop'); onEdit(artwork) }}
                aria-label={`Open ${artwork.title}`}
              >
                <img src={artwork.thumbnail} alt={artwork.title} loading="lazy" />
                <span className="artwork-open">Open</span>
              </button>
              <div className="artwork-info">
                <div>
                  <h2>{artwork.title}</h2>
                  <p>{formatDate(artwork.updatedAt)}</p>
                </div>
                <div className="artwork-actions">
                  <button type="button" className="mini-button" onClick={() => onEdit(artwork)} aria-label="Edit artwork">
                    <Icon name="pencil" size={21} />
                  </button>
                  <button type="button" className="mini-button" onClick={() => onDuplicate(artwork)} aria-label="Make a copy">
                    <Icon name="plus" size={21} />
                  </button>
                  <button type="button" className="mini-button" onClick={() => onDownload(artwork)} aria-label="Save image">
                    <Icon name="download" size={21} />
                  </button>
                  <button type="button" className="mini-button" onClick={() => onShare(artwork)} aria-label="Share artwork">
                    <Icon name="share" size={21} />
                  </button>
                  <button
                    type="button"
                    className="mini-button mini-danger"
                    onClick={() => setPendingDelete(artwork)}
                    aria-label="Delete artwork"
                  >
                    <Icon name="trash" size={21} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </main>
      )}

      <Modal
        open={Boolean(pendingDelete)}
        title="Delete this artwork?"
        onClose={() => setPendingDelete(null)}
      >
        <p className="modal-copy">This picture will be removed from My Artwork. This cannot be undone.</p>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={() => setPendingDelete(null)}>Keep it</button>
          <button
            type="button"
            className="danger-button"
            onClick={() => {
              if (pendingDelete) {
                soundManager.play('pop')
                onDelete(pendingDelete)
              }
              setPendingDelete(null)
            }}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  )
}