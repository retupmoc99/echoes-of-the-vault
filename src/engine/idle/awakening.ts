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
 * Highest progress allowed right now. Stages that aren't built yet can't be
 * reached: progress stops one point short of the first missing stage.
 */
export function awakeningCap(): number {
  return A.maxStage >= A.thresholds.length ? Infinity : A.thresholds[A.maxStage] - 1;
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
  const progress = Math.max(0, Math.min(awakeningCap(), before.progress + amount));
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
