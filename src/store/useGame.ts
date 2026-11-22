/**
 * Glue between React and the engine.
 *
 * Every action follows the same path:
 *   engine step → write save → update React state → replay events as FX
 * so the game is saved after every single tap.
 *
 * Idle progress: the engine counts real time since the last tick. We tick on
 * boot, every few seconds while open, and when the app becomes visible again.
 * A long absence produces a "while you were away" report.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CONTENT } from '../data';
import { BALANCE } from '../data/balance';
import {
  activeDeeds,
  deedStatus,
  advanceIdle,
  exportSave,
  importSave,
  loadSave,
  SAVE_KEY,
  newSave,
  outpostStep,
  prepareNextLoop,
  reportIsEmpty,
  stepRun,
  writeSave,
  type IdleReport,
  type OutpostAction,
  type RunAction,
  type SaveData,
} from '../engine';
import { emitFx } from '../ui/fx/fxBus';
import { createSafeStorage } from './storage';

interface Boot {
  save: SaveData;
  /** False when the stored save is from a newer build: never overwrite it. */
  writable: boolean;
  notice?: string;
  awayReport: IdleReport | null;
}

function boot(storage: ReturnType<typeof createSafeStorage>): Boot {
  const result = loadSave(storage);
  const now = Date.now();
  let save: SaveData;
  let writable = true;
  let notice: string | undefined;

  switch (result.status) {
    case 'ok':
      save = result.save;
      break;
    case 'empty':
      save = newSave(now);
      if (!storage.persistent) notice = 'Storage unavailable: progress will not be kept.';
      break;
    case 'corrupt':
      save = newSave(now);
      notice = 'Save was damaged. A copy was kept; starting fresh.';
      break;
    case 'tooNew':
      save = newSave(now);
      writable = false;
      notice = 'This save is from a newer version. Not overwriting it.';
      break;
  }

  // Catch up on time spent away, and make sure the next loop is rolled.
  const ticked = advanceIdle(prepareNextLoop(save, CONTENT), now, CONTENT);
  const away = ticked.report.elapsedMs >= BALANCE.idle.reportAfterSeconds * 1000 && !reportIsEmpty(ticked.report);
  if (writable) writeSave(storage, ticked.save, now);
  return { save: ticked.save, writable, notice, awayReport: away ? ticked.report : null };
}

type Notice = { id: number; text: string };

/** Per-device note of the last backup (not part of the save, so restoring doesn't overwrite it). */
const LAST_BACKUP_KEY = 'eotv.lastBackup';

/** Turn an idle report into short toasts (used for progress while the app is open). */
function reportToNotices(r: IdleReport): string[] {
  return [
    ...r.researched.map((x) => (x.kind === 'card' ? `Research complete: ${x.name} joins the vault.` : `A fragment recovered: ${x.name}.`)),
    ...r.unraveled.map((x) => `${x.name} has Unraveled.`),
    ...r.scoutRevealed.map((x) => (x === 'shift' ? 'Your Scouts have read the next Shift.' : 'Your Scouts have mapped the way in.')),
  ];
}

