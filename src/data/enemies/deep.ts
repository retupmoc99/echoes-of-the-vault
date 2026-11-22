/**
 * The Deeper Vault: floor 2's enemies and encounters (see docs/design/deeper-vault.md).
 * Each one leans on a rule the floor-1 enemies don't use: timed tolls,
 * mourning kin, Smoke in your deck, scaling hands, a rewinding body.
 */
import type { CardDef, EncounterDef, EnemyDef, LoreFragment, RelicDef } from '../../engine/types';

/** Rot Lantern fouls your deck with this, for the fight only. */
export const DEEP_CARDS: CardDef[] = [
  {
    id: 'smoke',
    name: 'Smoke',
    type: 'rite',
    cost: 1,
    rarity: 'starter',
    fade: true,
    effects: [],
    text: 'Does nothing. Fade.',
    flavor: 'It tastes of old lamp oil and other people’s breath.',
  },
];

/** The Well's relics: one per Warden, in its reward pool after your first escape from floor 2. */
export const DEEP_RELICS: RelicDef[] = [
  {
    id: 'drowned-crown',
    name: 'Drowned Crown',
    rarity: 'rare',
    deepFor: 'relic-breaker',
    passive: [{ on: 'combatStart', effects: [{ kind: 'ward', amount: 5 }] }],
    overload: [{ kind: 'damage', amount: 8, target: 'allFoes' }],
    flavor: 'Whoever wore it ruled the bottom of the Well. Briefly.',
  },
  {
    id: 'waterclock',
    name: 'Waterclock',
    rarity: 'rare',
    deepFor: 'hour-thief',
    passive: [{ on: 'delayFired', effects: [{ kind: 'damage', amount: 3, target: 'allFoes' }] }],
    flavor: 'It keeps time by drowning it, one drop at a time.',
  },
  {
    id: 'well-rope',
    name: 'Well-Rope',
    rarity: 'rare',
    deepFor: 'echo-caller',
    passive: [{ on: 'allyFell', effects: [{ kind: 'ward', amount: 6 }, { kind: 'draw', amount: 1 }] }],
    flavor: 'Frayed by every hand that climbed it. Some let go.',
  },
];

/** Research lore from the depths (appended to the Research queue). */
export const DEEP_LORE: LoreFragment[] = [
  { id: 'lore-stairs', title: 'The Stairs', text: 'The Lock was never the bottom. It was a lid.' },
  { id: 'lore-well', title: 'The Well', text: 'Everything the vault forgets drains down here. The Well remembers by drowning.' },
  { id: 'lore-deepborn', title: 'Deepborn', text: 'Echoes that come back from the stairs walk heavier. They have seen what the loop is built on.' },
];

