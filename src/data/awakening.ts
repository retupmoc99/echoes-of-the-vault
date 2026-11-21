/**
 * The Awakening: stage text, elite affixes and the lore each stage reveals.
 * Numbers (thresholds, bonuses) live in BALANCE.awakening.
 */
import type { AwakeningContent, LoreFragment } from '../engine/types';

export const AWAKENING_LORE: LoreFragment[] = [
  {
    id: 'lore-first-breath',
    title: 'The First Breath',
    text: 'The floor rose and fell. Once. You told yourself it was the loop resetting.',
  },
  {
    id: 'lore-names-in-the-dark',
    title: 'Names in the Dark',
    text: 'It speaks the names of your Echoes in its sleep. It has never heard them said aloud.',
  },
  {
    id: 'lore-teeth',
    title: 'Teeth',
    text: 'The elites have begun to wear what it dreams of them. It dreams of you, too.',
  },
  {
    id: 'lore-wakeful',
    title: 'The Lock Weeps',
    text: 'The Lock was never guarding the way down. It was holding the lid shut. Now it cannot stop crying.',
  },
  {
    id: 'lore-awake',
    title: 'Awake',
    text: 'It has opened its eyes. They are your eyes, from every loop, looking back at you.',
  },
  {
    id: 'lore-unmade',
    title: 'Unmade',
    text: 'You unmade it, and it began to dream again at once. Of you. It always dreams of you first.',
  },
];

export const AWAKENING_CONTENT: AwakeningContent = {
  stages: [
    { name: 'Dormant', danger: '', reward: '' },
    {
      name: 'Murmur',
      danger: 'Awakening events stir in the vault.',
      reward: 'Dig yields 15% more Shards.',
      loreId: 'lore-first-breath',
    },
    {
      name: 'Stirring',
      danger: 'The early foes wake: tougher, with a new move each.',
      reward: 'Research runs 25% faster.',
      loreId: 'lore-names-in-the-dark',
    },
    {
      name: 'Restless',
      danger: 'Elites carry an affix: Hardened, Frenzied or Warded.',
      reward: 'Rarer card rewards. Elites drop 25 Shards.',
      loreId: 'lore-teeth',
    },
    {
      name: 'Wakeful',
      danger: "A new Shift, The Sleeper's Breath, joins the rotation. The Lock gains a second phase at half HP.",
      reward: 'Escaping banks 50 Shards.',
      loreId: 'lore-wakeful',
    },
    {
      name: 'Awake',
      danger: 'The Sleeper replaces the Lock as the final boss. Lull and Give no longer work.',
      reward: "Unmake it: 200 Shards, the Sleeper's Eye in every loop after, and a new cycle.",
      loreId: 'lore-awake',
    },
  ],
  affixes: {
    hardened: { id: 'hardened', name: 'Hardened', description: '20% more HP.', hpMult: 1.2 },
    frenzied: { id: 'frenzied', name: 'Frenzied', description: 'Every attack deals 3 more.', damageBonus: 3 },
    warded: { id: 'warded', name: 'Warded', description: 'Enters with 10 Ward.', ward: 10 },
  },
};
