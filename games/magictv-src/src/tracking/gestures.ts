import type { GestureEvent, HandState } from '../types';
import { clamp01, dist } from '../utils/math';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../types';

interface WaveTrack {
  lastDir: number;
  lastFlip: number;
  flips: number;
  lastEvent: number;
  flipX: number;
}

/**
 * Child-friendly gesture recognition. Every detector is deliberately forgiving:
 * big movements, loose thresholds and cooldowns so nothing fires twice by accident.
 */
export class GestureEngine {
  private waves = new Map<number, WaveTrack>();
  private prevPinch = new Map<number, boolean>();
  private prevOpen = new Map<number, boolean>();
  private prevPoint = new Map<number, boolean>();
  private prevFist = new Map<number, boolean>();
  private lastSwipe = new Map<number, number>();
  private lastClap = -10;
  private prevPairDist = new Map<string, number>();
  private lastTogether = -10;
  private lastApart = -10;
  private prevTogether = false;
  private prevApart = false;
  private lastUp = -10;
  private lastDown = -10;
  private prevUp = false;
  private prevDown = false;
  private waveX = 0;
  private waveAnchor = 0;
  private waveDir = 0;
  private waveFlips = 0;
  private waveLastFlip = -10;
  private waveLastEvent = -10;
  private waveLastSeen = -10;
  private waveSeen = false;
  private pairIds: [number, number] | null = null;

  /**
   * Picks the pair of hands used for two-hand gestures. A child's own hands are
   * usually one Left + one Right, close together and the same size, so that pair
   * is preferred. The choice is sticky while both hands stay visible, so the
   * pair does not flip between frames and cause false clap/apart events.
   */
  private choosePair(hands: HandState[]): [HandState, HandState] | null {
    if (hands.length < 2) {
      this.pairIds = null;
      return null;
    }
    if (this.pairIds) {
      const a = hands.find((h) => h.id === this.pairIds![0]);
      const b = hands.find((h) => h.id === this.pairIds![1]);
      if (a && b) return [a, b];
    }
    let best: [HandState, HandState] | null = null;
    let bestScore = Infinity;
    for (let i = 0; i < hands.length; i++) {
      for (let j = i + 1; j < hands.length; j++) {
        const a = hands[i];
        const b = hands[j];
        let score = dist(a.palm, b.palm) + Math.abs(a.palmSize - b.palmSize) * 4;
        if (a.handedness === b.handedness) score += 600;
        if (score < bestScore) {
          bestScore = score;
          best = [a, b];
        }
      }
    }
    if (best) this.pairIds = [best[0].id, best[1].id];
    return best;
  }

  reset(): void {
    this.pairIds = null;
    this.waves.clear();
    this.prevPinch.clear();
    this.prevOpen.clear();
    this.prevPoint.clear();
    this.prevFist.clear();
    this.lastSwipe.clear();
    this.prevPairDist.clear();
    this.lastClap = -10;
    this.lastTogether = -10;
    this.lastApart = -10;
    this.prevTogether = false;
    this.prevApart = false;
    this.lastUp = -10;
    this.lastDown = -10;
    this.prevUp = false;
    this.prevDown = false;
    this.waveX = 0;
    this.waveAnchor = 0;
    this.waveDir = 0;
    this.waveFlips = 0;
    this.waveLastFlip = -10;
    this.waveLastEvent = -10;
    this.waveLastSeen = -10;
    this.waveSeen = false;
  }

