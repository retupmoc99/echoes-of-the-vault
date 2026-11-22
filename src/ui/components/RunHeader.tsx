import { useState } from 'react';
import { CONTENT } from '../../data';
import { BALANCE } from '../../data/balance';
import type { RunState } from '../../engine';
import { CorruptionMeter } from './CorruptionMeter';
import { DeckSheet } from './DeckSheet';
import { HpBar } from './HpBar';
import { RelicBar } from './RelicBar';
import { ResourceChip } from './ResourceChip';

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
  const omen = run.omenId ? CONTENT.omens?.[run.omenId] : undefined;

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
        <ResourceChip classId={run.classId} miles={run.miles} toll={run.toll} onInspect={onInspect} />
        {run.floor > 1 && (
          <button className="omen-chip floor-chip" onClick={() => onInspect(`Floor 2. The Weight: if enemies break through all your Ward, you lose ${BALANCE.deep.weightDamage} HP as your turn starts.`)}>
            ⇩ Floor 2
          </button>
        )}
        {omen && (
          <button className="omen-chip" onClick={() => onInspect(`Daily Omen: ${omen.name}. ${omen.text}`)}>
            ☀ {omen.name}
          </button>
        )}
      </div>
      {deckOpen && <DeckSheet deck={run.deck} title="Your deck" onClose={() => setDeckOpen(false)} />}
    </header>
  );
}
