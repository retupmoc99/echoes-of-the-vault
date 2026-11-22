/**
 * The fight. Layout, top to bottom (thumb zone at the bottom):
 *   enemies → info line → player strip → selected-card panel → hand → end turn
 *
 * Playing a card is two taps: tap a card to read it, tap Play (or the card
 * again). Tap an enemy to aim at it. Nothing depends on hover.
 */
import { useEffect, useRef, useState } from 'react';
import { CONTENT } from '../../data';
import { BALANCE } from '../../data/balance';
import { PLAYER_ID, cardCost, livingEnemies, needsTarget, type CombatAction, type CombatState, type Effect } from '../../engine';
import { useScreenAtmosphere } from '../art';
import { HintSlot } from '../hints';
import { TimelineStrip } from '../components/TimelineStrip';
import { AllyRow } from '../components/AllyRow';
import { onFx } from '../fx/fxBus';
import { buzz, HAPTIC } from '../fx/haptics';
import { useHitFx } from '../fx/useHitFx';
import { CardView } from '../components/CardView';
import { DeckSheet } from '../components/DeckSheet';
import { EnemyView } from '../components/EnemyView';
import { Floaters } from '../components/Floaters';
import { HpBar } from '../components/HpBar';
import { RelicBar } from '../components/RelicBar';
import { StatusChips } from '../components/StatusChips';
import { layoutRect } from '../uiScale';

interface Props {
  state: CombatState;
  error?: string;
  /** Shown in the top bar, e.g. "Depth 3 · Elite". */
  label: string;
  tier: 'normal' | 'elite' | 'boss';
  dispatch: (a: CombatAction) => void;
  onMenu: () => void;
  /** Called from the end-of-fight overlay. */
  onContinue: () => void;
  /** Background art keys to try, in order (e.g. the Vault Shift, then "combat"). */
  bgKeys?: string[];
}

/** A played card's ghost, flying from the hand to its target. */
interface Ghost {
  key: string;
  cardId: string;
  from: DOMRect;
  dx: number;
  dy: number;
}
const GHOST_MS = 420;

const OUTCOME = {
  won: {
    normal: ['The sigils go dark.', 'For now, the vault is silent.'],
    elite: ['It falls, and keeps falling.', 'Greater horrors leave greater silence.'],
    boss: ['The Lock breaks.', 'Somewhere below, something hears it.'],
  },
  lost: ['The loop closes.', 'You wake at the outpost. Something remembers you.'],
} as const;

/** Height an enemy needs besides its art: intent badge, name, HP bar, statuses. */
const ENEMY_CHROME = 104;

