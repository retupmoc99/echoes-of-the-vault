/**
 * The Awakening: a slow meter that rises with activity (loops closed, Echo
 * work done), never with time away. Each stage makes loops harder and richer.
 * See docs/design/awakening.md.
 */
import { BALANCE } from '../../data/balance';
import type { AwakeningState, Content, Echo } from '../types';
import type { SaveData } from '../save/save';

const A = BALANCE.awakening;

/**
 * Highest progress allowed. With every stage built it's the last threshold;
 * if a stage were missing, progress would stop one point short of it.
 */
export function awakeningCap(): number {
  const t: readonly number[] = A.thresholds;
  return A.maxStage >= t.length ? t[t.length - 1] : t[A.maxStage] - 1;
}

/** Stage 5: the Sleeper is awake. It holds there until it is unmade. */
export const AWAKE = 5;
/** The boss encounter that replaces the Lock at stage 5. */
export const SLEEPER_ENCOUNTER = 'the-sleeper';
/** The relic every loop starts with once the Sleeper has been unmade. */
export const SLEEPERS_EYE = 'sleepers-eye';
/** Lore revealed the first time the Sleeper is unmade. */
const CYCLE_LORE = 'lore-unmade';

/** True while Lull and Give can still move it (not once it's Awake). */
export function canPushBack(a: AwakeningState): boolean {
  return a.stage < AWAKE && a.progress > 0;
}

/**
 * The Sleeper is unmade: bank its Shards, keep its Eye, reveal the cycle's
 * lore, and start the next cycle from Dormant.
 */
export function completeCycle(save: SaveData, content: Content): SaveData {
  const a = save.world.awakening;
  const lore = save.outpost.lore.includes(CYCLE_LORE) || !content.idle.lore[CYCLE_LORE] ? save.outpost.lore : [...save.outpost.lore, CYCLE_LORE];
  const unlocks = save.outpost.unlocks.includes(SLEEPERS_EYE) ? save.outpost.unlocks : [...save.outpost.unlocks, SLEEPERS_EYE];
  return {
    ...save,
    outpost: { ...save.outpost, shards: save.outpost.shards + A.sleeperShards, lore, unlocks },
    world: { ...save.world, awakening: { stage: 0, progress: 0, cycle: a.cycle + 1, lullsThisStage: 0 } },
  };
}

/** Stage for a given amount of progress (0 = Dormant). */
export function stageFor(progress: number): number {
  let stage = 0;
  for (const t of A.thresholds) if (progress >= t) stage++;
  return Math.min(stage, A.maxStage);
}

/**
 * Add (or, with a negative amount, remove) progress. Keeps the stage in sync,
 * resets the Lull price when the stage changes, and grants each stage's lore
 * fragment the first time that stage is reached.
 */
export function addAwakening(save: SaveData, amount: number, content: Content): SaveData {
  const before = save.world.awakening;
  // Once Awake, it can't be pushed back below Awake: only unmaking it ends that.
  const floor = before.stage >= AWAKE ? A.thresholds[AWAKE - 1] : 0;
  const progress = Math.max(floor, Math.min(awakeningCap(), before.progress + amount));
  const stage = stageFor(progress);
  const awakening: AwakeningState = {
    ...before,
    progress,
    stage,
    lullsThisStage: stage === before.stage ? before.lullsThisStage : 0,
  };

  let lore = save.outpost.lore;
  for (let s = before.stage + 1; s <= stage; s++) {
    const id = content.awakening.stages[s]?.loreId;
    if (id && !lore.includes(id)) lore = [...lore, id];
  }
  return {
    ...save,
    world: { ...save.world, awakening },
    outpost: lore === save.outpost.lore ? save.outpost : { ...save.outpost, lore },
  };
}

/** Progress a closed loop adds: more for escaping (beating the boss rattles it). */
export function loopAwakening(result: 'victory' | 'death'): number {
  return A.perLoop + (result === 'victory' ? A.perEscape : 0);
}

/** Shards the next Lull costs at the current stage. */
export function lullCost(a: AwakeningState): number {
  return A.lull.baseCost + A.lull.costStep * a.lullsThisStage;
}

/** Progress removed by giving this Echo to the Sleeper. */
export function giveValue(echo: Echo): number {
  return Math.floor(echo.stability / A.giveDivisor);
}

/** Next stage's threshold, or null at the highest stage that exists. */
export function nextThreshold(a: AwakeningState): number | null {
  return a.stage < A.maxStage ? A.thresholds[a.stage] : null;
}
