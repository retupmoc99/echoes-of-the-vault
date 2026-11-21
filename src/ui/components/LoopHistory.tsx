/**
 * Archive → History: the most recent loops, newest first. Tap one to see how
 * it went: stats, relics, final deck and the Echo it left behind.
 */
import { useState } from 'react';
import { CONTENT } from '../../data';
import { BALANCE } from '../../data/balance';
import type { LoopRecord, SaveData } from '../../engine';
import { formatAgo } from '../format';

export function LoopHistory({ save }: { save: SaveData }) {
  const { loops, victories, deaths, history } = save.meta;
  const [open, setOpen] = useState<number>();

  return (
    <div className="history">
      <p className="record">
        Loops {loops} · Escaped {victories} · Fallen {deaths}
      </p>
      {history.length === 0 && <p className="record">No loops recorded yet. Every loop you close from now on is kept here.</p>}
      {history.map((rec) => (
        <HistoryRow key={rec.loop} rec={rec} open={open === rec.loop} onToggle={() => setOpen(open === rec.loop ? undefined : rec.loop)} />
      ))}
      {history.length >= BALANCE.history.limit && <p className="record">Only the last {BALANCE.history.limit} loops are kept.</p>}
    </div>
  );
}

function HistoryRow({ rec, open, onToggle }: { rec: LoopRecord; open: boolean; onToggle: () => void }) {
  const won = rec.result === 'victory';
  const shift = CONTENT.vaultShifts[rec.vaultShiftId]?.name ?? 'an unknown vault';
  const warden = CONTENT.classes[rec.classId]?.name ?? 'Warden';
  const trait = CONTENT.idle.traits.find((t) => t.id === rec.echoTraitId)?.name;
  const s = rec.stats;

  return (
    <article className={`history-row ${won ? 'won' : 'lost'} ${open ? 'open' : ''}`}>
      <button className="history-head" onClick={onToggle} aria-expanded={open}>
        <span className="history-title">
          Loop {rec.loop} · {won ? 'Escaped' : s.abandoned ? 'Abandoned' : `Fell at depth ${rec.depth}`}
        </span>
        <span className="history-sub">
          {warden} · {shift} · {formatAgo(Date.now() - rec.endedAt)}
        </span>
      </button>
      {open && (
        <div className="history-body">
          <dl className="history-stats">
            <dt>Fights won</dt>
            <dd>{s.fightsWon}</dd>
            <dt>Elites</dt>
            <dd>{s.elitesWon}</dd>
            <dt>Turns</dt>
            <dd>{s.turns}</dd>
            <dt>Damage taken</dt>
            <dd>{s.damageTaken}</dd>
            <dt>Peak Corruption</dt>
            <dd>{s.peakCorruption}</dd>
            <dt>Curses gained</dt>
            <dd>{s.cursesGained}</dd>
            <dt>Cards removed</dt>
            <dd>{s.cardsRemoved}</dd>
          </dl>
          <h4>Echo left behind</h4>
          <p className="record">
            {rec.echoName}
            {trait ? ` · ${trait}` : ''}
          </p>
          <h4>Relics</h4>
          <p className="record">{rec.relics.map((id) => CONTENT.relics[id]?.name ?? id).join(' · ') || 'None'}</p>
          <h4>Final deck ({rec.deck.length})</h4>
          <p className="record">{deckSummary(rec.deck)}</p>
        </div>
      )}
    </article>
  );
}

/** "Shard Strike ×4 · Ward Sigil ×3 · Overcharge", most copies first. */
function deckSummary(deck: string[]): string {
  const counts = new Map<string, number>();
  for (const id of deck) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || (CONTENT.cards[a[0]]?.name ?? a[0]).localeCompare(CONTENT.cards[b[0]]?.name ?? b[0]))
    .map(([id, n]) => `${CONTENT.cards[id]?.name ?? id}${n > 1 ? ` ×${n}` : ''}`)
    .join(' · ');
}
