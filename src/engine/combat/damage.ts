/**
 * Damage math. Kept in one place so every number the player sees in a card
 * preview or an enemy intent is computed by exactly the same function that
 * applies it.
 */
import { BALANCE } from '../../data/balance';
import type { CombatState, Combatant } from '../types';
import { PLAYER_ID, type Ctx } from './context';

/**
 * Damage of one attack hit before Ward.
 * Order: base + flat bonuses, then multipliers, then round down.
 */
export function attackDamage(s: CombatState, attacker: Combatant, defender: Combatant, base: number): number {
  const st = BALANCE.status;
  let dmg = base + (attacker.statuses.fracture ?? 0) * s.modifiers.fractureDamagePerStack;
  if (attacker.id !== PLAYER_ID) dmg += s.modifiers.enemyDamageBonus;
  if ((attacker.statuses.weakened ?? 0) > 0) dmg *= 1 - st.weakened.damageReduction;
  if ((defender.statuses.exposed ?? 0) > 0) dmg *= 1 + st.exposed.damageIncrease;
  return Math.max(0, Math.floor(dmg));
}

/** One attack hit: Ward absorbs first, the rest goes to HP. */
export function dealAttack(ctx: Ctx, attacker: Combatant, defender: Combatant, base: number): void {
  if (defender.hp <= 0) return;
  const amount = attackDamage(ctx.s, attacker, defender, base);
  const blocked = Math.min(defender.ward, amount);
  defender.ward -= blocked;
  ctx.events.push({ type: 'attack', sourceId: attacker.id, targetId: defender.id, amount, blocked });
  reduceHp(ctx, defender, amount - blocked);
}

/** Direct HP loss (Bleed, Fracture, self-harm). Ignores Ward. */
export function loseHp(ctx: Ctx, target: Combatant, amount: number, cause: 'bleed' | 'fracture' | 'effect'): void {
  if (amount <= 0 || target.hp <= 0) return;
  ctx.events.push({ type: 'hpLoss', targetId: target.id, amount, cause });
  reduceHp(ctx, target, amount);
}

export function gainWard(ctx: Ctx, target: Combatant, amount: number): void {
  if (amount <= 0 || target.hp <= 0) return;
  target.ward += amount;
  ctx.events.push({ type: 'ward', targetId: target.id, amount });
}

function reduceHp(ctx: Ctx, target: Combatant, amount: number): void {
  if (amount <= 0) return;
  target.hp = Math.max(0, target.hp - amount);
  if (target.hp === 0) {
    ctx.events.push({ type: 'death', targetId: target.id });
    checkCombatEnd(ctx);
  }
}

export function checkCombatEnd(ctx: Ctx): void {
  const s = ctx.s;
  if (s.phase === 'won' || s.phase === 'lost') return;
  if (s.player.hp <= 0) {
    s.phase = 'lost';
    ctx.events.push({ type: 'defeat' });
  } else if (s.enemies.every((e) => e.hp <= 0)) {
    s.phase = 'won';
    ctx.events.push({ type: 'victory' });
  }
}
