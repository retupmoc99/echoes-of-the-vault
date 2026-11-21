/**
 * Time mechanics (the Hour-Thief's toolkit, usable by any card):
 *
 * - Delay:  effects wait on the timeline and resolve at the start of a
 *           later turn. "In 2 turns" played on turn 3 lands at the start of turn 5.
 * - Hasten: brings every waiting effect closer; any that reach 0 land now.
 * - Echo:   a played Echo card sends a fading copy back to hand next turn.
 *           Copies vanish when played or when the turn ends.
 * - Rewind: returns the most recent cards from the discard pile to hand.
 */
import { BALANCE } from '../../data/balance';
import type { Effect, TimelineEntry } from '../types';
import { PLAYER_ID, isOver, livingEnemies, type Ctx } from './context';
import { resolveEffects } from './effects';
import { fireTriggers } from './relics';

function nextUid(ctx: Ctx, prefix: string): string {
  return `${prefix}${ctx.s.nextUid++}`;
}

export function queueDelay(ctx: Ctx, effects: Effect[], turns: number, targetId: string | undefined): void {
  const entry: TimelineEntry = {
    id: nextUid(ctx, 't'),
    turnsLeft: Math.max(1, turns),
    effects,
    sourceCardId: ctx.sourceCardId ?? 'unknown',
    targetId,
  };
  ctx.s.timeline.push(entry);
  ctx.events.push({ type: 'delayQueued', entryId: entry.id, turns: entry.turnsLeft });
}

/** Move the timeline forward by `turns` and resolve everything that is due, oldest first. */
export function advanceTimeline(ctx: Ctx, turns: number): void {
  const s = ctx.s;
  for (const entry of s.timeline) entry.turnsLeft -= turns;
  const due = s.timeline.filter((e) => e.turnsLeft <= 0);
  // Remove before resolving, so effects that touch the timeline see a consistent state.
  s.timeline = s.timeline.filter((e) => e.turnsLeft > 0);
  for (const entry of due) {
    if (isOver(s)) return;
    const alive = livingEnemies(s);
    const target = alive.find((e) => e.id === entry.targetId)?.id ?? alive[0]?.id;
    ctx.events.push({ type: 'delayFired', entryId: entry.id, targetId: target });
    const previous = ctx.sourceCardId;
    ctx.sourceCardId = entry.sourceCardId;
    resolveEffects(ctx, entry.effects, PLAYER_ID, target);
    ctx.sourceCardId = previous;
    if (!isOver(s)) fireTriggers(ctx, 'delayFired');
  }
}

export function queueEcho(ctx: Ctx, cardId: string): void {
  ctx.s.echoQueue.push({ uid: nextUid(ctx, 'echo'), cardId, ephemeral: true });
}

/** Echo copies join the hand at the start of the turn (hand limit still applies). */
export function returnEchoes(ctx: Ctx): void {
  const s = ctx.s;
  let count = 0;
  for (const card of s.echoQueue) {
    if (s.piles.hand.length >= BALANCE.player.maxHandSize) break;
    s.piles.hand.push(card);
    count++;
  }
  s.echoQueue = [];
  if (count) ctx.events.push({ type: 'echoReturned', count });
}

export function rewind(ctx: Ctx, count: number): void {
  const piles = ctx.s.piles;
  let moved = 0;
  for (let i = 0; i < count && piles.discard.length && piles.hand.length < BALANCE.player.maxHandSize; i++) {
    piles.hand.push(piles.discard.pop()!);
    moved++;
  }
  if (moved) ctx.events.push({ type: 'rewound', count: moved });
}
