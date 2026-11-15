import type { AppSettings, BrushType, ExperienceMode, StampShape } from './types'

export const DESIGN_WIDTH = 1600
export const DESIGN_HEIGHT = 1200
export const COLORING_RESOLUTION = 1200
export const STICKER_BASE_PERCENT = 17

export const BRUSH_SIZES: Record<'medium' | 'large' | 'extra', number> = {
  medium: 34,
  large: 62,
  extra: 100,
}

export const EASY_BRUSH_SIZES: Record<'large' | 'extra', number> = {
  large: 72,
  extra: 120,
}

export const BRUSHES: Array<{
  id: Exclude<BrushType, 'eraser'>
  name: string
  description: string
}> = [
  { id: 'crayon', name: 'Crayon', description: 'Soft and scribbly' },
  { id: 'marker', name: 'Marker', description: 'Bold and smooth' },
  { id: 'paintbrush', name: 'Paint', description: 'Soft and painterly' },
  { id: 'rainbow', name: 'Rainbow', description: 'Every color at once' },
  { id: 'glitter', name: 'Glitter', description: 'A trail of sparkles' },
  { id: 'stamp', name: 'Stamps', description: 'Little shapes along the way' },
]

export const STAMP_SHAPES: Array<{ id: StampShape; name: string }> = [
  { id: 'heart', name: 'Hearts' },
  { id: 'star', name: 'Stars' },
  { id: 'flower', name: 'Flowers' },
  { id: 'butterfly', name: 'Butterflies' },
  { id: 'smile', name: 'Smiles' },
]

export const PALETTE = [
  { name: 'Red', value: '#ef4b5f' },
  { name: 'Orange', value: '#ff8a3d' },
  { name: 'Yellow', value: '#ffd93d' },
  { name: 'Green', value: '#5ec96d' },
  { name: 'Blue', value: '#4aa8ff' },
  { name: 'Purple', value: '#a879f2' },
  { name: 'Pink', value: '#ff8fc7' },
  { name: 'Brown', value: '#a96d45' },
  { name: 'Black', value: '#303044' },
  { name: 'White', value: '#ffffff' },
] as const

export const EXTRA_PALETTE = [
  { name: 'Peach', value: '#ffc6a8' },
  { name: 'Lemon', value: '#fff08a' },
  { name: 'Mint', value: '#a9efd3' },
  { name: 'Sky', value: '#b9e4ff' },
  { name: 'Lilac', value: '#d9c6ff' },
  { name: 'Rose', value: '#ffc4df' },
  { name: 'Sand', value: '#e8d8a8' },
  { name: 'Teal', value: '#45c4bd' },
  { name: 'Coral', value: '#ff7c72' },
  { name: 'Indigo', value: '#6877c8' },
] as const

export const EASY_COLORS = ['#ef4b5f', '#ff8a3d', '#ffd93d', '#5ec96d', '#4aa8ff', '#a879f2'] as const

export const DEFAULT_SETTINGS: AppSettings = {
  sound: true,
  experience: 'easy',
  inputMode: 'auto',
}

export const EXPERIENCE_LABEL: Record<ExperienceMode, string> = {
  easy: 'Easy',
  creative: 'Creative',
}