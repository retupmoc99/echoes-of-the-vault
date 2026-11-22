import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../data';
import { BALANCE } from '../../data/balance';
import { createCombat, step } from '../combat/combat';
import { closeLoop, nextRunPreview, prepareNextLoop } from '../idle/loop';
import { loopDepth, pickTrait } from '../idle/echoes';
import { newSave } from '../save/save';
import type { RunAction, RunState } from '../types';
import { createRun, stepRun } from './run';

const go = (run: RunState, action: RunAction) => {
  const res = stepRun(run, action, CONTENT);
  if (res.error) throw new Error(res.error);
  return res.run;
};

/** A run standing in a won fight against the floor's boss. */
function atBossWin(stairs: boolean, patch: Partial<RunState> = {}): RunState {
  const r = structuredClone({ ...createRun({ seed: 'deep', classId: 'relic-breaker', options: { stairs } }, CONTENT), ...patch });
  const bossId = r.map.bossId;
  r.position = bossId;
  r.visited.push(bossId);
  r.phase = 'node';
  const encounterId = r.floor > 1 ? 'deep-well' : 'grieving-lock';
  r.node = { kind: 'combat', nodeId: bossId, encounterId, hpBefore: r.hp };
  r.combat = createCombat({ seed: 'x', deck: r.deck, hp: r.hp, maxHp: r.maxHp, relics: [], encounterId }, CONTENT).state;
  r.combat.phase = 'won';
  return r;
}

describe('the Deeper Vault', () => {
  it('without the stairs option, the boss ends the loop as before', () => {
    expect(go(atBossWin(false), { type: 'leave' }).phase).toBe('ended');
  });

  it('with it, the boss leads to the stairs; Escape banks the held bonus and wins', () => {
    const stairs = go(atBossWin(true, { awakeningStage: 4 }), { type: 'leave' });
    expect(stairs.phase).toBe('stairs');
    expect(stairs.heldShards).toBe(BALANCE.awakening.escapeShards);
    expect(stairs.shardsFound).toBe(0);
    const out = go(stairs, { type: 'escape' });
    expect(out.result).toBe('victory');
    expect(out.shardsFound).toBe(BALANCE.awakening.escapeShards);
  });

  it('Descend: a 6-row floor 2, healing, depth carried on, only floor-2 enemies', () => {
    const stairs = go(atBossWin(true, { hp: 20 }), { type: 'leave' });
    const deep = go(stairs, { type: 'descend' });
    expect(deep.floor).toBe(2);
    expect(deep.phase).toBe('map');
    expect(deep.map.nodes[deep.map.bossId].row).toBe(BALANCE.deep.rows);
    expect(deep.hp).toBe(20 + Math.round(deep.maxHp * BALANCE.deep.stairsHeal));
    const fight = go(deep, { type: 'chooseNode', nodeId: deep.map.startIds[0] });
    expect(CONTENT.encounters[(fight.node as { encounterId: string }).encounterId].floor).toBe(2);
    expect(loopDepth(fight)).toBe(stairs.map.nodes[stairs.map.bossId].row + 1 + 1);
    expect(fight.combat!.modifiers.weightDamage).toBe(BALANCE.deep.weightDamage);
  });

  it('escaping floor 2 doubles the held bonus; dying there keeps half', () => {
    const deep = go(go(atBossWin(true, { awakeningStage: 4 }), { type: 'leave' }), { type: 'descend' });
    const won = go(atBossWin(true, { ...deep }), { type: 'leave' });
    expect(won.result).toBe('victory');
    expect(won.stats.deepBossWon).toBe(true);
    expect(won.shardsFound).toBe(BALANCE.awakening.escapeShards * 2 + BALANCE.deep.escapeShards);
    const died = go(deep, { type: 'abandon' });
    expect(died.shardsFound).toBe(BALANCE.awakening.escapeShards / 2);
  });

  it('unmaking the Sleeper counts even if the loop then dies on floor 2', () => {
    const r = atBossWin(true, { awakeningStage: 5 });
    (r.node as { encounterId: string }).encounterId = 'the-sleeper';
    const died = go(go(go(r, { type: 'leave' }), { type: 'descend' }), { type: 'abandon' });
    const save = { ...newSave(0), run: died, world: { ...newSave(0).world, awakening: { stage: 5, progress: 100, cycle: 1, lullsThisStage: 0 } } };
    const closed = closeLoop(save, CONTENT, 1000);
    expect(closed.world.awakening.cycle).toBe(2);
    expect(closed.meta.history[0]).toMatchObject({ unmadeSleeper: true, floor: 2 });
  });

  it('Echoes from floor 2 are Deepborn and steadier', () => {
    const deep = go(go(atBossWin(true), { type: 'leave' }), { type: 'descend' });
    expect(pickTrait({ ...deep, result: 'death', phase: 'ended' }, CONTENT).id).toBe('deepborn');
  });

  it('a floor-2 loop stirs the Sleeper a little more', () => {
    const deep = go(go(go(atBossWin(true), { type: 'leave' }), { type: 'descend' }), { type: 'abandon' });
    const shallow = go(atBossWin(false), { type: 'abandon' });
    const progress = (run: RunState) => closeLoop({ ...newSave(0), run }, CONTENT, 1).world.awakening.progress;
    expect(progress(deep) - progress(shallow)).toBe(BALANCE.deep.awakeningBonus);
  });
});

