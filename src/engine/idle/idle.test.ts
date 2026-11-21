import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { CONTENT } from '../../data';
import { createRun, stepRun } from '../run/run';
import { newSave, type SaveData } from '../save/save';
import type { Echo, RunState } from '../types';
import { createEcho, hoursLeft, pickTrait } from './echoes';
import { advanceIdle, researchCost } from './idle';
import { closeLoop, prepareNextLoop } from './loop';
import { outpostStep, scoutInfo } from './outpost';

const HOUR = 3_600_000;
const I = BALANCE.idle;
const T0 = 1_000_000_000_000;

function endedRun(seed = 'loop', patch: Partial<RunState> = {}): RunState {
  const r = stepRun(createRun({ seed, classId: 'relic-breaker', vaultShiftId: 'still-vault' }, CONTENT), { type: 'abandon' }, CONTENT).run;
  return { ...r, ...patch };
}

function echo(task: Echo['task'] = null, patch: Partial<Echo> = {}): Echo {
  return { ...createEcho(endedRun(), 1, T0, CONTENT), traitId: 'faded', stability: 100, maxStability: 100, task, ...patch };
}

function saveWith(echoes: Echo[], patch: Partial<SaveData> = {}): SaveData {
  return { ...newSave(T0), echoes, ...patch };
}

const dig = { kind: 'dig' as const, startedAt: T0 };

describe('Echo creation', () => {
  it('is deterministic for a loop and records its deck and origin', () => {
    const run = endedRun('same');
    const a = createEcho(run, 3, T0, CONTENT);
    expect(createEcho(run, 3, T0, CONTENT)).toEqual(a);
    expect(a.deckSnapshot).toEqual(run.deck);
    expect(a.origin).toMatchObject({ loop: 3, result: 'death', vaultShiftId: 'still-vault' });
    expect(a.name).toMatch(/\S+ \S+/);
  });

  it('picks traits from how the loop went', () => {
    expect(pickTrait({ ...endedRun(), result: 'victory' }, CONTENT).id).toBe('unbroken');
    const corrupt = endedRun();
    corrupt.stats = { ...corrupt.stats, peakCorruption: 7 };
    expect(pickTrait(corrupt, CONTENT).id).toBe('ravenous');
    expect(pickTrait(endedRun(), CONTENT).id).toBe('fleeting'); // abandoned at depth 0
  });

  it('escaping and going deep make sturdier Echoes', () => {
    const shallow = createEcho(endedRun('s'), 1, T0, CONTENT);
    const escaped = createEcho({ ...endedRun('v'), result: 'victory', position: 'boss' }, 1, T0, CONTENT);
    expect(escaped.maxStability).toBeGreaterThan(shallow.maxStability * 2);
  });
});

describe('offline progress', () => {
  it('digging produces Shards by real elapsed time', () => {
    const { save, report } = advanceIdle(saveWith([echo(dig)]), T0 + 2 * HOUR, CONTENT);
    expect(Math.floor(save.outpost.shards)).toBe(2 * I.shardsPerHour);
    expect(report.shards).toBe(2 * I.shardsPerHour);
    expect(save.echoes[0].stability).toBeCloseTo(100 - 2 * BALANCE.echoes.drainPerHour.dig);
  });

  it('idle Echoes neither work nor fade', () => {
    const { save } = advanceIdle(saveWith([echo(null)]), T0 + 5 * HOUR, CONTENT);
    expect(save.outpost.shards).toBe(0);
    expect(save.echoes[0].stability).toBe(100);
  });

  it(`caps offline time at ${I.offlineCapHours} hours`, () => {
    const big = echo(dig, { stability: 10_000, maxStability: 10_000 });
    const { save, report } = advanceIdle(saveWith([big]), T0 + 30 * HOUR, CONTENT);
    expect(Math.floor(save.outpost.shards)).toBe(I.offlineCapHours * I.shardsPerHour);
    expect(report.capped).toBe(true);
    expect(save.idle.lastTickAt).toBe(T0 + 30 * HOUR);
  });

  it('a clock set backwards gives nothing and does not rewind', () => {
    const { save, report } = advanceIdle(saveWith([echo(dig)]), T0 - 5 * HOUR, CONTENT);
    expect(report.elapsedMs).toBe(0);
    expect(save.outpost.shards).toBe(0);
    expect(save.idle.lastTickAt).toBe(T0);
  });

  it('many small ticks equal one long absence', () => {
    let ticked = saveWith([echo(dig)]);
    for (let m = 1; m <= 180; m++) ticked = advanceIdle(ticked, T0 + m * 60_000, CONTENT).save;
    const once = advanceIdle(saveWith([echo(dig)]), T0 + 3 * HOUR, CONTENT).save;
    expect(ticked.outpost.shards).toBeCloseTo(once.outpost.shards, 6);
    expect(ticked.echoes[0].stability).toBeCloseTo(once.echoes[0].stability, 6);
  });

  it('an Echo Unravels exactly when its stability runs out, and stops producing', () => {
    const fragile = echo(dig, { stability: 20 });
    const hours = hoursLeft(fragile, 'dig', CONTENT);
    const { save, report } = advanceIdle(saveWith([fragile]), T0 + 6 * HOUR, CONTENT);
    expect(save.echoes).toHaveLength(0);
    expect(report.unraveled).toEqual([{ name: fragile.name, task: 'dig' }]);
    expect(save.outpost.shards).toBeCloseTo(hours * I.shardsPerHour);
  });

  it('traits change output and drain', () => {
    const ravenous = echo(dig, { traitId: 'ravenous' });
    const { save } = advanceIdle(saveWith([ravenous]), T0 + HOUR, CONTENT);
    expect(save.outpost.shards).toBeCloseTo(I.shardsPerHour * 1.5);
    expect(save.echoes[0].stability).toBeCloseTo(100 - BALANCE.echoes.drainPerHour.dig * 1.3);
  });
});