export const DEEP_ENEMIES: EnemyDef[] = [
  {
    id: 'drowned-bellringer',
    name: 'Drowned Bellringer',
    tier: 'normal',
    hp: [44, 48],
    moves: {
      // Lands on its turn two turns later: you see it coming on the timeline.
      toll: { name: 'Toll for You', effects: [{ kind: 'delay', turns: 2, effects: [{ kind: 'damage', amount: 15 }] }] },
      ring: { name: 'Ring Out', effects: [{ kind: 'damage', amount: 5 }, { kind: 'ward', amount: 6 }] },
    },
    pattern: { kind: 'cycle', order: ['ring', 'toll', 'ring'], opening: 'toll' },
    sigil: { sides: 0, innerSides: 3, rings: 3, hue: 190, spin: 30 },
    flavor: 'It still rings the hours. Nobody tells it the water came.',
  },
  {
    id: 'hollow-pilgrim',
    name: 'Hollow Pilgrim',
    tier: 'normal',
    hp: [24, 28],
    moves: {
      trudge: { name: 'Trudge', effects: [{ kind: 'damage', amount: 6 }] },
      kneel: { name: 'Kneel', effects: [{ kind: 'ward', amount: 6 }, { kind: 'damage', amount: 3 }] },
    },
    pattern: { kind: 'weighted', weights: { trudge: 2, kneel: 1 }, noRepeat: true },
    onKinDeath: { ward: 5, damageBonus: 2 },
    sigil: { sides: 3, innerSides: 0, rings: 1, hue: 35, spin: -20 },
    flavor: 'They walk in pairs. When one stops, the other walks harder.',
  },
  {
    id: 'rot-lantern',
    name: 'Rot Lantern',
    tier: 'normal',
    hp: [46, 50],
    moves: {
      smoke: { name: 'Billow', effects: [{ kind: 'addToDiscard', cardId: 'smoke', count: 2 }, { kind: 'damage', amount: 4 }] },
      flare: { name: 'Flare', effects: [{ kind: 'damage', amount: 11 }] },
      smoulder: { name: 'Smoulder', effects: [{ kind: 'applyStatus', status: 'bleed', amount: 3, target: 'target' }, { kind: 'ward', amount: 6 }] },
    },
    pattern: { kind: 'cycle', order: ['smoke', 'flare', 'smoulder'] },
    sigil: { sides: 6, innerSides: 0, rings: 2, hue: 80, spin: 16 },
    flavor: 'The light is real. What it burns is not oil.',
  },
  {
    id: 'gnawing-dark',
    name: 'Gnawing Dark',
    tier: 'normal',
    hp: [40, 44],
    moves: {
      gnaw: { name: 'Gnaw', effects: [{ kind: 'damage', amount: 5, hits: 2 }] },
      swallow: { name: 'Swallow Light', effects: [{ kind: 'applyStatus', status: 'exposed', amount: 2, target: 'target' }, { kind: 'damage', amount: 5 }] },
      hide: { name: 'Hide', effects: [{ kind: 'ward', amount: 12 }] },
    },
    pattern: { kind: 'weighted', weights: { gnaw: 2, swallow: 1, hide: 1 }, noRepeat: true },
    sigil: { sides: 0, innerSides: 0, rings: 4, hue: 270, spin: -10 },
    flavor: 'Not a creature. The place where the lantern light ends, hungry.',
  },
  {
    id: 'stitched-chorister',
    name: 'Stitched Chorister',
    tier: 'normal',
    hp: [16, 20],
    moves: {
      shriek: { name: 'Shriek', effects: [{ kind: 'damage', amount: 4 }] },
      hum: { name: 'Hum', effects: [{ kind: 'ward', amount: 5 }] },
    },
    pattern: { kind: 'weighted', weights: { shriek: 2, hum: 1 }, noRepeat: true },
    sigil: { sides: 5, innerSides: 3, rings: 0, hue: 330, spin: 12 },
    flavor: 'Sewn from three choirs that sang the wrong hymn.',
  },
  {
    id: 'the-unwound',
    name: 'The Unwound',
    tier: 'normal',
    hp: [48, 52],
    moves: {
      unspool: { name: 'Unspool', effects: [{ kind: 'damage', amount: 10 }] },
      coil: { name: 'Coil', effects: [{ kind: 'ward', amount: 10 }, { kind: 'applyStatus', status: 'weakened', amount: 1, target: 'target' }] },
    },
    pattern: { kind: 'cycle', order: ['unspool', 'coil'] },
    phases: [
      {
        atHpRatio: 0.5,
        name: 'The Rewound',
        // It winds itself back, once.
        onEnter: [{ kind: 'ward', amount: 14 }],
        moves: { snap: { name: 'Snap Back', effects: [{ kind: 'damage', amount: 6, hits: 2 }] } },
        pattern: { kind: 'cycle', order: ['snap', 'coil', 'unspool'] },
      },
    ],
    sigil: { sides: 0, innerSides: 6, rings: 2, hue: 160, spin: -6 },
    flavor: 'Someone pulled its thread to the end. It is still deciding whether to stop.',
  },
  {
    id: 'keeper-of-stairs',
    name: 'Keeper of Stairs',
    tier: 'elite',
    hp: [86, 92],
    moves: {
      bar: { name: 'Bar the Way', effects: [{ kind: 'ward', amount: 12 }, { kind: 'damage', amount: 4 }] },
      crush: { name: 'Crush', effects: [{ kind: 'damage', amount: 17 }] },
      mark: { name: 'Mark the Fallen', effects: [{ kind: 'applyStatus', status: 'exposed', amount: 2, target: 'target' }, { kind: 'damage', amount: 6 }] },
    },
    pattern: { kind: 'cycle', order: ['mark', 'crush', 'bar'], opening: 'bar' },
    sigil: { sides: 4, innerSides: 8, rings: 2, hue: 15, spin: 40 },
    flavor: 'Every stair down has a keeper. This one has kept all of them.',
  },
  {
    id: 'the-many-handed',
    name: 'The Many-Handed',
    tier: 'elite',
    hp: [88, 94],
    moves: {
      grasp: { name: 'Grasp', effects: [{ kind: 'damage', amount: 3, hits: 3 }] },
      clutch: { name: 'Clutch', effects: [{ kind: 'damage', amount: 4, hits: 3 }, { kind: 'applyStatus', status: 'fracture', amount: 1, target: 'self' }] },
      fold: { name: 'Fold In', effects: [{ kind: 'ward', amount: 14 }, { kind: 'applyStatus', status: 'weakened', amount: 1, target: 'target' }] },
    },
    pattern: { kind: 'cycle', order: ['grasp', 'clutch', 'fold'] },
    sigil: { sides: 8, innerSides: 4, rings: 3, hue: 300, spin: -14 },
    flavor: 'It reaches for you with hands it took from others. It has not run out.',
  },
  {
    id: 'bottom-of-the-well',
    name: 'The Bottom of the Well',
    tier: 'boss',
    hp: [124, 130],
    moves: {
      surge: { name: 'Surge', effects: [{ kind: 'damage', amount: 7 }, { kind: 'ward', amount: 8 }] },
      wave: { name: 'Coming Wave', effects: [{ kind: 'delay', turns: 1, effects: [{ kind: 'damage', amount: 12 }] }, { kind: 'ward', amount: 4 }] },
    },
    pattern: { kind: 'cycle', order: ['surge', 'wave'], opening: 'wave' },
    phases: [
      {
        atHpRatio: 0.66,
        name: 'The Well, Draining',
        onEnter: [{ kind: 'ward', amount: 4 }],
        moves: {
          undertow: { name: 'Undertow', effects: [{ kind: 'damage', amount: 4, hits: 2 }, { kind: 'applyStatus', status: 'weakened', amount: 1, target: 'target' }] },
          siphon: { name: 'Siphon', effects: [{ kind: 'ward', amount: 12 }, { kind: 'applyStatus', status: 'exposed', amount: 1, target: 'target' }] },
        },
        pattern: { kind: 'cycle', order: ['undertow', 'siphon', 'wave'] },
      },
      {
        atHpRatio: 0.33,
        name: 'The Well, Drowning',
        // A race: it hits harder every turn, and Fracture eats at it.
        onEnter: [{ kind: 'applyStatus', status: 'fracture', amount: 2, target: 'self' }],
        moves: {
          drown: { name: 'Drown', effects: [{ kind: 'damage', amount: 7 }, { kind: 'applyStatus', status: 'fracture', amount: 1, target: 'self' }] },
          deluge: { name: 'Deluge', effects: [{ kind: 'delay', turns: 1, effects: [{ kind: 'damage', amount: 13 }] }, { kind: 'applyStatus', status: 'fracture', amount: 1, target: 'self' }] },
        },
        pattern: { kind: 'cycle', order: ['drown', 'deluge'] },
      },
    ],
    sigil: { sides: 0, innerSides: 12, rings: 6, hue: 205, spin: 9 },
    flavor: 'Everything that falls in the vault ends up here. Including, eventually, you.',
  },
];

export const DEEP_ENCOUNTERS: EncounterDef[] = [
  { id: 'deep-bellringer', tier: 'normal', floor: 2, enemies: ['drowned-bellringer'] },
  { id: 'deep-pilgrims', tier: 'normal', floor: 2, enemies: ['hollow-pilgrim', 'hollow-pilgrim'] },
  { id: 'deep-lantern', tier: 'normal', floor: 2, enemies: ['rot-lantern'] },
  { id: 'deep-gnawing', tier: 'normal', floor: 2, enemies: ['gnawing-dark'] },
  { id: 'deep-choristers', tier: 'normal', floor: 2, enemies: ['stitched-chorister', 'stitched-chorister', 'stitched-chorister'] },
  { id: 'deep-unwound', tier: 'normal', floor: 2, enemies: ['the-unwound'] },
  { id: 'deep-keeper', tier: 'elite', floor: 2, enemies: ['keeper-of-stairs'] },
  { id: 'deep-many-handed', tier: 'elite', floor: 2, enemies: ['the-many-handed'] },
  { id: 'deep-well', tier: 'boss', floor: 2, enemies: ['bottom-of-the-well'] },
];
