import { useEffect, useRef } from 'react';
import { GAMES } from '../games/registry';
import type { GameDefinition } from '../games/types';
import { useCamera } from '../camera/CameraProvider';
import { GameArt } from './GameArt';
import { PointerOverlay } from './PointerOverlay';
import { audio } from '../audio/AudioEngine';

interface Props {
  onSelect: (game: GameDefinition) => void;
}

const DWELL_SECONDS = 1.05;
const DWELL_LITTLE = 0.7;

export function MenuScreen({ onSelect }: Props) {
  const { frameRef, settings, status, demo } = useCamera();
  const demoRef = useRef(settings.demoMode);
  demoRef.current = settings.demoMode;
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const ringRefs = useRef<Array<HTMLDivElement | null>>([]);
  const progress = useRef<number[]>(GAMES.map(() => 0));
  const selectRef = useRef(onSelect);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  selectRef.current = onSelect;
  const firedRef = useRef(false);

  useEffect(() => {
    audio.speak('Pick a game!', { force: true });
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (firedRef.current) return;

      const hands = demoRef.current ? [] : frameRef.current.hands;
      let anyAim = false;
      for (let i = 0; i < GAMES.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        let aimed = false;
        for (const h of hands) {
          const x = h.tip.x / 1920;
          const y = h.tip.y / 1080;
          const hx = (x * window.innerWidth);
          const hy = (y * window.innerHeight);
          if (hx > rect.left && hx < rect.right && hy > rect.top && hy < rect.bottom && h.speed < 900) {
            aimed = true;
            break;
          }
        }
        const p = progress.current[i];
        if (aimed) {
          anyAim = true;
          progress.current[i] = Math.min(1, p + dt / (settingsRef.current.littleKid ? DWELL_LITTLE : DWELL_SECONDS));
          el.classList.add('is-aimed');
          const ring = ringRefs.current[i];
          if (ring) ring.style.setProperty('--p', String(progress.current[i]));
          if (progress.current[i] >= 1) {
            firedRef.current = true;
            audio.play('sparkle');
            selectRef.current(GAMES[i]);
            progress.current = GAMES.map(() => 0);
            return;
          }
        } else {
          if (p > 0) progress.current[i] = Math.max(0, p - dt * 2.6);
          if (p <= 0.02) el.classList.remove('is-aimed');
          const ring = ringRefs.current[i];
          if (ring) ring.style.setProperty('--p', String(progress.current[i]));
        }
      }
      if (!anyAim) {
        for (let i = 0; i < GAMES.length; i++) cardRefs.current[i]?.classList.remove('is-aimed');
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [frameRef]);

  return (
    <div className="screen menu-screen">
      <div className="menu-bg" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="menu-bubble"
            style={{
              left: `${(i * 53) % 100}%`,
              width: `${18 + ((i * 31) % 60)}px`,
              height: `${18 + ((i * 31) % 60)}px`,
              animationDelay: `${(i % 9) * -1.4}s`,
              animationDuration: `${16 + (i % 6) * 4}s`,
            }}
          />
        ))}
      </div>

      <header className="menu-header">
        <h1 className="menu-title">
          Grandkids&apos; <span>Magic TV</span>
        </h1>
        <div className="menu-status">
          {demo ? (
            <span className="status-pill demo">
              <span className="status-dot" /> Pretend hands
            </span>
          ) : status === 'ready' ? (
            <span className="status-pill ok">
              <span className="status-dot" /> Magic camera ready
            </span>
          ) : (
            <span className="status-pill bad">
              <span className="status-dot" /> Camera not ready
            </span>
          )}
        </div>
      </header>

      <main className="menu-grid" style={{ ['--cols' as string]: Math.ceil(GAMES.length / 3) }}>
        {GAMES.map((game, i) => (
          <div
            key={game.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="game-card"
            style={{
              background: `linear-gradient(150deg, ${game.colors[0]} 0%, ${game.colors[1]} 100%)`,
              animationDelay: `${i * 0.06}s`,
            }}
            onClick={() => {
              if (!firedRef.current) {
                firedRef.current = true;
                audio.init();
                audio.play('sparkle');
                selectRef.current(game);
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') selectRef.current(game);
            }}
          >
            <div className="card-shine" aria-hidden="true" />
            <div className="card-art">
              <GameArt id={game.id} />
            </div>
            <div className="card-label">{game.title}</div>
            <div className="card-hint">{game.voice}</div>
            <div
              ref={(el) => {
                ringRefs.current[i] = el;
              }}
              className="dwell-ring"
              aria-hidden="true"
            />
          </div>
        ))}
      </main>

      <footer className="menu-footer">
        <span className="footer-tip">✋ Wave your hand over a picture</span>
        <span className="footer-tip adult">Hold the bottom-right corner for grown-up settings</span>
      </footer>

      <PointerOverlay />
      <div className="sr-only" aria-live="polite">
        {settings.demoMode ? 'Demo mode active' : ''}
      </div>
    </div>
  );
}