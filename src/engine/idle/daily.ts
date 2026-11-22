/**
 * The Daily Descent: one loop a day, the same for everyone.
 *
 * The date is the seed, so every copy of the game builds the same map,
 * Shift, fights and rewards with no server. Each day also has an Omen (a
 * rule that bends the loop), picked by date so all of them come round
 * before any repeats.
 *
 * It is a side room, not a step forward: it leaves no Echo, never moves the
 * Awakening, ignores the Cycle, and Calls cost your Echoes nothing. One try
 * per day; missing a day costs nothing (days played is a total, never a streak).
 */
import { BALANCE } from '../../data/balance';
import { createRun } from '../run/run';
import type { Content, OmenDef, RunSetup } from '../types';
import type { LoopRecord, SaveData } from '../save/save';
import { chorusFrom } from './chorus';
import { tallyRun } from './deeds';
import { loopDepth } from './echoes';

const DAY_MS = 86_400_000;

/** The local calendar day of a timestamp, as YYYY-MM-DD. */
export function dayKey(now: number): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole days from 2026-01-01 to the given day (it only needs to be consistent). */
function dayNumber(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(2026, 0, 1)) / DAY_MS);
}

/** The day's Omen: Omens rotate in list order, one per day. */
export function omenForDay(day: string, content: Content): OmenDef {
  const omens = Object.values(content.omens ?? {});
  if (!omens.length) throw new Error('No Omens in content.');
  const n = omens.length;
  return omens[((dayNumber(day) % n) + n) % n];
}

export function dailyPlayed(save: SaveData, day: string): boolean {
  return save.daily.lastPlayed === day;
}

/**
 * The day's loop for the chosen Warden. Everyone starts even: the standard
 * kit, the full card pool, no Outpost works, Awakening and Cycle ignored.
 */
export function dailySetup(save: SaveData, day: string, content: Content): RunSetup {
  const cls = content.classes[save.outpost.classId];
  return {
    seed: `daily:${day}`,
    classId: cls.id,
    kitId: cls.kits[0].id,
    unlockedCards: cls.lockedCards,
    awakeningStage: 0,
    awakeningCycle: 1,
    chorus: chorusFrom(save.echoes, content),
    daily: day,
    omenId: omenForDay(day, content).id,
  };
}

export function startDaily(save: SaveData, now: number, content: Content): SaveData | string {
  if (save.run) return 'Finish the loop in progress first.';
  const day = dayKey(now);
  if (dailyPlayed(save, day)) return 'The vault has dreamed today’s dream. Come back tomorrow.';
  const run = createRun(dailySetup(save, day, content), content);
  // The day is used up the moment you descend (abandoning counts as a death).
  return { ...save, run, daily: { ...save.daily, lastPlayed: day, daysPlayed: save.daily.daysPlayed + 1 } };
}

/** Close a finished Daily: small flat Shards, a History entry, the day's result. No Echo. */
export function closeDaily(save: SaveData, now: number, content: Content): SaveData {
  const run = save.run;
  if (!run?.daily || run.phase !== 'ended') return save;
  const result = run.result ?? 'death';
  const depth = loopDepth(run);
  const D = BALANCE.daily;
  const shards = D.finishShards + (result === 'victory' ? D.escapeShards : 0);
  const record: LoopRecord = {
    loop: save.meta.loops,
    endedAt: now,
    classId: run.classId,
    vaultShiftId: run.vaultShiftId,
    result,
    depth,
    stats: run.stats,
    deck: run.deck,
    relics: run.relics,
    echoName: '',
    echoTraitId: '',
    awakeningStage: 0,
    daily: run.daily,
    omenId: run.omenId,
  };
  return {
    ...save,
    run: null,
    meta: { ...save.meta, history: [record, ...save.meta.history].slice(0, BALANCE.history.limit) },
    outpost: { ...save.outpost, shards: save.outpost.shards + shards },
    // Dailies are real play: they count toward deeds.
    deeds: tallyRun(save.deeds, run, content),
    daily: {
      ...save.daily,
      escapes: save.daily.escapes + (result === 'victory' ? 1 : 0),
      bestDepth: Math.max(save.daily.bestDepth, depth),
      last: { day: run.daily, omenId: run.omenId ?? '', classId: run.classId, result, depth, rows: run.map.nodes[run.map.bossId].row + 1, turns: run.stats.turns, shards },
    },
  };
}
