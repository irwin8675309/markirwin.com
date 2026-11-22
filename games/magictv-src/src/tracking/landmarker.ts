import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { Handedness, Landmark } from '../types';

export interface RawHand {
  landmarks: Landmark[];
  handedness: Handedness;
  confidence: number;
}

let landmarkerPromise: Promise<HandLandmarker> | null = null;

/** Full URL of a file in /public, correct even when the app lives in a subfolder. */
const assetUrl = (path: string) => new URL(import.meta.env.BASE_URL + path, document.baseURI).href.replace(/\/$/, '');

/** Model + wasm are served locally from /public so the app works offline. */
export function loadHandLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(assetUrl('mediapipe-wasm'));
      return HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: assetUrl('models/hand_landmarker.task'),
          // CPU (XNNPACK) is slower to start but far more reliable across webcams
          // and mini-PC GPUs. GPU can stall on some USB cameras.
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numHands: 4,
        minHandDetectionConfidence: 0.45,
        minHandPresenceConfidence: 0.42,
        minTrackingConfidence: 0.42,
      });
    })().catch((err) => {
      // Don't cache a failure: "Try again" (or the automatic retry) must be able
      // to load the model again without reloading the whole page.
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}

export function rawHandsFromResult(result: {
  landmarks: Landmark[][];
  handedness: Array<Array<{ categoryName: string; score: number }>>;
}): RawHand[] {
  const hands: RawHand[] = [];
  for (let i = 0; i < result.landmarks.length; i++) {
    const lm = result.landmarks[i];
    if (!lm || lm.length < 21) continue;
    const hand = result.handedness?.[i]?.[0];
    hands.push({
      landmarks: lm.map((p) => ({ x: p.x, y: p.y, z: p.z ?? 0 })),
      handedness: (hand?.categoryName as Handedness) ?? 'Right',
      confidence: hand?.score ?? 0.9,
    });
  }
  return hands;
}