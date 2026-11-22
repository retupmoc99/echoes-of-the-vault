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
  OmenDef,
  Aspect,
  RunAction,
  RunSetup,
  RunState,
  RunStepResult,
  VaultShiftDef,
} from '../types';
import { addCorruption, addCurse, combatModifiersFor } from './corruption';
import { pickEvent, resolveOption } from './events';
import { generateMap, reachableNodes, type MapConfig } from './map';
import { rollCardReward, rollRelics } from './rewards';

export function createRun(setup: RunSetup, content: Content): RunState {
  const cls = content.classes[setup.classId];
  if (!cls) throw new Error(`Unknown class: ${setup.classId}`);
  const rng = createRng(setup.seed);

  // Roll the Shift first: it can reshape the map.
  const shift = setup.vaultShiftId ? content.vaultShifts[setup.vaultShiftId] : rollVaultShift(rng, content, setup.awakeningStage ?? 0);
  if (!shift) throw new Error(`Unknown Vault Shift: ${setup.vaultShiftId}`);
  const kit = cls.kits.find((k) => k.id === setup.kitId) ?? cls.kits[0];
  const unlocked = setup.unlockedCards ?? [];
  const omen = setup.omenId ? content.omens?.[setup.omenId] : undefined;
  if (setup.omenId && !omen) throw new Error(`Unknown Omen: ${setup.omenId}`);
  const maxHp = Math.round(cls.maxHp * (omen?.mods.maxHpMult ?? 1));

  const run: RunState = {
    seed: setup.seed,
    classId: cls.id,
    floor: 1,
    rng,
    hp: maxHp,
    maxHp,
    deck: [...kit.deck],
    relics: [...cls.starterRelics, ...(setup.extraRelics ?? [])],
    map: generateMap(rng, mapConfigFor(shift, omen)),
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
    awakeningCycle: setup.awakeningCycle ?? 1,
    chorus: (setup.chorus ?? []).map((m) => ({ ...m, calls: 0, falls: 0 })),
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
  if (setup.daily) run.daily = setup.daily;
  if (setup.extraRelicPool?.length) run.extraRelicPool = [...setup.extraRelicPool];
  if (omen) applyOmenStart(run, omen, content);
  addCorruption(run, shift.mods.startCorruption ?? 0, content, []);
  return run;
}

/** An Omen's starting gifts and debts (Daily Descent). */
function applyOmenStart(run: RunState, omen: OmenDef, content: Content): void {
  run.omenId = omen.id;
  const m = omen.mods;
  if (m.startRelics) run.relics.push(...rollRelics(run, content, m.startRelics, { allowTainted: false }));
  for (let i = 0; i < (m.startRares ?? 0); i++) {
    const rares = run.cardPool.filter((id) => content.cards[id].rarity === 'rare');
    if (rares.length) run.deck.push(rngPick(run.rng, rares));
  }
  addCorruption(run, m.startCorruption ?? 0, content, []);
}

/** The Omen in force for this loop, if any. */
export function omenOf(r: RunState, content: Content): OmenDef | undefined {
  return r.omenId ? content.omens?.[r.omenId] : undefined;
}

function rollVaultShift(rng: RunState['rng'], content: Content, awakeningStage: number): VaultShiftDef {
  const weights: Record<string, number> = {};
  for (const s of Object.values(content.vaultShifts)) if ((s.minAwakening ?? 0) <= awakeningStage) weights[s.id] = s.weight;
  return content.vaultShifts[rngWeighted(rng, weights)];
}

function mapConfigFor(shift: VaultShiftDef, omen?: OmenDef): MapConfig {
  const weights: MapConfig['weights'] = { ...BALANCE.map.weights };
  for (const mods of [shift.mods.nodeWeights, omen?.mods.nodeWeights]) {
    for (const [type, mult] of Object.entries(mods ?? {}) as [keyof typeof weights, number][]) {
      weights[type] = Math.round(weights[type] * mult);
    }
  }
  return { ...BALANCE.map, rows: BALANCE.map.rows + (omen?.mods.extraRows ?? 0), weights };
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
      // Second Sight's free rerolls first; then the Tollkeeper can pay Toll.
      if (r.options.rewardRerolls > 0) r.options.rewardRerolls--;
      else if ((r.toll ?? 0) >= BALANCE.toll.rerollCost) r.toll = (r.toll ?? 0) - BALANCE.toll.rerollCost;
      else return 'Your second sight is spent.';
      const tier = node.relicId ? 'elite' : 'normal';
      Object.assign(node, rollCardReward(r, content, tier));
      return undefined;
    }
    case 'shrineTithe': {
      if (r.node?.kind !== 'shrine') return 'There is no shrine here.';
      if ((r.toll ?? 0) < BALANCE.toll.titheCost) return 'Not enough Toll.';
      if (r.deck.length <= BALANCE.shrine.minDeckSize) return 'Your deck is already thin.';
      if (!r.deck[action.deckIndex]) return 'No such card.';
      r.toll = (r.toll ?? 0) - BALANCE.toll.titheCost;
      r.hp = Math.min(r.maxHp, r.hp + shrineHeal(r, content));
      r.deck.splice(action.deckIndex, 1);
      r.stats.cardsRemoved++;
      backToMap(r);
      return undefined;
    }
    case 'shrineSearch':
      if (r.node?.kind !== 'shrine') return 'There is no shrine here.';
      if (!canSearchShrine(r)) return 'Only the last shrines hide anything.';
      r.node = { kind: 'cache', nodeId: r.node.nodeId, relicIds: rollRelics(r, content, r.options.cacheChoices, { allowTainted: true }) };
      return undefined;
    case 'removeCard': {
      const node = r.node;
      if (node?.kind !== 'event' || !node.toRemove) return 'Nothing asks for a card.';
      if (!r.deck[action.deckIndex]) return 'No such card.';
      const [removed] = r.deck.splice(action.deckIndex, 1);
      r.stats.cardsRemoved++;
      node.toRemove--;
      notices.push(`${content.cards[removed].name} is gone.`);
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
    case 'escape':
      if (r.phase !== 'stairs') return 'There are no stairs here.';
      r.shardsFound += r.heldShards ?? 0;
      r.heldShards = 0;
      endRun(r, 'victory');
      return undefined;
    case 'descend':
      if (r.phase !== 'stairs') return 'There are no stairs here.';
      descend(r);
      return undefined;
    case 'abandon':
      r.stats.abandoned = true;
      endRun(r, 'death');
      return undefined;
  }
}

