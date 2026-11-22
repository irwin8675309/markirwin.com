import { useEffect, useRef, useState } from 'react';
import { useCamera } from '../camera/CameraProvider';

interface Props {
  corner: 'tl' | 'tr' | 'bl' | 'br';
  onTrigger: () => void;
  holdSeconds?: number;
  label?: string;
  className?: string;
}

/**
 * Grown-up corner. Hold with a mouse/finger OR hold a hand still in the corner.
 * Deliberately hard for small children to trigger by accident.
 */
export function HoldZone({ corner, onTrigger, holdSeconds = 2.4, label = 'Grown-ups', className = '' }: Props) {
  const { frameRef } = useCamera();
  const ref = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const progress = useRef(0);
  const pointerHeld = useRef(false);
  const fired = useRef(false);
  const triggerRef = useRef(onTrigger);
  triggerRef.current = onTrigger;
  const [active, setActive] = useState(false);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const el = ref.current;
      if (!el) return;
      let holding = pointerHeld.current;

      // Hand dwell (hold a hand still in the corner).
      if (!holding) {
        const rect = el.getBoundingClientRect();
        const nx0 = rect.left / window.innerWidth;
        const ny0 = rect.top / window.innerHeight;
        const nx1 = rect.right / window.innerWidth;
        const ny1 = rect.bottom / window.innerHeight;
        for (const h of frameRef.current.hands) {
          const x = h.palm.x / 1920;
          const y = h.palm.y / 1080;
          if (x > nx0 && x < nx1 && y > ny0 && y < ny1 && h.speed < 260) {
            holding = true;
            break;
          }
        }
      }

      if (holding) progress.current += dt;
      else progress.current = Math.max(0, progress.current - dt * 2.2);
      const p = Math.min(1, progress.current / holdSeconds);
      if (fillRef.current) {
        fillRef.current.style.setProperty('--p', String(p));
        fillRef.current.style.opacity = p > 0.02 ? '1' : '0';
      }
      if (p > 0.02 && !active) setActive(true);
      if (p <= 0.02 && active) setActive(false);

      if (progress.current >= holdSeconds && !fired.current) {
        fired.current = true;
        progress.current = 0;
        window.setTimeout(() => {
          fired.current = false;
        }, 1200);
        triggerRef.current();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [frameRef, holdSeconds, active]);

  const pos =
    corner === 'tl'
      ? { top: 0, left: 0 }
      : corner === 'tr'
        ? { top: 0, right: 0 }
        : corner === 'bl'
          ? { bottom: 0, left: 0 }
          : { bottom: 0, right: 0 };

  return (
    <div
      ref={ref}
      className={`hold-zone ${className} ${active ? 'is-active' : ''}`}
      style={pos}
      onPointerDown={() => {
        pointerHeld.current = true;
      }}
      onPointerUp={() => {
        pointerHeld.current = false;
      }}
      onPointerLeave={() => {
        pointerHeld.current = false;
      }}
      onPointerCancel={() => {
        pointerHeld.current = false;
      }}
      role="button"
      tabIndex={-1}
      aria-label={`Hold for ${label}`}
    >
      <div className="hold-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="34" height="34">
          <path
            d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 0 1 6 0v3H9Z"
            fill="currentColor"
          />
        </svg>
        <div ref={fillRef} className="hold-fill" style={{ ['--p' as string]: 0 }}>
          <svg viewBox="0 0 100 100" className="hold-ring" aria-hidden="true">
            <circle cx="50" cy="50" r="44" pathLength="100" className="hold-ring-track" />
            <circle cx="50" cy="50" r="44" pathLength="100" className="hold-ring-fill" />
          </svg>
        </div>
      </div>
      <span className="hold-label">{label}</span>
    </div>
  );
}