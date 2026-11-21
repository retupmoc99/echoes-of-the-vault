/**
 * Seeded, serializable RNG (mulberry32).
 *
 * The whole generator state is one 32-bit number stored in a plain object,
 * so it lives inside the save file. Closing the app mid-fight and reopening
 * continues the exact same sequence: no re-rolling a bad draw by refreshing.
 *
 * Functions mutate the RngState they are given. The engine only ever calls
 * them on a cloned draft of the game state (see combat.ts), so the outside
 * world still sees immutable states.
 */

export interface RngState {
  s: number;
}

/** Hash any string seed into a 32-bit starting state (xmur3-style). */
export function createRng(seed: string): RngState {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return { s: (h ^ (h >>> 16)) >>> 0 };
}

/** Float in [0, 1). */
export function rngNext(rng: RngState): number {
  rng.s = (rng.s + 0x6d2b79f5) >>> 0;
  let t = rng.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Integer in [min, max], both inclusive. */
export function rngInt(rng: RngState, min: number, max: number): number {
  return min + Math.floor(rngNext(rng) * (max - min + 1));
}

export function rngPick<T>(rng: RngState, items: readonly T[]): T {
  if (items.length === 0) throw new Error('rngPick: empty list');
  return items[Math.floor(rngNext(rng) * items.length)];
}

/** Pick a key from a weight table. Zero or negative weights are never picked. */
export function rngWeighted<K extends string>(rng: RngState, weights: Partial<Record<K, number>>): K {
  const entries = (Object.entries(weights) as [K, number][]).filter(([, w]) => w > 0);
  if (entries.length === 0) throw new Error('rngWeighted: no positive weights');
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rngNext(rng) * total;
  for (const [key, w] of entries) {
    roll -= w;
    if (roll < 0) return key;
  }
  return entries[entries.length - 1][0];
}

/** Fisher–Yates shuffle into a new array. */
export function rngShuffle<T>(rng: RngState, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rngNext(rng) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
