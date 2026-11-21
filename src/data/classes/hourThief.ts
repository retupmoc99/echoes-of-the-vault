import type { WardenClassDef } from '../../engine/types';
import { BALANCE } from '../balance';
import { HOUR_THIEF_CARDS } from '../cards/hourThief';

const repeat = (id: string, n: number) => Array.from({ length: n }, () => id);

const STANDARD_DECK = [...repeat('second-hand', 4), ...repeat('stilled-moment', 4), 'slow-fuse', 'stolen-second'];

export const HOUR_THIEF: WardenClassDef = {
  id: 'hour-thief',
  name: 'Hour-Thief',
  maxHp: BALANCE.player.hourThiefMaxHp,
  starterDeck: STANDARD_DECK,
  starterRelics: ['cracked-hourglass'],
  cardPool: HOUR_THIEF_CARDS.filter((c) => c.rarity !== 'starter').map((c) => c.id),
  lockedCards: ['countdown', 'hour-bomb', 'chorus-of-moments', 'stitch-the-wound', 'temporal-shear', 'unmake-the-hour'],
  // Time relics, plus a few class-neutral ones from the vault.
  relicPool: [
    'stopped-clock',
    'gilded-gear',
    'reversed-compass',
    'last-breath-locket',
    'pendulum-of-ash',
    'thief-of-moments',
    'lodestone-heart',
    'mirrorglass-ward',
    'ash-rosary',
  ],
  kits: [
    { id: 'hour-standard', name: 'The Thief', description: 'Hands and moments, one fuse, one stolen second.', deck: STANDARD_DECK },
    {
      id: 'fuse-setter',
      name: 'The Fuse-Setter',
      description: 'Every blow arrives late, and sooner than they think: Patient Blade and Accelerate in place of a Second Hand and a Stilled Moment.',
      deck: [...repeat('second-hand', 3), ...repeat('stilled-moment', 3), 'patient-blade', 'accelerate', 'slow-fuse', 'stolen-second'],
      unlock: 'kit-fuse-setter',
    },
    {
      id: 'afterimage',
      name: 'The Afterimage',
      description: 'Everything happens twice: Afterimage and Repeating Edge in place of two Stilled Moments.',
      deck: [...repeat('second-hand', 4), ...repeat('stilled-moment', 2), 'afterimage', 'repeating-edge', 'slow-fuse', 'stolen-second'],
      unlock: 'kit-afterimage',
    },
  ],
  unlock: 'stolen-hour',
  summary: 'Delay blows, replay moments, pull cards back from the past. Patient, fragile, explosive.',
  flavor: 'A Warden who stole a handful of seconds from the loop, and spends them like coins.',
};
