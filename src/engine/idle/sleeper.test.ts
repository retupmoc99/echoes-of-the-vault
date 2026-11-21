/**
 * The Awakening, part 2: stages 4–5, boss phases, the Sleeper and cycles.
 */
import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { CONTENT } from '../../data';
import { createCombat, step } from '../combat/combat';
import { PLAYER_ID, type Ctx } from '../combat/context';
import { checkPhase, enemyName } from '../combat/phases';
import { combatModifiersFor } from '../run/corruption';
import { createRun, reachableNodes, stepRun } from '../run/run';
import { SAVE_KEY, SAVE_VERSION, loadSave, newSave, type SaveData } from '../save/save';
import type { CombatState, Echo, RunState } from '../types';
import { addAwakening } from './awakening';
import { createEcho } from './echoes';
import { closeLoop, nextRunPreview } from './loop';
import { outpostStep } from './outpost';

const A = BALANCE.awakening;
const T0 = 1_000_000_000_000;

function endedRun(seed: string, patch: Partial<RunState> = {}): RunState {
  const r = stepRun(createRun({ seed, classId: 'relic-breaker', vaultShiftId: 'still-vault' }, CONTENT), { type: 'abandon' }, CONTENT).run;
  return { ...r, ...patch };
}
const echo = (): Echo => ({ ...createEcho(endedRun('e'), 1, T0, CONTENT), traitId: 'faded', stability: 100, maxStability: 100, task: null });
const ctxFor = (s: CombatState): Ctx => ({ s, content: CONTENT, events: [], depth: 0 });

describe('boss phases', () => {
  const lockFight = (stage: number) =>
    createCombat({ seed: 'lock', deck: ['shard-strike'], hp: 70, maxHp: 70, relics: [], encounterId: 'grieving-lock', modifiers: { awakeningStage: stage } }, CONTENT).state;

  it('the Lock weeps open at half HP from stage 4: new name and its first new move', () => {
    const s = lockFight(4);
    const lock = s.enemies[0];
    lock.hp = Math.floor(lock.maxHp * 0.5);
    const ctx = ctxFor(s);
    checkPhase(ctx, lock);
    expect(lock.phase).toBe(0);
    expect(enemyName(lock, CONTENT)).toBe('The Lock, Weeping Open');
    expect(lock.intent).toBe('flood');
    expect(ctx.events).toContainEqual({ type: 'phaseChange', enemyId: lock.id, name: 'The Lock, Weeping Open' });
  });

  it('below stage 4 the Lock has no second phase', () => {
    const s = lockFight(3);
    s.enemies[0].hp = 10;
    checkPhase(ctxFor(s), s.enemies[0]);
    expect(s.enemies[0].phase).toBeUndefined();
  });

  it('a big hit can skip straight to the deepest phase reached', () => {
    const s = createCombat({ seed: 'sl', deck: ['shard-strike'], hp: 70, maxHp: 70, relics: [], encounterId: 'the-sleeper', modifiers: { awakeningStage: 5 } }, CONTENT).state;
    s.enemies[0].hp = Math.floor(s.enemies[0].maxHp * 0.2);
    checkPhase(ctxFor(s), s.enemies[0]);
    expect(enemyName(s.enemies[0], CONTENT)).toBe('The Sleeper, Waking');
  });
});

describe('the Sleeper', () => {
  const deck = Array.from({ length: 6 }, () => 'shard-strike');
  const sleeper = (memories?: string[]) =>
    createCombat({ seed: 'sleep', deck, hp: 80, maxHp: 80, relics: [], encounterId: 'the-sleeper', modifiers: { awakeningStage: 5 }, memories }, CONTENT).state;

  it('opens by replaying the hardest move of each enemy you fought', () => {
    const e = sleeper(['hollow-sentinel', 'mirror-wraith']).enemies[0];
    expect(Object.keys(e.memoryMoves!).sort()).toEqual(['memory:hollow-sentinel', 'memory:mirror-wraith']);
    expect(e.memoryMoves!['memory:hollow-sentinel'].effects).toContainEqual({ kind: 'damage', amount: 8 });
    expect(e.intent.startsWith('memory:')).toBe(true);
  });

  it('with nothing to remember, it uses its own moves', () => {
    const e = sleeper([]).enemies[0];
    expect(e.memoryMoves).toBeUndefined();
    expect(e.intent).toBe('stir');
  });

  it('its dreams land on its own turn, two turns after it dreams, and can be blocked', () => {
    let s = sleeper();
    const e = s.enemies[0];
    e.phase = 0; // Dreaming
    e.intent = 'dream';
    e.history = [];
    s = step(s, { type: 'endTurn' }, CONTENT).state; // it dreams
    expect(s.timeline).toHaveLength(1);
    expect(s.timeline[0]).toMatchObject({ sourceId: e.id, label: 'Dream of Ruin', turnsLeft: 2 });
    s = step(s, { type: 'endTurn' }, CONTENT).state; // one of its turns passes
    expect(s.timeline[0].turnsLeft).toBe(1);
    s.player.ward = 50; // you saw it coming
    const res = step(s, { type: 'endTurn' }, CONTENT); // it lands
    expect(res.state.timeline).toHaveLength(0);
    expect(res.events).toContainEqual(expect.objectContaining({ type: 'delayFired', targetId: PLAYER_ID }));
    expect(res.events).toContainEqual(expect.objectContaining({ type: 'attack', targetId: PLAYER_ID, amount: 16, blocked: 16 }));
  });
});

