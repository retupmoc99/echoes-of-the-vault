/**
 * Sound effects for engine events, built from the primitives in core.ts.
 * Each sound is a few lines: an oscillator note and/or a noise burst.
 */
import { CONTENT } from '../../data';
import { PLAYER_ID, type CardType, type CombatEvent } from '../../engine';
import { noise, tone } from './core';

/** Card-play pitch by type: each type has its own voice. */
const CARD_VOICE: Record<CardType, { freq: number; type: OscillatorType; to?: number }> = {
  strike: { freq: 330, type: 'triangle', to: 220 },
  ward: { freq: 660, type: 'sine' },
  overload: { freq: 165, type: 'sawtooth', to: 330 },
  rite: { freq: 440, type: 'sine', to: 392 },
  temporal: { freq: 523, type: 'sine', to: 784 },
  curse: { freq: 140, type: 'square', to: 110 },
};

export function playSfx(e: CombatEvent): void {
  switch (e.type) {
    case 'cardPlayed': {
      const def = CONTENT.cards[e.cardId];
      const v = CARD_VOICE[def?.type ?? 'strike'];
      noise({ filter: 'bandpass', freq: 2600, to: 700, q: 0.8, gain: 0.12, decay: 0.12 });
      tone({ freq: v.freq, to: v.to, type: v.type, gain: 0.07, decay: 0.16, lowpass: 2200 });
      break;
    }
    case 'attack': {
      const fullyBlocked = e.blocked > 0 && e.amount <= e.blocked;
      if (fullyBlocked) {
        // Glancing off Ward: a bright metallic ping.
        tone({ freq: 1250, type: 'sine', gain: 0.08, decay: 0.25 });
        tone({ freq: 1870, type: 'sine', gain: 0.04, decay: 0.18 });
      } else if (e.targetId === PLAYER_ID) {
        noise({ freq: 700, gain: 0.45, decay: 0.28 });
        tone({ freq: 95, to: 45, type: 'sine', gain: 0.35, decay: 0.3 });
      } else {
        noise({ filter: 'bandpass', freq: 1300, q: 0.9, gain: 0.3, decay: 0.12 });
        tone({ freq: 190, to: 90, type: 'triangle', gain: 0.18, decay: 0.15 });
      }
      break;
    }
    case 'hpLoss':
      // Bleed, Fracture, Paradox: a dull internal tick.
      tone({ freq: e.cause === 'paradox' ? 220 : 130, to: 80, type: 'triangle', gain: 0.1, decay: 0.12 });
      break;
    case 'ward':
      tone({ freq: 880, type: 'sine', gain: 0.06, attack: 0.01, decay: 0.4 });
      tone({ freq: 1320, type: 'sine', gain: 0.04, attack: 0.02, decay: 0.35, at: 0.03 });
      break;
    case 'status':
      if (e.delta > 0) tone({ freq: 300, to: 260, type: 'sine', gain: 0.04, decay: 0.12 });
      break;
    case 'shuffle':
      noise({ filter: 'highpass', freq: 3000, to: 1200, gain: 0.06, decay: 0.2 });
      break;
    case 'death':
      if (e.targetId === PLAYER_ID) break; // the defeat sting covers it
      noise({ freq: 420, to: 120, gain: 0.4, decay: 0.6 });
      tone({ freq: 120, to: 30, type: 'sine', gain: 0.35, decay: 0.7 });
      break;
    case 'relicOverload':
      tone({ freq: 110, to: 440, type: 'sawtooth', gain: 0.1, attack: 0.02, decay: 0.28, lowpass: 1800 });
      noise({ filter: 'bandpass', freq: 600, to: 2400, q: 2, gain: 0.08, decay: 0.28 });
      break;
    case 'relicCracked':
      noise({ filter: 'highpass', freq: 3200, gain: 0.3, decay: 0.08 });
      tone({ freq: 2400, to: 1800, type: 'square', gain: 0.05, decay: 0.12, lowpass: 5000 });
      tone({ freq: 80, to: 50, type: 'sine', gain: 0.3, decay: 0.25 });
      break;
    case 'overloadFizzled':
      tone({ freq: 200, to: 110, type: 'square', gain: 0.04, decay: 0.15, lowpass: 900 });
      break;
    case 'delayQueued':
      // Tick-tock.
      tone({ freq: 1500, type: 'sine', gain: 0.05, decay: 0.03 });
      tone({ freq: 1100, type: 'sine', gain: 0.05, decay: 0.03, at: 0.09 });
      break;
    case 'delayFired':
      // A struck jade bell.
      tone({ freq: 784, type: 'sine', gain: 0.1, decay: 1.1 });
      tone({ freq: 1568, type: 'sine', gain: 0.04, decay: 0.7 });
      tone({ freq: 2352, type: 'sine', gain: 0.02, decay: 0.4 });
      break;
    case 'echoReturned':
      tone({ freq: 523, to: 1046, type: 'sine', gain: 0.06, attack: 0.08, decay: 0.3 });
      break;
    case 'rewound':
      tone({ freq: 1200, to: 300, type: 'triangle', gain: 0.07, attack: 0.02, decay: 0.35 });
      noise({ filter: 'bandpass', freq: 3000, to: 500, gain: 0.05, decay: 0.35 });
      break;
    case 'paradoxSnap':
      for (let i = 0; i < 4; i++) tone({ freq: 300 + ((i * 577) % 900), type: 'square', gain: 0.05, decay: 0.04, at: i * 0.045, lowpass: 3000 });
      noise({ filter: 'bandpass', freq: 1800, q: 3, gain: 0.25, decay: 0.2, at: 0.18 });
      break;
    case 'allyCalled':
      // A name answered: a rising, hollow chime.
      tone({ freq: 330, to: 660, type: 'sine', gain: 0.08, attack: 0.05, decay: 0.6 });
      tone({ freq: 495, to: 990, type: 'triangle', gain: 0.04, attack: 0.08, decay: 0.5, at: 0.06 });
      break;
    case 'allyActed': {
      // The ally's card, in its type's voice, softer and lower than yours.
      const v = CARD_VOICE[CONTENT.cards[e.cardId]?.type ?? 'strike'];
      tone({ freq: v.freq * 0.75, to: v.to ? v.to * 0.75 : undefined, type: v.type, gain: 0.045, decay: 0.18, lowpass: 1600 });
      break;
    }
    case 'allyFell':
      tone({ freq: 440, to: 110, type: 'sine', gain: 0.07, attack: 0.02, decay: 0.7 });
      noise({ filter: 'lowpass', freq: 900, to: 200, gain: 0.08, decay: 0.5 });
      break;
    case 'phaseChange':
      // A boss changes: a deep swell under a cracking chime.
      tone({ freq: 55, to: 110, type: 'sawtooth', gain: 0.14, attack: 0.15, decay: 1.2, lowpass: 600 });
      tone({ freq: 1400, to: 700, type: 'sine', gain: 0.05, attack: 0.02, decay: 0.8, at: 0.1 });
      noise({ filter: 'bandpass', freq: 400, to: 2400, q: 1.5, gain: 0.2, decay: 0.9 });
      break;
    case 'victory':
      [440, 523, 659, 880].forEach((f, i) => tone({ freq: f, type: 'triangle', gain: 0.08, attack: 0.01, decay: 0.9, at: i * 0.11 }));
      break;
    case 'defeat':
      tone({ freq: 220, to: 98, type: 'sawtooth', gain: 0.12, attack: 0.05, decay: 1.6, lowpass: 700 });
      tone({ freq: 147, to: 73, type: 'sine', gain: 0.15, attack: 0.05, decay: 1.8 });
      break;
    default:
      break;
  }
}
