import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../data';
import { createRun, stepRun } from '../run/run';
import { createCombat, step } from './combat';
import type { CombatSetup, CombatState, RunState } from '../types';

function fight(hand: string[], extra: Partial<CombatSetup> = {}, encounterId = 'lone-sentinel'): CombatState {
  const s = createCombat({ seed: 'w5', deck: Array(10).fill('bitter-strike'), hp: 60, maxHp: 60, relics: [], encounterId, ...extra }, CONTENT).state;
  s.piles.hand = hand.map((cardId, i) => ({ uid: `h${i}`, cardId }));
  s.resonance = 10;
  s.enemies[0].hp = 200;
  s.enemies[0].maxHp = 200;
  s.enemies[0].ward = 0;
  return s;
}
const play = (s: CombatState, uid: string, targetId = 'e0') => step(s, { type: 'playCard', uid, targetId }, CONTENT);

describe('Sin-Eater: Devour', () => {
  it('eats the leftmost curse for the bonus, for this fight only', () => {
    let s = fight(['swallow', 'gnawing-static']);
    s = play(s, 'h0').state;
    expect(200 - s.enemies[0].hp).toBe(6 + 10);
    expect(s.piles.hand.some((c) => c.cardId === 'gnawing-static')).toBe(false);
    expect(s.piles.faded.some((c) => c.cardId === 'gnawing-static')).toBe(true);
    expect(s.devoured).toBe(1);
    expect(s.purged ?? []).toEqual([]);
  });

  it('without a curse in hand only the base effect happens', () => {
    const s = play(fight(['swallow']), 'h0').state;
    expect(200 - s.enemies[0].hp).toBe(6);
  });

  it('Absolution removes curses from the run deck for good when the fight ends', () => {
    const run: RunState = structuredClone(createRun({ seed: 'abs', classId: 'sin-eater' }, CONTENT));
    run.deck.push('hollow-echo');
    let r = stepRun(run, { type: 'chooseNode', nodeId: run.map.startIds[0] }, CONTENT).run;
    const c = r.combat!;
    c.piles.hand = [{ uid: 'a', cardId: 'absolution' }, { uid: 'g', cardId: 'gnawing-static' }, { uid: 'h', cardId: 'hollow-echo' }];
    c.resonance = 5;
    r = stepRun(r, { type: 'combat', action: { type: 'playCard', uid: 'a' } }, CONTENT).run;
    expect(r.combat!.purged).toEqual(['gnawing-static', 'hollow-echo']);
    r.combat!.phase = 'won';
    r = stepRun(r, { type: 'leave' }, CONTENT).run;
    expect(r.deck).not.toContain('gnawing-static');
    expect(r.deck).not.toContain('hollow-echo');
  });

  it('Burden counts the curses in the fight’s piles; shuffled-in curses are fight-only', () => {
    let s = fight(['take-the-sin', 'bitter-feast']);
    const before = s.piles.draw.length;
    s = play(s, 'h0').state;
    expect(s.piles.draw.length).toBe(before + 1);
    expect(s.piles.draw.find((c) => c.conjured)?.cardId).toMatch(/gnawing-static|hollow-echo|leaden-thought/);
    s = play(s, 'h1').state;
    expect(200 - s.enemies[0].hp).toBe(4 + 2 * 1);
  });

  it('the Sin-Eater pays for tainted cards with a curse, not Corruption', () => {
    const run = structuredClone(createRun({ seed: 'taint', classId: 'sin-eater' }, CONTENT));
    run.phase = 'node';
    run.node = { kind: 'reward', nodeId: run.map.startIds[0], cards: ['gnash'], tainted: 'eat-the-sky', relicId: null, cardTaken: false, relicTaken: false };
    const r = stepRun(run, { type: 'pickCard', choice: 'tainted' }, CONTENT).run;
    expect(r.corruption).toBe(run.corruption);
    expect(r.stats.cursesGained).toBe(1);
  });
});

describe('Mirrorborn: Mirror and Steal', () => {
  it("mirrors the target's attack back at it (scaled), and reads its intended damage", () => {
    let s = fight(['reflection', 'mimics-guard']);
    s.enemies[0].intent = 'sunder'; // Sundering Arm: 8 damage
    s = play(s, 'h0').state;
    expect(200 - s.enemies[0].hp).toBe(4); // 8 at 50%
    s = play(s, 'h1').state;
    expect(s.player.ward).toBe(2 + 4); // 2 + half of 8
  });

  it('a mirrored Ward move shields you', () => {
    let s = fight(['perfect-copy']);
    s.enemies[0].intent = 'seal'; // 7 Ward + 4 damage
    s = play(s, 'h0').state;
    expect(s.player.ward).toBe(Math.ceil(7 * 1.5));
    expect(200 - s.enemies[0].hp).toBe(Math.ceil(4 * 1.5));
  });

  it('Steal robs a normal foe of its next move; bosses get Weakened instead', () => {
    let s = fight(['pilfer']);
    s.enemies[0].intent = 'sunder';
    s = play(s, 'h0').state;
    expect(s.enemies[0].robbed).toBe(true);
    const hp = s.player.hp;
    s = step(s, { type: 'endTurn' }, CONTENT).state;
    expect(s.player.hp).toBe(hp);
    expect(s.enemies[0].robbed).toBe(false);

    let b = fight(['pilfer'], {}, 'grieving-lock');
    b = play(b, 'h0').state;
    expect(b.enemies[0].robbed).toBeFalsy();
    expect(b.enemies[0].statuses.weakened).toBeGreaterThanOrEqual(2);
  });
});

