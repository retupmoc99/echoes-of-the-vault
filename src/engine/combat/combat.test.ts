import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { CONTENT } from '../../data';
import { act, play, startFight, TEST_CONTENT, withHand } from '../testing/fixtures';
import type { CombatAction, CombatState } from '../types';
import { createCombat, step } from './combat';

const endTurn = { type: 'endTurn' } as const;

describe('turn flow', () => {
  it('starts with full Resonance and a full hand', () => {
    const s = startFight({ deck: Array(12).fill('hit6') });
    expect(s.turn).toBe(1);
    expect(s.resonance).toBe(BALANCE.player.resonancePerTurn);
    expect(s.piles.hand).toHaveLength(BALANCE.player.drawPerTurn);
    expect(s.piles.draw).toHaveLength(12 - BALANCE.player.drawPerTurn);
  });

  it('spends Resonance and refuses cards you cannot afford', () => {
    let s = withHand(startFight(), ['hit6', 'hit6', 'hit6', 'hit6']);
    for (let i = 0; i < 3; i++) s = play(s, 0).state;
    expect(s.resonance).toBe(0);
    const refused = play(s, 0);
    expect(refused.error).toMatch(/Resonance/);
    expect(refused.state).toBe(s); // unchanged, same object
  });

  it('refuses unplayable cards', () => {
    const s = withHand(startFight(), ['curse']);
    expect(play(s, 0).error).toBeDefined();
  });

  it('moves played cards to discard and Fade cards to faded', () => {
    let s = withHand(startFight(), ['hit6', 'bastion']);
    s = play(s, 0).state;
    s = play(s, 0).state;
    expect(s.piles.discard.map((c) => c.cardId)).toEqual(['hit6']);
    expect(s.piles.faded.map((c) => c.cardId)).toEqual(['bastion']);
  });

  it('enemies act on their intent, then a new turn begins', () => {
    const s = startFight({ encounterId: 'hitter' });
    const { state, events } = act(s, endTurn);
    expect(state.player.hp).toBe(50 - 10);
    expect(state.turn).toBe(2);
    expect(state.resonance).toBe(BALANCE.player.resonancePerTurn);
    expect(events.map((e) => e.type)).toContain('enemyMove');
  });

  it('clears Ward at the start of your turn unless Bastion is active', () => {
    let s = withHand(startFight(), ['ward5']);
    s = play(s, 0).state;
    expect(act(s, endTurn).state.player.ward).toBe(0);

    s = withHand(startFight(), ['ward5', 'bastion']);
    s = play(s, 0).state;
    s = play(s, 0).state;
    expect(act(s, endTurn).state.player.ward).toBe(5);
  });

  it('reshuffles the discard pile when the draw pile runs out', () => {
    // 6 cards: draw 5, end turn (5 to discard, 1 left), next draw needs a reshuffle.
    const s = startFight({ deck: Array(6).fill('ward5') });
    const { state, events } = act(s, endTurn);
    expect(events).toContainEqual({ type: 'shuffle' });
    expect(state.piles.hand).toHaveLength(5);
  });

  it('wins when all enemies die and loses at 0 HP', () => {
    let s = withHand(startFight(), ['hit50', 'hit50']);
    s.enemies[0].hp = 40;
    expect(play(s, 0).state.phase).toBe('won');

    const doomed = startFight({ encounterId: 'hitter', hp: 5 });
    expect(act(doomed, endTurn).state.phase).toBe('lost');
  });

  it('refuses actions after the fight is over', () => {
    let s = withHand(startFight(), ['hit50']);
    s.enemies[0].hp = 1;
    s = play(s, 0).state;
    expect(act(s, endTurn).error).toBeDefined();
  });

  it('aims at the chosen enemy, or the first living one', () => {
    let s = withHand(startFight({ encounterId: 'two-dummies' }), ['hit6', 'hit6']);
    s = play(s, 0, 'e1').state;
    expect(s.enemies[1].hp).toBe(94);
    s = play(s, 0).state;
    expect(s.enemies[0].hp).toBe(94);
  });
});

