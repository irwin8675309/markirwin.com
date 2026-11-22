import type { RawHand } from './landmarker';
import type { Landmark } from '../types';
import { TAU, clamp01 } from '../utils/math';

/**
 * A synthetic open right hand in a 0..1 box ( MediaPipe-style landmark order ).
 * Used only by the optional built-in demo — the real app always uses the webcam.
 */
const CANON: Array<[number, number]> = [
  [0.5, 0.95], // 0 wrist
  [0.38, 0.86], [0.29, 0.78], [0.22, 0.7], [0.16, 0.62], // thumb
  [0.42, 0.6], [0.4, 0.48], [0.39, 0.38], [0.38, 0.3], // index
  [0.5, 0.58], [0.5, 0.44], [0.5, 0.33], [0.5, 0.24], // middle
  [0.58, 0.6], [0.59, 0.47], [0.6, 0.37], [0.6, 0.28], // ring
  [0.65, 0.64], [0.67, 0.54], [0.68, 0.46], [0.69, 0.39], // pinky
];

const MCP = [5, 9, 13, 17];
const TIP = [8, 12, 16, 20];

export interface DemoHandParams {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  openness: number;
  pinch: number;
}

function buildLandmarks(p: DemoHandParams, flip: number): Landmark[] {
  const pts = CANON.map(([x, y]) => ({ x, y }));
  // Fold fingers toward the palm when the hand closes.
  const close = 1 - clamp01(p.openness);
  for (let f = 0; f < 4; f++) {
    const mcp = pts[MCP[f]];
    const tip = pts[TIP[f]];
    const fold = close * (f === 0 ? 0.85 : 1);
    tip.x += (mcp.x - tip.x) * fold;
    tip.y += (mcp.y - tip.y) * fold;
    // Middle joints follow partway.
    for (const joint of [MCP[f] + 1, MCP[f] + 2]) {
      const j = pts[joint];
      j.x += (mcp.x - j.x) * fold * 0.55;
      j.y += (mcp.y - j.y) * fold * 0.55;
    }
  }
  // Pinch: bring thumb tip to the index tip.
  if (p.pinch > 0.01) {
    const t = pts[4];
    const i = pts[8];
    t.x += (i.x - t.x) * p.pinch;
    t.y += (i.y - t.y) * p.pinch;
  }

  const cos = Math.cos(p.rotation);
  const sin = Math.sin(p.rotation);
  const cx = 0.5;
  const cy = 0.55;
  return pts.map((pt) => {
    let dx = (pt.x - cx) * 2.1;
    let dy = (pt.y - cy) * 2.1;
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    return {
      x: p.x + rx * p.scale * flip,
      y: p.y + ry * p.scale,
      z: 0,
    };
  });
}

export function demoRawHands(time: number, count = 2): RawHand[] {
  const hands: RawHand[] = [];
  const t = time;
  for (let i = 0; i < count; i++) {
    const phase = i * Math.PI;
    const x = 0.5 + Math.sin(t * 0.55 + phase) * 0.28;
    const y = 0.55 + Math.cos(t * 0.42 + phase * 1.3) * 0.13;
    const openWave = 0.5 + 0.5 * Math.sin(t * 1.4 + phase);
    const pinchPulse = Math.max(0, Math.sin(t * 0.7 + phase * 2) - 0.55) / 0.45;
    hands.push({
      landmarks: buildLandmarks(
        {
          x,
          y,
          scale: 0.3,
          rotation: Math.sin(t * 0.5 + phase) * 0.25,
          openness: i === 0 ? 0.3 + openWave * 0.7 : 0.85,
          pinch: i === 0 ? pinchPulse : 0,
        },
        i === 0 ? 1 : -1,
      ),
      handedness: i === 0 ? 'Right' : 'Left',
      confidence: 0.95,
    });
  }
  return hands;
}

/** A slowly rotating sparkle angle helper for demo visuals. */
export function demoSpin(time: number): number {
  return (time * 0.5) % TAU;
}