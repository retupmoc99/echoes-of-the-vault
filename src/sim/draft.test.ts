import { describe, expect, it } from 'vitest';
import { CONTENT } from '../data';
import { createRun } from '../engine';
import { cardValue, draftPick } from './draft';

const run = (classId: string) => createRun({ seed: 'draft', classId, kitId: CONTENT.classes[classId].kits[0].id, unlockedCards: [] }, CONTENT);
const card = (id: string) => CONTENT.cards[id];

describe('the balance bot drafter', () => {
  it('values cards per Resonance', () => {
    expect(cardValue(card('bitter-strike'))).toBe(6);
    expect(cardValue(card('gnawing-static'))).toBeLessThan(0);
  });

  it('skips an offer no better than the deck it would dilute', () => {
    const r = run('sin-eater');
    expect(draftPick(r, ['ash-shroud'], CONTENT)).toBe(-1);
  });

  it('takes a clearly better card, and prefers what the deck already builds toward', () => {
    const r = run('pilgrim');
    expect(draftPick(r, ['road-strike', 'pilgrims-rest'], CONTENT)).toBe(1);
    const offer = ['waystation', 'footsore'];
    const road = { ...r, deck: [...r.deck, 'trailblaze', 'cairn', 'long-road-home'] };
    const rest = { ...r, deck: [...r.deck, 'pilgrims-rest', 'far-horizon', 'pilgrims-rest'] };
    expect(offer[draftPick(road, offer, CONTENT) as number]).toBe('footsore');
    expect(offer[draftPick(rest, offer, CONTENT) as number]).toBe('waystation');
  });

  it('weighs the tainted offer only when asked to', () => {
    const r = run('sin-eater');
    expect(draftPick(r, ['ash-shroud'], CONTENT, 'eat-the-sky')).toBe('tainted');
    expect(draftPick(r, ['ash-shroud'], CONTENT)).toBe(-1);
  });
});
