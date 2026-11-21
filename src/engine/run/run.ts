/**
 * The run (one loop): walk the map, resolve nodes, fight, reach the boss.
 *
 *   map ──chooseNode──▶ node ──(resolve)──▶ map … ──boss won / death──▶ ended
 *   fight won ──leave──▶ reward ──pick/skip──▶ map
 *
 * Same pattern as combat: stepRun(run, action) clones, mutates the clone,
 * and returns it. Each fight gets its own seed derived from the run seed and
 * node id, so a fight is reproducible no matter what happened before it.
 */
import { BALANCE } from '../../data/balance';
import { createCombat, step } from '../combat/combat';
import { createRng, rngPick, rngWeighted } from '../rng';
import type {
  CombatAction,
  CombatEvent,
  Content,
  EncounterDef,
  MapNode,
  NodeType,
  RunAction,
  RunSetup,
  RunState,
  RunStepResult,
  VaultShiftDef,
} from '../types';
import { addCorruption, combatModifiersFor } from './corruption';
import { pickEvent, resolveOption } from './events';
import { generateMap, reachableNodes, type MapConfig } from './map';
import { rollCardReward, rollRelics } from './rewards';

export function createRun(setup: RunSetup, content: Content): RunState {
  const cls = content.classes[setup.classId];
  if (!cls) throw new Error(`Unknown class: ${setup.classId}`);
  const rng = createRng(setup.seed);

  // Roll the Shift first: it can reshape the map.
  const shift = setup.vaultShiftId ? content.vaultShifts[setup.vaultShiftId] : rollVaultShift(rng, content);
  if (!shift) throw new Error(`Unknown Vault Shift: ${setup.vaultShiftId}`);
  const kit = cls.kits.find((k) => k.id === setup.kitId) ?? cls.kits[0];
  const unlocked = setup.unlockedCards ?? [];

  const run: RunState = {
    seed: setup.seed,
    classId: cls.id,
    floor: 1,
    rng,
    hp: cls.maxHp,
    maxHp: cls.maxHp,
    deck: [...kit.deck],
    relics: [...cls.starterRelics],
    map: generateMap(rng, mapConfigFor(shift)),
    position: null,
    visited: [],
    phase: 'map',
    node: null,
    combat: null,
    seenEncounters: [],
    seenEvents: [],
    corruption: 0,
    vaultShiftId: shift.id,
    awakeningStage: setup.awakeningStage ?? 0,
    shardsFound: 0,
    cardPool: cls.cardPool.filter((id) => !cls.lockedCards.includes(id) || unlocked.includes(id)),
    options: {
      shrinePurge: false,
      cacheChoices: BALANCE.rewards.cacheRelicChoices,
      rewardRerolls: 0,
      ...setup.options,
    },
    stats: {
      fightsWon: 0,
      elitesWon: 0,
      bossWon: false,
      damageTaken: 0,
      turns: 0,
      cardsRemoved: 0,
      abandoned: false,
      peakCorruption: 0,
      cursesGained: 0,
    },
    result: null,
  };
  addCorruption(run, shift.mods.startCorruption ?? 0, content, []);
  return run;
}

function rollVaultShift(rng: RunState['rng'], content: Content): VaultShiftDef {
  const weights: Record<string, number> = {};
  for (const s of Object.values(content.vaultShifts)) weights[s.id] = s.weight;
  return content.vaultShifts[rngWeighted(rng, weights)];
}

function mapConfigFor(shift: VaultShiftDef): MapConfig {
  const weights: MapConfig['weights'] = { ...BALANCE.map.weights };
  for (const [type, mult] of Object.entries(shift.mods.nodeWeights ?? {}) as [keyof typeof weights, number][]) {
    weights[type] = Math.round(weights[type] * mult);
  }
  return { ...BALANCE.map, weights };
}

export function stepRun(run: RunState, action: RunAction, content: Content): RunStepResult {
  if (run.phase === 'ended') return { run, events: [], notices: [], error: 'This loop has ended.' };

  const r = structuredClone(run);
  const events: CombatEvent[] = [];
  const notices: string[] = [];
  const error = apply(r, action, content, events, notices);
  if (error) return { run, events: [], notices: [], error };
  return { run: r, events, notices };
}

