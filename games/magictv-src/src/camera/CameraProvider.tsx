import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import type { HandLandmarker } from '@mediapipe/tasks-vision';
import type { FrameState, GestureEvent, TrackingArea } from '../types';
import { emptyFrame, WORLD_HEIGHT, WORLD_WIDTH } from '../types';
import { clamp, clamp01 } from '../utils/math';
import { loadHandLandmarker, loadCropLandmarker, rawHandsFromResult, type RawHand } from '../tracking/landmarker';
/** Lower = a hand is noticed more easily (minus up to 0.4 from the Sensitivity slider). */
const DETECT_BASE = 0.55;
/** Lower = a moving hand is held on to for longer instead of being lost and searched for again. */
const KEEP_TRACKING = 0.35;

import { FarController, uncropLandmarks, type CropRect } from '../tracking/farTracker';
import { HandTracker } from '../tracking/tracker';
import { GestureEngine } from '../tracking/gestures';
import { DEFAULT_AREA, expandArea } from '../tracking/mapping';
import { demoRawHands } from '../tracking/demo';
import { loadSettings, saveSettings, clampSettings, type Settings } from '../settings';
import { audio } from '../audio/AudioEngine';
import { DEBUG } from '../utils/debug';

export type TrackingStatus = 'idle' | 'requesting' | 'loading' | 'ready' | 'error' | 'disconnected';

export interface CalibrationState {
  active: boolean;
  phase: 'idle' | 'stand' | 'hands' | 'done';
  progress: number;
}

interface CameraContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  status: TrackingStatus;
  error: string | null;
  /** Non-fatal message, e.g. "selected camera busy, using default". */
  notice: string | null;
  devices: MediaDeviceInfo[];
  stream: MediaStream | null;
  frameRef: RefObject<FrameState>;
  /** Returns (and clears) gesture events not yet delivered to a game. */
  drainEvents: () => GestureEvent[];
  videoRef: RefObject<HTMLVideoElement | null>;
  fps: number;
  handCount: number;
  demo: boolean;
  startCamera: () => void;
  stopCamera: () => void;
  setDemoMode: (on: boolean) => void;
  calibration: CalibrationState;
  startCalibration: () => void;
  finishCalibration: () => void;
  cancelCalibration: () => void;
}

const CameraContext = createContext<CameraContextValue | null>(null);

export function useCamera(): CameraContextValue {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error('useCamera must be used inside <CameraProvider>');
  return ctx;
}

function friendlyError(err: unknown): string {
  const e = err as { name?: string; message?: string };
  switch (e?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera permission was blocked. Allow camera access in your browser, then try again.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No webcam was found. Connect a USB webcam and try again.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'The webcam is busy. Close other apps using the camera and try again.';
    case 'TimeoutError':
      return 'The camera took too long to answer. Try again, or try another USB port.';
    default:
      if (/timed out/i.test(e?.message ?? '')) return 'The camera took too long to answer. Try again.';
      return e?.message || 'The camera could not be started.';
  }
}

