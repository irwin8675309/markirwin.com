import { getAsset, saveAsset } from "../storage/db";

const memoryUrls = new Map<string, string>();

/**
 * Returns a stable blob URL for a remote image. Online loads refresh the
 * IndexedDB copy; offline loads fall back to the last downloaded copy.
 */
export async function getCachedAssetUrl(url: string): Promise<string> {
  const existing = memoryUrls.get(url);
  if (existing) return existing;

  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    let response: Response;
    try {
      response = await fetch(url, { cache: "no-cache", signal: controller.signal });
    } finally {
      window.clearTimeout(timeout);
    }
    if (!response.ok) throw new Error(`Image request failed (${response.status})`);
    const blob = await response.blob();
    if (!blob.size) throw new Error("The downloaded image was empty.");
    await saveAsset({ url, blob, fetchedAt: Date.now() });
    const objectUrl = URL.createObjectURL(blob);
    memoryUrls.set(url, objectUrl);
    return objectUrl;
  } catch (error) {
    const cached = await getAsset(url);
    if (cached) {
      const objectUrl = URL.createObjectURL(cached.blob);
      memoryUrls.set(url, objectUrl);
      return objectUrl;
    }
    throw error;
  }
}

export function preloadThumbnail(url: string): void {
  void getCachedAssetUrl(url).catch(() => {
    // Thumbnails are optional; a missing one falls back to an icon in the UI.
  });
}