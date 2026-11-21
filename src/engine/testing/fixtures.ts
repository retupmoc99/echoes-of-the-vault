/**
 * Test-only content with simple round numbers, so engine tests don't break
 * every time real cards are rebalanced.
 */
import { createCombat, step } from '../combat/combat';
import type { CardDef, CombatAction, CombatSetup, CombatState, Content, EnemyDef, RelicDef } from '../types';

const card = (id: string, cost: number, effects: CardDef['effects'], extra: Partial<CardDef> = {}): CardDef => ({
  id,
  name: id,
  type: 'strike',
  cost,
  rarity: 'common',
  effects,
  flavor: '',
  ...extra,
});

const enemy = (id: string, hp: number, moves: EnemyDef['moves'], pattern: EnemyDef['pattern']): EnemyDef => ({
  id,
  name: id,
  tier: 'normal',
  hp: [hp, hp],
  moves,
  pattern,
  sigil: { sides: 4, innerSides: 0, rings: 0, hue: 0, spin: 10 },
  flavor: '',
});

const relic = (id: string, r: Partial<RelicDef>): RelicDef => ({ id, name: id, rarity: 'common', flavor: '', ...r });

const list = <T extends { id: string }>(items: T[]) => Object.fromEntries(items.map((i) => [i.id, i]));

export const TEST_CONTENT: Content = {
  classes: {},
  cards: list([
    card('hit6', 1, [{ kind: 'damage', amount: 6 }]),
    card('hit50', 1, [{ kind: 'damage', amount: 50 }]),
    card('ward5', 1, [{ kind: 'ward', amount: 5 }], { type: 'ward' }),
    card('crack', 0, [{ kind: 'applyStatus', status: 'fracture', amount: 4, target: 'self' }], { type: 'rite' }),
    card('expose', 0, [{ kind: 'applyStatus', status: 'exposed', amount: 1, target: 'target' }], { type: 'rite' }),
    card('weaken', 0, [{ kind: 'applyStatus', status: 'weakened', amount: 2, target: 'target' }], { type: 'rite' }),
    card('bleed5', 0, [{ kind: 'applyStatus', status: 'bleed', amount: 5, target: 'target' }], { type: 'rite' }),
    card('slam', 1, [{ kind: 'damage', amount: { per: 'selfWard', times: 1 } }]),
    card('release', 0, [
      { kind: 'damage', amount: { per: 'selfStatus', status: 'fracture', times: 3 } },
      { kind: 'removeStatus', status: 'fracture', target: 'self' },
    ]),
    card('overload', 0, [{ kind: 'overloadRelic', which: 'random' }], { type: 'overload' }),
    card('overloadAll', 0, [{ kind: 'overloadRelic', which: 'all' }], { type: 'overload' }),
    card('cool', 0, [{ kind: 'clearStrain' }], { type: 'overload' }),
    card('bastion', 0, [{ kind: 'retainWard' }], { type: 'rite', fade: true }),
    card('conduit', 0, [
      { kind: 'damage', amount: 5 },
      { kind: 'if', cond: { kind: 'overloadedThisTurn' }, then: [{ kind: 'damage', amount: 5 }] },
    ]),
    card('curse', 0, [], { unplayable: true, type: 'curse' }),
    card('burning-curse', 0, [], { unplayable: true, type: 'curse', inHandAtTurnEnd: [{ kind: 'loseHp', amount: 3 }] }),
    card('feedback', 0, [{ kind: 'damage', amount: { per: 'overloadsThisTurn', times: 4, plus: 1 } }]),
    // Time mechanics
    card('fuse', 0, [{ kind: 'delay', turns: 2, effects: [{ kind: 'damage', amount: 10 }] }], { type: 'temporal' }),
    card('hasten', 0, [{ kind: 'hasten', turns: 1 }], { type: 'temporal' }),
    card('flick', 0, [{ kind: 'damage', amount: 3 }], { echo: true }),
    card('rewind', 0, [{ kind: 'rewind', count: 1 }], { type: 'temporal' }),
    card('rewind2', 0, [{ kind: 'rewind', count: 2 }], { type: 'temporal' }),
    card('paradox3', 0, [{ kind: 'applyStatus', status: 'paradox', amount: 3, target: 'self' }], { type: 'rite' }),
    card('tick', 0, [{ kind: 'damage', amount: { per: 'timeline', times: 4, plus: 1 } }]),
  ]),
  relics: list([
    relic('zapper', { overload: [{ kind: 'damage', amount: 4, target: 'allFoes' }] }),
    relic('shield', { overload: [{ kind: 'ward', amount: 10 }], maxStrain: 2 }),
    relic('prism', { passive: [{ on: 'gainedStatus', status: 'fracture', effects: [{ kind: 'ward', amount: 3 }] }] }),
    relic('hourglass', { passive: [{ on: 'delayFired', effects: [{ kind: 'ward', amount: 3 }] }] }),
  ]),
  enemies: list([
    enemy('dummy', 100, { wait: { name: 'Wait', effects: [] } }, { kind: 'cycle', order: ['wait'] }),
    enemy('hitter', 100, { hit: { name: 'Hit', effects: [{ kind: 'damage', amount: 10 }] } }, { kind: 'cycle', order: ['hit'] }),
    enemy(
      'cycler',
      100,
      {
        a: { name: 'A', effects: [] },
        b: { name: 'B', effects: [] },
        open: { name: 'Open', effects: [] },
      },
      { kind: 'cycle', order: ['a', 'b'], opening: 'open' },
    ),
    enemy(
      'random',
      100,
      { a: { name: 'A', effects: [] }, b: { name: 'B', effects: [] } },
      { kind: 'weighted', weights: { a: 1, b: 1 }, noRepeat: true },
    ),
  ]),
  encounters: list([
    { id: 'dummy', tier: 'normal', enemies: ['dummy'] },
    { id: 'hitter', tier: 'normal', enemies: ['hitter'] },
    { id: 'two-dummies', tier: 'normal', enemies: ['dummy', 'dummy'] },
    { id: 'cycler', tier: 'normal', enemies: ['cycler'] },
    { id: 'random', tier: 'normal', enemies: ['random'] },
  ]),
  events: {},
  vaultShifts: {},
  idle: { traits: [], unlocks: [], research: [], lore: {}, names: { given: [], epithets: [] } },
};

/** Start a test fight against simple test content. Use withHand() to fix the hand. */
export function startFight(overrides: Partial<CombatSetup> = {}): CombatState {
  const setup: CombatSetup = {
    seed: 'test',
    deck: ['hit6', 'hit6', 'hit6', 'hit6', 'hit6'],
    hp: 50,
    maxHp: 50,
    relics: [],
    encounterId: 'dummy',
    ...overrides,
  };
  const { state } = createCombat(setup, TEST_CONTENT);
  return state;
}

/** Put exactly these cards in hand (helps tests ignore shuffling). */
export function withHand(state: CombatState, cardIds: string[]): CombatState {
  const s = structuredClone(state);
  s.piles.hand = cardIds.map((cardId, i) => ({ uid: `t${i}`, cardId }));
  return s;
}

export function play(state: CombatState, handIndex: number, targetId?: string) {
  const uid = state.piles.hand[handIndex].uid;
  return step(state, { type: 'playCard', uid, targetId }, TEST_CONTENT);
}

export function act(state: CombatState, action: CombatAction) {
  return step(state, action, TEST_CONTENT);
}
