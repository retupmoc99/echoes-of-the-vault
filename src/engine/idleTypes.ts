/**
 * Types for the idle layer: Echoes, the Outpost, research and the world.
 * Everything here lives in the save file, so it stays plain JSON.
 */
import type { RunStats } from './types';

export type EchoTaskKind = 'dig' | 'research' | 'scout';

export interface EchoTask {
  kind: EchoTaskKind;
  /** Real-world ms timestamp the task started. */
  startedAt: number;
}

/** A ghostly copy of a finished loop. Finite: work wears it down until it Unravels. */
export interface Echo {
  id: string;
  name: string;
  traitId: string;
  /** Deck at the end of the loop (hook for summoning Echoes as allies). */
  deckSnapshot: string[];
  origin: {
    /** The Warden class that ran the loop. */
    classId: string;
    loop: number;
    result: 'victory' | 'death';
    depth: number;
    peakCorruption: number;
    vaultShiftId: string;
  };
  stability: number;
  maxStability: number;
  task: EchoTask | null;
  createdAt: number;
}

/** Conditions on how a loop went, used to pick an Echo's trait. All listed bounds must hold. */
export interface TraitCondition {
  stat: keyof RunStats | 'depth' | 'deckSize' | 'victory';
  min?: number;
  max?: number;
}

export interface EchoTraitDef {
  id: string;
  name: string;
  description: string;
  /** Checked in list order; the first trait whose conditions all hold wins. */
  when: TraitCondition[];
  mods: {
    stabilityMult?: number;
    drainMult?: number;
    digMult?: number;
    researchMult?: number;
    scoutMult?: number;
  };
}

export interface OutpostUnlockDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  flavor: string;
}

export type ResearchItem = { kind: 'card'; cardId: string } | { kind: 'lore'; loreId: string };

export interface LoreFragment {
  id: string;
  title: string;
  text: string;
}

export interface IdleContent {
  traits: EchoTraitDef[];
  unlocks: OutpostUnlockDef[];
  research: ResearchItem[];
  lore: Record<string, LoreFragment>;
  /** Pieces for generated Echo names. */
  names: { given: string[]; epithets: string[] };
}

/** The next loop, rolled in advance so Scouts can see it. */
export interface NextLoop {
  seed: string;
  vaultShiftId: string;
  /** The Shift Bell was rung for this loop (one reroll). */
  shiftRerolled: boolean;
}

export interface OutpostState {
  shards: number;
  unlocks: string[];
  /** Index of the next research item, and points toward it. */
  research: { completed: number; progress: number };
  /** Cards Research has added to the reward pool. */
  cards: string[];
  lore: string[];
  /** Scout-hours spent on the next loop. */
  scouting: number;
  /** Warden class for the next loop. */
  classId: string;
  /** Starter kit for the next loop (belongs to `classId`). */
  kitId: string;
}

/** Hooks for the world changing over real days. Not used yet. */
export interface WorldState {
  factions: Record<string, number>;
  awakening: { stage: number; progress: number };
}

/** What happened while the player was away (or since the last tick). */
export interface IdleReport {
  elapsedMs: number;
  /** True if more time passed than the offline cap allows. */
  capped: boolean;
  shards: number;
  researched: { kind: 'card' | 'lore'; name: string }[];
  unraveled: { name: string; task: EchoTaskKind }[];
  scoutRevealed: ('shift' | 'map')[];
}
