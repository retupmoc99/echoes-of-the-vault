import { useState } from 'react';
import { CONTENT } from '../../data';
import type { RunState } from '../../engine';
import { CorruptionMeter } from './CorruptionMeter';
import { DeckSheet } from './DeckSheet';
import { HpBar } from './HpBar';
import { RelicBar } from './RelicBar';

interface Props {
  run: RunState;
  onMenu: () => void;
  onInspect: (text: string) => void;
}

/** The Awakening stage this loop runs at; tap to read what it changes. */
function AwakeningChip({ stage, onInspect }: { stage: number; onInspect: (text: string) => void }) {
  const stages = CONTENT.awakening.stages;
  const changes = stages
    .slice(1, stage + 1)
    .map((s) => s.danger)
    .join(' ');
  return (
    <button className="awakening-chip" onClick={() => onInspect(`The Sleeper: ${stages[stage].name}. ${changes}`)}>
      ☾ {stages[stage].name}
    </button>
  );
}

/** HP, deck, Corruption, Vault Shift and relics, on every out-of-combat run screen. */
export function RunHeader({ run, onMenu, onInspect }: Props) {
  const [deckOpen, setDeckOpen] = useState(false);
  const relics = run.relics.map((relicId) => ({ relicId, strain: 0, cracked: false }));
  const shift = CONTENT.vaultShifts[run.vaultShiftId];

  return (
    <header className="run-header">
      <div className="run-header-row">
        <button className="ghost-btn" onClick={onMenu}>
          ☰
        </button>
        <div className="run-hp">
          <HpBar hp={run.hp} maxHp={run.maxHp} ward={0} />
        </div>
        <button className="ghost-btn" onClick={() => setDeckOpen(true)}>
          ▤ {run.deck.length}
        </button>
      </div>
      <div className="run-header-row">
        <CorruptionMeter value={run.corruption} onInspect={onInspect} />
        <button className="shift-chip" onClick={() => onInspect(`${shift.name}. ${shift.text}`)}>
          ◈ {shift.name}
        </button>
      </div>
      <div className="run-header-row relic-row">
        <RelicBar relics={relics} onInspect={onInspect} />
        {run.awakeningStage > 0 && <AwakeningChip stage={run.awakeningStage} onInspect={onInspect} />}
      </div>
      {deckOpen && <DeckSheet deck={run.deck} title="Your deck" onClose={() => setDeckOpen(false)} />}
    </header>
  );
}
