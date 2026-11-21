/**
 * Content integrity: catches typos in data files (a card pointing at a
 * missing relic, an enemy pattern naming a move that does not exist…).
 */
import { describe, expect, it } from 'vitest';
import { createCombat, describeCard, describeRelic } from '../engine';
import { CONTENT } from '.';

describe('content integrity', () => {
  const rb = CONTENT.classes['relic-breaker'];

  it('the Relic-Breaker has a 10-card starter deck of real cards', () => {
    expect(rb.starterDeck).toHaveLength(10);
    for (const id of [...rb.starterDeck, ...rb.cardPool]) expect(CONTENT.cards[id], id).toBeDefined();
    for (const id of [...rb.starterRelics, ...rb.relicPool]) expect(CONTENT.relics[id], id).toBeDefined();
  });

  it('every enemy pattern only names its own moves', () => {
    for (const enemy of Object.values(CONTENT.enemies)) {
      const p = enemy.pattern;
      const named = p.kind === 'cycle' ? p.order : Object.keys(p.weights);
      for (const move of [...named, ...(p.opening ? [p.opening] : [])]) {
        expect(enemy.moves[move], `${enemy.id}.${move}`).toBeDefined();
      }
      expect(enemy.hp[0]).toBeLessThanOrEqual(enemy.hp[1]);
    }
  });

  it('every encounter uses known enemies and can start', () => {
    for (const enc of Object.values(CONTENT.encounters)) {
      for (const id of enc.enemies) expect(CONTENT.enemies[id], id).toBeDefined();
      const { state } = createCombat(
        { seed: enc.id, deck: rb.starterDeck, hp: rb.maxHp, maxHp: rb.maxHp, relics: rb.starterRelics, encounterId: enc.id },
        CONTENT,
      );
      expect(state.phase).toBe('player');
    }
  });

  it('every card and relic produces rules text', () => {
    for (const card of Object.values(CONTENT.cards)) {
      if (card.type !== 'curse') expect(describeCard(card), card.id).not.toBe('');
    }
    for (const relic of Object.values(CONTENT.relics)) {
      const t = describeRelic(relic);
      expect(t.passive ?? t.overload, relic.id).toBeTruthy();
    }
  });

  it('has the milestone 3 slice: ~30 cards, ~10 relics, 8 events, 5 Shifts', () => {
    expect(Object.keys(CONTENT.cards)).toHaveLength(30);
    expect(rb.relicPool).toHaveLength(10);
    expect(Object.keys(CONTENT.events)).toHaveLength(8);
    expect(Object.values(CONTENT.vaultShifts).filter((s) => s.weight > 0)).toHaveLength(5);
    const archetypes = new Set(rb.cardPool.map((id) => CONTENT.cards[id].archetype));
    expect([...archetypes].sort()).toEqual(['bleed', 'fracture', 'overload', 'ward']);
  });

  it('idle content is consistent: kits, locked cards, research, traits', () => {
    for (const kit of rb.kits) {
      expect(kit.deck, kit.id).toHaveLength(10);
      for (const id of kit.deck) expect(CONTENT.cards[id], `${kit.id}: ${id}`).toBeDefined();
      for (const id of kit.deck) expect(rb.lockedCards, `${kit.id} uses locked ${id}`).not.toContain(id);
      if (kit.unlock) expect(CONTENT.idle.unlocks.some((u) => u.id === kit.unlock)).toBe(true);
    }
    expect(rb.kits[0].unlock).toBeUndefined();
    for (const id of rb.lockedCards) expect(rb.cardPool).toContain(id);
    const researchedCards = CONTENT.idle.research.flatMap((r) => (r.kind === 'card' ? [r.cardId] : []));
    expect([...researchedCards].sort()).toEqual([...rb.lockedCards].sort());
    for (const r of CONTENT.idle.research) if (r.kind === 'lore') expect(CONTENT.idle.lore[r.loreId]).toBeDefined();
    const traits = CONTENT.idle.traits;
    expect(traits[traits.length - 1].when).toEqual([]);
  });

  it('event effects point at real cards', () => {
    for (const ev of Object.values(CONTENT.events)) {
      for (const e of ev.options.flatMap((o) => o.outcomes.flatMap((x) => x.effects))) {
        if (e.kind === 'addCard') expect(CONTENT.cards[e.cardId], `${ev.id}: ${e.cardId}`).toBeDefined();
      }
    }
  });

  it('generates the expected text for Shatter Lens', () => {
    expect(describeCard(CONTENT.cards['shatter-lens'])).toBe('Deal 12. Gain 2 Fracture.');
  });
});
