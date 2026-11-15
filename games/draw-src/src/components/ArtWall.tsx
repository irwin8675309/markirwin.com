import { useEffect, useState } from 'react'
import type { SavedArtwork } from '../types'
import { Icon } from './common/Icons'
import { soundManager } from '../audio/SoundManager'

interface ArtWallProps {
  artworks: SavedArtwork[]
  onBack: () => void
}

export function ArtWall({ artworks, onBack }: ArtWallProps) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing || artworks.length < 2) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % artworks.length)
    }, 5200)
    return () => window.clearInterval(timer)
  }, [artworks.length, playing])

  useEffect(() => {
    if (index >= artworks.length) setIndex(0)
  }, [artworks.length, index])

  const artwork = artworks[index]

  return (
    <div className="art-wall">
      <header className="screen-header art-wall-header">
        <button type="button" className="round-button light" onClick={onBack} aria-label="Back">
          <Icon name="back" size={26} />
        </button>
        <div className="screen-title light">
          <h1>My Art Wall</h1>
          <p>A rotating gallery of your creations</p>
        </div>
        <button
          type="button"
          className="round-button light"
          onClick={() => { setPlaying((value) => !value); soundManager.play('tap') }}
          aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
        >
          <Icon name={playing ? 'pause' : 'play'} size={24} />
        </button>
      </header>

      {artwork ? (
        <main className="art-wall-stage">
          <div className="art-wall-frame" key={artwork.id}>
            <img src={artwork.thumbnail} alt={artwork.title} />
          </div>
          <div className="art-wall-caption">
            <h2>{artwork.title}</h2>
            <div className="art-wall-dots">
              {artworks.map((item, dotIndex) => (
                <button
                  key={item.id}
                  type="button"
                  className={dotIndex === index ? 'is-active' : ''}
                  onClick={() => { setIndex(dotIndex); setPlaying(false); soundManager.play('tap') }}
                  aria-label={`Show ${item.title}`}
                />
              ))}
            </div>
          </div>
          {artworks.length > 1 && (
            <div className="art-wall-arrows">
              <button
                type="button"
                className="round-button light"
                onClick={() => { setIndex((current) => (current - 1 + artworks.length) % artworks.length); setPlaying(false) }}
                aria-label="Previous artwork"
              >
                <Icon name="back" size={26} />
              </button>
              <button
                type="button"
                className="round-button light"
                onClick={() => { setIndex((current) => (current + 1) % artworks.length); setPlaying(false) }}
                aria-label="Next artwork"
              >
                <Icon name="chevron" size={26} />
              </button>
            </div>
          )}
        </main>
      ) : (
        <main className="empty-gallery light">
          <h2>No artwork yet</h2>
          <p>Save a picture first, then come back to see it on the wall.</p>
          <button type="button" className="primary-button" onClick={onBack}>Back</button>
        </main>
      )}
    </div>
  )
}