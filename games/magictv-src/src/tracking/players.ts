import type { HandState } from '../types';
import { clamp, dist } from '../utils/math';

/**
 * Works out which hands probably belong to the same child, so two children can
 * play together ("team play"). The camera cannot tell people apart, so this is a
 * careful guess:
 *
 *  - a Left and a Right hand that appear close together (about one arm-span) are
 *    ONE child's two hands;
 *  - any other hand is its own player;
 *  - the decision is made when a hand first appears and then kept ("sticky"), so
 *    two children bringing their hands together for a high five are never merged
 *    into one player half way through.
 *
 * Children who stand shoulder to shoulder may be taken for one player; that only
 * means their high five counts as a clap, which still gets a celebration.
 */
export class PlayerTracker {
  /** hand id -> id of the partner hand, or null for a hand on its own. */
  private partner = new Map<number, number | null>();

  reset(): void {
    this.partner.clear();
  }

  /** Sets `player` on every hand (the same number for hands of the same child). */
  assign(hands: HandState[]): void {
    const live = new Set(hands.map((h) => h.id));
    for (const id of Array.from(this.partner.keys())) {
      if (!live.has(id)) this.partner.delete(id);
    }
    for (const [id, p] of this.partner) {
      if (p !== null && !live.has(p)) this.partner.set(id, null);
    }

    for (const h of hands) {
      if (this.partner.has(h.id)) continue;
      let best: HandState | null = null;
      let bestD = Infinity;
      for (const o of hands) {
        if (o.id === h.id || o.handedness === h.handedness) continue;
        const po = this.partner.get(o.id);
        if (po !== undefined && po !== null) continue; // already has a partner
        const limit = clamp(((h.palmSize + o.palmSize) / 2) * 9, 350, 1000);
        const d = dist(h.palm, o.palm);
        if (d < limit && d < bestD) {
          best = o;
          bestD = d;
        }
      }
      if (best) {
        this.partner.set(h.id, best.id);
        this.partner.set(best.id, h.id);
      } else {
        this.partner.set(h.id, null);
      }
    }

    for (const h of hands) {
      const p = this.partner.get(h.id);
      h.player = p === null || p === undefined ? h.id : Math.min(h.id, p);
    }
  }
}

/** Number of different players among the tracked hands. */
export function countPlayers(hands: HandState[]): number {
  const set = new Set<number>();
  for (const h of hands) if (h.tracked) set.add(h.player);
  return set.size;
}
