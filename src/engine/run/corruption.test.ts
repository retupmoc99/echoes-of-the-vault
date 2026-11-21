import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { CONTENT } from '../../data';
import { defaultCombatModifiers } from '../combat/combat';
import type { RunState } from '../types';
import { addCorruption, combatModifiersFor, corruptionTier } from './corruption';
import { createRun, shrineHeal } from './run';
import { rollCardReward } from './rewards';

const C = BALANCE.corruption;
const calmRun = (): RunState => createRun({ seed: 'c', classId: 'relic-breaker', vaultShiftId: 'still-vault' }, CONTENT);

describe('Corruption', () => {
  it('counts tiers by thresholds reached', () => {
    expect(corruptionTier(0)).toBe(0);
    expect(corruptionTier(C.thresholds[0] - 1)).toBe(0);
    expect(corruptionTier(C.thresholds[0])).toBe(1);
    expect(corruptionTier(C.thresholds[2] + 5)).toBe(3);
  });

  it('plants a curse once when crossing a curse tier, and keeps it after dropping', () => {
    const r = calmRun();
    const notices: string[] = [];
    addCorruption(r, C.thresholds[1], CONTENT, notices);
    const curses = r.deck.filter((id) => CONTENT.cards[id].rarity === 'curse');
    expect(curses).toHaveLength(C.curseAtTiers.filter((t) => t <= 2).length);
    expect(notices.some((n) => n.includes('curse'))).toBe(true);

    addCorruption(r, -10, CONTENT, notices);
    expect(r.corruption).toBe(0);
    expect(r.deck.filter((id) => CONTENT.cards[id].rarity === 'curse')).toHaveLength(curses.length);
    expect(r.stats.peakCorruption).toBe(C.thresholds[1]);
  });

  it('makes enemies tougher per tier', () => {
    const r = calmRun();
    addCorruption(r, C.thresholds[1], CONTENT, []);
    const mods = combatModifiersFor(r, CONTENT);
    expect(mods.enemyHpMult).toBeCloseTo(1 + 2 * C.enemyHpPerTier);
    expect(mods.enemyDamageBonus).toBe(2 * C.enemyDamagePerTier);
  });

  it('improves loot: more rares appear at high Corruption', () => {
    const countRares = (corruption: number) => {
      let rares = 0;
      for (let i = 0; i < 300; i++) {
        const r = { ...createRun({ seed: `loot${i}`, classId: 'relic-breaker', vaultShiftId: 'still-vault' }, CONTENT), corruption };
        rares += rollCardReward(r, CONTENT, 'normal').cards.filter((id) => CONTENT.cards[id].rarity === 'rare').length;
      }
      return rares;
    };
    expect(countRares(C.thresholds[2])).toBeGreaterThan(countRares(0) * 1.5);
  });
});

describe('rewards', () => {
  it('offers distinct cards from the class pool, plus a tainted rare not already offered', () => {
    for (let i = 0; i < 50; i++) {
      const r = createRun({ seed: `rw${i}`, classId: 'relic-breaker', vaultShiftId: 'still-vault' }, CONTENT);
      const { cards, tainted } = rollCardReward(r, CONTENT, 'normal');
      expect(cards).toHaveLength(BALANCE.rewards.choices);
      expect(new Set(cards).size).toBe(cards.length);
      for (const id of cards) expect(CONTENT.classes['relic-breaker'].cardPool).toContain(id);
      expect(CONTENT.cards[tainted!].rarity).toBe('rare');
      expect(cards).not.toContain(tainted);
    }
  });
});

describe('Vault Shifts', () => {
  const runWith = (vaultShiftId: string) => createRun({ seed: 'shift', classId: 'relic-breaker', vaultShiftId }, CONTENT);

  it('every loop rolls a real, rollable Shift', () => {
    for (let i = 0; i < 40; i++) {
      const r = createRun({ seed: `roll${i}`, classId: 'relic-breaker' }, CONTENT);
      expect(CONTENT.vaultShifts[r.vaultShiftId].weight).toBeGreaterThan(0);
    }
  });

  it('The Drowned Halls: Bleed never fades, Shrines heal half', () => {
    const r = runWith('drowned-halls');
    expect(combatModifiersFor(r, CONTENT).bleedDecay).toBe(0);
    expect(shrineHeal(r, CONTENT)).toBe(Math.round(shrineHeal(runWith('still-vault'), CONTENT) / 2));
  });

  it('The Choir Awake: tougher enemies, four reward cards', () => {
    const r = runWith('choir-awake');
    expect(combatModifiersFor(r, CONTENT).enemyHpMult).toBeCloseTo(1.15);
    expect(rollCardReward(r, CONTENT, 'normal').cards).toHaveLength(BALANCE.rewards.choices + 1);
  });

  it('The Fractured Sky and The Restless Engines change combat rules', () => {
    expect(combatModifiersFor(runWith('fractured-sky'), CONTENT)).toMatchObject({ fractureDamagePerStack: 2, fractureSelfDamageRatio: 1 });
    expect(combatModifiersFor(runWith('restless-engines'), CONTENT).maxStrainBonus).toBe(1);
  });

  it('The Hollow Bargain starts with Corruption', () => {
    expect(runWith('hollow-bargain').corruption).toBe(2);
  });

  it('The Restless Engines puts more elites on the map', () => {
    const elites = (id: string) => {
      let n = 0;
      for (let i = 0; i < 60; i++) {
        const r = createRun({ seed: `e${i}`, classId: 'relic-breaker', vaultShiftId: id }, CONTENT);
        n += Object.values(r.map.nodes).filter((x) => x.type === 'elite').length;
      }
      return n;
    };
    expect(elites('restless-engines')).toBeGreaterThan(elites('still-vault') * 1.4);
  });

  it('a neutral Shift leaves combat at its defaults', () => {
    expect(combatModifiersFor(runWith('still-vault'), CONTENT)).toEqual(defaultCombatModifiers());
  });
});