describe('Shiftwright: Aspects', () => {
  it('Fractured adds +1 to your hits and costs 1 HP at the end of your turn', () => {
    let s = fight(['tide-strike'], { aspect: 'fractured' });
    s = play(s, 'h0').state;
    expect(200 - s.enemies[0].hp).toBe(7);
    const hp = s.player.hp;
    s.enemies[0].intent = 'seal';
    s = step(s, { type: 'endTurn' }, CONTENT).state;
    expect(s.player.hp).toBeLessThanOrEqual(hp - 1);
  });

  it('Drowned adds 1 to the Bleed you apply; Choir draws 1 more', () => {
    let s = fight(['undertow'], { aspect: 'drowned' });
    s = play(s, 'h0').state;
    expect(s.enemies[0].statuses.bleed).toBe(3);
    const choir = createCombat({ seed: 'c', deck: Array(12).fill('tide-strike'), hp: 60, maxHp: 60, relics: [], encounterId: 'lone-sentinel', aspect: 'choir' }, CONTENT).state;
    expect(choir.piles.hand).toHaveLength(6);
  });

  it('Attune switches the Aspect; attuning to the current one triggers nothing', () => {
    let s = fight(['break-the-sky', 'thunderclap'], { aspect: 'drowned', relics: ['weathervane'] });
    const hand = s.piles.hand.length;
    s = play(s, 'h0').state;
    expect(s.aspect).toBe('fractured');
    expect(s.piles.hand.length).toBe(hand - 1 + 1); // Weathervane drew 1
    s = play(s, 'h1').state;
    expect(s.piles.hand.length).toBe(hand - 1); // already Fractured: no draw
  });

  it('each fight starts in the Aspect of the loop’s Shift', () => {
    const run = createRun({ seed: 'asp', classId: 'shiftwright', vaultShiftId: 'fractured-sky' }, CONTENT);
    const r = stepRun(run, { type: 'chooseNode', nodeId: run.map.startIds[0] }, CONTENT).run;
    expect(r.combat!.aspect).toBe('fractured');
  });
});

describe('Pilgrim: Miles', () => {
  it('entering chambers gives Miles (elites 2); road cards grow with them', () => {
    const run = structuredClone(createRun({ seed: 'mi', classId: 'pilgrim' }, CONTENT));
    run.miles = 6;
    const r = stepRun(run, { type: 'chooseNode', nodeId: run.map.startIds[0] }, CONTENT).run;
    expect(r.miles).toBe(7);
    expect(r.combat!.miles).toBe(7);
    let s = r.combat!;
    s.piles.hand = [{ uid: 'l', cardId: 'long-stride' }];
    s.enemies[0].hp = 200;
    s.enemies[0].ward = 0;
    s = step(s, { type: 'playCard', uid: 'l', targetId: 'e0' }, CONTENT).state;
    expect(200 - s.enemies[0].hp).toBe(5 + Math.floor(7 * 0.34));
  });

  it('Miles gained in a fight stay for the loop', () => {
    const run = structuredClone(createRun({ seed: 'mi2', classId: 'pilgrim' }, CONTENT));
    let r = stepRun(run, { type: 'chooseNode', nodeId: run.map.startIds[0] }, CONTENT).run;
    const c = r.combat!;
    c.piles.hand = [{ uid: 'm', cardId: 'carved-stone' }];
    c.resonance = 3;
    r = stepRun(r, { type: 'combat', action: { type: 'playCard', uid: 'm' } }, CONTENT).run;
    r.combat!.phase = 'won';
    r = stepRun(r, { type: 'leave' }, CONTENT).run;
    expect(r.miles).toBe(1 + 2);
  });
});

describe('Tollkeeper: Toll', () => {
  it('kills pay Toll by tier; Pay spends it for the bonus, otherwise the base', () => {
    let s = fight(['hired-steel', 'hired-steel'], { relics: ['tollhouse-lantern'], toll: 0 });
    expect(s.toll).toBe(1); // the lantern's fight-start Toll
    s = play(s, 'h0').state;
    expect(200 - s.enemies[0].hp).toBe(7); // couldn't pay 2
    s.toll = 2;
    const before = s.enemies[0].hp;
    s = play(s, 'h1').state;
    expect(before - s.enemies[0].hp).toBe(14);
    expect(s.toll).toBe(0);
    expect(s.tollPaid).toBe(2);
    s.enemies[0].hp = 3;
    s.piles.hand = [{ uid: 'k', cardId: 'exact-payment' }];
    s = play(s, 'k').state;
    expect(s.toll).toBe(3 + 3); // the kill (3) and Exact Payment's bonus (3)
  });

  it('Toll carries across fights and buys a Tithe at Shrines, but never becomes Shards', () => {
    const run = structuredClone(createRun({ seed: 'tt', classId: 'tollkeeper' }, CONTENT));
    run.toll = 5;
    run.phase = 'node';
    run.node = { kind: 'shrine', nodeId: run.map.startIds[0] };
    run.hp = 30;
    const r = stepRun(run, { type: 'shrineTithe', deckIndex: 0 }, CONTENT).run;
    expect(r.toll).toBe(1);
    expect(r.deck).toHaveLength(run.deck.length - 1);
    expect(r.hp).toBeGreaterThan(30);
  });
});
