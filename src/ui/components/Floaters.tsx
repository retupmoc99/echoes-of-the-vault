import type { Floater } from '../fx/useHitFx';

export function Floaters({ items }: { items: Floater[] }) {
  return (
    <div className="floaters" aria-hidden>
      {items.map((f, i) => (
        <span key={f.id} className={`floater floater-${f.kind}`} style={{ left: `${45 + ((i * 17) % 20) - 10}%` }}>
          {f.text}
        </span>
      ))}
    </div>
  );
}
