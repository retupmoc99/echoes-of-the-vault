import type { StatusId } from '../engine/types';
import { BALANCE } from './balance';

const st = BALANCE.status;
const pct = (n: number) => `${Math.round(n * 100)}%`;

export interface StatusInfo {
  name: string;
  /** Single glyph shown on the status chip. */
  glyph: string;
  /** Accent hue for the chip. */
  hue: number;
  description: string;
}

/** Display info for statuses. The mechanics themselves live in engine/combat/statuses.ts. */
export const STATUS_INFO: Record<StatusId, StatusInfo> = {
  fracture: {
    name: 'Fracture',
    glyph: '✶',
    hue: 330,
    description: `Attacks deal +${st.fracture.damagePerStack} per stack. End of turn: lose HP equal to half your Fracture. It does not fade.`,
  },
  bleed: {
    name: 'Bleed',
    glyph: '♦',
    hue: 0,
    description: `Start of turn: lose HP equal to Bleed, then Bleed drops by ${st.bleed.decayPerTurn}. Ignores Ward.`,
  },
  weakened: {
    name: 'Weakened',
    glyph: '▽',
    hue: 45,
    description: `Attacks deal ${pct(st.weakened.damageReduction)} less damage. Fades by 1 each turn.`,
  },
  paradox: {
    name: 'Paradox',
    glyph: '⧗',
    hue: 165,
    description: `Built by bending time. End of turn at ${st.paradox.snapThreshold}+: the timeline snaps back, dealing ${st.paradox.snapDamagePerStack} damage per stack to you, then Paradox resets.`,
  },
  drowse: {
    name: 'Drowse',
    glyph: '◐',
    hue: 255,
    description: 'At its sleep threshold the foe falls Asleep and skips its next turn. Each sleep raises the threshold. Drowse on a sleeping foe is lost.',
  },
  exposed: {
    name: 'Exposed',
    glyph: '◎',
    hue: 190,
    description: `Takes ${pct(st.exposed.damageIncrease)} more attack damage. Fades by 1 each turn.`,
  },
};
