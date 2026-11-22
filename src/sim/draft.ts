/**
 * How the balance bot drafts reward cards.
 *
 * The old bot took the rarest card every time, and that made it win *more*
 * with no card rewards at all: rare cards are often build-arounds that dilute
 * a deck that isn't built around them. This drafter does what a sensible
 * player does instead:
 *
 * 1. Rough value: a card's effects turned into "points" (damage, Ward, draw,
 *    Resonance, statuses...), divided by its cost. Scaling amounts use a
 *    typical mid-loop value (3 curses, 8 Miles, 10 intended damage...).
 * 2. Synergy: a bonus for each card already in the deck with its archetype.
 * 3. Role: a bonus when the deck is short of Ward (or of damage).
 * 4. Discipline: only take a card that beats the deck's average by a margin
 *    that grows with deck size; otherwise skip. Thin decks win.
 */
import type { Amount, CardDef, Content, Effect, RunState } from '../engine';

/** A typical value for each scaling amount, mid-loop. */
const TYPICAL: Record<string, number> = {
  cursesInDeck: 3, devouredThisFight: 2, targetIntentDamage: 10, allIntentDamage: 14, foesIntendingAttack: 1.5,
  miles: 8, toll: 5, tollPaid: 3, lastPaid: 3, selfStatus: 3, targetStatus: 3, selfWard: 8, overloadsThisTurn: 1,
  timeline: 1, allies: 1.5, alliesFallen: 0.5, allyTopCost: 1, foesAsleep: 0.7, halfAwakening: 0,
};

function amount(a: Amount): number {
  if (typeof a === 'number') return a;
  const v = (a.plus ?? 0) + Math.floor(a.times * (TYPICAL[a.per] ?? 2));
  return 'max' in a && a.max !== undefined ? Math.min(a.max, v) : v;
}

const STATUS_VALUE: Record<string, number> = { weakened: 3, exposed: 3, bleed: 1.5, drowse: 1.5, fracture: 2 };

/** Rough "points" an effect list is worth when played. */
export function effectsValue(effects: Effect[]): number {
  let v = 0;
  for (const e of effects) {
    switch (e.kind) {
      case 'damage': v += amount(e.amount) * (e.hits ?? 1) * (e.target === 'allFoes' ? 1.6 : 1); break;
      case 'ward': v += amount(e.amount) * 0.9; break;
      case 'applyStatus': v += e.target === 'self' ? 1 : amount(e.amount) * (STATUS_VALUE[e.status] ?? 2); break;
      case 'draw': v += amount(e.amount) * 3; break;
      case 'gainResonance': v += amount(e.amount) * 4; break;
      case 'loseHp': v -= e.amount; break;
      case 'delay': v += effectsValue(e.effects) * 0.8; break;
      case 'if': v += Math.max(effectsValue(e.then), 0) * 0.6 + Math.max(effectsValue(e.else ?? []), 0) * 0.4; break;
      case 'devour': v += effectsValue(e.each) * (e.count === 'all' ? 1.5 : Math.min(e.count, 2)) * 0.7; break;
      case 'pay': v += effectsValue(e.then) * 0.7 + effectsValue(e.else ?? []) * 0.3; break;
      case 'ifKilled': v += effectsValue(e.then) * 0.4; break;
      case 'mirrorIntent': v += e.scale * 10 * (e.who === 'all' ? 1.6 : 1) * (e.times ?? 1); break;
      case 'stealIntent': v += e.who === 'all' ? 14 : 8; break;
      case 'call': v += 6 * e.count; break;
      case 'allyAct': v += e.who === 'all' ? 6 : 4; break;
      case 'gainMiles': v += 1.5 * e.n; break;
      case 'gainToll': v += 2; break;
      case 'rewind': v += 3 * e.count; break;
      case 'shuffleIn': break;
      default: v += 2;
    }
  }
  return v;
}

/** Value per Resonance spent, adjusted for Echo and Fade. */
export function cardValue(def: CardDef): number {
  if (def.type === 'curse' || def.unplayable) return -4;
  let v = effectsValue(def.effects);
  if (def.echo) v *= 1.6;
  if (def.fade) v *= 0.85;
  return v / Math.max(def.cost, 0.6);
}

function hasKind(effects: Effect[], kinds: string[]): boolean {
  return effects.some((e) => kinds.includes(e.kind) || ('then' in e && hasKind(e.then, kinds)) || ('effects' in e && Array.isArray(e.effects) && hasKind(e.effects, kinds)));
}

/**
 * The index of the card to take, 'tainted', or -1 to skip. The tainted card is
 * only considered when `tainted` is given (the Sin-Eater, which pays in curses:
 * worth a small bonus to it, since curses feed Devour and Burden).
 */
export function draftPick(r: RunState, offered: string[], content: Content, tainted?: string): number | 'tainted' {
  const deck = r.deck.map((id) => content.cards[id]).filter(Boolean);
  const playable = deck.filter((d) => d.type !== 'curse');
  const avg = playable.reduce((s, d) => s + cardValue(d), 0) / Math.max(1, playable.length);
  const wards = playable.filter((d) => d.type === 'ward').length / Math.max(1, playable.length);
  const strikes = playable.filter((d) => d.type === 'strike').length / Math.max(1, playable.length);

  const score = (def: CardDef): number => {
    let s = cardValue(def);
    if (def.archetype) {
      const same = deck.filter((d) => d.rarity !== 'starter' && d.archetype === def.archetype).length;
      s += Math.min(same, 3);
    }
    if (wards < 0.3 && hasKind(def.effects, ['ward'])) s += 1.5;
    if (strikes < 0.3 && hasKind(def.effects, ['damage'])) s += 1.5;
    return s;
  };

  let best: number | 'tainted' = -1;
  let bestScore = -Infinity;
  offered.forEach((id, i) => {
    const s = score(content.cards[id]);
    if (s > bestScore) [best, bestScore] = [i, s];
  });
  if (tainted) {
    const s = score(content.cards[tainted]) + 1;
    if (s > bestScore) [best, bestScore] = ['tainted', s];
  }
  // Bigger decks need a better card to be worth the dilution.
  const margin = Math.max(0, (playable.length - 10) * 0.15);
  return bestScore >= avg + margin ? best : -1;
}
