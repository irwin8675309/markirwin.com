import type { ReactNode } from 'react'
import { Icon } from '../components/common/Icons'
import { soundManager } from '../audio/SoundManager'
import type { AppSettings } from '../types'

interface HomeScreenProps {
  settings: AppSettings
  artworkCount: number
  onNavigate: (screen: 'draw' | 'coloring' | 'magic' | 'stickers' | 'gallery') => void
  onToggleSound: () => void
  onParent: () => void
}

function FreeDrawArt() {
  return (
    <svg viewBox="0 0 220 130" aria-hidden="true">
      <rect x="25" y="15" width="120" height="94" rx="12" fill="#fffdf7" stroke="#d8cfbf" strokeWidth="4" transform="rotate(-4 85 62)" />
      <path d="M45 78c18-42 28 26 45-9s24 24 42-5" fill="none" stroke="#ef4b5f" strokeWidth="9" strokeLinecap="round" />
      <path d="M48 92c15-22 24 10 39-8s21 14 38-2" fill="none" stroke="#4aa8ff" strokeWidth="7" strokeLinecap="round" />
      <g transform="rotate(18 166 78)">
        <rect x="155" y="30" width="22" height="70" rx="8" fill="#ffd93d" stroke="#3b3553" strokeWidth="3" />
        <path d="M155 100h22l-11 22-11-22Z" fill="#ff8fc7" stroke="#3b3553" strokeWidth="3" />
        <path d="M158 45h16" stroke="#fff4dc" strokeWidth="5" strokeLinecap="round" />
      </g>
      <circle cx="183" cy="32" r="8" fill="#ff8fc7" />
      <circle cx="43" cy="34" r="5" fill="#5ec96d" />
    </svg>
  )
}

function ColoringArt() {
  return (
    <svg viewBox="0 0 220 130" aria-hidden="true">
      <path d="M28 26c30-10 58-6 82 8 24-14 52-18 82-8v78c-30-8-58-4-82 8-24-12-52-16-82-8V26Z" fill="#fffdf7" stroke="#3b3553" strokeWidth="4" strokeLinejoin="round" />
      <path d="M110 34v78" stroke="#d8cfbf" strokeWidth="4" />
      <g transform="translate(112 40)">
        <path d="M8 64 Q4 28 30 14 Q52 2 68 18 Q80 32 70 48 L62 64" fill="#fff4f8" stroke="#3b3553" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M30 14 Q26 2 36 -2 Q44 8 44 18" fill="#ffd1a8" stroke="#3b3553" strokeWidth="2.5"/>
        <path d="M58 18 Q64 4 72 2 Q76 12 72 24" fill="#ffd1a8" stroke="#3b3553" strokeWidth="2.5"/>
        <path d="M68 26 Q76 28 78 36" fill="none" stroke="#3b3553" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="58" cy="32" r="2.4" fill="#3b3553"/>
        <path d="M30 18 Q18 34 20 52 Q28 62 40 52" fill="#ffb6d5" stroke="#3b3553" strokeWidth="2.5"/>
        <path d="M44 50 Q50 54 56 50" fill="none" stroke="#3b3553" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M46 8 L50 -8" stroke="#ffd93d" strokeWidth="5" strokeLinecap="round"/>
      </g>
      <path d="M48 40c10 4 15 10 18 20" stroke="#5ec96d" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="54" cy="38" r="7" fill="#ff8fc7" />
      <circle cx="53" cy="84" r="7" fill="#4aa8ff" />
      <path d="m180 30 4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z" fill="#ffd93d" />
    </svg>
  )
}

function MagicArt() {
  return (
    <svg viewBox="0 0 220 130" aria-hidden="true">
      <path d="M42 104 126 34" stroke="#a879f2" strokeWidth="12" strokeLinecap="round" />
      <path d="m128 28 5 14 15 5-15 5-5 14-5-14-15-5 15-5 5-14Z" fill="#ffd93d" stroke="#3b3553" strokeWidth="2" />
      <path d="m162 66 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="#ff8fc7" />
      <path d="M52 32c.6 5 2.6 7 7.6 7.6-5 .6-7 2.6-7.6 7.6-.6-5-2.6-7-7.6-7.6 5-.6 7-2.6 7.6-7.6Z" fill="#4aa8ff" />
      <path d="M174 26c.4 3.4 1.8 4.8 5.2 5.2-3.4.4-4.8 1.8-5.2 5.2-.4-3.4-1.8-4.8-5.2-5.2 3.4-.4 4.8-1.8 5.2-5.2Z" fill="#5ec96d" />
      <circle cx="190" cy="104" r="5" fill="#ffd93d" />
      <circle cx="74" cy="90" r="4" fill="#ff8fc7" />
    </svg>
  )
}

