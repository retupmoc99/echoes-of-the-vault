/**
 * Rules text generated from effect data.
 *
 * Why generate instead of hand-writing? The text can never drift from the
 * numbers, and with a `preview` it shows live values (Fracture, Weakened,
 * Exposed already applied), the way the hit will actually land.
 */
import { STATUS_INFO } from '../../data/statuses';
import { attackDamage } from '../combat/damage';
import { getCombatant, livingEnemies } from '../combat/context';
import { countsOf, resolveAmount } from '../combat/effects';
import type { Amount, CardDef, CardType, Combatant, CombatState, Condition, Effect, RelicDef, Trigger } from '../types';

export interface Preview {
  state: CombatState;
  targetId?: string;
}

const statusName = (id: keyof typeof STATUS_INFO) => STATUS_INFO[id].name;

const TYPE_NAMES: Record<CardType, string> = {
  strike: 'Strike',
  ward: 'Ward',
  overload: 'Overload',
  rite: 'Rite',
  temporal: 'Temporal',
  curse: 'Curse',
};

/** "3 Ward per curse", or for fractions "1 per 2 Miles". `unit` is the noun with a trailing space, or ''. */
function perText(times: number, unit: string, what: string): string {
  if (times >= 1) return `${times} ${unit}per ${what}`;
  const every = Math.round(1 / times);
  const plural = what === 'Mile' ? 'Miles' : what;
  return `1 ${unit}per ${every} ${plural}`;
}

function capText(a: Exclude<Amount, number>): string {
  return 'max' in a && a.max !== undefined ? ` (at most ${a.max})` : '';
}

function amountPhrase(a: Amount, noun: string): string {
  if (typeof a === 'number') return `${a} ${noun}`.trim();
  const times = a.times;
  const base = a.plus ? `${a.plus} ${noun}, plus ` : '';
  const unit = a.plus ? '' : `${noun} `;
  switch (a.per) {
    case 'selfWard':
      return times === 1 ? `${base}${unit}equal to your Ward` : `${base}${unit}equal to ${times}× your Ward`;
    case 'selfStatus':
      return `${base}${times} ${unit}per ${statusName(a.status)}`;
    case 'targetStatus':
      return times === 1
        ? `${base}${unit}equal to the target's ${statusName(a.status)}`
        : `${base}${times} ${unit}per ${statusName(a.status)} on the target`;
    case 'overloadsThisTurn':
      return `${base}${times} ${unit}per Overload this turn`;
    case 'timeline':
      return `${base}${times} ${unit}per delayed effect waiting`;
    case 'allies':
      return `${base}${times} ${unit}per ally`;
    case 'alliesFallen':
      return `${base}${times} ${unit}per ally fallen this fight`;
    case 'allyTopCost':
      return `${base}${times} ${unit}per cost of each ally's next card`;
    case 'foesAsleep':
      return `${base}${times} ${unit}per Asleep foe`;
    case 'halfAwakening':
      return `${base}${times} ${unit}per two Awakening stages`;
    case 'cursesInDeck':
      return `${base}${perText(times, unit, 'curse in your deck')}`;
    case 'devouredThisFight':
      return `${base}${perText(times, unit, 'curse eaten this fight')}`;
    case 'targetIntentDamage':
      return times === 1 ? `${base}${unit}equal to the target's intended damage${capText(a)}` : `${base}${times}× the target's intended damage${capText(a)}`;
    case 'allIntentDamage':
      return `${base}${unit}equal to all foes' intended damage${capText(a)}`;
    case 'foesIntendingAttack':
      return `${base}${perText(times, unit, 'foe intending to attack')}`;
    case 'miles':
      return `${base}${perText(times, unit, 'Mile')}${capText(a)}`;
    case 'toll':
      return `${base}${perText(times, unit, 'Toll you hold')}${capText(a)}`;
    case 'tollPaid':
      return `${base}${perText(times, unit, 'Toll paid this fight')}`;
    case 'lastPaid':
      return `${base}${perText(times, unit, 'Toll paid')}`;
  }
}

