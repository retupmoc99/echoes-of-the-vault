/**
 * Content integrity: catches typos in data files (a card pointing at a
 * missing relic, an enemy pattern naming a move that does not exist…).
 */
import { describe, expect, it } from 'vitest';
import { createCombat, describeCard, describeRelic } from '../engine';
import { CONTENT } from '.';
import { BALANCE } from './balance';

describe('content integrity', () => {
  const rb = CONTENT.classes['relic-breaker'];
  const ht = CONTENT.classes['hour-thief'];
  const classes = Object.values(CONTENT.classes);

  it('every class has a 10-card starter deck and real cards and relics', () => {
    for (const cls of classes) {
      expect(cls.starterDeck, cls.id).toHaveLength(10);
      for (const id of [...cls.starterDeck, ...cls.cardPool]) expect(CONTENT.cards[id], `${cls.id}: ${id}`).toBeDefined();
      for (const id of [...cls.starterRelics, ...cls.relicPool]) expect(CONTENT.relics[id], `${cls.id}: ${id}`).toBeDefined();
      if (cls.unlock) expect(CONTENT.idle.unlocks.some((u) => u.id === cls.unlock), cls.id).toBe(true);
    }
    expect(rb.unlock).toBeUndefined(); // the first Warden is always available
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

  it('every encounter uses known enemies and can start, for every class', () => {
    for (const cls of classes) {
      for (const enc of Object.values(CONTENT.encounters)) {
        for (const id of enc.enemies) expect(CONTENT.enemies[id], id).toBeDefined();
        const { state } = createCombat(
          { seed: enc.id, deck: cls.starterDeck, hp: cls.maxHp, maxHp: cls.maxHp, relics: cls.starterRelics, encounterId: enc.id },
          CONTENT,
        );
        expect(state.phase).toBe('player');
      }
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

  it('has the slice: ~30 cards and ~10 relics per class, 8 events (+3 Awakening), 5 Shifts', () => {
    for (const cls of classes) {
      expect(cls.starterDeck.length + cls.cardPool.length, cls.id).toBeGreaterThanOrEqual(30);
      expect(cls.relicPool.length, cls.id).toBeGreaterThanOrEqual(9);
    }
    const events = Object.values(CONTENT.events);
    expect(events.filter((e) => !e.minAwakening)).toHaveLength(8);
    expect(events.filter((e) => e.minAwakening)).toHaveLength(3);
    expect(Object.values(CONTENT.vaultShifts).filter((s) => s.weight > 0)).toHaveLength(5);
    const archetypes = (ids: string[]) => [...new Set(ids.map((id) => CONTENT.cards[id].archetype))].sort();
    expect(archetypes(rb.cardPool)).toEqual(['bleed', 'fracture', 'overload', 'ward']);
    expect(archetypes(ht.cardPool)).toEqual(['delay', 'echo', 'unwinding']);
  });

  it('Awakening content is consistent: stages, lore, Waking encounters, affixes', () => {
    const { stages, affixes } = CONTENT.awakening;
    expect(stages).toHaveLength(BALANCE.awakening.thresholds.length + 1);
    for (const st of stages) if (st.loreId) expect(CONTENT.idle.lore[st.loreId], st.loreId).toBeDefined();
    for (const e of Object.values(CONTENT.encounters)) {
      if (e.replaces) expect(CONTENT.encounters[e.replaces], e.id).toBeDefined();
      for (const id of e.enemies) expect(CONTENT.enemies[id], `${e.id}: ${id}`).toBeDefined();
    }
    // Every Waking enemy's pattern only names moves it has.
    for (const en of Object.values(CONTENT.enemies)) {
      const ids = en.pattern.kind === 'cycle' ? en.pattern.order : Object.keys(en.pattern.weights);
      for (const m of ids) expect(en.moves[m], `${en.id}: ${m}`).toBeDefined();
    }
    expect(Object.keys(affixes).sort()).toEqual(['frenzied', 'hardened', 'warded']);
  });

  it('idle content is consistent: kits, locked cards, research, traits', () => {
    for (const cls of classes) {
      for (const kit of cls.kits) {
        expect(kit.deck, kit.id).toHaveLength(10);
        for (const id of kit.deck) expect(CONTENT.cards[id], `${kit.id}: ${id}`).toBeDefined();
        for (const id of kit.deck) expect(cls.lockedCards, `${kit.id} uses locked ${id}`).not.toContain(id);
        if (kit.unlock) expect(CONTENT.idle.unlocks.some((u) => u.id === kit.unlock)).toBe(true);
      }
      expect(cls.kits[0].unlock).toBeUndefined();
      for (const id of cls.lockedCards) expect(cls.cardPool).toContain(id);
    }
    // Research unlocks exactly the locked cards of every class, each once.
    const researchedCards = CONTENT.idle.research.flatMap((r) => (r.kind === 'card' ? [r.cardId] : []));
    expect([...researchedCards].sort()).toEqual(classes.flatMap((c) => c.lockedCards).sort());
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

  it('generates the expected text for Shatter Lens and the time cards', () => {
    expect(describeCard(CONTENT.cards['shatter-lens'])).toBe('Deal 12. Gain 2 Fracture.');
    expect(describeCard(CONTENT.cards['slow-fuse'])).toBe('In 2 turns: Deal 16.');
    expect(describeCard(CONTENT.cards['flicker'])).toBe('Deal 3. Echo.');
    expect(describeCard(CONTENT.cards['stolen-second'])).toBe('Return the last card in your discard pile to your hand. Gain 1 Paradox.');
  });
});
