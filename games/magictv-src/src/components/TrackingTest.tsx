import { useEffect, useRef } from 'react';
import { useCamera } from '../camera/CameraProvider';
import { CameraPreview } from './CameraPreview';
import { PointerOverlay } from './PointerOverlay';
import { skeleton } from '../utils/draw';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../types';
import { HAND_COLORS } from '../games/shared/hud';
import { audio } from '../audio/AudioEngine';
import { FONT_STACK } from '../utils/font';

interface Props {
  onBack: () => void;
}

/** Phase 1 style tracking test: a big dot that follows the index finger. */
export function TrackingTest({ onBack }: Props) {
  const { frameRef, fps, handCount, status, demo } = useCamera();
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    audio.speak('Move your hands and watch the magic dots.', { force: true });
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = WORLD_WIDTH;
    canvas.height = WORLD_HEIGHT;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const frame = frameRef.current;
      ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // backdrop
      const g = ctx.createRadialGradient(960, 520, 80, 960, 540, 1000);
      g.addColorStop(0, 'rgba(80,40,140,0.55)');
      g.addColorStop(1, 'rgba(10,4,30,0.1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // centre guide
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 16]);
      ctx.beginPath();
      ctx.moveTo(960, 40);
      ctx.lineTo(960, 1040);
      ctx.moveTo(60, 540);
      ctx.lineTo(1860, 540);
      ctx.stroke();
      ctx.setLineDash([]);

      frame.hands.forEach((h, i) => {
        const color = HAND_COLORS[i % HAND_COLORS.length];
        if (h.landmarks.length === 21) {
          ctx.save();
          ctx.globalAlpha = 0.9;
          skeleton(ctx, h.landmarks, color, 7);
          ctx.restore();
        }
        // index finger target
        const x = h.tip.x;
        const y = h.tip.y;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(x, y, 56, 0, Math.PI * 2);
        ctx.stroke();
        const grad = ctx.createRadialGradient(x - 10, y - 10, 4, x, y, 42);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
        // palm label
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = `700 30px ${FONT_STACK}`;
        ctx.textAlign = 'center';
        ctx.fillText(i === 0 ? 'Your magic finger' : 'Second magic finger', h.palm.x, h.palm.y + 70);
      });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [frameRef]);

  return (
    <div className="screen tracking-screen">
      <canvas ref={ref} className="tracking-canvas" width={WORLD_WIDTH} height={WORLD_HEIGHT} />

      <div className="tracking-top">
        <button className="soft-btn" onClick={onBack}>
          ← Back
        </button>
        <div className="tracking-stats">
          <span className={`status-pill ${status === 'ready' ? 'ok' : 'bad'}`}>
            <span className="status-dot" /> {demo ? 'Pretend hands' : status === 'ready' ? 'Tracking' : status}
          </span>
          <span className="stat-chip">{handCount} hands</span>
          <span className="stat-chip">{fps} fps</span>
        </div>
      </div>

      <div className="tracking-preview">
        <CameraPreview className="tracking-preview-video" label="Camera" />
      </div>

      <div className="tracking-hint">
        <h2>Move your hands!</h2>
        <p>Your magic dot follows your finger. This is exactly how the games see you.</p>
      </div>

      <PointerOverlay showRadius />
    </div>
  );
}