/**
 * The Echo-Caller's Chorus: your Outpost Echoes, copied into a loop as allies
 * to Call, and the stability their Calls cost when the loop closes.
 *
 * The loop works from a copy, never from live Outpost state, so fights stay
 * deterministic and resumable. Costs are settled once, in closeLoop.
 */
import { BALANCE } from '../../data/balance';
import type { ChorusMember, Content, Echo, RunState } from '../types';
import { traitBattle } from '../combat/allies';

const A = BALANCE.allies;
/** Calling costs no stability with this relic (Severed Thread). */
const SEVERED_THREAD = 'severed-thread';

/** Ally HP for an Echo: from how deep its loop went, then its trait. */
export function allyHp(echo: Echo, content: Content): number {
  const base = Math.min(A.maxHp, A.baseHp + A.hpPerDepth * echo.origin.depth);
  return Math.round(base * (traitBattle(content, echo.traitId).hpMult ?? 1));
}

export function chorusFrom(echoes: Echo[], content: Content): ChorusMember[] {
  return echoes.map((e) => ({
    echoId: e.id,
    name: e.name,
    traitId: e.traitId,
    deck: [...e.deckSnapshot],
    maxHp: allyHp(e, content),
    stability: e.stability,
    calls: 0,
    falls: 0,
  }));
}

/** Stability a Chorus member's Calls and falls cost (so far). */
export function chorusCost(m: ChorusMember, run: Pick<RunState, 'relics'>): number {
  const callCost = run.relics.includes(SEVERED_THREAD) ? 0 : A.callCost;
  return m.calls * callCost + m.falls * A.fallCost;
}

/**
 * Settle the loop's Calls: each Called Echo loses stability, and any drained
 * to nothing Unravels. Echoes released or Unraveled during the loop are skipped.
 */
export function settleChorus(echoes: Echo[], run: RunState): { echoes: Echo[]; unraveled: string[] } {
  const unraveled: string[] = [];
  const out: Echo[] = [];
  for (const echo of echoes) {
    const m = run.chorus?.find((c) => c.echoId === echo.id);
    if (!m || (m.calls === 0 && m.falls === 0)) {
      out.push(echo);
      continue;
    }
    const cost = chorusCost(m, run);
    const stability = echo.stability - cost;
    if (stability <= 0) {
      unraveled.push(echo.name);
      continue;
    }
    out.push({ ...echo, stability, lastCall: { calls: m.calls, falls: m.falls, cost } });
  }
  return { echoes: out, unraveled };
}
