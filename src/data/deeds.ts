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
  {
    id: 'fed-on-sin',
    title: 'Fed on sin',
    flavor: 'You carried the vault’s curses out with you, and found you were hungry for more.',
    hint: 'Close a loop carrying 3 or more curses.',
    warden: 'sin-eater',
    goal: { kind: 'cursesCarried', n: 3 },
  },
  {
    id: 'seen-in-every-glass',
    title: 'Seen in every glass',
    flavor: 'Every elite in the vault has looked at you. Somewhere, a mirror remembers them all.',
    hint: 'Beat every elite at least once, floor 1’s and floor 2’s.',
    warden: 'mirrorborn',
    goal: { kind: 'allElites' },
  },
  {
    id: 'weathered',
    title: 'Weathered',
    flavor: 'Drowned, broken, sung to: you have escaped the vault in more than one weather.',
    hint: 'Escape under 3 different Vault Shifts.',
    warden: 'shiftwright',
    goal: { kind: 'shiftsEscaped', n: 3 },
  },
  {
    id: 'back-from-the-well',
    title: 'Back from the Well',
    flavor: 'You walked down past the Lock and climbed back out. Your feet remember every stair.',
    hint: 'Escape floor 2.',
    warden: 'pilgrim',
    goal: { kind: 'deepEscapes', n: 1 },
  },
];
