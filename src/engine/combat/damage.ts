/**
 * Damage math. Kept in one place so every number the player sees in a card
 * preview or an enemy intent is computed by exactly the same function that
 * applies it.
 */
import { BALANCE } from '../../data/balance';
import type { AllyState, CombatState, Combatant, EnemyState, HpLossCause } from '../types';
import { onAllyFell } from './allies';
import { PLAYER_ID, isAlly, isEnemy, type Ctx } from './context';
import { checkPhase } from './phases';
import { addStatus } from './statuses';

/**
 * Damage of one attack hit before Ward.
 * Order: base + flat bonuses, then multipliers, then round down.
 */
export function attackDamage(s: CombatState, attacker: Combatant, defender: Combatant, base: number): number {
  const st = BALANCE.status;
  let dmg = base + (attacker.statuses.fracture ?? 0) * s.modifiers.fractureDamagePerStack;
  if (isEnemy(s, attacker.id)) dmg += s.modifiers.enemyDamageBonus + ((attacker as EnemyState).damageBonus ?? 0);
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
  // Omen: Bleeding Moon. Every wound stays open.
  const bleed = ctx.s.modifiers.bleedOnAttack ?? 0;
  if (bleed && amount > blocked && defender.hp > 0) addStatus(ctx, defender, 'bleed', bleed);
}

/** Direct HP loss (Bleed, Fracture, self-harm). Ignores Ward. */
export function loseHp(ctx: Ctx, target: Combatant, amount: number, cause: HpLossCause): void {
  if (amount <= 0 || target.hp <= 0) return;
  ctx.events.push({ type: 'hpLoss', targetId: target.id, amount, cause });
  reduceHp(ctx, target, amount);
}

export function gainWard(ctx: Ctx, target: Combatant, amount: number): void {
  // Omen: Paper Walls weakens only your own Ward.
  const mult = ctx.s.modifiers.playerWardMult;
  if (target.id === PLAYER_ID && mult !== undefined) amount = Math.round(amount * mult);
  if (amount <= 0 || target.hp <= 0) return;
  target.ward += amount;
  ctx.events.push({ type: 'ward', targetId: target.id, amount });
}

function reduceHp(ctx: Ctx, target: Combatant, amount: number): void {
  if (amount <= 0) return;
  target.hp = Math.max(0, target.hp - amount);
  if (isAlly(ctx.s, target.id)) {
    if (target.hp === 0) onAllyFell(ctx, target as AllyState);
    return; // allies falling never ends the fight
  }
  if (target.hp === 0) {
    ctx.events.push({ type: 'death', targetId: target.id });
    if (target.id !== PLAYER_ID) kinMourn(ctx, target.id);
    checkCombatEnd(ctx);
  } else if (target.id !== PLAYER_ID) {
    checkPhase(ctx, target as EnemyState);
  }
}

/** Enemies with onKinDeath react when another enemy in the fight dies. */
function kinMourn(ctx: Ctx, deadId: string): void {
  for (const enemy of ctx.s.enemies) {
    if (enemy.id === deadId || enemy.hp <= 0) continue;
    const kin = ctx.content.enemies[enemy.defId]?.onKinDeath;
    if (!kin) continue;
    if (kin.ward) gainWard(ctx, enemy, kin.ward);
    if (kin.damageBonus) enemy.damageBonus = (enemy.damageBonus ?? 0) + kin.damageBonus;
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
