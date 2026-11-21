import type { WardenClassDef } from '../../engine/types';
import { BALANCE } from '../balance';
import { RELIC_BREAKER_CARDS } from '../cards/relicBreaker';

const repeat = (id: string, n: number) => Array.from({ length: n }, () => id);

const STANDARD_DECK = [...repeat('shard-strike', 4), ...repeat('ward-sigil', 4), 'shatter-lens', 'overcharge'];

export const RELIC_BREAKER: WardenClassDef = {
  id: 'relic-breaker',
  name: 'Relic-Breaker',
  maxHp: BALANCE.player.relicBreakerMaxHp,
  starterDeck: STANDARD_DECK,
  starterRelics: ['cinder-core'],
  cardPool: RELIC_BREAKER_CARDS.filter((c) => c.rarity !== 'starter' && c.rarity !== 'curse').map((c) => c.id),
  // Bridges and odd payoffs arrive through Research, so the pool grows over time.
  lockedCards: ['scar-tissue', 'resonant-feedback', 'red-harvest', 'rampart-breaker', 'unbind', 'crack-the-seal'],
  relicPool: [
    'grieving-prism',
    'thorned-halo',
    'stilled-heart',
    'bone-abacus',
    'lodestone-heart',
    'ash-rosary',
    'mirrorglass-ward',
    'fault-engine',
    'hungering-eye',
    'grave-lantern',
  ],
  kits: [
    { id: 'standard', name: 'The Breaker', description: 'Strikes, Wards, one lens, one spark.', deck: STANDARD_DECK },
    {
      id: 'fault-walker',
      name: 'The Fault-Walker',
      description: 'Starts cracked: Twin Shards and Hollow Vow in place of a Strike and a Ward.',
      deck: [...repeat('shard-strike', 3), ...repeat('ward-sigil', 3), 'shatter-lens', 'twin-shards', 'hollow-vow', 'overcharge'],
      unlock: 'kit-fault-walker',
    },
    {
      id: 'bastion',
      name: 'The Bastion',
      description: 'Starts walled: Mirror Sigil and Bulwark Slam in place of the lens and a Strike.',
      deck: [...repeat('shard-strike', 3), ...repeat('ward-sigil', 4), 'mirror-sigil', 'bulwark-slam', 'overcharge'],
      unlock: 'kit-bastion',
    },
  ],
  flavor: 'They break what the ancients built, and are broken by it in turn.',
};