  update(hands: HandState[], now: number): { events: GestureEvent[]; handsApart: number } {
    const events: GestureEvent[] = [];
    const liveIds = new Set(hands.map((h) => h.id));

    for (const h of hands) {
      // A hand being coasted through a detection dropout never fires new events.
      if (!h.tracked) continue;
      const known = this.prevPinch.has(h.id);

      if (h.pinchActive && (known ? !this.prevPinch.get(h.id) : false)) {
        events.push({ type: 'pinch', handId: h.id, x: h.tip.x, y: h.tip.y });
      } else if (!h.pinchActive && known && this.prevPinch.get(h.id)) {
        events.push({ type: 'release', handId: h.id, x: h.tip.x, y: h.tip.y });
      }
      this.prevPinch.set(h.id, h.pinchActive);

      const openNow = h.openness > 0.62;
      if (known && openNow && !this.prevOpen.get(h.id)) {
        events.push({ type: 'openPalm', handId: h.id, x: h.palm.x, y: h.palm.y });
      }
      this.prevOpen.set(h.id, openNow);

      const pointNow = h.pointing;
      if (known && pointNow && !this.prevPoint.get(h.id)) {
        events.push({ type: 'point', handId: h.id, x: h.tip.x, y: h.tip.y });
      }
      this.prevPoint.set(h.id, pointNow);

      const fistNow = h.fist;
      if (known && fistNow && !this.prevFist.get(h.id)) {
        events.push({ type: 'fist', handId: h.id, x: h.palm.x, y: h.palm.y });
      }
      this.prevFist.set(h.id, fistNow);

      if (h.speed > 1650 && now - (this.lastSwipe.get(h.id) ?? -10) > 0.45) {
        this.lastSwipe.set(h.id, now);
        events.push({ type: 'fastSwipe', handId: h.id, x: h.palm.x, y: h.palm.y, strength: h.speed / 2500 });
      }
    }

    // Wave detection is global rather than per-hand-id: children wave fast and
    // MediaPipe can briefly re-acquire the hand with a new id. Following the
    // fastest hand's screen-x keeps the wave recognisable across those gaps.
    let fastest: HandState | null = null;
    for (const h of hands) if (h.tracked && (!fastest || h.speed > fastest.speed)) fastest = h;
    if (fastest && (hands.length > 0 || now - this.waveLastSeen < 1.4)) {
      const x = fastest.palm.x;
      if (!this.waveSeen || now - this.waveLastSeen > 1.4) {
        this.waveX = x;
        this.waveAnchor = x;
        this.waveDir = 0;
        this.waveFlips = 0;
        this.waveSeen = true;
      }
      const dx = x - this.waveX;
      // Ignore teleport-sized jumps from re-acquisition.
      if (Math.abs(dx) < 1400) {
        if (Math.abs(dx) > 2.5) {
          const dir = Math.sign(dx);
          if (this.waveDir !== 0 && dir !== this.waveDir) {
            if (now - this.waveLastFlip < 1.1 && Math.abs(x - this.waveAnchor) > 45) this.waveFlips++;
            else this.waveFlips = 1;
            this.waveAnchor = x;
            this.waveLastFlip = now;
            if (this.waveFlips >= 2 && now - this.waveLastEvent > 0.9) {
              events.push({ type: 'wave', handId: fastest.id, x, y: fastest.palm.y });
              this.waveLastEvent = now;
              this.waveFlips = 0;
            }
          }
          this.waveDir = dir;
        }
        this.waveX = x;
        this.waveLastSeen = now;
      } else {
        this.waveX = x;
        this.waveAnchor = x;
        this.waveDir = 0;
      }
    } else {
      this.waveSeen = false;
      this.waveDir = 0;
      this.waveFlips = 0;
    }

    // Clean state for hands that left.
    for (const id of Array.from(this.prevPinch.keys())) if (!liveIds.has(id)) this.prevPinch.delete(id);
    for (const id of Array.from(this.prevOpen.keys())) if (!liveIds.has(id)) this.prevOpen.delete(id);
    for (const id of Array.from(this.prevPoint.keys())) if (!liveIds.has(id)) this.prevPoint.delete(id);
    for (const id of Array.from(this.prevFist.keys())) if (!liveIds.has(id)) this.prevFist.delete(id);
    for (const id of Array.from(this.lastSwipe.keys())) if (!liveIds.has(id)) this.lastSwipe.delete(id);
    for (const id of Array.from(this.waves.keys())) if (!liveIds.has(id)) this.waves.delete(id);

    // Two-hand gestures use the two hands most likely to belong to ONE child,
    // not simply the first two ids (which could be one hand from each child).
    const pair = this.choosePair(hands.filter((h) => h.tracked));
    let handsApart = 1;
    if (pair) {
      const [a, b] = pair;
      const d = dist(a.palm, b.palm);
      handsApart = clamp01(d / (WORLD_WIDTH * 0.85));
      const size = (a.palmSize + b.palmSize) / 2;

      // Clap: hands come together quickly.
      const key = `${Math.min(a.id, b.id)}:${Math.max(a.id, b.id)}`;
      const prevD = this.prevPairDist.get(key) ?? 999;
      if (d < size * 1.15 && prevD > size * 1.9 && now - this.lastClap > 0.5) {
        this.lastClap = now;
        events.push({
          type: 'clap',
          handIds: [a.id, b.id],
          x: (a.palm.x + b.palm.x) / 2,
          y: (a.palm.y + b.palm.y) / 2,
          strength: Math.min(1, Math.abs(prevD - d) / size),
        });
      }
      this.prevPairDist.set(key, d);

      const togetherNow = d < WORLD_WIDTH * 0.2;
      const apartNow = d > WORLD_WIDTH * 0.38;
      if (togetherNow && !this.prevTogether && now - this.lastTogether > 0.8) {
        this.lastTogether = now;
        events.push({ type: 'handsTogether', handIds: [a.id, b.id] });
      }
      if (apartNow && !this.prevApart && now - this.lastApart > 0.8) {
        this.lastApart = now;
        events.push({ type: 'handsApart', handIds: [a.id, b.id] });
      }
      this.prevTogether = togetherNow;
      this.prevApart = apartNow;
    } else {
      this.prevTogether = false;
      this.prevApart = false;
      this.prevPairDist.clear();
    }

    // Both hands up / down.
    if (pair) {
      const up = pair.every((h) => h.palm.y < WORLD_HEIGHT * 0.42);
      const down = pair.every((h) => h.palm.y > WORLD_HEIGHT * 0.62);
      if (up && !this.prevUp && now - this.lastUp > 1.2) {
        this.lastUp = now;
        events.push({ type: 'bothHandsUp' });
      }
      if (down && !this.prevDown && now - this.lastDown > 1.2) {
        this.lastDown = now;
        events.push({ type: 'bothHandsDown' });
      }
      this.prevUp = up;
      this.prevDown = down;
    } else {
      this.prevUp = false;
      this.prevDown = false;
    }

    return { events, handsApart };
  }
}