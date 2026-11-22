/**
 * Out-of-combat screens: Shrine, Relic Cache, Event, Reward and the loop's end.
 * They share one layout: header, a centred "chamber" panel, actions at the bottom.
 */
import { useState, type ReactNode } from 'react';
import { CONTENT } from '../../data';
import { BALANCE } from '../../data/balance';
import { NODE_INFO } from '../../data/nodeTypes';
import {
  canSearchShrine,
  chorusCost,
  createEcho,
  describeCard,
  describeRelic,
  loopDepth,
  optionAvailable,
  shrineHeal,
  traitOf,
  type NodeType,
  type RunAction,
  type RunState,
} from '../../engine';
import { ArtImg, artUrl, useScreenAtmosphere } from '../art';
import { HintSlot, type HintCandidate } from '../hints';
import { CardView } from '../components/CardView';
import { DeckSheet } from '../components/DeckSheet';
import { NodeIcon } from '../components/NodeIcon';
import { RunHeader } from '../components/RunHeader';

interface ScreenProps {
  run: RunState;
  error?: string;
  dispatch: (a: RunAction) => void;
  onMenu: () => void;
}

interface ChamberProps {
  run: RunState;
  type: NodeType;
  title: string;
  onMenu: () => void;
  error?: string;
  children: ReactNode;
  actions: ReactNode;
  /** Compact chambers hide the big icon to make room (rewards). */
  compact?: boolean;
  hints?: HintCandidate[];
  /** Background tried before the usual ones (the stairs). */
  bg?: string;
}

function Chamber({ run, type, title, onMenu, error, children, actions, compact, hints = [], bg }: ChamberProps) {
  const [info, setInfo] = useState<string>();
  useScreenAtmosphere(...(bg ? [bg] : []), ...(run.floor > 1 ? ['floor-2'] : []), `shift-${run.vaultShiftId}`, 'vault');
  return (
    <div className="screen">
      <RunHeader run={run} onMenu={onMenu} onInspect={setInfo} />
      <HintSlot candidates={[...hints, ['corruption', run.corruption > 0]]} />
      <section className={`chamber ${compact ? 'compact' : ''}`} style={{ ['--hue' as string]: NODE_INFO[type].hue }}>
        {!compact && (
          <div className="chamber-icon">
            <NodeIcon type={type} size={56} />
          </div>
        )}
        <h2>{title}</h2>
        {children}
      </section>
      <p className="info-line">{error ?? info}</p>
      <footer className="chamber-actions">{actions}</footer>
    </div>
  );
}

/** One relic as a selectable panel (Cache, elite reward). */
function RelicOffer({ relicId, selected, onSelect }: { relicId: string; selected?: boolean; onSelect?: () => void }) {
  const def = CONTENT.relics[relicId];
  const text = describeRelic(def);
  return (
    <button className={`relic-offer ${selected ? 'selected' : ''} ${def.corruption ? 'tainted' : ''}`} onClick={onSelect}>
      <ArtImg src={artUrl('relics', def.id, def.image)} className="relic-offer-art" size={72} fallback={null} />
      <span className="relic-offer-name">
        {def.name}
        {def.corruption ? <em className="taint-tag">✷ +{def.corruption} Corruption</em> : null}
      </span>
      {text.passive && <span>{text.passive}</span>}
      {text.overload && (
        <span>
          <strong>Overload:</strong> {text.overload}
        </span>
      )}
      <span className="flavor">{def.flavor}</span>
    </button>
  );
}

