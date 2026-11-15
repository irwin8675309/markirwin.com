import { useMemo, useState } from 'react'
import {
  COLORING_CATEGORIES,
  COLORING_TEMPLATES,
  type ColoringCategory,
  type ColoringTemplate,
} from '../templates/coloringPages'
import { Icon } from './common/Icons'
import { soundManager } from '../audio/SoundManager'

interface ColoringGalleryProps {
  completed: string[]
  onBack: () => void
  onSelect: (template: ColoringTemplate) => void
}

function svgUrl(template: ColoringTemplate) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(template.svg)}`
}

export function ColoringGallery({ completed, onBack, onSelect }: ColoringGalleryProps) {
  const [category, setCategory] = useState<ColoringCategory | 'All'>('All')
  const pages = useMemo(() => {
    const filtered = category === 'All'
      ? COLORING_TEMPLATES
      : COLORING_TEMPLATES.filter((template) => template.category === category)
    return [...filtered].sort((a, b) => {
      if (a.difficulty === b.difficulty) return 0
      return a.difficulty === 'easy' ? -1 : 1
    })
  }, [category])

  const categoryPreview = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of COLORING_CATEGORIES) {
      const template = COLORING_TEMPLATES.find((entry) => entry.category === item)
      if (template) map.set(item, svgUrl(template))
    }
    return map
  }, [])

  return (
    <div className="screen coloring-gallery-screen">
      <header className="screen-header">
        <button type="button" className="round-button" onClick={onBack} aria-label="Back home">
          <Icon name="home" size={26} />
        </button>
        <div className="screen-title">
          <h1>Coloring Book</h1>
          <p>{completed.length} happy pictures colored</p>
        </div>
        <div className="header-spacer" />
      </header>

      <div className="category-scroller" role="tablist" aria-label="Coloring categories">
        <button
          type="button"
          role="tab"
          aria-selected={category === 'All'}
          className={`category-chip category-all ${category === 'All' ? 'is-active' : ''}`}
          onClick={() => { soundManager.play('tap'); setCategory('All') }}
        >
          <span className="all-icon"><Icon name="palette" size={28} /></span>
          <span>All</span>
        </button>
        {COLORING_CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={category === item}
            className={`category-chip ${category === item ? 'is-active' : ''}`}
            onClick={() => { soundManager.play('tap'); setCategory(item) }}
          >
            {categoryPreview.get(item) && (
              <img src={categoryPreview.get(item)} alt="" draggable={false} />
            )}
            <span>{item}</span>
          </button>
        ))}
      </div>

      <main className="coloring-page-grid">
        {pages.map((template) => {
          const isComplete = completed.includes(template.id)
          return (
            <button
              key={template.id}
              type="button"
              className={`coloring-page-card ${isComplete ? 'is-complete' : ''}`}
              onClick={() => {
                soundManager.play('pop')
                onSelect(template)
              }}
              aria-label={`${template.title}${isComplete ? ', already colored' : ''}`}
            >
              <span className="page-preview" style={{ background: template.accent }}>
                <img src={svgUrl(template)} alt="" draggable={false} />
              </span>
              <span className="page-copy">
                <span className="page-title">{template.title}</span>
                <span className="page-category">{template.category}</span>
              </span>
              {isComplete && (
                <span className="complete-badge" aria-label="Already colored">
                  <Icon name="check" size={20} />
                </span>
              )}
            </button>
          )
        })}
      </main>
    </div>
  )
}