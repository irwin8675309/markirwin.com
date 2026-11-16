import { MAX_HISTORY_STEPS, MAX_WORKING_DIMENSION } from "../config";
import { buildBarrierMask, floodFillRegion, hexToRgb, type Rgb } from "./floodFill";
import { loadImage } from "./imageUtils";

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * A coloring document keeps the original line art separate from the child's
 * paint layer. That makes region filling, undo, and preserving the original
 * outlines reliable. The source artwork itself is never modified.
 */
export class ColoringEngine {
  readonly canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;

  private readonly context: CanvasRenderingContext2D;
  private readonly baseCanvas: HTMLCanvasElement;
  private readonly baseContext: CanvasRenderingContext2D;
  private readonly colorCanvas: HTMLCanvasElement;
  private readonly colorContext: CanvasRenderingContext2D;
  private barrier: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];
  private renderFrame: number | null = null;

  constructor(canvas: HTMLCanvasElement, image: HTMLImageElement) {
    this.canvas = canvas;
    const naturalWidth = image.naturalWidth || image.width || 1024;
    const naturalHeight = image.naturalHeight || image.height || 1024;
    const scale = Math.min(1, MAX_WORKING_DIMENSION / Math.max(naturalWidth, naturalHeight));
    this.width = Math.max(1, Math.round(naturalWidth * scale));
    this.height = Math.max(1, Math.round(naturalHeight * scale));

    canvas.width = this.width;
    canvas.height = this.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("This device could not open the drawing canvas.");
    this.context = context;

    this.baseCanvas = document.createElement("canvas");
    this.baseCanvas.width = this.width;
    this.baseCanvas.height = this.height;
    const baseContext = this.baseCanvas.getContext("2d", { willReadFrequently: true });
    if (!baseContext) throw new Error("This device could not prepare the picture.");
    this.baseContext = baseContext;
    this.baseContext.drawImage(image, 0, 0, this.width, this.height);

    this.colorCanvas = document.createElement("canvas");
    this.colorCanvas.width = this.width;
    this.colorCanvas.height = this.height;
    const colorContext = this.colorCanvas.getContext("2d", { willReadFrequently: true });
    if (!colorContext) throw new Error("This device could not prepare the colors.");
    this.colorContext = colorContext;

    this.rebuildBarrier();
    this.render();
  }

  private rebuildBarrier(): void {
    const data = this.baseContext.getImageData(0, 0, this.width, this.height).data;
    this.barrier = buildBarrierMask(data, this.width, this.height);
  }

  render(): void {
    const context = this.context;
    context.save();
    context.globalCompositeOperation = "source-over";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, this.width, this.height);
    context.drawImage(this.colorCanvas, 0, 0);
    context.globalCompositeOperation = "multiply";
    context.drawImage(this.baseCanvas, 0, 0);
    context.restore();
  }

  private scheduleRender(): void {
    if (this.renderFrame !== null) return;
    this.renderFrame = requestAnimationFrame(() => {
      this.renderFrame = null;
      this.render();
    });
  }

  getHistoryState(): HistoryState {
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
    };
  }

  pushHistory(): void {
    this.undoStack.push(this.colorContext.getImageData(0, 0, this.width, this.height));
    if (this.undoStack.length > MAX_HISTORY_STEPS) this.undoStack.shift();
    this.redoStack = [];
  }

  undo(): boolean {
    const previous = this.undoStack.pop();
    if (!previous) return false;
    this.redoStack.push(this.colorContext.getImageData(0, 0, this.width, this.height));
    this.colorContext.putImageData(previous, 0, 0);
    this.render();
    return true;
  }

  redo(): boolean {
    const next = this.redoStack.pop();
    if (!next) return false;
    this.undoStack.push(this.colorContext.getImageData(0, 0, this.width, this.height));
    this.colorContext.putImageData(next, 0, 0);
    this.render();
    return true;
  }

  drawSegment(
    from: Point,
    to: Point,
    color: string,
    size: number,
    erase: boolean,
    pressure = 0.5,
  ): void {
    const context = this.colorContext;
    const width = Math.max(1, size * (0.45 + Math.max(0, Math.min(1, pressure)) * 1.05));
    context.save();
    context.globalCompositeOperation = erase ? "destination-out" : "source-over";
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = width;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    if (Math.abs(to.x - from.x) < 0.1 && Math.abs(to.y - from.y) < 0.1) {
      context.beginPath();
      context.arc(to.x, to.y, width / 2, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
    this.scheduleRender();
  }

  fillAt(x: number, y: number, color: string): number {
    const data = this.colorContext.getImageData(0, 0, this.width, this.height);
    const fill: Rgb = hexToRgb(color);
    const changed = floodFillRegion(data.data, this.barrier, this.width, this.height, x, y, fill);
    if (changed > 0) {
      this.pushHistory();
      this.colorContext.putImageData(data, 0, 0);
      this.render();
    }
    return changed;
  }

  clear(): void {
    this.pushHistory();
    this.colorContext.clearRect(0, 0, this.width, this.height);
    this.render();
  }

  baseDataUrl(): string {
    return this.baseCanvas.toDataURL("image/png");
  }

  colorDataUrl(): string {
    return this.colorCanvas.toDataURL("image/png");
  }

  previewDataUrl(maxDimension = 560): string {
    this.render();
    const preview = document.createElement("canvas");
    const scale = Math.min(1, maxDimension / Math.max(this.width, this.height));
    preview.width = Math.max(1, Math.round(this.width * scale));
    preview.height = Math.max(1, Math.round(this.height * scale));
    const context = preview.getContext("2d");
    if (!context) return this.canvas.toDataURL("image/png");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, preview.width, preview.height);
    context.drawImage(this.canvas, 0, 0, preview.width, preview.height);
    return preview.toDataURL("image/png");
  }

  async loadSaved(baseUrl: string, colorUrl?: string): Promise<void> {
    const [base, color] = await Promise.all([
      loadImage(baseUrl),
      colorUrl ? loadImage(colorUrl) : Promise.resolve(null),
    ]);

    this.baseContext.clearRect(0, 0, this.width, this.height);
    this.baseContext.drawImage(base, 0, 0, this.width, this.height);
    this.colorContext.clearRect(0, 0, this.width, this.height);
    if (color) this.colorContext.drawImage(color, 0, 0, this.width, this.height);
    this.undoStack = [];
    this.redoStack = [];
    this.rebuildBarrier();
    this.render();
  }
}