function StickerArt() {
  return (
    <svg viewBox="0 0 220 130" aria-hidden="true">
      <g transform="translate(44 24) rotate(-12)">
        <path d="M30 4 40 26l24 3-18 16 5 24-21-12-21 12 5-24L-4 29l24-3L30 4Z" fill="#ffd93d" stroke="#3b3553" strokeWidth="3" strokeLinejoin="round" />
      </g>
      <g transform="translate(128 32) rotate(8)">
        <path d="M24 48C-6 28 0 6 15 6c8 0 11 6 12 11 2-5 5-11 13-11 16 0 20 22-8 42Z" fill="#ef4b5f" stroke="#3b3553" strokeWidth="3" />
      </g>
      <g transform="translate(84 58)">
        <circle cx="24" cy="24" r="20" fill="#c6a7ff" stroke="#3b3553" strokeWidth="3" />
        <path d="M10 22q4-7 9 0M29 22q4-7 9 0" fill="none" stroke="#3b3553" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 32q8 7 16 0" fill="none" stroke="#3b3553" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <path d="M170 86c3 8 6 11 14 14-8 3-11 6-14 14-3-8-6-11-14-14 8-3 11-6 14-14Z" fill="#4aa8ff" />
    </svg>
  )
}

function GalleryArt() {
  return (
    <svg viewBox="0 0 220 130" aria-hidden="true">
      <g transform="rotate(-4 66 64)">
        <rect x="26" y="24" width="74" height="82" rx="9" fill="#fffdf7" stroke="#3b3553" strokeWidth="3" />
        <rect x="34" y="32" width="58" height="52" rx="4" fill="#d9f2ff" />
        <circle cx="80" cy="44" r="8" fill="#ffd93d" />
        <path d="M34 84 52 62l13 15 10-11 17 18H34Z" fill="#8fd8a4" />
      </g>
      <g transform="rotate(5 140 62)">
        <rect x="108" y="20" width="70" height="78" rx="9" fill="#fffdf7" stroke="#3b3553" strokeWidth="3" />
        <rect x="116" y="28" width="54" height="48" rx="4" fill="#ffe4f0" />
        <path d="M126 66c4-16 12 4 17-7s10 6 15-2" fill="none" stroke="#a879f2" strokeWidth="5" strokeLinecap="round" />
        <circle cx="158" cy="40" r="5" fill="#ef4b5f" />
      </g>
      <g transform="rotate(-2 190 86)">
        <rect x="168" y="66" width="38" height="46" rx="7" fill="#fff4d6" stroke="#3b3553" strokeWidth="3" />
        <circle cx="187" cy="86" r="10" fill="#ff8fc7" />
      </g>
    </svg>
  )
}

const cards: Array<{
  id: 'draw' | 'coloring' | 'magic' | 'stickers' | 'gallery'
  title: string
  subtitle: string
  className: string
  art: ReactNode
}> = [
  { id: 'draw', title: 'Free Draw', subtitle: 'Make anything', className: 'card-draw', art: <FreeDrawArt /> },
  { id: 'coloring', title: 'Coloring Book', subtitle: 'Color a picture', className: 'card-coloring', art: <ColoringArt /> },
  { id: 'magic', title: 'Magic Art', subtitle: 'Make it move', className: 'card-magic', art: <MagicArt /> },
  { id: 'stickers', title: 'Sticker Studio', subtitle: 'Stick and decorate', className: 'card-stickers', art: <StickerArt /> },
  { id: 'gallery', title: 'My Artwork', subtitle: 'See what you made', className: 'card-gallery', art: <GalleryArt /> },
]

export function HomeScreen({ settings, artworkCount, onNavigate, onToggleSound, onParent }: HomeScreenProps) {
  return (
    <div className="home-screen">
      <div className="home-sky" aria-hidden="true">
        <span className="sun" />
        <span className="cloud cloud-one" />
        <span className="cloud cloud-two" />
        <span className="cloud cloud-three" />
        <span className="hill hill-back" />
        <span className="hill hill-front" />
      </div>

      <header className="home-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-dot dot-red" />
            <span className="brand-dot dot-yellow" />
            <span className="brand-dot dot-blue" />
            <span className="brand-dot dot-green" />
          </span>
          <div>
            <h1>Little Artists</h1>
            <p>A happy little art studio</p>
          </div>
        </div>
        <div className="home-header-actions">
          <button
            type="button"
            className="round-button"
            onClick={() => {
              soundManager.play('tap')
              onToggleSound()
            }}
            aria-label={settings.sound ? 'Turn sound off' : 'Turn sound on'}
          >
            <Icon name={settings.sound ? 'sound' : 'mute'} size={26} />
          </button>
          <button type="button" className="round-button parent-button" onClick={onParent} aria-label="Grown-ups">
            <Icon name="lock" size={24} />
          </button>
        </div>
      </header>

      <main className="home-main">
        <div className="home-cards">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`home-card ${card.className}`}
              onClick={() => {
                soundManager.play('whoosh')
                onNavigate(card.id)
              }}
            >
              <span className="home-card-art">{card.art}</span>
              <span className="home-card-copy">
                <span className="home-card-title">{card.title}</span>
                <span className="home-card-subtitle">{card.subtitle}</span>
              </span>
              {card.id === 'gallery' && artworkCount > 0 && (
                <span className="artwork-count">{artworkCount}</span>
              )}
              <span className="card-go" aria-hidden="true">
                <Icon name="chevron" size={24} />
              </span>
            </button>
          ))}
        </div>
        <p className="home-hint">Pick a picture and start creating</p>
      </main>
    </div>
  )
}