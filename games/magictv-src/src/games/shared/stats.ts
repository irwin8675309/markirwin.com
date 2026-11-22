/**
 * A tiny private play log for the grown-up page: seconds of real play (a hand in
 * view) per game per day, kept in this browser only, for the last 14 days.
 */
const KEY = 'magictv.stats';
const KEEP_DAYS = 14;

type Days = Record<string, Record<string, number>>;

let days: Days = load();
let dirty = 0;

function load(): Days {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return raw && typeof raw === 'object' ? (raw as Days) : {};
  } catch {
    return {};
  }
}

export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function prune(now: Date): void {
  const keys = Object.keys(days).sort();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
  const c = dayKey(cutoff);
  for (const k of keys) if (k < c) delete days[k];
}

export function flushStats(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(days));
  } catch {
    /* private mode: the log lasts until the page closes */
  }
  dirty = 0;
}

/** Call every frame a child is playing. */
export function recordPlay(gameId: string, dt: number, now: Date = new Date()): void {
  if (!(dt > 0) || dt > 2) return;
  const k = dayKey(now);
  const d = (days[k] ??= {});
  d[gameId] = (d[gameId] ?? 0) + dt;
  dirty += dt;
  if (dirty > 15) {
    prune(now);
    flushStats();
  }
}

export interface StatsSummary {
  todaySeconds: number;
  /** Oldest first, 7 entries ending today. */
  week: Array<{ day: string; seconds: number }>;
  /** Games played in the last 7 days, most first. */
  topGames: Array<{ id: string; seconds: number }>;
}

export function summarize(now: Date = new Date()): StatsSummary {
  const week: StatsSummary['week'] = [];
  const perGame = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    const g = days[k] ?? {};
    let total = 0;
    for (const [id, s] of Object.entries(g)) {
      total += s;
      perGame.set(id, (perGame.get(id) ?? 0) + s);
    }
    week.push({ day: k, seconds: total });
  }
  const topGames = Array.from(perGame, ([id, seconds]) => ({ id, seconds })).sort((a, b) => b.seconds - a.seconds);
  return { todaySeconds: week[6].seconds, week, topGames };
}

export function resetStats(): void {
  days = {};
  flushStats();
}
