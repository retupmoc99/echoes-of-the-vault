import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../data';
import { createRun } from '../run/run';
import { MIGRATIONS, newSave, type SaveData } from '../save/save';
import { addAwakening } from './awakening';
import { deedDone, deedStatus, requirementMet, tallyRun } from './deeds';
import { closeLoop } from './loop';
import { outpostStep } from './outpost';

const SOMNANT_DEED = 'you-hear-it-dreaming';

describe('deeds', () => {
  it('the Somnant’s deed is done once the Awakening reaches stage 3, and stays done', () => {
    let s = newSave(0);
    expect(deedDone(s, SOMNANT_DEED, CONTENT)).toBe(false);
    s = addAwakening(s, 45, CONTENT); // stage 3
    expect(deedDone(s, SOMNANT_DEED, CONTENT)).toBe(true);
    s = addAwakening(s, -40, CONTENT); // Lulled back down
    expect(s.world.awakening.stage).toBeLessThan(3);
    expect(deedDone(s, SOMNANT_DEED, CONTENT)).toBe(true);
    expect(deedStatus(newSave(0), CONTENT.deeds![SOMNANT_DEED], CONTENT)).toEqual({ done: false, progress: 0, goal: 3 });
  });

  it('the deed-gated Work stays hidden and unbuyable until the deed is done', () => {
    const rich: SaveData = { ...newSave(0), outpost: { ...newSave(0).outpost, shards: 1000 } };
    const hymnal = CONTENT.idle.unlocks.find((u) => u.id === 'sleepers-hymnal')!;
    expect(requirementMet(rich, hymnal.requires, CONTENT)).toBe(false);
    expect(outpostStep(rich, { type: 'buy', unlockId: 'sleepers-hymnal' }, 0, CONTENT).error).toBeDefined();
    expect(outpostStep(rich, { type: 'selectClass', classId: 'somnant' }, 0, CONTENT).error).toBeDefined();
    const ready = addAwakening(rich, 45, CONTENT);
    const bought = outpostStep(ready, { type: 'buy', unlockId: 'sleepers-hymnal' }, 0, CONTENT).save;
    expect(bought.outpost.unlocks).toContain('sleepers-hymnal');
    expect(outpostStep(bought, { type: 'selectClass', classId: 'somnant' }, 0, CONTENT).error).toBeUndefined();
  });

  it('closing a loop tallies curses carried, elites beaten and Shifts escaped', () => {
    const run = createRun({ seed: 'deed', classId: 'relic-breaker' }, CONTENT);
    run.deck.push('gnawing-static', 'hollow-echo');
    run.seenEncounters = ['lone-sentinel', 'warden-unmade', 'grieving-lock'];
    run.phase = 'ended';
    run.result = 'victory';
    const closed = closeLoop({ ...newSave(0), run }, CONTENT, 1);
    expect(closed.deeds.maxCursesCarried).toBe(2);
    expect(closed.deeds.elitesBeaten).toEqual(['warden-unmade']);
    expect(closed.deeds.shiftsEscaped).toEqual([run.vaultShiftId]);
  });

  it('the fight a death ended in does not count as beaten', () => {
    const run = createRun({ seed: 'deed2', classId: 'relic-breaker' }, CONTENT);
    const node = run.map.nodes[run.map.startIds[0]];
    node.type = 'elite';
    run.visited = [node.id];
    run.position = node.id;
    run.seenEncounters = ['warden-unmade'];
    run.result = 'death';
    expect(tallyRun(newSave(0).deeds, run, CONTENT).elitesBeaten).toEqual([]);
  });

  it('the v11 → v12 migration credits what History already shows', () => {
    const v11 = {
      ...newSave(0),
      version: 11,
      deeds: undefined,
      world: { ...newSave(0).world, awakening: { stage: 1, progress: 12, cycle: 2, lullsThisStage: 0 } },
      meta: {
        loops: 2,
        victories: 1,
        deaths: 1,
        history: [
          { result: 'victory', vaultShiftId: 'still-vault', deck: ['gnawing-static'] },
          { result: 'death', vaultShiftId: 'drowned-halls', deck: ['gnawing-static', 'hollow-echo', 'leaden-thought'] },
        ],
      },
    };
    const v12 = MIGRATIONS[11](v11);
    expect(v12.version).toBe(12);
    expect(v12.deeds).toEqual({ peakAwakening: 5, maxCursesCarried: 3, elitesBeaten: [], shiftsEscaped: ['still-vault'], deepEscapes: 0 });
  });
});
