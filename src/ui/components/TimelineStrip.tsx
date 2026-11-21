/**
 * Delayed effects waiting to land: a thin row of hourglass chips with
 * countdowns, shown above the hand only while something is waiting.
 * Enemy entries (the Sleeper's dreams) are red and count the enemy's turns:
 * "1" means it lands when that enemy next acts, so Ward up before you end.
 */
import { CONTENT } from '../../data';
import { describeEffects, type TimelineEntry } from '../../engine';

export function TimelineStrip({ entries, onInspect }: { entries: TimelineEntry[]; onInspect: (t: string) => void }) {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => a.turnsLeft - b.turnsLeft);
  return (
    <div className="timeline" aria-label="Delayed effects">
      {sorted.map((e) => {
        const enemy = !!e.sourceId;
        const name = enemy ? (e.label ?? 'A dream') : (CONTENT.cards[e.sourceCardId]?.name ?? CONTENT.relics[e.sourceCardId]?.name ?? 'Delayed effect');
        const when = enemy
          ? e.turnsLeft === 1
            ? 'when it next acts. Ward blocks it'
            : `in ${e.turnsLeft} of its turns`
          : e.turnsLeft === 1
            ? 'next turn'
            : `in ${e.turnsLeft} turns`;
        const text = enemy ? `${name} lands on you ${when}. ${describeEffects(e.effects)}` : `${name}: lands ${when}. ${describeEffects(e.effects)}`;
        return (
          <button key={e.id} className={`timeline-chip ${enemy ? 'foe' : ''} ${e.turnsLeft === 1 ? 'soon' : ''}`} onClick={() => onInspect(text)}>
            <span className="timeline-glyph">⧗</span>
            <span className="timeline-turns">{e.turnsLeft}</span>
            <span className="timeline-name">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
