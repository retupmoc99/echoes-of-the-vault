import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../data';
import { createRun, stepRun } from '../run/run';
import { SAVE_KEY, SAVE_VERSION, loadSave, newSave, type SaveData, type SaveStorage } from './save';
import { exportSave, importSave } from './transfer';

function richSave(): SaveData {
  const s = newSave(1234);
  const run = createRun({ seed: 'transfer', classId: 'relic-breaker' }, CONTENT);
  s.run = stepRun(run, { type: 'chooseNode', nodeId: run.map.startIds[0] }, CONTENT).run; // mid-fight
  s.outpost.shards = 77.25;
  s.outpost.lore = ['lore-first-door'];
  s.meta = { loops: 9, victories: 2, deaths: 7 };
  return s;
}

describe('save codes', () => {
  it('round-trips a full save, including a live fight', () => {
    const save = richSave();
    const result = importSave(exportSave(save));
    expect(result).toEqual({ ok: true, save, migratedFrom: undefined });
  });

  it('survives line breaks and spaces from messaging apps', () => {
    const code = exportSave(richSave());
    const mangled = code.replace(/(.{40})/g, '$1\n  ');
    expect(importSave(mangled).ok).toBe(true);
  });

  it('keeps non-ASCII text intact', () => {
    const save = richSave();
    save.echoes = [{ id: 'e', name: 'Ydris, Who Wept Light ✶ ’', traitId: 'faded', deckSnapshot: [], origin: { loop: 1, result: 'death', depth: 1, peakCorruption: 0, vaultShiftId: 'still-vault' }, stability: 1, maxStability: 1, task: null, createdAt: 0 }];
    const back = importSave(exportSave(save));
    expect(back.ok && back.save.echoes[0].name).toBe('Ydris, Who Wept Light ✶ ’');
  });

  it('rejects truncated, altered or foreign codes with a readable reason', () => {
    const code = exportSave(richSave());
    expect(importSave(code.slice(0, -20))).toMatchObject({ ok: false });
    const flipped = code.slice(0, -5) + (code.at(-5) === 'A' ? 'B' : 'A') + code.slice(-4);
    expect(importSave(flipped)).toMatchObject({ ok: false });
    expect(importSave('hello')).toEqual({ ok: false, error: 'That is not a save code.' });
    expect(importSave('')).toMatchObject({ ok: false });
  });

  it('restores an old backup through the migrations', () => {
    // A code made by an older version of the game: same format, older save inside.
    const v4 = { ...newSave(5), version: 4, settings: { haptics: false }, meta: { loops: 3, victories: 0, deaths: 3 } };
    const result = importSave(exportSave(v4 as unknown as SaveData));
    expect(result).toMatchObject({ ok: true, migratedFrom: 4, save: { version: SAVE_VERSION, settings: { haptics: false, hints: true } } });
  });

  it('refuses saves from a newer version', () => {
    const future = { ...newSave(0), version: SAVE_VERSION + 1 };
    expect(importSave(exportSave(future as unknown as SaveData))).toMatchObject({ ok: false });
  });
});

describe('v4 → v5 (hints)', () => {
  const storage = (data: object): SaveStorage => {
    const m: Record<string, string> = { [SAVE_KEY]: JSON.stringify(data) };
    return { getItem: (k) => m[k] ?? null, setItem: (k, v) => void (m[k] = v) };
  };

  it('veterans skip the basic hints; new players see them all', () => {
    const base = { ...newSave(0), version: 4, settings: { haptics: true } };
    const veteran = loadSave(storage({ ...base, meta: { loops: 2, victories: 0, deaths: 2 } }));
    const fresh = loadSave(storage({ ...base, meta: { loops: 0, victories: 0, deaths: 0 } }));
    expect(veteran.status === 'ok' && veteran.save.settings.hintsSeen).toContain('combat-cards');
    expect(fresh.status === 'ok' && fresh.save.settings.hintsSeen).toEqual([]);
  });
});
