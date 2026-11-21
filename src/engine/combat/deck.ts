import { BALANCE } from '../../data/balance';
import { rngShuffle } from '../rng';
import type { Ctx } from './context';

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
  piles.discard.push(...piles.hand);
  piles.hand = [];
}
