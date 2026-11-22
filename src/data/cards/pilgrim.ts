/**
 * The Pilgrim's cards (docs/design/pilgrim.md). Road cards grow with the
 * Miles walked this loop (1 per chamber entered, 2 per elite).
 */
import type { Amount, CardDef, Effect } from '../../engine/types';

const miles = (times: number, plus?: number, max?: number): Amount => ({ per: 'miles', times, ...(plus !== undefined ? { plus } : {}), ...(max !== undefined ? { max } : {}) });
const atMiles = (n: number, then: Effect[], otherwise: Effect[] = []): Effect => ({ kind: 'if', cond: { kind: 'milesAtLeast', n }, then, else: otherwise });

export const PILGRIM_CARDS: CardDef[] = [
  // ───────────── Starters ─────────────
  { id: 'road-strike', name: 'Road Strike', type: 'strike', cost: 1, rarity: 'starter', effects: [{ kind: 'damage', amount: 6 }], flavor: 'The staff has walked further than you have.' },
  { id: 'travel-cloak', name: 'Travel Cloak', type: 'ward', cost: 1, rarity: 'starter', effects: [{ kind: 'ward', amount: 5 }], flavor: 'Patched at every elbow, from every road.' },
  { id: 'long-stride', name: 'Long Stride', type: 'strike', cost: 1, rarity: 'starter', archetype: 'road', effects: [{ kind: 'damage', amount: miles(0.34, 5, 10) }], flavor: 'Each step carries the last one in it.' },
  { id: 'milestone', name: 'Milestone', type: 'ward', cost: 1, rarity: 'starter', archetype: 'road', effects: [{ kind: 'ward', amount: miles(0.34, 4, 9) }], flavor: 'Count the stones. Stand behind them.' },

  // ───────────── Commons ─────────────
  { id: 'trailblaze', name: 'Trailblaze', type: 'strike', cost: 1, rarity: 'common', archetype: 'road', effects: [{ kind: 'damage', amount: miles(0.25, 3, 6), target: 'allFoes' }], flavor: 'Cut the path, and whatever stands in it.' },
  { id: 'wayshrine-ward', name: 'Wayshrine Ward', type: 'ward', cost: 1, rarity: 'common', archetype: 'road', effects: [{ kind: 'ward', amount: miles(0.34, 5, 10) }], flavor: 'Every roadside saint lends a little.' },
  { id: 'second-wind', name: 'Second Wind', type: 'rite', cost: 0, rarity: 'common', archetype: 'rest', effects: [atMiles(6, [{ kind: 'draw', amount: 2 }], [{ kind: 'draw', amount: 1 }])], text: 'Draw 1. With 6+ Miles, draw 2.', flavor: 'Tired legs, clear head.' },
  { id: 'footsore', name: 'Footsore', type: 'strike', cost: 1, rarity: 'common', archetype: 'road', effects: [{ kind: 'damage', amount: miles(0.34, 6, 11) }], flavor: 'It hurts to walk. It hurts more to be walked into.' },
  { id: 'walking-stick', name: 'Walking Stick', type: 'strike', cost: 1, rarity: 'common', archetype: 'road', effects: [{ kind: 'damage', amount: 6 }, { kind: 'gainMiles', n: 1 }], flavor: 'Lean on it. Hit with it. Keep going.' },
  { id: 'dust-of-the-road', name: 'Dust of the Road', type: 'rite', cost: 1, rarity: 'common', archetype: 'road', effects: [{ kind: 'applyStatus', status: 'weakened', amount: miles(0.2, 1), target: 'target' }], flavor: 'Thrown in the eyes, it remembers every mile.' },
  { id: 'bedroll', name: 'Bedroll', type: 'ward', cost: 1, rarity: 'common', archetype: 'rest', effects: [{ kind: 'ward', amount: 7 }, atMiles(8, [{ kind: 'ward', amount: 5 }])], text: 'Gain 7 Ward. With 8+ Miles, gain 5 more.', flavor: 'Rolled tight. Unrolled anywhere.' },
  { id: 'map-fragment', name: 'Map Fragment', type: 'rite', cost: 0, rarity: 'common', archetype: 'road', fade: true, effects: [{ kind: 'gainMiles', n: 1 }, { kind: 'draw', amount: 1 }], flavor: 'A corner of the way. Enough.' },

  // ───────────── Uncommons ─────────────
  { id: 'pack-mule', name: 'Pack Mule', type: 'rite', cost: 1, rarity: 'uncommon', archetype: 'rest', fade: true, effects: [atMiles(8, [{ kind: 'gainResonance', amount: 2 }], [{ kind: 'gainResonance', amount: 1 }])], text: 'Gain 1 Resonance. With 8+ Miles, gain 2 instead. Fade.', flavor: 'It carries what you cannot.' },
  { id: 'long-road-home', name: 'Long Road Home', type: 'strike', cost: 2, rarity: 'uncommon', archetype: 'road', effects: [{ kind: 'damage', amount: miles(1, undefined, 14) }], flavor: 'Every mile walked, paid back at once.' },
  { id: 'forced-march', name: 'Forced March', type: 'rite', cost: 1, rarity: 'uncommon', archetype: 'road', effects: [{ kind: 'gainMiles', n: 2 }, { kind: 'loseHp', amount: 3 }], flavor: 'No rest tonight.' },
  { id: 'pilgrims-rest', name: "Pilgrim's Rest", type: 'ward', cost: 1, rarity: 'uncommon', archetype: 'rest', effects: [{ kind: 'ward', amount: miles(0.5, 7, 14) }, { kind: 'draw', amount: 1 }], flavor: 'Sit. The road will wait.' },
  { id: 'milestone-ward', name: 'Milestone Ward', type: 'ward', cost: 2, rarity: 'uncommon', archetype: 'road', effects: [{ kind: 'ward', amount: miles(0.5, 6, 13) }, { kind: 'ward', amount: miles(0.5, 6, 13) }], text: 'Gain 6 Ward, plus 1 per 2 Miles, twice.', flavor: 'Two stones for every road.' },
  { id: 'waystation', name: 'Waystation', type: 'rite', cost: 1, rarity: 'uncommon', archetype: 'rest', effects: [{ kind: 'draw', amount: miles(1 / 6, 1) }], text: 'Draw 1, plus 1 per 6 Miles.', flavor: 'Bread, water, a place to think.' },
  { id: 'cairn', name: 'Cairn', type: 'ward', cost: 1, rarity: 'uncommon', archetype: 'road', effects: [{ kind: 'gainMiles', n: 1 }, { kind: 'ward', amount: miles(0.5, 4, 11) }], flavor: 'Add a stone. Leave a mark.' },

  // ───────────── Rares ─────────────
  { id: 'carved-stone', name: 'Carved Stone', type: 'rite', cost: 1, rarity: 'rare', archetype: 'road', fade: true, effects: [{ kind: 'gainMiles', n: 2 }], flavor: 'Carve the distance into it, and it becomes true.' },
  { id: 'pilgrims-end', name: "Pilgrim's End", type: 'strike', cost: 3, rarity: 'rare', archetype: 'road', effects: [{ kind: 'damage', amount: miles(1, 10, 24) }], flavor: 'At the end of every road, something waits to be struck.' },
  { id: 'thousand-steps', name: 'Thousand Steps', type: 'strike', cost: 2, rarity: 'rare', archetype: 'road', effects: [{ kind: 'damage', amount: miles(0.5, undefined, 7), target: 'allFoes', hits: 2 }], flavor: 'They counted. You did not stop.' },
  { id: 'far-horizon', name: 'Far Horizon', type: 'rite', cost: 1, rarity: 'rare', archetype: 'rest', fade: true, effects: [{ kind: 'gainResonance', amount: miles(0.2) }, { kind: 'draw', amount: 1 }], flavor: 'The light on the edge of the world.' },
  { id: 'the-last-mile', name: 'The Last Mile', type: 'strike', cost: 2, rarity: 'rare', archetype: 'road', fade: true, effects: [{ kind: 'damage', amount: miles(1.5, undefined, 21) }], flavor: 'The hardest one. The one that matters.' },
];
