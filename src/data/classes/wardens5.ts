/**
 * Wardens 5–9 (docs/design/sin-eater.md, mirrorborn.md, shiftwright.md,
 * pilgrim.md, tollkeeper.md). Each is revealed by a deed (except the
 * Tollkeeper), then bought as a Work.
 */
import type { WardenClassDef } from '../../engine/types';
import { MIRRORBORN_CARDS } from '../cards/mirrorborn';
import { PILGRIM_CARDS } from '../cards/pilgrim';
import { SHIFTWRIGHT_CARDS } from '../cards/shiftwright';
import { SIN_EATER_CARDS } from '../cards/sinEater';
import { TOLLKEEPER_CARDS } from '../cards/tollkeeper';

const repeat = (id: string, n: number) => Array.from({ length: n }, () => id);
const pool = (cards: { id: string; rarity: string }[]) => cards.filter((c) => c.rarity !== 'starter').map((c) => c.id);
const SHARED_RELICS = ['lodestone-heart', 'mirrorglass-ward', 'ash-rosary'];

const SIN_DECK = [...repeat('bitter-strike', 4), ...repeat('ash-shroud', 4), 'swallow', 'gnawing-static'];
export const SIN_EATER: WardenClassDef = {
  id: 'sin-eater',
  name: 'Sin-Eater',
  maxHp: 66,
  starterDeck: SIN_DECK,
  starterRelics: ['black-salt'],
  cardPool: pool(SIN_EATER_CARDS),
  lockedCards: ['sin-shield', 'sin-bloated', 'glutton', 'maw-of-the-vault', 'last-supper', 'heavy-heart'],
  relicPool: ['iron-stomach', 'bone-fork', 'tithe-bowl', 'sin-ledger', 'gilded-tongue', 'the-last-meal', 'ash-crown', ...SHARED_RELICS],
  kits: [
    { id: 'sin-standard', name: 'The Sin-Eater', description: 'Bitter strikes, ash shrouds, one swallow, and the first meal.', deck: SIN_DECK },
    {
      id: 'glutton',
      name: 'The Glutton',
      description: 'Eat everything: Gorge and Sackcloth in place of two Bitter Strikes.',
      deck: [...repeat('bitter-strike', 2), ...repeat('ash-shroud', 4), 'gorge', 'sackcloth', 'swallow', 'gnawing-static'],
      unlock: 'kit-glutton',
    },
    {
      id: 'penitent',
      name: 'The Penitent',
      description: 'Wear the weight as armour: Communion of Ash in place of an Ash Shroud.',
      deck: [...repeat('bitter-strike', 4), ...repeat('ash-shroud', 3), 'communion-of-ash', 'swallow', 'gnawing-static'],
      unlock: 'kit-penitent',
    },
  ],
  unlock: 'ash-table',
  deed: 'fed-on-sin',
  taintedGivesCurse: true,
  summary: 'Eat the curses in your hand for power, and grow with every curse you carry. Wants the tainted offer.',
  flavor: 'A Warden who takes the vault’s curses into itself, and is never full.',
};

const MIRROR_DECK = [...repeat('glass-edge', 4), ...repeat('silvered-ward', 4), 'reflection', 'mimics-guard'];
export const MIRRORBORN: WardenClassDef = {
  id: 'mirrorborn',
  name: 'Mirrorborn',
  maxHp: 62,
  starterDeck: MIRROR_DECK,
  starterRelics: ['cracked-mirror'],
  cardPool: pool(MIRRORBORN_CARDS),
  lockedCards: ['inverse', 'silvering', 'shard-storm', 'mirror-maze', 'face-of-the-foe', 'thousand-faces'],
  relicPool: ['silver-dust', 'hand-mirror', 'two-sided-coin', 'thiefs-glove', 'glass-heart', 'the-true-reflection', 'black-glass', ...SHARED_RELICS],
  kits: [
    { id: 'mirror-standard', name: 'The Mirrorborn', description: 'Glass edges, silvered wards, one reflection, one guard.', deck: MIRROR_DECK },
    {
      id: 'face-thief',
      name: 'The Face-Thief',
      description: 'Take their turn away: Pilfer and Silver Tongue in place of two Glass Edges.',
      deck: [...repeat('glass-edge', 2), ...repeat('silvered-ward', 4), 'pilfer', 'silver-tongue', 'reflection', 'mimics-guard'],
      unlock: 'kit-face-thief',
    },
    {
      id: 'glass-wall',
      name: 'The Glass Wall',
      description: 'Let them strike first, and pay it back: Foreknowledge and Turn It Back in place of two Glass Edges.',
      deck: [...repeat('glass-edge', 2), ...repeat('silvered-ward', 4), 'foreknowledge', 'turn-it-back', 'reflection', 'mimics-guard'],
      unlock: 'kit-glass-wall',
    },
  ],
  unlock: 'mirror-that-kept-its-face',
  deed: 'seen-in-every-glass',
  summary: 'Play the enemy’s shown move yourself, turned around: its attack hits it, its Ward shields you. Steal its turn.',
  flavor: 'A Warden with no face of its own. It borrows yours.',
};

