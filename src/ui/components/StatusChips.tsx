import type { StatusId, Statuses } from '../../engine';
import { STATUS_INFO } from '../../data/statuses';

interface Props {
  statuses: Statuses;
  onInspect: (text: string) => void;
}

/** Tappable status chips. Tapping shows the rule in the info line (no hover needed). */
export function StatusChips({ statuses, onInspect }: Props) {
  const entries = (Object.entries(statuses) as [StatusId, number][]).filter(([, n]) => n > 0);
  if (entries.length === 0) return null;
  return (
    <div className="chips">
      {entries.map(([id, n]) => {
        const info = STATUS_INFO[id];
        return (
          <button
            key={id}
            className="chip"
            style={{ ['--hue' as string]: info.hue }}
            onClick={(e) => {
              e.stopPropagation();
              onInspect(`${info.name} ${n}: ${info.description}`);
            }}
          >
            <span className="chip-glyph">{info.glyph}</span>
            {n}
          </button>
        );
      })}
    </div>
  );
}
