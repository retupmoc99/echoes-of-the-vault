import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { act, play, startFight, withHand } from '../testing/fixtures';

const endTurn = { type: 'endTurn' } as const;

describe('Bleed', () => {
  it('ticks at the start of the owner turn, ignores Ward, and decays', () => {
    let s = withHand(startFight(), ['bleed5']);
    s = play(s, 0).state;
    s.enemies[0].ward = 50; // Ward must not stop Bleed.
    s = act(s, endTurn).state;
    expect(s.enemies[0].hp).toBe(100 - 5);
    expect(s.enemies[0].statuses.bleed).toBe(5 - BALANCE.status.bleed.decayPerTurn);
  });

  it('can kill and end the fight', () => {
    let s = withHand(startFight(), ['bleed5']);
    s.enemies[0].hp = 3;
    s = play(s, 0).state;
    const { state, events } = act(s, endTurn);
    expect(state.phase).toBe('won');
    expect(events).toContainEqual({ type: 'victory' });
  });
});

describe('Fracture', () => {
  it('costs half its stacks in HP at the end of your turn, and stays', () => {
    let s = withHand(startFight(), ['crack']);
    s = play(s, 0).state;
    expect(s.player.statuses.fracture).toBe(4);
    s = act(s, endTurn).state;
    expect(s.player.hp).toBe(50 - Math.floor(4 * BALANCE.status.fracture.selfDamageRatio));
    expect(s.player.statuses.fracture).toBe(4);
  });

  it('fuels Release, which then clears it', () => {
    let s = withHand(startFight(), ['crack', 'release']);
    s = play(s, 0).state; // 4 Fracture
    const { state } = play(s, 0); // 3 per Fracture = 12, +4 from Fracture's own bonus
    expect(state.enemies[0].hp).toBe(100 - (12 + 4 * BALANCE.status.fracture.damagePerStack));
    expect(state.player.statuses.fracture).toBeUndefined();
  });
});

describe('Weakened and Exposed', () => {
  it('Exposed on an enemy lasts through its own turn, then fades', () => {
    let s = withHand(startFight(), ['expose']);
    s = play(s, 0).state;
    expect(s.enemies[0].statuses.exposed).toBe(1);
    s = act(s, endTurn).state;
    expect(s.enemies[0].statuses.exposed).toBeUndefined();
  });

  it('Weakened reduces the enemy attack that turn', () => {
    let s = withHand(startFight({ encounterId: 'hitter' }), ['weaken']);
    s = play(s, 0).state;
    s = act(s, endTurn).state;
    const expected = Math.floor(10 * (1 - BALANCE.status.weakened.damageReduction));
    expect(s.player.hp).toBe(50 - expected);
    expect(s.enemies[0].statuses.weakened).toBe(1);
  });
});
