/**
 * Deeds: things done in the vault that reveal a Warden's Work
 * (docs/design/deed-unlocks.md). Add a deed with its Warden; the tally that
 * checks it is already kept for every planned deed.
 */
import type { DeedDef } from '../engine/types';

export const DEEDS: DeedDef[] = [
  {
    id: 'you-hear-it-dreaming',
    title: 'You hear it dreaming',
    flavor: 'Through the floor of the vault, something hums in its sleep. You find yourself humming back.',
    hint: 'Reach the Awakening’s third stage (Restless).',
    warden: 'somnant',
    goal: { kind: 'peakAwakening', n: 3 },
  },
];
