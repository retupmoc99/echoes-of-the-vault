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
  kits: [{ id: 'caller-standard', name: 'The Caller', description: 'Graves and shrouds, one name to call, one to whisper.', deck: STANDARD_DECK }],
  unlock: 'lantern-of-names',
  summary: 'Call your own Echoes into the fight. They play the decks they died with. Calling them wears them down.',
  flavor: 'A Warden who keeps every name the loop ever took, and says them aloud.',
};
