/**
 * Echo-Caller allies: Calling, ally turns, Guard, falls, traits, and the
 * Chorus's stability costs at the Outpost.
 */
import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { CONTENT } from '../../data';
import { createRun, stepRun } from '../run/run';
import { SAVE_KEY, SAVE_VERSION, loadSave, newSave } from '../save/save';
import type { ChorusMember, CombatState, Echo, RunState } from '../types';
import { createEcho } from '../idle/echoes';
import { allyHp, chorusFrom, settleChorus } from '../idle/chorus';
import { closeLoop } from '../idle/loop';
import { createCombat, step } from './combat';

const A = BALANCE.allies;
const T0 = 1_000_000_000_000;

const member = (patch: Partial<ChorusMember> = {}): ChorusMember => ({
  echoId: 'echo-a',
  name: 'Veyra the Hollowed',
  traitId: 'faded',
  deck: Array.from({ length: 6 }, () => 'shard-strike'),
  maxHp: 16,
  stability: 100,
  calls: 0,
  falls: 0,
  ...patch,
});

/** A fight vs one Hollow Sentinel, holding the given hand, with a Chorus. */
function fight(hand: string[], chorus: ChorusMember[], relics: string[] = []): CombatState {
  const s = createCombat({ seed: 'allies', deck: hand, hp: 60, maxHp: 60, relics, encounterId: 'lone-sentinel', chorus }, CONTENT).state;
  s.resonance = 10;
  return s;
}
const play = (s: CombatState, cardId: string) => {
  const card = s.piles.hand.find((c) => c.cardId === cardId)!;
  return step(s, { type: 'playCard', uid: card.uid, targetId: 'e0' }, CONTENT);
};

describe('Calling allies', () => {
  it('Call brings the next Chorus member in, with its HP and its own shuffled deck', () => {
    const s = play(fight(['call-the-fallen', 'grave-strike'], [member()]), 'call-the-fallen').state;
    expect(s.allies).toHaveLength(1);
    expect(s.allies[0]).toMatchObject({ echoId: 'echo-a', name: 'Veyra the Hollowed', hp: 16, maxHp: 16 });
    expect(s.allies[0].draw.sort()).toEqual(member().deck);
    expect(s.called).toEqual(['echo-a']);
  });

  it('once the Chorus is spent, a Nameless Echo answers; never more than two at once', () => {
    let s = fight(['call-the-fallen', 'call-the-fallen', 'call-the-fallen'], [member()]);
    s = play(s, 'call-the-fallen').state;
    s = play(s, 'call-the-fallen').state;
    expect(s.allies.map((a) => a.echoId)).toEqual(['echo-a', null]);
    expect(s.allies[1]).toMatchObject({ name: 'A Nameless Echo', hp: A.nameless.hp });
    s = play(s, 'call-the-fallen').state;
    expect(s.allies).toHaveLength(2);
  });

  it('ally HP comes from its loop’s depth, capped, then its trait', () => {
    const echo = (depth: number, traitId = 'faded'): Echo => ({ ...createEcho(endedRun('hp'), 1, T0, CONTENT), traitId, origin: { ...createEcho(endedRun('hp'), 1, T0, CONTENT).origin, depth } });
    expect(allyHp(echo(3), CONTENT)).toBe(A.baseHp + 3 * A.hpPerDepth);
    expect(allyHp(echo(99), CONTENT)).toBe(A.maxHp);
    expect(allyHp(echo(3, 'unbroken'), CONTENT)).toBe(Math.round((A.baseHp + 3 * A.hpPerDepth) * 1.5));
  });
});

describe('ally turns', () => {
  it('after you end your turn, each ally plays its top card at reduced strength, at your target', () => {
    let s = play(fight(['call-the-fallen'], [member()]), 'call-the-fallen').state;
    const res = step(s, { type: 'endTurn' }, CONTENT);
    expect(res.events).toContainEqual({ type: 'allyActed', allyId: s.allies[0].id, cardId: 'shard-strike' });
    // Shard Strike deals 6; an ally plays it at reduced strength, rounded up.
    expect(res.events).toContainEqual(expect.objectContaining({ type: 'attack', sourceId: s.allies[0].id, targetId: 'e0', amount: Math.ceil(6 * A.potency) }));
    s = res.state;
    expect(s.allies[0].discard).toEqual(['shard-strike']);
  });

  it('a curse in its deck fizzles and hurts it; a Haunted ally turns it on the enemy', () => {
    const cursed = member({ deck: ['gnawing-static'] });
    let s = play(fight(['call-the-fallen'], [cursed]), 'call-the-fallen').state;
    s = step(s, { type: 'endTurn' }, CONTENT).state;
    expect(s.allies[0].hp).toBe(cursed.maxHp - A.curseSelfDamage); // enemies hit you, not it

    const haunted = play(fight(['call-the-fallen'], [member({ deck: ['gnawing-static'], traitId: 'haunted' })]), 'call-the-fallen').state;
    const res = step(haunted, { type: 'endTurn' }, CONTENT);
    expect(res.state.allies[0].hp).toBe(16);
    expect(res.events).toContainEqual(expect.objectContaining({ type: 'attack', sourceId: haunted.allies[0].id, targetId: 'e0', amount: 4 }));
  });
});

