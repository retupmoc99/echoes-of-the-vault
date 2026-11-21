/**
 * Full-screen deck list. In 'pick' mode the player taps a card, then confirms.
 */
import { useState } from 'react';
import { CONTENT } from '../../data';
import { CardView } from './CardView';

interface Props {
  deck: string[];
  title: string;
  onClose: () => void;
  /** When set, cards are selectable and the confirm button calls this with the deck index. */
  pick?: { label: string; onPick: (index: number) => void };
}

export function DeckSheet({ deck, title, onClose, pick }: Props) {
  const [picked, setPicked] = useState<number>();
  // Sort for reading, but remember each card's real deck index.
  const entries = deck.map((cardId, index) => ({ cardId, index })).sort((a, b) => a.cardId.localeCompare(b.cardId));

  return (
    <div className="sheet">
      <header className="sheet-head">
        <h2>{title}</h2>
        <button className="ghost-btn" onClick={onClose}>
          Close
        </button>
      </header>
      <div className="deck-grid">
        {entries.map(({ cardId, index }) => (
          <CardView
            key={index}
            card={{ uid: `deck${index}`, cardId }}
            variant="hand"
            affordable
            selected={picked === index}
            onClick={pick ? () => setPicked(index) : undefined}
          />
        ))}
      </div>
      {pick && (
        <footer className="sheet-foot">
          <button className="primary-btn" disabled={picked === undefined} onClick={() => picked !== undefined && pick.onPick(picked)}>
            {picked === undefined ? 'Choose a card' : `${pick.label}: ${CONTENT.cards[deck[picked]].name}`}
          </button>
        </footer>
      )}
    </div>
  );
}
