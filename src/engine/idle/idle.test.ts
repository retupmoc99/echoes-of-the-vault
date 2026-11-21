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

  it('resting Echoes neither work nor fade', () => {
    const { save } = advanceIdle(saveWith([echo(null)]), T0 + 5 * HOUR, CONTENT);
    expect(save.outpost.shards).toBe(0);
    expect(save.echoes[0].stability).toBe(100);
  });

  it('resting Echoes recover stability, but only up to half their starting stability', () => {
    const worn = echo(null, { stability: 20 });
    const after3h = advanceIdle(saveWith([worn]), T0 + 3 * HOUR, CONTENT).save;
    expect(after3h.echoes[0].stability).toBeCloseTo(20 + 3 * I.restRecoveryPerHour);
    // Many long breaks still stop at the cap.
    let s = saveWith([worn]);
    for (let day = 1; day <= 10; day++) s = advanceIdle(s, T0 + day * 24 * HOUR, CONTENT).save;
    expect(s.echoes[0].stability).toBe(100 * I.restRecoveryCap);
    // Working Echoes don't recover; Echoes above the cap aren't pulled down.
    expect(advanceIdle(saveWith([echo(null, { stability: 80 })]), T0 + 5 * HOUR, CONTENT).save.echoes[0].stability).toBe(80);
  });

  it('recovery in small ticks matches one long absence', () => {
    let ticked = saveWith([echo(null, { stability: 10 })]);
    for (let m = 15; m <= 4 * 60; m += 15) ticked = advanceIdle(ticked, T0 + m * 60_000, CONTENT).save;
    const once = advanceIdle(saveWith([echo(null, { stability: 10 })]), T0 + 4 * HOUR, CONTENT).save;
    expect(ticked.echoes[0].stability).toBeCloseTo(once.echoes[0].stability);
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
    expect(closed.meta).toMatchObject({ loops: 1, victories: 0, deaths: 1 });
    expect(closed.echoes).toHaveLength(1);
    expect(closed.nextLoop?.seed).toContain('loop2');
  });

  it('adds the loop to history, newest first, with its Echo and final deck', () => {
    const closed = closeWith(newSave(T0), 'a');
    const [rec] = closed.meta.history;
    expect(rec).toMatchObject({
      loop: 1,
      endedAt: T0,
      result: 'death',
      classId: 'relic-breaker',
      echoName: closed.echoes[0].name,
      echoTraitId: closed.echoes[0].traitId,
      deck: closed.echoes[0].deckSnapshot,
    });
    expect(closeWith(closed, 'b').meta.history.map((r) => r.loop)).toEqual([2, 1]);
  });

  it(`keeps only the last ${BALANCE.history.limit} loops in history`, () => {
    let s = newSave(T0);
    for (let i = 0; i < BALANCE.history.limit + 3; i++) s = closeWith(s, `h${i}`);
    expect(s.meta.history).toHaveLength(BALANCE.history.limit);
    expect(s.meta.history[0].loop).toBe(BALANCE.history.limit + 3);
    expect(s.meta.loops).toBe(BALANCE.history.limit + 3);
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

  it('a Warden’s kit works stay locked until that Warden is built', () => {
    const rich = { ...newSave(T0), outpost: { ...newSave(T0).outpost, shards: 500 } };
    expect(outpostStep(rich, { type: 'buy', unlockId: 'kit-fuse-setter' }, T0, CONTENT).error).toMatch(/not yet/i);
    const withThief = outpostStep(rich, { type: 'buy', unlockId: 'stolen-hour' }, T0, CONTENT).save;
    const bought = outpostStep(withThief, { type: 'buy', unlockId: 'kit-fuse-setter' }, T0, CONTENT).save;
    expect(bought.outpost.unlocks).toContain('kit-fuse-setter');
    const thief = outpostStep(bought, { type: 'selectClass', classId: 'hour-thief' }, T0, CONTENT).save;
    expect(outpostStep(thief, { type: 'selectKit', kitId: 'afterimage' }, T0, CONTENT).error).toBeDefined();
    const picked = outpostStep(thief, { type: 'selectKit', kitId: 'fuse-setter' }, T0, CONTENT).save;
    const run = outpostStep(picked, { type: 'startLoop' }, T0, CONTENT).save.run!;
    expect(run.deck).toContain('patient-blade');
    expect(run.deck).toContain('accelerate');
  });

  it('every kit is a 10-card deck of its own class’s cards, with a matching work', () => {
    const workIds = CONTENT.idle.unlocks.map((u) => u.id);
    for (const cls of Object.values(CONTENT.classes)) {
      const own = new Set([...cls.starterDeck, ...cls.cardPool]);
      for (const kit of cls.kits) {
        expect(kit.deck, kit.id).toHaveLength(10);
        for (const id of kit.deck) expect(own.has(id), `${kit.id}: ${id}`).toBe(true);
        for (const id of kit.deck) expect(cls.lockedCards, `${kit.id}: ${id} is research-locked`).not.toContain(id);
        if (kit.unlock) expect(workIds, kit.id).toContain(kit.unlock);
      }
    }
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

describe('Warden classes', () => {
  it('the Hour-Thief needs The Stolen Hour; then the next loop is an Hour-Thief loop', () => {
    const s = newSave(T0);
    expect(outpostStep(s, { type: 'selectClass', classId: 'hour-thief' }, T0, CONTENT).error).toMatch(/not yet yours/);

    const owned = { ...s, outpost: { ...s.outpost, unlocks: ['stolen-hour'] } };
    const picked = outpostStep(owned, { type: 'selectClass', classId: 'hour-thief' }, T0, CONTENT).save;
    expect(picked.outpost).toMatchObject({ classId: 'hour-thief', kitId: 'hour-standard' });

    const run = outpostStep(picked, { type: 'startLoop' }, T0, CONTENT).save.run!;
    expect(run.classId).toBe('hour-thief');
    expect(run.relics).toEqual(['cracked-hourglass']);
    expect(run.deck).toContain('slow-fuse');
    expect(run.maxHp).toBe(BALANCE.player.hourThiefMaxHp);
    expect(run.cardPool.every((id) => CONTENT.classes['hour-thief'].cardPool.includes(id))).toBe(true);
    expect(run.cardPool).not.toContain('hour-bomb'); // locked until researched
  });

  it('switching class does not change the scouted map', () => {
    const base = prepareNextLoop({ ...newSave(T0), outpost: { ...newSave(T0).outpost, unlocks: ['stolen-hour'] } }, CONTENT);
    const rb = outpostStep(base, { type: 'startLoop' }, T0, CONTENT).save.run!;
    const switched = outpostStep(base, { type: 'selectClass', classId: 'hour-thief' }, T0, CONTENT).save;
    const ht = outpostStep(switched, { type: 'startLoop' }, T0, CONTENT).save.run!;
    expect(ht.map).toEqual(rb.map);
    expect(ht.vaultShiftId).toBe(rb.vaultShiftId);
  });

  it('Echoes remember which Warden ran their loop', () => {
    const run = { ...endedRun('cls'), classId: 'hour-thief' };
    expect(createEcho(run, 1, T0, CONTENT).origin.classId).toBe('hour-thief');
  });

  it('a whole Hour-Thief loop can be played to an ending', () => {
    let r = createRun({ seed: 'ht-full', classId: 'hour-thief' }, CONTENT);
    for (let i = 0; i < 5000 && r.phase !== 'ended'; i++) {
      const n = r.node;
      let action: Parameters<typeof stepRun>[1];
      if (r.phase === 'map') action = { type: 'chooseNode', nodeId: r.position ? r.map.nodes[r.position].next[0] : r.map.startIds[0] };
      else if (n?.kind === 'combat') {
        const c = r.combat!;
        const card = c.phase === 'player' ? c.piles.hand.find((h) => CONTENT.cards[h.cardId].cost <= c.resonance && !CONTENT.cards[h.cardId].unplayable) : undefined;
        action = c.phase !== 'player' ? { type: 'leave' } : { type: 'combat', action: card ? { type: 'playCard', uid: card.uid } : { type: 'endTurn' } };
      } else if (n?.kind === 'shrine') action = { type: 'shrineRest' };
      else if (n?.kind === 'reward') action = n.cardTaken ? { type: 'leave' } : { type: 'pickCard', choice: 0 };
      else if (n?.kind === 'event' && !n.resolved) action = { type: 'chooseOption', index: CONTENT.events[n.eventId].options.length - 1 };
      else action = { type: 'leave' };
      const res = stepRun(r, action, CONTENT);
      if (res.error) throw new Error(`${res.error} on ${JSON.stringify(action)}`);
      r = res.run;
    }
    expect(r.phase).toBe('ended');
  });
});
