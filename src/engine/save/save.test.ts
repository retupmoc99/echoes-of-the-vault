import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { CONTENT } from '../../data';
import { createRun, stepRun } from '../run/run';
import { SAVE_KEY, SAVE_VERSION, loadSave, newSave, writeSave, type SaveStorage } from './save';

function memoryStorage(initial: Record<string, string> = {}): SaveStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

const run = () => createRun({ seed: 'save', classId: 'relic-breaker' }, CONTENT);

describe('save system', () => {
  it('reports an empty slot', () => {
    expect(loadSave(memoryStorage())).toEqual({ status: 'empty' });
  });

  it('round-trips a save with a run mid-fight', () => {
    const storage = memoryStorage();
    const save = newSave(1000);
    save.run = stepRun(run(), { type: 'chooseNode', nodeId: run().map.startIds[0] }, CONTENT).run;
    expect(save.run.combat).not.toBeNull();
    writeSave(storage, save, 2000);

    const loaded = loadSave(storage);
    expect(loaded).toMatchObject({ status: 'ok', save: { updatedAt: 2000 } });
    if (loaded.status === 'ok') expect(loaded.save.run).toEqual(save.run);
  });

  it('migrates a real milestone 1 save to the current version', () => {
    const v1 = {
      version: 1,
      createdAt: 5,
      updatedAt: 6,
      sandbox: { setup: null, combat: null, fightsWon: 3, fightsLost: 1 },
    };
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(v1) });
    const loaded = loadSave(storage);
    expect(loaded).toEqual({ status: 'ok', migratedFrom: 1, save: { ...newSave(5), updatedAt: 6, idle: { lastTickAt: 6 } } });
    expect(storage.data[`${SAVE_KEY}.backup.v1`]).toBe(JSON.stringify(v1));
  });

  it('migrates a milestone 2 save with a loop in progress, mid-fight', () => {
    const live = stepRun(run(), { type: 'chooseNode', nodeId: run().map.startIds[0] }, CONTENT).run;
    // Rebuild what a v2 run looked like: no corruption, shift, events, new modifiers.
    const v2run = structuredClone(live) as Partial<typeof live>;
    delete v2run.corruption;
    delete v2run.vaultShiftId;
    delete v2run.seenEvents;
    (v2run.combat as unknown as { modifiers: object }).modifiers = { enemyHpMult: 1, enemyDamageBonus: 0 };
    const v2 = { version: 2, createdAt: 1, updatedAt: 2, run: v2run, meta: { loops: 4, victories: 1, deaths: 3 } };

    const loaded = loadSave(memoryStorage({ [SAVE_KEY]: JSON.stringify(v2) }));
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    const r = loaded.save.run!;
    expect(r).toMatchObject({ corruption: 0, vaultShiftId: 'still-vault', seenEvents: [] });
    expect(r.combat!.modifiers.bleedDecay).toBe(BALANCE.status.bleed.decayPerTurn);
    expect(loaded.save.meta.loops).toBe(4);

    // The migrated loop is fully playable.
    const next = stepRun(r, { type: 'combat', action: { type: 'endTurn' } }, CONTENT);
    expect(next.error).toBeUndefined();
  });

  it('runs migrations in order', () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ version: SAVE_VERSION - 1, legacy: true }) });
    const migrations = { [SAVE_VERSION - 1]: (v: { legacy: boolean }) => ({ ...newSave(0), flag: v.legacy }) };
    expect(loadSave(storage, migrations)).toMatchObject({ status: 'ok', save: { flag: true } });
  });

  it('backs up corrupt data instead of throwing it away', () => {
    const storage = memoryStorage({ [SAVE_KEY]: '{not json' });
    const loaded = loadSave(storage);
    expect(loaded.status).toBe('corrupt');
    if (loaded.status === 'corrupt') expect(storage.data[loaded.backupKey]).toBe('{not json');
  });

  it('refuses to load a save from a newer version', () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ version: SAVE_VERSION + 1 }) });
    expect(loadSave(storage)).toEqual({ status: 'tooNew', version: SAVE_VERSION + 1 });
  });
});

describe('v3 → v4 (idle layer)', () => {
  it('keeps a loop in progress, gives it the old full card pool, and starts idle time at the last save', () => {
    const live = run();
    const v3run = structuredClone(live) as Partial<typeof live>;
    delete v3run.cardPool;
    delete v3run.options;
    const v3 = { version: 3, createdAt: 1, updatedAt: 5000, run: v3run, meta: { loops: 2, victories: 0, deaths: 2 } };

    const loaded = loadSave(memoryStorage({ [SAVE_KEY]: JSON.stringify(v3) }));
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    const s = loaded.save;
    expect(s.run!.cardPool).toEqual(CONTENT.classes['relic-breaker'].cardPool);
    expect(s.run!.options).toEqual({ shrinePurge: false, cacheChoices: 2, rewardRerolls: 0 });
    expect(s).toMatchObject({ echoes: [], pendingEcho: null, nextLoop: null, idle: { lastTickAt: 5000 }, meta: { loops: 2 } });
    expect(s.outpost).toMatchObject({ shards: 0, kitId: 'standard' });
    expect(stepRun(s.run!, { type: 'chooseNode', nodeId: s.run!.map.startIds[0] }, CONTENT).error).toBeUndefined();
  });
});