describe('research', () => {
  const research = { kind: 'research' as const, startedAt: T0 };

  it('unlocks the queue in order: cards join the pool, lore joins the archive', () => {
    const sturdy = echo(research, { stability: 10_000, maxStability: 10_000 });
    const hoursForTwo = (researchCost(0) + researchCost(1)) / I.researchPerHour;
    const { save, report } = advanceIdle(saveWith([sturdy]), T0 + hoursForTwo * HOUR, CONTENT);
    expect(save.outpost.research.completed).toBe(2);
    expect(save.outpost.cards).toEqual(['scar-tissue']);
    expect(save.outpost.lore).toEqual(['lore-first-door']);
    expect(report.researched.map((r) => r.kind)).toEqual(['card', 'lore']);
  });

  it('locked cards stay out of rewards until researched', () => {
    const plain = createRun({ seed: 'p', classId: 'relic-breaker' }, CONTENT);
    expect(plain.cardPool).not.toContain('scar-tissue');
    const learned = createRun({ seed: 'p', classId: 'relic-breaker', unlockedCards: ['scar-tissue'] }, CONTENT);
    expect(learned.cardPool).toContain('scar-tissue');
  });

  it('refuses Research once everything is known, and an assigned researcher stops fading', () => {
    const s = saveWith([echo(research)]);
    s.outpost.research.completed = CONTENT.idle.research.length;
    expect(advanceIdle(s, T0 + HOUR, CONTENT).save.echoes[0].stability).toBe(100);
    const other = saveWith([echo(null)], { outpost: s.outpost });
    expect(outpostStep(other, { type: 'assign', echoId: other.echoes[0].id, task: 'research' }, T0, CONTENT).error).toBeDefined();
  });
});

describe('scouting', () => {
  it('reveals the next Shift, then the first rows of the real next map', () => {
    const base = prepareNextLoop(saveWith([echo({ kind: 'scout', startedAt: T0 }, { stability: 1000, maxStability: 1000 })]), CONTENT);
    expect(scoutInfo(base, CONTENT)).toMatchObject({ shiftKnown: false, rows: [] });

    const half = advanceIdle(base, T0 + I.scoutShiftHours * HOUR, CONTENT);
    expect(half.report.scoutRevealed).toEqual(['shift']);
    expect(scoutInfo(half.save, CONTENT).shiftKnown).toBe(true);

    const full = advanceIdle(half.save, T0 + I.scoutMapHours * HOUR, CONTENT);
    const info = scoutInfo(full.save, CONTENT);
    expect(info.rows).toHaveLength(I.scoutMapRows);

    // The preview is the real map of the loop you will start.
    const started = outpostStep(full.save, { type: 'startLoop' }, T0 + I.scoutMapHours * HOUR, CONTENT).save;
    expect(started.run!.vaultShiftId).toBe(base.nextLoop!.vaultShiftId);
    expect(started.run!.map.nodes['r0c0'].type).toBe(info.rows[0][0].type);
    expect(started.outpost.scouting).toBe(0);
  });
});

