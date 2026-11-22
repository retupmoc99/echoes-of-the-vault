/**
 * Relics: passive triggers and Overload.
 *
 * Overloading a relic runs its `overload` effects and adds 1 Strain.
 * At max Strain the relic cracks and goes dark (passive included) for the
 * rest of the fight. That is the Relic-Breaker's core cost.
 */
import { BALANCE } from '../../data/balance';
import { rngPick } from '../rng';
import type { CardType, RelicDef, RelicState, StatusId, Trigger } from '../types';
import { PLAYER_ID, livingEnemies, isOver, type Ctx } from './context';
import { resolveEffects } from './effects';

/** Overloads a relic survives. `bonus` comes from the fight's modifiers. */
export function maxStrain(def: RelicDef, bonus = 0): number {
  return (def.maxStrain ?? BALANCE.relic.defaultMaxStrain) + bonus;
}

interface TriggerInfo {
  cardType?: CardType;
  status?: StatusId;
  /** The foe the event happened to (foeSlept, foeWoke): the trigger's target. */
  targetId?: string;
}

function matches(t: Trigger, on: Trigger['on'], info: TriggerInfo): boolean {
  if (t.on !== on) return false;
  if (t.cardType && t.cardType !== info.cardType) return false;
  if (t.status && t.status !== info.status) return false;
  return true;
}

/** Run every matching passive trigger on working (uncracked) relics. */
export function fireTriggers(ctx: Ctx, on: Trigger['on'], info: TriggerInfo = {}): void {
  if (ctx.depth >= BALANCE.engine.maxTriggerDepth) return;
  ctx.depth++;
  for (const relic of ctx.s.relics) {
    if (relic.cracked || isOver(ctx.s)) continue;
    const def = ctx.content.relics[relic.relicId];
    for (const trigger of def.passive ?? []) {
      if (matches(trigger, on, info)) {
        resolveEffects(ctx, trigger.effects, PLAYER_ID, info.targetId ?? randomEnemyId(ctx));
      }
    }
  }
  ctx.depth--;
}

export function overloadRelics(ctx: Ctx, which: 'random' | 'all', targetId: string | undefined): void {
  const candidates = ctx.s.relics.filter((r) => !r.cracked && ctx.content.relics[r.relicId].overload);
  if (candidates.length === 0) {
    ctx.events.push({ type: 'overloadFizzled' });
    return;
  }
  const chosen = which === 'all' ? candidates : [rngPick(ctx.s.rng, candidates)];
  for (const relic of chosen) {
    if (isOver(ctx.s)) return;
    overloadOne(ctx, relic, targetId);
  }
}

function overloadOne(ctx: Ctx, relic: RelicState, targetId: string | undefined): void {
  const def = ctx.content.relics[relic.relicId];
  relic.strain++;
  ctx.s.overloadsThisTurn++;
  ctx.events.push({ type: 'relicOverload', relicId: relic.relicId, strain: relic.strain });
  resolveEffects(ctx, def.overload ?? [], PLAYER_ID, targetId ?? randomEnemyId(ctx));
  if (relic.strain >= maxStrain(def, ctx.s.modifiers.maxStrainBonus)) {
    relic.cracked = true;
    ctx.events.push({ type: 'relicCracked', relicId: relic.relicId });
  }
}

/** Relics have no aim of their own: they strike a random living enemy. */
function randomEnemyId(ctx: Ctx): string | undefined {
  const alive = livingEnemies(ctx.s);
  return alive.length ? rngPick(ctx.s.rng, alive).id : undefined;
}
