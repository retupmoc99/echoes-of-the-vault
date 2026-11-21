/** Text events: grim choices, each with a cost. */
import { BALANCE } from '../../data/balance';
import { rngPick, rngWeighted } from '../rng';
import type { Content, EventOption, RunEffect, RunState } from '../types';
import { applyRunEffects } from './runEffects';

/** A random event the player hasn't seen this loop (repeats only if all are used up). */
export function pickEvent(r: RunState, row: number, content: Content): string {
  const eligible = Object.values(content.events).filter((e) => (e.minRow ?? 0) <= row && (e.minAwakening ?? 0) <= r.awakeningStage);
  const fresh = eligible.filter((e) => !r.seenEvents.includes(e.id));
  const pool = fresh.length ? fresh : eligible;
  return rngPick(r.rng, pool).id;
}

/**
 * Whether an option can be chosen. Options that could kill you, take a relic
 * you don't have, or thin the deck below its floor are disabled, not hidden:
 * you see what you cannot afford.
 */
export function optionAvailable(r: RunState, option: EventOption): boolean {
  const effects: RunEffect[] = option.outcomes.flatMap((o) => o.effects);
  for (const e of effects) {
    if (e.kind === 'loseHp' && r.hp <= e.amount) return false;
    if (e.kind === 'maxHp' && e.amount < 0 && r.maxHp + e.amount < 10) return false;
    if (e.kind === 'loseRandomRelic' && r.relics.length === 0) return false;
    if (e.kind === 'removeRandomCard' && r.deck.length - e.count < BALANCE.shrine.minDeckSize) return false;
  }
  return true;
}

export function resolveOption(r: RunState, index: number, content: Content, notices: string[]): string | undefined {
  const node = r.node;
  if (node?.kind !== 'event') return 'There is no event here.';
  if (node.resolved) return 'That choice is made.';
  const option = content.events[node.eventId].options[index];
  if (!option) return 'No such choice.';
  if (!optionAvailable(r, option)) return 'You cannot pay that price.';

  // Pick one outcome by weight (most options have exactly one).
  const weights: Record<string, number> = {};
  option.outcomes.forEach((o, i) => (weights[String(i)] = o.weight ?? 1));
  const outcome = option.outcomes[Number(rngWeighted(r.rng, weights))];

  applyRunEffects(r, outcome.effects, content, notices);
  node.resolved = { optionIndex: index, text: outcome.text };
  return undefined;
}
