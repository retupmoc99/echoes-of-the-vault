/**
 * The effect interpreter: turns card / relic / enemy data into game changes.
 * Adding a new card never touches this file unless it needs a brand new
 * kind of effect.
 */
import type { Amount, Combatant, Condition, Effect } from '../types';
import { PLAYER_ID, foesOf, getCombatant, isAlive, isOver, type Ctx } from './context';
import { dealAttack, gainWard, loseHp } from './damage';
import { drawCards } from './deck';
import { overloadRelics } from './relics';
import { addStatus, removeStatus } from './statuses';

/** `overloads` is how many relic Overloads happened this turn (player only). */
export function resolveAmount(amount: Amount, source: Combatant, target: Combatant | undefined, overloads = 0): number {
  if (typeof amount === 'number') return amount;
  const plus = amount.plus ?? 0;
  switch (amount.per) {
    case 'selfStatus':
      return plus + (source.statuses[amount.status] ?? 0) * amount.times;
    case 'targetStatus':
      return plus + (target?.statuses[amount.status] ?? 0) * amount.times;
    case 'selfWard':
      return plus + source.ward * amount.times;
    case 'overloadsThisTurn':
      return plus + (source.id === PLAYER_ID ? overloads : 0) * amount.times;
  }
}

export function resolveEffects(ctx: Ctx, effects: Effect[], sourceId: string, targetId: string | undefined): void {
  for (const effect of effects) {
    if (isOver(ctx.s)) return;
    const source = getCombatant(ctx.s, sourceId);
    if (!isAlive(source)) return;
    resolveEffect(ctx, effect, source, targetId);
  }
}

/** Who an effect with the given target keyword hits. */
function targetsFor(ctx: Ctx, keyword: 'self' | 'target' | 'allFoes', source: Combatant, targetId: string | undefined): Combatant[] {
  if (keyword === 'self') return [source];
  if (keyword === 'allFoes') return foesOf(ctx.s, source.id);
  // 'target': enemies always aim at the player; the player aims at the chosen enemy.
  const id = source.id === PLAYER_ID ? targetId : PLAYER_ID;
  const t = id ? getCombatant(ctx.s, id) : undefined;
  return isAlive(t) ? [t] : [];
}

function resolveEffect(ctx: Ctx, effect: Effect, source: Combatant, targetId: string | undefined): void {
  const isPlayer = source.id === PLAYER_ID;

  switch (effect.kind) {
    case 'damage': {
      const hits = effect.hits ?? 1;
      for (const target of targetsFor(ctx, effect.target ?? 'target', source, targetId)) {
        for (let i = 0; i < hits && target.hp > 0 && !isOver(ctx.s); i++) {
          dealAttack(ctx, source, target, resolveAmount(effect.amount, source, target, ctx.s.overloadsThisTurn));
        }
      }
      return;
    }
    case 'ward':
      gainWard(ctx, source, resolveAmount(effect.amount, source, undefined, ctx.s.overloadsThisTurn));
      return;
    case 'applyStatus':
      for (const target of targetsFor(ctx, effect.target, source, targetId)) {
        addStatus(ctx, target, effect.status, resolveAmount(effect.amount, source, target, ctx.s.overloadsThisTurn));
      }
      return;
    case 'removeStatus':
      for (const target of targetsFor(ctx, effect.target, source, targetId)) {
        removeStatus(ctx, target, effect.status);
      }
      return;
    case 'loseHp':
      loseHp(ctx, source, effect.amount, 'effect');
      return;
    case 'if': {
      const branch = checkCondition(ctx, effect.cond, source, targetId) ? effect.then : (effect.else ?? []);
      resolveEffects(ctx, branch, source.id, targetId);
      return;
    }
  }

  // Everything below only makes sense for the player.
  if (!isPlayer) return;
  switch (effect.kind) {
    case 'gainResonance':
      ctx.s.resonance += effect.amount;
      return;
    case 'draw':
      drawCards(ctx, effect.amount);
      return;
    case 'overloadRelic':
      overloadRelics(ctx, effect.which, targetId);
      return;
    case 'clearStrain':
      for (const r of ctx.s.relics) if (!r.cracked) r.strain = 0;
      return;
    case 'retainWard':
      ctx.s.player.retainWard = true;
      return;
    case 'clearWard':
      ctx.s.player.ward = 0;
      return;
  }
}

function checkCondition(ctx: Ctx, cond: Condition, source: Combatant, targetId: string | undefined): boolean {
  switch (cond.kind) {
    case 'overloadedThisTurn':
      return ctx.s.overloadsThisTurn > 0;
    case 'selfStatusAtLeast':
      return (source.statuses[cond.status] ?? 0) >= cond.n;
    case 'targetHasStatus': {
      const [target] = targetsFor(ctx, 'target', source, targetId);
      return (target?.statuses[cond.status] ?? 0) > 0;
    }
  }
}

/** Does playing this card need the player to pick an enemy? */
export function needsTarget(effects: Effect[]): boolean {
  return effects.some((e) => {
    if (e.kind === 'if') return needsTarget(e.then) || needsTarget(e.else ?? []);
    if (e.kind === 'damage') return (e.target ?? 'target') === 'target';
    if (e.kind === 'applyStatus' || e.kind === 'removeStatus') return e.target === 'target';
    return false;
  });
}
