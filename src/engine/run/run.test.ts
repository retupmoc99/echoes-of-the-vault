import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { CONTENT } from '../../data';
import type { CombatAction, NodeType, RunAction, RunState } from '../types';
import { optionAvailable } from './events';
import { createRun, reachableNodes, stepRun } from './run';

const newRun = (seed = 'run-test') => createRun({ seed, classId: 'relic-breaker' }, CONTENT);
const go = (run: RunState, action: RunAction) => {
  const res = stepRun(run, action, CONTENT);
  if (res.error) throw new Error(res.error);
  return res.run;
};

/** Force the first start node to a given type, then step onto it. */
function enter(type: NodeType, run = newRun()): RunState {
  const r = structuredClone(run);
  const id = reachableNodes(r.map, r.position)[0];
  r.map.nodes[id].type = type;
  return go(r, { type: 'chooseNode', nodeId: id });
}

/** End the current fight by fiat (combat itself is tested elsewhere). */
function finishFight(run: RunState, outcome: 'won' | 'lost', hp = run.hp - 10): RunState {
  const r = structuredClone(run);
  r.combat!.phase = outcome;
  r.hp = outcome === 'lost' ? 0 : hp;
  return r;
}

describe('starting a loop', () => {
  it('begins on the map with the class starter kit', () => {
    const r = newRun();
    expect(r.phase).toBe('map');
    expect(r.deck).toEqual(CONTENT.classes['relic-breaker'].starterDeck);
    expect(r.relics).toEqual(['cinder-core']);
    expect(r.hp).toBe(r.maxHp);
    expect(reachableNodes(r.map, r.position)).toEqual(r.map.startIds);
  });

  it('is deterministic for a seed', () => {
    const a = go(newRun('x'), { type: 'chooseNode', nodeId: newRun('x').map.startIds[0] });
    const b = go(newRun('x'), { type: 'chooseNode', nodeId: newRun('x').map.startIds[0] });
    expect(a).toEqual(b);
  });
});

describe('moving on the map', () => {
  it('refuses unreachable nodes and leaves the run untouched', () => {
    const r = newRun();
    const res = stepRun(r, { type: 'chooseNode', nodeId: r.map.bossId }, CONTENT);
    expect(res.error).toBeDefined();
    expect(res.run).toBe(r);
  });

  it('starts an early fight carrying run HP, deck and relics into combat', () => {
    const r = enter('fight', { ...newRun(), hp: 50 });
    expect(r.phase).toBe('node');
    expect(r.combat?.player.hp).toBe(50);
    expect(r.combat?.relics.map((x) => x.relicId)).toEqual(['cinder-core']);
    const enc = CONTENT.encounters[(r.node as { encounterId: string }).encounterId];
    expect(enc).toMatchObject({ tier: 'normal', stage: 'early' });
  });

  it('uses the late pool deep in the map, and elite/boss pools on those nodes', () => {
    const r = structuredClone(newRun());
    const lateNode = Object.values(r.map.nodes).find((n) => n.row === BALANCE.map.lateStageFromRow)!;
    lateNode.type = 'fight';
    r.map.startIds = [lateNode.id];
    const fought = go(r, { type: 'chooseNode', nodeId: lateNode.id });
    expect(CONTENT.encounters[(fought.node as { encounterId: string }).encounterId].stage).toBe('late');

    const elite = enter('elite');
    expect(CONTENT.encounters[(elite.node as { encounterId: string }).encounterId].tier).toBe('elite');
  });

  it('cannot wander off mid-fight', () => {
    const r = enter('fight');
    expect(stepRun(r, { type: 'chooseNode', nodeId: r.map.startIds[1] }, CONTENT).error).toBeDefined();
    expect(stepRun(r, { type: 'leave' }, CONTENT).error).toMatch(/not over/);
  });
});

describe('fights', () => {
  it('a won fight records damage and offers a card reward', () => {
    const r = go(finishFight(enter('fight'), 'won', 60), { type: 'leave' });
    expect(r.hp).toBe(60);
    expect(r.stats).toMatchObject({ fightsWon: 1, damageTaken: 10 });
    expect(r.combat).toBeNull();
    expect(r.node).toMatchObject({ kind: 'reward', relicId: null, cardTaken: false });
  });

  it('picking a reward card adds it and returns to the map', () => {
    const r = go(finishFight(enter('fight'), 'won'), { type: 'leave' });
    const offered = (r.node as { cards: string[] }).cards;
    const after = go(r, { type: 'pickCard', choice: 1 });
    expect(after.deck).toEqual([...r.deck, offered[1]]);
    expect(after.phase).toBe('map');
  });

  it('skipping a reward changes nothing but the position', () => {
    const r = go(finishFight(enter('fight'), 'won'), { type: 'leave' });
    const after = go(r, { type: 'leave' });
    expect(after.deck).toEqual(r.deck);
    expect(after.phase).toBe('map');
  });

  it('a lost fight ends the loop in death', () => {
    const r = go(finishFight(enter('fight'), 'lost'), { type: 'leave' });
    expect(r).toMatchObject({ phase: 'ended', result: 'death' });
    expect(stepRun(r, { type: 'abandon' }, CONTENT).error).toBeDefined();
  });

  it('beating the boss ends the loop in victory', () => {
    const r = go(finishFight(enter('boss'), 'won'), { type: 'leave' });
    expect(r).toMatchObject({ phase: 'ended', result: 'victory', stats: { bossWon: true } });
  });

  it('elite wins are counted and also drop a clean relic', () => {
    const r = go(finishFight(enter('elite'), 'won'), { type: 'leave' });
    expect(r.stats.elitesWon).toBe(1);
    const relicId = (r.node as { relicId: string }).relicId;
    expect(CONTENT.relics[relicId].corruption).toBeUndefined();

    // Both the card and the relic must be resolved before returning to the map.
    const tookRelic = go(r, { type: 'takeRelic' });
    expect(tookRelic.phase).toBe('node');
    const done = go(tookRelic, { type: 'pickCard', choice: 0 });
    expect(done.phase).toBe('map');
    expect(done.relics).toContain(relicId);
  });
});

