/**
 * Enemy intents: choosing the next move and previewing it for the player.
 */
import { rngWeighted, type RngState } from '../rng';
import type { CombatState, Content, Effect, EnemyState, IntentPattern } from '../types';
import { attackDamage } from './damage';
import { resolveAmount } from './effects';
import { moveOf } from './phases';

export function chooseIntent(rng: RngState, p: IntentPattern, history: string[]): string {
  if (history.length === 0 && p.opening) return p.opening;
  const used = history.length - (p.opening ? 1 : 0);

  if (p.kind === 'cycle') return p.order[used % p.order.length];

  const last = history[history.length - 1];
  const weights = { ...p.weights };
  if (p.noRepeat && last && Object.keys(weights).length > 1) delete weights[last];
  return rngWeighted(rng, weights);
}

export type IntentKind = 'attack' | 'defend' | 'debuff' | 'buff' | 'strange';

export interface IntentPreview {
  kinds: IntentKind[];
  /** Final per-hit damage against the player, after all modifiers. */
  damage?: number;
  hits?: number;
  name: string;
}

/** What the enemy will do, with live numbers (Weakened, Exposed, etc. applied). */
export function previewIntent(s: CombatState, enemy: EnemyState, content: Content): IntentPreview {
  const move = moveOf(enemy, content);
  const kinds = new Set<IntentKind>();
  let damage: number | undefined;
  let hits: number | undefined;

  const walk = (effects: Effect[]) => {
    for (const e of effects) {
      if (e.kind === 'damage') {
        kinds.add('attack');
        damage = attackDamage(s, enemy, s.player, resolveAmount(e.amount, enemy, s.player));
        hits = e.hits ?? 1;
      } else if (e.kind === 'ward') kinds.add('defend');
      else if (e.kind === 'delay') kinds.add('strange'); // lands later: shown on the timeline
      else if (e.kind === 'applyStatus') kinds.add(e.target === 'self' ? 'buff' : 'debuff');
      else if (e.kind === 'if') {
        walk(e.then);
        walk(e.else ?? []);
      } else kinds.add('strange');
    }
  };
  walk(move.effects);

  return { kinds: [...kinds], damage, hits, name: move.name };
}
