/**
 * Vault Shifts: one global modifier per loop. Each opens some builds and
 * punishes others, so the same deck plays differently from loop to loop.
 */
import type { VaultShiftDef } from '../engine/types';

export const VAULT_SHIFTS: VaultShiftDef[] = [
  {
    id: 'drowned-halls',
    name: 'The Drowned Halls',
    text: 'Bleed never fades, on anyone.',
    flavor: 'The lower halls have filled with something that is not water.',
    weight: 1,
    mods: { combat: { bleedDecay: 0 } },
  },
  {
    id: 'choir-awake',
    name: 'The Choir Awake',
    text: 'Enemies have 10% more HP. Rewards offer 4 cards.',
    flavor: 'The vault sings tonight. Everything in it is listening.',
    weight: 1,
    mods: { combat: { enemyHpMult: 1.1 }, rewardChoicesBonus: 1 },
  },
  {
    id: 'fractured-sky',
    name: 'The Fractured Sky',
    text: 'Fracture burns hotter: +2 damage per stack, but it costs HP equal to all your stacks each turn.',
    flavor: 'The ceiling of the world has cracked. Light pours through, and it cuts.',
    weight: 1,
    mods: { combat: { fractureDamagePerStack: 2, fractureSelfDamageRatio: 1 } },
  },
  {
    id: 'restless-engines',
    name: 'The Restless Engines',
    text: 'Relics take 1 more Strain before cracking. Elites are far more common.',
    flavor: 'Old machines turn in their sleep. So do the things that guard them.',
    weight: 1,
    mods: { combat: { maxStrainBonus: 1 }, nodeWeights: { elite: 2.2 } },
  },
  {
    id: 'hollow-bargain',
    name: 'The Hollow Bargain',
    text: 'You begin with 2 Corruption. Events and Relic Caches are more common.',
    flavor: 'The vault offers more tonight. It always asks more in return.',
    weight: 1,
    mods: { startCorruption: 2, nodeWeights: { event: 1.6, cache: 1.6 } },
  },
  {
    id: 'sleepers-breath',
    name: "The Sleeper's Breath",
    text: 'Enemies have 10% more HP. More Elites and Relic Caches. You start with 1 Corruption.',
    flavor: 'The walls rise and fall. Slowly. Somewhere below, something is almost awake.',
    weight: 1,
    // Joins the rotation at Awakening stage 4 ("Wakeful").
    minAwakening: 4,
    mods: { combat: { enemyHpMult: 1.1 }, nodeWeights: { elite: 1.5, cache: 1.5 }, startCorruption: 1 },
  },
  {
    // Never rolled. Loops in progress when milestone 3 arrived were given this.
    id: 'still-vault',
    name: 'The Still Vault',
    text: 'Nothing has shifted. Yet.',
    flavor: 'A held breath.',
    weight: 0,
    mods: {},
  },
];
