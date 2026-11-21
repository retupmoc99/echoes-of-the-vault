/**
 * Idle-layer content: Echo traits and names, Outpost works, Research and lore.
 */
import type { IdleContent, LoreFragment } from '../engine/types';

const LORE: LoreFragment[] = [
  {
    id: 'lore-first-door',
    title: 'The First Door',
    text: 'They did not build the vault to keep things out. Every lock faces inward.',
  },
  {
    id: 'lore-wardens',
    title: 'On Wardens',
    text: 'There were many of us once. The loop keeps only one. The others are what you fight.',
  },
  {
    id: 'lore-relics',
    title: 'What Relics Are',
    text: 'Each relic holds a voice. Overload it and you hear the voice. Break it and you hear it stop.',
  },
  {
    id: 'lore-corruption',
    title: 'The Price',
    text: 'The vault does not take. It trades. It simply never tells you the rate.',
  },
  {
    id: 'lore-echoes',
    title: 'Echoes',
    text: 'An Echo is what remains when a loop forgets itself. They work because they do not know how to stop.',
  },
  {
    id: 'lore-below',
    title: 'Below the Lock',
    text: 'Something sleeps under the last door. It is not dead. It is counting loops, as you are.',
  },
  {
    id: 'lore-stolen-hour',
    title: 'The Stolen Hour',
    text: 'One Warden refused the loop and cut a single hour out of it. The vault has been searching for that hour ever since.',
  },
  {
    id: 'lore-sand',
    title: 'Sand',
    text: 'The hourglasses here run on the dust of the ancients. Turn one over and you can hear them breathe.',
  },
];

export const IDLE_CONTENT: IdleContent = {
  traits: [
    {
      id: 'unbroken',
      name: 'Unbroken',
      description: 'Escaped the loop. Holds together far longer.',
      when: [{ stat: 'victory', min: 1 }],
      mods: { stabilityMult: 1.3 },
    },
    {
      id: 'ravenous',
      name: 'Ravenous',
      description: 'Drank deep of Corruption. Digs hungrily, burns out fast.',
      when: [{ stat: 'peakCorruption', min: 6 }],
      mods: { digMult: 1.5, drainMult: 1.3 },
    },
    {
      id: 'haunted',
      name: 'Haunted',
      description: 'Carried curses. Hears what others cannot, but frays.',
      when: [{ stat: 'cursesGained', min: 2 }],
      mods: { researchMult: 1.5, stabilityMult: 0.85 },
    },
    {
      id: 'pathfinder',
      name: 'Pathfinder',
      description: 'Hunted the strongest. Scouts swiftly.',
      when: [{ stat: 'elitesWon', min: 2 }],
      mods: { scoutMult: 1.6 },
    },
    {
      id: 'scarred',
      name: 'Scarred',
      description: 'Bled a great deal and kept going. Wears down slowly.',
      when: [{ stat: 'damageTaken', min: 120 }],
      mods: { drainMult: 0.75 },
    },
    {
      id: 'hoarder',
      name: 'Hoarder',
      description: 'Kept every card it found. Remembers much.',
      when: [{ stat: 'deckSize', min: 18 }],
      mods: { researchMult: 1.3 },
    },
    {
      id: 'fleeting',
      name: 'Fleeting',
      description: 'Died young. Burns bright: works harder, fades fast.',
      when: [{ stat: 'depth', max: 3 }],
      mods: { stabilityMult: 0.7, digMult: 1.25, researchMult: 1.25, scoutMult: 1.25 },
    },
    {
      id: 'faded',
      name: 'Faded',
      description: 'An ordinary ghost. Nothing more, nothing less.',
      when: [],
      mods: {},
    },
  ],

  unlocks: [
    {
      id: 'stolen-hour',
      name: 'The Stolen Hour',
      description: 'A second Warden: the Hour-Thief, who delays, echoes and rewinds time.',
      cost: 120,
      flavor: 'An hour that should not exist, kept in a jar at the edge of the outpost.',
    },
    {
      id: 'kit-fault-walker',
      name: 'Kit: The Fault-Walker',
      description: 'A starting deck already cracked: Twin Shards and Hollow Vow.',
      cost: 60,
      flavor: 'Some Wardens are born broken. It saves time.',
    },
    {
      id: 'kit-bastion',
      name: 'Kit: The Bastion',
      description: 'A starting deck already walled: Mirror Sigil and Bulwark Slam.',
      cost: 60,
      flavor: 'Begin behind stone. End behind stone.',
    },
    {
      id: 'second-sight',
      name: 'Second Sight',
      description: 'Once per loop, reroll a card reward.',
      cost: 70,
      flavor: 'Look again. The vault shows a different face.',
    },
    {
      id: 'shrine-of-ash',
      name: 'Shrine of Ash',
      description: 'Shrines gain a third rite: Purge 2 Corruption.',
      cost: 80,
      flavor: 'Burn what clings to you. Something always clings.',
    },
    {
      id: 'shift-bell',
      name: 'The Shift Bell',
      description: 'Once per loop, before descending, reroll the Vault Shift.',
      cost: 90,
      flavor: 'Ring it, and the vault turns over in its sleep.',
    },
    {
      id: 'reliquary-key',
      name: 'Reliquary Key',
      description: 'Relic Caches offer three relics instead of two.',
      cost: 100,
      flavor: 'A key with no lock. Every cache knows it anyway.',
    },
  ],

  // Alternates card unlocks and lore, so Research always feels like discovery.
  research: [
    { kind: 'card', cardId: 'scar-tissue' },
    { kind: 'lore', loreId: 'lore-first-door' },
    { kind: 'card', cardId: 'resonant-feedback' },
    { kind: 'lore', loreId: 'lore-wardens' },
    { kind: 'card', cardId: 'red-harvest' },
    { kind: 'lore', loreId: 'lore-relics' },
    { kind: 'card', cardId: 'rampart-breaker' },
    { kind: 'lore', loreId: 'lore-corruption' },
    { kind: 'card', cardId: 'unbind' },
    { kind: 'lore', loreId: 'lore-echoes' },
    { kind: 'card', cardId: 'crack-the-seal' },
    { kind: 'lore', loreId: 'lore-below' },
    // Hour-Thief discoveries (appended: research progress is index-based).
    { kind: 'card', cardId: 'countdown' },
    { kind: 'card', cardId: 'stitch-the-wound' },
    { kind: 'lore', loreId: 'lore-stolen-hour' },
    { kind: 'card', cardId: 'hour-bomb' },
    { kind: 'card', cardId: 'unmake-the-hour' },
    { kind: 'lore', loreId: 'lore-sand' },
    { kind: 'card', cardId: 'chorus-of-moments' },
    { kind: 'card', cardId: 'temporal-shear' },
  ],

  lore: Object.fromEntries(LORE.map((l) => [l.id, l])),

  names: {
    given: ['Veyra', 'Orun', 'Sael', 'Thessaly', 'Corvin', 'Ismet', 'Halde', 'Mireth', 'Ansel', 'Quell', 'Ydris', 'Brannoc', 'Lusk', 'Tamsin', 'Oriel', 'Kestrel'],
    epithets: [
      'the Twice-Fallen',
      'of the Cold Hand',
      'the Unremembered',
      'Ash-Voiced',
      'the Hollowed',
      'of the Last Door',
      'Who Wept Light',
      'the Splintered',
      'of Seven Loops',
      'the Quiet One',
      'Lantern-Eyed',
      'the Unfinished',
    ],
  },
};
