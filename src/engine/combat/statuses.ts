/**
 * Status effects: how they are applied and when they tick.
 *
 * Timing rules (shared by player and enemies):
 * - Start of owner's turn: Bleed deals its stacks as HP loss, then decays.
 * - End of owner's turn:   Fracture costs floor(stacks × ratio) HP;
 *                          Weakened and Exposed lose 1 stack.
 * - Fracture never decays on its own: it is a debt you pay every turn.
 *
 * Numbers come from the fight's modifiers (BALANCE defaults, adjusted by
 * the loop's Vault Shift).
 */
import { BALANCE } from '../../data/balance';
import type { Combatant, EnemyState, StatusId } from '../types';
import { PLAYER_ID, type Ctx } from './context';
import { loseHp } from './damage';
import { fireTriggers } from './relics';

export function addStatus(ctx: Ctx, target: Combatant, status: StatusId, delta: number): void {
  if (delta === 0 || target.hp <= 0) return;
  // Somnant: Drowse on a sleeping foe is lost (no two sleeps in a row).
  if (status === 'drowse' && delta > 0 && (target as EnemyState).asleep) return;
  const next = Math.max(0, (target.statuses[status] ?? 0) + delta);
  if (next === 0) delete target.statuses[status];
  else target.statuses[status] = next;
  ctx.events.push({ type: 'status', targetId: target.id, status, delta });
  if (delta > 0 && target.id === PLAYER_ID) {
    fireTriggers(ctx, 'gainedStatus', { status });
  }
  if (status === 'drowse' && delta > 0 && target.id !== PLAYER_ID) checkSleep(ctx, target as EnemyState);
}

/** At its threshold, a foe falls Asleep: Drowse resets and the threshold rises. */
function checkSleep(ctx: Ctx, enemy: EnemyState): void {
  const threshold = enemy.sleepThreshold;
  if (threshold === undefined || enemy.asleep) return;
  if ((enemy.statuses.drowse ?? 0) < threshold) return;
  if (enemy.maxSleeps !== undefined && (enemy.sleeps ?? 0) >= enemy.maxSleeps) return;
  enemy.asleep = true;
  enemy.sleeps = (enemy.sleeps ?? 0) + 1;
  delete enemy.statuses.drowse;
  const tier = ctx.content.enemies[enemy.defId]?.tier ?? 'normal';
  enemy.sleepThreshold = threshold + BALANCE.sleep.rise[tier];
  ctx.events.push({ type: 'fellAsleep', enemyId: enemy.id });
  fireTriggers(ctx, 'foeSlept', { targetId: enemy.id });
}

/** Lower foes' thresholds (Long Night, Nightcap); they may fall asleep at once. */
export function lowerThresholds(ctx: Ctx, amount: number, bossesOnly: boolean, extraSleeps: number): void {
  for (const enemy of ctx.s.enemies) {
    if (enemy.hp <= 0 || enemy.sleepThreshold === undefined) continue;
    if (bossesOnly && ctx.content.enemies[enemy.defId]?.tier !== 'boss') continue;
    enemy.sleepThreshold = Math.max(1, enemy.sleepThreshold - amount);
    if (extraSleeps && enemy.maxSleeps !== undefined) enemy.maxSleeps += extraSleeps;
    checkSleep(ctx, enemy);
  }
}

export function removeStatus(ctx: Ctx, target: Combatant, status: StatusId): void {
  const stacks = target.statuses[status] ?? 0;
  if (stacks > 0) addStatus(ctx, target, status, -stacks);
}

export function tickStartOfTurn(ctx: Ctx, c: Combatant): void {
  const bleed = c.statuses.bleed ?? 0;
  if (bleed > 0) {
    loseHp(ctx, c, bleed, 'bleed');
    addStatus(ctx, c, 'bleed', -ctx.s.modifiers.bleedDecay);
  }
}

export function tickEndOfTurn(ctx: Ctx, c: Combatant): void {
  const fracture = c.statuses.fracture ?? 0;
  if (fracture > 0) {
    loseHp(ctx, c, Math.floor(fracture * ctx.s.modifiers.fractureSelfDamageRatio), 'fracture');
  }
  for (const s of ['weakened', 'exposed'] as const) {
    if ((c.statuses[s] ?? 0) > 0) addStatus(ctx, c, s, -1);
  }
  // Paradox: at the threshold, the timeline snaps back on you.
  const paradox = c.statuses.paradox ?? 0;
  const P = BALANCE.status.paradox;
  if (paradox >= P.snapThreshold && c.hp > 0) {
    const damage = paradox * P.snapDamagePerStack;
    ctx.events.push({ type: 'paradoxSnap', damage });
    removeStatus(ctx, c, 'paradox');
    loseHp(ctx, c, damage, 'paradox');
  }
}
