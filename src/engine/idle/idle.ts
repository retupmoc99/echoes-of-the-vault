/**
 * Idle progress from real-world time.
 *
 * advanceIdle(save, now) counts the time since `idle.lastTickAt`, at most
 * BALANCE.idle.offlineCapHours, and applies each working Echo's output.
 * The same function runs every few seconds while the app is open and once
 * on return after being away, so there is one code path to test.
 *
 * Unraveling is deterministic: an Echo works until its stability runs out,
 * and output stops at that exact moment. No dice are rolled while you're away.
 */
import { BALANCE } from '../../data/balance';
import type { Content, Echo, IdleReport } from '../types';
import type { SaveData } from '../save/save';
import { drainPerHour, traitOf } from './echoes';

const I = BALANCE.idle;
const HOUR = 3_600_000;

export function researchCost(index: number): number {
  return I.researchCostBase + I.researchCostStep * index;
}

export function researchComplete(save: SaveData, content: Content): boolean {
  return save.outpost.research.completed >= content.idle.research.length;
}

export function emptyReport(): IdleReport {
  return { elapsedMs: 0, capped: false, shards: 0, researched: [], unraveled: [], scoutRevealed: [] };
}

export function advanceIdle(save: SaveData, now: number, content: Content): { save: SaveData; report: IdleReport } {
  const report = emptyReport();
  const raw = now - save.idle.lastTickAt;
  // A clock moved backwards counts as zero time, and never rewinds lastTickAt.
  const elapsed = Math.max(0, Math.min(raw, I.offlineCapHours * HOUR));
  report.elapsedMs = elapsed;
  report.capped = raw > I.offlineCapHours * HOUR;

  const s: SaveData = structuredClone(save);
  s.idle.lastTickAt = Math.max(save.idle.lastTickAt, now);
  if (elapsed === 0) return { save: s, report };

  const hours = elapsed / HOUR;
  const shardsBefore = Math.floor(s.outpost.shards);
  const scoutingBefore = s.outpost.scouting;
  const survivors: Echo[] = [];

  for (const echo of s.echoes) {
    if (!echo.task) {
      survivors.push(echo);
      continue;
    }
    const kind = echo.task.kind;
    // Research with nothing left to learn is idle time, not work.
    if (kind === 'research' && researchComplete(s, content)) {
      survivors.push(echo);
      continue;
    }

    const drain = drainPerHour(echo, kind, content);
    const worked = Math.min(hours, echo.stability / drain);
    echo.stability = Math.max(0, echo.stability - drain * worked);
    const mods = traitOf(echo, content).mods;

    if (kind === 'dig') s.outpost.shards += worked * I.shardsPerHour * (mods.digMult ?? 1);
    if (kind === 'research') addResearch(s, worked * I.researchPerHour * (mods.researchMult ?? 1), content, report);
    if (kind === 'scout') s.outpost.scouting += worked * (mods.scoutMult ?? 1);

    // Tiny float leftovers count as gone.
    if (echo.stability <= 1e-6) report.unraveled.push({ name: echo.name, task: kind });
    else survivors.push(echo);
  }

  s.echoes = survivors;
  report.shards = Math.floor(s.outpost.shards) - shardsBefore;
  if (scoutingBefore < I.scoutShiftHours && s.outpost.scouting >= I.scoutShiftHours) report.scoutRevealed.push('shift');
  if (scoutingBefore < I.scoutMapHours && s.outpost.scouting >= I.scoutMapHours) report.scoutRevealed.push('map');
  return { save: s, report };
}

function addResearch(s: SaveData, points: number, content: Content, report: IdleReport): void {
  const r = s.outpost.research;
  r.progress += points;
  while (r.completed < content.idle.research.length && r.progress >= researchCost(r.completed)) {
    r.progress -= researchCost(r.completed);
    const item = content.idle.research[r.completed];
    r.completed++;
    if (item.kind === 'card') {
      s.outpost.cards.push(item.cardId);
      report.researched.push({ kind: 'card', name: content.cards[item.cardId].name });
    } else {
      s.outpost.lore.push(item.loreId);
      report.researched.push({ kind: 'lore', name: content.idle.lore[item.loreId].title });
    }
  }
  if (r.completed >= content.idle.research.length) r.progress = 0;
}

/** Did anything worth a "while you were away" report happen? */
export function reportIsEmpty(r: IdleReport): boolean {
  return r.shards === 0 && r.researched.length === 0 && r.unraveled.length === 0 && r.scoutRevealed.length === 0;
}

/** Merge two reports (for accumulating ticks). */
export function mergeReports(a: IdleReport, b: IdleReport): IdleReport {
  return {
    elapsedMs: a.elapsedMs + b.elapsedMs,
    capped: a.capped || b.capped,
    shards: a.shards + b.shards,
    researched: [...a.researched, ...b.researched],
    unraveled: [...a.unraveled, ...b.unraveled],
    scoutRevealed: [...a.scoutRevealed, ...b.scoutRevealed],
  };
}
