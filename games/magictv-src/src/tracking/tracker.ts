import type { HandState, Landmark, TrackingArea, Vec2 } from '../types';
import type { Settings } from '../settings';
import { clamp, clamp01, dist } from '../utils/math';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../types';
import type { RawHand } from './landmarker';
import { buildHandState, pinchRatioOf } from './handBuilder';
import { Vec2Filter, smoothingToParams } from './filters';
import { createMapper } from './mapping';
import { PlayerTracker } from './players';

interface Track {
  id: number;
  handedness: 'Left' | 'Right';
  filters: Vec2Filter[];
  landmarks: Vec2[];
  raw: RawHand;
  lastSeen: number;
  palm: Vec2;
  prevPalm: Vec2;
  velocity: Vec2;
  history: Vec2[];
  pinchActive: boolean;
  pinchStartedAt: number;
}

interface LostTrack {
  id: number;
  handedness: 'Left' | 'Right';
  palm: Vec2;
  at: number;
}

/** How long a hand is kept alive (and still reported) after the last detection. */
export const COAST_SECONDS = 0.5;
/** How long an unmatched track is remembered so a returning hand keeps its id. */
const TRACK_KEEP_SECONDS = 1.0;
/** Pinch closes below this hand-relative distance, opens above the other (hysteresis). */
const PINCH_ENTER = 0.55;
const PINCH_EXIT = 0.8;
const PINCH_DEBOUNCE = 0.08;

/** Assigns MediaPipe detections to stable hand ids and smooths them. */
export class HandTracker {
  private tracks = new Map<number, Track>();
  private lost: LostTrack[] = [];
  private nextId = 1;
  private lastHands: HandState[] = [];
  private players = new PlayerTracker();

  reset(): void {
    this.players.reset();
    this.tracks.clear();
    this.lost = [];
    this.lastHands = [];
    this.nextId = 1;
  }