export function useGame() {
  const storage = useMemo(createSafeStorage, []);
  const [initial] = useState(() => boot(storage));
  const [save, setSave] = useState(initial.save);
  const [awayReport, setAwayReport] = useState(initial.awayReport);
  const [error, setError] = useState<string>();
  const [notices, setNotices] = useState<Notice[]>([]);
  const noticeId = useRef(0);
  // The ref always holds the latest save, so rapid taps never act on a stale state.
  const saveRef = useRef(save);
  const writable = initial.writable;

  const commit = useCallback(
    (next: SaveData) => {
      const stamped = writable ? writeSave(storage, next, Date.now()) : next;
      saveRef.current = stamped;
      setSave(stamped);
    },
    [storage, writable],
  );

  const pushNotices = useCallback((texts: string[]) => {
    if (texts.length) setNotices((n) => [...n, ...texts.map((text) => ({ id: noticeId.current++, text }))]);
  }, []);

  // Announce Awakening stage changes, whatever caused them (a closed loop,
  // Echo work, a Lull, a gift). Not on load: only changes seen while open.
  const { stage: awakeningStage, cycle: awakeningCycle } = save.world.awakening;
  const lastAwakening = useRef({ stage: awakeningStage, cycle: awakeningCycle });
  useEffect(() => {
    const before = lastAwakening.current;
    lastAwakening.current = { stage: awakeningStage, cycle: awakeningCycle };
    if (awakeningCycle > before.cycle) {
      // Unmaking the Sleeper resets the stage too; announce the cycle instead.
      pushNotices([`☾ The Sleeper is unmade. +${BALANCE.awakening.sleeperShards} Shards, and its Eye is yours. Cycle ${awakeningCycle} begins.`]);
      return;
    }
    if (awakeningStage === before.stage) return;
    const st = CONTENT.awakening.stages[awakeningStage];
    pushNotices([
      awakeningStage > before.stage
        ? `☾ The Sleeper stirs: ${st.name}. ${st.danger} ${st.reward}`
        : `☾ The Sleeper settles: ${awakeningStage === 0 ? 'dormant again' : st.name}.`,
    ]);
  }, [awakeningStage, awakeningCycle, pushNotices]);

  // Announce deeds the moment they're done (a closed loop, the Awakening rising).
  const doneDeeds = activeDeeds(CONTENT)
    .filter((d) => deedStatus(save, d, CONTENT).done)
    .map((d) => d.id)
    .join(',');
  const lastDeeds = useRef(doneDeeds);
  useEffect(() => {
    const before = new Set(lastDeeds.current.split(',').filter(Boolean));
    lastDeeds.current = doneDeeds;
    const fresh = doneDeeds.split(',').filter((id) => id && !before.has(id));
    pushNotices(fresh.map((id) => `✦ Deed done: ${CONTENT.deeds![id].title}. A new Work stands at the Outpost.`));
  }, [doneDeeds, pushNotices]);

  // ── Idle ticking ──
  const tick = useCallback(() => {
    const { save: next, report } = advanceIdle(saveRef.current, Date.now(), CONTENT);
    commit(next);
    if (report.elapsedMs >= BALANCE.idle.reportAfterSeconds * 1000 && !reportIsEmpty(report)) setAwayReport(report);
    else pushNotices(reportToNotices(report));
  }, [commit, pushNotices]);

  useEffect(() => {
    const timer = setInterval(tick, BALANCE.idle.tickSeconds * 1000);
    const onVisible = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [tick]);

  // ── Outpost ──
  const outpost = useCallback(
    (action: OutpostAction) => {
      const result = outpostStep(saveRef.current, action, Date.now(), CONTENT);
      commit(result.save);
      setError(result.error);
      pushNotices(reportToNotices(result.report));
      return !result.error;
    },
    [commit, pushNotices],
  );

  // ── Inside a loop ──
  const dispatch = useCallback(
    (action: RunAction) => {
      const current = saveRef.current;
      if (!current.run) return;
      const result = stepRun(current.run, action, CONTENT);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      commit({ ...current, run: result.run });
      emitFx(result.events);
      pushNotices(result.notices);
    },
    [commit, pushNotices],
  );

  const dismissNotice = useCallback((id: number) => setNotices((n) => n.filter((x) => x.id !== id)), []);

  // ── Backup and restore ──
  const [lastBackupAt, setLastBackupAt] = useState<number | null>(() => Number(storage.getItem(LAST_BACKUP_KEY)) || null);

  const exportCode = useCallback(() => {
    const now = Date.now();
    storage.setItem(LAST_BACKUP_KEY, String(now));
    setLastBackupAt(now);
    return exportSave(saveRef.current);
  }, [storage]);

  const importCode = useCallback(
    (code: string): string | undefined => {
      const result = importSave(code);
      if (!result.ok) return result.error;
      // Keep the save being replaced, just in case.
      storage.setItem(`${SAVE_KEY}.beforeImport`, JSON.stringify(saveRef.current));
      const now = Date.now();
      commit(advanceIdle(prepareNextLoop(result.save, CONTENT), now, CONTENT).save);
      setAwayReport(null);
      setError(undefined);
      pushNotices(['Save restored. The loop remembers you.']);
      return undefined;
    },
    [commit, pushNotices, storage],
  );

  const updateSettings = useCallback(
    (patch: Partial<SaveData['settings']>) => commit({ ...saveRef.current, settings: { ...saveRef.current.settings, ...patch } }),
    [commit],
  );

  return {
    save,
    run: save.run,
    error,
    notice: initial.notice,
    notices,
    dismissNotice,
    awayReport,
    dismissAwayReport: () => setAwayReport(null),
    outpost,
    dispatch,
    updateSettings,
    exportCode,
    importCode,
    lastBackupAt,
    newRun: () => outpost({ type: 'startLoop' }),
    finishLoop: () => outpost({ type: 'closeLoop' }),
  };
}