/** Damage sentence, with the live number when previewing. */
function damageText(e: Extract<Effect, { kind: 'damage' }>, preview?: Preview): string {
  const allFoes = e.target === 'allFoes';
  const hits = e.hits && e.hits > 1 ? ` ×${e.hits}` : '';
  const suffix = allFoes ? ' to all foes' : e.target === 'asleepFoes' ? ' to every Asleep foe' : '';

  if (!preview) {
    const core = typeof e.amount === 'number' ? `${e.amount}` : amountPhrase(e.amount, 'damage');
    return `Deal ${core}${hits}${suffix}.`;
  }

  const s = preview.state;
  const target = (preview.targetId && getCombatant(s, preview.targetId)) || livingEnemies(s)[0] || dummy();
  const final = attackDamage(s, s.player, target, resolveAmount(e.amount, s.player, target, countsOf(s)));
  return `Deal ${final}${hits}${suffix}.`;
}

function dummy(): Combatant {
  return { id: 'dummy', hp: 1, maxHp: 1, ward: 0, statuses: {} };
}

const INTENT_WORDS = { attack: 'to attack', defend: 'to defend', debuff: 'a debuff', buff: 'to buff itself' } as const;
const ASPECT_NAMES = { drowned: 'Drowned', fractured: 'Fractured', choir: 'Choir' } as const;

function conditionText(c: Condition): string {
  switch (c.kind) {
    case 'overloadedThisTurn':
      return 'If you Overloaded this turn';
    case 'selfStatusAtLeast':
      return `If you have ${c.n}+ ${statusName(c.status)}`;
    case 'targetHasStatus':
      return `If the target has ${statusName(c.status)}`;
    case 'allyFellThisFight':
      return 'If an ally fell this fight';
    case 'targetAsleep':
      return 'If the target is Asleep';
    case 'anyFoeAsleep':
      return 'If any foe is Asleep';
    case 'curseInHand':
      return 'If you hold a curse';
    case 'targetIntends':
      return `If the target intends ${INTENT_WORDS[c.intent]}`;
    case 'anyFoeIntends':
      return `If any foe intends ${INTENT_WORDS[c.intent]}`;
    case 'inAspect':
      return `In ${ASPECT_NAMES[c.aspect]}`;
    case 'milesAtLeast':
      return `With ${c.n}+ Miles`;
    case 'tollAtLeast':
      return `With ${c.n}+ Toll`;
  }
}

