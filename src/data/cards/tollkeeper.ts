/**
 * The Tollkeeper's cards (docs/design/tollkeeper.md). Foes pay Toll when they
 * die; Pay cards spend it for a bonus. Toll never leaves the loop.
 */
import type { CardDef, Effect } from '../../engine/types';

const pay = (amount: number | 'all', then: Effect[], otherwise?: Effect[]): Effect => ({ kind: 'pay', amount, then, ...(otherwise ? { else: otherwise } : {}) });
const ifKilled = (then: Effect[]): Effect => ({ kind: 'ifKilled', then });

export const TOLLKEEPER_CARDS: CardDef[] = [
  // ───────────── Starters ─────────────
  { id: 'collectors-blade', name: "Collector's Blade", type: 'strike', cost: 1, rarity: 'starter', effects: [{ kind: 'damage', amount: 6 }], flavor: 'Everyone pays. One way or another.' },
  { id: 'iron-ledger', name: 'Iron Ledger', type: 'ward', cost: 1, rarity: 'starter', effects: [{ kind: 'ward', amount: 5 }], flavor: 'Heavy enough to stop a blade. Heavier with debts.' },
  { id: 'exact-payment', name: 'Exact Payment', type: 'strike', cost: 1, rarity: 'starter', archetype: 'toll', effects: [{ kind: 'damage', amount: 8 }, ifKilled([{ kind: 'gainToll', n: 3 }])], flavor: 'To the last coin.' },
  {
    id: 'bribe-the-dark',
    name: 'Bribe the Dark',
    type: 'rite',
    cost: 1,
    rarity: 'starter',
    archetype: 'coin',
    effects: [pay(2, [{ kind: 'gainResonance', amount: 2 }, { kind: 'draw', amount: 1 }], [{ kind: 'ward', amount: 6 }])],
    flavor: 'Even the dark has a price.',
  },

  // ───────────── Commons ─────────────
  { id: 'shake-down', name: 'Shake Down', type: 'strike', cost: 1, rarity: 'common', archetype: 'toll', effects: [{ kind: 'damage', amount: 7 }, ifKilled([{ kind: 'gainToll', n: 2 }])], flavor: 'Turn out your pockets. Turn out your ribs.' },
  { id: 'hired-steel', name: 'Hired Steel', type: 'strike', cost: 1, rarity: 'common', archetype: 'coin', effects: [pay(2, [{ kind: 'damage', amount: 14 }], [{ kind: 'damage', amount: 7 }])], flavor: 'Paid in advance. Sharpened accordingly.' },
  { id: 'gilded-ward', name: 'Gilded Ward', type: 'ward', cost: 1, rarity: 'common', archetype: 'coin', effects: [pay(1, [{ kind: 'ward', amount: 10 }], [{ kind: 'ward', amount: 4 }])], flavor: 'Gold leaf over iron. Mostly iron.' },
  { id: 'coin-toss', name: 'Coin Toss', type: 'rite', cost: 0, rarity: 'common', archetype: 'toll', fade: true, effects: [{ kind: 'gainToll', n: 1 }, { kind: 'draw', amount: 1 }], flavor: 'Heads you pay. Tails you pay later.' },
  { id: 'counting-house', name: 'Counting House', type: 'ward', cost: 1, rarity: 'common', archetype: 'toll', effects: [{ kind: 'ward', amount: { per: 'toll', times: 0.5, plus: 5 } }], flavor: 'Walls of coin. Very thick walls.' },
  { id: 'collection', name: 'Collection', type: 'strike', cost: 1, rarity: 'common', archetype: 'coin', effects: [{ kind: 'damage', amount: 4, target: 'allFoes' }, pay(1, [{ kind: 'damage', amount: 4, target: 'allFoes' }])], flavor: 'Rounds are made. Every door is knocked.' },
  { id: 'paid-guard', name: 'Paid Guard', type: 'ward', cost: 1, rarity: 'common', archetype: 'coin', effects: [pay(2, [{ kind: 'ward', amount: 12 }], [{ kind: 'ward', amount: 5 }])], flavor: 'They stay as long as the money does.' },
  { id: 'small-change', name: 'Small Change', type: 'strike', cost: 0, rarity: 'common', archetype: 'coin', effects: [{ kind: 'damage', amount: 3 }, pay(1, [{ kind: 'damage', amount: 6 }])], flavor: 'It adds up.' },

  // ───────────── Uncommons ─────────────
  { id: 'interest', name: 'Interest', type: 'rite', cost: 0, rarity: 'uncommon', archetype: 'toll', fade: true, effects: [{ kind: 'gainToll', n: 'double', max: 3 }], flavor: 'Money makes money. Slowly. Then quickly.' },
  { id: 'bought-time', name: 'Bought Time', type: 'rite', cost: 1, rarity: 'uncommon', archetype: 'coin', effects: [pay(2, [{ kind: 'gainResonance', amount: 2 }, { kind: 'draw', amount: 2 }], [{ kind: 'draw', amount: 1 }])], flavor: 'Every second has a price. You can afford a few.' },
  { id: 'golden-hail', name: 'Golden Hail', type: 'strike', cost: 2, rarity: 'uncommon', archetype: 'toll', effects: [{ kind: 'damage', amount: { per: 'toll', times: 1, max: 20 }, target: 'allFoes' }], flavor: 'Throw the coins. They come back.' },
  { id: 'blood-money', name: 'Blood Money', type: 'strike', cost: 1, rarity: 'uncommon', archetype: 'toll', effects: [{ kind: 'damage', amount: 10 }, ifKilled([{ kind: 'gainToll', n: 3 }])], flavor: 'The price of a life, collected from the life.' },
  {
    id: 'ransom',
    name: 'Ransom',
    type: 'rite',
    cost: 1,
    rarity: 'uncommon',
    archetype: 'coin',
    effects: [
      pay(
        4,
        [
          { kind: 'applyStatus', status: 'weakened', amount: 2, target: 'target' },
          { kind: 'applyStatus', status: 'exposed', amount: 2, target: 'target' },
        ],
        [{ kind: 'applyStatus', status: 'weakened', amount: 1, target: 'target' }],
      ),
    ],
    flavor: 'We have your strength. Pay, and you may have it back.',
  },
  { id: 'hostile-takeover', name: 'Hostile Takeover', type: 'strike', cost: 2, rarity: 'uncommon', archetype: 'coin', effects: [pay(2, [{ kind: 'damage', amount: 20 }], [{ kind: 'damage', amount: 10 }])], flavor: 'Everything it owns is yours now. Including its pain.' },
  { id: 'vault-dividend', name: 'Vault Dividend', type: 'ward', cost: 1, rarity: 'uncommon', archetype: 'toll', effects: [{ kind: 'ward', amount: { per: 'toll', times: 0.67, plus: 6 } }], flavor: 'The vault pays its shareholders in walls.' },

  // ───────────── Rares ─────────────
  { id: 'debt-collector', name: 'Debt Collector', type: 'strike', cost: 2, rarity: 'rare', archetype: 'coin', effects: [{ kind: 'damage', amount: { per: 'tollPaid', times: 3, plus: 6 } }], flavor: 'It remembers every coin you ever spent. So do they.' },
  { id: 'the-final-toll', name: 'The Final Toll', type: 'strike', cost: 3, rarity: 'rare', archetype: 'coin', fade: true, effects: [pay('all', [{ kind: 'damage', amount: { per: 'lastPaid', times: 4 } }])], flavor: 'Settle every account at once.' },
  { id: 'golden-ward', name: 'Golden Ward', type: 'ward', cost: 2, rarity: 'rare', archetype: 'coin', fade: true, effects: [pay('all', [{ kind: 'ward', amount: { per: 'lastPaid', times: 3 } }])], flavor: 'Stand behind your fortune.' },
  { id: 'toll-of-ages', name: 'Toll of Ages', type: 'rite', cost: 1, rarity: 'rare', archetype: 'toll', fade: true, effects: [{ kind: 'gainToll', n: 'double', max: 10 }], flavor: 'Old debts, come due all at once.' },
  { id: 'bankrupt-the-dark', name: 'Bankrupt the Dark', type: 'strike', cost: 3, rarity: 'rare', archetype: 'coin', effects: [{ kind: 'damage', amount: 12, target: 'allFoes' }, pay(5, [{ kind: 'damage', amount: 12, target: 'allFoes' }])], flavor: 'Spend everything. Leave nothing standing.' },
];