/** Shrines in the last row before the boss can be searched for a relic cache. */
export function canSearchShrine(r: RunState): boolean {
  if (r.node?.kind !== 'shrine') return false;
  return r.map.nodes[r.node.nodeId].row === r.map.nodes[r.map.bossId].row - 1;
}

/** HP restored by resting at a Shrine (the Vault Shift may reduce it). */
export function shrineHeal(r: RunState, content: Content): number {
  const mult = (content.vaultShifts[r.vaultShiftId]?.mods.shrineHealMult ?? 1) * (omenOf(r, content)?.mods.shrineHealMult ?? 1);
  return Math.round(r.maxHp * BALANCE.shrine.healRatio * mult);
}

// ───────────────────────────── Map movement ─────────────────────────────

function chooseNode(r: RunState, nodeId: string, content: Content, events: CombatEvent[]): string | undefined {
  if (r.phase !== 'map') return 'Finish what is in front of you first.';
  if (!reachableNodes(r.map, r.position).includes(nodeId)) return 'That path is not open to you.';

  const node = r.map.nodes[nodeId];
  r.position = nodeId;
  r.visited.push(nodeId);
  r.miles = (r.miles ?? 0) + milesFor(r, node, content);
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

/** Pilgrim: Miles for entering a node (elites give 2), plus relic bonuses. */
function milesFor(r: RunState, node: MapNode, content: Content): number {
  let n = node.type === 'elite' ? 2 : 1;
  for (const id of r.relics) {
    const m = content.relics[id]?.runMods;
    if (!m) continue;
    n += m.milesPerNode ?? 0;
    if (node.type === 'elite') n += m.milesPerElite ?? 0;
    if (r.floor > 1) n += m.milesDeep ?? 0;
  }
  return n;
}

/** Shiftwright: each fight starts in the Aspect matching the loop's Shift. */
const SHIFT_ASPECT: Record<string, Aspect> = { 'drowned-halls': 'drowned', 'fractured-sky': 'fractured', 'choir-awake': 'choir' };

function encounterPool(node: MapNode, awakeningStage: number, floor: number, content: Content): EncounterDef[] {
  // Awakening-gated encounters join at their stage and push out the ones they replace.
  const usable = Object.values(content.encounters).filter((e) => (e.minAwakening ?? 0) <= awakeningStage && (e.floor ?? 1) === floor);
  const replaced = new Set(usable.map((e) => e.replaces).filter(Boolean));
  const all = usable.filter((e) => !replaced.has(e.id));
  const tier = ({ fight: 'normal', elite: 'elite', boss: 'boss' } as Partial<Record<NodeType, string>>)[node.type];
  if (tier !== 'normal') return all.filter((e) => e.tier === tier);
  // Floor 2 has a single pool of normal fights.
  if (floor > 1) return all.filter((e) => e.tier === 'normal');
  const stage = node.row >= BALANCE.map.lateStageFromRow ? 'late' : 'early';
  return all.filter((e) => e.tier === 'normal' && (e.stage ?? 'early') === stage);
}

/** What the Warden carries into each fight: Aspect, Miles, Toll. */
function wardenResources(r: RunState, content: Content): { aspect?: Aspect; miles?: number; toll?: number } {
  const res = content.classes[r.classId]?.resource;
  if (res === 'aspect') return { aspect: SHIFT_ASPECT[r.vaultShiftId] ?? 'drowned' };
  if (res === 'miles') return { miles: r.miles ?? 0 };
  if (res === 'toll') return { toll: r.toll ?? 0 };
  return {};
}

/** Omen: Crowded Halls adds an enemy to every normal fight. */
function extraEnemiesFor(r: RunState, node: MapNode, content: Content): string[] | undefined {
  const extra = omenOf(r, content)?.mods.extraEnemy;
  return node.type === 'fight' && extra ? [extra] : undefined;
}

function startFight(r: RunState, node: MapNode, content: Content, events: CombatEvent[]): void {
  const pool = encounterPool(node, r.awakeningStage, r.floor, content);
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
      // Enemies fought before this one, for an enemy that remembers (the Sleeper).
      memories: r.seenEncounters.slice(0, -1).flatMap((id) => content.encounters[id]?.enemies ?? []),
      chorus: r.chorus,
      extraEnemies: extraEnemiesFor(r, node, content),
      ...wardenResources(r, content),
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
    // The Sin-Eater pays for tainted cards in curses (its food), not Corruption.
    if (content.classes[r.classId]?.taintedGivesCurse) addCurse(r, content, notices);
    else addCorruption(r, BALANCE.corruption.taintedCardCost, content, notices);
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
    // Back to the run: Miles gained and Toll held; curses Absolution removed for good.
    if (combat.milesGained) r.miles = (r.miles ?? 0) + combat.milesGained;
    if (combat.toll !== undefined) r.toll = combat.toll;
    for (const id of combat.purged ?? []) {
      const i = r.deck.indexOf(id);
      if (i >= 0) r.deck.splice(i, 1);
    }
    r.stats.damageTaken += Math.max(0, node.hpBefore - r.hp);
    r.stats.turns += combat.turn;
    // Echo-Caller: tally this fight's Calls and falls; they cost stability when the loop closes.
    for (const m of r.chorus ?? []) {
      m.calls += (combat.called ?? []).filter((id) => id === m.echoId).length;
      m.falls += (combat.fallen ?? []).filter((id) => id === m.echoId).length;
    }
    if (combat.phase === 'lost') return void endRun(r, 'death');

    const type = r.map.nodes[node.nodeId].type;
    r.stats.fightsWon++;
    if (type === 'elite') {
      r.stats.elitesWon++;
      if (r.awakeningStage >= 3) r.shardsFound += BALANCE.awakening.eliteShards;
    }
    if (type === 'boss' && r.floor > 1) {
      // Out of the depths: the held bonus doubles, plus the floor's own reward.
      r.stats.deepBossWon = true;
      r.shardsFound += (r.heldShards ?? 0) * 2 + BALANCE.deep.escapeShards;
      r.heldShards = 0;
      return void endRun(r, 'victory');
    }
    if (type === 'boss') {
      r.stats.bossWon = true;
      if (node.encounterId === 'the-sleeper') r.stats.sleeperUnmade = true;
      // Awakening stage 4+: escaping banks Shards (stage 5's Sleeper pays out at the Outpost).
      const bonus = r.awakeningStage >= 4 && node.encounterId !== 'the-sleeper' ? BALANCE.awakening.escapeShards : 0;
      if (!r.options.stairs) {
        r.shardsFound += bonus;
        return void endRun(r, 'victory');
      }
      // The Deeper Vault: Escape now, or Descend with the bonus held.
      r.heldShards = bonus;
      r.phase = 'stairs';
      r.node = null;
      r.combat = null;
      return undefined;
    }
    if (type === 'elite' && r.floor > 1) r.shardsFound += BALANCE.deep.eliteShards;
    // Spoils: pick a card (elites also drop a relic).
    const omen = omenOf(r, content);
    if (omen?.mods.healAfterFight) r.hp = Math.min(r.maxHp, r.hp + omen.mods.healAfterFight);
    const tier = type === 'elite' ? 'elite' : 'normal';
    // Floor 2's normal fights roll with elite odds.
    const odds = r.floor > 1 ? 'elite' : tier;
    const { cards, tainted } = omen?.mods.noCardRewards ? { cards: [], tainted: null } : rollCardReward(r, content, odds);
    const relicId = tier === 'elite' ? (rollRelics(r, content, 1, { allowTainted: false })[0] ?? null) : null;
    r.combat = null;
    // Omen: Ascetic. With nothing to take, go straight back to the map.
    if (!cards.length && !relicId) return void backToMap(r);
    r.node = { kind: 'reward', nodeId: node.nodeId, cards, tainted, relicId, cardTaken: false, relicTaken: false };
    return undefined;
  }

  if (node.kind === 'event' && node.toRemove) return 'Choose what you give up first.';
  backToMap(r);
  return undefined;
}

/** Down the stairs: floor 2's map, a little healing, everything else carried. */
function descend(r: RunState): void {
  const D = BALANCE.deep;
  r.depthBase = (r.depthBase ?? 0) + r.map.nodes[r.map.bossId].row + 1;
  r.floor++;
  r.hp = Math.min(r.maxHp, r.hp + Math.round(r.maxHp * D.stairsHeal));
  r.map = generateMap(r.rng, { ...BALANCE.map, rows: D.rows, eliteMinRow: 1, shrineMinRow: 1, weights: { ...D.weights } });
  r.position = null;
  r.visited = [];
  r.phase = 'map';
  r.node = null;
  r.combat = null;
}

function backToMap(r: RunState): void {
  r.phase = 'map';
  r.node = null;
  r.combat = null;
}

function endRun(r: RunState, result: 'victory' | 'death'): void {
  // Dying in the depths keeps half of the escape bonus you carried down.
  if (result === 'death' && r.heldShards) {
    r.shardsFound += Math.floor(r.heldShards / 2);
    r.heldShards = 0;
  }
  r.phase = 'ended';
  r.result = result;
  r.node = null;
  r.combat = null;
}

export { reachableNodes };