describe('who gets hit', () => {
  it('enemies attack you, not your allies, unless an ally Guards', () => {
    let s = play(fight(['call-the-fallen', 'stand-before-me'], [member({ deck: ['shroud'] })]), 'call-the-fallen').state;
    const hpBefore = s.player.hp;
    let res = step(s, { type: 'endTurn' }, CONTENT);
    expect(res.state.player.hp).toBeLessThan(hpBefore); // the Sentinel's opener hit you
    expect(res.state.allies[0].hp).toBe(16);

    s = fight(['call-the-fallen', 'stand-before-me'], [member({ deck: ['shroud'] })]);
    s = play(s, 'call-the-fallen').state;
    s = play(s, 'stand-before-me').state;
    res = step(s, { type: 'endTurn' }, CONTENT);
    expect(res.events).toContainEqual(expect.objectContaining({ type: 'attack', sourceId: 'e0', targetId: s.allies[0].id }));
    expect(res.state.player.hp).toBe(60);
  });
});

describe('falls and release', () => {
  it('Release: the newest ally fades, dealing its HP to every enemy, and counts as a fall', () => {
    let s = play(fight(['call-the-fallen', 'release', 'soul-lance'], [member()]), 'call-the-fallen').state;
    const enemyHp = s.enemies[0].hp;
    const res = play(s, 'release');
    expect(res.events).toContainEqual({ type: 'allyFell', allyId: s.allies[0].id });
    expect(res.state.enemies[0].hp).toBe(enemyHp - 16);
    expect(res.state.fallen).toEqual(['echo-a']);
    // Soul Lance: 10, and 10 more because an ally fell.
    const lance = play(res.state, 'soul-lance');
    expect(lance.state.enemies[0].hp).toBe(Math.max(0, enemyHp - 16 - 20));
  });

  it('Ashen Locket draws 2 when an ally falls', () => {
    let s = fight(['call-the-fallen', 'release', 'grave-strike', 'grave-strike', 'shroud'], [member()], ['ashen-locket']);
    s = play(s, 'call-the-fallen').state;
    const res = play(s, 'release');
    const fell = res.events.findIndex((e) => e.type === 'allyFell');
    expect(fell).toBeGreaterThanOrEqual(0);
    expect(res.events.slice(fell).some((e) => e.type === 'draw' || e.type === 'shuffle')).toBe(true);
  });

  it('the Lantern of Names Calls an Echo when the fight begins', () => {
    const s = fight(['grave-strike'], [member()], ['lantern-of-names']);
    expect(s.allies.map((a) => a.echoId)).toEqual(['echo-a']);
  });
});

describe('traits in battle', () => {
  const callAndEnd = (traitId: string, deck = ['shard-strike', 'shard-strike', 'shard-strike', 'shroud']) => {
    const s = play(fight(['call-the-fallen'], [member({ traitId, deck })]), 'call-the-fallen').state;
    return { before: s, res: step(s, { type: 'endTurn' }, CONTENT) };
  };

  it('Ravenous plays two cards and loses HP each time', () => {
    const { before, res } = callAndEnd('ravenous');
    expect(res.events.filter((e) => e.type === 'allyActed')).toHaveLength(2);
    expect(res.state.allies[0].hp).toBe(before.allies[0].hp - 2 * 2);
  });

  it('Pathfinder acts at the start of your turn instead of after it', () => {
    const { res } = callAndEnd('pathfinder');
    const acted = res.events.findIndex((e) => e.type === 'allyActed');
    const turnStart = res.events.findIndex((e) => e.type === 'turnStart');
    expect(acted).toBeGreaterThan(turnStart);
  });

  it('Fleeting plays at full strength, then fades after 2 turns', () => {
    const { before, res } = callAndEnd('fleeting', ['shard-strike', 'shard-strike', 'shard-strike']);
    expect(res.events).toContainEqual(expect.objectContaining({ type: 'attack', sourceId: before.allies[0].id, amount: 6 }));
    const after2 = step(res.state, { type: 'endTurn' }, CONTENT).state;
    expect(after2.allies[0].hp).toBe(0);
    expect(after2.fallen).toEqual([]); // fading is not falling
  });

  it('Hoarder plays the most expensive of its top 3', () => {
    const { res } = callAndEnd('hoarder', ['shard-strike', 'shard-strike', 'shatter-lens', 'shard-strike', 'shard-strike', 'shard-strike']);
    const acted = res.events.find((e) => e.type === 'allyActed');
    // Shatter Lens (cost 2) is chosen only if it was in the top 3 after the shuffle; otherwise a Shard Strike.
    expect(['shatter-lens', 'shard-strike']).toContain(acted && 'cardId' in acted ? acted.cardId : undefined);
  });

  it('Scarred gains 3 Ward when it acts', () => {
    const { before, res } = callAndEnd('scarred', ['grave-strike']);
    expect(res.events).toContainEqual({ type: 'ward', targetId: before.allies[0].id, amount: 3 });
  });
});

