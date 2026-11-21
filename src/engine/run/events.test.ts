import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { CONTENT } from '../../data';
import type { RunState } from '../types';
import { optionAvailable } from './events';
import { createRun, reachableNodes, stepRun } from './run';

/** A calm run standing in the given event. */
function inEvent(eventId: string, patch: Partial<RunState> = {}): RunState {
  const r = structuredClone({ ...createRun({ seed: 'ev', classId: 'relic-breaker', vaultShiftId: 'still-vault' }, CONTENT), ...patch });
  const id = reachableNodes(r.map, null)[0];
  r.map.nodes[id].type = 'event';
  const res = stepRun(r, { type: 'chooseNode', nodeId: id }, CONTENT);
  const entered = res.run;
  (entered.node as { eventId: string }).eventId = eventId;
  return entered;
}

const choose = (r: RunState, index: number) => stepRun(r, { type: 'chooseOption', index }, CONTENT);

describe('events', () => {
  it('every event has 2+ options, and every option has a hint and outcomes', () => {
    for (const ev of Object.values(CONTENT.events)) {
      expect(ev.options.length, ev.id).toBeGreaterThanOrEqual(2);
      for (const o of ev.options) {
        expect(o.hint).not.toBe('');
        expect(o.outcomes.length).toBeGreaterThan(0);
      }
    }
  });

  it('entering an event node picks a real event and records it as seen', () => {
    const r = inEvent('weeping-font');
    expect(r.node).toMatchObject({ kind: 'event', resolved: null });
    expect(r.seenEvents).toHaveLength(1);
  });

  it('applies the chosen option and shows its outcome text', () => {
    const r = inEvent('weeping-font', { hp: 30 });
    const { run, notices } = choose(r, 0);
    expect(run.hp).toBe(48);
    expect(run.corruption).toBe(2);
    expect(run.node).toMatchObject({ resolved: { optionIndex: 0 } });
    expect(notices).toEqual([]);
    expect(choose(run, 1).error).toBeDefined(); // only one choice per event
  });

  it('disables options you cannot afford instead of killing you', () => {
    const r = inEvent('tithe-collector', { hp: 12 });
    const flesh = CONTENT.events['tithe-collector'].options[0];
    expect(optionAvailable(r, flesh)).toBe(false);
    expect(choose(r, 0).error).toMatch(/price/);
  });

  it('memory payments respect the minimum deck size', () => {
    const r = inEvent('tithe-collector', { deck: Array(BALANCE.shrine.minDeckSize + 1).fill('shard-strike') });
    expect(optionAvailable(r, CONTENT.events['tithe-collector'].options[1])).toBe(false);
  });

  it('reports curses and new cards as notices', () => {
    const r = inEvent('hall-of-sleepers');
    const { run, notices } = choose(r, 0);
    expect(run.deck.length).toBe(r.deck.length + 2);
    expect(notices.some((n) => n.startsWith('A curse takes root'))).toBe(true);
  });

  it('random outcomes are seeded: same run, same result', () => {
    const a = choose(inEvent('remembering-mirror'), 0).run;
    const b = choose(inEvent('remembering-mirror'), 0).run;
    expect(a.deck).toEqual(b.deck);
  });

  it('leaving after resolving returns to the map', () => {
    const r = choose(inEvent('weeping-font'), 2).run;
    expect(stepRun(r, { type: 'leave' }, CONTENT).run.phase).toBe('map');
  });
});
