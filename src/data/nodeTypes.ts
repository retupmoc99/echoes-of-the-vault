import type { NodeType } from '../engine/types';

export interface NodeTypeInfo {
  name: string;
  description: string;
  hue: number;
  /** Optional art, relative to public/assets/. Code-drawn icon otherwise. */
  image?: string;
}

export const NODE_INFO: Record<NodeType, NodeTypeInfo> = {
  fight: { name: 'Fight', description: 'Something stirs in the dark.', hue: 0 },
  elite: { name: 'Elite', description: 'A greater horror. Greater spoils.', hue: 25 },
  event: { name: 'Event', description: 'An echo of what happened here.', hue: 200 },
  cache: { name: 'Relic Cache', description: 'A sealed vault-cache. Something waits inside.', hue: 42 },
  shrine: { name: 'Shrine', description: 'Rest, or cut away what weighs on you.', hue: 160 },
  boss: { name: 'The Lock', description: 'The way down. It is guarded.', hue: 280 },
};
