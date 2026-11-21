/**
 * A tiny pub/sub that replays engine events to whichever component cares
 * (enemy flashes, screen shake, floating numbers, haptics).
 *
 * The engine resolves a whole enemy turn instantly; here we stagger each
 * enemy's events so they read as separate blows.
 */
import type { CombatEvent } from '../../engine';

type Listener = (event: CombatEvent) => void;

const listeners = new Set<Listener>();
const ENEMY_MOVE_GAP_MS = 380;

export function onFx(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitFx(events: CombatEvent[]): void {
  let delay = 0;
  for (const event of events) {
    if (event.type === 'enemyMove') delay += ENEMY_MOVE_GAP_MS;
    const fire = () => listeners.forEach((l) => l(event));
    if (delay === 0) fire();
    else setTimeout(fire, delay);
  }
}
