/**
 * Echoes: what a finished loop leaves behind.
 * Name, trait and stability all come from how the loop went, so every
 * loop's Echo is a little different, and the same loop always gives the same Echo.
 */
import { BALANCE } from '../../data/balance';
import { createRng, rngPick } from '../rng';
import type { Content, Echo, EchoTaskKind, EchoTraitDef, RunState, TraitCondition } from '../types';

const E = BALANCE.echoes;

export function loopDepth(run: RunState): number {
  return run.position ? run.map.nodes[run.position].row + 1 : 0;
}

function statValue(run: RunState, stat: TraitCondition['stat']): number {
  switch (stat) {
    case 'depth':
      return loopDepth(run);
    case 'deckSize':
      return run.deck.length;
    case 'victory':
      return run.result === 'victory' ? 1 : 0;
    default: {
      const v = run.stats[stat];
      return typeof v === 'boolean' ? (v ? 1 : 0) : v;
    }
  }
}

export function pickTrait(run: RunState, content: Content): EchoTraitDef {
  const traits = content.idle.traits;
  const fits = (t: EchoTraitDef) =>
    t.when.every((c) => {
      const v = statValue(run, c.stat);
      return (c.min === undefined || v >= c.min) && (c.max === undefined || v <= c.max);
    });
  // The last trait should have no conditions and acts as the fallback.
  return traits.find(fits) ?? traits[traits.length - 1];
}

export function createEcho(run: RunState, loopNumber: number, now: number, content: Content): Echo {
  if (run.phase !== 'ended' || !run.result) throw new Error('Only a finished loop leaves an Echo.');
  const rng = createRng(`${run.seed}:echo`);
  const trait = pickTrait(run, content);
  const depth = loopDepth(run);

  const base = E.baseStability + depth * E.stabilityPerDepth + (run.result === 'victory' ? E.victoryStability : 0);
  const maxStability = Math.round(base * (trait.mods.stabilityMult ?? 1));

  return {
    id: `echo-${run.seed}`,
    name: `${rngPick(rng, content.idle.names.given)} ${rngPick(rng, content.idle.names.epithets)}`,
    traitId: trait.id,
    deckSnapshot: [...run.deck],
    origin: { loop: loopNumber, result: run.result, depth, peakCorruption: run.stats.peakCorruption, vaultShiftId: run.vaultShiftId },
    stability: maxStability,
    maxStability,
    task: null,
    createdAt: now,
  };
}

export function traitOf(echo: Echo, content: Content): EchoTraitDef {
  return content.idle.traits.find((t) => t.id === echo.traitId) ?? content.idle.traits[content.idle.traits.length - 1];
}

/** Stability lost per hour on a task. */
export function drainPerHour(echo: Echo, kind: EchoTaskKind, content: Content): number {
  return E.drainPerHour[kind] * (traitOf(echo, content).mods.drainMult ?? 1);
}

/** Hours of work left before the Echo Unravels (if kept on `kind`). */
export function hoursLeft(echo: Echo, kind: EchoTaskKind, content: Content): number {
  return echo.stability / drainPerHour(echo, kind, content);
}