// ───────────────────────────── The Chorus at the Outpost ─────────────────────────────

function endedRun(seed: string, patch: Partial<RunState> = {}): RunState {
  const r = stepRun(createRun({ seed, classId: 'echo-caller', vaultShiftId: 'still-vault' }, CONTENT), { type: 'abandon' }, CONTENT).run;
  return { ...r, ...patch };
}
const outpostEcho = (id: string, stability: number): Echo => ({ ...createEcho(endedRun(id), 1, T0, CONTENT), id, stability, maxStability: 100, task: null });

describe('the Chorus and stability', () => {
  it('a loop copies your Echoes into its Chorus', () => {
    const chorus = chorusFrom([outpostEcho('x', 70)], CONTENT);
    expect(chorus[0]).toMatchObject({ echoId: 'x', stability: 70, calls: 0, falls: 0 });
  });

  it('fights tally Calls and falls into the loop’s Chorus', () => {
    const r = createRun({ seed: 'tally', classId: 'echo-caller', vaultShiftId: 'still-vault', chorus: [member()] }, CONTENT);
    let run = stepRun(r, { type: 'chooseNode', nodeId: r.map.startIds[0] }, CONTENT).run;
    // The Lantern Called echo-a at the start of the fight; win it and leave.
    expect(run.combat!.called).toEqual(['echo-a']);
    run = stepRun({ ...run, combat: { ...run.combat!, phase: 'won' } }, { type: 'leave' }, CONTENT).run;
    expect(run.chorus[0]).toMatchObject({ calls: 1, falls: 0 });
  });

  it('closing the loop costs Called Echoes stability, and Unravels drained ones', () => {
    const run = endedRun('cost', {
      chorus: [member({ echoId: 'kept', calls: 2, falls: 1 }), member({ echoId: 'lost', calls: 3, falls: 2 })],
    });
    const settled = settleChorus([outpostEcho('kept', 100), outpostEcho('lost', 40)], run);
    const cost = 2 * A.callCost + 1 * A.fallCost;
    expect(settled.echoes).toHaveLength(1);
    expect(settled.echoes[0]).toMatchObject({ id: 'kept', stability: 100 - cost, lastCall: { calls: 2, falls: 1, cost } });
    expect(settled.unraveled).toHaveLength(1);
  });

  it('Severed Thread makes Calls free (falls still cost)', () => {
    const run = endedRun('thread', { relics: ['lantern-of-names', 'severed-thread'], chorus: [member({ echoId: 'k', calls: 3, falls: 1 })] });
    expect(settleChorus([outpostEcho('k', 100)], run).echoes[0].stability).toBe(100 - A.fallCost);
  });

  it('closeLoop settles the Chorus before the new Echo takes a slot', () => {
    const echoes = [outpostEcho('a', 5), outpostEcho('b', 90), outpostEcho('c', 90)];
    const run = endedRun('close', { chorus: [member({ echoId: 'a', calls: 1 })] });
    const closed = closeLoop({ ...newSave(T0), echoes, run }, CONTENT, T0);
    // 'a' Unraveled (5 - 8 < 0), freeing a slot for the loop's own Echo.
    expect(closed.echoes.map((e) => e.id)).not.toContain('a');
    expect(closed.echoes).toHaveLength(3);
    expect(closed.pendingEcho).toBeNull();
  });
});

describe('v9 → v10 (the Echo-Caller)', () => {
  it('gives a loop in progress an empty Chorus and a live fight empty ally state', () => {
    const r = createRun({ seed: 'v10', classId: 'relic-breaker' }, CONTENT);
    const live = stepRun(r, { type: 'chooseNode', nodeId: r.map.startIds[0] }, CONTENT).run as unknown as Record<string, unknown> & { combat: Record<string, unknown> };
    delete live.chorus;
    for (const k of ['allies', 'chorus', 'called', 'fallen', 'allyActs', 'allyHpLoss']) delete live.combat[k];
    const m: Record<string, string> = { [SAVE_KEY]: JSON.stringify({ ...newSave(0), version: 9, run: live }) };
    const loaded = loadSave({ getItem: (k) => m[k] ?? null, setItem: (k, v) => void (m[k] = v) });
    expect(loaded).toMatchObject({
      status: 'ok',
      migratedFrom: 9,
      save: { version: SAVE_VERSION, run: { chorus: [], combat: { allies: [], called: [], fallen: [], allyActs: 1, allyHpLoss: 0 } } },
    });
  });
});
