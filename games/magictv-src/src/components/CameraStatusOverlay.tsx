import { useEffect, useRef, useState } from 'react';
import { useCamera } from '../camera/CameraProvider';
import { audio } from '../audio/AudioEngine';

/** Seconds without any visible hand before the friendly "wave" invitation appears. */
const IDLE_SECONDS = 6;

/**
 * Friendly messages for the children's screen. No technical wording:
 *  - if the camera drops, "the magic camera is waking up" (it reconnects by itself);
 *  - if nobody has been seen for a few seconds, "wave your hand to start the magic".
 * Never blocks touches or the game underneath.
 */
export function CameraStatusOverlay({ idlePrompt = true }: { idlePrompt?: boolean }) {
  const { frameRef, status, settings } = useCamera();
  const [idle, setIdle] = useState(false);
  const lastHandAt = useRef(performance.now());
  const wasIdle = useRef(false);
  const idlePromptRef = useRef(idlePrompt);
  idlePromptRef.current = idlePrompt;

  useEffect(() => {
    const touch = () => {
      lastHandAt.current = performance.now();
    };
    window.addEventListener('pointermove', touch, { passive: true });
    window.addEventListener('pointerdown', touch, { passive: true });
    const timer = window.setInterval(() => {
      const now = performance.now();
      if (frameRef.current.hands.length > 0) lastHandAt.current = now;
      const isIdle = now - lastHandAt.current > IDLE_SECONDS * 1000;
      setIdle(isIdle);
      document.documentElement.classList.toggle('magic-idle', isIdle);
      if (isIdle && !wasIdle.current && idlePromptRef.current) audio.speak('Wave your hand to start the magic!', { minGap: 30000 });
      wasIdle.current = isIdle;
    }, 400);
    return () => {
      window.removeEventListener('pointermove', touch);
      window.removeEventListener('pointerdown', touch);
      window.clearInterval(timer);
      document.documentElement.classList.remove('magic-idle');
    };
  }, [frameRef]);

  if (!settings.demoMode && status !== 'ready') {
    return (
      <div className="friendly-note nap" role="status" aria-live="polite">
        <span className="friendly-emoji" aria-hidden="true">
          😴
        </span>
        <span>The magic camera is waking up…</span>
        <div className="spinner" aria-hidden="true" />
      </div>
    );
  }

  if (idle && idlePrompt) {
    return (
      <div className="friendly-note wave" role="status" aria-live="polite">
        <span className="friendly-emoji wave-hand" aria-hidden="true">
          👋
        </span>
        <span>Wave your hand to start the magic!</span>
      </div>
    );
  }

  return null;
}
