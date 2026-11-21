import { BALANCE } from '../../data/balance';
import { corruptionTier } from '../../engine';

const C = BALANCE.corruption;
const MAX_SHOWN = C.thresholds[C.thresholds.length - 1] + 3;

/** Run-wide Corruption bar with threshold ticks. Tap for what the current tier means. */
export function CorruptionMeter({ value, onInspect }: { value: number; onInspect: (t: string) => void }) {
  const tier = corruptionTier(value);
  const next = C.thresholds.find((t) => value < t);
  const explain = () =>
    onInspect(
      `Corruption ${value}. Tier ${tier}: enemies +${Math.round(tier * C.enemyHpPerTier * 100)}% HP and +${tier * C.enemyDamagePerTier} damage; rare cards more common.` +
        (next !== undefined ? ` At ${next}, it deepens${C.curseAtTiers.includes((tier + 1) as 2 | 3) ? ' and plants a curse' : ''}.` : ''),
    );

  return (
    <button className={`corruption tier-${tier}`} onClick={explain} aria-label={`Corruption ${value}`}>
      <span className="corruption-label">✷ {value}</span>
      <span className="corruption-bar">
        <span className="corruption-fill" style={{ width: `${Math.min(100, (value / MAX_SHOWN) * 100)}%` }} />
        {C.thresholds.map((t) => (
          <i key={t} className={value >= t ? 'crossed' : ''} style={{ left: `${(t / MAX_SHOWN) * 100}%` }} />
        ))}
      </span>
    </button>
  );
}
