/**
 * Balance report: plays many loops with the bot and prints win rates.
 *
 *   npm run sim                 (300 loops per class)
 *   SIM_RUNS=1000 npm run sim
 *   SIM_STAGE=3 npm run sim     (play at an Awakening stage)
 *   SIM_KITS=1 npm run sim      (every starting kit, not just each class's first)
 *   SIM_OMENS=1 npm run sim     (each class's first kit under every Daily Omen)
 *   SIM_DESCEND=1 npm run sim   (the Deeper Vault: the bot always Descends after the boss)
 *   SIM_CLASS=pilgrim           (only this Warden)
 *   SIM_PICK=rarest|none        (card drafting: the old rarest-first bot, or no reward cards)
 *
 * Runs under Vitest (it already compiles TypeScript), but it is not a test:
 * it never fails, and `npm test` skips it (only *.test.ts files run there).
 * Loops use the full card pool (all research done), like a mid-game player.
 */
import { it } from 'vitest';
import { CONTENT } from '../data';
import { createRun, stepRun, type ChorusMember, type RunState } from '../engine';
import { BALANCE } from '../data/balance';
import { nextBotAction, setBotDescends, setBotPicks, type PickMode } from './bot';

// (The app's tsconfig has no Node types, so reach process through globalThis.)
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const RUNS = Number(env.SIM_RUNS ?? 300);
/** Awakening stage to play at (SIM_STAGE=3 npm run sim). */
const STAGE = Number(env.SIM_STAGE ?? 0);
/** Play every kit (SIM_KITS=1 npm run sim); otherwise each class's first kit. */
const ALL_KITS = Boolean(env.SIM_KITS);
/** Play under every Daily Descent Omen (SIM_OMENS=1 npm run sim). */
const ALL_OMENS = Boolean(env.SIM_OMENS);
/** Always take the Descend door (SIM_DESCEND=1 npm run sim). */
const DESCEND = Boolean(env.SIM_DESCEND);
setBotDescends(DESCEND);
setBotPicks((env.SIM_PICK as PickMode | undefined) ?? 'draft');

const SIM_CHORUS: ChorusMember[] = Object.values(CONTENT.classes).map((c, i) => ({
  echoId: `sim-echo-${i}`,
  name: `Sim Echo ${i}`,
  traitId: 'faded',
  deck: c.starterDeck,
  maxHp: Math.min(BALANCE.allies.maxHp, BALANCE.allies.baseHp + 4 * BALANCE.allies.hpPerDepth),
  stability: 100,
  calls: 0,
  falls: 0,
}));

interface Outcome {
  won: boolean;
  shift: string;
  /** Row where the loop ended (the boss row = map.rows). */
  depth: number;
  diedAt: string;
  turns: number;
  fights: number;
  corruption: number;
  deck: string[];
  /** Floor the loop ended on. */
  floor: number;
}

function playLoop(classId: string, kitId: string, seed: string, omenId?: string): Outcome {
  const cls = CONTENT.classes[classId];
  // The Echo-Caller needs Echoes to Call: three mid-depth ones, carrying each Warden's starting deck.
  const chorus = classId === 'echo-caller' ? SIM_CHORUS : undefined;
  let r: RunState = createRun({ seed, classId, kitId, unlockedCards: cls.lockedCards, awakeningStage: STAGE, chorus, omenId, options: { stairs: DESCEND } }, CONTENT);
  for (let i = 0; i < 20000 && r.phase !== 'ended'; i++) {
    const res = stepRun(r, nextBotAction(r, CONTENT), CONTENT);
    if (res.error) throw new Error(`${seed}: bot made an illegal move: ${res.error}`);
    r = res.run;
  }
  if (r.phase !== 'ended') throw new Error(`${seed}: loop never ended`);
  const last = r.visited.at(-1);
  const lastNode = last ? r.map.nodes[last] : undefined;
  return {
    won: r.result === 'victory',
    shift: r.vaultShiftId,
    depth: lastNode?.row ?? 0,
    diedAt: r.result === 'victory' ? '-' : (lastNode?.type ?? '?'),
    turns: r.stats.turns,
    fights: r.stats.fightsWon + (r.result === 'victory' ? 0 : 1),
    corruption: r.stats.peakCorruption,
    deck: r.deck,
    floor: r.floor,
  };
}