describe('shrines and caches', () => {
  it('resting heals a fraction of max HP, capped', () => {
    const hurt = { ...newRun(), hp: 10, vaultShiftId: 'still-vault' };
    const rested = go(enter('shrine', hurt), { type: 'shrineRest' });
    expect(rested.hp).toBe(10 + Math.round(rested.maxHp * BALANCE.shrine.healRatio));
    expect(rested.phase).toBe('map');

    const full = go(enter('shrine'), { type: 'shrineRest' });
    expect(full.hp).toBe(full.maxHp);
  });

  it('removing a card thins the deck, but not below the minimum', () => {
    const r = go(enter('shrine'), { type: 'shrineRemove', deckIndex: 0 });
    expect(r.deck).toHaveLength(9);
    expect(r.stats.cardsRemoved).toBe(1);

    const thin = { ...newRun(), deck: Array(BALANCE.shrine.minDeckSize).fill('shard-strike') };
    expect(stepRun(enter('shrine', thin), { type: 'shrineRemove', deckIndex: 0 }, CONTENT).error).toBeDefined();
  });

  it('a cache offers distinct unowned class relics; you take one', () => {
    const r = enter('cache');
    const offered = (r.node as { relicIds: string[] }).relicIds;
    expect(offered).toHaveLength(BALANCE.rewards.cacheRelicChoices);
    expect(new Set(offered).size).toBe(offered.length);
    for (const id of offered) expect(CONTENT.classes['relic-breaker'].relicPool).toContain(id);
    expect(go(r, { type: 'takeRelic', index: 1 }).relics).toEqual(['cinder-core', offered[1]]);
  });

  it('taking a tainted relic adds its Corruption', () => {
    const r = structuredClone(enter('cache', { ...newRun(), vaultShiftId: 'still-vault' }));
    (r.node as { relicIds: string[] }).relicIds = ['hungering-eye'];
    expect(go(r, { type: 'takeRelic', index: 0 }).corruption).toBe(CONTENT.relics['hungering-eye'].corruption);
  });

  it('an empty cache can only be left', () => {
    const r = enter('cache', { ...newRun(), relics: ['cinder-core', ...CONTENT.classes['relic-breaker'].relicPool] });
    expect(stepRun(r, { type: 'takeRelic', index: 0 }, CONTENT).error).toBeDefined();
    expect(go(r, { type: 'leave' }).phase).toBe('map');
  });
});

describe('a whole loop, played by a simple bot', () => {
  /** Plays a full loop: first path, first affordable card, rest at shrines. */
  function botPlay(seed: string, reload = false): RunState {
    let r = newRun(seed);
    for (let i = 0; i < 5000 && r.phase !== 'ended'; i++) {
      r = go(r, nextBotAction(r));
      if (reload) r = JSON.parse(JSON.stringify(r));
    }
    return r;
  }

  function nextBotAction(r: RunState): RunAction {
    if (r.phase === 'map') return { type: 'chooseNode', nodeId: reachableNodes(r.map, r.position)[0] };
    const node = r.node!;
    if (node.kind === 'shrine') return { type: 'shrineRest' };
    if (node.kind === 'cache') return node.relicIds.length ? { type: 'takeRelic', index: 0 } : { type: 'leave' };
    if (node.kind === 'reward') return node.cardTaken ? { type: 'leave' } : { type: 'pickCard', choice: 0 };
    if (node.kind === 'event') {
      if (node.resolved) return { type: 'leave' };
      const options = CONTENT.events[node.eventId].options;
      return { type: 'chooseOption', index: options.findIndex((o) => optionAvailable(r, o)) };
    }
    const c = r.combat!;
    if (c.phase !== 'player') return { type: 'leave' };
    const card = c.piles.hand.find((h) => {
      const def = CONTENT.cards[h.cardId];
      return !def.unplayable && def.cost <= c.resonance;
    });
    const action: CombatAction = card ? { type: 'playCard', uid: card.uid } : { type: 'endTurn' };
    return { type: 'combat', action };
  }

  it('always reaches an ending, visiting one node per row', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const r = botPlay(seed);
      expect(r.phase).toBe('ended');
      expect(r.result).not.toBeNull();
      const rows = r.visited.map((id) => r.map.nodes[id].row);
      expect(rows).toEqual(rows.map((_, i) => i));
    }
  });

  it('saving and reloading after every action gives the same loop', () => {
    expect(botPlay('reload', true)).toEqual(botPlay('reload'));
  });
});

describe('abandoning', () => {
  it('ends the loop as a death and marks it abandoned', () => {
    const r = go(enter('fight'), { type: 'abandon' });
    expect(r).toMatchObject({ phase: 'ended', result: 'death', stats: { abandoned: true } });
  });
});
