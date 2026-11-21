import type { IdleReport } from '../../engine';
import { BALANCE } from '../../data/balance';
import { formatDuration } from '../format';

/** "While you were away" summary, shown after a long absence. */
export function AwayReport({ report, onClose }: { report: IdleReport; onClose: () => void }) {
  const lines: string[] = [];
  if (report.shards > 0) lines.push(`Your diggers brought up ${report.shards} Shards.`);
  for (const r of report.researched) lines.push(r.kind === 'card' ? `Research revealed a card: ${r.name}.` : `A lore fragment recovered: ${r.name}.`);
  if (report.scoutRevealed.includes('shift')) lines.push('Your Scouts have read the next Vault Shift.');
  if (report.scoutRevealed.includes('map')) lines.push('Your Scouts have mapped the way in.');
  for (const u of report.unraveled) lines.push(`${u.name} Unraveled while working. Nothing remains.`);

  return (
    <div className="overlay">
      <div className="overlay-box away">
        <h2>While you were away</h2>
        <p className="subtitle">
          {formatDuration(report.elapsedMs)} passed at the outpost{report.capped ? ` (Echoes work at most ${BALANCE.idle.offlineCapHours}h unattended)` : ''}.
        </p>
        <ul>
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <button className="primary-btn" onClick={onClose}>
          Return to the outpost
        </button>
      </div>
    </div>
  );
}
