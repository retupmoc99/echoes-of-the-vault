/**
 * The Shiftwright's cards (docs/design/shiftwright.md). Three Aspects:
 * Drowned (Bleed stays), Fractured (+2 per hit, 1 HP a turn), Choir (+1 draw).
 */
import type { Aspect, CardDef, Effect } from '../../engine/types';

const attune = (aspect: Aspect | 'next'): Effect => ({ kind: 'attune', aspect });
const inAspect = (aspect: Aspect, then: Effect[], otherwise: Effect[] = []): Effect => ({ kind: 'if', cond: { kind: 'inAspect', aspect }, then, else: otherwise });
const bleed = (amount: number, target: 'target' | 'allFoes' = 'target'): Effect => ({ kind: 'applyStatus', status: 'bleed', amount, target });

export const SHIFTWRIGHT_CARDS: CardDef[] = [
  // ───────────── Starters ─────────────
  { id: 'tide-strike', name: 'Tide Strike', type: 'strike', cost: 1, rarity: 'starter', effects: [{ kind: 'damage', amount: 6 }], flavor: 'It comes in like the sea: all at once.' },
  { id: 'squall-ward', name: 'Squall Ward', type: 'ward', cost: 1, rarity: 'starter', effects: [{ kind: 'ward', amount: 5 }], flavor: 'A wall of driving rain.' },
  { id: 'turn-the-tide', name: 'Turn the Tide', type: 'rite', cost: 1, rarity: 'starter', archetype: 'tide', effects: [attune('drowned'), bleed(2)], flavor: 'The water rises when it is told.' },
  { id: 'break-the-sky', name: 'Break the Sky', type: 'strike', cost: 1, rarity: 'starter', archetype: 'storm', effects: [attune('fractured'), { kind: 'damage', amount: 7 }], flavor: 'A crack, and then the thunder.' },

  // ───────────── Commons ─────────────
  { id: 'undertow', name: 'Undertow', type: 'strike', cost: 1, rarity: 'common', archetype: 'tide', effects: [{ kind: 'damage', amount: 5 }, inAspect('drowned', [bleed(2)])], text: 'Deal 5. In Drowned: apply 2 Bleed.', flavor: 'It pulls you under by the ankles.' },
  { id: 'stormglass', name: 'Stormglass', type: 'ward', cost: 1, rarity: 'common', archetype: 'storm', effects: [inAspect('fractured', [{ kind: 'ward', amount: 9 }], [{ kind: 'ward', amount: 5 }])], text: 'Gain 5 Ward. In Fractured: gain 9 instead.', flavor: 'The crystals cloud before the storm.' },
  { id: 'hymn-of-the-choir', name: 'Hymn of the Choir', type: 'ward', cost: 1, rarity: 'common', archetype: 'choir', effects: [attune('choir'), { kind: 'ward', amount: 6 }], flavor: 'Sung in the key of the vault.' },
  { id: 'rising-water', name: 'Rising Water', type: 'rite', cost: 1, rarity: 'common', archetype: 'tide', effects: [attune('drowned'), bleed(1, 'allFoes')], flavor: 'Ankle. Knee. Waist.' },
  { id: 'thunderclap', name: 'Thunderclap', type: 'strike', cost: 1, rarity: 'common', archetype: 'storm', effects: [attune('fractured'), { kind: 'damage', amount: 4, target: 'allFoes' }], flavor: 'The vault shakes dust from its ceiling.' },
  { id: 'plainsong', name: 'Plainsong', type: 'rite', cost: 0, rarity: 'common', archetype: 'choir', effects: [attune('choir'), { kind: 'draw', amount: 1 }], flavor: 'One voice, then many.' },
  { id: 'squall-line', name: 'Squall Line', type: 'strike', cost: 1, rarity: 'common', archetype: 'storm', effects: [inAspect('fractured', [{ kind: 'damage', amount: 4, hits: 3 }], [{ kind: 'damage', amount: 4, hits: 2 }])], text: 'Deal 4 twice. In Fractured: three times.', flavor: 'Gust after gust after gust.' },
  { id: 'brine-ward', name: 'Brine Ward', type: 'ward', cost: 1, rarity: 'common', archetype: 'tide', effects: [{ kind: 'ward', amount: 6 }, inAspect('drowned', [bleed(1)])], text: 'Gain 6 Ward. In Drowned: apply 1 Bleed too.', flavor: 'Salt water stings whoever touches it.' },

  // ───────────── Uncommons ─────────────
  { id: 'riptide', name: 'Riptide', type: 'rite', cost: 1, rarity: 'uncommon', archetype: 'tide', effects: [bleed(1, 'allFoes'), inAspect('drowned', [bleed(1, 'allFoes')])], text: 'Apply 1 Bleed to all foes. In Drowned: twice.', flavor: 'Out past the breakers, nothing comes back.' },
  { id: 'skyfall', name: 'Skyfall', type: 'strike', cost: 2, rarity: 'uncommon', archetype: 'storm', effects: [inAspect('fractured', [{ kind: 'damage', amount: 4, target: 'allFoes', hits: 3 }], [{ kind: 'damage', amount: 4, target: 'allFoes', hits: 2 }])], text: 'Deal 4 to all foes, twice. In Fractured: three times.', flavor: 'The sky comes down in pieces.' },
  { id: 'chorus-of-storms', name: 'Chorus of Storms', type: 'rite', cost: 1, rarity: 'uncommon', archetype: 'choir', effects: [{ kind: 'draw', amount: 2 }, inAspect('choir', [{ kind: 'gainResonance', amount: 1 }])], text: 'Draw 2. In Choir: also gain 1 Resonance.', flavor: 'Thunder in harmony.' },
  { id: 'barometer', name: 'Barometer', type: 'ward', cost: 1, rarity: 'uncommon', archetype: 'choir', effects: [{ kind: 'ward', amount: 8 }, attune('next')], text: 'Gain 8 Ward. Attune to the next Aspect (Drowned → Fractured → Choir).', flavor: 'The needle swings. So do you.' },
  {
    id: 'deep-current',
    name: 'Deep Current',
    type: 'strike',
    cost: 1,
    rarity: 'uncommon',
    archetype: 'tide',
    effects: [inAspect('drowned', [{ kind: 'damage', amount: { per: 'targetStatus', status: 'bleed', times: 2, plus: 4 } }], [{ kind: 'damage', amount: { per: 'targetStatus', status: 'bleed', times: 1, plus: 4 } }])],
    text: 'Deal 4, plus 1 per Bleed on the target. In Drowned: plus 2 per Bleed.',
    flavor: 'The deeper the wound, the stronger the pull.',
  },
  { id: 'lightning-rod', name: 'Lightning Rod', type: 'ward', cost: 1, rarity: 'uncommon', archetype: 'storm', effects: [{ kind: 'ward', amount: 10 }, inAspect('fractured', [{ kind: 'damage', amount: 6 }])], text: 'Gain 10 Ward. In Fractured: deal 6.', flavor: 'Draw the strike. Send it on.' },
  { id: 'canticle', name: 'Canticle', type: 'rite', cost: 1, rarity: 'uncommon', archetype: 'choir', effects: [inAspect('choir', [{ kind: 'gainResonance', amount: 2 }], [attune('choir')])], text: 'In Choir: gain 2 Resonance. Otherwise, Attune Choir.', flavor: 'The second verse is the strong one.' },

  // ───────────── Rares ─────────────
  { id: 'eye-of-the-storm', name: 'Eye of the Storm', type: 'rite', cost: 1, rarity: 'rare', fade: true, effects: [{ kind: 'allAspects' }, { kind: 'draw', amount: 1 }], flavor: 'In the still centre, every weather at once.' },
  { id: 'the-long-weather', name: 'The Long Weather', type: 'rite', cost: 2, rarity: 'rare', fade: true, effects: [{ kind: 'aspectBoost' }], text: "Your Aspect's effect is doubled for the rest of the fight. (Drowned: your hits also Bleed. Fractured: +4, lose 2 HP. Choir: draw 2 more.)", flavor: 'This weather is not passing.' },
  {
    id: 'maelstrom',
    name: 'Maelstrom',
    type: 'strike',
    cost: 2,
    rarity: 'rare',
    archetype: 'storm',
    effects: [{ kind: 'damage', amount: 6, target: 'allFoes' }, inAspect('drowned', [bleed(2, 'allFoes')]), inAspect('fractured', [{ kind: 'damage', amount: 6, target: 'allFoes' }]), inAspect('choir', [{ kind: 'draw', amount: 2 }])],
    text: 'Deal 6 to all foes. Drowned: apply 2 Bleed to all. Fractured: deal 6 more to all. Choir: draw 2.',
    flavor: 'Every weather, turning in one place.',
  },
  { id: 'weathermaker', name: 'Weathermaker', type: 'rite', cost: 1, rarity: 'rare', archetype: 'choir', fade: true, effects: [attune('next'), { kind: 'gainResonance', amount: 1 }, { kind: 'draw', amount: 1 }], flavor: 'It does not predict the weather. It decides it.' },
  { id: 'cataclysm', name: 'Cataclysm', type: 'strike', cost: 3, rarity: 'rare', archetype: 'storm', effects: [{ kind: 'damage', amount: 20 }, inAspect('fractured', [{ kind: 'damage', amount: 10, target: 'allFoes' }])], text: 'Deal 20. In Fractured: deal 10 to all foes too.', flavor: 'The end of a world, aimed.' },
];