describe('synergy cards', () => {
  it('Bulwark-style cards deal damage equal to Ward', () => {
    let s = withHand(startFight(), ['ward5', 'ward5', 'slam']);
    s = play(s, 0).state;
    s = play(s, 0).state;
    s = play(s, 0).state;
    expect(s.enemies[0].hp).toBe(90);
  });

  it('conditional damage only fires after an Overload this turn', () => {
    let s = withHand(startFight({ relics: ['shield'] }), ['conduit', 'overload', 'conduit']);
    s = play(s, 0).state;
    expect(s.enemies[0].hp).toBe(95);
    s = play(s, 0).state; // overload
    s = play(s, 0).state;
    expect(s.enemies[0].hp).toBe(85);
  });

  it('curses held at end of turn hurt you', () => {
    const s = withHand(startFight(), ['burning-curse', 'curse']);
    expect(act(s, endTurn).state.player.hp).toBe(47);
  });

  it('damage can scale with Overloads this turn', () => {
    let s = withHand(startFight({ relics: ['shield'] }), ['feedback', 'overload', 'feedback']);
    s = play(s, 0).state;
    expect(s.enemies[0].hp).toBe(99);
    s = play(s, 0).state;
    s = play(s, 0).state;
    expect(s.enemies[0].hp).toBe(99 - 5);
  });

  it('Vault Shift modifiers change status math (Bleed that never fades)', () => {
    let s = withHand(startFight({ modifiers: { bleedDecay: 0 } }), ['bleed5']);
    s = play(s, 0).state;
    s = act(s, endTurn).state;
    expect(s.enemies[0].statuses.bleed).toBe(5);
  });

  it('passive relics react to statuses (Grieving Prism style)', () => {
    let s = withHand(startFight({ relics: ['prism'] }), ['crack']);
    s = play(s, 0).state;
    expect(s.player.ward).toBe(3);
  });
});

describe('Overload and Strain', () => {
  it('fires the relic, adds Strain, and cracks it at max Strain', () => {
    let s = withHand(startFight({ relics: ['shield'] }), ['overload', 'overload', 'overload']);
    s = play(s, 0).state;
    expect(s.player.ward).toBe(10);
    expect(s.relics[0].strain).toBe(1);

    const second = play(s, 0);
    expect(second.state.relics[0].cracked).toBe(true); // shield has maxStrain 2
    expect(second.events).toContainEqual({ type: 'relicCracked', relicId: 'shield' });

    const third = play(second.state, 0);
    expect(third.events).toContainEqual({ type: 'overloadFizzled' });
    expect(third.state.player.ward).toBe(20);
  });

  it('Overload all hits every working relic', () => {
    let s = withHand(startFight({ relics: ['zapper', 'shield'] }), ['overloadAll']);
    s = play(s, 0).state;
    expect(s.enemies[0].hp).toBe(96);
    expect(s.player.ward).toBe(10);
    expect(s.relics.map((r) => r.strain)).toEqual([1, 1]);
  });

  it('clearing Strain does not repair cracked relics', () => {
    let s = withHand(startFight({ relics: ['shield', 'zapper'] }), ['overloadAll', 'overloadAll', 'cool']);
    s = play(s, 0).state;
    s = play(s, 0).state;
    s = play(s, 0).state;
    expect(s.relics[0]).toMatchObject({ cracked: true });
    expect(s.relics[1]).toMatchObject({ strain: 0, cracked: false });
  });
});

describe('determinism and resume', () => {
  /** Plays a scripted fight against real content: always the first affordable card, else end turn. */
  function autoplay(state: CombatState, steps: number, onStep?: (s: CombatState, i: number) => CombatState) {
    let s = state;
    for (let i = 0; i < steps && s.phase === 'player'; i++) {
      const card = s.piles.hand.find((c) => {
        const def = CONTENT.cards[c.cardId];
        return !def.unplayable && def.cost <= s.resonance;
      });
      const action: CombatAction = card ? { type: 'playCard', uid: card.uid } : { type: 'endTurn' };
      s = step(s, action, CONTENT).state;
      if (onStep) s = onStep(s, i);
    }
    return s;
  }

  const setup = {
    seed: 'loop-42',
    deck: CONTENT.classes['relic-breaker'].starterDeck,
    hp: 70,
    maxHp: 70,
    relics: ['cinder-core', 'thorned-halo'],
    encounterId: 'choir-pair',
  };

  it('same seed and same actions give identical results', () => {
    const a = autoplay(createCombat(setup, CONTENT).state, 60);
    const b = autoplay(createCombat(setup, CONTENT).state, 60);
    expect(a).toEqual(b);
  });

  it('saving and reloading after every action changes nothing', () => {
    const straight = autoplay(createCombat(setup, CONTENT).state, 60);
    const reloaded = autoplay(createCombat(setup, CONTENT).state, 60, (s) => JSON.parse(JSON.stringify(s)));
    expect(reloaded).toEqual(straight);
  });

  it('does not mutate the input state', () => {
    const s = startFight();
    const frozen = JSON.stringify(s);
    play(s, 0);
    step(s, { type: 'endTurn' }, TEST_CONTENT);
    expect(JSON.stringify(s)).toBe(frozen);
  });
});
