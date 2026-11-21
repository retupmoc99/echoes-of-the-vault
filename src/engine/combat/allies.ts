/**
 * Echo-Caller allies: your Outpost Echoes, fighting beside you.
 *
 * - Call brings the next unused member of the loop's Chorus into the fight
 *   (a Nameless Echo once the Chorus is spent). At most two at once.
 * - After you end your turn, each ally plays the top card of its own deck at
 *   reduced strength (BALANCE.allies.potency, rounded up), aimed where you last aimed. Curses fizzle and
 *   hurt it. Its Echo trait changes how it fights (see `battle` on traits).
 * - Enemies keep attacking you; only a Guarding ally takes those hits, and
 *   enemy area attacks reach allies too.
 * - Fallen and released allies are recorded: each Call and each fall costs
 *   that Echo stability when the loop closes (see idle/chorus.ts).
 */
import { BALANCE } from '../../data/balance';
import { rngShuffle } from '../rng';
import type { AllyState, AllyTraitMods, Content, EnemyState } from '../types';
import { PLAYER_ID, isOver, livingEnemies, type Ctx } from './context';
import { dealAttack, gainWard, loseHp } from './damage';
import { resolveEffects } from './effects';
import { fireTriggers } from './relics';
import { tickEndOfTurn, tickStartOfTurn } from './statuses';

const A = BALANCE.allies;
export const NAMELESS = 'nameless';

export function traitBattle(content: Content, traitId: string): AllyTraitMods {
  return content.idle.traits.find((t) => t.id === traitId)?.battle ?? {};
}

export function livingAllies(s: Ctx['s']): AllyState[] {
  return (s.allies ?? []).filter((a) => a.hp > 0);
}

/** The most recently Called living ally (cards that touch "an ally" use it). */
export function newestAlly(s: Ctx['s']): AllyState | undefined {
  return livingAllies(s).at(-1);
}

/** Where allies aim: the enemy you last targeted, else the first one alive. */
function focusTarget(s: Ctx['s']): EnemyState | undefined {
  const alive = livingEnemies(s);
  return alive.find((e) => e.id === s.focusId) ?? alive[0];
}

export function callAllies(ctx: Ctx, count: number): void {
  const s = ctx.s;
  for (let i = 0; i < count; i++) {
    if (livingAllies(s).length >= A.maxOnField) return;
    const member = s.chorus.find((m) => !s.called.includes(m.echoId));
    const id = `a${s.nextUid++}`;
    const ally: AllyState = member
      ? {
          id,
          echoId: member.echoId,
          name: member.name,
          traitId: member.traitId,
          hp: member.maxHp,
          maxHp: member.maxHp,
          ward: 0,
          statuses: {},
          draw: rngShuffle(s.rng, member.deck),
          discard: [],
          guard: false,
        }
      : {
          id,
          echoId: null,
          name: 'A Nameless Echo',
          traitId: 'faded',
          hp: A.nameless.hp,
          maxHp: A.nameless.hp,
          ward: 0,
          statuses: {},
          draw: rngShuffle(s.rng, A.nameless.deck),
          discard: [],
          guard: false,
        };
    const fades = traitBattle(ctx.content, ally.traitId).fadesAfter;
    if (fades) ally.turnsLeft = fades;
    s.called.push(member?.echoId ?? NAMELESS);
    s.allies.push(ally);
    ctx.events.push({ type: 'allyCalled', allyId: id, name: ally.name });
    fireTriggers(ctx, 'allyCalled');
  }
}

/** Take the ally's next card (reshuffling its discard if needed). Hoarders pick the costliest of the top few. */
function drawAllyCard(ctx: Ctx, ally: AllyState, bestOf?: number): string | undefined {
  if (!ally.draw.length) {
    ally.draw = rngShuffle(ctx.s.rng, ally.discard);
    ally.discard = [];
  }
  if (!ally.draw.length) return undefined;
  if (bestOf && bestOf > 1) {
    const top = ally.draw.slice(0, bestOf);
    let best = 0;
    top.forEach((id, i) => {
      if ((ctx.content.cards[id]?.cost ?? 0) > (ctx.content.cards[top[best]]?.cost ?? 0)) best = i;
    });
    return ally.draw.splice(best, 1)[0];
  }
  return ally.draw.shift();
}

/** The card an ally will play next (for the UI). */
export function allyNextCard(ally: AllyState, content: Content): string | undefined {
  // An empty draw pile means it will reshuffle first: the next card is unknown.
  if (!ally.draw.length) return undefined;
  const bestOf = traitBattle(content, ally.traitId).bestOfTop;
  if (!bestOf || bestOf <= 1) return ally.draw[0];
  return ally.draw.slice(0, bestOf).reduce((a, b) => ((content.cards[b]?.cost ?? 0) > (content.cards[a]?.cost ?? 0) ? b : a));
}

