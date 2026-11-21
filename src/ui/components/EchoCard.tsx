import { useState } from 'react';
import { CONTENT } from '../../data';
import { hoursLeft, traitOf, type Echo, type EchoTaskKind } from '../../engine';
import { formatHours } from '../format';

const TASKS: { kind: EchoTaskKind | null; label: string }[] = [
  { kind: null, label: 'Rest' },
  { kind: 'dig', label: 'Dig' },
  { kind: 'research', label: 'Research' },
  { kind: 'scout', label: 'Scout' },
];

interface Props {
  echo: Echo;
  researchDone: boolean;
  onAssign: (task: EchoTaskKind | null) => void;
  onRelease: () => void;
  onInspect: (text: string) => void;
  /** Shown when a pending Echo could take this slot. */
  onReplace?: () => void;
}

export function EchoCard({ echo, researchDone, onAssign, onRelease, onInspect, onReplace }: Props) {
  const [confirmRelease, setConfirmRelease] = useState(false);
  const trait = traitOf(echo, CONTENT);
  const shift = CONTENT.vaultShifts[echo.origin.vaultShiftId]?.name ?? 'an unknown vault';
  const pct = Math.max(0, (echo.stability / echo.maxStability) * 100);
  const left = echo.task ? `${formatHours(hoursLeft(echo, echo.task.kind, CONTENT))} of work left` : 'Resting. Not fading.';

  return (
    <article className={`echo-card ${echo.task ? `task-${echo.task.kind}` : ''}`}>
      <header className="echo-head">
        <div>
          <h3>{echo.name}</h3>
          <p className="echo-origin">
            Loop {echo.origin.loop} · {echo.origin.result === 'victory' ? 'escaped' : `fell at depth ${echo.origin.depth}`} · {shift}
          </p>
        </div>
        <button className="trait-chip" onClick={() => onInspect(`${trait.name}: ${trait.description}`)}>
          {trait.name}
        </button>
      </header>

      <div className="stability">
        <div className="stability-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <span className="stability-text">{left}</span>
      </div>

      <div className="task-picker" role="radiogroup" aria-label="Task">
        {TASKS.map((t) => {
          const active = (echo.task?.kind ?? null) === t.kind;
          const disabled = t.kind === 'research' && researchDone;
          return (
            <button
              key={t.label}
              role="radio"
              aria-checked={active}
              className={active ? 'active' : ''}
              disabled={disabled}
              onClick={() => !active && onAssign(t.kind)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <footer className="echo-foot">
        {onReplace ? (
          <button className="ghost-btn danger" onClick={onReplace}>
            Release for the new Echo
          </button>
        ) : confirmRelease ? (
          <button className="ghost-btn danger" onClick={onRelease}>
            Tap again: let {echo.name.split(' ')[0]} rest forever
          </button>
        ) : (
          <button className="text-btn" onClick={() => setConfirmRelease(true)}>
            Release
          </button>
        )}
      </footer>
    </article>
  );
}
