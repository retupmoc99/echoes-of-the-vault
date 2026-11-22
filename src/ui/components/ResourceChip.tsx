/**
 * The Warden's resource, shown by the HP bar: the Shiftwright's Aspect, the
 * Pilgrim's Miles, the Tollkeeper's Toll. Tap to read what it does.
 */
import { CONTENT } from '../../data';
import { BALANCE } from '../../data/balance';
import type { Aspect } from '../../engine';

const ASPECT_INFO: Record<Aspect, { name: string; icon: string; hue: number; text: string }> = {
  drowned: { name: 'Drowned', icon: '💧', hue: 205, text: 'Bleed on foes does not fade.' },
  fractured: { name: 'Fractured', icon: '⚡', hue: 320, text: 'Your attacks deal +2. Lose 1 HP at the end of your turn.' },
  choir: { name: 'Choir', icon: '🔔', hue: 45, text: 'Draw 1 more card at the start of your turn.' },
};

interface Props {
  classId: string;
  aspect?: Aspect;
  miles?: number;
  toll?: number;
  onInspect: (text: string) => void;
}

export function ResourceChip({ classId, aspect, miles, toll, onInspect }: Props) {
  const res = CONTENT.classes[classId]?.resource;
  if (res === 'aspect' && aspect) {
    const a = ASPECT_INFO[aspect];
    return (
      <button className="resource-chip" style={{ ['--hue' as string]: a.hue }} onClick={() => onInspect(`${a.name}: ${a.text} Attune cards switch Aspect.`)}>
        {a.icon} {a.name}
      </button>
    );
  }
  if (res === 'miles') {
    return (
      <button className="resource-chip" style={{ ['--hue' as string]: 35 }} onClick={() => onInspect(`${miles ?? 0} Miles walked this loop. Every chamber is a Mile (elites 2). Road cards grow with your Miles.`)}>
        ⟿ {miles ?? 0} Miles
      </button>
    );
  }
  if (res === 'toll') {
    return (
      <button
        className="resource-chip"
        style={{ ['--hue' as string]: 48 }}
        onClick={() => onInspect(`${toll ?? 0} Toll. Foes pay it when they die; Pay cards spend it. Shrines: Tithe for ${BALANCE.toll.titheCost}. Rewards: reroll for ${BALANCE.toll.rerollCost}. Gone when the loop ends.`)}
      >
        ◉ {toll ?? 0} Toll
      </button>
    );
  }
  return null;
}
