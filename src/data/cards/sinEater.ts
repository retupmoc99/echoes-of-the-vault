/**
 * The Sin-Eater's cards (docs/design/sin-eater.md). Two archetypes:
 * - Devour: eat the leftmost curse in hand for a bonus (it's back next fight).
 * - Burden: grow with the curses you carry.
 */
import type { CardDef, Effect } from '../../engine/types';

const devour = (each: Effect[], count: number | 'all' = 1, permanent = false): Effect => ({ kind: 'devour', count, each, ...(permanent ? { permanent } : {}) });
const perCurse = (times: number, plus?: number) => ({ per: 'cursesInDeck' as const, times, ...(plus !== undefined ? { plus } : {}) });

export const SIN_EATER_CARDS: CardDef[] = [
  // ───────────── Starters ─────────────
  { id: 'bitter-strike', name: 'Bitter Strike', type: 'strike', cost: 1, rarity: 'starter', effects: [{ kind: 'damage', amount: 6 }], flavor: 'It tastes of everything it has swallowed.' },
  { id: 'ash-shroud', name: 'Ash Shroud', type: 'ward', cost: 1, rarity: 'starter', effects: [{ kind: 'ward', amount: 5 }], flavor: 'Grey on grey on grey.' },
  {
    id: 'swallow',
    name: 'Swallow',
    type: 'strike',
    cost: 1,
    rarity: 'starter',
    archetype: 'devour',
    effects: [{ kind: 'damage', amount: 6 }, devour([{ kind: 'damage', amount: 10 }])],
    flavor: 'Down it goes. Up comes something sharper.',
  },

  // ───────────── Commons ─────────────
  {
    id: 'take-the-sin',
    name: 'Take the Sin',
    type: 'rite',
    cost: 0,
    rarity: 'common',
    archetype: 'devour',
    fade: true,
    effects: [{ kind: 'shuffleIn', cardId: 'randomCurse' }, { kind: 'gainResonance', amount: 1 }],
    flavor: 'Hand it here. I will carry it.',
  },
  { id: 'bitter-feast', name: 'Bitter Feast', type: 'strike', cost: 1, rarity: 'common', archetype: 'burden', effects: [{ kind: 'damage', amount: perCurse(2, 4) }], flavor: 'Every sin has a flavour. None of them are good.' },
  { id: 'grave-hunger', name: 'Grave Hunger', type: 'ward', cost: 1, rarity: 'common', archetype: 'devour', effects: [{ kind: 'ward', amount: 5 }, devour([{ kind: 'draw', amount: 2 }])], flavor: 'Hungry enough to eat the dark.' },
  { id: 'gnash', name: 'Gnash', type: 'strike', cost: 1, rarity: 'common', archetype: 'devour', effects: [{ kind: 'damage', amount: 7 }, devour([{ kind: 'damage', amount: 6 }])], flavor: 'Teeth first. Questions never.' },
  {
    id: 'salt-the-wound',
    name: 'Salt the Wound',
    type: 'rite',
    cost: 1,
    rarity: 'common',
    archetype: 'devour',
    effects: [{ kind: 'applyStatus', status: 'bleed', amount: 3, target: 'target' }, devour([{ kind: 'applyStatus', status: 'bleed', amount: 3, target: 'target' }])],
    flavor: 'Salt keeps. Salt stings. Salt remembers.',
  },
  {
    id: 'sackcloth',
    name: 'Sackcloth',
    type: 'ward',
    cost: 1,
    rarity: 'common',
    archetype: 'burden',
    effects: [{ kind: 'ward', amount: 7 }, { kind: 'if', cond: { kind: 'curseInHand' }, then: [{ kind: 'ward', amount: 3 }] }],
    text: 'Gain 7 Ward. If you hold a curse, gain 3 more.',
    flavor: 'Penance you can wear.',
  },
  { id: 'hungry-eyes', name: 'Hungry Eyes', type: 'rite', cost: 0, rarity: 'common', archetype: 'devour', effects: [{ kind: 'draw', amount: 1 }, devour([{ kind: 'draw', amount: 2 }])], flavor: 'Looking for the next meal.' },
  {
    id: 'ash-mouth',
    name: 'Ash Mouth',
    type: 'strike',
    cost: 1,
    rarity: 'common',
    archetype: 'devour',
    effects: [{ kind: 'damage', amount: 4, target: 'allFoes' }, devour([{ kind: 'damage', amount: 4, target: 'allFoes' }])],
    flavor: 'It breathes out what it ate.',
  },

  // ───────────── Uncommons ─────────────
  { id: 'communion-of-ash', name: 'Communion of Ash', type: 'ward', cost: 1, rarity: 'uncommon', archetype: 'burden', effects: [{ kind: 'ward', amount: { per: 'cursesInDeck', times: 3, plus: 3 } }], flavor: 'Share the weight. It does not get lighter.' },
  { id: 'gorge', name: 'Gorge', type: 'strike', cost: 2, rarity: 'uncommon', archetype: 'devour', effects: [devour([{ kind: 'damage', amount: 7, target: 'allFoes' }], 3)], flavor: 'More. More. More.' },
  { id: 'feast-of-crows', name: 'Feast of Crows', type: 'strike', cost: 1, rarity: 'uncommon', archetype: 'devour', effects: [{ kind: 'damage', amount: { per: 'devouredThisFight', times: 4, plus: 5 } }], flavor: 'The birds come for what is left over.' },
  {
    id: 'bile',
    name: 'Bile',
    type: 'rite',
    cost: 1,
    rarity: 'uncommon',
    archetype: 'devour',
    effects: [{ kind: 'applyStatus', status: 'weakened', amount: 2, target: 'target' }, devour([{ kind: 'applyStatus', status: 'exposed', amount: 2, target: 'target' }])],
    flavor: 'Some things should not be swallowed. It spits them back.',
  },
  { id: 'sin-shield', name: 'Sin Shield', type: 'ward', cost: 2, rarity: 'uncommon', archetype: 'devour', effects: [{ kind: 'ward', amount: 12 }, devour([{ kind: 'ward', amount: 8 }])], flavor: 'A wall of everything you would rather forget.' },
  { id: 'heavy-heart', name: 'Heavy Heart', type: 'strike', cost: 1, rarity: 'uncommon', archetype: 'burden', effects: [{ kind: 'damage', amount: perCurse(1, 5), hits: 2 }], flavor: 'It weighs a great deal. So does it hit.' },
  { id: 'glutton', name: 'Glutton', type: 'rite', cost: 1, rarity: 'uncommon', archetype: 'devour', effects: [devour([{ kind: 'gainResonance', amount: 2 }, { kind: 'draw', amount: 1 }])], flavor: 'Never full. Never finished.' },

  // ───────────── Rares ─────────────
  { id: 'absolution', name: 'Absolution', type: 'rite', cost: 2, rarity: 'rare', archetype: 'devour', fade: true, effects: [devour([{ kind: 'ward', amount: 6 }], 'all', true)], flavor: 'Not forgiveness. Digestion.' },
  { id: 'sin-bloated', name: 'Sin-Bloated', type: 'strike', cost: 2, rarity: 'rare', archetype: 'burden', effects: [{ kind: 'damage', amount: perCurse(2), target: 'allFoes', hits: 2 }], flavor: 'Swollen with every wrong the vault ever did.' },
  { id: 'maw-of-the-vault', name: 'Maw of the Vault', type: 'strike', cost: 3, rarity: 'rare', archetype: 'devour', effects: [devour([{ kind: 'damage', amount: 9, target: 'allFoes' }], 'all')], flavor: 'Open wide.' },
  {
    id: 'last-supper',
    name: 'Last Supper',
    type: 'rite',
    cost: 1,
    rarity: 'rare',
    archetype: 'burden',
    fade: true,
    effects: [{ kind: 'shuffleIn', cardId: 'randomCurse', count: 2 }, { kind: 'gainResonance', amount: 2 }, { kind: 'draw', amount: 2 }],
    flavor: 'Lay the table. Set two more places.',
  },
  { id: 'eat-the-sky', name: 'Eat the Sky', type: 'strike', cost: 2, rarity: 'rare', archetype: 'devour', effects: [{ kind: 'damage', amount: 16 }, devour([{ kind: 'damage', amount: 16 }])], flavor: 'After the curses, it got ambitious.' },
];
