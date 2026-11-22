/**
 * The Awakening meter on the Descend tab: stage, progress, what each stage
 * has changed, what the next one brings, and the Lull button.
 */
import { CONTENT } from '../../data';
import { BALANCE } from '../../data/balance';
import { AWAKE, canPushBack, lullCost, nextThreshold, type SaveData } from '../../engine';

interface Props {
  save: SaveData;
  onLull: () => void;
}

export function AwakeningPanel({ save, onLull }: Props) {
  const A = BALANCE.awakening;
  const a = save.world.awakening;
  const stages = CONTENT.awakening.stages;
  const current = stages[a.stage];
  const next = nextThreshold(a);
  const scale = A.thresholds[A.thresholds.length - 1];
  const cost = lullCost(a);
  const awake = a.stage >= AWAKE;
  const canLull = canPushBack(a) && Math.floor(save.outpost.shards) >= cost;
  const cycleBonus = Math.round((Math.min(a.cycle, A.cycleCap) - 1) * A.cycleHpBonus * 100);

  return (
    <section className={`awakening stage-${a.stage}`} aria-label="The Awakening">
      <header className="awakening-head">
        <strong>{a.stage === 0 ? 'The Sleeper is dormant' : `The Sleeper: ${current.name}`}</strong>
        <span>
          {a.cycle > 1 && `Cycle ${a.cycle} · `}
          {Math.floor(a.progress)} / {scale}
        </span>
      </header>
      <div className="awakening-bar" role="meter" aria-valuemin={0} aria-valuemax={scale} aria-valuenow={Math.floor(a.progress)}>
        <span style={{ width: `${(a.progress / scale) * 100}%` }} />
        {A.thresholds.map((t, i) => (
          <i key={t} className={i + 1 > A.maxStage ? 'unbuilt' : ''} style={{ left: `${(t / scale) * 100}%` }} />
        ))}
      </div>

      {a.stage > 0 && (
        <ul className="awakening-effects">
          {stages.slice(1, a.stage + 1).map((s) => (
            <li key={s.name}>
              <span className="danger">{s.danger}</span> <span className="reward">{s.reward}</span>
            </li>
          ))}
        </ul>
      )}

      {awake ? (
        <p className="awakening-next">
          It waits at the bottom of every loop now. <strong>Unmake it</strong> to end the cycle.
        </p>
      ) : (
        next !== null && (
          <p className="awakening-next">
            At {next}, <strong>{stages[a.stage + 1].name}</strong>: <span className="danger">{stages[a.stage + 1].danger}</span>{' '}
            <span className="reward">{stages[a.stage + 1].reward}</span>
          </p>
        )
      )}
      {cycleBonus > 0 && <p className="record">Cycle {a.cycle}: enemies have {cycleBonus}% more HP.</p>}
      <p className="record">It stirs with every loop you close and every hour your Echoes work. Never while you are away.</p>

      {/* Lulling only matters once a stage has been reached. */}
      {(a.stage > 0 || a.progress >= A.thresholds[0] - A.lull.amount) && (
        <button className="ghost-btn wide" disabled={!canLull} onClick={onLull}>
          {awake ? 'It is awake. It will not be lulled.' : a.progress <= 0 ? 'The Sleeper is still' : `Lull it (−${A.lull.amount}) · ${cost} Shards`}
        </button>
      )}
    </section>
  );
}
