/**
 * The content registry. To add content, add an entry to one of the lists
 * below (or a new file whose list is spread in here). No engine changes needed.
 */
import type { Content } from '../engine/types';
import { RELIC_BREAKER_CARDS } from './cards/relicBreaker';
import { RELIC_BREAKER } from './classes/relicBreaker';
import { ENCOUNTERS, ENEMIES } from './enemies/enemies';
import { EVENTS } from './events/events';
import { IDLE_CONTENT } from './idle';
import { RELICS } from './relics/relics';
import { VAULT_SHIFTS } from './vaultShifts';

function byId<T extends { id: string }>(items: T[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const item of items) {
    if (out[item.id]) throw new Error(`Duplicate content id: ${item.id}`);
    out[item.id] = item;
  }
  return out;
}

export const CONTENT: Content = {
  classes: byId([RELIC_BREAKER]),
  cards: byId(RELIC_BREAKER_CARDS),
  relics: byId(RELICS),
  enemies: byId(ENEMIES),
  encounters: byId(ENCOUNTERS),
  events: byId(EVENTS),
  vaultShifts: byId(VAULT_SHIFTS),
  idle: IDLE_CONTENT,
};
