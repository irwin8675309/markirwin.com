export async function toggleFullscreen(): Promise<void> {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
    } else {
      await document.exitFullscreen?.();
    }
  } catch {
    /* fullscreen can be blocked; ignore */
  }
}

export function isFullscreen(): boolean {
  return !!document.fullscreenElement;
}