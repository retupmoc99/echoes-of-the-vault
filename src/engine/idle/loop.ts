/**
 * The loop's life cycle around the Outpost:
 *   prepareNextLoop → (Scouts look ahead) → startLoop → … → closeLoop → Echo
 */
import { BALANCE } from '../../data/balance';
import { createRng, rngWeighted } from '../rng';
import { createRun } from '../run/run';
import type { Content, NextLoop, OutpostState, RunOptions, RunState } from '../types';
import type { LoopRecord, SaveData } from '../save/save';
import { SLEEPERS_EYE, SLEEPER_ENCOUNTER, addAwakening, completeCycle, loopAwakening } from './awakening';
import { chorusFrom, settleChorus } from './chorus';
import { closeDaily } from './daily';
import { createEcho } from './echoes';

/** Roll a Vault Shift; Shifts gated by the Awakening only appear once it's deep enough. */
function rollShift(seed: string, content: Content, awakeningStage: number, exclude?: string): string {
  const weights: Record<string, number> = {};
  for (const s of Object.values(content.vaultShifts)) {
    if (s.id !== exclude && (s.minAwakening ?? 0) <= awakeningStage) weights[s.id] = s.weight;
  }
  return rngWeighted(createRng(seed), weights);
}

/** Make sure the next loop is rolled. Its seed is derived from the save, so no clock is needed. */
export function prepareNextLoop(save: SaveData, content: Content): SaveData {
  if (save.nextLoop) return save;
  const seed = `${save.createdAt.toString(36)}-loop${save.meta.loops + 1}`;
  const nextLoop: NextLoop = { seed, vaultShiftId: rollShift(`${seed}:shift`, content, save.world.awakening.stage), shiftRerolled: false };
  return { ...save, nextLoop };
}

export function runOptionsFor(outpost: OutpostState, victories = 0): RunOptions {
  const has = (id: string) => outpost.unlocks.includes(id);
  return {
    // The Deeper Vault opens after your first escape.
    stairs: victories > 0,
    shrinePurge: has('shrine-of-ash'),
    cacheChoices: has('reliquary-key') ? BALANCE.outpost.keyCacheChoices : BALANCE.rewards.cacheRelicChoices,
    rewardRerolls: has('second-sight') ? 1 : 0,
  };
}

/** The run the next loop will be, exactly. Scouts use it to preview the map. */
export function nextRunPreview(save: SaveData, content: Content): RunState | null {
  if (!save.nextLoop) return null;
  return createRun(
    {
      seed: save.nextLoop.seed,
      classId: save.outpost.classId,
      vaultShiftId: save.nextLoop.vaultShiftId,
      kitId: save.outpost.kitId,
      unlockedCards: save.outpost.cards,
      options: runOptionsFor(save.outpost, save.meta.victories),
      awakeningStage: save.world.awakening.stage,
      awakeningCycle: save.world.awakening.cycle,
      extraRelics: save.outpost.unlocks.includes(SLEEPERS_EYE) ? [SLEEPERS_EYE] : [],
      chorus: chorusFrom(save.echoes, content),
      extraRelicPool: deepRelicsFor(save, content),
    },
    content,
  );
}

/** Escaping floor 2 once adds the Well's relic for each Warden to its reward pool. */
export const WELL_UNLOCK = 'the-well';
function deepRelicsFor(save: SaveData, content: Content): string[] {
  if (!save.outpost.unlocks.includes(WELL_UNLOCK)) return [];
  return Object.values(content.relics)
    .filter((r) => r.deepFor === save.outpost.classId)
    .map((r) => r.id);
}

export function startLoop(save: SaveData, content: Content): SaveData {
  if (save.run) throw new Error('A loop is already running.');
  const prepared = prepareNextLoop(save, content);
  const run = nextRunPreview(prepared, content)!;
  return { ...prepared, run, nextLoop: null, outpost: { ...prepared.outpost, scouting: 0 } };
}

/** Ring the Shift Bell: reroll the next loop's Shift once. */
export function ringShiftBell(save: SaveData, content: Content): SaveData | string {
  if (!save.outpost.unlocks.includes('shift-bell')) return 'The bell is not yours to ring.';
  const next = save.nextLoop;
  if (!next) return 'There is no loop to shift.';
  if (next.shiftRerolled) return 'The bell has already rung for this loop.';
  const vaultShiftId = rollShift(`${next.seed}:bell`, content, save.world.awakening.stage, next.vaultShiftId);
  return { ...save, nextLoop: { ...next, vaultShiftId, shiftRerolled: true } };
}

/** The Sleeper fell this loop (it counts even if you then died on floor 2). */
function sleeperUnmade(run: RunState): boolean {
  return run.stats.sleeperUnmade ?? (run.result === 'victory' && run.seenEncounters.includes(SLEEPER_ENCOUNTER));
}

/**
 * Close a finished loop: record it, leave an Echo, roll the next loop.
 * With all slots full, the Echo waits as `pendingEcho` (an older pending one fades).
 */
export function closeLoop(save: SaveData, content: Content, now: number): SaveData {
  const run = save.run;
  if (!run || run.phase !== 'ended') return save;
  // A Daily is a side room: no Echo, no Awakening, no Chorus cost.
  if (run.daily) return closeDaily(save, now);

  const loops = save.meta.loops + 1;
  const echo = createEcho(run, loops, now, content);
  // Echo-Caller: Calls cost the Called Echoes stability; drained ones Unravel (freeing slots).
  const settled = settleChorus(save.echoes, run);
  const hasRoom = settled.echoes.length < BALANCE.echoes.slots;
  const result = run.result ?? 'death';
  const record: LoopRecord = {
    loop: loops,
    endedAt: now,
    classId: run.classId,
    vaultShiftId: run.vaultShiftId,
    result,
    depth: echo.origin.depth,
    stats: run.stats,
    deck: run.deck,
    relics: run.relics,
    echoName: echo.name,
    echoTraitId: echo.traitId,
    awakeningStage: run.awakeningStage,
  };
  if (sleeperUnmade(run)) record.unmadeSleeper = true;
  if (run.floor > 1) record.floor = run.floor;

  const closed: SaveData = {
    ...save,
    run: null,
    meta: {
      loops,
      victories: save.meta.victories + (result === 'victory' ? 1 : 0),
      deaths: save.meta.deaths + (result === 'death' ? 1 : 0),
      history: [record, ...save.meta.history].slice(0, BALANCE.history.limit),
      ...(run.stats.deepBossWon ? { deepEscapes: (save.meta.deepEscapes ?? 0) + 1 } : save.meta.deepEscapes ? { deepEscapes: save.meta.deepEscapes } : {}),
    },
    // Shards found in the loop are banked now; the first escape from floor 2 finds the Well's relics.
    outpost: {
      ...save.outpost,
      shards: save.outpost.shards + run.shardsFound,
      unlocks: run.stats.deepBossWon && !save.outpost.unlocks.includes(WELL_UNLOCK) ? [...save.outpost.unlocks, WELL_UNLOCK] : save.outpost.unlocks,
    },
    echoes: hasRoom ? [...settled.echoes, echo] : settled.echoes,
    pendingEcho: hasRoom ? save.pendingEcho : echo,
  };
  // Unmaking the Sleeper ends the cycle; any other loop stirs it.
  // A loop that reached floor 2 stirs it a little more.
  const stir = loopAwakening(result) + (run.floor > 1 ? BALANCE.deep.awakeningBonus : 0);
  const after = sleeperUnmade(run) ? completeCycle(closed, content) : addAwakening(closed, stir, content);
  return prepareNextLoop(after, content);
}
