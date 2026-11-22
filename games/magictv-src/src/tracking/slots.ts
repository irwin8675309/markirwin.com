/**
 * Decides "child number" (slot 0, 1, 2 ...) for each player the camera sees.
 *
 * The slot picks her colour and her animal buddy, so it should not change just
 * because the camera lost her for a moment. Rules:
 *  - a player keeps her slot while she stays in view (and for 3 s after);
 *  - a player who appears again takes the free slot whose last-known position on
 *    screen is nearest (the child who sat on the left comes back as the left child);
 *  - with no history, children arriving together are numbered left to right.
 */
export interface SlotPlayer {
  id: number;
  /** Where on screen she is (x of her hands), in world pixels. */
  x: number;
}

const KEEP_SECONDS = 3;
/** A remembered seat farther than this from the newcomer counts as a weak match. */
const NEAR = 600;

export class SlotAssigner {
  private active = new Map<number, { slot: number; seen: number; x: number }>();
  private home = new Map<number, number>();

  reset(): void {
    this.active.clear();
    this.home.clear();
  }

  assign(players: SlotPlayer[], now: number): Map<number, number> {
    const ids = new Set(players.map((p) => p.id));
    for (const [id, v] of this.active) {
      if (!ids.has(id) && now - v.seen > KEEP_SECONDS * 1000) this.active.delete(id);
    }
    const out = new Map<number, number>();
    for (const p of players) {
      const v = this.active.get(p.id);
      if (v) {
        v.seen = now;
        v.x += (p.x - v.x) * 0.1;
        this.home.set(v.slot, v.x);
        out.set(p.id, v.slot);
      }
    }
    const fresh = players.filter((p) => !this.active.has(p.id)).sort((a, b) => a.x - b.x);
    for (const p of fresh) {
      const used = new Set(Array.from(this.active.values()).map((v) => v.slot));
      let best = -1;
      let bestScore = Infinity;
      for (let s = 0; s < 8; s++) {
        if (used.has(s)) continue;
        const h = this.home.get(s);
        const score = h === undefined ? NEAR + s * 10 : Math.abs(h - p.x);
        if (score < bestScore) {
          best = s;
          bestScore = score;
        }
      }
      this.active.set(p.id, { slot: best, seen: now, x: p.x });
      this.home.set(best, p.x);
      out.set(p.id, best);
    }
    return out;
  }
}