describe('closing loops and Echo slots', () => {
  const closeWith = (s: SaveData, seed: string) => closeLoop({ ...s, run: endedRun(seed) }, CONTENT, T0);

  it('records the loop, leaves an Echo, and rolls the next loop', () => {
    const closed = closeWith(newSave(T0), 'a');
    expect(closed.run).toBeNull();
    expect(closed.meta).toEqual({ loops: 1, victories: 0, deaths: 1 });
    expect(closed.echoes).toHaveLength(1);
    expect(closed.nextLoop?.seed).toContain('loop2');
  });

  it('with full slots, the new Echo waits; keeping it replaces a chosen Echo', () => {
    let s = newSave(T0);
    for (const seed of ['a', 'b', 'c']) s = closeWith(s, seed);
    s = closeWith(s, 'd');
    expect(s.echoes).toHaveLength(BALANCE.echoes.slots);
    expect(s.pendingEcho?.id).toBe('echo-d');

    expect(outpostStep(s, { type: 'keepPending' }, T0, CONTENT).error).toBeDefined();
    const kept = outpostStep(s, { type: 'keepPending', replaceId: 'echo-b' }, T0, CONTENT).save;
    expect(kept.echoes.map((e) => e.id)).toEqual(['echo-a', 'echo-d', 'echo-c']);
    expect(kept.pendingEcho).toBeNull();
  });

  it('does nothing while the loop is still running', () => {
    const s = { ...newSave(T0), run: createRun({ seed: 'x', classId: 'relic-breaker' }, CONTENT) };
    expect(closeLoop(s, CONTENT, T0)).toBe(s);
  });
});

describe('Outpost actions', () => {
  it('buying needs enough Shards and only works once', () => {
    const poor = newSave(T0);
    expect(outpostStep(poor, { type: 'buy', unlockId: 'second-sight' }, T0, CONTENT).error).toMatch(/Shards/);
    const rich = { ...poor, outpost: { ...poor.outpost, shards: 75.9 } };
    const bought = outpostStep(rich, { type: 'buy', unlockId: 'second-sight' }, T0, CONTENT).save;
    expect(bought.outpost.unlocks).toEqual(['second-sight']);
    expect(bought.outpost.shards).toBeCloseTo(5.9);
    expect(outpostStep(bought, { type: 'buy', unlockId: 'second-sight' }, T0, CONTENT).error).toBeDefined();
  });

  it('changing a task first banks the old task’s progress', () => {
    const s = saveWith([echo(dig)]);
    const res = outpostStep(s, { type: 'assign', echoId: s.echoes[0].id, task: 'scout' }, T0 + HOUR, CONTENT);
    expect(Math.floor(res.save.outpost.shards)).toBe(I.shardsPerHour);
    expect(res.save.echoes[0].task).toEqual({ kind: 'scout', startedAt: T0 + HOUR });
  });

  it('kits need their unlock; unlocked options carry into the loop', () => {
    const s = newSave(T0);
    expect(outpostStep(s, { type: 'selectKit', kitId: 'bastion' }, T0, CONTENT).error).toBeDefined();
    const owned = { ...s, outpost: { ...s.outpost, unlocks: ['kit-bastion', 'reliquary-key', 'shrine-of-ash', 'second-sight'] } };
    const picked = outpostStep(owned, { type: 'selectKit', kitId: 'bastion' }, T0, CONTENT).save;
    const run = outpostStep(picked, { type: 'startLoop' }, T0, CONTENT).save.run!;
    expect(run.deck).toContain('bulwark-slam');
    expect(run.options).toEqual({ shrinePurge: true, cacheChoices: BALANCE.outpost.keyCacheChoices, rewardRerolls: 1 });
  });

  it('the Shift Bell rerolls the next Shift once, to a different one', () => {
    const s = prepareNextLoop({ ...newSave(T0), outpost: { ...newSave(T0).outpost, unlocks: ['shift-bell'] } }, CONTENT);
    const rung = outpostStep(s, { type: 'ringBell' }, T0, CONTENT).save;
    expect(rung.nextLoop!.vaultShiftId).not.toBe(s.nextLoop!.vaultShiftId);
    expect(outpostStep(rung, { type: 'ringBell' }, T0, CONTENT).error).toBeDefined();
  });
});

describe('Outpost options inside a loop', () => {
  it('Second Sight rerolls one reward; Shrine of Ash purges Corruption', () => {
    const r = createRun({ seed: 'opt', classId: 'relic-breaker', vaultShiftId: 'still-vault', options: { rewardRerolls: 1, shrinePurge: true } }, CONTENT);
    const fight = structuredClone(r);
    const id = fight.map.startIds[0];
    const inFight = stepRun(fight, { type: 'chooseNode', nodeId: id }, CONTENT).run;
    inFight.combat!.phase = 'won';
    const reward = stepRun(inFight, { type: 'leave' }, CONTENT).run;
    const rerolled = stepRun(reward, { type: 'rerollReward' }, CONTENT).run;
    expect(rerolled.options.rewardRerolls).toBe(0);
    expect(stepRun(rerolled, { type: 'rerollReward' }, CONTENT).error).toBeDefined();

    const atShrine = structuredClone({ ...r, corruption: 4 });
    atShrine.map.nodes[id].type = 'shrine';
    const shrine = stepRun(atShrine, { type: 'chooseNode', nodeId: id }, CONTENT).run;
    expect(stepRun(shrine, { type: 'shrinePurge' }, CONTENT).run.corruption).toBe(4 - BALANCE.outpost.purgeAmount);
  });
});
