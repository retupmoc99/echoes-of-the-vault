/**
 * Deeds (docs/design/deed-unlocks.md). The save keeps only a tally of what the
 * player has done; a deed is done whenever its check passes, so there is no
 * second record to fall out of step.
 */
import type { Content, DeedDef, DeedTally, RunState } from '../types';
import type { SaveData } from '../save/save';

export function newDeedTally(): DeedTally {
  return { peakAwakening: 0, maxCursesCarried: 0, elitesBeaten: [], shiftsEscaped: [], deepEscapes: 0 };
}

/** Fold a closed loop (or Daily) into the tally. */
export function tallyRun(tally: DeedTally, run: RunState, content: Content): DeedTally {
  const curses = run.deck.filter((id) => content.cards[id]?.rarity === 'curse').length;
  // Every encounter seen was won, except the fight a death ended in.
  // (Fights entered on this floor vs fights won tells whether the last one was lost.)
  const fightsEntered = run.visited.filter((id) => ['fight', 'elite', 'boss'].includes(run.map.nodes[id]?.type)).length;
  // Floor 2's map replaces floor 1's, so there fall back to where the loop ended.
  const last = run.position ? run.map.nodes[run.position] : undefined;
  const endedOnFight = !!last && ['fight', 'elite', 'boss'].includes(last.type);
  const diedInFight = run.result !== 'victory' && (run.floor === 1 ? run.stats.fightsWon < fightsEntered : endedOnFight);
  const won = diedInFight ? run.seenEncounters.slice(0, -1) : run.seenEncounters;
  const elites = won.filter((id) => content.encounters[id]?.tier === 'elite');
  return {
    ...tally,
    maxCursesCarried: Math.max(tally.maxCursesCarried, curses),
    elitesBeaten: [...new Set([...tally.elitesBeaten, ...elites])],
    shiftsEscaped: run.result === 'victory' ? [...new Set([...tally.shiftsEscaped, run.vaultShiftId])] : tally.shiftsEscaped,
    deepEscapes: tally.deepEscapes + (run.stats.deepBossWon ? 1 : 0),
  };
}

/** Raise the peak Awakening stage (it never falls). */
export function tallyAwakening(tally: DeedTally, stage: number): DeedTally {
  return stage > tally.peakAwakening ? { ...tally, peakAwakening: stage } : tally;
}

/** Progress toward a deed: done, and how far along (for the picker and the Archive). */
export function deedStatus(save: SaveData, deed: DeedDef, content: Content): { done: boolean; progress: number; goal: number } {
  const t = save.deeds;
  const g = deed.goal;
  const of = (have: number, need: number) => ({ done: have >= need, progress: Math.min(have, need), goal: need });
  switch (g.kind) {
    case 'peakAwakening':
      return of(t.peakAwakening, g.n);
    case 'cursesCarried':
      return of(t.maxCursesCarried, g.n);
    case 'shiftsEscaped':
      return of(t.shiftsEscaped.length, g.n);
    case 'deepEscapes':
      return of(t.deepEscapes, g.n);
    case 'allElites': {
      const all = Object.values(content.encounters).filter((e) => e.tier === 'elite').map((e) => e.id);
      return of(all.filter((id) => t.elitesBeaten.includes(id)).length, all.length);
    }
  }
}

/** Deeds whose Warden exists, in list order. */
export function activeDeeds(content: Content): DeedDef[] {
  return Object.values(content.deeds ?? {}).filter((d) => content.classes[d.warden]);
}

export function deedDone(save: SaveData, deedId: string, content: Content): boolean {
  const deed = content.deeds?.[deedId];
  return !!deed && deedStatus(save, deed, content).done;
}

/** A Work's `requires`: another Work (or Warden) built, or `deed:<id>` done. */
export function requirementMet(save: SaveData, requires: string | undefined, content: Content): boolean {
  if (!requires) return true;
  if (requires.startsWith('deed:')) return deedDone(save, requires.slice(5), content);
  return save.outpost.unlocks.includes(requires);
}
