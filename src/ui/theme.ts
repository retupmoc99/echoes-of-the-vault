import type { CardType } from '../engine';

/** One accent hue per card type. Used for card borders, glows and cost orbs. */
export const CARD_HUE: Record<CardType, number> = {
  strike: 14, // ember
  ward: 190, // cold cyan
  overload: 275, // violet arc
  rite: 42, // tarnished gold
  temporal: 165, // pale jade
  curse: 95, // sick green
};

export const CARD_TYPE_LABEL: Record<CardType, string> = {
  strike: 'Strike',
  ward: 'Ward',
  overload: 'Overload',
  rite: 'Rite',
  temporal: 'Temporal',
  curse: 'Curse',
};

export const glow = (hue: number, light = 62) => `hsl(${hue} 90% ${light}%)`;