function effectText(e: Effect, preview?: Preview): string {
  switch (e.kind) {
    case 'damage':
      return damageText(e, preview);
    case 'ward':
      return typeof e.amount === 'number' ? `Gain ${e.amount} Ward.` : `Gain ${amountPhrase(e.amount, 'Ward')}.`;
    case 'applyStatus': {
      const name = statusName(e.status);
      const amt = typeof e.amount === 'number' ? `${e.amount} ${name}` : amountPhrase(e.amount, name);
      if (e.target === 'self') return `Gain ${amt}.`;
      return `Apply ${amt}${e.target === 'allFoes' ? ' to all foes' : ''}.`;
    }
    case 'removeStatus':
      return e.target === 'self' ? `Lose all ${statusName(e.status)}.` : `Remove all ${statusName(e.status)} from the target.`;
    case 'loseHp':
      return `Lose ${e.amount} HP.`;
    case 'gainResonance':
      return typeof e.amount === 'number' ? `Gain ${e.amount} Resonance.` : `Gain ${amountPhrase(e.amount, 'Resonance')}.`;
    case 'draw':
      return typeof e.amount === 'number' ? `Draw ${e.amount}.` : `Draw ${amountPhrase(e.amount, '')}.`;
    case 'overloadRelic':
      return e.which === 'all' ? 'Overload every relic.' : 'Overload a random relic.';
    case 'clearStrain':
      return 'Your relics shed all Strain.';
    case 'retainWard':
      return 'Your Ward no longer fades.';
    case 'clearWard':
      return 'Lose all Ward.';
    case 'delay':
      // Shown with base numbers: the live modifiers may differ when it lands.
      return `In ${e.turns} turn${e.turns === 1 ? '' : 's'}: ${describeEffects(e.effects)}`;
    case 'hasten':
      return `Your delayed effects arrive ${e.turns} turn${e.turns === 1 ? '' : 's'} sooner.`;
    case 'rewind':
      return e.count === 1
        ? 'Return the last card in your discard pile to your hand.'
        : `Return the last ${e.count} cards in your discard pile to your hand.`;
    case 'thresholdMod':
      return `This fight, ${e.bossesOnly ? 'bosses fall' : 'foes fall'} Asleep at ${e.amount} less Drowse${e.extraSleeps ? '; the Sleeper can be slept twice' : ''}.`;
    case 'addToDiscard':
      // Card names are title-cased ids (smoke → Smoke); describe has no content to look them up.
      return `Put ${e.count ?? 1} ${e.cardId.replace(/(^|-)(\w)/g, (_, d, c) => (d ? ' ' : '') + c.toUpperCase())} into your discard pile.`;
    case 'recall':
      return e.free
        ? 'Choose a card in your discard pile. Return it to your hand. It costs 0 this turn.'
        : 'Choose a card in your discard pile. Return it to your hand.';
    case 'call':
      return e.count === 1 ? 'Call an Echo.' : `Call ${e.count} Echoes.`;
    case 'allyAct':
      return e.who === 'all' ? 'Every ally acts now.' : 'Your newest ally acts now.';
    case 'allies':
      return `Allies: ${describeEffects(e.effects).replace(/^Gain/, 'gain')}`;
    case 'newestAlly':
      return `Your newest ally: ${describeEffects(e.effects).replace(/^Gain/, 'gain').replace(/^Lose/, 'lose')}`;
    case 'guard':
      return 'Your newest ally Guards you until your next turn.';
    case 'releaseAlly': {
      const who = e.who === 'all' ? 'Every ally fades' : 'Your newest ally fades';
      return e.damage === 'hp' ? `${who}, dealing its HP to all foes.` : `${who}, each dealing ${e.damage} to all foes.`;
    }
    case 'playAllyTop':
      return e.count === 1 ? "Play the top card of your newest ally's deck." : `Play the top ${e.count} cards of your newest ally's deck.`;
    case 'empowerAllies': {
      const parts: string[] = [];
      if (e.acts) parts.push(`allies act ${e.acts === 2 ? 'twice' : `${e.acts} times`} a turn`);
      if (e.hpLoss) parts.push(`they lose ${e.hpLoss} HP each time`);
      return `This fight, ${parts.join(', but ')}.`;
    }
    case 'devour': {
      const each = describeEffects(e.each, preview);
      if (e.count === 1) return `Devour: ${each}`;
      const many = e.count === 'all' ? 'every curse in hand' : `up to ${e.count} curses`;
      return `Devour ${many}${e.permanent ? ', removing them from your deck for good' : ''}. Each one: ${each.replace(/^\w/, (c) => c.toLowerCase())}`;
    }
    case 'shuffleIn': {
      const what = e.cardId === 'randomCurse' ? (e.count ?? 1) === 1 ? 'a random curse' : `${e.count} random curses` : `${e.count ?? 1} ${e.cardId}`;
      return `Shuffle ${what} into your ${e.pile === 'discard' ? 'discard' : 'draw'} pile.`;
    }
    case 'mirrorIntent': {
      const whose = e.who === 'all' ? "every enemy's intent" : "the target's intent";
      const times = e.times && e.times > 1 ? `, ${e.times === 2 ? 'twice' : `${e.times} times`}` : '';
      return `Mirror ${whose} at ${Math.round(e.scale * 100)}%${times}.`;
    }
    case 'stealIntent':
      return e.who === 'all' ? "Steal every enemy's intent." : "Steal the target's intent.";
    case 'attune':
      return e.aspect === 'next' ? 'Attune to the next Aspect.' : `Attune ${ASPECT_NAMES[e.aspect]}.`;
    case 'aspectBoost':
      return "Your Aspect's effect is doubled for the rest of the fight.";
    case 'allAspects':
      return 'Until the end of the turn, you count as in every Aspect.';
    case 'gainMiles':
      return `Gain ${e.n} Mile${e.n === 1 ? '' : 's'}.`;
    case 'gainToll':
      return e.n === 'double' ? `Double your Toll${e.max ? ` (at most +${e.max})` : ''}.` : `Gain ${e.n} Toll.`;
    case 'pay': {
      const then = describeEffects(e.then, preview);
      const otherwise = e.else?.length ? ` Otherwise, ${describeEffects(e.else, preview).replace(/^\w/, (c) => c.toLowerCase())}` : '';
      return e.amount === 'all' ? `Pay all your Toll. ${then}` : `Pay ${e.amount}: ${then.replace(/^\w/, (c) => c.toLowerCase())}${otherwise}`;
    }
    case 'ifKilled':
      return `If this kills, ${describeEffects(e.then, preview).replace(/^\w/, (c) => c.toLowerCase())}`;
    case 'if': {
      const then = describeEffects(e.then, preview);
      const otherwise = e.else?.length ? ` Otherwise: ${describeEffects(e.else, preview)}` : '';
      return `${conditionText(e.cond)}: ${then}${otherwise}`;
    }
  }
}

