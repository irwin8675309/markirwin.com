import { COLORING_RESOLUTION, DESIGN_HEIGHT, DESIGN_WIDTH, STICKER_BASE_PERCENT } from '../config'
import { renderStroke } from '../drawing/brushes'
import { floodFillCanvas } from '../coloring/floodFill'
import {
  coloringTemplateManager,
  type LoadedColoringTemplate,
} from '../templates/coloringPages'
import {
  backgroundDataUrl,
  getBackground,
  getSticker,
  stickerDataUrl,
} from '../stickers/stickerLibrary'
import type { ArtworkDocument, ColorElement, StickerInstance } from '../types'

const imageCache = new Map<string, Promise<HTMLImageElement>>()

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src)
  if (cached) return cached
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image could not be loaded'))
    image.src = src
  })
  imageCache.set(src, promise)
  return promise
}

async function loadBackground(id: string | undefined): Promise<HTMLImageElement | null> {
  const background = getBackground(id)
  if (!background) return null
  return loadImage(backgroundDataUrl(background))
}

async function loadStickerImage(stickerId: string): Promise<HTMLImageElement | null> {
  const sticker = getSticker(stickerId)
  if (!sticker) return null
  return loadImage(stickerDataUrl(sticker))
}

function drawBackground(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null, width: number, height: number) {
  ctx.fillStyle = '#fffdf7'
  ctx.fillRect(0, 0, width, height)
  if (!image) return
  ctx.save()
  ctx.globalAlpha = 0.95
  ctx.drawImage(image, 0, 0, width, height)
  ctx.restore()
}

function renderElements(
  elements: ColorElement[],
  width: number,
  height: number,
  lineArt: LoadedColoringTemplate | null,
): HTMLCanvasElement {
  const canvas = window.document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return canvas
  for (const element of elements) {
    if (element.kind === 'stroke') {
      renderStroke(ctx, element, width, height)
    } else if (lineArt) {
      floodFillCanvas(
        ctx,
        lineArt.barrier,
        element.x * canvas.width,
        element.y * canvas.height,
        element.color,
        18,
      )
    }
  }
  return canvas
}

function drawSticker(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  sticker: StickerInstance,
  width: number,
  height: number,
) {
  const size = (STICKER_BASE_PERCENT / 100) * width * sticker.scale
  ctx.save()
  ctx.translate(sticker.x * width, sticker.y * height)
  ctx.rotate((sticker.rotation * Math.PI) / 180)
  ctx.drawImage(image, -size / 2, -size / 2, size, size)
  ctx.restore()
}

export async function renderArtworkToCanvas(
  document: ArtworkDocument,
  options: { width?: number; height?: number } = {},
): Promise<HTMLCanvasElement> {
  const width = options.width ?? DESIGN_WIDTH
  const height = options.height ?? DESIGN_HEIGHT
  const canvas = window.document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const backgroundImage = await loadBackground(document.backgroundId)
  drawBackground(ctx, backgroundImage, width, height)

  let lineArt: LoadedColoringTemplate | null = null
  if (document.mode === 'coloring' && document.templateId) {
    const template = coloringTemplateManager.getTemplate(document.templateId)
    if (template) {
      try {
        lineArt = await coloringTemplateManager.load(template)
      } catch {
        lineArt = null
      }
    }
  }

  if (document.mode === 'coloring' && lineArt) {
    const square = Math.min(width, height)
    const offsetX = (width - square) / 2
    const offsetY = (height - square) / 2
    const colorLayer = renderElements(document.elements, COLORING_RESOLUTION, COLORING_RESOLUTION, lineArt)
    ctx.drawImage(colorLayer, offsetX, offsetY, square, square)
    ctx.drawImage(lineArt.image, offsetX, offsetY, square, square)
  } else {
    const colorLayer = renderElements(document.elements, width, height, null)
    ctx.drawImage(colorLayer, 0, 0)
  }

  if (document.stickers.length > 0) {
    const images = await Promise.all(document.stickers.map((sticker) => loadStickerImage(sticker.stickerId)))
    document.stickers.forEach((sticker, index) => {
      const image = images[index]
      if (image) drawSticker(ctx, image, sticker, width, height)
    })
  }

  return canvas
}

export async function renderArtworkThumbnail(document: ArtworkDocument): Promise<string> {
  const canvas = await renderArtworkToCanvas(document, { width: 800, height: 600 })
  return canvas.toDataURL('image/jpeg', 0.82)
}

export async function renderArtworkBlob(document: ArtworkDocument): Promise<Blob> {
  const canvas = await renderArtworkToCanvas(document, { width: 1600, height: 1200 })
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Could not create artwork image'))
    }, 'image/png')
  })
}

export async function downloadArtwork(document: ArtworkDocument, filename = 'little-artists-artwork.png') {
  const blob = await renderArtworkBlob(document)
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function shareArtwork(document: ArtworkDocument): Promise<'shared' | 'downloaded' | 'unavailable'> {
  const blob = await renderArtworkBlob(document)
  const file = new File([blob], 'little-artists-artwork.png', { type: 'image/png' })
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean
  }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: 'My Little Artists artwork',
        text: 'Look what I made!',
      })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'unavailable'
    }
  }
  await downloadArtwork(document)
  return 'downloaded'
}