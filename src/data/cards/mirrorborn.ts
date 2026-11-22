/**
 * The Mirrorborn's cards (docs/design/mirrorborn.md). Two archetypes:
 * - Reflection: play the enemy's shown move yourself, turned around.
 * - Theft: take the move away.
 */
import type { CardDef, Effect, IntentClass } from '../../engine/types';

const mirror = (scale: number, who: 'target' | 'all' = 'target', times?: number): Effect => ({ kind: 'mirrorIntent', scale, who, ...(times ? { times } : {}) });
const intends = (intent: IntentClass, then: Effect[], otherwise: Effect[] = []): Effect => ({ kind: 'if', cond: { kind: 'targetIntends', intent }, then, else: otherwise });

export const MIRRORBORN_CARDS: CardDef[] = [
  // ───────────── Starters ─────────────
  { id: 'glass-edge', name: 'Glass Edge', type: 'strike', cost: 1, rarity: 'starter', effects: [{ kind: 'damage', amount: 6 }], flavor: 'Thin as a reflection. Just as sharp.' },
  { id: 'silvered-ward', name: 'Silvered Ward', type: 'ward', cost: 1, rarity: 'starter', effects: [{ kind: 'ward', amount: 5 }], flavor: 'Look closely. It is you, shielding you.' },
  { id: 'reflection', name: 'Reflection', type: 'rite', cost: 1, rarity: 'starter', archetype: 'reflection', effects: [mirror(0.5)], flavor: 'Whatever you were about to do, I do first.' },
  {
    id: 'mimics-guard',
    name: "Mimic's Guard",
    type: 'ward',
    cost: 1,
    rarity: 'starter',
    archetype: 'reflection',
    effects: [{ kind: 'ward', amount: { per: 'targetIntentDamage', times: 0.5, plus: 2, max: 8 } }],
    text: "Gain 2 Ward, plus half the target's intended damage (at most 8).",
    flavor: 'It saw the blow before the blow did.',
  },

  // ───────────── Commons ─────────────
  { id: 'copycat', name: 'Copycat', type: 'rite', cost: 0, rarity: 'common', archetype: 'reflection', effects: [mirror(0.4)], flavor: 'A cheap copy is still a copy.' },
  {
    id: 'foreknowledge',
    name: 'Foreknowledge',
    type: 'ward',
    cost: 1,
    rarity: 'common',
    archetype: 'reflection',
    effects: [{ kind: 'ward', amount: 4 }, intends('attack', [{ kind: 'draw', amount: 1 }])],
    text: 'Gain 4 Ward. If the target intends to attack, draw 1.',
    flavor: 'You knew. You always know.',
  },
  {
    id: 'glass-shards',
    name: 'Glass Shards',
    type: 'strike',
    cost: 1,
    rarity: 'common',
    archetype: 'reflection',
    effects: [intends('attack', [{ kind: 'damage', amount: 3, hits: 3 }], [{ kind: 'damage', amount: 3, hits: 2 }])],
    text: 'Deal 3 twice. If the target intends to attack, three times.',
    flavor: 'It broke the mirror. The mirror broke it back.',
  },
  {
    id: 'reflected-ward',
    name: 'Reflected Ward',
    type: 'ward',
    cost: 1,
    rarity: 'common',
    archetype: 'reflection',
    effects: [{ kind: 'ward', amount: 6 }, intends('defend', [{ kind: 'ward', amount: 6 }])],
    text: 'Gain 6 Ward. If the target intends to defend, gain 6 more.',
    flavor: 'Two walls, facing.',
  },
  {
    id: 'silver-tongue',
    name: 'Silver Tongue',
    type: 'rite',
    cost: 1,
    rarity: 'common',
    archetype: 'theft',
    effects: [{ kind: 'applyStatus', status: 'weakened', amount: 2, target: 'target' }, intends('attack', [{ kind: 'applyStatus', status: 'exposed', amount: 1, target: 'target' }])],
    text: 'Apply 2 Weakened. If the target intends to attack, apply 1 Exposed too.',
    flavor: 'Say its words back to it, slightly wrong.',
  },
  {
    id: 'hairline-crack',
    name: 'Hairline Crack',
    type: 'strike',
    cost: 1,
    rarity: 'common',
    archetype: 'reflection',
    effects: [{ kind: 'damage', amount: 7 }, intends('debuff', [{ kind: 'damage', amount: 7 }])],
    text: 'Deal 7. If the target intends a debuff, deal 7 more.',
    flavor: 'The smallest crack runs the whole way through.',
  },
  { id: 'mimicry', name: 'Mimicry', type: 'rite', cost: 1, rarity: 'common', archetype: 'reflection', effects: [mirror(0.6), { kind: 'draw', amount: 1 }], flavor: 'Learn the move by making it.' },
  {
    id: 'second-glance',
    name: 'Second Glance',
    type: 'rite',
    cost: 0,
    rarity: 'common',
    archetype: 'reflection',
    effects: [{ kind: 'if', cond: { kind: 'anyFoeIntends', intent: 'attack' }, then: [{ kind: 'draw', amount: 2 }], else: [{ kind: 'draw', amount: 1 }] }],
    text: 'Draw 2 if any foe intends to attack. Otherwise draw 1.',
    flavor: 'Look again. It is already moving.',
  },

  // ───────────── Uncommons ─────────────
  { id: 'two-faces', name: 'Two Faces', type: 'rite', cost: 1, rarity: 'uncommon', archetype: 'reflection', echo: true, effects: [mirror(0.6)], flavor: 'One for them. One for you.' },
  {
    id: 'turn-it-back',
    name: 'Turn It Back',
    type: 'ward',
    cost: 2,
    rarity: 'uncommon',
    archetype: 'reflection',
    effects: [{ kind: 'ward', amount: { per: 'targetIntentDamage', times: 0.5 } }, { kind: 'damage', amount: { per: 'targetIntentDamage', times: 1 } }],
    text: "Gain Ward equal to half the target's intended damage, and deal its full intended damage to it.",
    flavor: 'Catch it. Throw it back.',
  },
  { id: 'pilfer', name: 'Pilfer', type: 'rite', cost: 2, rarity: 'uncommon', archetype: 'theft', fade: true, effects: [{ kind: 'stealIntent', who: 'target' }], flavor: 'It reached for its blade. The blade was already gone.' },
  { id: 'hall-of-mirrors', name: 'Hall of Mirrors', type: 'rite', cost: 2, rarity: 'uncommon', archetype: 'reflection', effects: [mirror(0.75, 'all')], flavor: 'Every one of them, facing every one of you.' },
  { id: 'shard-storm', name: 'Shard Storm', type: 'strike', cost: 2, rarity: 'uncommon', archetype: 'reflection', effects: [{ kind: 'damage', amount: { per: 'foesIntendingAttack', times: 3, plus: 5 }, target: 'allFoes' }], flavor: 'The more they reach, the more they bleed.' },
  {
    id: 'inverse',
    name: 'Inverse',
    type: 'rite',
    cost: 1,
    rarity: 'uncommon',
    archetype: 'reflection',
    effects: [intends('debuff', [mirror(1)], [mirror(0.5)])],
    text: "Mirror the target's intent at 100% if it intends a debuff; otherwise at 50%.",
    flavor: 'Curses read just as well backwards.',
  },
  { id: 'silvering', name: 'Silvering', type: 'ward', cost: 1, rarity: 'uncommon', archetype: 'reflection', effects: [{ kind: 'ward', amount: { per: 'foesIntendingAttack', times: 2, plus: 8 } }], flavor: 'A coat of quicksilver over the skin.' },

  // ───────────── Rares ─────────────
  { id: 'perfect-copy', name: 'Perfect Copy', type: 'rite', cost: 2, rarity: 'rare', archetype: 'reflection', effects: [mirror(1.5)], flavor: 'Better than the original. Ask it.' },
  { id: 'shatter-the-glass', name: 'Shatter the Glass', type: 'rite', cost: 3, rarity: 'rare', archetype: 'theft', fade: true, effects: [{ kind: 'stealIntent', who: 'all' }], flavor: 'Every reflection breaks at once.' },
  { id: 'mirror-maze', name: 'Mirror Maze', type: 'rite', cost: 2, rarity: 'rare', archetype: 'reflection', fade: true, effects: [mirror(1, 'all')], flavor: 'No way out. For them.' },
  { id: 'face-of-the-foe', name: 'Face of the Foe', type: 'ward', cost: 1, rarity: 'rare', archetype: 'reflection', effects: [{ kind: 'ward', amount: { per: 'allIntentDamage', times: 0.75 } }], flavor: 'Wear their faces. Take their blows for them.' },
  { id: 'thousand-faces', name: 'Thousand Faces', type: 'rite', cost: 3, rarity: 'rare', archetype: 'reflection', fade: true, effects: [mirror(0.75, 'target', 3)], flavor: 'It tried every face it ever stole, one after another.' },
];
