/** Applies run-level effects (used by events). Every change is reported as a notice. */
import { BALANCE } from '../../data/balance';
import { rngInt, rngPick } from '../rng';
import type { Content, RunEffect, RunState } from '../types';
import { addCorruption, addCurse } from './corruption';
import { rollRelics } from './rewards';

export function applyRunEffects(r: RunState, effects: RunEffect[], content: Content, notices: string[]): void {
  for (const e of effects) applyRunEffect(r, e, content, notices);
}

function applyRunEffect(r: RunState, e: RunEffect, content: Content, notices: string[]): void {
  switch (e.kind) {
    case 'loseHp':
      // Events never kill outright; options that would are disabled (see events.ts).
      r.hp = Math.max(1, r.hp - e.amount);
      return;
    case 'heal':
      r.hp = Math.min(r.maxHp, r.hp + e.amount);
      return;
    case 'maxHp':
      r.maxHp = Math.max(1, r.maxHp + e.amount);
      r.hp = Math.min(r.maxHp, Math.max(1, r.hp + Math.max(0, e.amount)));
      return;
    case 'corruption':
      addCorruption(r, e.amount, content, notices);
      return;
    case 'addCard':
      r.deck.push(e.cardId);
      notices.push(`${content.cards[e.cardId].name} joins your deck.`);
      return;
    case 'addRandomCard': {
      const pool = r.cardPool.filter((id) => content.cards[id].rarity === e.rarity);
      if (!pool.length) return;
      const id = rngPick(r.rng, pool);
      r.deck.push(id);
      notices.push(`${content.cards[id].name} joins your deck.`);
      return;
    }
    case 'addCurse':
      addCurse(r, content, notices);
      return;
    case 'removeRandomCard':
      for (let i = 0; i < e.count && r.deck.length > BALANCE.shrine.minDeckSize; i++) {
        const [removed] = r.deck.splice(rngInt(r.rng, 0, r.deck.length - 1), 1);
        r.stats.cardsRemoved++;
        notices.push(`${content.cards[removed].name} is gone.`);
      }
      return;
    case 'removeChosenCard': {
      // The event screen then asks which cards; leaving waits until they're chosen.
      const count = Math.min(e.count, r.deck.length - BALANCE.shrine.minDeckSize);
      if (count > 0 && r.node?.kind === 'event') r.node.toRemove = (r.node.toRemove ?? 0) + count;
      return;
    }
    case 'gainRelic': {
      const [id] = rollRelics(r, content, 1, { allowTainted: true });
      if (!id) return;
      r.relics.push(id);
      notices.push(`You carry ${content.relics[id].name} now.`);
      addCorruption(r, content.relics[id].corruption ?? 0, content, notices);
      return;
    }
    case 'loseRandomRelic': {
      if (!r.relics.length) return;
      const id = rngPick(r.rng, r.relics);
      r.relics = r.relics.filter((x) => x !== id);
      notices.push(`${content.relics[id].name} is taken from you.`);
      return;
    }
  }
}
