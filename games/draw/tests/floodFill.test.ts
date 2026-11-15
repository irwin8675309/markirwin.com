import { describe, expect, it } from 'vitest'
import {
  buildBarrier,
  dilate,
  findOpenStart,
  floodFill,
} from '../src/coloring/floodFill'

function image(width: number, height: number) {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
  } as unknown as ImageData
}

function setPixel(data: ImageData, x: number, y: number, r: number, g: number, b: number, a = 255) {
  const offset = (y * data.width + x) * 4
  data.data[offset] = r
  data.data[offset + 1] = g
  data.data[offset + 2] = b
  data.data[offset + 3] = a
}

function getPixel(data: ImageData, x: number, y: number) {
  const offset = (y * data.width + x) * 4
  return [data.data[offset], data.data[offset + 1], data.data[offset + 2], data.data[offset + 3]]
}

describe('flood fill', () => {
  it('fills one side of a closed barrier without crossing it', () => {
    const width = 10
    const height = 10
    const imageData = image(width, height)
    const barrier = new Uint8Array(width * height)
    for (let y = 0; y < height; y += 1) barrier[y * width + 5] = 1

    const result = floodFill(imageData, barrier, 2, 5, '#ff0000')
    expect(result.changed).toBe(width / 2 * height)
    expect(getPixel(result.imageData, 2, 5)).toEqual([255, 0, 0, 255])
    expect(getPixel(result.imageData, 8, 5)).toEqual([0, 0, 0, 0])
  })

  it('does not cross into a neighboring area with a different color', () => {
    const width = 8
    const height = 8
    const imageData = image(width, height)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (x < 4) setPixel(imageData, x, y, 10, 20, 30, 255)
        else setPixel(imageData, x, y, 200, 200, 200, 255)
      }
    }
    const barrier = new Uint8Array(width * height)
    const result = floodFill(imageData, barrier, 1, 1, '#ff0000', 5)
    expect(result.changed).toBe(4 * height)
    expect(getPixel(result.imageData, 1, 1)).toEqual([255, 0, 0, 255])
    expect(getPixel(result.imageData, 6, 1)).toEqual([200, 200, 200, 255])
  })

  it('searches nearby when a tap lands exactly on an outline', () => {
    const width = 10
    const height = 10
    const imageData = image(width, height)
    const barrier = new Uint8Array(width * height)
    barrier[5 * width + 5] = 1
    const start = findOpenStart(barrier, width, height, 5, 5, 3)
    expect(start).not.toBeNull()
    expect(barrier[(start?.y ?? 0) * width + (start?.x ?? 0)]).toBe(0)
    expect(Math.abs((start?.x ?? 0) - 5)).toBeLessThanOrEqual(3)
    expect(Math.abs((start?.y ?? 0) - 5)).toBeLessThanOrEqual(3)
  })

  it('builds a barrier from line-art alpha and closes tiny gaps with dilation', () => {
    const width = 9
    const height = 9
    const line = image(width, height)
    for (let x = 0; x < width; x += 1) setPixel(line, x, 4, 0, 0, 0, 200)
    setPixel(line, 4, 4, 0, 0, 0, 0)
    const barrier = buildBarrier(line, 24, 1)
    expect(barrier[4 * width + 4]).toBe(1)
    expect(dilate(new Uint8Array([1, 0, 0]), 3, 1, 1)).toEqual(new Uint8Array([1, 1, 0]))
  })
})