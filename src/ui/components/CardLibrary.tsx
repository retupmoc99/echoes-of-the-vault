/**
 * Archive → Cards: every card in the game, by Warden, with its unlock state.
 * Tap a card to read it in full.
 */
import { useMemo, useState } from 'react';
import { CONTENT } from '../../data';
import type { CardDef, CardType, SaveData } from '../../engine';
import { CARD_TYPE_LABEL } from '../theme';
import { CardView } from './CardView';

const CURSES = 'curses';
const RARITY_ORDER: Record<string, number> = { starter: 0, common: 1, uncommon: 2, rare: 3, curse: 4 };
const RARITY_LABEL: Record<string, string> = { starter: 'Starter', common: 'Common', uncommon: 'Uncommon', rare: 'Rare', curse: 'Curse' };

type Status = 'known' | 'research' | 'warden';
const STATUS_LABEL: Record<Status, string> = {
  known: '',
  research: 'Locked: an Echo must Research it',
  warden: 'Locked: this Warden is not yet free',
};

/** Every card a class can ever hold: starting decks (all kits) and its reward pool. */
function cardsOf(classId: string): string[] {
  const cls = CONTENT.classes[classId];
  return [...new Set([...cls.starterDeck, ...cls.kits.flatMap((k) => k.deck), ...cls.cardPool])];
}

function sortCards(ids: string[]): CardDef[] {
  return ids
    .map((id) => CONTENT.cards[id])
    .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.name.localeCompare(b.name));
}

export function CardLibrary({ save }: { save: SaveData }) {
  const classIds = Object.keys(CONTENT.classes);
  const [group, setGroup] = useState<string>(save.outpost.classId ?? classIds[0]);
  const [type, setType] = useState<CardType | 'all'>('all');
  const [open, setOpen] = useState<string>();

  const cards = useMemo(() => {
    if (group === CURSES) return sortCards(Object.values(CONTENT.cards).filter((c) => c.type === 'curse').map((c) => c.id));
    return sortCards(cardsOf(group).filter((id) => CONTENT.cards[id].type !== 'curse'));
  }, [group]);
  const types = [...new Set(cards.map((c) => c.type))];
  const shown = type === 'all' ? cards : cards.filter((c) => c.type === type);

  const statusOf = (def: CardDef): Status => {
    if (group !== CURSES) {
      const cls = CONTENT.classes[group];
      if (cls.unlock && !save.outpost.unlocks.includes(cls.unlock)) return 'warden';
      if (cls.lockedCards.includes(def.id) && !save.outpost.cards.includes(def.id)) return 'research';
    }
    return 'known';
  };
  const known = cards.filter((c) => statusOf(c) === 'known').length;

  return (
    <div className="library">
      <div className="segmented" role="tablist" aria-label="Warden">
        {[...classIds, CURSES].map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={group === id}
            className={group === id ? 'active' : ''}
            onClick={() => {
              setGroup(id);
              setType('all');
            }}
          >
            {id === CURSES ? 'Curses' : CONTENT.classes[id].name}
          </button>
        ))}
      </div>
      {types.length > 1 && (
        <div className="segmented small" role="tablist" aria-label="Card type">
          {(['all', ...types] as const).map((t) => (
            <button key={t} role="tab" aria-selected={type === t} className={type === t ? 'active' : ''} onClick={() => setType(t)}>
              {t === 'all' ? 'All' : CARD_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      )}
      <p className="record">
        {known} of {cards.length} {group === CURSES ? 'curses' : 'cards'} known
      </p>

      <div className="deck-grid library-grid">
        {shown.map((def) => {
          const status = statusOf(def);
          return (
            <div key={def.id} className={`library-card ${status === 'known' ? '' : 'locked'}`}>
              <CardView card={{ uid: `lib-${def.id}`, cardId: def.id }} variant="hand" affordable onClick={() => setOpen(def.id)} />
              {status !== 'known' && <span className="lock-tag">{status === 'research' ? 'Research' : 'Locked'}</span>}
            </div>
          );
        })}
      </div>

      {open && <CardDetailSheet def={CONTENT.cards[open]} status={statusOf(CONTENT.cards[open])} save={save} onClose={() => setOpen(undefined)} />}
    </div>
  );
}

function CardDetailSheet({ def, status, save, onClose }: { def: CardDef; status: Status; save: SaveData; onClose: () => void }) {
  const inDecks = save.meta.history.filter((r) => r.deck.includes(def.id)).length;
  return (
    <div className="sheet" onClick={onClose}>
      <header className="sheet-head">
        <h2>{def.name}</h2>
        <button className="ghost-btn" onClick={onClose}>
          Close
        </button>
      </header>
      <div className="library-detail" onClick={(e) => e.stopPropagation()}>
        <CardView card={{ uid: `libd-${def.id}`, cardId: def.id }} variant="detail" affordable />
        <p className="record">
          {RARITY_LABEL[def.rarity]} {CARD_TYPE_LABEL[def.type]}
          {def.fade ? ' · fades when played' : ''}
          {def.echo ? ' · echoes' : ''}
        </p>
        {status !== 'known' && <p className="record warn">{STATUS_LABEL[status]}</p>}
        {save.meta.history.length > 0 && (
          <p className="record">
            In your final deck in {inDecks} of your last {save.meta.history.length} loops.
          </p>
        )}
      </div>
    </div>
  );
}