const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(0)}%` : '-');

function report(classId: string, kitId: string, outcomes: Outcome[], omenId?: string): string {
  const n = outcomes.length;
  const wins = outcomes.filter((o) => o.won).length;
  const reachedBoss = outcomes.filter((o) => o.won || o.diedAt === 'boss').length;
  const lines = [
    `\n=== ${CONTENT.classes[classId].name} (${CONTENT.classes[classId].kits.find((k) => k.id === kitId)?.name})${omenId ? ` · Omen: ${CONTENT.omens?.[omenId]?.name}` : ''}: ${n} loops, Awakening stage ${STAGE} ===`,
    `Won ${pct(wins, n)} | reached the boss ${pct(reachedBoss, n)} | beat it when reached ${pct(wins, reachedBoss)}`,
    ...(DESCEND
      ? [`Floor 2: reached ${pct(outcomes.filter((o) => o.floor > 1).length, n)} | escaped it ${pct(outcomes.filter((o) => o.floor > 1 && o.won).length, outcomes.filter((o) => o.floor > 1).length)} of those`]
      : []),
    `Turns per fight ${(outcomes.reduce((s, o) => s + o.turns, 0) / Math.max(1, outcomes.reduce((s, o) => s + o.fights, 0))).toFixed(1)} | avg peak Corruption ${(outcomes.reduce((s, o) => s + o.corruption, 0) / n).toFixed(1)} | final deck ${(outcomes.reduce((s, o) => s + o.deck.length, 0) / n).toFixed(1)} cards`,
  ];
  const deaths: Record<string, number> = {};
  for (const o of outcomes) if (!o.won) deaths[o.diedAt] = (deaths[o.diedAt] ?? 0) + 1;
  lines.push('Deaths by node: ' + Object.entries(deaths).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v, n)}`).join(', '));
  const byRow: number[] = [];
  for (const o of outcomes) if (!o.won) byRow[o.depth] = (byRow[o.depth] ?? 0) + 1;
  lines.push('Deaths by row:  ' + [...byRow.keys()].map((i) => `${i}:${byRow[i] ?? 0}`).join(' '));
  const shifts: Record<string, Outcome[]> = {};
  for (const o of outcomes) (shifts[o.shift] ??= []).push(o);
  lines.push('By Vault Shift: ' + Object.entries(shifts).map(([s, os]) => `${CONTENT.vaultShifts[s].name} ${pct(os.filter((o) => o.won).length, os.length)} (${os.length})`).join(', '));
  // Cards most and least linked to winning (non-starter cards in the final deck, 40+ loops).
  const cardStats: Record<string, { n: number; w: number }> = {};
  for (const o of outcomes) {
    for (const id of new Set(o.deck)) {
      const def = CONTENT.cards[id];
      if (def.rarity === 'starter' || def.type === 'curse') continue;
      const c = (cardStats[id] ??= { n: 0, w: 0 });
      c.n++;
      if (o.won) c.w++;
    }
  }
  const ranked = Object.entries(cardStats)
    .filter(([, c]) => c.n >= 40)
    .sort((a, b) => b[1].w / b[1].n - a[1].w / a[1].n);
  const fmt = ([id, c]: [string, { n: number; w: number }]) => `${CONTENT.cards[id].name} ${pct(c.w, c.n)}`;
  lines.push('Win rate with card, top:    ' + ranked.slice(0, 5).map(fmt).join(', '));
  lines.push('Win rate with card, bottom: ' + ranked.slice(-5).map(fmt).join(', '));
  return lines.join('\n');
}

it('balance report', () => {
  const out: string[] = [];
  if (ALL_OMENS) {
    for (const omenId of Object.keys(CONTENT.omens ?? {})) {
      for (const [classId, cls] of Object.entries(CONTENT.classes).filter(([id]) => !env.SIM_CLASS || id === env.SIM_CLASS)) {
        const outcomes = Array.from({ length: RUNS }, (_, i) => playLoop(classId, cls.kits[0].id, `sim-${classId}-${i}`, omenId));
        out.push(report(classId, cls.kits[0].id, outcomes, omenId));
      }
    }
    console.log(out.join('\n'));
    return;
  }
  for (const [classId, cls] of Object.entries(CONTENT.classes).filter(([id]) => !env.SIM_CLASS || id === env.SIM_CLASS)) {
    for (const kit of ALL_KITS ? cls.kits : cls.kits.slice(0, 1)) {
      // Same seeds for every kit of a class, so kits are compared on the same maps.
      const outcomes = Array.from({ length: RUNS }, (_, i) => playLoop(classId, kit.id, `sim-${classId}-${i}`));
      out.push(report(classId, kit.id, outcomes));
    }
  }
  console.log(out.join('\n'));
}, 600_000);
