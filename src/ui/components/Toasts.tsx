import { useEffect } from 'react';

const TOAST_MS = 4200;

type Item = { id: number; text: string };

/** Brief messages from the engine (curses, thresholds, new cards). Tap to dismiss. */
export function Toasts({ items, onDismiss }: { items: Item[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <Toast key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ item, onDismiss }: { item: Item; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), TOAST_MS);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);
  return (
    <button className="toast" onClick={() => onDismiss(item.id)}>
      {item.text}
    </button>
  );
}
