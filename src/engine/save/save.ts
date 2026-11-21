/**
 * Versioned save data.
 *
 * Rules for future updates:
 * 1. Never change the shape of SaveData without bumping SAVE_VERSION.
 * 2. Add a migration MIGRATIONS[oldVersion] that turns version N into N+1.
 * 3. Before migrating, the old raw save is copied to a backup key, so a bad
 *    migration can never destroy progress.
 * 4. Migrations describe history: they hard-code the content as it was,
 *    rather than reading today's content files.
 *
 * Storage is anything with getItem/setItem (localStorage in the browser,
 * an in-memory map in tests). Writes are synchronous so closing the tab
 * right after an action cannot lose it.
 */
import { defaultCombatModifiers } from '../combat/combat';
import type { Echo, NextLoop, OutpostState, RunState, RunStats, WorldState } from '../types';

export const SAVE_KEY = 'eotv.save';
export const SAVE_VERSION = 10;

export interface MetaProgress {
  /** Loops completed, by any means. */
  loops: number;
  victories: number;
  deaths: number;
  /** The most recent loops, newest first (capped; see BALANCE.history). */
  history: LoopRecord[];
}

/** One closed loop, as shown in Archive → History. */
export interface LoopRecord {
  /** Loop number (1 = the first loop ever closed). */
  loop: number;
  endedAt: number;
  classId: string;
  vaultShiftId: string;
  result: 'victory' | 'death';
  /** Map row reached (the boss row counts as the last row + 1). */
  depth: number;
  stats: RunStats;
  deck: string[];
  relics: string[];
  /** The Echo this loop left behind. */
  echoName: string;
  echoTraitId: string;
  /** Awakening stage the loop ran at. */
  awakeningStage: number;
  /** This loop unmade the Sleeper (ending a cycle). */
  unmadeSleeper?: boolean;
}

export interface SaveData {
  version: typeof SAVE_VERSION;
  createdAt: number;
  updatedAt: number;
  /** The loop in progress, if any. Includes the live fight, if any. */
  run: RunState | null;
  meta: MetaProgress;
  /** Pre-rolled next loop (null until the Outpost prepares one). */
  nextLoop: NextLoop | null;
  echoes: Echo[];
  /** A new Echo waiting for a free slot (or to be released). */
  pendingEcho: Echo | null;
  outpost: OutpostState;
  /** Last real time idle progress was counted up to. */
  idle: { lastTickAt: number };
  world: WorldState;
  settings: Settings;
}

export interface Settings {
  haptics: boolean;
  /** Show first-time hints. */
  hints: boolean;
  /** Hint ids already dismissed. */
  hintsSeen: string[];
  /** Effects and music volume, 0 to 1. */
  sound: number;
  music: number;
}

export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/* Migrations work on old, untyped shapes, so `any` is deliberate here. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Migration = (old: any) => any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;

/** The Relic-Breaker reward pool as it was in save v3 (milestone 3). */
const V3_CARD_POOL = [
  'twin-shards', 'hollow-vow', 'fault-line', 'blood-price', 'release-the-fault', 'glyph-wall', 'mirror-sigil',
  'bulwark-slam', 'bastion-rite', 'arc-conduit', 'coolant-litany', 'cascade', 'serrate', 'hemorrhage-glyph',
  'scar-tissue', 'crack-the-seal', 'sigil-lattice', 'rampart-breaker', 'spark-tithe', 'resonant-feedback',
  'unbind', 'open-veins', 'red-harvest',
];

