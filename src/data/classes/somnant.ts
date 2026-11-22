import type { WardenClassDef } from '../../engine/types';
import { BALANCE } from '../balance';
import { SOMNANT_CARDS } from '../cards/somnant';

const repeat = (id: string, n: number) => Array.from({ length: n }, () => id);

const STANDARD_DECK = [...repeat('dull-blade', 4), ...repeat('veil-of-sleep', 4), 'lullaby', 'nightfall-cut'];

export const SOMNANT: WardenClassDef = {
  id: 'somnant',
  name: 'Somnant',
  maxHp: BALANCE.player.somnantMaxHp,
  starterDeck: STANDARD_DECK,
  starterRelics: ['sleepers-hum'],
  cardPool: SOMNANT_CARDS.filter((c) => c.rarity !== 'starter').map((c) => c.id),
  lockedCards: ['lucid-strike', 'slumber-ward', 'undertow-hymn', 'dreamwalk', 'long-night', 'eternal-lullaby'],
  // Dream relics, plus a few class-neutral ones from the vault.
  relicPool: ['moth-lantern', 'pillow-stone', 'cracked-music-box', 'dream-catcher', 'nightcap', 'lethe-vial', 'the-last-lullaby', 'lodestone-heart', 'mirrorglass-ward', 'ash-rosary'],
  kits: [
    { id: 'somnant-standard', name: 'The Somnant', description: 'Dull blades and grey veils, one lullaby, one nightfall cut.', deck: STANDARD_DECK },
    {
      id: 'lullaby',
      name: 'The Lullaby',
      description: 'Sleep the whole room: Cradle Song and Heavy Eyelids in place of two Dull Blades.',
      deck: [...repeat('dull-blade', 2), ...repeat('veil-of-sleep', 4), 'cradle-song', 'heavy-eyelids', 'lullaby', 'nightfall-cut'],
      unlock: 'kit-lullaby',
    },
    {
      id: 'night-knife',
      name: 'The Night-Knife',
      description: 'One target, one long dream: Dreamless Edge and Whisper Down in place of a Dull Blade and a Veil of Sleep.',
      deck: [...repeat('dull-blade', 3), ...repeat('veil-of-sleep', 3), 'dreamless-edge', 'whisper-down', 'lullaby', 'nightfall-cut'],
      unlock: 'kit-night-knife',
    },
  ],
  unlock: 'sleepers-hymnal',
  deed: 'you-hear-it-dreaming',
  summary: 'Sing foes to sleep so they skip their turn, then strike while they dream. Grows stronger as the Sleeper stirs.',
  flavor: 'A Warden who learned the Sleeper’s lullaby, and hums it to everything.',
};
