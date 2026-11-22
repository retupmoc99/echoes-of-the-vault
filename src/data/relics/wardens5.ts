/**
 * Relics for Wardens 5–9: the Sin-Eater, Mirrorborn, Shiftwright, Pilgrim
 * and Tollkeeper (docs/design/*.md). Each Warden: a starter, seven for its
 * pool, and one from the bottom of the Well.
 */
import type { Effect, RelicDef } from '../../engine/types';

const when = (cond: Effect extends infer E ? (E extends { kind: 'if'; cond: infer C } ? C : never) : never, then: Effect[]): Effect => ({ kind: 'if', cond, then });

export const SIN_EATER_RELICS: RelicDef[] = [
  { id: 'black-salt', name: 'Black Salt', rarity: 'starter', passive: [{ on: 'devoured', effects: [{ kind: 'ward', amount: 3 }] }], flavor: 'A pinch on the tongue before every meal.' },
  { id: 'iron-stomach', name: 'Iron Stomach', rarity: 'common', passive: [{ on: 'turnStart', effects: [when({ kind: 'curseInHand' }, [{ kind: 'ward', amount: 4 }])] }], flavor: 'Nothing it eats can hurt it now.' },
  { id: 'bone-fork', name: 'Bone Fork', rarity: 'common', passive: [{ on: 'devoured', effects: [{ kind: 'damage', amount: 4 }] }], flavor: 'Carved from the last thing that tried to eat it.' },
  {
    id: 'tithe-bowl',
    name: 'Tithe Bowl',
    rarity: 'uncommon',
    passive: [{ on: 'combatStart', effects: [{ kind: 'shuffleIn', cardId: 'randomCurse' }, { kind: 'draw', amount: 1 }] }],
    flavor: 'It fills itself. You never see with what.',
  },
  { id: 'sin-ledger', name: 'Sin Ledger', rarity: 'uncommon', passive: [{ on: 'turnEnd', effects: [{ kind: 'ward', amount: { per: 'cursesInDeck', times: 1, max: 6 } }] }], flavor: 'Every wrong, written down. It makes a thick book.' },
  { id: 'gilded-tongue', name: 'Gilded Tongue', rarity: 'uncommon', corruption: 1, passive: [{ on: 'devoured', effects: [{ kind: 'gainResonance', amount: 1 }] }], flavor: 'Gold makes anything taste better. Almost.' },
  { id: 'the-last-meal', name: 'The Last Meal', rarity: 'rare', passive: [{ on: 'devoured', effects: [{ kind: 'draw', amount: 1 }] }], flavor: 'Always the last. Always another.' },
  { id: 'ash-crown', name: 'Ash Crown', rarity: 'rare', passive: [{ on: 'combatStart', effects: [{ kind: 'ward', amount: { per: 'cursesInDeck', times: 2, max: 12 } }] }], flavor: 'A king of every sin in the vault.' },
  { id: 'drowned-chalice', name: 'Drowned Chalice', rarity: 'rare', deepFor: 'sin-eater', passive: [{ on: 'devoured', effects: [{ kind: 'damage', amount: 3, target: 'allFoes' }] }], flavor: 'It held the Well’s water. It holds worse now.' },
];

export const MIRRORBORN_RELICS: RelicDef[] = [
  { id: 'cracked-mirror', name: 'Cracked Mirror', rarity: 'starter', passive: [{ on: 'mirrored', effects: [{ kind: 'ward', amount: 1 }] }], flavor: 'The crack runs through every reflection it ever held.' },
  {
    id: 'silver-dust',
    name: 'Silver Dust',
    rarity: 'common',
    passive: [{ on: 'turnStart', effects: [when({ kind: 'anyFoeIntends', intent: 'attack' }, [{ kind: 'ward', amount: 3 }])] }],
    flavor: 'Scatter it, and every blow shows its path.',
  },
  { id: 'hand-mirror', name: 'Hand Mirror', rarity: 'common', passive: [{ on: 'mirrored', effects: [{ kind: 'damage', amount: 2, target: 'allFoes' }] }], flavor: 'Small enough to hide. Sharp enough to matter.' },
  { id: 'two-sided-coin', name: 'Two-Sided Coin', rarity: 'uncommon', passive: [{ on: 'combatStart', effects: [{ kind: 'applyStatus', status: 'exposed', amount: 1, target: 'allFoes' }] }], flavor: 'Both faces are yours.' },
  { id: 'thiefs-glove', name: "Thief's Glove", rarity: 'uncommon', passive: [{ on: 'stole', effects: [{ kind: 'gainResonance', amount: 1 }] }], flavor: 'Soft leather, quick fingers, no conscience.' },
  { id: 'glass-heart', name: 'Glass Heart', rarity: 'uncommon', corruption: 1, combatMods: { mirrorBonus: 0.25 }, text: 'Your Mirrors are 25% stronger.', flavor: 'Beautiful, and one hard knock from ruin.' },
  { id: 'the-true-reflection', name: 'The True Reflection', rarity: 'rare', passive: [{ on: 'mirrored', effects: [{ kind: 'draw', amount: 1 }] }], flavor: 'It shows what you will do. Then you do it.' },
  { id: 'black-glass', name: 'Black Glass', rarity: 'rare', passive: [{ on: 'stole', effects: [{ kind: 'damage', amount: 6 }] }], flavor: 'What it takes, it keeps. What it keeps, it uses.' },
  {
    id: 'drowned-mirror',
    name: 'Drowned Mirror',
    rarity: 'rare',
    deepFor: 'mirrorborn',
    passive: [{ on: 'mirrored', effects: [{ kind: 'ward', amount: 4 }, { kind: 'applyStatus', status: 'weakened', amount: 1, target: 'target' }] }],
    flavor: 'Pulled from the Well. Its reflections are still wet.',
  },
];