export function ShrineScreen({ run, error, dispatch, onMenu }: ScreenProps) {
  const [removing, setRemoving] = useState(false);
  const [tithing, setTithing] = useState(false);
  const canTithe = (run.toll ?? 0) >= BALANCE.toll.titheCost && run.deck.length > BALANCE.shrine.minDeckSize;
  const heal = Math.min(run.maxHp - run.hp, shrineHeal(run, CONTENT));
  const canRemove = run.deck.length > BALANCE.shrine.minDeckSize;

  return (
    <Chamber
      run={run}
      type="shrine"
      title="Shrine"
      hints={[['shrine', true]]}
      onMenu={onMenu}
      error={error}
      actions={
        <>
          <button className="primary-btn wide" onClick={() => dispatch({ type: 'shrineRest' })}>
            Rest · restore {heal} HP
          </button>
          <button className="ghost-btn wide" disabled={!canRemove} onClick={() => setRemoving(true)}>
            {canRemove ? 'Cut away a card' : 'Your deck is already thin'}
          </button>
          {CONTENT.classes[run.classId]?.resource === 'toll' && (
            <button className="ghost-btn wide" disabled={!canTithe} onClick={() => setTithing(true)}>
              Tithe · {BALANCE.toll.titheCost} Toll: rest and cut a card
            </button>
          )}
          {canSearchShrine(run) && (
            <button className="ghost-btn wide" onClick={() => dispatch({ type: 'shrineSearch' })}>
              Search · open a relic cache
            </button>
          )}
          {run.options.shrinePurge && (
            <button className="ghost-btn wide" disabled={run.corruption === 0} onClick={() => dispatch({ type: 'shrinePurge' })}>
              Purge in ash · lose {BALANCE.outpost.purgeAmount} Corruption
            </button>
          )}
        </>
      }
    >
      <p className="chamber-text">Cold water pools at the feet of a nameless saint. It asks nothing. It grants one thing.</p>
      {removing && (
        <DeckSheet
          deck={run.deck}
          title="Cut away a card"
          onClose={() => setRemoving(false)}
          pick={{ label: 'Remove', onPick: (deckIndex) => dispatch({ type: 'shrineRemove', deckIndex }) }}
        />
      )}
      {tithing && (
        <DeckSheet
          deck={run.deck}
          title="Tithe: rest, and cut a card"
          onClose={() => setTithing(false)}
          pick={{ label: 'Cut', onPick: (deckIndex) => dispatch({ type: 'shrineTithe', deckIndex }) }}
        />
      )}
    </Chamber>
  );
}

export function CacheScreen({ run, error, dispatch, onMenu }: ScreenProps) {
  const relicIds = run.node?.kind === 'cache' ? run.node.relicIds : [];
  const [picked, setPicked] = useState(0);
  const chosen = relicIds[picked];

  return (
    <Chamber
      run={run}
      type="cache"
      title={relicIds.length ? 'Relic Cache' : 'Plundered Cache'}
      onMenu={onMenu}
      error={error}
      compact={relicIds.length > 1}
      actions={
        <>
          {chosen && (
            <button className="primary-btn wide" onClick={() => dispatch({ type: 'takeRelic', index: picked })}>
              Take {CONTENT.relics[chosen].name}
            </button>
          )}
          <button className="ghost-btn wide" onClick={() => dispatch({ type: 'leave' })}>
            {relicIds.length ? 'Leave them sealed' : 'Move on'}
          </button>
        </>
      }
    >
      {relicIds.length ? (
        <>
          <p className="chamber-text">Two seals. Breaking one fuses the other shut.</p>
          <div className="offers">
            {relicIds.map((id, i) => (
              <RelicOffer key={id} relicId={id} selected={i === picked} onSelect={() => setPicked(i)} />
            ))}
          </div>
        </>
      ) : (
        <p className="chamber-text">Someone came before you. Perhaps you did, in another loop.</p>
      )}
    </Chamber>
  );
}

export function EventScreen({ run, error, dispatch, onMenu }: ScreenProps) {
  const [picking, setPicking] = useState(true);
  if (run.node?.kind !== 'event') return null;
  const event = CONTENT.events[run.node.eventId];
  const resolved = run.node.resolved;
  // The event asked you to choose cards to give up; leaving waits for that.
  const toRemove = run.node.toRemove ?? 0;

  return (
    <Chamber
      run={run}
      type="event"
      title={event.title}
      hints={[['event', true]]}
      onMenu={onMenu}
      error={error}
      compact
      actions={
        resolved && toRemove > 0 ? (
          <button className="primary-btn wide" onClick={() => setPicking(true)}>
            Choose {toRemove === 1 ? 'a card' : `${toRemove} cards`} to give up
          </button>
        ) : resolved ? (
          <button className="primary-btn wide" onClick={() => dispatch({ type: 'leave' })}>
            Move on
          </button>
        ) : (
          event.options.map((option, index) => {
            const ok = optionAvailable(run, option);
            return (
              <button key={index} className="option-btn" disabled={!ok} onClick={() => dispatch({ type: 'chooseOption', index })}>
                <span className="option-label">{option.label}</span>
                <span className="option-hint">{ok ? option.hint : `${option.hint} (You cannot pay this.)`}</span>
              </button>
            );
          })
        )
      }
    >
      <p className="chamber-text">{event.text}</p>
      {resolved && (
        <p className="chamber-text outcome">
          <strong>{event.options[resolved.optionIndex].label}.</strong> {resolved.text}
        </p>
      )}
      {resolved && toRemove > 0 && picking && (
        <DeckSheet
          // Remount after each removal so the selection clears.
          key={run.deck.length}
          deck={run.deck}
          title={toRemove === 1 ? 'Give up a card' : `Give up ${toRemove} cards`}
          onClose={() => setPicking(false)}
          pick={{ label: 'Give up', onPick: (deckIndex) => dispatch({ type: 'removeCard', deckIndex }) }}
        />
      )}
    </Chamber>
  );
}

