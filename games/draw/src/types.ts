export type BrushType =
  | 'crayon'
  | 'marker'
  | 'paintbrush'
  | 'rainbow'
  | 'glitter'
  | 'stamp'
  | 'eraser'

export type StampShape = 'heart' | 'star' | 'flower' | 'butterfly' | 'smile'

export type InputMode = 'auto' | 'finger' | 'pencil'

export type ExperienceMode = 'easy' | 'creative'

export type StudioMode = 'free' | 'coloring' | 'stickers'

export interface Point {
  x: number
  y: number
  pressure: number
  tiltX?: number
  tiltY?: number
  time: number
}

export interface StrokeElement {
  kind: 'stroke'
  id: string
  brush: BrushType
  color: string
  size: number
  seed: number
  stampShape?: StampShape
  points: Point[]
}

export interface FillElement {
  kind: 'fill'
  id: string
  x: number
  y: number
  color: string
}

export type ColorElement = StrokeElement | FillElement

export interface StickerInstance {
  id: string
  stickerId: string
  x: number
  y: number
  scale: number
  rotation: number
}

export interface ArtworkDocument {
  version: 1
  mode: StudioMode
  templateId?: string
  backgroundId?: string
  elements: ColorElement[]
  stickers: StickerInstance[]
  createdAt: number
  updatedAt: number
}

export interface SavedArtwork {
  id: string
  title: string
  thumbnail: string
  document: ArtworkDocument
  createdAt: number
  updatedAt: number
}

export interface AppSettings {
  sound: boolean
  experience: ExperienceMode
  inputMode: InputMode
}

export interface BrushConfig {
  brush: BrushType
  color: string
  size: number
  stampShape?: StampShape
}

export interface PointInput {
  clientX: number
  clientY: number
  pressure: number
  tiltX?: number
  tiltY?: number
  pointerType: string
  time: number
}