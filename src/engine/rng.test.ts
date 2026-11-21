import { describe, expect, it } from 'vitest';
import { createRng, rngInt, rngNext, rngShuffle, rngWeighted } from './rng';

describe('rng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng('vault');
    const b = createRng('vault');
    const seqA = Array.from({ length: 20 }, () => rngNext(a));
    const seqB = Array.from({ length: 20 }, () => rngNext(b));
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    expect(rngNext(createRng('a'))).not.toEqual(rngNext(createRng('b')));
  });

  it('resumes identically after a JSON round-trip (save/load)', () => {
    const live = createRng('loop-7');
    rngNext(live);
    const restored = JSON.parse(JSON.stringify(live));
    expect(rngNext(restored)).toEqual(rngNext(live));
  });

  it('keeps ints inside the inclusive range', () => {
    const r = createRng('range');
    for (let i = 0; i < 500; i++) {
      const n = rngInt(r, 3, 5);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(5);
    }
  });

  it('shuffles deterministically without losing items', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const a = rngShuffle(createRng('s'), items);
    const b = rngShuffle(createRng('s'), items);
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual(items);
  });

  it('never picks zero-weight options', () => {
    const r = createRng('w');
    for (let i = 0; i < 200; i++) expect(rngWeighted(r, { a: 0, b: 1 })).toBe('b');
  });
});
