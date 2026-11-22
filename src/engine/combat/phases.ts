/**
 * Boss phases and remembered moves.
 *
 * - A phase begins when an enemy's HP falls to its threshold. It adds moves,
 *   switches pattern, may resolve an entry effect, and changes the intent at
 *   once, so the player always sees what's coming next.
 * - Phases can require an Awakening stage (the Lock only weeps open at 4+).
 * - An enemy with `memories` (the Sleeper) opens by replaying the strongest
 *   move of each enemy fought earlier in the loop.
 */
import type { Content, Effect, EnemyDef, EnemyMove, EnemyPhase, EnemyState, IntentPattern } from '../types';
import type { Ctx } from './context';
import { resolveEffects } from './effects';
import { chooseIntent } from './intents';

/** Phases this enemy can enter at the fight's Awakening stage, with their indices. */
function phasesFor(def: EnemyDef, awakeningStage: number): { phase: EnemyPhase; index: number }[] {
  return (def.phases ?? []).map((phase, index) => ({ phase, index })).filter(({ phase }) => (phase.minAwakening ?? 0) <= awakeningStage);
}

/** Every move the enemy can currently use: base, remembered, and phases entered so far. */
export function movesOf(enemy: EnemyState, content: Content): Record<string, EnemyMove> {
  const def = content.enemies[enemy.defId];
  const moves = { ...def.moves, ...enemy.memoryMoves };
  if (enemy.phase !== undefined) {
    for (let i = 0; i <= enemy.phase; i++) Object.assign(moves, def.phases?.[i]?.moves);
  }
  return moves;
}

export function moveOf(enemy: EnemyState, content: Content): EnemyMove {
  return movesOf(enemy, content)[enemy.intent];
}

/** The pattern the enemy follows right now. */
export function patternOf(enemy: EnemyState, content: Content): IntentPattern {
  const def = content.enemies[enemy.defId];
  if (enemy.phase !== undefined) return def.phases![enemy.phase].pattern;
  if (enemy.memoryMoves && Object.keys(enemy.memoryMoves).length) {
    return { kind: 'weighted', weights: Object.fromEntries(Object.keys(enemy.memoryMoves).map((k) => [k, 1])), noRepeat: true };
  }
  return def.pattern;
}

/** Called whenever an enemy loses HP: enter the deepest phase its HP has reached. */
export function checkPhase(ctx: Ctx, enemy: EnemyState): void {
  if (enemy.hp <= 0) return;
  const def = ctx.content.enemies[enemy.defId];
  if (!def.phases) return;
  const ratio = enemy.hp / enemy.maxHp;
  const reached = phasesFor(def, ctx.s.modifiers.awakeningStage ?? 0).filter(
    ({ phase, index }) => ratio <= phase.atHpRatio && index > (enemy.phase ?? -1),
  );
  const next = reached.at(-1);
  if (!next) return;

  enemy.phase = next.index;
  enemy.history = [];
  // A boss's new phase wakes it (no sleeping through its big moments).
  if (enemy.asleep) {
    enemy.asleep = false;
    enemy.waking = false;
    ctx.events.push({ type: 'woke', enemyId: enemy.id });
  }
  ctx.events.push({ type: 'phaseChange', enemyId: enemy.id, name: next.phase.name ?? def.name });
  if (next.phase.onEnter) resolveEffects(ctx, next.phase.onEnter, enemy.id, undefined);
  // Show the new phase's first move straight away.
  enemy.intent = chooseIntent(ctx.s.rng, next.phase.pattern, []);
}

/** The display name: a phase can rename the enemy ("The Lock, Weeping Open"). */
export function enemyName(enemy: EnemyState, content: Content): string {
  const def = content.enemies[enemy.defId];
  return (enemy.phase !== undefined && def.phases?.[enemy.phase]?.name) || def.name;
}

/** How hard a move hits, roughly, to pick each memory's "signature" move. */
function moveDamage(move: EnemyMove): number {
  return move.effects.reduce((sum, e) => sum + (e.kind === 'damage' && typeof e.amount === 'number' ? e.amount * (e.hits ?? 1) : 0), 0);
}

/** Remembered moves hit this much harder (1 = exactly as remembered; tuned with the sim). */
const MEMORY_DAMAGE_MULT = 1;
const MAX_MEMORIES = 4;

function exaggerate(effects: Effect[]): Effect[] {
  return effects.map((e) => (e.kind === 'damage' && typeof e.amount === 'number' ? { ...e, amount: Math.round(e.amount * MEMORY_DAMAGE_MULT) } : e));
}

/**
 * The Sleeper's opening moves: the hardest-hitting move of each enemy fought
 * this loop (most recent first, up to 4), scaled by MEMORY_DAMAGE_MULT.
 */
export function buildMemories(memories: string[], content: Content): Record<string, EnemyMove> {
  const out: Record<string, EnemyMove> = {};
  const unique = [...new Set([...memories].reverse())].slice(0, MAX_MEMORIES);
  for (const defId of unique) {
    const def = content.enemies[defId];
    if (!def) continue;
    const best = Object.values(def.moves).reduce<EnemyMove | undefined>((a, m) => (!a || moveDamage(m) > moveDamage(a) ? m : a), undefined);
    if (!best || moveDamage(best) === 0) continue;
    out[`memory:${defId}`] = { name: `Remembered ${best.name}`, effects: exaggerate(best.effects) };
  }
  return out;
}
