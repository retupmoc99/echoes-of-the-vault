/**
 * Echo-Caller allies, between the enemies and you: name, HP, Ward, whether
 * it's Guarding, and the card it will play next. Tap one to read it.
 */
import { CONTENT } from '../../data';
import { BALANCE } from '../../data/balance';
import { allyNextCard, describeCard, livingAllies, type AllyState, type CombatState } from '../../engine';
import { useHitFx } from '../fx/useHitFx';
import { Floaters } from './Floaters';
import { HpBar } from './HpBar';
import { StatusChips } from './StatusChips';

export function AllyRow({ state, onInspect }: { state: CombatState; onInspect: (t: string) => void }) {
  const allies = livingAllies(state);
  if (!allies.length) return null;
  return (
    <section className="allies" aria-label="Your allies">
      {allies.map((ally) => (
        <AllyView key={ally.id} ally={ally} onInspect={onInspect} />
      ))}
    </section>
  );
}

function AllyView({ ally, onInspect }: { ally: AllyState; onInspect: (t: string) => void }) {
  const { floaters, flashing } = useHitFx(ally.id);
  const trait = CONTENT.idle.traits.find((t) => t.id === ally.traitId);
  const nextId = allyNextCard(ally, CONTENT);
  const next = nextId ? CONTENT.cards[nextId] : undefined;
  const firstName = ally.name.split(' ')[0];

  const read = () => {
    const parts = [ally.name];
    if (trait && ally.echoId) parts.push(`${trait.name}: ${trait.battleText ?? trait.description}`);
    if (ally.guard) parts.push('Guarding you: enemy attacks aimed at you hit it instead.');
    if (ally.turnsLeft !== undefined) parts.push(`Fades in ${ally.turnsLeft} turn${ally.turnsLeft === 1 ? '' : 's'}.`);
    const potency: number = BALANCE.allies.potency;
    const strength = trait?.battle?.fullStrength ? 'full' : potency === 0.5 ? 'half' : `${Math.round(potency * 100)}%`;
    parts.push(next ? `Next, at ${strength} strength: ${next.name}. ${describeCard(next)}` : 'Its next card is unknown (it will reshuffle).');
    onInspect(parts.join(' '));
  };

  return (
    // A div, not a button: it holds status chips, which are buttons themselves.
    <div
      data-fx-id={ally.id}
      role="button"
      tabIndex={0}
      className={`ally ${flashing ? 'hit' : ''} ${ally.guard ? 'guarding' : ''}`}
      onClick={read}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && read()}
    >
      <Floaters items={floaters} />
      <span className="ally-head">
        <span className="ally-name">{firstName}</span>
        {ally.guard && (
          <span className="ally-guard" aria-label="Guarding">
            ⛨
          </span>
        )}
      </span>
      <HpBar hp={ally.hp} maxHp={ally.maxHp} ward={ally.ward} />
      <span className="ally-next">{next ? `Next: ${next.name}` : 'Next: ?'}</span>
      <StatusChips statuses={ally.statuses} onInspect={onInspect} />
    </div>
  );
}
