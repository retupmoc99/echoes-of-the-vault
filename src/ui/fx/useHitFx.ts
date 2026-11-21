import { useEffect, useRef, useState } from 'react';
import { onFx } from './fxBus';

export interface Floater {
  id: number;
  text: string;
  kind: 'damage' | 'blocked' | 'ward' | 'bleed';
}

const FLOATER_MS = 900;
const FLASH_MS = 260;

/** Hit flash + floating numbers for one combatant. */
export function useHitFx(targetId: string) {
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [flashing, setFlashing] = useState(false);
  const nextId = useRef(0);

  useEffect(() => {
    const add = (text: string, kind: Floater['kind']) => {
      const id = nextId.current++;
      setFloaters((f) => [...f, { id, text, kind }]);
      setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), FLOATER_MS);
    };
    const flash = () => {
      setFlashing(true);
      setTimeout(() => setFlashing(false), FLASH_MS);
    };

    return onFx((e) => {
      if (e.type === 'attack' && e.targetId === targetId) {
        const through = e.amount - e.blocked;
        if (through > 0) {
          add(`-${through}`, 'damage');
          flash();
        } else add('blocked', 'blocked');
      } else if (e.type === 'hpLoss' && e.targetId === targetId) {
        add(`-${e.amount}`, 'bleed');
        flash();
      } else if (e.type === 'ward' && e.targetId === targetId) {
        add(`+${e.amount} ⬡`, 'ward');
      }
    });
  }, [targetId]);

  return { floaters, flashing };
}