function apply(r: RunState, action: RunAction, content: Content, events: CombatEvent[], notices: string[]): string | undefined {
  switch (action.type) {
    case 'chooseNode':
      return chooseNode(r, action.nodeId, content, events);
    case 'combat':
      return combatAction(r, action.action, content, events);
    case 'shrineRest': {
      if (r.node?.kind !== 'shrine') return 'There is no shrine here.';
      r.hp = Math.min(r.maxHp, r.hp + shrineHeal(r, content));
      backToMap(r);
      return undefined;
    }
    case 'shrinePurge':
      if (r.node?.kind !== 'shrine') return 'There is no shrine here.';
      if (!r.options.shrinePurge) return 'This shrine has no ash to give.';
      if (r.corruption === 0) return 'There is nothing to purge.';
      addCorruption(r, -BALANCE.outpost.purgeAmount, content, notices);
      backToMap(r);
      return undefined;
    case 'rerollReward': {
      const node = r.node;
      if (node?.kind !== 'reward' || node.cardTaken) return 'There is nothing to reroll.';
      if (r.options.rewardRerolls <= 0) return 'Your second sight is spent.';
      r.options.rewardRerolls--;
      const tier = node.relicId ? 'elite' : 'normal';
      Object.assign(node, rollCardReward(r, content, tier));
      return undefined;
    }
    case 'shrineRemove':
      if (r.node?.kind !== 'shrine') return 'There is no shrine here.';
      if (r.deck.length <= BALANCE.shrine.minDeckSize) return 'Your deck is already thin.';
      if (!r.deck[action.deckIndex]) return 'No such card.';
      r.deck.splice(action.deckIndex, 1);
      r.stats.cardsRemoved++;
      backToMap(r);
      return undefined;
    case 'takeRelic':
      return takeRelic(r, action.index ?? 0, content, notices);
    case 'pickCard':
      return pickCard(r, action.choice, content, notices);
    case 'chooseOption':
      return resolveOption(r, action.index, content, notices);
    case 'leave':
      return leave(r, content);
    case 'abandon':
      r.stats.abandoned = true;
      endRun(r, 'death');
      return undefined;
  }
}

/** HP restored by resting at a Shrine (the Vault Shift may reduce it). */
export function shrineHeal(r: RunState, content: Content): number {
  const mult = content.vaultShifts[r.vaultShiftId]?.mods.shrineHealMult ?? 1;
  return Math.round(r.maxHp * BALANCE.shrine.healRatio * mult);
}

// ───────────────────────────── Map movement ─────────────────────────────

function chooseNode(r: RunState, nodeId: string, content: Content, events: CombatEvent[]): string | undefined {
  if (r.phase !== 'map') return 'Finish what is in front of you first.';
  if (!reachableNodes(r.map, r.position).includes(nodeId)) return 'That path is not open to you.';

  const node = r.map.nodes[nodeId];
  r.position = nodeId;
  r.visited.push(nodeId);
  r.phase = 'node';

  switch (node.type) {
    case 'fight':
    case 'elite':
    case 'boss':
      startFight(r, node, content, events);
      return undefined;
    case 'shrine':
      r.node = { kind: 'shrine', nodeId };
      return undefined;
    case 'cache':
      r.node = { kind: 'cache', nodeId, relicIds: rollRelics(r, content, r.options.cacheChoices, { allowTainted: true }) };
      return undefined;
    case 'event': {
      const eventId = pickEvent(r, node.row, content);
      r.seenEvents.push(eventId);
      r.node = { kind: 'event', nodeId, eventId, resolved: null };
      return undefined;
    }
  }
}

function encounterPool(node: MapNode, awakeningStage: number, content: Content): EncounterDef[] {
  // Awakening-gated encounters join at their stage and push out the ones they replace.
  const usable = Object.values(content.encounters).filter((e) => (e.minAwakening ?? 0) <= awakeningStage);
  const replaced = new Set(usable.map((e) => e.replaces).filter(Boolean));
  const all = usable.filter((e) => !replaced.has(e.id));
  const tier = ({ fight: 'normal', elite: 'elite', boss: 'boss' } as Partial<Record<NodeType, string>>)[node.type];
  if (tier !== 'normal') return all.filter((e) => e.tier === tier);
  const stage = node.row >= BALANCE.map.lateStageFromRow ? 'late' : 'early';
  return all.filter((e) => e.tier === 'normal' && (e.stage ?? 'early') === stage);
}