const SHIFT_DECK = [...repeat('tide-strike', 4), ...repeat('squall-ward', 4), 'turn-the-tide', 'break-the-sky'];
export const SHIFTWRIGHT: WardenClassDef = {
  id: 'shiftwright',
  name: 'Shiftwright',
  maxHp: 68,
  starterDeck: SHIFT_DECK,
  starterRelics: ['weathervane'],
  cardPool: pool(SHIFTWRIGHT_CARDS),
  lockedCards: ['deep-current', 'lightning-rod', 'canticle', 'maelstrom', 'weathermaker', 'cataclysm'],
  relicPool: ['rain-chime', 'storm-jar', 'tide-pool', 'choir-bell', 'broken-barometer', 'eye-of-the-vault', 'the-fourth-weather', ...SHARED_RELICS],
  kits: [
    { id: 'shift-standard', name: 'The Shiftwright', description: 'Tide strikes, squall wards, one tide turned, one sky broken.', deck: SHIFT_DECK },
    {
      id: 'drowned',
      name: 'The Drowned',
      description: 'Bleed that never ends: Undertow and Riptide in place of two Tide Strikes.',
      deck: [...repeat('tide-strike', 2), ...repeat('squall-ward', 4), 'undertow', 'riptide', 'turn-the-tide', 'break-the-sky'],
      unlock: 'kit-drowned',
    },
    {
      id: 'stormcaller',
      name: 'The Stormcaller',
      description: 'Burn for blows: Skyfall and Stormglass in place of a Tide Strike and a Squall Ward.',
      deck: [...repeat('tide-strike', 3), ...repeat('squall-ward', 3), 'skyfall', 'stormglass', 'turn-the-tide', 'break-the-sky'],
      unlock: 'kit-stormcaller',
    },
  ],
  unlock: 'the-weathervane',
  deed: 'weathered',
  resource: 'aspect',
  summary: 'Carry three weathers (Drowned, Fractured, Choir) and switch between them. Each fight starts in the loop’s Shift.',
  flavor: 'A Warden who carries the vault’s weather inside it, and changes it at will.',
};

const PILGRIM_DECK = [...repeat('road-strike', 4), ...repeat('travel-cloak', 4), 'long-stride', 'milestone'];
export const PILGRIM: WardenClassDef = {
  id: 'pilgrim',
  name: 'Pilgrim',
  maxHp: 62,
  starterDeck: PILGRIM_DECK,
  starterRelics: ['worn-compass'],
  cardPool: pool(PILGRIM_CARDS),
  lockedCards: ['waystation', 'cairn', 'forced-march', 'thousand-steps', 'far-horizon', 'the-last-mile'],
  relicPool: ['hobnail-boots', 'prayer-beads', 'road-map', 'tin-cup', 'pilgrims-badge', 'saints-sandal', 'the-long-way-round', ...SHARED_RELICS],
  kits: [
    { id: 'pilgrim-standard', name: 'The Pilgrim', description: 'Road strikes, travel cloaks, one long stride, one milestone.', deck: PILGRIM_DECK },
    {
      id: 'wanderer',
      name: 'The Wanderer',
      description: 'More cards that grow: Trailblaze and Wayshrine Ward in place of two Road Strikes.',
      deck: [...repeat('road-strike', 2), ...repeat('travel-cloak', 4), 'trailblaze', 'wayshrine-ward', 'long-stride', 'milestone'],
      unlock: 'kit-wanderer',
    },
    {
      id: 'long-road',
      name: 'The Long Road',
      description: 'Payoff for walking far: Footsore and Long Road Home in place of a Road Strike and a Travel Cloak.',
      deck: [...repeat('road-strike', 3), ...repeat('travel-cloak', 3), 'footsore', 'long-road-home', 'long-stride', 'milestone'],
      unlock: 'kit-long-road',
    },
  ],
  unlock: 'the-worn-road',
  deed: 'back-from-the-well',
  resource: 'miles',
  summary: 'Every chamber you enter is a Mile; road cards grow with your Miles. Weak early, strong deep in a loop.',
  flavor: 'A Warden who walks the vault one step at a time, and counts every stone.',
};

const TOLL_DECK = [...repeat('collectors-blade', 4), ...repeat('iron-ledger', 4), 'exact-payment', 'bribe-the-dark'];
export const TOLLKEEPER: WardenClassDef = {
  id: 'tollkeeper',
  name: 'Tollkeeper',
  maxHp: 70,
  starterDeck: TOLL_DECK,
  starterRelics: ['tollhouse-lantern'],
  cardPool: pool(TOLLKEEPER_CARDS),
  lockedCards: ['blood-money', 'hostile-takeover', 'vault-dividend', 'golden-ward', 'toll-of-ages', 'bankrupt-the-dark'],
  relicPool: ['coin-purse', 'brass-scales', 'ledger-of-debts', 'weighted-dice', 'gilded-hand', 'golden-key', 'the-last-coin', ...SHARED_RELICS],
  kits: [
    { id: 'toll-standard', name: 'The Tollkeeper', description: 'Collector’s blades, iron ledgers, one exact payment, one bribe.', deck: TOLL_DECK },
    {
      id: 'miser',
      name: 'The Miser',
      description: 'Hoard, and let the hoard hit: Golden Hail and Counting House in place of a Collector’s Blade and an Iron Ledger.',
      deck: [...repeat('collectors-blade', 3), ...repeat('iron-ledger', 3), 'golden-hail', 'counting-house', 'exact-payment', 'bribe-the-dark'],
      unlock: 'kit-miser',
    },
    {
      id: 'spendthrift',
      name: 'The Spendthrift',
      description: 'Spend every coin: Hired Steel and Gilded Ward in place of a Collector’s Blade and an Iron Ledger.',
      deck: [...repeat('collectors-blade', 3), ...repeat('iron-ledger', 3), 'hired-steel', 'gilded-ward', 'exact-payment', 'bribe-the-dark'],
      unlock: 'kit-spendthrift',
    },
  ],
  unlock: 'the-toll-gate',
  resource: 'toll',
  summary: 'Foes pay a Toll when they die; Pay cards spend it for a bonus. Toll is gone when the loop ends: spend it.',
  flavor: 'A Warden who collects from everything it kills. Nothing passes free.',
};
