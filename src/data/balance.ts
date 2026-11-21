/**
 * Every global tuning number lives here.
 *
 * Per-card / per-enemy numbers (Shatter Lens deals 12) stay in their content
 * files, next to the text that describes them. This file holds the rules of
 * the world: energy, hand size, how strong each status is, and so on.
 */
export const BALANCE = {
  player: {
    resonancePerTurn: 3,
    drawPerTurn: 5,
    maxHandSize: 10,
    relicBreakerMaxHp: 70,
    hourThiefMaxHp: 68,
  },

  status: {
    fracture: {
      /** Extra damage on each attack hit, per stack. */
      damagePerStack: 1,
      /** At end of the owner's turn, lose floor(stacks * ratio) HP. Ignores Ward. */
      selfDamageRatio: 0.5,
    },
    bleed: {
      /** Stacks lost after each tick (at the start of the owner's turn). */
      decayPerTurn: 1,
    },
    weakened: {
      /** Owner's attacks deal this fraction less damage. */
      damageReduction: 0.25,
    },
    exposed: {
      /** Owner takes this fraction more attack damage. */
      damageIncrease: 0.5,
    },
    paradox: {
      /** At the end of the owner's turn, at this many stacks, the timeline snaps back. */
      snapThreshold: 5,
      /** HP lost per stack when it snaps (Paradox then resets to 0). */
      snapDamagePerStack: 2,
    },
  },

  relic: {
    /** Overloads before a relic cracks for the rest of the fight. */
    defaultMaxStrain: 3,
  },

  map: {
    /** Rows before the boss. Row 0 is all fights, the last row all Shrines. */
    rows: 8,
    minWidth: 2,
    maxWidth: 4,
    /** Chance for each node to grow an extra (non-crossing) path. */
    branchChance: 0.4,
    eliteMinRow: 3,
    shrineMinRow: 2,
    /** From this row on, normal fights use the 'late' encounter pool. */
    lateStageFromRow: 4,
    /** Relative odds of each node type in the middle rows. */
    weights: { fight: 45, event: 22, elite: 10, cache: 10, shrine: 13 },
  },

  shrine: {
    /** Fraction of max HP restored by resting. */
    healRatio: 0.3,
    /** Cards can't be removed below this deck size. */
    minDeckSize: 5,
  },

  corruption: {
    /** Each threshold reached adds a tier. */
    thresholds: [3, 6, 9],
    /** Enemy max HP +8% per tier. */
    enemyHpPerTier: 0.08,
    /** Enemy attacks +1 per tier. */
    enemyDamagePerTier: 1,
    /** Crossing into these tiers adds a curse to your deck. */
    curseAtTiers: [2, 3],
    /** Extra rare weight in card rewards per tier. */
    rareWeightPerTier: 7,
    /** Corruption for taking the tainted (rare) card from a reward. */
    taintedCardCost: 1,
  },

  rewards: {
    /** Cards offered after a fight (plus Vault Shift bonus). */
    choices: 3,
    rarityWeights: {
      normal: { common: 60, uncommon: 32, rare: 8 },
      elite: { common: 25, uncommon: 50, rare: 25 },
    },
    /** Relics offered by a Relic Cache (take one). */
    cacheRelicChoices: 2,
  },

  /** Archive → History keeps this many of the most recent loops. */
  history: { limit: 20 },

  echoes: {
    slots: 3,
    /** Base stability, plus per depth reached, plus a bonus for escaping. */
    baseStability: 50,
    stabilityPerDepth: 6,
    victoryStability: 30,
    /** Stability lost per hour of work, by task. */
    drainPerHour: { dig: 10, research: 12, scout: 8 },
  },

  idle: {
    /** Offline progress is capped at this many hours per absence. */
    offlineCapHours: 8,
    /** Shards per hour from one digging Echo (before trait). */
    shardsPerHour: 12,
    /** Research points per hour from one researching Echo (before trait). */
    researchPerHour: 1,
    /** Points needed for research item i: base + step × i. */
    researchCostBase: 2,
    researchCostStep: 0.5,
    /** Scout-hours needed to reveal the next loop's Shift, then its first rows. */
    scoutShiftHours: 1.5,
    scoutMapHours: 4,
    scoutMapRows: 4,
    /** How often the open app ticks idle progress. */
    tickSeconds: 15,
    /** Show the "while you were away" report after this much absence. */
    reportAfterSeconds: 90,
  },

  outpost: {
    /** Relic Cache size with the Reliquary Key unlock. */
    keyCacheChoices: 3,
    /** Corruption removed by the Shrine of Ash "Purge" option. */
    purgeAmount: 2,
  },

  engine: {
    /** Stops runaway trigger chains (relic A triggers B triggers A…). */
    maxTriggerDepth: 4,
  },
} as const;
