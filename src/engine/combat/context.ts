/**
 * The working context passed through one engine step.
 *
 * `s` is a private clone of the combat state that the step may mutate freely;
 * `events` collects what happened so the UI can animate it afterwards.
 */
import type { CombatEvent, CombatState, Combatant, Content, EnemyState } from '../types';

export interface Ctx {
  s: CombatState;
  content: Content;
  events: CombatEvent[];
  /** Current trigger nesting depth (guards against infinite loops). */
  depth: number;
}

export const PLAYER_ID = 'player';

export function getCombatant(s: CombatState, id: string): Combatant | undefined {
  if (id === PLAYER_ID) return s.player;
  return s.enemies.find((e) => e.id === id);
}

export function isAlive(c: Combatant | undefined): c is Combatant {
  return !!c && c.hp > 0;
}

export function livingEnemies(s: CombatState): EnemyState[] {
  return s.enemies.filter((e) => e.hp > 0);
}

export function isOver(s: CombatState): boolean {
  return s.phase === 'won' || s.phase === 'lost';
}

/** Living opponents of whoever `sourceId` is. */
export function foesOf(s: CombatState, sourceId: string): Combatant[] {
  if (sourceId === PLAYER_ID) return livingEnemies(s);
  return s.player.hp > 0 ? [s.player] : [];
}
