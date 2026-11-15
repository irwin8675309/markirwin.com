import { describe, expect, it } from 'vitest'
import {
  COLORING_CATEGORIES,
  COLORING_TEMPLATES,
} from '../src/templates/coloringPages'
import { STICKERS, STICKER_CATEGORIES } from '../src/stickers/stickerLibrary'

describe('original coloring library', () => {
  it('has at least 30 pages and unique ids', () => {
    expect(COLORING_TEMPLATES.length).toBeGreaterThanOrEqual(30)
    expect(new Set(COLORING_TEMPLATES.map((template) => template.id)).size).toBe(COLORING_TEMPLATES.length)
  })

  it('includes horse and unicorn pages for animal-loving artists', () => {
    const horsePages = COLORING_TEMPLATES.filter((template) => template.category === 'Horses & Ponies')
    const unicornPages = COLORING_TEMPLATES.filter((template) => template.category === 'Unicorns')
    expect(horsePages.length).toBeGreaterThanOrEqual(3)
    expect(unicornPages.length).toBeGreaterThanOrEqual(2)
    expect(COLORING_CATEGORIES).toContain('Horses & Ponies')
  })

  it('keeps every page as a self-contained original SVG', () => {
    for (const template of COLORING_TEMPLATES) {
      expect(template.svg.startsWith('<svg')).toBe(true)
      expect(template.svg).toContain('viewBox="0 0 800 800"')
      expect(template.svg).not.toContain('<image')
    }
  })
})

describe('sticker library', () => {
  it('has transparent SVG stickers in every category', () => {
    expect(STICKERS.length).toBeGreaterThanOrEqual(30)
    expect(new Set(STICKERS.map((sticker) => sticker.id)).size).toBe(STICKERS.length)
    for (const category of STICKER_CATEGORIES) {
      expect(STICKERS.some((sticker) => sticker.category === category)).toBe(true)
    }
    for (const sticker of STICKERS) {
      expect(sticker.svg.startsWith('<svg')).toBe(true)
      expect(sticker.svg).not.toContain('<image')
    }
  })
})