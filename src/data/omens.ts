/**
 * Daily Descent Omens: one rule per day that bends the loop.
 * The day picks one by date, so all twelve come round before any repeats.
 * See docs/design/daily-descent.md.
 */
import type { OmenDef } from '../engine/types';

export const OMENS: OmenDef[] = [
  {
    id: 'glass-vault',
    name: 'Glass Vault',
    text: 'You have 20% less max HP. Card rewards offer 4 cards, and Shrines heal 50%.',
    flavor: 'Everything here breaks. You most of all.',
    mods: { maxHpMult: 0.8, rewardChoicesBonus: 1, shrineHealMult: 5 / 3 },
  },
  {
    id: 'hoard',
    name: 'Hoard',
    text: 'Start with 2 extra relics. There are no Relic Caches.',
    flavor: 'Someone left their treasures by the door. All of them.',
    mods: { startRelics: 2, nodeWeights: { cache: 0 } },
  },
  {
    id: 'quickened',
    name: 'Quickened',
    text: 'Draw 6 cards a turn. Enemies have 20% more HP.',
    flavor: 'Your hands move faster than your thoughts.',
    mods: { combat: { drawBonus: 1, enemyHpMult: 1.2 } },
  },
  {
    id: 'bleeding-moon',
    name: 'Bleeding Moon',
    text: 'Every attack that gets past Ward also applies 1 Bleed, yours and theirs. Enemies have 15% more HP.',
    flavor: 'A red light leaks through the ceiling. Every wound stays open.',
    mods: { combat: { bleedOnAttack: 1, enemyHpMult: 1.15 } },
  },
  {
    id: 'quiet-vault',
    name: 'Quiet Vault',
    text: 'No Events. Shrines and Relic Caches are twice as common.',
    flavor: 'No voices today. Only stone, and what lies on it.',
    mods: { nodeWeights: { event: 0, shrine: 2, cache: 2 } },
  },
  {
    id: 'ascetic',
    name: 'Ascetic',
    text: 'No card rewards. Enemies have 10% more HP.',
    flavor: 'Carry nothing new. Keep what you are.',
    mods: { noCardRewards: true, combat: { enemyHpMult: 1.1 } },
  },
  {
    id: 'crowded-halls',
    name: 'Crowded Halls',
    text: 'A Choir Shard joins every normal fight.',
    flavor: 'The singing never stops. Neither do the singers.',
    mods: { extraEnemy: 'choir-shard' },
  },
  {
    id: 'borrowed-strength',
    name: 'Borrowed Strength',
    text: 'Start with 2 Corruption and a random rare card.',
    flavor: 'Power up front. The vault will collect.',
    mods: { startCorruption: 2, startRares: 1 },
  },
  {
    id: 'long-night',
    name: 'Long Night',
    text: 'One extra row before the boss. Shrines heal 50% instead of 30%.',
    flavor: 'The stairs go on. So do the candles.',
    mods: { extraRows: 1, shrineHealMult: 5 / 3 },
  },
  {
    id: 'heavy-hands',
    name: 'Heavy Hands',
    text: '4 Resonance a turn, but draw only 4 cards. Enemies have 15% more HP.',
    flavor: 'Fewer choices. Harder blows.',
    mods: { combat: { resonanceBonus: 1, drawBonus: -1, enemyHpMult: 1.15 } },
  },
  {
    id: 'paper-walls',
    name: 'Paper Walls',
    text: 'You gain 40% less Ward. Enemies have 20% less HP.',
    flavor: 'Nothing holds today, on either side of the blade.',
    mods: { combat: { playerWardMult: 0.6, enemyHpMult: 0.8 } },
  },
  {
    id: 'clockwork',
    name: 'Clockwork',
    text: 'Every card costs 1.',
    flavor: 'The vault ticks. Every motion takes the same.',
    mods: { combat: { costOverride: 1 } },
  },
];
