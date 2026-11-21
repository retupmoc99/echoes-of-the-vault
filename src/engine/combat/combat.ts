/**
 * Combat entry points: createCombat() and step().
 *
 * step() is a pure function from the caller's point of view:
 *   (state, action) → { state, events }
 * Internally it clones the state and mutates the clone, which keeps the rule
 * code short and readable ("enemy.hp -= 5") without leaking mutation.
 * The same seed + the same actions always give the same result.
 */
import { BALANCE } from '../../data/balance';
import { createRng, rngInt, rngShuffle } from '../rng';
import type {
  CardInstance,
  CombatAction,
  CombatModifiers,
  CombatSetup,
  CombatState,
  Content,
  EnemyState,
  StepResult,
} from '../types';
import { PLAYER_ID, isOver, livingEnemies, type Ctx } from './context';
import { checkCombatEnd } from './damage';
import { cardCost, discardHand, drawCards } from './deck';
import { needsTarget, resolveEffects } from './effects';
import { chooseIntent } from './intents';
import { allyPhase } from './allies';
import { buildMemories, moveOf, patternOf } from './phases';
import { fireTriggers } from './relics';
import { tickEndOfTurn, tickStartOfTurn } from './statuses';
import { advanceTimeline, queueEcho, returnEchoes } from './time';

/** Rule values for a fight with no Shift or Corruption applied. */
export function defaultCombatModifiers(): CombatModifiers {
  return {
    enemyHpMult: 1,
    enemyDamageBonus: 0,
    awakeningStage: 0,
    bleedDecay: BALANCE.status.bleed.decayPerTurn,
    fractureDamagePerStack: BALANCE.status.fracture.damagePerStack,
    fractureSelfDamageRatio: BALANCE.status.fracture.selfDamageRatio,
    maxStrainBonus: 0,
  };
}

export function createCombat(setup: CombatSetup, content: Content): StepResult {
  const rng = createRng(setup.seed);
  const modifiers = { ...defaultCombatModifiers(), ...setup.modifiers };

  const deck: CardInstance[] = setup.deck.map((cardId, i) => ({ uid: `c${i}`, cardId }));
  const encounter = content.encounters[setup.encounterId];
  if (!encounter) throw new Error(`Unknown encounter: ${setup.encounterId}`);

  const affix = setup.affix;
  const enemies: EnemyState[] = encounter.enemies.map((defId, i) => {
    const def = content.enemies[defId];
    const hp = Math.round(rngInt(rng, def.hp[0], def.hp[1]) * modifiers.enemyHpMult * (affix?.hpMult ?? 1));
    const enemy: EnemyState = { id: `e${i}`, defId, hp, maxHp: hp, ward: affix?.ward ?? 0, statuses: {}, intent: '', history: [] };
    if (def.memories && setup.memories?.length) {
      const remembered = buildMemories(setup.memories, content);
      if (Object.keys(remembered).length) enemy.memoryMoves = remembered;
    }
    enemy.intent = chooseIntent(rng, patternOf(enemy, content), []);
    if (affix) {
      enemy.affix = affix.id;
      if (affix.damageBonus) enemy.damageBonus = affix.damageBonus;
    }
    return enemy;
  });

  const s: CombatState = {
    turn: 0,
    phase: 'player',
    resonance: 0,
    player: { id: PLAYER_ID, hp: setup.hp, maxHp: setup.maxHp, ward: 0, statuses: {}, retainWard: false },
    enemies,
    relics: setup.relics.map((relicId) => ({ relicId, strain: 0, cracked: false })),
    piles: { draw: rngShuffle(rng, deck), hand: [], discard: [], faded: [] },
    overloadsThisTurn: 0,
    timeline: [],
    echoQueue: [],
    allies: [],
    chorus: setup.chorus ?? [],
    called: [],
    fallen: [],
    allyActs: 1,
    allyHpLoss: 0,
    rng,
    nextUid: deck.length,
    modifiers,
  };

  const ctx: Ctx = { s, content, events: [], depth: 0 };
  fireTriggers(ctx, 'combatStart');
  startPlayerTurn(ctx);
  return { state: s, events: ctx.events };
}

export function step(state: CombatState, action: CombatAction, content: Content): StepResult {
  if (state.phase !== 'player') return { state, events: [], error: 'Combat is not awaiting the player.' };

  const ctx: Ctx = { s: structuredClone(state), content, events: [], depth: 0 };
  const error = action.type === 'playCard' ? playCard(ctx, action.uid, action.targetId, action.pickUid) : endTurn(ctx);

  // A refused action leaves the original state untouched.
  if (error) return { state, events: [], error };
  return { state: ctx.s, events: ctx.events };
}

// ───────────────────────────── Player actions ─────────────────────────────