export function RewardScreen({ run, error, dispatch, onMenu }: ScreenProps) {
  const [picked, setPicked] = useState<number | 'tainted'>();
  if (run.node?.kind !== 'reward') return null;
  const node = run.node;
  const pickedId = picked === 'tainted' ? node.tainted : picked !== undefined ? node.cards[picked] : undefined;
  const pickedDef = pickedId ? CONTENT.cards[pickedId] : undefined;

  return (
    <Chamber
      run={run}
      type={node.relicId ? 'elite' : 'fight'}
      title="Spoils"
      hints={[['reward', true]]}
      onMenu={onMenu}
      error={error}
      compact
      actions={
        <>
          {!node.cardTaken && (
            <button className="primary-btn wide" disabled={!pickedDef} onClick={() => picked !== undefined && dispatch({ type: 'pickCard', choice: picked })}>
              {pickedDef ? `Take ${pickedDef.name}${picked === 'tainted' ? ` · +${BALANCE.corruption.taintedCardCost} Corruption` : ''}` : 'Choose a card'}
            </button>
          )}
          {!node.cardTaken && run.options.rewardRerolls <= 0 && (run.toll ?? 0) >= BALANCE.toll.rerollCost && (
            <button
              className="ghost-btn wide"
              onClick={() => {
                setPicked(undefined);
                dispatch({ type: 'rerollReward' });
              }}
            >
              Pay {BALANCE.toll.rerollCost} Toll · reroll these cards
            </button>
          )}
          {!node.cardTaken && run.options.rewardRerolls > 0 && (
            <button
              className="ghost-btn wide"
              onClick={() => {
                setPicked(undefined);
                dispatch({ type: 'rerollReward' });
              }}
            >
              Second Sight · reroll these cards
            </button>
          )}
          <button className="ghost-btn wide" onClick={() => dispatch({ type: 'leave' })}>
            {node.cardTaken ? 'Leave the relic' : 'Take nothing'}
          </button>
        </>
      }
    >
      {!node.cardTaken && (
        <>
          <div className="reward-cards">
            {node.cards.map((cardId, i) => (
              <CardView key={i} card={{ uid: `rw${i}`, cardId }} variant="hand" affordable selected={picked === i} onClick={() => setPicked(i)} />
            ))}
          </div>
          {node.tainted && (
            <div className="tainted-offer">
              <span className="taint-tag">✷ Tainted · +{BALANCE.corruption.taintedCardCost} Corruption</span>
              <CardView card={{ uid: 'rwt', cardId: node.tainted }} variant="hand" affordable selected={picked === 'tainted'} onClick={() => setPicked('tainted')} />
            </div>
          )}
          <p className="reward-detail">{pickedDef ? `${pickedDef.name}: ${describeCard(pickedDef)}` : 'Tap a card to read it.'}</p>
        </>
      )}
      {node.relicId && !node.relicTaken && (
        <div className="offers">
          <RelicOffer relicId={node.relicId} />
          <button className="primary-btn" onClick={() => dispatch({ type: 'takeRelic' })}>
            Take {CONTENT.relics[node.relicId].name}
          </button>
        </div>
      )}
    </Chamber>
  );
}

/** The Echo this loop will leave behind (same seed, so the same Echo). */
function EchoPreview({ run }: { run: RunState }) {
  const echo = createEcho(run, 0, 0, CONTENT);
  const trait = traitOf(echo, CONTENT);
  return (
    <p className="echo-preview">
      Something of this loop lingers: <strong>{echo.name}</strong>, {trait.name.toLowerCase()}. {trait.description}
    </p>
  );
}

