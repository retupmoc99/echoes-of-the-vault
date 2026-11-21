import type { WardenClassDef } from '../../engine/types';
import { BALANCE } from '../balance';
import { ECHO_CALLER_CARDS } from '../cards/echoCaller';

const repeat = (id: string, n: number) => Array.from({ length: n }, () => id);

const STANDARD_DECK = [...repeat('grave-strike', 4), ...repeat('shroud', 4), 'call-the-fallen', 'whispered-name'];

export const ECHO_CALLER: WardenClassDef = {
  id: 'echo-caller',
  name: 'Echo-Caller',
  maxHp: BALANCE.player.echoCallerMaxHp,
  starterDeck: STANDARD_DECK,
  starterRelics: ['lantern-of-names'],
  cardPool: ECHO_CALLER_CARDS.filter((c) => c.rarity !== 'starter').map((c) => c.id),
  lockedCards: ['gathering-dark', 'choir-of-the-lost', 'last-rites', 'final-chorus', 'memory-of-victory', 'hollow-choir'],
  // Grave relics, plus a few class-neutral ones from the vault.
  relicPool: [
    'bell-of-the-drowned',
    'ashen-locket',
    'choir-stone',
    'mourners-veil',
    'grave-ledger',
    'severed-thread',
    'lodestone-heart',
    'mirrorglass-ward',
    'ash-rosary',
  ],
  kits: [
    { id: 'caller-standard', name: 'The Caller', description: 'Graves and shrouds, one name to call, one to whisper.', deck: STANDARD_DECK },
    {
      id: 'shepherd',
      name: 'The Shepherd',
      description: 'Gathers its dead and shields them: Rally the Dead and Hymn of Iron in place of two Grave Strikes.',
      deck: [...repeat('grave-strike', 2), ...repeat('shroud', 4), 'rally-the-dead', 'hymn-of-iron', 'call-the-fallen', 'whispered-name'],
      unlock: 'kit-shepherd',
    },
    {
      id: 'mourner',
      name: 'The Mourner',
      description: 'Spends its dead: Release and Mourning in place of a Grave Strike and a Shroud.',
      deck: [...repeat('grave-strike', 3), ...repeat('shroud', 3), 'release', 'mourning', 'call-the-fallen', 'whispered-name'],
      unlock: 'kit-mourner',
    },
  ],
  unlock: 'lantern-of-names',
  summary: 'Call your own Echoes into the fight. They play the decks they died with. Calling them wears them down.',
  flavor: 'A Warden who keeps every name the loop ever took, and says them aloud.',
};