describe('stages 4 and 5 in loops', () => {
  const runAt = (stage: number, seed: string, cycle = 1) => createRun({ seed, classId: 'relic-breaker', awakeningStage: stage, awakeningCycle: cycle }, CONTENT);
  const toBoss = (r: RunState) => {
    const before = Object.values(r.map.nodes).find((n) => reachableNodes(r.map, n.id).includes(r.map.bossId))!;
    return stepRun({ ...r, position: before.id }, { type: 'chooseNode', nodeId: r.map.bossId }, CONTENT).run;
  };

  it("The Sleeper's Breath only joins the rotation from stage 4", () => {
    const shifts = (stage: number) => new Set(Array.from({ length: 60 }, (_, i) => runAt(stage, `sh${i}`).vaultShiftId));
    expect(shifts(3).has('sleepers-breath')).toBe(false);
    expect(shifts(4).has('sleepers-breath')).toBe(true);
  });

  it('at stage 5 the Sleeper replaces the Lock, remembering the loop so far', () => {
    expect(toBoss(runAt(4, 'boss')).combat!.enemies[0].defId).toBe('grieving-lock');
    const fought = { ...runAt(5, 'boss'), seenEncounters: ['lone-sentinel', 'seraph'] };
    const boss = toBoss(fought).combat!.enemies[0];
    expect(boss.defId).toBe('the-sleeper');
    expect(Object.keys(boss.memoryMoves ?? {})).toEqual(expect.arrayContaining(['memory:hollow-sentinel', 'memory:rust-seraph']));
  });

  it('escaping at stage 4+ banks Shards', () => {
    const won = (stage: number) => {
      const r = toBoss(runAt(stage, 'esc'));
      return stepRun({ ...r, combat: { ...r.combat!, phase: 'won' as const } }, { type: 'leave' }, CONTENT).run;
    };
    expect(won(3)).toMatchObject({ result: 'victory', shardsFound: 0 });
    expect(won(4)).toMatchObject({ result: 'victory', shardsFound: A.escapeShards });
    // Unmaking the Sleeper pays its own 200 at the Outpost instead.
    expect(won(5)).toMatchObject({ result: 'victory', shardsFound: 0 });
  });

  it('each cycle after the first adds enemy HP, up to the cap', () => {
    const hp = (cycle: number) => combatModifiersFor(runAt(0, 'cyc', cycle), CONTENT).enemyHpMult;
    const shift = combatModifiersFor(runAt(0, 'cyc', 1), CONTENT).enemyHpMult; // the rolled Shift may add HP too
    expect(hp(2) / shift).toBeCloseTo(1 + A.cycleHpBonus);
    expect(hp(99) / shift).toBeCloseTo(1 + (A.cycleCap - 1) * A.cycleHpBonus);
  });
});

describe('Awake, and unmaking the Sleeper', () => {
  const awake = (patch: Partial<SaveData> = {}): SaveData =>
    addAwakening({ ...newSave(T0), outpost: { ...newSave(T0).outpost, shards: 999 }, ...patch }, A.thresholds[4], CONTENT);

  it('once Awake, Lull and Give are refused and progress cannot fall', () => {
    const e = echo();
    const s = awake({ echoes: [e] });
    expect(s.world.awakening.stage).toBe(5);
    expect(outpostStep(s, { type: 'lull' }, T0, CONTENT).error).toMatch(/awake/);
    expect(outpostStep(s, { type: 'giveEcho', echoId: e.id }, T0, CONTENT).error).toMatch(/awake/);
    expect(addAwakening(s, -50, CONTENT).world.awakening.progress).toBe(A.thresholds[4]);
  });

  it('unmaking it starts a new cycle, pays out, and every later loop starts with its Eye', () => {
    const run = endedRun('unmade', { result: 'victory', seenEncounters: ['lone-sentinel', 'the-sleeper'] });
    const closed = closeLoop({ ...awake(), run }, CONTENT, T0);
    expect(closed.world.awakening).toEqual({ stage: 0, progress: 0, cycle: 2, lullsThisStage: 0 });
    expect(closed.outpost.shards).toBe(999 + A.sleeperShards);
    expect(closed.outpost.unlocks).toContain('sleepers-eye');
    expect(closed.outpost.lore).toContain('lore-unmade');
    expect(closed.meta.history[0].unmadeSleeper).toBe(true);
    const next = nextRunPreview(closed, CONTENT)!;
    expect(next.relics).toContain('sleepers-eye');
    expect(next.awakeningCycle).toBe(2);
  });
});

describe('v8 → v9 (cycles)', () => {
  it('puts a loop in progress in cycle 1', () => {
    const run: Record<string, unknown> = { ...createRun({ seed: 'v9', classId: 'relic-breaker' }, CONTENT) };
    delete run.awakeningCycle;
    const m: Record<string, string> = { [SAVE_KEY]: JSON.stringify({ ...newSave(0), version: 8, run }) };
    const loaded = loadSave({ getItem: (k) => m[k] ?? null, setItem: (k, v) => void (m[k] = v) });
    expect(loaded).toMatchObject({ status: 'ok', migratedFrom: 8, save: { version: SAVE_VERSION, run: { awakeningCycle: 1 } } });
  });
});
