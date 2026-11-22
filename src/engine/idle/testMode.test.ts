import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../data';
import { newSave } from '../save/save';
import { outpostStep, testUnlockIds } from './outpost';

describe('test mode', () => {
  it('unlocks every Warden and kit for free, and marks the save', () => {
    const s = newSave(0);
    const shards = s.outpost.shards;
    const res = outpostStep(s, { type: 'testUnlockWardens' }, 0, CONTENT);
    expect(res.error).toBeUndefined();
    for (const id of ['ash-table', 'mirror-that-kept-its-face', 'the-weathervane', 'the-worn-road', 'the-toll-gate', 'kit-penitent', 'kit-wanderer']) {
      expect(res.save.outpost.unlocks).toContain(id);
    }
    expect(res.save.outpost.shards).toBe(shards);
    expect(res.save.settings.testMode).toBe(true);
    // Deeds are untouched: test mode never fakes progress.
    expect(res.save.deeds).toEqual(s.deeds);
  });

  it('keeps existing unlocks, adds no duplicates, and refuses when nothing is left', () => {
    const s = newSave(0);
    s.outpost.unlocks = ['ash-table'];
    const once = outpostStep(s, { type: 'testUnlockWardens' }, 0, CONTENT).save;
    expect(once.outpost.unlocks.filter((id) => id === 'ash-table')).toHaveLength(1);
    expect(once.outpost.unlocks).toHaveLength(new Set([...testUnlockIds(CONTENT), 'ash-table']).size);
    expect(outpostStep(once, { type: 'testUnlockWardens' }, 0, CONTENT).error).toMatch(/already/);
  });
});
