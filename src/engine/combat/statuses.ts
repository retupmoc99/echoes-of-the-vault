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
import type { Combatant, StatusId } from '../types';
import { PLAYER_ID, type Ctx } from './context';
import { loseHp } from './damage';
import { fireTriggers } from './relics';

export function addStatus(ctx: Ctx, target: Combatant, status: StatusId, delta: number): void {
  if (delta === 0 || target.hp <= 0) return;
  const next = Math.max(0, (target.statuses[status] ?? 0) + delta);
  if (next === 0) delete target.statuses[status];
  else target.statuses[status] = next;
  ctx.events.push({ type: 'status', targetId: target.id, status, delta });
  if (delta > 0 && target.id === PLAYER_ID) {
    fireTriggers(ctx, 'gainedStatus', { status });
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
}
