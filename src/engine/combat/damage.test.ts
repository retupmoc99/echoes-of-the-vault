import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { play, startFight, withHand } from '../testing/fixtures';
import { attackDamage } from './damage';

const st = BALANCE.status;

describe('attack damage', () => {
  it('deals base damage with no modifiers', () => {
    const s = startFight();
    expect(attackDamage(s, s.player, s.enemies[0], 6)).toBe(6);
  });

  it('adds Fracture per stack', () => {
    const s = startFight();
    s.player.statuses.fracture = 3;
    expect(attackDamage(s, s.player, s.enemies[0], 6)).toBe(6 + 3 * st.fracture.damagePerStack);
  });

  it('reduces damage when Weakened and rounds down', () => {
    const s = startFight();
    s.player.statuses.weakened = 1;
    expect(attackDamage(s, s.player, s.enemies[0], 10)).toBe(Math.floor(10 * (1 - st.weakened.damageReduction)));
  });

  it('increases damage against Exposed', () => {
    const s = startFight();
    s.enemies[0].statuses.exposed = 1;
    expect(attackDamage(s, s.player, s.enemies[0], 10)).toBe(Math.floor(10 * (1 + st.exposed.damageIncrease)));
  });

  it('applies flat bonuses before multipliers', () => {
    const s = startFight();
    s.player.statuses.fracture = 2;
    s.player.statuses.weakened = 1;
    s.enemies[0].statuses.exposed = 1;
    const expected = Math.floor((6 + 2) * (1 - st.weakened.damageReduction) * (1 + st.exposed.damageIncrease));
    expect(attackDamage(s, s.player, s.enemies[0], 6)).toBe(expected);
  });

  it('applies the enemy damage modifier only to enemies', () => {
    const s = startFight({ modifiers: { enemyDamageBonus: 2 } });
    expect(attackDamage(s, s.enemies[0], s.player, 5)).toBe(7);
    expect(attackDamage(s, s.player, s.enemies[0], 5)).toBe(5);
  });
});

describe('Ward', () => {
  it('absorbs damage before HP', () => {
    let s = startFight({ encounterId: 'hitter' });
    s = withHand(s, ['hit6']);
    s.enemies[0].ward = 4;
    const { state, events } = play(s, 0);
    expect(state.enemies[0].ward).toBe(0);
    expect(state.enemies[0].hp).toBe(100 - 2);
    expect(events).toContainEqual(expect.objectContaining({ type: 'attack', amount: 6, blocked: 4 }));
  });

  it('fully blocks a smaller hit', () => {
    let s = withHand(startFight(), ['hit6']);
    s.enemies[0].ward = 10;
    s = play(s, 0).state;
    expect(s.enemies[0].ward).toBe(4);
    expect(s.enemies[0].hp).toBe(100);
  });
});