function startFight(r: RunState, node: MapNode, content: Content, events: CombatEvent[]): void {
  const pool = encounterPool(node, r.awakeningStage, content);
  // Prefer encounters not yet seen this loop, so fights don't repeat.
  const fresh = pool.filter((e) => !r.seenEncounters.includes(e.id));
  const encounter = rngPick(r.rng, fresh.length ? fresh : pool);
  r.seenEncounters.push(encounter.id);

  // Awakening stage 3+: elites carry a random affix. (Rolled only then, so
  // loops at lower stages keep exactly the same random sequence.)
  const affixes = Object.values(content.awakening.affixes);
  const affix =
    node.type === 'elite' && r.awakeningStage >= 3 && affixes.length ? rngPick(r.rng, affixes) : undefined;

  const created = createCombat(
    {
      seed: `${r.seed}:${node.id}`,
      deck: r.deck,
      hp: r.hp,
      maxHp: r.maxHp,
      relics: r.relics,
      encounterId: encounter.id,
      modifiers: combatModifiersFor(r, content),
      affix,
    },
    content,
  );
  r.combat = created.state;
  r.node = { kind: 'combat', nodeId: node.id, encounterId: encounter.id, hpBefore: r.hp };
  events.push(...created.events);
}

// ───────────────────────────── Inside a node ─────────────────────────────

function combatAction(r: RunState, action: CombatAction, content: Content, events: CombatEvent[]): string | undefined {
  if (r.node?.kind !== 'combat' || !r.combat) return 'There is no fight here.';
  const result = step(r.combat, action, content);
  if (result.error) return result.error;
  r.combat = result.state;
  r.hp = Math.max(0, result.state.player.hp);
  events.push(...result.events);
  return undefined;
}

function pickCard(r: RunState, choice: number | 'tainted', content: Content, notices: string[]): string | undefined {
  const node = r.node;
  if (node?.kind !== 'reward') return 'There is nothing to take.';
  if (node.cardTaken) return 'You already chose.';

  if (choice === 'tainted') {
    if (!node.tainted) return 'Nothing tainted is offered.';
    r.deck.push(node.tainted);
    addCorruption(r, BALANCE.corruption.taintedCardCost, content, notices);
  } else {
    const cardId = node.cards[choice];
    if (!cardId) return 'No such card.';
    r.deck.push(cardId);
  }
  node.cardTaken = true;
  if (!node.relicId || node.relicTaken) backToMap(r);
  return undefined;
}

function takeRelic(r: RunState, index: number, content: Content, notices: string[]): string | undefined {
  const node = r.node;
  let relicId: string | undefined;
  if (node?.kind === 'cache') relicId = node.relicIds[index];
  else if (node?.kind === 'reward' && !node.relicTaken) relicId = node.relicId ?? undefined;
  if (!relicId) return 'Nothing to take.';

  r.relics.push(relicId);
  addCorruption(r, content.relics[relicId].corruption ?? 0, content, notices);

  if (node?.kind === 'reward') {
    node.relicTaken = true;
    if (node.cardTaken) backToMap(r);
  } else backToMap(r);
  return undefined;
}

function leave(r: RunState, content: Content): string | undefined {
  const node = r.node;
  if (!node) return 'You are not in a chamber.';

  if (node.kind === 'combat') {
    const combat = r.combat!;
    if (combat.phase !== 'won' && combat.phase !== 'lost') return 'The fight is not over.';
    r.stats.damageTaken += Math.max(0, node.hpBefore - r.hp);
    r.stats.turns += combat.turn;
    if (combat.phase === 'lost') return void endRun(r, 'death');

    const type = r.map.nodes[node.nodeId].type;
    r.stats.fightsWon++;
    if (type === 'elite') {
      r.stats.elitesWon++;
      if (r.awakeningStage >= 3) r.shardsFound += BALANCE.awakening.eliteShards;
    }
    if (type === 'boss') {
      r.stats.bossWon = true;
      return void endRun(r, 'victory');
    }
    // Spoils: pick a card (elites also drop a relic).
    const tier = type === 'elite' ? 'elite' : 'normal';
    const { cards, tainted } = rollCardReward(r, content, tier);
    const relicId = tier === 'elite' ? (rollRelics(r, content, 1, { allowTainted: false })[0] ?? null) : null;
    r.combat = null;
    r.node = { kind: 'reward', nodeId: node.nodeId, cards, tainted, relicId, cardTaken: false, relicTaken: false };
    return undefined;
  }

  backToMap(r);
  return undefined;
}

function backToMap(r: RunState): void {
  r.phase = 'map';
  r.node = null;
  r.combat = null;
}

function endRun(r: RunState, result: 'victory' | 'death'): void {
  r.phase = 'ended';
  r.result = result;
  r.node = null;
  r.combat = null;
}

export { reachableNodes };
