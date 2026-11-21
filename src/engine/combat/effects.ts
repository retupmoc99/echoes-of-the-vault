/**
 * The effect interpreter: turns card / relic / enemy data into game changes.
 * Adding a new card never touches this file unless it needs a brand new
 * kind of effect.
 */
import type { Amount, CombatState, Combatant, Condition, Effect } from '../types';
import { allyActs, callAllies, livingAllies, newestAlly, playAllyTop, releaseAllies } from './allies';
import { PLAYER_ID, foesOf, getCombatant, isAlive, isEnemy, isOver, type Ctx } from './context';
import { dealAttack, gainWard, loseHp } from './damage';
import { drawCards } from './deck';
import { overloadRelics } from './relics';
import { addStatus, removeStatus } from './statuses';
import { advanceTimeline, queueDelay, recall, rewind } from './time';

/** Counters some amounts scale with (they only apply to the player). */
export interface AmountCounts {
  /** Relic Overloads this turn. */
  overloads: number;
  /** Delayed effects waiting on the timeline. */
  timeline: number;
  /** Echo-Caller: living allies, allies fallen this fight, total cost of allies' next cards. */
  allies?: number;
  alliesFallen?: number;
  allyTopCost?: number;
}

export function countsOf(s: CombatState, content?: Ctx['content']): AmountCounts {
  const allies = (s.allies ?? []).filter((a) => a.hp > 0);
  return {
    overloads: s.overloadsThisTurn,
    timeline: s.timeline.length,
    allies: allies.length,
    alliesFallen: s.fallen?.length ?? 0,
    allyTopCost: content ? allies.reduce((sum, a) => sum + (a.draw[0] ? (content.cards[a.draw[0]]?.cost ?? 0) : 0), 0) : 0,
  };
}

/** Allies resolve at reduced strength (rounded up); everyone else at full. */
function scaled(ctx: Ctx, n: number): number {
  return ctx.potency === undefined || ctx.potency === 1 ? n : Math.ceil(n * ctx.potency);
}

export function resolveAmount(
  amount: Amount,
  source: Combatant,
  target: Combatant | undefined,
  counts: AmountCounts = { overloads: 0, timeline: 0 },
): number {
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
      return plus + (source.id === PLAYER_ID ? counts.overloads : 0) * amount.times;
    case 'timeline':
      return plus + (source.id === PLAYER_ID ? counts.timeline : 0) * amount.times;
    case 'allies':
      return plus + (counts.allies ?? 0) * amount.times;
    case 'alliesFallen':
      return plus + (counts.alliesFallen ?? 0) * amount.times;
    case 'allyTopCost':
      return plus + (counts.allyTopCost ?? 0) * amount.times;
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
  // 'target': you and your allies aim at the chosen enemy. Enemies aim at you,
  // unless an ally is Guarding you.
  const guard = isEnemy(ctx.s, source.id) ? livingAllies(ctx.s).find((a) => a.guard) : undefined;
  const id = isEnemy(ctx.s, source.id) ? (guard?.id ?? PLAYER_ID) : targetId;
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
          dealAttack(ctx, source, target, scaled(ctx, resolveAmount(effect.amount, source, target, countsOf(ctx.s, ctx.content))));
        }
      }
      return;
    }
    case 'ward':
      gainWard(ctx, source, scaled(ctx, resolveAmount(effect.amount, source, undefined, countsOf(ctx.s, ctx.content))));
      return;
    case 'applyStatus':
      for (const target of targetsFor(ctx, effect.target, source, targetId)) {
        addStatus(ctx, target, effect.status, scaled(ctx, resolveAmount(effect.amount, source, target, countsOf(ctx.s, ctx.content))));
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
    case 'delay':
      // Enemies can delay too (the Sleeper's dreams): aimed at you, ticking on their turns.
      if (isPlayer) queueDelay(ctx, effect.effects, effect.turns, targetId);
      else queueDelay(ctx, effect.effects, effect.turns, PLAYER_ID, source.id, ctx.moveName);
      return;
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
    case 'hasten':
      advanceTimeline(ctx, effect.turns);
      return;
    case 'rewind':
      rewind(ctx, effect.count);
      return;
    case 'recall':
      recall(ctx, !!effect.free);
      return;
    case 'call':
      callAllies(ctx, effect.count);
      return;
    case 'allyAct':
      for (const ally of effect.who === 'all' ? livingAllies(ctx.s) : [newestAlly(ctx.s)]) if (ally) allyActs(ctx, ally);
      return;
    case 'allies':
      for (const ally of livingAllies(ctx.s)) asAlly(ctx, ally, effect.effects, targetId);
      return;
    case 'newestAlly': {
      const ally = newestAlly(ctx.s);
      if (ally) asAlly(ctx, ally, effect.effects, targetId);
      return;
    }
    case 'guard': {
      const ally = newestAlly(ctx.s);
      if (ally) ally.guard = true;
      return;
    }
    case 'releaseAlly':
      releaseAllies(ctx, effect.who, effect.damage);
      return;
    case 'playAllyTop':
      playAllyTop(ctx, effect.count);
      return;
    case 'empowerAllies':
      if (effect.acts) ctx.s.allyActs = Math.max(ctx.s.allyActs ?? 1, effect.acts);
      if (effect.hpLoss) ctx.s.allyHpLoss = (ctx.s.allyHpLoss ?? 0) + effect.hpLoss;
      return;
  }
}

/** An ally resolves effects as itself, at full strength (a card buffing it, not it playing a card). */
function asAlly(ctx: Ctx, ally: { id: string }, effects: Effect[], targetId: string | undefined): void {
  const previous = ctx.potency;
  ctx.potency = undefined;
  resolveEffects(ctx, effects, ally.id, targetId);
  ctx.potency = previous;
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
    case 'allyFellThisFight':
      return (ctx.s.fallen?.length ?? 0) > 0;
  }
}

/** Does playing this card need the player to pick an enemy? */
export function needsTarget(effects: Effect[]): boolean {
  return effects.some((e) => {
    if (e.kind === 'if') return needsTarget(e.then) || needsTarget(e.else ?? []);
    if (e.kind === 'delay') return needsTarget(e.effects);
    if (e.kind === 'damage') return (e.target ?? 'target') === 'target';
    if (e.kind === 'applyStatus' || e.kind === 'removeStatus') return e.target === 'target';
    return false;
  });
}
