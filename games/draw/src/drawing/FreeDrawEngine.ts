import { MAX_HISTORY_STEPS } from "../config";
import type { Point } from "./ColoringEngine";
import { loadImage } from "./imageUtils";

export class FreeDrawEngine {
  readonly canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;

  private readonly context: CanvasRenderingContext2D;
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    canvas.width = this.width;
    canvas.height = this.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("This device could not open the drawing canvas.");
    this.context = context;
    this.fillWhite();
  }

  private fillWhite(): void {
    this.context.save();
    this.context.globalCompositeOperation = "source-over";
    this.context.fillStyle = "#ffffff";
    this.context.fillRect(0, 0, this.width, this.height);
    this.context.restore();
  }

  getHistoryState(): { canUndo: boolean; canRedo: boolean } {
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
    };
  }

  pushHistory(): void {
    this.undoStack.push(this.context.getImageData(0, 0, this.width, this.height));
    if (this.undoStack.length > MAX_HISTORY_STEPS) this.undoStack.shift();
    this.redoStack = [];
  }

  undo(): boolean {
    const previous = this.undoStack.pop();
    if (!previous) return false;
    this.redoStack.push(this.context.getImageData(0, 0, this.width, this.height));
    this.context.putImageData(previous, 0, 0);
    return true;
  }

  redo(): boolean {
    const next = this.redoStack.pop();
    if (!next) return false;
    this.undoStack.push(this.context.getImageData(0, 0, this.width, this.height));
    this.context.putImageData(next, 0, 0);
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
    const context = this.context;
    const width = Math.max(1, size * (0.45 + Math.max(0, Math.min(1, pressure)) * 1.05));
    context.save();
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = erase ? "#ffffff" : color;
    context.fillStyle = erase ? "#ffffff" : color;
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
  }

  clear(): void {
    this.pushHistory();
    this.fillWhite();
  }

  async load(url: string): Promise<void> {
    const image = await loadImage(url);
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.fillStyle = "#ffffff";
    this.context.fillRect(0, 0, this.width, this.height);
    this.context.drawImage(image, 0, 0, this.width, this.height);
    this.undoStack = [];
    this.redoStack = [];
  }

  dataUrl(): string {
    return this.canvas.toDataURL("image/png");
  }

  previewDataUrl(maxDimension = 560): string {
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
}