/** The element's height, kept current as the layout changes. */
function useElementHeight(ref: React.RefObject<HTMLElement | null>): number | undefined {
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setHeight(Math.round(entry.contentRect.height)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return height;
}

export function CombatScreen({ state, error, label, tier, dispatch, onMenu, onContinue, bgKeys = ['combat'] }: Props) {
  useScreenAtmosphere(...bgKeys);
  const enemiesRef = useRef<HTMLElement>(null);
  const enemyArea = useElementHeight(enemiesRef);
  const [selectedUid, setSelectedUid] = useState<string>();
  const [targetId, setTargetId] = useState<string>();
  const [info, setInfo] = useState<string>('Tap a card to read it. Tap an enemy to aim.');
  const shaking = useScreenShake();
  const playerFx = useHitFx(PLAYER_ID);

  // Keep the aim on a living enemy.
  const alive = livingEnemies(state);
  const aim = alive.find((e) => e.id === targetId)?.id ?? alive[0]?.id;

  const selected = state.piles.hand.find((c) => c.uid === selectedUid);
  const selectedDef = selected && CONTENT.cards[selected.cardId];
  const canPlay = !!selected && !!selectedDef && !selectedDef.unplayable && cardCost(selected, selectedDef, state.modifiers) <= state.resonance;
  // Rewrite: choose which discarded card comes back before the card is played.
  const [recalling, setRecalling] = useState(false);

  useEffect(() => {
    if (error) {
      setInfo(error);
      buzz(HAPTIC.error);
    }
  }, [error]);

  const [ghosts, setGhosts] = useState<Ghost[]>([]);

  const playSelected = (pickUid?: string) => {
    if (!selected || !selectedDef) return;
    if (pickUid === undefined && selectedDef.effects.some((e) => e.kind === 'recall') && state.piles.discard.length > 1) {
      setRecalling(true);
      return;
    }
    setRecalling(false);
    buzz(HAPTIC.cardPlay);
    // Launch a ghost of the card from its spot in the hand toward its target.
    const fromEl = document.querySelector(`.hand [data-card-uid="${selected.uid}"]`);
    const toId = needsTarget(selectedDef.effects) ? aim : 'player';
    const toEl = toId ? document.querySelector(`[data-fx-id="${toId}"]`) : undefined;
    if (fromEl && toEl) {
      // Layout pixels: the ghost sits inside the scaled layer (see uiScale.ts).
      const from = layoutRect(fromEl);
      const to = layoutRect(toEl);
      const ghost: Ghost = { key: `${selected.uid}-${Date.now()}`, cardId: selected.cardId, from, dx: to.left + to.width / 2 - (from.left + from.width / 2), dy: to.top + to.height / 2 - (from.top + from.height / 2) };
      setGhosts((g) => [...g, ghost]);
      setTimeout(() => setGhosts((g) => g.filter((x) => x.key !== ghost.key)), GHOST_MS);
    }
    dispatch({ type: 'playCard', uid: selected.uid, targetId: aim, pickUid });
    setSelectedUid(undefined);
  };

  const tapCard = (uid: string) => {
    if (uid === selectedUid && canPlay) playSelected();
    else setSelectedUid(uid);
  };

  // Enemy art shrinks to fit the space left over (allies and the timeline take
  // room on short screens), keeping space for the intent, name and HP bar.
  const preferred = alive.length > 1 || state.enemies.length > 1 ? 112 : 168;
  const enemySize = enemyArea ? Math.max(64, Math.min(preferred, enemyArea - ENEMY_CHROME)) : preferred;
  const noMoves =
    state.phase === 'player' &&
    !state.piles.hand.some((c) => {
      const def = CONTENT.cards[c.cardId];
      return !def.unplayable && cardCost(c, def, state.modifiers) <= state.resonance;
    });
  const over = state.phase === 'won' || state.phase === 'lost';

  return (
    <div className={`combat ${shaking ? 'shake' : ''}`}>
      <header className="topbar">
        <button className="ghost-btn" onClick={onMenu}>
          ☰
        </button>
        <span className="turn">
          {label} · Turn {state.turn}
        </span>
      </header>

      <HintSlot
        candidates={[
          ['combat-cards', true],
          ['combat-intents', true],
          ['overload', state.piles.hand.some((c) => CONTENT.cards[c.cardId].type === 'overload')],
          ['timeline', state.timeline.length > 0],
          ['echo-copy', state.piles.hand.some((c) => c.ephemeral)],
          ['paradox', (state.player.statuses.paradox ?? 0) > 0],
          ['somnant', state.enemies.some((e) => (e.statuses.drowse ?? 0) > 0 || e.asleep)],
          ['statuses', [state.player, ...state.enemies].some((c) => Object.keys(c.statuses).length > 0)],
          ['allies', (state.allies ?? []).some((a) => a.hp > 0)],
        ]}
      />

      <section className="enemies" ref={enemiesRef}>
        {state.enemies.map((enemy) => (
          <EnemyView
            key={enemy.id}
            state={state}
            enemy={enemy}
            size={enemySize}
            targeted={alive.length > 1 && enemy.id === aim}
            onSelect={() => setTargetId(enemy.id)}
            onInspect={setInfo}
          />
        ))}
      </section>

      <p className="info-line" aria-live="polite">
        {info}
      </p>

      <AllyRow state={state} onInspect={setInfo} />

      <section data-fx-id="player" className={`player ${playerFx.flashing ? 'hit' : ''}`}>
        <Floaters items={playerFx.floaters} />
        <div className="player-row">
          <div className="resonance" aria-label={`${state.resonance} Resonance`}>
            {Array.from({ length: Math.max(BALANCE.player.resonancePerTurn, state.resonance) }, (_, i) => (
              <i key={i} className={i < state.resonance ? 'on' : ''} />
            ))}
          </div>
          <div className="player-hp">
            <HpBar hp={state.player.hp} maxHp={state.player.maxHp} ward={state.player.ward} />
          </div>
        </div>
        <div className="player-row">
          <RelicBar relics={state.relics} strainBonus={state.modifiers.maxStrainBonus} onInspect={setInfo} />
          <StatusChips statuses={state.player.statuses} onInspect={setInfo} />
        </div>
      </section>

      <TimelineStrip entries={state.timeline} onInspect={setInfo} />

      <section className="detail-slot">
        {selected && selectedDef && (
          <div className="detail">
            <CardView card={selected} variant="detail" affordable={canPlay} preview={{ state, targetId: aim }} />
            <CallNote state={state} effects={selectedDef.effects} />
            <div className="detail-actions">
              <button className="ghost-btn" onClick={() => setSelectedUid(undefined)}>
                Cancel
              </button>
              <button className="primary-btn" disabled={!canPlay} onClick={() => playSelected()}>
                {selectedDef.unplayable ? 'Unplayable' : canPlay ? (needsTarget(selectedDef.effects) && alive.length > 1 ? 'Play on target' : 'Play') : 'No Resonance'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="hand">
        {state.piles.hand.map((card) => {
          const def = CONTENT.cards[card.cardId];
          return (
            <CardView
              key={card.uid}
              card={card}
              variant="hand"
              preview={{ state, targetId: aim }}
              affordable={!def.unplayable && cardCost(card, def, state.modifiers) <= state.resonance}
              selected={card.uid === selectedUid}
              onClick={() => tapCard(card.uid)}
            />
          );
        })}
      </section>

      <footer className="bottombar">
        <button className="pile" onClick={() => setInfo(`Draw pile: ${state.piles.draw.length} cards.`)}>
          ▤ {state.piles.draw.length}
        </button>
        <button className="pile" onClick={() => setInfo(`Discard: ${state.piles.discard.length}. Faded: ${state.piles.faded.length}.`)}>
          ⟲ {state.piles.discard.length}
        </button>
        <button
          className={`primary-btn end-turn ${noMoves ? 'idle-hint' : ''}`}
          disabled={state.phase !== 'player'}
          onClick={() => {
            setSelectedUid(undefined);
            dispatch({ type: 'endTurn' });
          }}
        >
          End Turn
        </button>
      </footer>

      {recalling && (
        <DeckSheet
          deck={state.piles.discard.map((c) => c.cardId)}
          title="Rewrite: choose a card to return"
          onClose={() => setRecalling(false)}
          pick={{ label: 'Return', onPick: (i) => playSelected(state.piles.discard[i].uid) }}
        />
      )}

      {ghosts.map((g) => (
        <div
          key={g.key}
          className="card-ghost"
          style={{
            left: g.from.left,
            top: g.from.top,
            width: g.from.width,
            height: g.from.height,
            ['--dx' as string]: `${g.dx}px`,
            ['--dy' as string]: `${g.dy}px`,
          }}
          aria-hidden
        >
          <CardView card={{ uid: g.key, cardId: g.cardId }} variant="hand" affordable />
        </div>
      ))}

      {over && (
        <div className="overlay">
          <div className="overlay-box">
            <h2>{(state.phase === 'won' ? OUTCOME.won[tier] : OUTCOME.lost)[0]}</h2>
            <p>{(state.phase === 'won' ? OUTCOME.won[tier] : OUTCOME.lost)[1]}</p>
            <button className="primary-btn" onClick={onContinue}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Shake the screen and buzz when the player is hit; buzz when an enemy dies. */
function useScreenShake(): boolean {
  const [shaking, setShaking] = useState(false);
  useEffect(
    () =>
      onFx((e) => {
        if (e.type === 'attack' && e.targetId === PLAYER_ID && e.amount > e.blocked) {
          buzz(HAPTIC.playerHit);
          setShaking(true);
          setTimeout(() => setShaking(false), 280);
        } else if (e.type === 'death' && e.targetId !== PLAYER_ID) {
          buzz(HAPTIC.enemyKill);
        }
      }),
    [],
  );
  return shaking;
}

/**
 * Before playing a Call: who will answer, and a warning if it would drain that
 * Echo (it Unravels when the loop closes) or if two allies already stand.
 */
function CallNote({ state, effects }: { state: CombatState; effects: Effect[] }) {
  const calls = effects.some((e) => e.kind === 'call');
  if (!calls) return null;
  const A = BALANCE.allies;
  if ((state.allies ?? []).filter((a) => a.hp > 0).length >= A.maxOnField) {
    return <p className="detail-note warn">Two allies already stand with you. Nothing more can answer.</p>;
  }
  const next = (state.chorus ?? []).find((m) => !(state.called ?? []).includes(m.echoId));
  if (!next) return <p className="detail-note">Your Chorus is spent: a Nameless Echo will answer.</p>;
  const callCost = state.relics.some((r) => r.relicId === 'severed-thread') ? 0 : A.callCost;
  const left = next.stability - callCost * (next.calls + 1) - A.fallCost * next.falls;
  return (
    <p className={`detail-note ${left <= 0 ? 'warn' : ''}`}>
      {next.name} answers ({next.maxHp} HP).{' '}
      {left <= 0
        ? `This Call drains it: ${next.name.split(' ')[0]} Unravels when the loop ends.`
        : `Calling costs it ${callCost} stability (${Math.floor(left)} left).`}
    </p>
  );
}
