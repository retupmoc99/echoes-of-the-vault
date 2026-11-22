/**
 * The content registry. To add content, add an entry to one of the lists
 * below (or a new file whose list is spread in here). No engine changes needed.
 */
import type { Content } from '../engine/types';
import { AWAKENING_CONTENT, AWAKENING_LORE } from './awakening';
import { RELIC_BREAKER_CARDS } from './cards/relicBreaker';
import { HOUR_THIEF_CARDS } from './cards/hourThief';
import { ECHO_CALLER_CARDS } from './cards/echoCaller';
import { SOMNANT_CARDS } from './cards/somnant';
import { SOMNANT } from './classes/somnant';
import { SOMNANT_RELICS } from './relics/somnant';
import { MIRRORBORN_CARDS } from './cards/mirrorborn';
import { PILGRIM_CARDS } from './cards/pilgrim';
import { SHIFTWRIGHT_CARDS } from './cards/shiftwright';
import { SIN_EATER_CARDS } from './cards/sinEater';
import { TOLLKEEPER_CARDS } from './cards/tollkeeper';
import { MIRRORBORN, PILGRIM, SHIFTWRIGHT, SIN_EATER, TOLLKEEPER } from './classes/wardens5';
import { MIRRORBORN_RELICS, PILGRIM_RELICS, SHIFTWRIGHT_RELICS, SIN_EATER_RELICS, TOLLKEEPER_RELICS } from './relics/wardens5';
import { ECHO_CALLER } from './classes/echoCaller';
import { HOUR_THIEF } from './classes/hourThief';
import { RELIC_BREAKER } from './classes/relicBreaker';
import { DEEP_CARDS, DEEP_ENCOUNTERS, DEEP_ENEMIES, DEEP_LORE, DEEP_RELICS } from './enemies/deep';
import { ENCOUNTERS, ENEMIES, WAKING_ENCOUNTERS, WAKING_ENEMIES } from './enemies/enemies';
import { AWAKENING_EVENTS, EVENTS } from './events/events';
import { IDLE_CONTENT } from './idle';
import { RELICS } from './relics/relics';
import { DEEDS } from './deeds';
import { OMENS } from './omens';
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
  classes: byId([RELIC_BREAKER, HOUR_THIEF, ECHO_CALLER, SOMNANT, SIN_EATER, MIRRORBORN, SHIFTWRIGHT, PILGRIM, TOLLKEEPER]),
  cards: byId([...RELIC_BREAKER_CARDS, ...HOUR_THIEF_CARDS, ...ECHO_CALLER_CARDS, ...SOMNANT_CARDS, ...SIN_EATER_CARDS, ...MIRRORBORN_CARDS, ...SHIFTWRIGHT_CARDS, ...PILGRIM_CARDS, ...TOLLKEEPER_CARDS, ...DEEP_CARDS]),
  relics: byId([...RELICS, ...DEEP_RELICS, ...SOMNANT_RELICS, ...SIN_EATER_RELICS, ...MIRRORBORN_RELICS, ...SHIFTWRIGHT_RELICS, ...PILGRIM_RELICS, ...TOLLKEEPER_RELICS]),
  enemies: byId([...ENEMIES, ...WAKING_ENEMIES, ...DEEP_ENEMIES]),
  encounters: byId([...ENCOUNTERS, ...WAKING_ENCOUNTERS, ...DEEP_ENCOUNTERS]),
  events: byId([...EVENTS, ...AWAKENING_EVENTS]),
  vaultShifts: byId(VAULT_SHIFTS),
  omens: byId(OMENS),
  deeds: byId(DEEDS),
  // Awakening lore shows in Fragments like Research lore, so it joins the same table.
  idle: { ...IDLE_CONTENT, lore: { ...IDLE_CONTENT.lore, ...byId(AWAKENING_LORE), ...byId(DEEP_LORE) } },
  awakening: AWAKENING_CONTENT,
};
