/**
 * The effect interpreter: turns card / relic / enemy data into game changes.
 * Adding a new card never touches this file unless it needs a brand new
 * kind of effect.
 */
import type { Amount, Aspect, CombatState, Combatant, Condition, Content, Effect, EnemyState, IntentClass } from '../types';
import { allyActs, callAllies, livingAllies, newestAlly, playAllyTop, releaseAllies } from './allies';
import { PLAYER_ID, aspectActive, foesOf, getCombatant, isAlive, isEnemy, isOver, livingEnemies, type Ctx } from './context';
import { dealAttack, gainWard, loseHp } from './damage';
import { drawCards } from './deck';
import { rngInt, rngPick } from '../rng';
import { previewIntent } from './intents';
import { moveOf } from './phases';
import { fireTriggers, overloadRelics } from './relics';
import { addStatus, lowerThresholds, removeStatus } from './statuses';
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
  /** Somnant: foes Asleep now; half the Awakening stage. */
  foesAsleep?: number;
  halfAwakening?: number;
  cursesInDeck?: number;
  devouredThisFight?: number;
  foesIntendingAttack?: number;
  allIntentDamage?: number;
  /** Each living foe's shown damage (× hits), by id. */
  intentDamage?: Record<string, number>;
  miles?: number;
  toll?: number;
  tollPaid?: number;
  lastPaid?: number;
}

export function countsOf(s: CombatState, content?: Ctx['content']): AmountCounts {
  const allies = (s.allies ?? []).filter((a) => a.hp > 0);
  return {
    overloads: s.overloadsThisTurn,
    timeline: s.timeline.length,
    allies: allies.length,
    alliesFallen: s.fallen?.length ?? 0,
    allyTopCost: content ? allies.reduce((sum, a) => sum + (a.draw[0] ? (content.cards[a.draw[0]]?.cost ?? 0) : 0), 0) : 0,
    foesAsleep: s.enemies.filter((e) => e.hp > 0 && e.asleep).length,
    halfAwakening: Math.floor((s.modifiers.awakeningStage ?? 0) / 2),
    cursesInDeck: content ? [...s.piles.hand, ...s.piles.draw, ...s.piles.discard].filter((c) => content.cards[c.cardId]?.rarity === 'curse').length : 0,
    devouredThisFight: s.devoured ?? 0,
    ...(content ? intentCounts(s, content) : {}),
    miles: s.miles ?? 0,
    toll: s.toll ?? 0,
    tollPaid: s.tollPaid ?? 0,
    lastPaid: s.lastPaid ?? 0,
  };
}

/** What the foes are about to do, for intent-reading cards (Mirrorborn). */
function intentCounts(s: CombatState, content: Content): Pick<AmountCounts, 'intentDamage' | 'allIntentDamage' | 'foesIntendingAttack'> {
  const intentDamage: Record<string, number> = {};
  let all = 0;
  let attacking = 0;
  for (const e of s.enemies) {
    if (e.hp <= 0) continue;
    const p = previewIntent(s, e, content);
    const dmg = (p.damage ?? 0) * (p.hits ?? 1);
    intentDamage[e.id] = dmg;
    all += dmg;
    if (p.kinds.includes('attack')) attacking++;
  }
  return { intentDamage, allIntentDamage: all, foesIntendingAttack: attacking };
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
  const raw = rawAmount(amount, source, target, counts);
  const whole = Math.floor(raw);
  return 'max' in amount && amount.max !== undefined ? Math.min(amount.max, whole) : whole;
}

function rawAmount(amount: Exclude<Amount, number>, source: Combatant, target: Combatant | undefined, counts: AmountCounts): number {
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
    case 'foesAsleep':
      return plus + (counts.foesAsleep ?? 0) * amount.times;
    case 'halfAwakening':
      return plus + (counts.halfAwakening ?? 0) * amount.times;
    case 'cursesInDeck':
      return plus + (counts.cursesInDeck ?? 0) * amount.times;
    case 'devouredThisFight':
      return plus + (counts.devouredThisFight ?? 0) * amount.times;
    case 'targetIntentDamage':
      return plus + (target ? (counts.intentDamage?.[target.id] ?? 0) : 0) * amount.times;
    case 'allIntentDamage':
      return plus + (counts.allIntentDamage ?? 0) * amount.times;
    case 'foesIntendingAttack':
      return plus + (counts.foesIntendingAttack ?? 0) * amount.times;
    case 'miles':
      return plus + (counts.miles ?? 0) * amount.times;
    case 'toll':
      return plus + (counts.toll ?? 0) * amount.times;
    case 'tollPaid':
      return plus + (counts.tollPaid ?? 0) * amount.times;
    case 'lastPaid':
      return plus + (counts.lastPaid ?? 0) * amount.times;
  }
}

