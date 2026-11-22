import { useEffect, useRef } from 'react';
import type { GameDefinition, GameContext } from '../games/types';
import type { FrameState, HandState, Vec2 } from '../types';
import { useCamera } from '../camera/CameraProvider';
import { audio } from '../audio/AudioEngine';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../types';
import { DEBUG } from '../utils/debug';
import { TeamPlay } from '../games/shared/team';

interface Props {
  game: GameDefinition;
}

function makeMouseHand(x: number, y: number, prev: Vec2 | null, pinch: boolean, time: number): HandState {
  const vx = prev ? (x - prev.x) * 60 : 0;
  const vy = prev ? (y - prev.y) * 60 : 0;
  const palm = { x, y: y + 40 };
  const landmarks = [];
  for (let i = 0; i < 21; i++) {
    const a = (i / 21) * Math.PI * 2;
    landmarks.push({ x: x + Math.cos(a) * 26, y: y + Math.sin(a) * 26, z: 0 });
  }
  return {
    id: -1,
    handedness: 'Right',
    landmarks,
    wrist: { x, y: y + 70 },
    palm,
    thumb: { x: x - 30, y: y + 10 },
    index: { x, y },
    middle: { x: x + 20, y: y + 8 },
    ring: { x: x + 34, y: y + 20 },
    pinky: { x: x + 44, y: y + 34 },
    tip: pinch ? { x, y } : { x, y },
    radius: 95,
    pinch: pinch ? 1 : 0,
    pinchActive: pinch,
    openness: pinch ? 0.4 : 1,
    pointing: true,
    fist: false,
    open: !pinch,
    velocity: { x: vx, y: vy },
    speed: Math.hypot(vx, vy),
    palmSize: 90,
    confidence: 1,
    tracked: true,
    player: -1,
    pinchStartedAt: time,
    history: [],
  };
}

/**
 * Hosts one game on a 1920x1080 canvas. Reads the latest tracking frame from a
 * ref (no React re-render per frame) and forwards gesture events exactly once.
 * A mouse acts as a forgiving fallback hand when no real hands are visible.
 */
export function GameCanvas({ game }: Props) {
  const { frameRef, drainEvents, settings } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    canvas.width = WORLD_WIDTH;
    canvas.height = WORLD_HEIGHT;

    const instance = game.create();
    const team = new TeamPlay();
    const startTime = performance.now();
    let last = startTime;
    drainEvents(); // forget gestures from before this game started
    let raf = 0;
    let statFrames = 0;
    let statSince = startTime;
    let renderMs = 0;

    const mouse: { x: number; y: number; inside: boolean; down: boolean; prev: Vec2 | null; lastMove: number } = {
      x: 960,
      y: 540,
      inside: false,
      down: false,
      prev: null,
      lastMove: 0,
    };

    const toWorld = (clientX: number, clientY: number): Vec2 => {
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(rect.width / WORLD_WIDTH, rect.height / WORLD_HEIGHT) || 1;
      const drawW = WORLD_WIDTH * scale;
      const drawH = WORLD_HEIGHT * scale;
      const offX = rect.left + (rect.width - drawW) / 2;
      const offY = rect.top + (rect.height - drawH) / 2;
      return { x: (clientX - offX) / scale, y: (clientY - offY) / scale };
    };

    const onMove = (e: PointerEvent) => {
      const p = toWorld(e.clientX, e.clientY);
      const wasInside = mouse.inside;
      if (!wasInside) mouse.prev = null;
      else mouse.prev = { x: mouse.x, y: mouse.y };
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.inside = p.x >= 0 && p.x <= WORLD_WIDTH && p.y >= 0 && p.y <= WORLD_HEIGHT;
      mouse.lastMove = performance.now();
    };
    const onDown = (e: PointerEvent) => {
      if (e.button === 0) mouse.down = true;
      onMove(e);
    };
    const onUp = () => {
      mouse.down = false;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });

    const buildContext = (frame: FrameState, time: number, dt: number): GameContext => {
      let hands = frame.hands;
      // Mouse fallback only when no real hands are tracked and the mouse moved recently.
      if (hands.length === 0 && mouse.inside && performance.now() - mouse.lastMove < 2500) {
        const hand = makeMouseHand(mouse.x, mouse.y, mouse.prev, mouse.down, time);
        hands = [hand];
        frame = { ...frame, hands };
      }
      return {
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT,
        frame,
        time,
        dt,
        settings: settingsRef.current,
        audio,
      };
    };

    const initialFrame = frameRef.current;
    instance.enter?.(buildContext(initialFrame, 0, 0));

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const rawFrame = frameRef.current;
      const time = (now - startTime) / 1000;
      const g = buildContext(rawFrame, time, dt);

      // Every gesture is delivered exactly once, even if a frame was slow.
      for (const e of drainEvents()) {
        instance.onGesture?.(e, g);
        if (e.type === 'highFive') team.onHighFive(e, g);
      }

      const t0 = performance.now();
      instance.update(g);
      instance.draw(ctx, g);
      team.update(g);
      team.draw(ctx);
      renderMs = renderMs * 0.9 + (performance.now() - t0) * 0.1;
      statFrames++;
      if (now - statSince > 500) {
        if (DEBUG) {
          (window as unknown as { __magicPerf?: unknown }).__magicPerf = {
            fps: Math.round((statFrames * 1000) / (now - statSince)),
            renderMs: Math.round(renderMs * 10) / 10,
          };
        }
        statFrames = 0;
        statSince = now;
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      instance.exit?.();
    };
  }, [game, frameRef, drainEvents]);

  return <canvas ref={canvasRef} className="game-canvas" width={WORLD_WIDTH} height={WORLD_HEIGHT} />;
}