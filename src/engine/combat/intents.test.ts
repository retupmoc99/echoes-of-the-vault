import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { act, startFight } from '../testing/fixtures';
import { TEST_CONTENT } from '../testing/fixtures';
import { previewIntent } from './intents';

const endTurn = { type: 'endTurn' } as const;

describe('intents', () => {
  it('uses the opening move, then cycles in order', () => {
    let s = startFight({ encounterId: 'cycler' });
    const seen = [s.enemies[0].intent];
    for (let i = 0; i < 4; i++) {
      s = act(s, endTurn).state;
      seen.push(s.enemies[0].intent);
    }
    expect(seen).toEqual(['open', 'a', 'b', 'a', 'b']);
  });

  it('never repeats a move when noRepeat is set', () => {
    let s = startFight({ encounterId: 'random', deck: Array(10).fill('ward5') });
    let last = s.enemies[0].intent;
    for (let i = 0; i < 30; i++) {
      s = act(s, endTurn).state;
      expect(s.enemies[0].intent).not.toBe(last);
      last = s.enemies[0].intent;
    }
  });

  it('previews the real damage, including Weakened on the enemy', () => {
    const s = startFight({ encounterId: 'hitter' });
    expect(previewIntent(s, s.enemies[0], TEST_CONTENT)).toMatchObject({ kinds: ['attack'], damage: 10 });
    s.enemies[0].statuses.weakened = 1;
    expect(previewIntent(s, s.enemies[0], TEST_CONTENT).damage).toBe(
      Math.floor(10 * (1 - BALANCE.status.weakened.damageReduction)),
    );
  });
});
