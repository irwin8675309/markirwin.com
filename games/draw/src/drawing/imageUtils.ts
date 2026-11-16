export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This picture could not be opened."));
    image.src = url;
  });
}

export function canvasToDataUrl(canvas: HTMLCanvasElement, maxDimension?: number): string {
  if (!maxDimension) return canvas.toDataURL("image/png");

  const longest = Math.max(canvas.width, canvas.height);
  if (longest <= maxDimension) return canvas.toDataURL("image/png");

  const scale = maxDimension / longest;
  const preview = document.createElement("canvas");
  preview.width = Math.max(1, Math.round(canvas.width * scale));
  preview.height = Math.max(1, Math.round(canvas.height * scale));
  const context = preview.getContext("2d");
  if (!context) return canvas.toDataURL("image/png");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, preview.width, preview.height);
  context.drawImage(canvas, 0, 0, preview.width, preview.height);
  return preview.toDataURL("image/png");
}

export function makePreview(source: HTMLCanvasElement | HTMLImageElement, maxDimension = 560): string {
  const width = source instanceof HTMLCanvasElement ? source.width : source.naturalWidth;
  const height = source instanceof HTMLCanvasElement ? source.height : source.naturalHeight;
  const longest = Math.max(width, height) || 1;
  const scale = Math.min(1, maxDimension / longest);
  const preview = document.createElement("canvas");
  preview.width = Math.max(1, Math.round(width * scale));
  preview.height = Math.max(1, Math.round(height * scale));
  const context = preview.getContext("2d");
  if (!context) return "";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, preview.width, preview.height);
  context.drawImage(source, 0, 0, preview.width, preview.height);
  return preview.toDataURL("image/png");
}

export async function composeColoringExport(
  baseUrl: string,
  colorUrl: string | undefined,
  maxDimension?: number,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const base = await loadImage(baseUrl);
  const color = colorUrl ? await loadImage(colorUrl) : null;
  const width = base.naturalWidth || base.width;
  const height = base.naturalHeight || base.height;

  const scale = maxDimension ? Math.min(1, maxDimension / Math.max(width, height)) : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This device could not create an image.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (color) context.drawImage(color, 0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "multiply";
  context.drawImage(base, 0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "source-over";

  return { dataUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
}

export function safeFilename(title: string): string {
  const cleaned = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "my-artwork";
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = `${safeFilename(filename)}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}