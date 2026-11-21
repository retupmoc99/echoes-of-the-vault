/**
 * A simple, deterministic bot for balance testing. It plays sensibly but not
 * brilliantly (a careful new player, roughly), so a human should do better.
 *
 * - Combat: blocks when enemies will hit harder than its Ward, otherwise
 *   plays its most expensive card; aims at the weakest enemy.
 * - Map: takes Shrines when hurt, Elites only when healthy.
 * - Rewards: the rarest card offered; never the tainted one.
 * - Shrines: rest when below 80% HP, otherwise cut a curse or a starter card.
 * - Events: the first option it can afford. Caches: the first clean relic.
 */
import type { CardDef, CombatAction, Content, RunAction, RunState } from '../engine';
import { canSearchShrine, cardCost, livingEnemies, needsTarget, optionAvailable, previewIntent, reachableNodes } from '../engine';

const RARITY_RANK: Record<string, number> = { curse: -1, starter: 0, common: 1, uncommon: 2, rare: 3 };

export function nextBotAction(r: RunState, content: Content): RunAction {
  if (r.phase === 'map') return { type: 'chooseNode', nodeId: chooseNode(r) };
  const node = r.node!;
  const hpRatio = r.hp / r.maxHp;

  switch (node.kind) {
    case 'shrine': {
      if (r.options.shrinePurge && r.corruption >= 3) return { type: 'shrinePurge' };
      if (hpRatio < 0.8) return { type: 'shrineRest' };
      const curse = r.deck.findIndex((id) => content.cards[id].type === 'curse');
      if (curse >= 0) return { type: 'shrineRemove', deckIndex: curse };
      const starter = r.deck.findIndex((id) => content.cards[id].rarity === 'starter' && content.cards[id].type === 'strike');
      if (starter >= 0 && r.deck.length > 8) return { type: 'shrineRemove', deckIndex: starter };
      if (canSearchShrine(r)) return { type: 'shrineSearch' };
      return { type: 'shrineRest' };
    }
    case 'cache': {
      const clean = node.relicIds.findIndex((id) => !content.relics[id].corruption);
      return clean >= 0 ? { type: 'takeRelic', index: clean } : { type: 'leave' };
    }
    case 'reward': {
      if (node.relicId && !node.relicTaken) return { type: 'takeRelic' };
      if (node.cardTaken || !node.cards.length) return { type: 'leave' };
      let best = 0;
      node.cards.forEach((id, i) => {
        if (RARITY_RANK[content.cards[id].rarity] > RARITY_RANK[content.cards[node.cards[best]].rarity]) best = i;
      });
      return { type: 'pickCard', choice: best };
    }
    case 'event': {
      if (node.toRemove) return { type: 'removeCard', deckIndex: worstCard(r, content) };
      if (node.resolved) return { type: 'leave' };
      const options = content.events[node.eventId].options;
      return { type: 'chooseOption', index: Math.max(0, options.findIndex((o) => optionAvailable(r, o))) };
    }
    case 'combat':
      // A finished fight waits for "leave" (or the loop ends on defeat).
      if (r.combat!.phase !== 'player') return { type: 'leave' };
      return { type: 'combat', action: combatAction(r, content) };
  }
}

/** The card the bot gives up first: a curse, then a starter strike, then a starter, then the first card. */
function worstCard(r: RunState, content: Content): number {
  const find = (test: (id: string) => boolean) => r.deck.findIndex(test);
  const curse = find((id) => content.cards[id].type === 'curse');
  if (curse >= 0) return curse;
  const strike = find((id) => content.cards[id].rarity === 'starter' && content.cards[id].type === 'strike');
  if (strike >= 0) return strike;
  return Math.max(0, find((id) => content.cards[id].rarity === 'starter'));
}

function chooseNode(r: RunState): string {
  const hpRatio = r.hp / r.maxHp;
  const score = (type: string): number => {
    if (type === 'shrine') return hpRatio < 0.55 ? 10 : 2;
    if (type === 'elite') return hpRatio > 0.7 ? 6 : -5;
    if (type === 'fight') return 5;
    if (type === 'cache') return 5;
    return 4; // event, boss
  };
  const options = reachableNodes(r.map, r.position);
  return options.reduce((a, b) => (score(r.map.nodes[b].type) > score(r.map.nodes[a].type) ? b : a));
}

function combatAction(r: RunState, content: Content): CombatAction {
  const c = r.combat!;
  const enemies = livingEnemies(c);
  const intents = enemies.reduce((sum, e) => {
    const p = previewIntent(c, e, content);
    return sum + (p.damage ?? 0) * (p.hits ?? 1);
  }, 0);
  // Enemy dreams due when they next act land this enemy turn too (raw damage, roughly).
  const dreams = c.timeline
    .filter((t) => t.sourceId && t.turnsLeft === 1)
    .flatMap((t) => t.effects)
    .reduce((sum, e) => sum + (e.kind === 'damage' && typeof e.amount === 'number' ? e.amount * (e.hits ?? 1) : 0), 0);
  const incoming = intents + dreams;
  const playable = c.piles.hand
    .map((card) => ({ card, def: content.cards[card.cardId] as CardDef }))
    .filter(({ card, def }) => !def.unplayable && def.type !== 'curse' && cardCost(card, def) <= c.resonance)
    .sort((a, b) => b.def.cost - a.def.cost);
  if (!playable.length) return { type: 'endTurn' };

  const wards = playable.filter(({ def }) => def.type === 'ward');
  const others = playable.filter(({ def }) => def.type !== 'ward');
  const needBlock = incoming > c.player.ward;
  const pick = (needBlock && wards[0]) || others[0] || wards[0];

  const target = enemies.reduce((a, b) => (b.hp < a.hp ? b : a));
  return needsTarget(pick.def.effects)
    ? { type: 'playCard', uid: pick.card.uid, targetId: target.id }
    : { type: 'playCard', uid: pick.card.uid };
}
