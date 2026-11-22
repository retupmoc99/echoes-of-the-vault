/** The Somnant's relics (docs/design/somnant.md), plus its relic from the Well. */
import type { RelicDef } from '../../engine/types';

export const SOMNANT_RELICS: RelicDef[] = [
  {
    id: 'sleepers-hum',
    name: "Sleeper's Hum",
    rarity: 'starter',
    // 2 Drowse at Dormant, 4 when the Sleeper is awake.
    passive: [{ on: 'combatStart', effects: [{ kind: 'applyStatus', status: 'drowse', amount: { per: 'halfAwakening', times: 2, plus: 2 }, target: 'allFoes' }] }],
    flavor: 'You did not learn the tune. It learned you.',
  },
  {
    id: 'moth-lantern',
    name: 'Moth Lantern',
    rarity: 'common',
    passive: [{ on: 'foeSlept', effects: [{ kind: 'draw', amount: 1 }] }],
    flavor: 'The moths go wherever something is about to dream.',
  },
  {
    id: 'pillow-stone',
    name: 'Pillow Stone',
    rarity: 'common',
    passive: [{ on: 'turnStart', effects: [{ kind: 'if', cond: { kind: 'anyFoeAsleep' }, then: [{ kind: 'ward', amount: 5 }] }] }],
    flavor: 'Hard as a grave, and somehow restful.',
  },
  {
    id: 'cracked-music-box',
    name: 'Cracked Music Box',
    rarity: 'uncommon',
    passive: [{ on: 'turnEnd', effects: [{ kind: 'applyStatus', status: 'drowse', amount: 1, target: 'allFoes' }] }],
    flavor: 'It plays three notes, then a fourth that should not exist.',
  },
  {
    id: 'dream-catcher',
    name: 'Dream Catcher',
    rarity: 'uncommon',
    passive: [{ on: 'foeSlept', effects: [{ kind: 'gainResonance', amount: 1 }] }],
    flavor: 'Woven from hair and wire. What it catches, you can use.',
  },
  {
    id: 'nightcap',
    name: 'Nightcap',
    rarity: 'uncommon',
    corruption: 1,
    passive: [{ on: 'combatStart', effects: [{ kind: 'thresholdMod', amount: 2 }] }],
    flavor: 'One sip for them, one for you. You will pay for yours.',
  },
  {
    id: 'lethe-vial',
    name: 'Lethe Vial',
    rarity: 'rare',
    passive: [{ on: 'foeWoke', effects: [{ kind: 'applyStatus', status: 'weakened', amount: 2, target: 'target' }] }],
    flavor: 'They wake not quite remembering how to fight.',
  },
  {
    id: 'the-last-lullaby',
    name: 'The Last Lullaby',
    rarity: 'rare',
    passive: [{ on: 'combatStart', effects: [{ kind: 'thresholdMod', amount: 4, bossesOnly: true, extraSleeps: 1 }] }],
    flavor: 'The verse they cut from the hymn. It works on the large ones.',
  },
  {
    id: 'drowned-hymnal',
    name: 'Drowned Hymnal',
    rarity: 'rare',
    deepFor: 'somnant',
    passive: [{ on: 'foeSlept', effects: [{ kind: 'ward', amount: 6 }] }],
    flavor: 'The pages are wet through. The songs still work.',
  },
];
