/**
 * Hint plumbing. Screens list the hints that apply right now, in priority
 * order; <HintSlot> shows the first one not yet dismissed. One at a time,
 * so the next appears only after the player taps "Got it".
 */
import { createContext, useContext, type ReactNode } from 'react';
import { HINTS, type HintId } from '../data/hints';

interface HintsApi {
  enabled: boolean;
  seen: readonly string[];
  dismiss: (id: HintId) => void;
}

const HintsContext = createContext<HintsApi>({ enabled: false, seen: [], dismiss: () => undefined });

export function HintsProvider({ value, children }: { value: HintsApi; children: ReactNode }) {
  return <HintsContext.Provider value={value}>{children}</HintsContext.Provider>;
}

/** [hint id, does it apply right now?] in priority order. */
export type HintCandidate = [HintId, boolean];

export function HintSlot({ candidates }: { candidates: HintCandidate[] }) {
  const { enabled, seen, dismiss } = useContext(HintsContext);
  if (!enabled) return null;
  const id = candidates.find(([hint, applies]) => applies && !seen.includes(hint))?.[0];
  if (!id) return null;
  const hint = HINTS[id];
  return (
    <aside className="hint" role="note" key={id}>
      <strong>{hint.title}</strong>
      <p>{hint.text}</p>
      <button className="ghost-btn" onClick={() => dismiss(id)}>
        Got it
      </button>
    </aside>
  );
}
