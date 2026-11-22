import type { StatusId, Statuses } from '../../engine';
import { STATUS_INFO } from '../../data/statuses';

interface Props {
  statuses: Statuses;
  onInspect: (text: string) => void;
  /** Shown as progress, e.g. Drowse 4/6 (a foe's sleep threshold). */
  thresholds?: Partial<Record<StatusId, number>>;
}

/** Tappable status chips. Tapping shows the rule in the info line (no hover needed). */
export function StatusChips({ statuses, onInspect, thresholds = {} }: Props) {
  const entries = (Object.entries(statuses) as [StatusId, number][]).filter(([, n]) => n > 0);
  if (entries.length === 0) return null;
  return (
    <div className="chips">
      {entries.map(([id, n]) => {
        const info = STATUS_INFO[id];
        const of = thresholds[id];
        const value = of ? `${n}/${of}` : n;
        return (
          <button
            key={id}
            className="chip"
            style={{ ['--hue' as string]: info.hue }}
            onClick={(e) => {
              e.stopPropagation();
              onInspect(`${info.name} ${value}: ${info.description}`);
            }}
          >
            <span className="chip-glyph">{info.glyph}</span>
            {value}
          </button>
        );
      })}
    </div>
  );
}