export function CameraProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => clampSettings(loadSettings()));
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [status, setStatus] = useState<TrackingStatus>('idle');
  const statusRef = useRef<TrackingStatus>('idle');
  statusRef.current = status;
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [fps, setFps] = useState(0);
  const [handCount, setHandCount] = useState(0);
  const [calibration, setCalibration] = useState<CalibrationState>({ active: false, phase: 'idle', progress: 0 });

  const frameRef = useRef<FrameState>(emptyFrame());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  // Far-away hands: zoomed-in crops handled by a second landmarker (see farTracker.ts).
  const farRef = useRef(new FarController());
  const cropLandmarkerRef = useRef<HandLandmarker | null>(null);
  const cropLoading = useRef(false);
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const farBroken = useRef(false);
  const trackerRef = useRef(new HandTracker());
  const gestureRef = useRef(new GestureEngine());
  const areaRef = useRef<TrackingArea>({ ...DEFAULT_AREA });
  const calibrationRef = useRef({
    active: false,
    phase: 'idle' as CalibrationState['phase'],
    samples: 0,
    standSince: 0,
    minX: 1,
    maxX: 0,
    minY: 1,
    maxY: 0,
  });
  const lastVideoTime = useRef(-1);
  const lastDetect = useRef(0);
  const lastProcess = useRef(0);
  const statsAt = useRef(0);
  const calUiAt = useRef(0);
  const frameSeq = useRef(0);
  const cameraKeyRef = useRef(`${settings.cameraId}|${settings.cameraWidth}`);
  const startedRef = useRef(false);
  const startToken = useRef(0);
  const retryCount = useRef(0);
  const everReady = useRef(false);
  const lastNewFrameAt = useRef(0);
  const pendingEvents = useRef<Array<{ e: GestureEvent; t: number }>>([]);

  const drainEvents = useCallback((): GestureEvent[] => {
    const q = pendingEvents.current;
    if (q.length === 0) return [];
    pendingEvents.current = [];
    const cutoff = performance.now() / 1000 - 1; // ignore events older than a second
    return q.filter((x) => x.t >= cutoff).map((x) => x.e);
  }, []);

  // ------------------------------------------------------------- settings
  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = clampSettings({ ...prev, ...patch });
      saveSettings(next);
      return next;
    });
  }, []);

  useEffect(() => {
    audio.applySettings(settings);
  }, [settings]);

  // ------------------------------------------------------------ devices
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((d) => d.kind === 'videoinput'));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshDevices();
    const md = navigator.mediaDevices;
    if (!md) return;
    const onChange = () => void refreshDevices();
    md.addEventListener('devicechange', onChange);
    return () => md.removeEventListener('devicechange', onChange);
  }, [refreshDevices]);

  // ------------------------------------------------------------- camera
  const stopCamera = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => {
        t.onended = null;
        t.stop();
      });
    }
    streamRef.current = null;
    setStream(null);
    const v = videoRef.current;
    if (v) v.srcObject = null;
    lastVideoTime.current = -1;
    trackerRef.current.reset();
    gestureRef.current.reset();
    frameRef.current = emptyFrame();
    setHandCount(0);
  }, []);

  const startCamera = useCallback(async (opts?: { keepNotice?: boolean }) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setError('This browser cannot access a camera. Try Chrome or Edge on the computer.');
      return;
    }
    stopCamera();
    const token = ++startToken.current;
    const stale = () => token !== startToken.current;
    setStatus('requesting');
    setError(null);
    if (!opts?.keepNotice) setNotice(null);
    try {
      const w = settingsRef.current.cameraWidth;
      const videoConstraints = (deviceId?: string): MediaTrackConstraints => ({
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        width: { ideal: w },
        height: { ideal: Math.round((w * 9) / 16) },
        // Ask for smooth video: in dim rooms some webcams quietly drop to a few pictures a second, which blurs moving hands.
        frameRate: { ideal: 30 },
      });

      // Resolve the saved camera by its friendly label first: Chrome can change
      // device ids when a webcam is replugged, but the label stays recognisable.
      let wanted = settingsRef.current.cameraId;
      const wantedLabel = settingsRef.current.cameraLabel;
      let wantedName = '';
      if (wantedLabel || wanted) {
        try {
          const all = await navigator.mediaDevices.enumerateDevices();
          const cams = all.filter((d) => d.kind === 'videoinput');
          const match = wantedLabel
            ? cams.find((d) => d.label === wantedLabel) ?? cams.find((d) => d.deviceId === wanted)
            : cams.find((d) => d.deviceId === wanted);
          if (match) {
            wanted = match.deviceId;
            wantedName = match.label;
          }
        } catch {
          /* enumeration is optional */
        }
      }

      const withTimeout = async (): Promise<MediaStream> => {
        const p = navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints(wanted || undefined) });
        let timer = 0;
        const timeout = new Promise<never>((_, reject) => {
          timer = window.setTimeout(() => reject(new Error('Camera request timed out')), 12000);
        });
        try {
          return await Promise.race([p, timeout]);
        } catch (err) {
          // If the request eventually succeeds after timing out, release it.
          void p.then((late) => late.getTracks().forEach((t) => t.stop())).catch(() => {});
          throw err;
        } finally {
          window.clearTimeout(timer);
        }
      };

      let stream: MediaStream;
      try {
        stream = await withTimeout();
      } catch (err) {
        const e = err as { name?: string; message?: string };
        // Device ids can change when a webcam is replugged. Recover gracefully.
        if (wanted && (e.name === 'NotFoundError' || e.name === 'OverconstrainedError' || /timed out/i.test(e.message ?? ''))) {
          console.warn('[MagicTV] saved camera unavailable, falling back to the default camera', err);
          updateSettings({ cameraId: '', cameraLabel: '' });
          setNotice(
            wantedName
              ? `${wantedName} could not be opened (it may be busy in another app). Using the default camera instead.`
              : 'The selected camera could not be opened. Using the default camera instead.',
          );
          const fallback = navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints() });
          stream = await fallback;
        } else {
          throw err;
        }
      }
      // A newer start (or stop) superseded this request: release what we got.
      if (stale()) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      // The user may have switched to pretend hands while permission was pending.
      if (settingsRef.current.demoMode) {
        stream.getTracks().forEach((t) => t.stop());
        setStatus('ready');
        return;
      }
      streamRef.current = stream;
      setStream(stream);
      lastNewFrameAt.current = performance.now();
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          if (streamRef.current === stream) {
            setStatus('disconnected');
            setError('The camera was disconnected. Reconnect it and tap Try again.');
          }
        };
      }
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          /* autoplay can be blocked until a gesture; the click that started this counts */
        }
      }
      setStatus('loading');
      const landmarker = await loadHandLandmarker();
      if (stale()) return;
      landmarkerRef.current = landmarker;
      if (settingsRef.current.demoMode) {
        stream.getTracks().forEach((t) => t.stop());
        if (streamRef.current === stream) {
          streamRef.current = null;
          setStream(null);
        }
        setStatus('ready');
        return;
      }
      try {
        await landmarker.setOptions({
          numHands: settingsRef.current.numHands,
          minHandDetectionConfidence: DETECT_BASE - settingsRef.current.sensitivity * 0.4,
          minHandPresenceConfidence: KEEP_TRACKING,
          minTrackingConfidence: KEEP_TRACKING,
        });
      } catch {
        /* older versions may not support setOptions — defaults are fine */
      }
      setStatus('ready');
      if (video && video.readyState < 2) {
        // The loop will start as soon as the first frame arrives.
        void video.play().catch(() => {});
      }
    } catch (err) {
      if (stale()) return;
      console.error('[MagicTV] camera error', err);
      setStatus('error');
      setError(friendlyError(err));
    }
  }, [stopCamera, updateSettings]);

  // Remember that the camera has worked at least once, and reset the retry backoff.
  useEffect(() => {
    if (status === 'ready' && !settings.demoMode) {
      everReady.current = true;
      retryCount.current = 0;
    }
  }, [status, settings.demoMode]);

  // If the camera drops after it has worked (USB hiccup, unplugged, frozen),
  // keep trying to bring it back by itself: 2 s, 4 s, 8 s, then every 15 s.
  useEffect(() => {
    if (settings.demoMode || !everReady.current) return;
    if (status !== 'disconnected' && status !== 'error') return;
    const delay = Math.min(15000, 2000 * 2 ** retryCount.current);
    const id = window.setTimeout(() => {
      retryCount.current += 1;
      void startCamera({ keepNotice: true });
    }, delay);
    return () => window.clearTimeout(id);
  }, [status, settings.demoMode, startCamera]);

  // Auto-start the camera once the app shell is mounted (permission prompt appears).
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (settingsRef.current.demoMode) {
      setStatus('ready');
      return;
    }
    void startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restart when the chosen camera or capture size changes (not on first mount).
  useEffect(() => {
    const key = `${settings.cameraId}|${settings.cameraWidth}`;
    if (cameraKeyRef.current === key) return;
    cameraKeyRef.current = key;
    if (!startedRef.current || settings.demoMode) return;
    void startCamera({ keepNotice: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.cameraId, settings.cameraWidth]);

  // Clearing the calibrated area also resets the auto-learned area.
  useEffect(() => {
    if (!settings.trackingArea) areaRef.current = { ...DEFAULT_AREA };
  }, [settings.trackingArea]);

  // Update detector options live.
  useEffect(() => {
    const lm = landmarkerRef.current;
    if (!lm) return;
    void lm
      .setOptions({
        numHands: settings.numHands,
        minHandDetectionConfidence: DETECT_BASE - settings.sensitivity * 0.4,
        minHandPresenceConfidence: KEEP_TRACKING,
        minTrackingConfidence: KEEP_TRACKING,
      })
      .catch(() => {});
  }, [settings.numHands, settings.sensitivity]);

  const demoRef = useRef(settings.demoMode);
  // Demo mode: release the camera for privacy, or bring it back.
  useEffect(() => {
    if (demoRef.current === settings.demoMode) return;
    demoRef.current = settings.demoMode;
    if (settings.demoMode) {
      if (streamRef.current) {
        stopCamera();
        setStatus('ready');
      }
      return;
    }
    if (!streamRef.current) void startCamera({ keepNotice: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.demoMode]);

  // --------------------------------------------------------- tracking loop
  useEffect(() => {
    let raf = 0;
    let lastLoopAt = 0;
    const loop = (nowMs: number) => {
      raf = requestAnimationFrame(loop);
      // Waking from a hidden tab or sleep: don't mistake that gap for a frozen camera.
      if (nowMs - lastLoopAt > 1000) lastNewFrameAt.current = nowMs;
      lastLoopAt = nowMs;
      const s = settingsRef.current;
      const now = nowMs / 1000;
      const last = lastProcess.current || now;
      let dt = now - last;
      if (dt <= 0) dt = 1 / 60;
      dt = Math.min(0.12, dt);

      if (s.demoMode) {
        if (nowMs - lastDetect.current < 1000 / s.trackingFps) return;
        lastDetect.current = nowMs;
        processFrame(demoRawHands(now, 2), now, dt, true);
        lastProcess.current = now;
        return;
      }

      // Camera still "on" but no new pictures for 5 s: treat as disconnected so
      // the automatic reconnect can restart it.
      if (
        streamRef.current &&
        statusRef.current === 'ready' &&
        lastNewFrameAt.current > 0 &&
        nowMs - lastNewFrameAt.current > 5000
      ) {
        console.warn('[MagicTV] camera stopped delivering frames; restarting it');
        lastNewFrameAt.current = 0;
        stopCamera();
        setError('The camera stopped sending pictures.');
        setStatus('disconnected');
        return;
      }

      const video = videoRef.current;
      const lm = landmarkerRef.current;
      if (!video || !lm || video.readyState < 2) return;
      const interval = 1000 / s.trackingFps;
      if (nowMs - lastDetect.current < interval) return;
      if (video.currentTime === lastVideoTime.current) return;
      lastVideoTime.current = video.currentTime;
      lastNewFrameAt.current = nowMs;
      lastDetect.current = nowMs;

      try {
        const detectFull = () => rawHandsFromResult(lm.detectForVideo(video, nowMs));

        // Zoomed-in crop of the picture (null while the second model is still loading).
        const detectCrop = (rect: CropRect): RawHand[] | null => {
          const clm = cropLandmarkerRef.current;
          if (!clm) {
            if (!cropLoading.current) {
              cropLoading.current = true;
              loadCropLandmarker()
                .then((l) => {
                  cropLandmarkerRef.current = l;
                })
                .catch(() => {
                  farBroken.current = true;
                });
            }
            return null;
          }
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          if (!vw || !vh) return null;
          const canvas = (cropCanvasRef.current ??= document.createElement('canvas'));
          const sw = Math.round(rect.w * vw);
          const sh = Math.round(rect.h * vh);
          if (canvas.width !== sw || canvas.height !== sh) {
            canvas.width = sw;
            canvas.height = sh;
          }
          canvas.getContext('2d')?.drawImage(video, rect.x * vw, rect.y * vh, sw, sh, 0, 0, sw, sh);
          return rawHandsFromResult(clm.detectForVideo(canvas, nowMs)).map((h) => ({
            ...h,
            landmarks: uncropLandmarks(h.landmarks, rect),
          }));
        };

        // The whole picture is ALWAYS looked at first, exactly as without the far-away
        // helper. A zoomed crop is only an extra look when that finds nothing, so the
        // helper can add far-away hands but can never hide a hand the full picture shows.
        let hands = detectFull();
        if (s.farMode && !farBroken.current) {
          try {
            const far = farRef.current;
            far.onFull(hands, nowMs);
            if (hands.length === 0) {
              const plan = far.plan(nowMs);
              if (plan.kind === 'crop') {
                const zoomed = detectCrop(plan.rect);
                if (zoomed) {
                  far.onCrop(zoomed, plan.rect, nowMs);
                  if (zoomed.length > 0) hands = zoomed;
                }
              }
            }
          } catch (farErr) {
            console.warn('[MagicTV] far-away helper turned off', farErr);
            farBroken.current = true;
          }
        }
        processFrame(hands, now, dt, false);
        lastProcess.current = now;
        if (statusRef.current === 'loading') setStatus('ready');
      } catch (err) {
        console.warn('[MagicTV] detection failed', err);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const processFrame = (raw: RawHand[], now: number, dt: number, demo: boolean) => {
    const s = settingsRef.current;
    const tracker = trackerRef.current;
    const hands = tracker.update(raw, now, dt, s, areaRef.current);

    // Learn the usable area automatically in camera space (unless an adult calibrated it).
    if (!s.trackingArea && !calibrationRef.current.active) {
      for (const rh of raw) {
        const p = rh.landmarks[9];
        if (!p) continue;
        areaRef.current = expandArea(areaRef.current, { x: s.mirrored ? 1 - p.x : p.x, y: p.y });
      }
    }

    // Calibration sampling — uses raw camera coordinates, not the current mapping.
    const cal = calibrationRef.current;
    if (cal.active) {
      if (cal.phase === 'stand') {
        if (raw.length > 0) {
          if (!cal.standSince) cal.standSince = now;
          if (now - cal.standSince > 0.6) {
            cal.phase = 'hands';
            cal.samples = 0;
            audio.play('sparkle');
            audio.speak('Now move your hands around so I can see where you can reach.', { force: true });
          }
        } else {
          cal.standSince = 0;
        }
      } else if (cal.phase === 'hands') {
        for (const rh of raw) {
          const p = rh.landmarks[9];
          if (!p) continue;
          const nx = s.mirrored ? 1 - p.x : p.x;
          const ny = p.y;
          cal.minX = Math.min(cal.minX, nx);
          cal.maxX = Math.max(cal.maxX, nx);
          cal.minY = Math.min(cal.minY, ny);
          cal.maxY = Math.max(cal.maxY, ny);
          cal.samples++;
        }
        const progress = clamp01(cal.samples / 110);
        if (progress >= 1 || cal.samples >= 120) {
          const padX = 0.09;
          const padY = 0.1;
          let minX = clamp(cal.minX - padX, 0.02, 0.9);
          let maxX = clamp(cal.maxX + padX, 0.1, 0.98);
          let minY = clamp(cal.minY - padY, 0.02, 0.9);
          let maxY = clamp(cal.maxY + padY, 0.1, 0.98);
          if (maxX - minX < 0.3) {
            const c = (minX + maxX) / 2;
            minX = clamp(c - 0.15, 0.02, 0.7);
            maxX = clamp(c + 0.15, 0.3, 0.98);
          }
          if (maxY - minY < 0.35) {
            const c = (minY + maxY) / 2;
            minY = clamp(c - 0.175, 0.02, 0.65);
            maxY = clamp(c + 0.175, 0.35, 0.98);
          }
          areaRef.current = { minX, maxX, minY, maxY };
          updateSettings({ trackingArea: areaRef.current });
          cal.phase = 'done';
          cal.active = false;
          setCalibration({ active: false, phase: 'done', progress: 1 });
          audio.play('sparkle');
          audio.speak('Wonderful! You are ready to play!', { force: true });
        } else if (now - calUiAt.current > 0.12) {
          calUiAt.current = now;
          setCalibration({ active: true, phase: 'hands', progress });
        }
      }
    }

    const gesture = gestureRef.current.update(hands, now);
    if (gesture.events.length > 0) {
      // Queue events so a slow game frame can never miss one (see drainEvents).
      const q = pendingEvents.current;
      for (const e of gesture.events) q.push({ e, t: now });
      if (q.length > 60) q.splice(0, q.length - 60);
      if (DEBUG) {
        const w = window as unknown as { __magicEvents?: GestureEvent[] };
        w.__magicEvents = [...(w.__magicEvents ?? []), ...gesture.events].slice(-80);
      }
    }
    frameRef.current = {
      frameId: ++frameSeq.current,
      time: now,
      dt,
      hands,
      handsApart: gesture.handsApart,
      events: gesture.events,
      fps: frameRef.current.fps ? frameRef.current.fps * 0.9 + (1 / Math.max(dt, 1e-3)) * 0.1 : 1 / dt,
      demo,
    };

    if (nowMsNow() - statsAt.current > 200) {
      statsAt.current = nowMsNow();
      setHandCount(hands.length);
      setFps(Math.round(frameRef.current.fps));
    }
  };

  // --------------------------------------------------------- calibration API
  const startCalibration = useCallback(() => {
    areaRef.current = { ...DEFAULT_AREA };
    calibrationRef.current = {
      active: true,
      phase: 'stand',
      samples: 0,
      standSince: 0,
      minX: 1,
      maxX: 0,
      minY: 1,
      maxY: 0,
    };
    trackerRef.current.reset();
    gestureRef.current.reset();
    setCalibration({ active: true, phase: 'stand', progress: 0 });
    audio.play('magic');
    audio.speak('Stand back where you can see the television, and hold up your hands.', { force: true });
  }, []);

  const finishCalibration = useCallback(() => {
    calibrationRef.current.active = false;
    setCalibration({ active: false, phase: 'done', progress: 1 });
  }, []);

  const cancelCalibration = useCallback(() => {
    calibrationRef.current.active = false;
    setCalibration({ active: false, phase: 'idle', progress: 0 });
  }, []);

  const setDemoMode = useCallback(
    (on: boolean) => {
      updateSettings({ demoMode: on });
      if (on) {
        trackerRef.current.reset();
        gestureRef.current.reset();
        setStatus('ready');
        setError(null);
        audio.speak('Let us try the magic with pretend hands!', { force: true });
      }
    },
    [updateSettings],
  );

  const value = useMemo<CameraContextValue>(
    () => ({
      settings,
      updateSettings,
      status,
      error,
      notice,
      devices,
      stream,
      frameRef,
      drainEvents,
      videoRef,
      fps,
      handCount,
      demo: settings.demoMode,
      startCamera: () => void startCamera(),
      stopCamera,
      setDemoMode,
      calibration,
      startCalibration,
      finishCalibration,
      cancelCalibration,
    }),
    [
      settings,
      updateSettings,
      status,
      error,
      notice,
      devices,
      stream,
      fps,
      handCount,
      drainEvents,
      calibration,
      startCalibration,
      finishCalibration,
      cancelCalibration,
      setDemoMode,
      stopCamera,
      startCamera,
    ],
  );

  return (
    <CameraContext.Provider value={value}>
      {children}
      <video
        ref={videoRef}
        className="camera-source"
        playsInline
        muted
        autoPlay
        aria-hidden="true"
      />
    </CameraContext.Provider>
  );
}

function nowMsNow(): number {
  return performance.now();
}