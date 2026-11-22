import { useEffect, useRef } from 'react';
import { useCamera } from '../camera/CameraProvider';
import { drawHandCursors } from '../games/shared/hud';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../types';

/** Transparent canvas that draws the magic hand cursors over DOM screens. */
export function PointerOverlay({ showRadius = false }: { showRadius?: boolean }) {
  const { frameRef, settings } = useCamera();
  const ref = useRef<HTMLCanvasElement | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = WORLD_WIDTH;
    canvas.height = WORLD_HEIGHT;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      drawHandCursors(ctx, frameRef.current, settingsRef.current, { scale: 1.25, showRadius });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [frameRef, showRadius]);

  return <canvas ref={ref} className="pointer-overlay" aria-hidden="true" />;
}