export const SHIFTWRIGHT_RELICS: RelicDef[] = [
  { id: 'weathervane', name: 'Weathervane', rarity: 'starter', passive: [{ on: 'attuned', oncePerTurn: true, effects: [{ kind: 'draw', amount: 1 }] }], flavor: 'It turned in no wind. It pointed where the vault was going.' },
  { id: 'rain-chime', name: 'Rain Chime', rarity: 'common', passive: [{ on: 'attuned', effects: [{ kind: 'ward', amount: 3 }] }], flavor: 'It rings when the weather changes. It rings often.' },
  { id: 'storm-jar', name: 'Storm Jar', rarity: 'common', passive: [{ on: 'turnStart', effects: [when({ kind: 'inAspect', aspect: 'fractured' }, [{ kind: 'ward', amount: 3 }])] }], flavor: 'A thunderhead in a bottle, sulking.' },
  { id: 'tide-pool', name: 'Tide Pool', rarity: 'uncommon', passive: [{ on: 'turnStart', effects: [when({ kind: 'inAspect', aspect: 'drowned' }, [{ kind: 'applyStatus', status: 'bleed', amount: 1, target: 'allFoes' }])] }], flavor: 'Small, still, and full of teeth.' },
  { id: 'choir-bell', name: 'Choir Bell', rarity: 'uncommon', passive: [{ on: 'turnStart', effects: [when({ kind: 'inAspect', aspect: 'choir' }, [{ kind: 'ward', amount: 4 }])] }], flavor: 'One clear note, and the room steadies.' },
  { id: 'broken-barometer', name: 'Broken Barometer', rarity: 'uncommon', corruption: 1, passive: [{ on: 'attuned', oncePerTurn: true, effects: [{ kind: 'gainResonance', amount: 1 }] }], flavor: 'The needle spins. Power leaks out of the crack.' },
  { id: 'eye-of-the-vault', name: 'Eye of the Vault', rarity: 'rare', passive: [{ on: 'combatStart', effects: [{ kind: 'attune', aspect: 'next' }, { kind: 'ward', amount: 6 }] }], flavor: 'The vault watches its own weather. Now so do you.' },
  { id: 'the-fourth-weather', name: 'The Fourth Weather', rarity: 'rare', passive: [{ on: 'combatStart', effects: [{ kind: 'allAspects' }] }], text: 'On your first turn each fight, you count as in every Aspect.', flavor: 'There was always a fourth. Nobody survived naming it.' },
  { id: 'drowned-vane', name: 'Drowned Vane', rarity: 'rare', deepFor: 'shiftwright', passive: [{ on: 'attuned', effects: [{ kind: 'applyStatus', status: 'bleed', amount: 2, target: 'allFoes' }] }], flavor: 'It points down now. Always down.' },
];

