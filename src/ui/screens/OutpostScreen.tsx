/**
 * The Outpost: home between loops. Four tabs, switched from the bottom bar:
 *   Descend  — the next loop (Shift, scouted map, kit) or the loop in progress
 *   Echoes   — assign tasks, keep or release Echoes
 *   Works    — spend Shards on Outpost unlocks, follow Research
 *   Archive  — records and recovered lore
 */
import { useState } from 'react';
import { CONTENT } from '../../data';
import { BALANCE } from '../../data/balance';
import { NODE_INFO } from '../../data/nodeTypes';
import { researchComplete, researchCost, scoutInfo, traitOf, type OutpostAction, type SaveData } from '../../engine';
import { EchoCard } from '../components/EchoCard';
import { hapticsSupported } from '../fx/haptics';
import { backgroundFor } from '../art';
import { NodeIcon } from '../components/NodeIcon';

type Tab = 'descend' | 'echoes' | 'works' | 'archive';

interface Props {
  save: SaveData;
  error?: string;
  notice?: string;
  outpost: (a: OutpostAction) => boolean;
  onSettings: (patch: Partial<SaveData['settings']>) => void;
  onEnterRun: () => void;
  onAbandon: () => void;
}

export function OutpostScreen({ save, error, notice, outpost, onSettings, onEnterRun, onAbandon }: Props) {
  const [tab, setTab] = useState<Tab>(save.pendingEcho ? 'echoes' : 'descend');
  const [info, setInfo] = useState<string>();
  const shards = Math.floor(save.outpost.shards);
  const bg = backgroundFor('outpost');

  return (
    <div className={`screen outpost ${bg.className}`} style={bg.style}>
      <header className="outpost-head">
        <h1>The Outpost</h1>
        <span className="shards" aria-label={`${shards} Shards`}>
          ◆ {shards}
        </span>
      </header>

      <section className="outpost-body">
        {notice && <p className="notice">{notice}</p>}
        {tab === 'descend' && <DescendTab save={save} outpost={outpost} onEnterRun={onEnterRun} onAbandon={onAbandon} />}
        {tab === 'echoes' && <EchoesTab save={save} outpost={outpost} onInspect={setInfo} />}
        {tab === 'works' && <WorksTab save={save} outpost={outpost} />}
        {tab === 'archive' && <ArchiveTab save={save} onSettings={onSettings} />}
      </section>

      <p className="info-line">{error ?? info}</p>

      <nav className="tabbar">
        {(
          [
            ['descend', 'Descend'],
            ['echoes', `Echoes${save.pendingEcho ? ' •' : ''}`],
            ['works', 'Works'],
            ['archive', 'Archive'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? 'active' : ''}
            onClick={() => {
              setTab(id);
              setInfo(undefined);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ───────────────────────────── Descend ─────────────────────────────

function DescendTab({ save, outpost, onEnterRun, onAbandon }: Omit<Props, 'error' | 'notice' | 'onSettings'>) {
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const run = save.run;

  if (run) {
    const shift = CONTENT.vaultShifts[run.vaultShiftId];
    return (
      <div className="panel center">
        <div className="title-rune small" aria-hidden>
          ᛟ
        </div>
        {run.phase === 'ended' ? (
          <>
            <p className="chamber-text">The loop has closed. Its Echo waits to be gathered.</p>
            <button className="primary-btn wide" onClick={onEnterRun}>
              See how the loop ended
            </button>
          </>
        ) : (
          <>
            <p className="chamber-text">
              You are still in the vault. {shift.name}. Corruption {run.corruption}.
            </p>
            <button className="primary-btn wide" onClick={onEnterRun}>
              Continue the loop
            </button>
            {confirmAbandon ? (
              <button className="ghost-btn wide danger" onClick={onAbandon}>
                Tap again to let this loop die
              </button>
            ) : (
              <button className="ghost-btn wide" onClick={() => setConfirmAbandon(true)}>
                Abandon the loop
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  const next = save.nextLoop;
  const scout = scoutInfo(save, CONTENT);
  const shift = next ? CONTENT.vaultShifts[next.vaultShiftId] : undefined;
  const cls = CONTENT.classes['relic-breaker'];
  const kits = cls.kits.filter((k) => !k.unlock || save.outpost.unlocks.includes(k.unlock));
  const I = BALANCE.idle;
  const scoutPct = Math.min(100, (scout.scouting / I.scoutMapHours) * 100);

  return (
    <div className="panel">
      <h2 className="panel-title">The next loop</h2>
      <div className="next-shift">
        {scout.shiftKnown && shift ? (
          <>
            <strong>◈ {shift.name}</strong>
            <span>{shift.text}</span>
          </>
        ) : (
          <>
            <strong>◈ The Shift is unknown</strong>
            <span>Send an Echo to Scout: {I.scoutShiftHours}h reveals the Shift, {I.scoutMapHours}h the way in.</span>
          </>
        )}
        <div className="scout-bar" aria-label="Scouting progress">
          <span style={{ width: `${scoutPct}%` }} />
          <i style={{ left: `${(I.scoutShiftHours / I.scoutMapHours) * 100}%` }} />
        </div>
      </div>

      {scout.rows.length > 0 && (
        <div className="scout-map" aria-label="Scouted map">
          {[...scout.rows].reverse().map((row, i) => (
            <div key={i} className="scout-row">
              {row.map((n) => (
                <span key={n.id} className="scout-node" style={{ ['--hue' as string]: NODE_INFO[n.type].hue }} title={NODE_INFO[n.type].name}>
                  <NodeIcon type={n.type} size={18} />
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {save.outpost.unlocks.includes('shift-bell') && next && (
        <button className="ghost-btn wide" disabled={next.shiftRerolled} onClick={() => outpost({ type: 'ringBell' })}>
          {next.shiftRerolled ? 'The bell has rung for this loop' : 'Ring the Shift Bell (reroll the Shift)'}
        </button>
      )}

      {kits.length > 1 && (
        <div className="kit-picker">
          {kits.map((k) => (
            <button
              key={k.id}
              className={`kit ${save.outpost.kitId === k.id ? 'active' : ''}`}
              onClick={() => outpost({ type: 'selectKit', kitId: k.id })}
            >
              <strong>{k.name}</strong>
              <span>{k.description}</span>
            </button>
          ))}
        </div>
      )}

      <button className="primary-btn wide descend" onClick={() => outpost({ type: 'startLoop' }) && onEnterRun()}>
        Descend
      </button>
    </div>
  );
}

// ───────────────────────────── Echoes ─────────────────────────────

function EchoesTab({ save, outpost, onInspect }: { save: SaveData; outpost: Props['outpost']; onInspect: (t: string) => void }) {
  const pending = save.pendingEcho;
  const full = save.echoes.length >= BALANCE.echoes.slots;
  const researchDone = researchComplete(save, CONTENT);
  const emptySlots = BALANCE.echoes.slots - save.echoes.length;

  return (
    <div className="panel">
      {pending && (
        <div className="pending-echo">
          <p>
            <strong>A new Echo lingers: {pending.name}</strong> ({traitOf(pending, CONTENT).name}).{' '}
            {full ? 'Every slot is taken. Release one to keep it, or let it fade.' : ''}
          </p>
          <div className="row">
            {!full && (
              <button className="primary-btn" onClick={() => outpost({ type: 'keepPending' })}>
                Keep it
              </button>
            )}
            <button className="ghost-btn" onClick={() => outpost({ type: 'releasePending' })}>
              Let it fade
            </button>
          </div>
        </div>
      )}

      {save.echoes.map((echo) => (
        <EchoCard
          key={echo.id}
          echo={echo}
          researchDone={researchDone}
          onAssign={(task) => outpost({ type: 'assign', echoId: echo.id, task })}
          onRelease={() => outpost({ type: 'releaseEcho', echoId: echo.id })}
          onReplace={pending && full ? () => outpost({ type: 'keepPending', replaceId: echo.id }) : undefined}
          onInspect={onInspect}
        />
      ))}

      {Array.from({ length: emptySlots }, (_, i) => (
        <div key={i} className="echo-slot-empty">
          An empty slot. Every loop, won or lost, leaves an Echo behind.
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────── Works ─────────────────────────────

function WorksTab({ save, outpost }: { save: SaveData; outpost: Props['outpost'] }) {
  const shards = Math.floor(save.outpost.shards);
  const r = save.outpost.research;
  const total = CONTENT.idle.research.length;
  const done = r.completed >= total;
  const cost = done ? 1 : researchCost(r.completed);

  return (
    <div className="panel">
      <h2 className="panel-title">Research</h2>
      <div className="research">
        <span>{done ? 'Everything the Echoes can learn is known.' : `Discovery ${r.completed + 1} of ${total}`}</span>
        {!done && (
          <div className="scout-bar">
            <span style={{ width: `${(r.progress / cost) * 100}%` }} />
          </div>
        )}
      </div>

      <h2 className="panel-title">Works</h2>
      {CONTENT.idle.unlocks.map((u) => {
        const owned = save.outpost.unlocks.includes(u.id);
        return (
          <div key={u.id} className={`work ${owned ? 'owned' : ''}`}>
            <div>
              <strong>{u.name}</strong>
              <span>{u.description}</span>
              <em>{u.flavor}</em>
            </div>
            <button className="primary-btn" disabled={owned || shards < u.cost} onClick={() => outpost({ type: 'buy', unlockId: u.id })}>
              {owned ? 'Built' : `◆ ${u.cost}`}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────── Archive ─────────────────────────────

function ArchiveTab({ save, onSettings }: { save: SaveData; onSettings: Props['onSettings'] }) {
  const { loops, victories, deaths } = save.meta;
  return (
    <div className="panel">
      <h2 className="panel-title">Settings</h2>
      <button className="ghost-btn wide setting" onClick={() => onSettings({ haptics: !save.settings.haptics })}>
        <span>Haptics</span>
        <span>{hapticsSupported() ? (save.settings.haptics ? 'On' : 'Off') : 'Not supported on this device'}</span>
      </button>
      <h2 className="panel-title">Records</h2>
      <p className="record">
        Loops {loops} · Escaped {victories} · Fallen {deaths}
      </p>

      <h2 className="panel-title">Recovered cards</h2>
      <p className="record">
        {save.outpost.cards.length ? save.outpost.cards.map((id) => CONTENT.cards[id].name).join(' · ') : 'None yet. Set an Echo to Research.'}
      </p>

      <h2 className="panel-title">Fragments</h2>
      {save.outpost.lore.length === 0 && <p className="record">The vault has told you nothing. Yet.</p>}
      {save.outpost.lore.map((id) => {
        const l = CONTENT.idle.lore[id];
        return (
          <blockquote key={id} className="lore">
            <strong>{l.title}</strong>
            <p>{l.text}</p>
          </blockquote>
        );
      })}
    </div>
  );
}