function playCard(ctx: Ctx, uid: string, targetId: string | undefined, pickUid?: string): string | undefined {
  const s = ctx.s;
  const handIndex = s.piles.hand.findIndex((c) => c.uid === uid);
  if (handIndex < 0) return 'That card is not in your hand.';

  const card = s.piles.hand[handIndex];
  const def = ctx.content.cards[card.cardId];
  if (def.unplayable) return `${def.name} cannot be played.`;
  const cost = cardCost(card, def);
  if (cost > s.resonance) return 'Not enough Resonance.';

  let target: string | undefined;
  if (needsTarget(def.effects)) {
    const alive = livingEnemies(s);
    target = alive.find((e) => e.id === targetId)?.id ?? alive[0]?.id;
    if (!target) return 'No target.';
    s.focusId = target; // your allies aim where you aim
  }

  s.resonance -= cost;
  // The card leaves the hand while it resolves, so draw effects cannot redraw it.
  s.piles.hand.splice(handIndex, 1);
  ctx.events.push({ type: 'cardPlayed', uid, cardId: def.id });

  ctx.sourceCardId = def.id;
  ctx.pickUid = pickUid;
  resolveEffects(ctx, def.effects, PLAYER_ID, target);
  ctx.sourceCardId = undefined;
  ctx.pickUid = undefined;
  // Echo copies vanish once played; real cards go to discard (or fade).
  if (!card.ephemeral) {
    const { freeThisTurn: _, ...played } = card;
    (def.fade ? s.piles.faded : s.piles.discard).push(played);
  }
  if (def.echo) queueEcho(ctx, def.id);

  if (!isOver(s)) fireTriggers(ctx, 'cardPlayed', { cardType: def.type });
  checkCombatEnd(ctx);
  return undefined;
}

function endTurn(ctx: Ctx): string | undefined {
  const s = ctx.s;

  // Player's end of turn. Curses punish you for holding them.
  fireTriggers(ctx, 'turnEnd');
  for (const card of [...s.piles.hand]) {
    const onHold = ctx.content.cards[card.cardId].inHandAtTurnEnd;
    if (onHold && !isOver(s)) resolveEffects(ctx, onHold, PLAYER_ID, undefined);
  }
  if (isOver(s)) return undefined;
  discardHand(ctx);
  tickEndOfTurn(ctx, s.player);
  if (isOver(s)) return undefined;

  // Your allies act after you, before the enemies.
  allyPhase(ctx, 'turnEnd');
  if (isOver(s)) return undefined;

  // Enemy turn.
  s.phase = 'enemy';
  for (const enemy of s.enemies) {
    if (enemy.hp <= 0) continue;
    enemy.ward = 0;
    tickStartOfTurn(ctx, enemy);
    if (isOver(s)) return undefined; // check before `continue`: Bleed may have ended the fight
    if (enemy.hp <= 0) continue;

    // This enemy's delayed attacks (the Sleeper's dreams) tick and land on its own turn.
    if (s.timeline.some((t) => t.sourceId === enemy.id)) advanceTimeline(ctx, 1, enemy.id);
    if (isOver(s)) return undefined;
    if (enemy.hp <= 0) continue;

    const move = moveOf(enemy, ctx.content);
    ctx.events.push({ type: 'enemyMove', enemyId: enemy.id, moveId: enemy.intent, moveName: move.name });
    enemy.history.push(enemy.intent);
    ctx.moveName = move.name;
    resolveEffects(ctx, move.effects, enemy.id, PLAYER_ID);
    ctx.moveName = undefined;
    if (isOver(s)) return undefined;

    tickEndOfTurn(ctx, enemy);
    if (isOver(s)) return undefined;
  }

  // Telegraph next moves, then hand control back.
  for (const enemy of livingEnemies(s)) {
    enemy.intent = chooseIntent(s.rng, patternOf(enemy, ctx.content), enemy.history);
  }
  s.phase = 'player';
  startPlayerTurn(ctx);
  return undefined;
}

function startPlayerTurn(ctx: Ctx): void {
  const s = ctx.s;
  s.turn++;
  s.overloadsThisTurn = 0;
  if (!s.player.retainWard) s.player.ward = 0;
  for (const ally of s.allies ?? []) {
    ally.guard = false;
    ally.ward = 0;
  }

  tickStartOfTurn(ctx, s.player);
  if (isOver(s)) return;
  // Your delayed effects land before you draw.
  if (s.timeline.some((t) => !t.sourceId)) advanceTimeline(ctx, 1);
  if (isOver(s)) return;

  s.resonance = BALANCE.player.resonancePerTurn;
  ctx.events.push({ type: 'turnStart', turn: s.turn });
  drawCards(ctx, BALANCE.player.drawPerTurn);
  returnEchoes(ctx);
  fireTriggers(ctx, 'turnStart');
  // Pathfinder allies act at the start of your turn, so you see what they did before you plan.
  if (s.allies?.length) allyPhase(ctx, 'turnStart');
}
