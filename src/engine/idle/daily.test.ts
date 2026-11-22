import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../data';
import { BALANCE } from '../../data/balance';
import { createRun, stepRun } from '../run/run';
import { newSave, type SaveData } from '../save/save';
import { closeLoop } from './loop';
import { dailySetup, dayKey, omenForDay, startDaily } from './daily';
import { outpostStep } from './outpost';

const T0 = new Date(2026, 10, 22, 9, 0).getTime(); // 22 Nov 2026, 09:00 local
const DAY = '2026-11-22';

function endRun(save: SaveData, result: 'victory' | 'death'): SaveData {
  const run = structuredClone(save.run!);
  run.phase = 'ended';
  run.result = result;
  return { ...save, run };
}

describe('Daily Descent', () => {
  it('uses the local calendar day', () => {
    expect(dayKey(T0)).toBe(DAY);
    expect(dayKey(new Date(2026, 10, 22, 23, 59).getTime())).toBe(DAY);
  });

  it('rotates the Omens one per day, with no repeat until all have come round', () => {
    const n = Object.keys(CONTENT.omens!).length;
    const days = Array.from({ length: n }, (_, i) => dayKey(new Date(2026, 10, 22 + i, 12).getTime()));
    const ids = days.map((d) => omenForDay(d, CONTENT).id);
    expect(new Set(ids).size).toBe(n);
    expect(omenForDay(dayKey(new Date(2026, 10, 22 + n, 12).getTime()), CONTENT).id).toBe(ids[0]);
  });

  it('is the same loop for two very different players', () => {
    const fresh = newSave(T0);
    const veteran: SaveData = {
      ...newSave(T0 - 1e9),
      outpost: { ...newSave(T0).outpost, cards: ['scar-tissue'], unlocks: ['kit-bastion', 'reliquary-key'], kitId: 'bastion' },
      world: { ...newSave(T0).world, awakening: { stage: 4, progress: 80, cycle: 3, lullsThisStage: 0 } },
    };
    const a = createRun(dailySetup(fresh, DAY, CONTENT), CONTENT);
    const b = createRun(dailySetup(veteran, DAY, CONTENT), CONTENT);
    expect(b.map).toEqual(a.map);
    expect(b.vaultShiftId).toBe(a.vaultShiftId);
    expect(b.deck).toEqual(a.deck);
    expect(b.cardPool).toEqual(a.cardPool);
    expect(b.options).toEqual(a.options);
    expect(b.awakeningStage).toBe(0);
  });

  it('allows one try per day, and not while a loop is running', () => {
    const s = newSave(T0);
    const started = startDaily(s, T0, CONTENT) as SaveData;
    expect(started.run?.daily).toBe(DAY);
    expect(started.daily.daysPlayed).toBe(1);
    expect(typeof startDaily(started, T0, CONTENT)).toBe('string');
    const closed = closeLoop(endRun(started, 'death'), CONTENT, T0 + 1000);
    expect(typeof startDaily(closed, T0 + 2000, CONTENT)).toBe('string');
    expect(typeof startDaily(closed, T0 + 86_400_000, CONTENT)).not.toBe('string');
  });

  it('leaves no Echo, never moves the Awakening, and pays flat Shards', () => {
    const s = { ...newSave(T0), echoes: [] };
    const started = outpostStep(s, { type: 'startDaily' }, T0, CONTENT).save;
    const won = closeLoop(endRun(started, 'victory'), CONTENT, T0 + 1000);
    expect(won.echoes).toHaveLength(0);
    expect(won.pendingEcho).toBeNull();
    expect(won.world.awakening).toEqual(s.world.awakening);
    expect(won.meta.loops).toBe(0);
    expect(won.outpost.shards).toBe(BALANCE.daily.finishShards + BALANCE.daily.escapeShards);
    expect(won.daily).toMatchObject({ escapes: 1, daysPlayed: 1, last: { day: DAY, result: 'victory' } });
    expect(won.meta.history[0]).toMatchObject({ daily: DAY, omenId: omenForDay(DAY, CONTENT).id });
  });

  it('applies Omens: Glass Vault cuts max HP; Clockwork makes every card cost 1', () => {
    const base = { seed: 'omen-test', classId: 'relic-breaker' };
    const glass = createRun({ ...base, omenId: 'glass-vault' }, CONTENT);
    expect(glass.maxHp).toBe(Math.round(CONTENT.classes['relic-breaker'].maxHp * 0.8));

    let clock = createRun({ ...base, omenId: 'clockwork' }, CONTENT);
    const first = clock.map.startIds[0];
    clock = stepRun(clock, { type: 'chooseNode', nodeId: first }, CONTENT).run;
    expect(clock.combat?.modifiers.costOverride).toBe(1);
  });

  it('Crowded Halls adds a Choir Shard to normal fights; Long Night adds a row', () => {
    let crowded = createRun({ seed: 'omen-test', classId: 'relic-breaker', omenId: 'crowded-halls' }, CONTENT);
    crowded = stepRun(crowded, { type: 'chooseNode', nodeId: crowded.map.startIds[0] }, CONTENT).run;
    expect(crowded.combat!.enemies.at(-1)!.defId).toBe('choir-shard');

    const plain = createRun({ seed: 'omen-test', classId: 'relic-breaker' }, CONTENT);
    const night = createRun({ seed: 'omen-test', classId: 'relic-breaker', omenId: 'long-night' }, CONTENT);
    const bossRow = (r: typeof plain) => r.map.nodes[r.map.bossId].row;
    expect(bossRow(night)).toBe(bossRow(plain) + 1);
  });
});
