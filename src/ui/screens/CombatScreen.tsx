/**
 * The fight. Layout, top to bottom (thumb zone at the bottom):
 *   enemies → info line → player strip → selected-card panel → hand → end turn
 *
 * Playing a card is two taps: tap a card to read it, tap Play (or the card
 * again). Tap an enemy to aim at it. Nothing depends on hover.
 */
import { useEffect, useState } from 'react';
import { CONTENT } from '../../data';
import { BALANCE } from '../../data/balance';
import { PLAYER_ID, livingEnemies, needsTarget, type CombatAction, type CombatState } from '../../engine';
import { useScreenBackground } from '../art';
import { HintSlot } from '../hints';
import { TimelineStrip } from '../components/TimelineStrip';
import { onFx } from '../fx/fxBus';
import { buzz, HAPTIC } from '../fx/haptics';
import { useHitFx } from '../fx/useHitFx';
import { CardView } from '../components/CardView';
import { EnemyView } from '../components/EnemyView';
import { Floaters } from '../components/Floaters';
import { HpBar } from '../components/HpBar';
import { RelicBar } from '../components/RelicBar';
import { StatusChips } from '../components/StatusChips';

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

export function CombatScreen({ state, error, label, tier, dispatch, onMenu, onContinue, bgKeys = ['combat'] }: Props) {
  useScreenBackground(...bgKeys);
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
  const canPlay = !!selectedDef && !selectedDef.unplayable && selectedDef.cost <= state.resonance;

  useEffect(() => {
    if (error) {
      setInfo(error);
      buzz(HAPTIC.error);
    }
  }, [error]);

  const [ghosts, setGhosts] = useState<Ghost[]>([]);

  const playSelected = () => {
    if (!selected || !selectedDef) return;
    buzz(HAPTIC.cardPlay);
    // Launch a ghost of the card from its spot in the hand toward its target.
    const from = document.querySelector(`.hand [data-card-uid="${selected.uid}"]`)?.getBoundingClientRect();
    const toId = needsTarget(selectedDef.effects) ? aim : 'player';
    const to = toId ? document.querySelector(`[data-fx-id="${toId}"]`)?.getBoundingClientRect() : undefined;
    if (from && to) {
      const ghost: Ghost = { key: `${selected.uid}-${Date.now()}`, cardId: selected.cardId, from, dx: to.left + to.width / 2 - (from.left + from.width / 2), dy: to.top + to.height / 2 - (from.top + from.height / 2) };
      setGhosts((g) => [...g, ghost]);
      setTimeout(() => setGhosts((g) => g.filter((x) => x.key !== ghost.key)), GHOST_MS);
    }
    dispatch({ type: 'playCard', uid: selected.uid, targetId: aim });
    setSelectedUid(undefined);
  };

  const tapCard = (uid: string) => {
    if (uid === selectedUid && canPlay) playSelected();
    else setSelectedUid(uid);
  };

  const enemySize = alive.length > 1 || state.enemies.length > 1 ? 112 : 168;
  const noMoves =
    state.phase === 'player' &&
    !state.piles.hand.some((c) => {
      const def = CONTENT.cards[c.cardId];
      return !def.unplayable && def.cost <= state.resonance;
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
          ['statuses', [state.player, ...state.enemies].some((c) => Object.keys(c.statuses).length > 0)],
        ]}
      />

      <section className="enemies">
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
            <div className="detail-actions">
              <button className="ghost-btn" onClick={() => setSelectedUid(undefined)}>
                Cancel
              </button>
              <button className="primary-btn" disabled={!canPlay} onClick={playSelected}>
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
              affordable={!def.unplayable && def.cost <= state.resonance}
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
