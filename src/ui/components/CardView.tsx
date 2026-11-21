import { CONTENT } from '../../data';
import { cardCost, describeCard, type CardInstance, type Preview } from '../../engine';
import { ArtImg, artUrl } from '../art';
import { CARD_HUE, CARD_TYPE_LABEL } from '../theme';

interface Props {
  card: CardInstance;
  preview?: Preview;
  affordable: boolean;
  selected?: boolean;
  /** 'hand' is compact; 'detail' is the large readable version. */
  variant: 'hand' | 'detail';
  onClick?: () => void;
}

export function CardView({ card, preview, affordable, selected, variant, onClick }: Props) {
  const def = CONTENT.cards[card.cardId];
  const hue = CARD_HUE[def.type];
  const classes = ['card', `card-${variant}`, selected && 'selected', !affordable && 'unaffordable', card.ephemeral && 'ephemeral']
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} style={{ ['--hue' as string]: hue }} onClick={onClick} data-card-uid={card.uid}>
      <ArtImg src={artUrl('cards', def.id, def.image)} className="card-art" fallback={null} />
      <span className={`card-cost ${card.freeThisTurn ? 'free' : ''}`}>{def.unplayable ? '—' : cardCost(card, def)}</span>
      <span className="card-name">{def.name}</span>
      {card.ephemeral && <span className="echo-tag">Echo · fades</span>}
      {variant === 'detail' && <span className="card-type">{CARD_TYPE_LABEL[def.type]}</span>}
      <span className="card-text">{describeCard(def, preview)}</span>
      {variant === 'detail' && <span className="card-flavor">{def.flavor}</span>}
    </button>
  );
}
