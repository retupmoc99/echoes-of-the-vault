/**
 * Vibration where supported. iOS Safari has no vibration API, so iPhones
 * get the visual feedback only.
 */
let enabled = true;

/** Mirrors the player's setting (kept in the save). */
export function setHapticsEnabled(on: boolean): void {
  enabled = on;
}

export function hapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

export function buzz(pattern: number | readonly number[]): void {
  if (enabled && hapticsSupported()) {
    try {
      navigator.vibrate(typeof pattern === 'number' ? pattern : [...pattern]);
    } catch {
      /* some browsers throw when called without a user gesture */
    }
  }
}

export const HAPTIC = {
  cardPlay: 8,
  playerHit: [25, 30, 25],
  enemyKill: 40,
  error: [10, 40, 10],
} as const;