describe("the Well's relics", () => {
  it("the first escape from floor 2 adds each Warden's Well relic to its pool", () => {
    const deep = go(go(atBossWin(true), { type: 'leave' }), { type: 'descend' });
    const won = go(atBossWin(true, { ...deep }), { type: 'leave' });
    const closed = closeLoop({ ...newSave(0), run: won }, CONTENT, 1);
    expect(closed.outpost.unlocks).toContain('the-well');
    expect(closed.meta.deepEscapes).toBe(1);
    const next = nextRunPreview(prepareNextLoop(closed, CONTENT), CONTENT)!;
    expect(next.extraRelicPool).toEqual(['drowned-crown']);
    const before = nextRunPreview(prepareNextLoop(newSave(0), CONTENT), CONTENT)!;
    expect(before.extraRelicPool).toBeUndefined();
  });
});

describe('floor-2 enemy rules', () => {
  const fight = (encounterId: string, mods = {}) =>
    createCombat({ seed: 'e', deck: Array(10).fill('shard-strike'), hp: 70, maxHp: 70, relics: [], encounterId, modifiers: mods }, CONTENT).state;

  it('The Weight hits only when the enemies broke through all your Ward', () => {
    const s = fight('deep-gnawing', { weightDamage: 1 });
    s.player.ward = 0;
    const after = step(s, { type: 'endTurn' }, CONTENT);
    expect(after.events.some((e) => e.type === 'hpLoss' && e.cause === 'weight')).toBe(true);
    const warded = structuredClone(s);
    warded.player.ward = 99;
    expect(step(warded, { type: 'endTurn' }, CONTENT).events.some((e) => e.type === 'hpLoss' && e.cause === 'weight')).toBe(false);
  });

  it('a Hollow Pilgrim mourns its kin: Ward and harder hits', () => {
    const s = fight('deep-pilgrims');
    s.enemies[0].hp = 1;
    const uid = s.piles.hand[0].uid;
    const after = step(s, { type: 'playCard', uid, targetId: 'e0' }, CONTENT).state;
    expect(after.enemies[0].hp).toBe(0);
    expect(after.enemies[1].ward).toBe(5);
    expect(after.enemies[1].damageBonus).toBe(2);
  });

  it('Rot Lantern puts Smoke in your discard pile', () => {
    let s = fight('deep-lantern');
    s.enemies[0].intent = 'smoke';
    s = step(s, { type: 'endTurn' }, CONTENT).state;
    const all = [...s.piles.draw, ...s.piles.hand, ...s.piles.discard];
    expect(all.filter((c) => c.cardId === 'smoke')).toHaveLength(2);
  });
});