export function resolveEffects(ctx: Ctx, effects: Effect[], sourceId: string, targetId: string | undefined): void {
  for (const effect of effects) {
    // Toll from the killing blow still counts after the fight is won (it carries on in the loop).
    const afterWin = ctx.s.phase === 'won' && (effect.kind === 'ifKilled' || effect.kind === 'gainToll');
    if (isOver(ctx.s) && !afterWin) return;
    const source = getCombatant(ctx.s, sourceId);
    if (!isAlive(source)) return;
    resolveEffect(ctx, effect, source, targetId);
  }
}

/** Who an effect with the given target keyword hits. */
function targetsFor(ctx: Ctx, keyword: 'self' | 'target' | 'allFoes' | 'asleepFoes', source: Combatant, targetId: string | undefined): Combatant[] {
  if (keyword === 'self') return [source];
  if (keyword === 'asleepFoes') return ctx.s.enemies.filter((e) => e.hp > 0 && e.asleep);
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
      gainWard(ctx, source, scaled(ctx, resolveAmount(effect.amount, source, targetId ? getCombatant(ctx.s, targetId) : undefined, countsOf(ctx.s, ctx.content))));
      return;
    case 'applyStatus': {
      // Shiftwright, Drowned: Bleed you apply to foes is 1 stronger.
      const drowned = effect.status === 'bleed' && isPlayer && effect.target !== 'self' && aspectActive(ctx.s, 'drowned') ? 1 : 0;
      for (const target of targetsFor(ctx, effect.target, source, targetId)) {
        addStatus(ctx, target, effect.status, scaled(ctx, resolveAmount(effect.amount, source, target, countsOf(ctx.s, ctx.content))) + drowned);
      }
      return;
    }
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
    case 'thresholdMod':
      lowerThresholds(ctx, effect.amount, !!effect.bossesOnly, effect.extraSleeps ?? 0);
      return;
    case 'addToDiscard': {
      // Enemies foul your deck for this fight (the card is a fight-only copy).
      if (!isEnemy(ctx.s, source.id)) return;
      for (let i = 0; i < (effect.count ?? 1); i++) ctx.s.piles.discard.push({ uid: `x${ctx.s.nextUid++}`, cardId: effect.cardId });
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
    case 'devour':
      devour(ctx, effect.count, effect.each, !!effect.permanent, targetId);
      return;
    case 'shuffleIn':
      shuffleIn(ctx, effect.cardId, effect.count ?? 1, effect.pile ?? 'draw');
      return;
    case 'mirrorIntent':
      for (let i = 0; i < (effect.times ?? 1); i++) mirror(ctx, effect.scale, effect.who ?? 'target', targetId);
      fireTriggers(ctx, 'mirrored', { targetId });
      return;
    case 'stealIntent':
      steal(ctx, effect.who ?? 'target', targetId);
      return;
    case 'attune': {
      const order: Aspect[] = ['drowned', 'fractured', 'choir'];
      const next = effect.aspect === 'next' ? order[(order.indexOf(ctx.s.aspect ?? 'choir') + 1) % 3] : effect.aspect;
      // Attuning to the Aspect you're already in changes nothing (and triggers nothing).
      if (ctx.s.aspect === next) return;
      ctx.s.aspect = next;
      ctx.events.push({ type: 'attuned', aspect: next });
      fireTriggers(ctx, 'attuned');
      return;
    }
    case 'aspectBoost':
      ctx.s.aspectBoost = true;
      return;
    case 'allAspects':
      // At fight start (turn 0) it covers the first turn.
      ctx.s.allAspectsTurn = Math.max(1, ctx.s.turn);
      return;
    case 'gainMiles':
      ctx.s.miles = (ctx.s.miles ?? 0) + effect.n;
      ctx.s.milesGained = (ctx.s.milesGained ?? 0) + effect.n;
      return;
    case 'gainToll': {
      const now = ctx.s.toll ?? 0;
      let n: number;
      if (effect.n === 'double') n = Math.min(now, effect.max ?? now);
      else {
        // Toll taken from a dead foe depends on its tier.
        const dead = targetId ? ctx.s.enemies.find((e) => e.id === targetId) : undefined;
        const tier = dead ? ctx.content.enemies[dead.defId]?.tier : undefined;
        n = tier === 'boss' ? (effect.boss ?? effect.n) : tier === 'elite' ? (effect.elite ?? effect.n) : effect.n;
      }
      if (n <= 0) return;
      ctx.s.toll = now + n;
      ctx.events.push({ type: 'toll', delta: n });
      return;
    }
    case 'pay': {
      const have = ctx.s.toll ?? 0;
      const cost = effect.amount === 'all' ? have : Math.max(1, effect.amount - (ctx.s.modifiers.payDiscount ?? 0));
      if (cost > 0 && have >= cost) {
        ctx.s.toll = have - cost;
        ctx.s.tollPaid = (ctx.s.tollPaid ?? 0) + cost;
        ctx.s.lastPaid = cost;
        ctx.events.push({ type: 'toll', delta: -cost });
        resolveEffects(ctx, effect.then, PLAYER_ID, targetId);
        fireTriggers(ctx, 'paid');
      } else if (effect.else) resolveEffects(ctx, effect.else, PLAYER_ID, targetId);
      return;
    }
    case 'ifKilled': {
      const target = targetId ? ctx.s.enemies.find((e) => e.id === targetId) : undefined;
      if (target && target.hp <= 0) resolveEffects(ctx, effect.then, PLAYER_ID, targetId);
      return;
    }
    case 'gainResonance':
      ctx.s.resonance += resolveAmount(effect.amount, source, undefined, countsOf(ctx.s, ctx.content));
      return;
    case 'draw':
      drawCards(ctx, resolveAmount(effect.amount, source, undefined, countsOf(ctx.s, ctx.content)));
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
    case 'targetAsleep': {
      const [target] = targetsFor(ctx, 'target', source, targetId);
      return !!(target as EnemyState | undefined)?.asleep;
    }
    case 'anyFoeAsleep':
      return ctx.s.enemies.some((e) => e.hp > 0 && e.asleep);
    case 'curseInHand':
      return ctx.s.piles.hand.some((c) => ctx.content.cards[c.cardId]?.rarity === 'curse');
    case 'targetIntends': {
      const [target] = targetsFor(ctx, 'target', source, targetId);
      return !!target && isEnemy(ctx.s, target.id) && intends(ctx, target as EnemyState, cond.intent);
    }
    case 'anyFoeIntends':
      return ctx.s.enemies.some((e) => e.hp > 0 && intends(ctx, e, cond.intent));
    case 'inAspect':
      return aspectActive(ctx.s, cond.aspect);
    case 'milesAtLeast':
      return (ctx.s.miles ?? 0) >= cond.n;
    case 'tollAtLeast':
      return (ctx.s.toll ?? 0) >= cond.n;
  }
}

