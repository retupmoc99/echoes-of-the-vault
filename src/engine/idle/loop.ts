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

export function runOptionsFor(outpost: OutpostState): RunOptions {
  const has = (id: string) => outpost.unlocks.includes(id);
  return {
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
      options: runOptionsFor(save.outpost),
      awakeningStage: save.world.awakening.stage,
      awakeningCycle: save.world.awakening.cycle,
      extraRelics: save.outpost.unlocks.includes(SLEEPERS_EYE) ? [SLEEPERS_EYE] : [],
      chorus: chorusFrom(save.echoes, content),
    },
    content,
  );
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

/**
 * Close a finished loop: record it, leave an Echo, roll the next loop.
 * With all slots full, the Echo waits as `pendingEcho` (an older pending one fades).
 */
export function closeLoop(save: SaveData, content: Content, now: number): SaveData {
  const run = save.run;
  if (!run || run.phase !== 'ended') return save;

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
  if (result === 'victory' && run.seenEncounters.includes(SLEEPER_ENCOUNTER)) record.unmadeSleeper = true;

  const closed: SaveData = {
    ...save,
    run: null,
    meta: {
      loops,
      victories: save.meta.victories + (result === 'victory' ? 1 : 0),
      deaths: save.meta.deaths + (result === 'death' ? 1 : 0),
      history: [record, ...save.meta.history].slice(0, BALANCE.history.limit),
    },
    // Shards found in the loop (Awakening elites) are banked now.
    outpost: run.shardsFound ? { ...save.outpost, shards: save.outpost.shards + run.shardsFound } : save.outpost,
    echoes: hasRoom ? [...settled.echoes, echo] : settled.echoes,
    pendingEcho: hasRoom ? save.pendingEcho : echo,
  };
  // Unmaking the Sleeper ends the cycle; any other loop stirs it.
  const unmade = result === 'victory' && run.seenEncounters.includes(SLEEPER_ENCOUNTER);
  const after = unmade ? completeCycle(closed, content) : addAwakening(closed, loopAwakening(result), content);
  return prepareNextLoop(after, content);
}
