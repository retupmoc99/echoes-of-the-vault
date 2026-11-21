import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { CONTENT } from '../../data';
import { createRun, reachableNodes, stepRun } from '../run/run';
import { pickEvent } from '../run/events';
import { SAVE_KEY, SAVE_VERSION, loadSave, newSave, type SaveData } from '../save/save';
import type { Echo, MapNode, RunState } from '../types';
import { addAwakening, awakeningCap, giveValue, lullCost, stageFor } from './awakening';
import { createEcho } from './echoes';
import { advanceIdle } from './idle';
import { closeLoop } from './loop';
import { outpostStep } from './outpost';

const A = BALANCE.awakening;
const HOUR = 3_600_000;
const T0 = 1_000_000_000_000;

function endedRun(seed = 'aw', patch: Partial<RunState> = {}): RunState {
  const r = stepRun(createRun({ seed, classId: 'relic-breaker', vaultShiftId: 'still-vault' }, CONTENT), { type: 'abandon' }, CONTENT).run;
  return { ...r, ...patch };
}
const atProgress = (progress: number, patch: Partial<SaveData> = {}): SaveData => addAwakening({ ...newSave(T0), ...patch }, progress, CONTENT);
const echo = (patch: Partial<Echo> = {}): Echo => ({ ...createEcho(endedRun(), 1, T0, CONTENT), traitId: 'faded', stability: 100, maxStability: 100, task: null, ...patch });

describe('Awakening progress and stages', () => {
  it('maps progress to stages, capped at the last threshold', () => {
    expect(stageFor(0)).toBe(0);
    expect(stageFor(A.thresholds[0])).toBe(1);
    expect(stageFor(A.thresholds[2])).toBe(3);
    expect(stageFor(999)).toBe(5);
    expect(atProgress(500).world.awakening.progress).toBe(awakeningCap());
    expect(awakeningCap()).toBe(A.thresholds[4]);
  });

  it('never goes below zero', () => {
    expect(atProgress(-10).world.awakening.progress).toBe(0);
  });

  it('closing a loop adds progress, more for escaping', () => {
    const close = (result: 'victory' | 'death') => closeLoop({ ...newSave(T0), run: endedRun('c', { result }) }, CONTENT, T0).world.awakening.progress;
    expect(close('death')).toBe(A.perLoop);
    expect(close('victory')).toBe(A.perLoop + A.perEscape);
  });

  it('grants each stage’s lore the first time, once', () => {
    const s = atProgress(A.thresholds[1]); // straight to stage 2: both fragments
    expect(s.outpost.lore).toEqual(['lore-first-breath', 'lore-names-in-the-dark']);
    const again = addAwakening(addAwakening(s, -20, CONTENT), 20, CONTENT);
    expect(again.outpost.lore).toEqual(s.outpost.lore);
  });

  it('Echo work stirs it; resting does not; time away alone never does', () => {
    const working = { ...newSave(T0), echoes: [echo({ task: { kind: 'dig', startedAt: T0 } })] };
    expect(advanceIdle(working, T0 + 8 * HOUR, CONTENT).save.world.awakening.progress).toBeCloseTo(8 / A.echoHoursPerPoint);
    const resting = { ...newSave(T0), echoes: [echo()] };
    expect(advanceIdle(resting, T0 + 8 * HOUR, CONTENT).save.world.awakening.progress).toBe(0);
  });

  it('stage 1 boosts Dig', () => {
    const digging = (s: SaveData) => advanceIdle({ ...s, echoes: [echo({ task: { kind: 'dig', startedAt: T0 } })] }, T0 + HOUR, CONTENT).save.outpost.shards;
    expect(digging(atProgress(A.thresholds[0]))).toBeCloseTo(digging(newSave(T0)) * (1 + A.digBonus));
  });
});

describe('Lull and Give', () => {
  it('Lull spends Shards, lowers progress, and costs more each time at a stage', () => {
    let s = atProgress(20, { outpost: { ...newSave(T0).outpost, shards: 500 } });
    const first = lullCost(s.world.awakening);
    s = outpostStep(s, { type: 'lull' }, T0, CONTENT).save;
    expect(s.world.awakening.progress).toBe(20 - A.lull.amount);
    expect(s.outpost.shards).toBe(500 - first);
    expect(lullCost(s.world.awakening)).toBe(first + A.lull.costStep);
  });

  it('Lull is refused when broke or when the Sleeper is still', () => {
    expect(outpostStep(atProgress(20), { type: 'lull' }, T0, CONTENT).error).toMatch(/Shards/);
    const rich = { ...newSave(T0), outpost: { ...newSave(T0).outpost, shards: 500 } };
    expect(outpostStep(rich, { type: 'lull' }, T0, CONTENT).error).toMatch(/still/);
  });

  it('giving an Echo removes it and lowers progress by its stability', () => {
    const e = echo({ stability: 60 });
    const s = outpostStep(atProgress(30, { echoes: [e] }), { type: 'giveEcho', echoId: e.id }, T0, CONTENT).save;
    expect(s.echoes).toHaveLength(0);
    expect(s.world.awakening.progress).toBe(30 - giveValue(e));
    expect(giveValue(e)).toBe(60 / A.giveDivisor);
  });
});

