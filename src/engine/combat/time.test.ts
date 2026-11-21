import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { act, play, startFight, withHand } from '../testing/fixtures';

const endTurn = { type: 'endTurn' } as const;

describe('Delay', () => {
  it('waits on the timeline, then lands at the start of the turn N turns later', () => {
    let s = withHand(startFight(), ['fuse']);
    s = play(s, 0).state;
    expect(s.timeline).toHaveLength(1);
    expect(s.enemies[0].hp).toBe(100);

    s = act(s, endTurn).state; // turn 2: 1 left
    expect(s.enemies[0].hp).toBe(100);
    expect(s.timeline[0].turnsLeft).toBe(1);

    const { state, events } = act(s, endTurn); // turn 3: lands
    expect(state.enemies[0].hp).toBe(90);
    expect(state.timeline).toHaveLength(0);
    expect(events.map((e) => e.type)).toContain('delayFired');
  });

  it('keeps its target, and falls back to a living enemy if that target died', () => {
    let s = withHand(startFight({ encounterId: 'two-dummies' }), ['fuse', 'fuse']);
    s = play(s, 0, 'e1').state;
    s = play(s, 0, 'e1').state;
    s.enemies[1].hp = 5; // the first blast kills e1; the second must find e0
    s = act(act(s, endTurn).state, endTurn).state;
    expect(s.enemies[1].hp).toBe(0);
    expect(s.enemies[0].hp).toBe(90);
  });

  it('Hasten brings effects closer and lands any that reach zero immediately', () => {
    let s = withHand(startFight(), ['fuse', 'hasten', 'hasten']);
    s = play(s, 0).state;
    s = play(s, 0).state;
    expect(s.timeline[0].turnsLeft).toBe(1);
    const { state } = play(s, 0);
    expect(state.enemies[0].hp).toBe(90);
    expect(state.timeline).toHaveLength(0);
  });

  it('amounts can scale with the number of waiting effects', () => {
    let s = withHand(startFight(), ['fuse', 'fuse', 'tick']);
    s = play(s, 0).state;
    s = play(s, 0).state;
    s = play(s, 0).state;
    expect(s.enemies[0].hp).toBe(100 - (1 + 2 * 4));
  });

  it('fires delayFired triggers (Cracked Hourglass style)', () => {
    let s = withHand(startFight({ relics: ['hourglass'] }), ['fuse', 'hasten', 'hasten']);
    s = play(play(play(s, 0).state, 0).state, 0).state;
    expect(s.player.ward).toBe(3);
  });

  it('survives a save/reload while waiting', () => {
    let s = withHand(startFight(), ['fuse']);
    s = play(s, 0).state;
    s = JSON.parse(JSON.stringify(s));
    s = act(act(s, endTurn).state, endTurn).state;
    expect(s.enemies[0].hp).toBe(90);
  });
});

describe('Echo', () => {
  it('a played Echo card returns as a fading copy next turn', () => {
    let s = withHand(startFight({ deck: Array(12).fill('ward5') }), ['flick']);
    s = play(s, 0).state;
    expect(s.echoQueue).toHaveLength(1);
    expect(s.piles.discard.map((c) => c.cardId)).toEqual(['flick']); // the original is discarded as normal

    s = act(s, endTurn).state;
    const copy = s.piles.hand.find((c) => c.cardId === 'flick');
    expect(copy?.ephemeral).toBe(true);
    expect(s.piles.hand).toHaveLength(BALANCE.player.drawPerTurn + 1);
  });

  it('a copy vanishes when played, but echoes again', () => {
    let s = withHand(startFight({ deck: Array(12).fill('ward5') }), ['flick']);
    s = act(play(s, 0).state, endTurn).state;
    const i = s.piles.hand.findIndex((c) => c.ephemeral);
    const before = s.piles.discard.length;
    s = play(s, i).state;
    expect(s.piles.discard.length).toBe(before); // the copy did not go to discard
    expect(s.piles.faded).toHaveLength(0);
    expect(s.echoQueue).toHaveLength(1); // and queued its own echo
  });

  it('an unplayed copy fades at the end of the turn', () => {
    let s = withHand(startFight({ deck: Array(12).fill('ward5') }), ['flick']);
    s = act(play(s, 0).state, endTurn).state;
    s = act(s, endTurn).state;
    const all = [...s.piles.draw, ...s.piles.hand, ...s.piles.discard, ...s.piles.faded];
    expect(all.filter((c) => c.ephemeral)).toHaveLength(0);
  });
});

describe('Rewind', () => {
  it('returns the most recent discards to hand, never the card being played', () => {
    let s = withHand(startFight(), ['hit6', 'ward5', 'rewind']);
    s = play(s, 0).state; // hit6 → discard
    s = play(s, 0).state; // ward5 → discard (most recent)
    s = play(s, 0).state; // rewind
    expect(s.piles.hand.map((c) => c.cardId)).toEqual(['ward5']);
    expect(s.piles.discard.map((c) => c.cardId)).toEqual(['hit6', 'rewind']);
  });

  it('Rewind 2 brings back two; with an empty discard it does nothing', () => {
    let s = withHand(startFight(), ['hit6', 'ward5', 'rewind2']);
    s = play(play(s, 0).state, 0).state;
    s = play(s, 0).state;
    expect(s.piles.hand.map((c) => c.cardId).sort()).toEqual(['hit6', 'ward5']);

    const empty = play(withHand(startFight(), ['rewind']), 0);
    expect(empty.error).toBeUndefined();
    expect(empty.state.piles.hand).toHaveLength(0);
  });
});

describe('Paradox', () => {
  const P = BALANCE.status.paradox;

  it('below the threshold it simply stays', () => {
    let s = withHand(startFight(), ['paradox3']);
    s = act(play(s, 0).state, endTurn).state;
    expect(s.player.statuses.paradox).toBe(3);
    expect(s.player.hp).toBe(50);
  });

  it('at the threshold the timeline snaps back: damage per stack, then reset', () => {
    let s = withHand(startFight(), ['paradox3', 'paradox3']);
    s = play(play(s, 0).state, 0).state; // 6 Paradox
    const { state, events } = act(s, endTurn);
    expect(state.player.hp).toBe(50 - 6 * P.snapDamagePerStack);
    expect(state.player.statuses.paradox).toBeUndefined();
    expect(events).toContainEqual({ type: 'paradoxSnap', damage: 6 * P.snapDamagePerStack });
  });
});
