/**
 * The Outpost between loops: assign Echoes, spend Shards, prepare the descent.
 *
 * outpostStep(save, action, now) always counts idle time up to `now` first,
 * so changing an Echo's task never loses or double-counts progress.
 */
import { BALANCE } from '../../data/balance';
import type { Content, EchoTaskKind, IdleReport, MapNode } from '../types';
import type { SaveData } from '../save/save';
import { advanceIdle, researchComplete } from './idle';
import { closeLoop, nextRunPreview, prepareNextLoop, ringShiftBell, startLoop } from './loop';

export type OutpostAction =
  | { type: 'assign'; echoId: string; task: EchoTaskKind | null }
  | { type: 'buy'; unlockId: string }
  | { type: 'keepPending'; replaceId?: string }
  | { type: 'releasePending' }
  | { type: 'releaseEcho'; echoId: string }
  | { type: 'selectKit'; kitId: string }
  | { type: 'ringBell' }
  | { type: 'startLoop' }
  | { type: 'closeLoop' };

export interface OutpostResult {
  save: SaveData;
  report: IdleReport;
  error?: string;
}

export function outpostStep(save: SaveData, action: OutpostAction, now: number, content: Content): OutpostResult {
  const ticked = advanceIdle(save, now, content);
  const result = apply(ticked.save, action, now, content);
  // On a refused action, still keep the idle progress that was counted.
  if (typeof result === 'string') return { save: ticked.save, report: ticked.report, error: result };
  return { save: result, report: ticked.report };
}

function apply(s: SaveData, action: OutpostAction, now: number, content: Content): SaveData | string {
  switch (action.type) {
    case 'assign': {
      const echo = s.echoes.find((e) => e.id === action.echoId);
      if (!echo) return 'That Echo is gone.';
      if (action.task === 'research' && researchComplete(s, content)) return 'There is nothing left to research.';
      const task = action.task ? { kind: action.task, startedAt: now } : null;
      return { ...s, echoes: s.echoes.map((e) => (e.id === echo.id ? { ...e, task } : e)) };
    }
    case 'buy': {
      const unlock = content.idle.unlocks.find((u) => u.id === action.unlockId);
      if (!unlock) return 'No such work.';
      if (s.outpost.unlocks.includes(unlock.id)) return 'Already built.';
      if (Math.floor(s.outpost.shards) < unlock.cost) return 'Not enough Shards.';
      return { ...s, outpost: { ...s.outpost, shards: s.outpost.shards - unlock.cost, unlocks: [...s.outpost.unlocks, unlock.id] } };
    }
    case 'keepPending': {
      const pending = s.pendingEcho;
      if (!pending) return 'No Echo is waiting.';
      if (s.echoes.length < BALANCE.echoes.slots) return { ...s, echoes: [...s.echoes, pending], pendingEcho: null };
      if (!action.replaceId || !s.echoes.some((e) => e.id === action.replaceId)) return 'Choose an Echo to release.';
      return { ...s, echoes: s.echoes.map((e) => (e.id === action.replaceId ? pending : e)), pendingEcho: null };
    }
    case 'releasePending':
      return s.pendingEcho ? { ...s, pendingEcho: null } : 'No Echo is waiting.';
    case 'releaseEcho':
      if (!s.echoes.some((e) => e.id === action.echoId)) return 'That Echo is gone.';
      return { ...s, echoes: s.echoes.filter((e) => e.id !== action.echoId) };
    case 'selectKit': {
      const kit = content.classes['relic-breaker'].kits.find((k) => k.id === action.kitId);
      if (!kit) return 'No such kit.';
      if (kit.unlock && !s.outpost.unlocks.includes(kit.unlock)) return 'That kit is not yet yours.';
      return { ...s, outpost: { ...s.outpost, kitId: kit.id } };
    }
    case 'ringBell':
      return ringShiftBell(prepareNextLoop(s, content), content);
    case 'startLoop':
      if (s.run) return 'A loop is already running.';
      return startLoop(s, content);
    case 'closeLoop':
      if (s.run?.phase !== 'ended') return 'The loop has not ended.';
      return closeLoop(s, content, now);
  }
}

export interface ScoutInfo {
  scouting: number;
  shiftKnown: boolean;
  /** Revealed rows of the next map (empty until enough scouting). */
  rows: MapNode[][];
}

/** What Scouts have learned about the next loop. */
export function scoutInfo(save: SaveData, content: Content): ScoutInfo {
  const I = BALANCE.idle;
  const scouting = save.outpost.scouting;
  const shiftKnown = scouting >= I.scoutShiftHours;
  let rows: MapNode[][] = [];
  if (scouting >= I.scoutMapHours) {
    const preview = nextRunPreview(prepareNextLoop(save, content), content);
    if (preview) {
      for (const node of Object.values(preview.map.nodes)) {
        if (node.row < I.scoutMapRows) (rows[node.row] ??= []).push(node);
      }
      rows = rows.map((r) => r.sort((a, b) => a.col - b.col));
    }
  }
  return { scouting, shiftKnown, rows };
}