describe('Awakening in loops', () => {
  const runAt = (stage: number, seed = 'stage') => createRun({ seed, classId: 'relic-breaker', vaultShiftId: 'still-vault', awakeningStage: stage }, CONTENT);
  const firstFight = (r: RunState) => stepRun(r, { type: 'chooseNode', nodeId: r.map.startIds[0] }, CONTENT).run;

  it('stage 0 changes nothing: same loop as before the Awakening existed', () => {
    const plain = createRun({ seed: 'same', classId: 'relic-breaker', vaultShiftId: 'still-vault' }, CONTENT);
    expect(runAt(0, 'same')).toEqual(plain);
  });

  it('Awakening events only appear from stage 1', () => {
    const ids = (stage: number) => new Set(Array.from({ length: 60 }, (_, i) => pickEvent({ ...runAt(stage, `ev${i}`), seenEvents: [] }, 5, CONTENT)));
    const awakeningIds = Object.values(CONTENT.events).filter((e) => e.minAwakening).map((e) => e.id);
    expect(awakeningIds.some((id) => ids(0).has(id))).toBe(false);
    expect(awakeningIds.some((id) => ids(1).has(id))).toBe(true);
  });

  it('from stage 2, early fights are the Waking versions', () => {
    for (let i = 0; i < 12; i++) {
      expect(firstFight(runAt(1, `w${i}`)).combat!.enemies.every((e) => !e.defId.startsWith('waking-'))).toBe(true);
      expect(firstFight(runAt(2, `w${i}`)).combat!.enemies.every((e) => e.defId.startsWith('waking-'))).toBe(true);
    }
  });

  it('from stage 3, elites carry an affix, and beating one banks Shards when the loop closes', () => {
    // Walk to an elite by forcing the run onto one.
    const r = runAt(3, 'elite');
    const elite = Object.values(r.map.nodes).find((n: MapNode) => n.type === 'elite')!;
    const before = { ...r, position: Object.values(r.map.nodes).find((n) => n.row === elite.row - 1 && reachableNodes(r.map, n.id).includes(elite.id))!.id };
    const inFight = stepRun(before, { type: 'chooseNode', nodeId: elite.id }, CONTENT).run;
    const enemy = inFight.combat!.enemies[0];
    expect(Object.keys(CONTENT.awakening.affixes)).toContain(enemy.affix);

    const won = { ...inFight, shardsFound: A.eliteShards, phase: 'ended' as const, result: 'death' as const };
    const closed = closeLoop({ ...newSave(T0), run: won }, CONTENT, T0);
    expect(closed.outpost.shards).toBe(A.eliteShards);
    expect(closed.meta.history[0].awakeningStage).toBe(3);
  });

  it('elites below stage 3 have no affix', () => {
    const r = runAt(2, 'elite');
    const elite = Object.values(r.map.nodes).find((n) => n.type === 'elite')!;
    const before = { ...r, position: Object.values(r.map.nodes).find((n) => n.row === elite.row - 1 && reachableNodes(r.map, n.id).includes(elite.id))!.id };
    expect(stepRun(before, { type: 'chooseNode', nodeId: elite.id }, CONTENT).run.combat!.enemies[0].affix).toBeUndefined();
  });
});

describe('v7 → v8 (the Awakening)', () => {
  it('completes the Awakening state, sets live loops to stage 0, and tags history', () => {
    const base = newSave(0);
    const run = createRun({ seed: 'v8', classId: 'relic-breaker' }, CONTENT);
    const oldRun: Record<string, unknown> = { ...run };
    delete oldRun.awakeningStage;
    delete oldRun.shardsFound;
    const v7 = {
      ...base,
      version: 7,
      run: oldRun,
      world: { factions: {}, awakening: { stage: 0, progress: 0 } },
      meta: { ...base.meta, history: [{ loop: 1 }] },
    };
    const m: Record<string, string> = { [SAVE_KEY]: JSON.stringify(v7) };
    const loaded = loadSave({ getItem: (k) => m[k] ?? null, setItem: (k, v) => void (m[k] = v) });
    expect(loaded).toMatchObject({
      status: 'ok',
      migratedFrom: 7,
      save: {
        version: SAVE_VERSION,
        world: { awakening: { stage: 0, progress: 0, cycle: 1, lullsThisStage: 0 } },
        run: { awakeningStage: 0, shardsFound: 0 },
        meta: { history: [{ loop: 1, awakeningStage: 0 }] },
      },
    });
  });
});
