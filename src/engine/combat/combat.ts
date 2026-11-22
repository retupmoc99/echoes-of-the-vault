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
import { PLAYER_ID, aspectActive, isOver, livingEnemies, type Ctx } from './context';
import { checkCombatEnd, loseHp } from './damage';
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
  // Relics that change fight-wide rules (numbers add up).
  for (const id of setup.relics) {
    for (const [k, v] of Object.entries(content.relics[id]?.combatMods ?? {}) as [keyof CombatModifiers, number][]) {
      (modifiers as Record<string, number>)[k] = ((modifiers as Record<string, number | undefined>)[k] ?? 0) + v;
    }
  }

  const deck: CardInstance[] = setup.deck.map((cardId, i) => ({ uid: `c${i}`, cardId }));
  const encounter = content.encounters[setup.encounterId];
  if (!encounter) throw new Error(`Unknown encounter: ${setup.encounterId}`);

  const affix = setup.affix;
  const enemies: EnemyState[] = [...encounter.enemies, ...(setup.extraEnemies ?? [])].map((defId, i) => {
    const def = content.enemies[defId];
    const hp = Math.round(rngInt(rng, def.hp[0], def.hp[1]) * modifiers.enemyHpMult * (affix?.hpMult ?? 1));
    const enemy: EnemyState = { id: `e${i}`, defId, hp, maxHp: hp, ward: affix?.ward ?? 0, statuses: {}, intent: '', history: [] };
    if (def.memories && setup.memories?.length) {
      const remembered = buildMemories(setup.memories, content);
      if (Object.keys(remembered).length) enemy.memoryMoves = remembered;
    }
    enemy.intent = chooseIntent(rng, patternOf(enemy, content), []);
    // Somnant: every foe can be put to sleep (bosses rarely; the Sleeper once).
    enemy.sleepThreshold = def.sleepThreshold ?? BALANCE.sleep.threshold[def.tier];
    if (def.maxSleeps !== undefined) enemy.maxSleeps = def.maxSleeps;
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

  // Warden resources carried in from the run.
  if (setup.aspect) s.aspect = setup.aspect;
  if (setup.miles !== undefined) Object.assign(s, { miles: setup.miles, milesGained: 0 });
  if (setup.toll !== undefined) Object.assign(s, { toll: setup.toll, tollPaid: 0 });

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
  const cost = cardCost(card, def, s.modifiers);
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
  // Shiftwright, Fractured: the blows cost you.
  if (aspectActive(s, 'fractured')) loseHp(ctx, s.player, s.aspectBoost && s.aspect === 'fractured' ? 2 : 1, 'effect');
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

    // Robbed (Mirrorborn): its move was taken; it does nothing this turn.
    if (enemy.robbed) {
      enemy.robbed = false;
      enemy.history.push(enemy.intent);
      tickEndOfTurn(ctx, enemy);
      if (isOver(s)) return undefined;
      continue;
    }

    // Asleep: it skips this move, and sleeps on through your next turn. On the
    // turn after that it wakes and makes the move it had planned.
    if (enemy.asleep && !enemy.waking) {
      enemy.waking = true;
      tickEndOfTurn(ctx, enemy);
      if (isOver(s)) return undefined;
      continue;
    }
    if (enemy.asleep) {
      enemy.asleep = false;
      enemy.waking = false;
      ctx.events.push({ type: 'woke', enemyId: enemy.id });
      fireTriggers(ctx, 'foeWoke', { targetId: enemy.id });
      if (isOver(s)) return undefined;
      if (enemy.hp <= 0) continue;
    }

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
  // Floor 2's Weight: if the enemies broke through all your Ward, it presses on you.
  const pressed = !!s.modifiers.weightDamage && s.turn > 0 && s.player.ward === 0;
  const firstTurn = s.turn === 0;
  s.turn++;
  s.overloadsThisTurn = 0;
  s.firedThisTurn = [];
  // Ward from fight-start relics carries into the first turn.
  if (!s.player.retainWard && !firstTurn) s.player.ward = 0;
  for (const ally of s.allies ?? []) {
    ally.guard = false;
    ally.ward = 0;
  }

  if (pressed) loseHp(ctx, s.player, s.modifiers.weightDamage!, 'weight');
  if (isOver(s)) return;
  tickStartOfTurn(ctx, s.player);
  if (isOver(s)) return;
  // Your delayed effects land before you draw.
  if (s.timeline.some((t) => !t.sourceId)) advanceTimeline(ctx, 1);
  if (isOver(s)) return;

  s.resonance = BALANCE.player.resonancePerTurn + (s.modifiers.resonanceBonus ?? 0);
  ctx.events.push({ type: 'turnStart', turn: s.turn });
  // Shiftwright, Choir: one more card (two, doubled).
  const choir = aspectActive(s, 'choir') ? (s.aspectBoost && s.aspect === 'choir' ? 2 : 1) : 0;
  drawCards(ctx, BALANCE.player.drawPerTurn + (s.modifiers.drawBonus ?? 0) + choir);
  returnEchoes(ctx);
  fireTriggers(ctx, 'turnStart');
  // Pathfinder allies act at the start of your turn, so you see what they did before you plan.
  if (s.allies?.length) allyPhase(ctx, 'turnStart');
}