/** Echo-Caller: what each Called Echo will pay when the loop closes. */
function ChorusCosts({ run }: { run: RunState }) {
  const called = (run.chorus ?? []).filter((m) => m.calls || m.falls);
  if (!called.length) return null;
  return (
    <ul className="chorus-costs" aria-label="What your Calls cost">
      {called.map((m) => {
        const cost = chorusCost(m, run);
        const lost = m.stability - cost <= 0;
        const fell = m.falls ? `, fell ${m.falls === 1 ? 'once' : `${m.falls}×`}` : '';
        return (
          <li key={m.echoId} className={lost ? 'lost' : ''}>
            <strong>{m.name.split(' ')[0]}</strong>: called {m.calls}×{fell} · −{cost} stability{lost ? '. It Unravels.' : ''}
          </li>
        );
      })}
    </ul>
  );
}

/** After the floor-1 boss: Escape now, or Descend to floor 2 (the Deeper Vault). */
export function StairsScreen({ run, error, dispatch, onMenu }: ScreenProps) {
  const D = BALANCE.deep;
  const held = run.heldShards ?? 0;
  const heal = Math.min(run.maxHp - run.hp, Math.round(run.maxHp * D.stairsHeal));
  return (
    <Chamber
      run={run}
      type="boss"
      title="The Stairs"
      bg="stairs"
      hints={[['stairs', true]]}
      onMenu={onMenu}
      error={error}
      compact
      actions={
        <>
          <button className="primary-btn wide" onClick={() => dispatch({ type: 'escape' })}>
            Escape now{held ? ` · +${held} Shards` : ' · a win'}
          </button>
          <button className="ghost-btn wide descend-btn" onClick={() => dispatch({ type: 'descend' })}>
            Descend · heal {heal} HP
          </button>
        </>
      }
    >
      <p className="chamber-text">Behind the broken Lock, stairs go down into wet dark. Something at the bottom is breathing slowly.</p>
      <ul className="stairs-rules">
        <li>Floor 2: {D.rows} rows, harsher fights, richer spoils, a new boss. Echoes born there are Deepborn.</li>
        <li>The Weight: lose {D.weightDamage} HP each turn the enemies broke all your Ward.</li>
        <li>
          Escape it: +{held * 2 + D.escapeShards} Shards. Die there: the loop is a death{held ? ` (you keep ${Math.floor(held / 2)})` : ''}.
        </li>
      </ul>
    </Chamber>
  );
}

export function RunEndScreen({ run, onDone }: { run: RunState; onDone: () => void }) {
  const won = run.result === 'victory';
  const unmade = won && run.seenEncounters.includes('the-sleeper');
  const s = run.stats;
  const depth = loopDepth(run);
  const omen = run.omenId ? CONTENT.omens?.[run.omenId] : undefined;
  const D = BALANCE.daily;
  const rows: [string, string | number][] = [
    ...(run.daily ? ([['Daily', `${run.daily}${omen ? ` · ${omen.name}` : ''}`]] as [string, string][]) : []),
    ['Warden', CONTENT.classes[run.classId].name],
    ['Vault Shift', CONTENT.vaultShifts[run.vaultShiftId].name],
    ['Depth reached', `${depth} / ${(run.depthBase ?? 0) + run.map.rows + 1}${run.floor > 1 ? ' · floor 2' : ''}`],
    ['Fights won', s.fightsWon],
    ['Elites slain', s.elitesWon],
    ['Peak Corruption', s.peakCorruption],
    ['Curses taken', s.cursesGained],
    ['Damage taken', s.damageTaken],
    ['Deck', `${run.deck.length} cards`],
  ];

  return (
    <main className={`run-end ${won ? 'won' : 'lost'}`}>
      <HintSlot candidates={[['run-end', true]]} />
      <div className="title-rune" aria-hidden>
        {won ? 'ᛞ' : 'ᛉ'}
      </div>
      <h1>{unmade && run.floor === 1 ? 'The Sleeper is unmade.' : won && run.stats.deepBossWon ? 'You climb out of the Well.' : won ? 'The Lock is broken.' : s.abandoned ? 'You let go.' : run.daily ? 'The dream ends.' : 'The loop closes.'}</h1>
      <p className="subtitle">
        {unmade
          ? 'It begins to dream again at once. A new cycle.'
          : won
            ? 'The way down lies open. The loop pulls you back regardless.'
            : 'You wake at the outpost, gasping. The vault remembers.'}
      </p>
      <dl className="stats">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {run.daily ? (
        <p className="subtitle">
          The Daily leaves no Echo. +{D.finishShards + (won ? D.escapeShards : 0)} Shards. Share the result from the Descend tab.
        </p>
      ) : (
        <>
          <ChorusCosts run={run} />
          <EchoPreview run={run} />
        </>
      )}
      <button className="primary-btn wide" onClick={onDone}>
        Return to the outpost
      </button>
    </main>
  );
}
