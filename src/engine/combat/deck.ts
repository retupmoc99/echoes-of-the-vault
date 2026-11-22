import { BALANCE } from '../../data/balance';
import { rngShuffle } from '../rng';
import type { CardDef, CardInstance, CombatModifiers } from '../types';
import type { Ctx } from './context';

/** What a card in hand costs right now: Rewrite can make it free; the Clockwork Omen sets every cost. */
export function cardCost(card: CardInstance, def: CardDef, mods?: Partial<CombatModifiers>): number {
  if (card.freeThisTurn) return 0;
  return mods?.costOverride ?? def.cost;
}

/** Draw up to `count` cards, reshuffling the discard pile when the draw pile runs out. */
export function drawCards(ctx: Ctx, count: number): void {
  const piles = ctx.s.piles;
  let drawn = 0;
  for (let i = 0; i < count; i++) {
    if (piles.hand.length >= BALANCE.player.maxHandSize) break;
    if (piles.draw.length === 0) {
      if (piles.discard.length === 0) break;
      piles.draw = rngShuffle(ctx.s.rng, piles.discard);
      piles.discard = [];
      ctx.events.push({ type: 'shuffle' });
    }
    // The top of the draw pile is the end of the array.
    piles.hand.push(piles.draw.pop()!);
    drawn++;
  }
  if (drawn > 0) ctx.events.push({ type: 'draw', count: drawn });
}

export function discardHand(ctx: Ctx): void {
  const piles = ctx.s.piles;
  // Unplayed Echo copies fade instead of going to the discard pile.
  // A free-this-turn card stops being free once it leaves the hand.
  piles.discard.push(...piles.hand.filter((c) => !c.ephemeral).map(({ freeThisTurn: _, ...c }) => c));
  piles.hand = [];
}
