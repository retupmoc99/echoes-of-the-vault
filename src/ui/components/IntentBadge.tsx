import type { IntentKind, IntentPreview } from '../../engine';

const KIND_HUE: Record<IntentKind, number> = { attack: 0, defend: 190, debuff: 285, buff: 45, strange: 120, asleep: 255 };

function Icon({ kind }: { kind: IntentKind }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'attack':
      return <path d="M4 3 L12 21 L20 3 L12 9 Z" {...common} />;
    case 'defend':
      return <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" {...common} />;
    case 'debuff':
      return <path d="M12 3 C7 10 6 13 6 15 a6 6 0 0 0 12 0 C18 13 17 10 12 3 Z" {...common} />;
    case 'buff':
      return <path d="M4 15 L12 6 L20 15 M4 21 L12 12 L20 21" {...common} />;
    case 'strange':
      return <circle cx="12" cy="12" r="8" {...common} strokeDasharray="3 3" />;
    case 'asleep':
      // A closed eye.
      return <path d="M3 11 C7 16 17 16 21 11 M7 14 L5.5 17 M12 15.5 L12 19 M17 14 L18.5 17" {...common} />;
  }
}

export function IntentBadge({ intent, onInspect }: { intent: IntentPreview; onInspect: (t: string) => void }) {
  const primary = intent.kinds[0] ?? 'strange';
  const dmg = intent.damage !== undefined ? `${intent.damage}${intent.hits && intent.hits > 1 ? `×${intent.hits}` : ''}` : '';
  return (
    <button
      className="intent"
      style={{ ['--hue' as string]: KIND_HUE[primary] }}
      onClick={(e) => {
        e.stopPropagation();
        onInspect(primary === 'asleep' ? `${intent.name}: it skips its next turn.` : `Intent: ${intent.name}${dmg ? `, ${dmg} damage` : ''}.`);
      }}
    >
      {intent.kinds.map((k) => (
        <svg key={k} viewBox="0 0 24 24" width={18} height={18} style={{ color: `hsl(${KIND_HUE[k]} 90% 65%)` }}>
          <Icon kind={k} />
        </svg>
      ))}
      {dmg && <span className="intent-dmg">{dmg}</span>}
    </button>
  );
}
