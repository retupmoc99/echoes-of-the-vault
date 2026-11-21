/**
 * Corruption: the run-wide price of power.
 *
 * Each threshold crossed raises the "tier":
 *   - enemies gain HP and damage
 *   - some tiers plant a curse in your deck (once, on crossing)
 *   - rare cards show up more often in rewards
 * Lowering Corruption later lowers the tier, but curses stay.
 */
import { BALANCE } from '../../data/balance';
import { defaultCombatModifiers } from '../combat/combat';
import { rngPick } from '../rng';
import type { CombatModifiers, Content, RunState } from '../types';

const C = BALANCE.corruption;

export function corruptionTier(corruption: number): number {
  return C.thresholds.filter((t) => corruption >= t).length;
}

export function addCorruption(r: RunState, amount: number, content: Content, notices: string[]): void {
  if (amount === 0) return;
  const before = corruptionTier(r.corruption);
  r.corruption = Math.max(0, r.corruption + amount);
  r.stats.peakCorruption = Math.max(r.stats.peakCorruption, r.corruption);
  const after = corruptionTier(r.corruption);

  for (let tier = before + 1; tier <= after; tier++) {
    notices.push(`Corruption ${C.thresholds[tier - 1]}: the vault grows hungrier.`);
    if ((C.curseAtTiers as readonly number[]).includes(tier)) addCurse(r, content, notices);
  }
}

export function addCurse(r: RunState, content: Content, notices: string[]): void {
  const curses = Object.values(content.cards).filter((c) => c.rarity === 'curse');
  if (curses.length === 0) return;
  const curse = rngPick(r.rng, curses);
  r.deck.push(curse.id);
  r.stats.cursesGained++;
  notices.push(`A curse takes root: ${curse.name}.`);
}

/** Rule values for the next fight: defaults, then the Vault Shift, then Corruption. */
export function combatModifiersFor(r: RunState, content: Content): CombatModifiers {
  const mods = defaultCombatModifiers();
  const shift = content.vaultShifts[r.vaultShiftId]?.mods.combat ?? {};

  for (const [key, value] of Object.entries(shift) as [keyof CombatModifiers, number][]) {
    if (key === 'enemyHpMult') mods.enemyHpMult *= value;
    else if (key === 'enemyDamageBonus') mods.enemyDamageBonus += value;
    else mods[key] = value;
  }

  const tier = corruptionTier(r.corruption);
  mods.enemyHpMult *= 1 + tier * C.enemyHpPerTier;
  mods.enemyDamageBonus += tier * C.enemyDamagePerTier;
  return mods;
}