export function describeEffects(effects: Effect[], preview?: Preview): string {
  return effects.map((e) => effectText(e, preview)).join(' ');
}

export function describeCard(def: CardDef, preview?: Preview): string {
  const parts: string[] = [];
  if (def.unplayable) parts.push('Unplayable.');
  parts.push(def.text ?? describeEffects(def.effects, preview));
  if (def.inHandAtTurnEnd) parts.push(`If held at end of turn: ${describeEffects(def.inHandAtTurnEnd)}`);
  if (def.echo) parts.push('Echo.');
  if (def.fade) parts.push('Fade.');
  return parts.filter(Boolean).join(' ');
}

function triggerPrefix(t: Trigger): string {
  switch (t.on) {
    case 'combatStart':
      return 'When a fight begins';
    case 'turnStart':
      return 'At the start of your turn';
    case 'turnEnd':
      return 'At the end of your turn';
    case 'cardPlayed':
      return t.cardType ? `Whenever you play a ${TYPE_NAMES[t.cardType]}` : 'Whenever you play a card';
    case 'gainedStatus':
      return t.status ? `Whenever you gain ${statusName(t.status)}` : 'Whenever you gain a status';
    case 'delayFired':
      return 'Whenever a delayed effect lands';
    case 'allyCalled':
      return 'Whenever you Call an Echo';
    case 'allyFell':
      return 'Whenever an ally falls';
    case 'foeSlept':
      return 'Whenever a foe falls Asleep';
    case 'foeWoke':
      return 'Whenever a foe wakes';
    case 'devoured':
      return 'Whenever you Devour';
    case 'mirrored':
      return 'Whenever you Mirror';
    case 'stole':
      return 'Whenever you Steal';
    case 'attuned':
      return t.oncePerTurn ? 'The first time you Attune each turn' : 'Whenever you Attune';
    case 'foeDied':
      return 'Whenever a foe dies';
    case 'paid':
      return t.oncePerTurn ? 'The first time you Pay each turn' : 'Whenever you Pay';
  }
}

export function describeRelic(def: RelicDef): { passive?: string; overload?: string } {
  const passive = [def.text, ...(def.passive ?? []).map((t) => `${triggerPrefix(t)}: ${describeEffects(t.effects)}`)].filter(Boolean).join(' ');
  const overload = def.overload ? describeEffects(def.overload) : undefined;
  return { passive: passive || undefined, overload };
}