export const PILGRIM_RELICS: RelicDef[] = [
  { id: 'worn-compass', name: 'Worn Compass', rarity: 'starter', passive: [{ on: 'combatStart', effects: [{ kind: 'ward', amount: { per: 'miles', times: 0.34, max: 4 } }] }], text: 'When a fight begins: gain 1 Ward per 3 Miles (at most 4).', flavor: 'The needle is long gone. It still knows the way.' },
  { id: 'hobnail-boots', name: 'Hobnail Boots', rarity: 'common', runMods: { milesPerElite: 1 }, text: 'Elites give 1 more Mile.', flavor: 'Built for hard roads and harder floors.' },
  { id: 'prayer-beads', name: 'Prayer Beads', rarity: 'common', passive: [{ on: 'turnStart', effects: [when({ kind: 'milesAtLeast', n: 8 }, [{ kind: 'ward', amount: 3 }])] }], flavor: 'One bead for every mile. The string is very long.' },
  { id: 'road-map', name: 'Road Map', rarity: 'uncommon', passive: [{ on: 'combatStart', effects: [{ kind: 'gainMiles', n: 1 }] }], flavor: 'Most of the roads on it do not exist. Yet.' },
  { id: 'tin-cup', name: 'Tin Cup', rarity: 'uncommon', passive: [{ on: 'turnStart', effects: [when({ kind: 'milesAtLeast', n: 10 }, [{ kind: 'gainResonance', amount: 1 }])] }], flavor: 'Dented by a thousand wells.' },
  { id: 'pilgrims-badge', name: "Pilgrim's Badge", rarity: 'uncommon', corruption: 1, runMods: { milesPerNode: 1 }, text: 'Every chamber gives 1 more Mile.', flavor: 'Proof you have been everywhere. The vault notices.' },
  { id: 'saints-sandal', name: "Saint's Sandal", rarity: 'rare', passive: [{ on: 'combatStart', effects: [{ kind: 'damage', amount: { per: 'miles', times: 1, max: 12 }, target: 'allFoes' }] }], flavor: 'It walked to the end of the world, and kicked.' },
  { id: 'the-long-way-round', name: 'The Long Way Round', rarity: 'rare', runMods: { milesDeep: 1 }, text: 'On floor 2, every chamber gives 1 more Mile.', flavor: 'The stairs are the long way. That is the point.' },
  { id: 'drowned-lantern', name: 'Drowned Lantern', rarity: 'rare', deepFor: 'pilgrim', passive: [{ on: 'combatStart', effects: [{ kind: 'draw', amount: { per: 'miles', times: 0.125 } }] }], flavor: 'It still burns, under the water, for whoever is walking.' },
];

export const TOLLKEEPER_RELICS: RelicDef[] = [
  { id: 'tollhouse-lantern', name: 'Tollhouse Lantern', rarity: 'starter', passive: [{ on: 'combatStart', effects: [{ kind: 'gainToll', n: 1 }] }, { on: 'foeDied', effects: [{ kind: 'gainToll', n: 3, elite: 4, boss: 6 }] }], text: 'When a fight begins, gain 1 Toll. Whenever a foe dies, gain Toll: 3, or 4 for an elite, 6 for a boss.', flavor: 'It burns for every soul that passes. All of them pay.' },
  { id: 'coin-purse', name: 'Coin Purse', rarity: 'common', passive: [{ on: 'combatStart', effects: [{ kind: 'gainToll', n: 1 }] }], flavor: 'Never empty. Never quite full.' },
  { id: 'brass-scales', name: 'Brass Scales', rarity: 'common', passive: [{ on: 'turnStart', effects: [when({ kind: 'tollAtLeast', n: 6 }, [{ kind: 'ward', amount: 3 }])] }], flavor: 'Weigh the coin. Weigh the blow.' },
  { id: 'ledger-of-debts', name: 'Ledger of Debts', rarity: 'uncommon', passive: [{ on: 'paid', effects: [{ kind: 'ward', amount: 2 }] }], flavor: 'Every payment, recorded. Every record, a brick.' },
  { id: 'weighted-dice', name: 'Weighted Dice', rarity: 'uncommon', passive: [{ on: 'turnStart', effects: [when({ kind: 'tollAtLeast', n: 10 }, [{ kind: 'gainResonance', amount: 1 }])] }], flavor: 'The house always wins. You are the house.' },
  { id: 'gilded-hand', name: 'Gilded Hand', rarity: 'uncommon', corruption: 1, passive: [{ on: 'foeDied', effects: [{ kind: 'gainToll', n: 1 }] }], flavor: 'Everything it touches turns to profit. Including you.' },
  { id: 'golden-key', name: 'Golden Key', rarity: 'rare', combatMods: { payDiscount: 1 }, text: 'Pay costs are 1 lower (at least 1).', flavor: 'It opens every toll gate. For a small fee.' },
  { id: 'the-last-coin', name: 'The Last Coin', rarity: 'rare', passive: [{ on: 'paid', oncePerTurn: true, effects: [{ kind: 'draw', amount: 1 }] }], flavor: 'Spend it, and the next one appears.' },
  { id: 'drowned-coin', name: 'Drowned Coin', rarity: 'rare', deepFor: 'tollkeeper', passive: [{ on: 'paid', effects: [{ kind: 'damage', amount: 3, target: 'allFoes' }] }], flavor: 'Paid to the Well. The Well paid back.' },
];
