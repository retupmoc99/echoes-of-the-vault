import { useEffect, useState } from 'react';
import { CONTENT } from '../../data';
import { ArtImg, artUrl } from '../art';
import { onFx } from '../fx/fxBus';
import { enemyName, previewIntent, type CombatState, type EnemyState } from '../../engine';
import { useHitFx } from '../fx/useHitFx';
import { Floaters } from './Floaters';
import { HpBar } from './HpBar';
import { IntentBadge } from './IntentBadge';
import { Sigil } from './Sigil';
import { StatusChips } from './StatusChips';

/** True for a moment when this enemy takes its turn (drives the lunge animation). */
function useActing(enemyId: string): boolean {
  const [acting, setActing] = useState(false);
  useEffect(
    () =>
      onFx((e) => {
        if (e.type === 'enemyMove' && e.enemyId === enemyId) {
          setActing(true);
          setTimeout(() => setActing(false), 360);
        }
      }),
    [enemyId],
  );
  return acting;
}

interface Props {
  state: CombatState;
  enemy: EnemyState;
  targeted: boolean;
  size: number;
  onSelect: () => void;
  onInspect: (text: string) => void;
}

export function EnemyView({ state, enemy, targeted, size, onSelect, onInspect }: Props) {
  const def = CONTENT.enemies[enemy.defId];
  const { floaters, flashing } = useHitFx(enemy.id);
  const acting = useActing(enemy.id);
  const dead = enemy.hp <= 0;
  const affix = enemy.affix ? CONTENT.awakening.affixes[enemy.affix] : undefined;
  // A boss phase renames it ("The Lock, Weeping Open").
  const name = enemyName(enemy, CONTENT);

  return (
    <div
      data-fx-id={enemy.id}
      className={`enemy ${targeted && !dead ? 'targeted' : ''} ${flashing ? 'hit' : ''} ${dead ? 'dead' : ''} ${acting ? 'acting' : ''}`}
      onClick={() => {
        if (dead) return;
        onSelect();
        onInspect(affix ? `${affix.name} ${name}. ${affix.description} ${def.flavor}` : `${name}. ${def.flavor}`);
      }}
    >
      <div className="enemy-intent">{!dead && <IntentBadge intent={previewIntent(state, enemy, CONTENT)} onInspect={onInspect} />}</div>
      <div className="enemy-sigil" style={{ ['--hue' as string]: def.sigil.hue }}>
        <ArtImg src={artUrl('enemies', def.id, def.image)} className="enemy-art" size={size} fallback={<Sigil spec={def.sigil} size={size} />} />
        <Floaters items={floaters} />
      </div>
      <div className="enemy-name">{affix ? `${affix.name} ${name}` : name}</div>
      <HpBar hp={enemy.hp} maxHp={enemy.maxHp} ward={enemy.ward} />
      <StatusChips statuses={enemy.statuses} onInspect={onInspect} />
    </div>
  );
}
