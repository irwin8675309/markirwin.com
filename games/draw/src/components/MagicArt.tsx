import { useState } from 'react'
import { Icon } from './common/Icons'
import { MAGIC_SCENES, MagicSceneArt, type MagicSceneId } from '../magic/MagicScenes'
import { soundManager } from '../audio/SoundManager'

interface MagicArtProps {
  onBack: () => void
}

export function MagicArt({ onBack }: MagicArtProps) {
  const [selected, setSelected] = useState<MagicSceneId | null>(null)
  const [runId, setRunId] = useState(0)
  const scene = MAGIC_SCENES.find((item) => item.id === selected)

  const startScene = (id: MagicSceneId) => {
    soundManager.play('sparkle')
    setSelected(id)
    setRunId((value) => value + 1)
  }

  if (scene) {
    return (
      <div className={`magic-scene-full ${scene.className}`}>
        <header className="screen-header magic-header">
          <button
            type="button"
            className="round-button light"
            onClick={() => { setSelected(null); soundManager.play('tap') }}
            aria-label="Back to magic activities"
          >
            <Icon name="back" size={26} />
          </button>
          <div className="screen-title light">
            <h1>{scene.title}</h1>
            <p>{scene.subtitle}</p>
          </div>
          <button
            type="button"
            className="round-button light"
            onClick={() => { soundManager.play('sparkle'); setRunId((value) => value + 1) }}
            aria-label="Play magic again"
          >
            <Icon name="sparkle" size={26} />
          </button>
        </header>
        <main className="magic-scene-stage" key={`${scene.id}-${runId}`}>
          <MagicSceneArt scene={scene.id} />
          <div className="magic-ribbon">Magic Art</div>
        </main>
      </div>
    )
  }

  return (
    <div className="screen magic-screen">
      <header className="screen-header">
        <button type="button" className="round-button" onClick={onBack} aria-label="Back home">
          <Icon name="home" size={26} />
        </button>
        <div className="screen-title">
          <h1>Magic Art</h1>
          <p>Tap a picture to make it come alive</p>
        </div>
        <div className="header-spacer" />
      </header>

      <main className="magic-grid">
        {MAGIC_SCENES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`magic-card ${item.className}`}
            onClick={() => startScene(item.id)}
          >
            <span className="magic-card-art">
              <MagicSceneArt scene={item.id} />
            </span>
            <span className="magic-card-copy">
              <span className="magic-title">{item.title}</span>
              <span className="magic-subtitle">{item.subtitle}</span>
            </span>
            <span className="magic-play">
              <Icon name="play" size={24} />
            </span>
          </button>
        ))}
      </main>
      <p className="magic-note">More magical pictures are on the way</p>
    </div>
  )
}