/** Does this foe's shown intent include this kind of move? */
function intends(ctx: Ctx, enemy: EnemyState, intent: IntentClass): boolean {
  return previewIntent(ctx.s, enemy, ctx.content).kinds.includes(intent);
}

/** Does playing this card need the player to pick an enemy? */
export function needsTarget(effects: Effect[]): boolean {
  // Cards that read the target's intent or state need one too.
  const text = JSON.stringify(effects);
  if (/targetIntentDamage|targetIntends|targetAsleep|"kind":"ifKilled"/.test(text)) return true;
  return effects.some((e) => {
    if ((e.kind === 'mirrorIntent' || e.kind === 'stealIntent') && (e.who ?? 'target') === 'target') return true;
    if (e.kind === 'pay') return needsTarget(e.then) || needsTarget(e.else ?? []);
    if (e.kind === 'devour') return needsTarget(e.each);
    if (e.kind === 'if') return needsTarget(e.then) || needsTarget(e.else ?? []);
    if (e.kind === 'delay') return needsTarget(e.effects);
    if (e.kind === 'damage') return (e.target ?? 'target') === 'target';
    if (e.kind === 'applyStatus' || e.kind === 'removeStatus') return e.target === 'target';
    return false;
  });
}

// ───────────── Sin-Eater ─────────────

