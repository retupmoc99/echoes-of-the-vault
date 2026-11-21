/**
 * Delayed effects waiting to land: a thin row of hourglass chips with
 * countdowns, shown above the hand only while something is waiting.
 */
import { CONTENT } from '../../data';
import { describeEffects, type TimelineEntry } from '../../engine';

export function TimelineStrip({ entries, onInspect }: { entries: TimelineEntry[]; onInspect: (t: string) => void }) {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => a.turnsLeft - b.turnsLeft);
  return (
    <div className="timeline" aria-label="Delayed effects">
      {sorted.map((e) => {
        const name = CONTENT.cards[e.sourceCardId]?.name ?? CONTENT.relics[e.sourceCardId]?.name ?? 'Delayed effect';
        const when = e.turnsLeft === 1 ? 'next turn' : `in ${e.turnsLeft} turns`;
        return (
          <button key={e.id} className={`timeline-chip ${e.turnsLeft === 1 ? 'soon' : ''}`} onClick={() => onInspect(`${name}: lands ${when}. ${describeEffects(e.effects)}`)}>
            <span className="timeline-glyph">⧗</span>
            <span className="timeline-turns">{e.turnsLeft}</span>
            <span className="timeline-name">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
