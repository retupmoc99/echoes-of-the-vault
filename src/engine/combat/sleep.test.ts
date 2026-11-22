import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../data';
import { BALANCE } from '../../data/balance';
import { previewIntent } from './intents';
import { createCombat, step } from './combat';
import type { CombatState } from '../types';

const S = BALANCE.sleep;

function fight(encounterId: string, hand: string[], awakeningStage = 0): CombatState {
  const s = createCombat(
    { seed: 'sleep', deck: [...hand, ...Array(10).fill('dull-blade')], hp: 68, maxHp: 68, relics: [], encounterId, modifiers: { awakeningStage } },
    CONTENT,
  ).state;
  // Put the wanted cards in hand, in order.
  s.piles.hand = hand.map((cardId, i) => ({ uid: `h${i}`, cardId }));
  s.resonance = 10;
  return s;
}
const play = (s: CombatState, uid: string, targetId = 'e0') => step(s, { type: 'playCard', uid, targetId }, CONTENT);
const endTurn = (s: CombatState) => step(s, { type: 'endTurn' }, CONTENT).state;

describe('Drowse and sleep', () => {
  it('thresholds come from the tier', () => {
    expect(fight('lone-sentinel', []).enemies[0].sleepThreshold).toBe(S.threshold.normal);
    expect(fight('warden-unmade', []).enemies[0].sleepThreshold).toBe(S.threshold.elite);
    expect(fight('grieving-lock', []).enemies[0].sleepThreshold).toBe(S.threshold.boss);
  });

  it('at the threshold a foe falls Asleep: Drowse resets and the threshold rises', () => {
    let s = fight('lone-sentinel', ['heavy-eyelids', 'heavy-eyelids']);
    s = play(s, 'h0').state;
    expect(s.enemies[0].asleep).toBeFalsy();
    const res = play(s, 'h1');
    s = res.state;
    expect(s.enemies[0].asleep).toBe(true);
    expect(s.enemies[0].statuses.drowse).toBeUndefined();
    expect(s.enemies[0].sleepThreshold).toBe(S.threshold.normal + S.rise.normal);
    expect(res.events.some((e) => e.type === 'fellAsleep')).toBe(true);
  });

  it('a sleeper skips its turn, stays asleep through your next turn, then makes its planned move', () => {
    let s = fight('lone-sentinel', ['heavy-eyelids', 'heavy-eyelids']);
    s = play(play(s, 'h0').state, 'h1').state;
    const planned = s.enemies[0].intent;
    expect(previewIntent(s, s.enemies[0], CONTENT).kinds).toEqual(['asleep']);
    const hpBefore = s.player.hp;
    s = endTurn(s);
    expect(s.player.hp).toBe(hpBefore); // skipped
    expect(s.enemies[0].asleep).toBe(true);
    expect(s.enemies[0].intent).toBe(planned);
    expect(previewIntent(s, s.enemies[0], CONTENT).kinds).toContain('asleep');
    const after = step(s, { type: 'endTurn' }, CONTENT);
    expect(after.state.enemies[0].asleep).toBe(false);
    expect(after.events.some((e) => e.type === 'enemyMove')).toBe(true);
  });

  it('Drowse on a sleeper is lost, and sleepers take more damage', () => {
    let s = fight('lone-sentinel', ['heavy-eyelids', 'heavy-eyelids', 'heavy-eyelids', 'dull-blade']);
    s = play(play(s, 'h0').state, 'h1').state;
    s = play(s, 'h2').state;
    expect(s.enemies[0].statuses.drowse).toBeUndefined();
    const hp = s.enemies[0].hp;
    const ward = s.enemies[0].ward;
    s = play(s, 'h3').state;
    expect(hp + ward - s.enemies[0].hp - s.enemies[0].ward).toBe(Math.floor(6 * S.damageTakenMult));
  });

  it('waking blows hit harder on a sleeper', () => {
    let s = fight('lone-sentinel', ['nightfall-cut', 'heavy-eyelids', 'heavy-eyelids', 'nightfall-cut']);
    s.enemies[0].hp = 200;
    s.enemies[0].ward = 0;
    s = play(s, 'h0').state;
    const awakeHit = 200 - s.enemies[0].hp;
    s = play(play(s, 'h1').state, 'h2').state;
    const before = s.enemies[0].hp;
    s = play(s, 'h3').state;
    expect(awakeHit).toBe(6);
    expect(before - s.enemies[0].hp).toBe(Math.floor(18 * S.damageTakenMult));
  });

  it("a boss's phase change wakes it", () => {
    let s = fight('the-sleeper', ['eternal-lullaby'], 5);
    s.enemies[0].sleepThreshold = 1;
    s = play(s, 'h0').state;
    expect(s.enemies[0].asleep).toBe(true);
    s.enemies[0].hp = Math.floor(s.enemies[0].maxHp * 0.7);
    s.piles.hand = [{ uid: 'k', cardId: 'dull-blade' }];
    s = play(s, 'k').state;
    expect(s.enemies[0].phase).toBe(0);
    expect(s.enemies[0].asleep).toBe(false);
  });

  it("Sleeper's Hum grows with the Awakening", () => {
    const hum = (stage: number) => {
      const s = createCombat({ seed: 'h', deck: Array(10).fill('dull-blade'), hp: 68, maxHp: 68, relics: ['sleepers-hum'], encounterId: 'lone-sentinel', modifiers: { awakeningStage: stage } }, CONTENT).state;
      return (s.enemies[0].statuses.drowse ?? 0) + (s.enemies[0].asleep ? 100 : 0);
    };
    expect(hum(0)).toBe(2);
    expect(hum(1)).toBe(2);
    // Stage 2: 4 Drowse, enough to put a normal foe to sleep as the fight begins.
    expect(hum(2)).toBeGreaterThanOrEqual(100);
  });

  it('Long Night lowers thresholds; Dreamwalk hits only sleepers', () => {
    let s = fight('choir-pair', ['long-night', 'heavy-eyelids', 'dreamwalk']);
    s = play(s, 'h0').state;
    expect(s.enemies[0].sleepThreshold).toBe(S.threshold.normal - 2);
    s = play(s, 'h1', 'e0').state;
    expect(s.enemies[0].asleep).toBe(true);
    const [a, b] = [s.enemies[0].hp, s.enemies[1].hp];
    s = play(s, 'h2').state;
    expect(s.enemies[0].hp).toBeLessThan(a);
    expect(s.enemies[1].hp).toBe(b);
  });
});