  update(rawHands: RawHand[], now: number, dt: number, settings: Settings, area: TrackingArea): HandState[] {
    const mapper = createMapper(settings, area);
    const params = smoothingToParams(settings.smoothing);
    const mapped = rawHands.slice(0, settings.numHands).map((raw) => {
      const points: Vec2[] = raw.landmarks.map((p) => {
        const w = mapper(p.x, p.y);
        return { x: w.x, y: w.y };
      });
      return { raw, points };
    });

    const trackList = Array.from(this.tracks.values());

    // Predict where each existing track should be and greedily match.
    const candidates: Array<{ ti: number; hi: number; cost: number }> = [];
    for (let ti = 0; ti < trackList.length; ti++) {
      const tr = trackList[ti];
      const predicted = {
        x: tr.palm.x + tr.velocity.x * 0.09,
        y: tr.palm.y + tr.velocity.y * 0.09,
      };
      for (let hi = 0; hi < mapped.length; hi++) {
        const p = mapped[hi].points[9];
        let cost = dist(predicted, p);
        if (tr.handedness !== mapped[hi].raw.handedness) cost += 90;
        const gate = Math.max(230, dist(tr.landmarks[0], tr.landmarks[9]) * 2.6);
        if (cost < gate) candidates.push({ ti, hi, cost });
      }
    }
    candidates.sort((a, b) => a.cost - b.cost);

    const trackForHand = new Map<number, Track>();
    const usedTrackIdx = new Set<number>();
    for (const c of candidates) {
      if (usedTrackIdx.has(c.ti) || trackForHand.has(c.hi)) continue;
      usedTrackIdx.add(c.ti);
      trackForHand.set(c.hi, trackList[c.ti]);
    }

    const usedTrackIds = new Set<number>();
    for (let hi = 0; hi < mapped.length; hi++) {
      const hand = mapped[hi];
      let track = trackForHand.get(hi);
      if (!track) {
        const filters: Vec2Filter[] = [];
        for (let i = 0; i < 21; i++) filters.push(new Vec2Filter(30, params.minCutoff, params.beta));
        // Reuse the id of a hand that briefly left the frame, so gestures and
        // pinches survive a dropped detection instead of restarting.
        let reusedId: number | undefined;
        const palm = hand.points[9];
        for (let li = 0; li < this.lost.length; li++) {
          const l = this.lost[li];
          if (now - l.at < 1.0 && dist(l.palm, palm) < 360 && !this.tracks.has(l.id)) {
            reusedId = l.id;
            this.lost.splice(li, 1);
            break;
          }
        }
        track = {
          id: reusedId ?? this.nextId++,
          handedness: hand.raw.handedness,
          filters,
          landmarks: hand.points,
          raw: hand.raw,
          lastSeen: now,
          palm: { ...palm },
          prevPalm: { ...palm },
          velocity: { x: 0, y: 0 },
          history: [],
          pinchActive: false,
          pinchStartedAt: 0,
        };
        if (reusedId === undefined) this.nextId = Math.max(this.nextId, track.id + 1);
        this.tracks.set(track.id, track);
      }
      track.lastSeen = now;
      track.raw = hand.raw;
      for (let i = 0; i < 21; i++) track.filters[i].configure(params.minCutoff, params.beta);
      const smoothed = hand.points.map((p, i) => track!.filters[i].filter(p, dt));
      track.landmarks = smoothed;
      usedTrackIds.add(track.id);
    }

    // Drop stale tracks (hands briefly leaving the view shouldn't break play).
    for (const [id, tr] of this.tracks) {
      if (now - tr.lastSeen > TRACK_KEEP_SECONDS) {
        this.lost.push({ id, handedness: tr.handedness, palm: { ...tr.palm }, at: now });
        if (this.lost.length > 8) this.lost.shift();
        this.tracks.delete(id);
      }
    }

    const hands: HandState[] = [];
    for (const tr of this.tracks.values()) {
      if (!usedTrackIds.has(tr.id)) {
        // Detection dropout: keep reporting the hand where it was (and with its
        // pinch state) for a short while instead of making it vanish for one frame.
        if (now - tr.lastSeen > COAST_SECONDS) continue;
        tr.velocity.x *= 0.8;
        tr.velocity.y *= 0.8;
        hands.push(
          buildHandState(
            tr.id,
            tr.raw,
            tr.landmarks as Landmark[],
            tr.velocity,
            tr.pinchActive,
            tr.pinchStartedAt,
            tr.history,
            false,
          ),
        );
        continue;
      }
      const palmNow = { x: tr.landmarks[9].x, y: tr.landmarks[9].y };
      const edt = Math.max(1 / 120, Math.min(0.1, dt));
      let vx = (palmNow.x - tr.prevPalm.x) / edt;
      let vy = (palmNow.y - tr.prevPalm.y) / edt;
      const sp = Math.hypot(vx, vy);
      if (sp > 5000) {
        vx = (vx / sp) * 5000;
        vy = (vy / sp) * 5000;
      }
      tr.velocity.x = tr.velocity.x * 0.55 + vx * 0.45;
      tr.velocity.y = tr.velocity.y * 0.55 + vy * 0.45;
      tr.prevPalm = { x: tr.palm.x, y: tr.palm.y };
      tr.palm = palmNow;

      const lastHist = tr.history[tr.history.length - 1];
      if (!lastHist || dist(lastHist, palmNow) > 12) {
        tr.history.push({ ...palmNow });
        if (tr.history.length > 28) tr.history.shift();
      }

      // Pinch with hysteresis (close below ENTER, open above EXIT) and a short
      // debounce. The debounce timer is cleared whenever the fingers open, so a
      // brief blip can never "pre-arm" a pinch for later.
      const pinchRatio = pinchRatioOf(tr.landmarks);
      if (!tr.pinchActive) {
        if (pinchRatio < PINCH_ENTER) {
          if (!tr.pinchStartedAt) tr.pinchStartedAt = now;
          if (now - tr.pinchStartedAt > PINCH_DEBOUNCE) tr.pinchActive = true;
        } else {
          tr.pinchStartedAt = 0;
        }
      } else if (pinchRatio > PINCH_EXIT) {
        tr.pinchActive = false;
        tr.pinchStartedAt = 0;
      }

      hands.push(
        buildHandState(tr.id, tr.raw, tr.landmarks as Landmark[], tr.velocity, tr.pinchActive, tr.pinchStartedAt, tr.history),
      );
    }

    hands.sort((a, b) => a.id - b.id);
    this.players.assign(hands);
    this.lastHands = hands;
    return hands;
  }

  get hands(): HandState[] {
    return this.lastHands;
  }
}

export const WORLD = { width: WORLD_WIDTH, height: WORLD_HEIGHT };
export { clamp, clamp01 };