/** Eat curses from hand, leftmost first. Each one: resolve `each`, then fire 'devoured'. */
function devour(ctx: Ctx, count: number | 'all', each: Effect[], permanent: boolean, targetId: string | undefined): void {
  const s = ctx.s;
  let eaten = 0;
  for (;;) {
    if (count !== 'all' && eaten >= count) break;
    const i = s.piles.hand.findIndex((c) => ctx.content.cards[c.cardId]?.rarity === 'curse');
    if (i < 0 || isOver(s)) break;
    const [card] = s.piles.hand.splice(i, 1);
    s.piles.faded.push(card);
    s.devoured = (s.devoured ?? 0) + 1;
    // Absolution: gone from the run deck too (fight-only copies never were in it).
    if (permanent && !card.conjured) (s.purged ??= []).push(card.cardId);
    eaten++;
    ctx.events.push({ type: 'devoured', cardId: card.cardId });
    resolveEffects(ctx, each, PLAYER_ID, targetId);
    fireTriggers(ctx, 'devoured');
  }
}

/** Fight-only copies of a card (or a random curse) into the draw or discard pile. */
function shuffleIn(ctx: Ctx, cardId: string, count: number, pile: 'draw' | 'discard'): void {
  const s = ctx.s;
  const curses = Object.values(ctx.content.cards).filter((c) => c.rarity === 'curse').map((c) => c.id);
  for (let i = 0; i < count; i++) {
    const id = cardId === 'randomCurse' ? rngPick(s.rng, curses) : cardId;
    const card = { uid: `x${s.nextUid++}`, cardId: id, conjured: true };
    if (pile === 'discard') s.piles.discard.push(card);
    else s.piles.draw.splice(rngInt(s.rng, 0, s.piles.draw.length), 0, card);
  }
}

// ───────────── Mirrorborn ─────────────

/** Foes whose move can be mirrored (sleeping or robbed foes have none). */
function mirrorTargets(ctx: Ctx, who: 'target' | 'all', targetId: string | undefined): EnemyState[] {
  const alive = livingEnemies(ctx.s).filter((e) => !e.robbed && !(e.asleep && !e.waking));
  if (who === 'all') return alive;
  const t = alive.find((e) => e.id === targetId) ?? (targetId ? undefined : alive[0]);
  return t ? [t] : [];
}

/** Strip what can't be mirrored (an enemy fouling your deck). */
function mirrorable(effects: Effect[]): Effect[] {
  return effects
    .filter((e) => e.kind !== 'addToDiscard')
    .map((e) => (e.kind === 'if' ? { ...e, then: mirrorable(e.then), else: e.else ? mirrorable(e.else) : undefined } : e));
}

/**
 * Play a foe's shown move yourself. The same effect list works turned around:
 * its "target" (you) becomes your target (it), its "self" becomes you.
 */
function mirror(ctx: Ctx, scale: number, who: 'target' | 'all', targetId: string | undefined): void {
  const strength = scale * (1 + (ctx.s.modifiers.mirrorBonus ?? 0));
  for (const enemy of mirrorTargets(ctx, who, targetId)) {
    if (isOver(ctx.s)) return;
    const move = moveOf(enemy, ctx.content);
    const before = ctx.potency;
    ctx.potency = strength;
    ctx.events.push({ type: 'mirrored', enemyId: enemy.id });
    resolveEffects(ctx, mirrorable(move.effects), PLAYER_ID, enemy.id);
    ctx.potency = before;
  }
}

/** Mirror at 50%, then the foe loses that move. Bosses can't be robbed: Weakened 2 instead. */
function steal(ctx: Ctx, who: 'target' | 'all', targetId: string | undefined): void {
  const targets = mirrorTargets(ctx, who, targetId);
  for (const enemy of targets) {
    mirror(ctx, 0.5, 'target', enemy.id);
    if (enemy.hp <= 0 || isOver(ctx.s)) continue;
    if (ctx.content.enemies[enemy.defId]?.tier === 'boss') addStatus(ctx, enemy, 'weakened', 2);
    else {
      enemy.robbed = true;
      ctx.events.push({ type: 'robbed', enemyId: enemy.id });
    }
    fireTriggers(ctx, 'stole', { targetId: enemy.id });
  }
}