/** MIGRATIONS[n] upgrades a version-n save to version n+1. */
export const MIGRATIONS: Record<number, Migration> = {
  // v1 (milestone 1) only held a combat sandbox. Sandbox fights were not
  // loops, so nothing carries over except the timestamps.
  1: (v1: { createdAt: number; updatedAt: number }) => ({
    version: 2,
    createdAt: v1.createdAt,
    updatedAt: v1.updatedAt,
    run: null,
    meta: { loops: 0, victories: 0, deaths: 0 },
  }),

  // v2 → v3 (milestone 3): runs gain Corruption, a Vault Shift, events seen,
  // richer combat modifiers, and caches offer several relics. A loop in
  // progress is kept and given the neutral "Still Vault" Shift.
  2: (v2: { run: Loose }) => {
    const run = v2.run;
    if (run) {
      run.corruption = 0;
      run.vaultShiftId = 'still-vault';
      run.seenEvents = [];
      run.stats = { ...run.stats, peakCorruption: 0, cursesGained: 0 };
      if (run.combat) run.combat.modifiers = { ...defaultCombatModifiers(), ...run.combat.modifiers };
      if (run.node?.kind === 'cache') run.node = { kind: 'cache', nodeId: run.node.nodeId, relicIds: run.node.relicId ? [run.node.relicId] : [] };
      // The old placeholder event had no choices: treat it as passed.
      if (run.node?.kind === 'event') {
        run.node = null;
        run.phase = 'map';
      }
    }
    return { ...v2, version: 3 };
  },

  // v3 → v4 (milestone 4): the idle layer. A loop in progress keeps the full
  // card pool it already had. Idle time starts counting from the last save.
  3: (v3: { run: Loose; updatedAt: number }) => {
    if (v3.run) {
      v3.run.cardPool = [...V3_CARD_POOL];
      v3.run.options = { shrinePurge: false, cacheChoices: 2, rewardRerolls: 0 };
    }
    return { ...v3, version: 4, ...v4IdleDefaults(v3.updatedAt) };
  },

  // v4 → v5: first-time hints. Players who have already finished a loop
  // know the basics, so those hints start dismissed for them.
  4: (v4: { meta: { loops: number }; settings: { haptics: boolean } }) => ({
    ...v4,
    version: 5,
    settings: {
      haptics: v4.settings.haptics,
      hints: true,
      hintsSeen: v4.meta.loops > 0 ? ['outpost-welcome', 'map-first', 'combat-cards', 'combat-intents'] : [],
    },
  }),

  // v5 → v6: a second Warden class. Everything that existed before was the
  // Relic-Breaker's. Fights in progress gain an empty timeline and Echo queue.
  5: (v5: Loose) => {
    const tagEcho = (e: Loose) => (e ? { ...e, origin: { classId: 'relic-breaker', ...e.origin } } : e);
    if (v5.run?.combat) {
      v5.run.combat.timeline = [];
      v5.run.combat.echoQueue = [];
    }
    return {
      ...v5,
      version: 6,
      outpost: { ...v5.outpost, classId: 'relic-breaker' },
      echoes: v5.echoes.map(tagEcho),
      pendingEcho: tagEcho(v5.pendingEcho),
    };
  },

  // v6 → v7: loop history (Archive → History) and sound. Past loops weren't
  // recorded, so history starts empty; the totals carry over unchanged.
  6: (v6: Loose) => ({
    ...v6,
    version: 7,
    meta: { ...v6.meta, history: [] },
    settings: { ...v6.settings, sound: 0.65, music: 0.35 },
  }),

  // v7 → v8: the Awakening. The reserved world.awakening gains a cycle and a
  // Lull counter; a loop in progress runs at stage 0; history rows gain a stage.
  7: (v7: Loose) => {
    if (v7.run) {
      v7.run.awakeningStage = 0;
      v7.run.shardsFound = 0;
    }
    const a = v7.world?.awakening ?? {};
    return {
      ...v7,
      version: 8,
      world: { factions: {}, ...v7.world, awakening: { stage: a.stage ?? 0, progress: a.progress ?? 0, cycle: 1, lullsThisStage: 0 } },
      meta: { ...v7.meta, history: v7.meta.history.map((h: Loose) => ({ ...h, awakeningStage: 0 })) },
    };
  },

  // v8 → v9: Awakening stages 4–5 and cycles. A loop in progress is in cycle 1.
  8: (v8: Loose) => {
    if (v8.run) v8.run.awakeningCycle = 1;
    return { ...v8, version: 9 };
  },

  // v9 → v10: the Echo-Caller. A loop in progress has an empty Chorus (it
  // started before Echoes could be Called); a live fight gains empty ally state.
  9: (v9: Loose) => {
    if (v9.run) {
      v9.run.chorus = [];
      if (v9.run.combat) Object.assign(v9.run.combat, { allies: [], chorus: [], called: [], fallen: [], allyActs: 1, allyHpLoss: 0 });
    }
    return { ...v9, version: 10 };
  },
};

/** The idle-layer defaults as they were introduced in v4 (history: do not change). */
function v4IdleDefaults(now: number) {
  return { ...idleDefaults(now), settings: { haptics: true } };
}

function idleDefaults(now: number) {
  return {
    nextLoop: null,
    echoes: [],
    pendingEcho: null,
    outpost: { shards: 0, unlocks: [], research: { completed: 0, progress: 0 }, cards: [], lore: [], scouting: 0, classId: 'relic-breaker', kitId: 'standard' },
    idle: { lastTickAt: now },
    world: { factions: {}, awakening: { stage: 0, progress: 0, cycle: 1, lullsThisStage: 0 } },
    settings: { haptics: true, hints: true, hintsSeen: [] as string[], sound: 0.65, music: 0.35 },
  };
}

export function newSave(now: number): SaveData {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    run: null,
    meta: { loops: 0, victories: 0, deaths: 0, history: [] },
    ...idleDefaults(now),
  };
}

export type LoadResult =
  | { status: 'empty' }
  | { status: 'ok'; save: SaveData; migratedFrom?: number }
  | { status: 'corrupt'; backupKey: string }
  | { status: 'tooNew'; version: number };

export function loadSave(storage: SaveStorage, migrations: Record<number, Migration> = MIGRATIONS): LoadResult {
  const raw = storage.getItem(SAVE_KEY);
  if (raw === null) return { status: 'empty' };

  let data: { version?: unknown };
  try {
    data = JSON.parse(raw);
    if (typeof data !== 'object' || data === null || typeof data.version !== 'number') throw new Error('no version');
  } catch {
    const backupKey = `${SAVE_KEY}.corrupt.${Date.now()}`;
    storage.setItem(backupKey, raw);
    return { status: 'corrupt', backupKey };
  }

  const version = data.version as number;
  // A save from a newer build: refuse to touch it rather than downgrade it.
  if (version > SAVE_VERSION) return { status: 'tooNew', version };
  if (version === SAVE_VERSION) return { status: 'ok', save: data as SaveData };

  storage.setItem(`${SAVE_KEY}.backup.v${version}`, raw);
  let migrated: unknown = data;
  for (let v = version; v < SAVE_VERSION; v++) {
    const migrate = migrations[v];
    if (!migrate) throw new Error(`No migration from save version ${v}`);
    migrated = migrate(migrated);
  }
  return { status: 'ok', save: migrated as SaveData, migratedFrom: version };
}

export function writeSave(storage: SaveStorage, save: SaveData, now: number): SaveData {
  const stamped = { ...save, updatedAt: now };
  storage.setItem(SAVE_KEY, JSON.stringify(stamped));
  return stamped;
}