/** The ally plays its card(s) for this turn. */
export function allyActs(ctx: Ctx, ally: AllyState): void {
  const s = ctx.s;
  const mods = traitBattle(ctx.content, ally.traitId);
  const times = (mods.acts ?? 1) * (s.allyActs ?? 1);
  for (let i = 0; i < times && ally.hp > 0 && !isOver(s); i++) {
    if (i === 0 && mods.wardPerTurn) gainWard(ctx, ally, mods.wardPerTurn);
    const cardId = drawAllyCard(ctx, ally, mods.bestOfTop);
    if (!cardId) return;
    ctx.events.push({ type: 'allyActed', allyId: ally.id, cardId });
    const def = ctx.content.cards[cardId];
    const target = focusTarget(s);
    if (!def || def.unplayable || def.type === 'curse') {
      // Haunted allies turn their curses on the enemy; others are hurt by them.
      if (mods.curseDamage && target) dealAttack(ctx, ally, target, mods.curseDamage);
      else loseHp(ctx, ally, A.curseSelfDamage, 'effect');
    } else {
      const previous = ctx.potency;
      ctx.potency = mods.fullStrength ? 1 : A.potency;
      resolveEffects(ctx, def.effects, ally.id, target?.id);
      ctx.potency = previous;
    }
    ally.discard.push(cardId);
    const loss = (mods.hpLossPerTurn ?? 0) + (s.allyHpLoss ?? 0);
    if (loss && ally.hp > 0 && !isOver(s)) loseHp(ctx, ally, loss, 'effect');
  }
}

/**
 * Allies' turn. Most act after you end your turn ('turnEnd'); Pathfinders
 * act at the start of yours ('turnStart'). Statuses tick around their action.
 */
export function allyPhase(ctx: Ctx, timing: 'turnStart' | 'turnEnd'): void {
  for (const ally of [...ctx.s.allies]) {
    if (ally.hp <= 0 || isOver(ctx.s)) continue;
    const mods = traitBattle(ctx.content, ally.traitId);
    if (!!mods.actsAtTurnStart !== (timing === 'turnStart')) continue;
    tickStartOfTurn(ctx, ally);
    if (ally.hp <= 0 || isOver(ctx.s)) continue;
    allyActs(ctx, ally);
    if (ally.hp > 0) tickEndOfTurn(ctx, ally);
    // Fleeting allies fade after a few turns (fading isn't falling).
    if (ally.turnsLeft !== undefined && ally.hp > 0 && --ally.turnsLeft <= 0) {
      ally.hp = 0;
      ctx.events.push({ type: 'allyFell', allyId: ally.id });
    }
  }
}

/** An ally reached 0 HP (or was released): record the fall and tell the relics. */
export function onAllyFell(ctx: Ctx, ally: AllyState): void {
  ctx.s.fallen.push(ally.echoId ?? NAMELESS);
  ctx.events.push({ type: 'allyFell', allyId: ally.id });
  fireTriggers(ctx, 'allyFell');
}

/** Release allies: each fades and deals its remaining HP (or a set amount) to every enemy. */
export function releaseAllies(ctx: Ctx, who: 'newest' | 'all', damage: 'hp' | number): void {
  const s = ctx.s;
  const chosen = who === 'newest' ? [newestAlly(s)].filter((a): a is AllyState => !!a) : livingAllies(s);
  for (const ally of chosen) {
    const amount = damage === 'hp' ? ally.hp : damage;
    ally.hp = 0;
    onAllyFell(ctx, ally);
    for (const enemy of livingEnemies(s)) {
      if (isOver(s)) return;
      dealAttack(ctx, ally, enemy, amount);
    }
  }
}

/** Play the top card(s) of the newest ally's deck yourself, at full strength. */
export function playAllyTop(ctx: Ctx, count: number): void {
  const s = ctx.s;
  const ally = newestAlly(s);
  if (!ally) return;
  for (let i = 0; i < count && !isOver(s); i++) {
    const cardId = drawAllyCard(ctx, ally);
    if (!cardId) return;
    ctx.events.push({ type: 'allyActed', allyId: ally.id, cardId });
    const def = ctx.content.cards[cardId];
    if (def && !def.unplayable && def.type !== 'curse') resolveEffects(ctx, def.effects, PLAYER_ID, focusTarget(s)?.id);
    ally.discard.push(cardId);
  }
}
