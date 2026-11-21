/** Code-drawn glyphs for map node types (24×24 viewBox). */
import { NODE_INFO } from '../../data/nodeTypes';
import type { NodeType } from '../../engine';
import { ArtImg, artUrl } from '../art';

const PATHS: Record<NodeType, string> = {
  fight: 'M5 19 L19 5 M15 5 h4 v4 M19 19 L5 5 M5 9 V5 h4 M7 15 l2 2 M17 15 l-2 2',
  elite: 'M4 4 L8 10 L12 6 L16 10 L20 4 L18 16 H6 Z M9 20 h6',
  event: 'M2 12 C6 5 18 5 22 12 C18 19 6 19 2 12 Z M12 9 a3 3 0 1 0 0.01 0',
  cache: 'M12 2 L21 7 V17 L12 22 L3 17 V7 Z M3 7 L12 12 L21 7 M12 12 V22',
  shrine: 'M5 21 V10 a7 7 0 0 1 14 0 V21 M3 21 H21 M12 9 c-2 3 -2 5 0 6 c2 -1 2 -3 0 -6',
  boss: 'M12 2 L22 12 L12 22 L2 12 Z M12 7 L17 12 L12 17 L7 12 Z M12 11 v2',
};

/** Node icon: optional art at public/assets/ui/node-<type>.webp, else the drawn glyph. */
export function NodeIcon({ type, size = 24 }: { type: NodeType; size?: number }) {
  const drawn = (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path d={PATHS[type]} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return <ArtImg src={artUrl('ui', `node-${type}`, NODE_INFO[type].image)} className="node-art" size={size * 1.6} fallback={drawn} />;
}
