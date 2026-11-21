/** Card and relic rewards. */
import { BALANCE } from '../../data/balance';
import { rngPick, rngShuffle, rngWeighted } from '../rng';
import type { CardDef, Content, RunState } from '../types';
import { corruptionTier } from './corruption';

type DropRarity = 'common' | 'uncommon' | 'rare';

export function rollCardReward(r: RunState, content: Content, tier: 'normal' | 'elite'): { cards: string[]; tainted: string | null } {
  const pool = r.cardPool.map((id) => content.cards[id]);
  const byRarity = (rarity: DropRarity) => pool.filter((c) => c.rarity === rarity);

  const weights = { ...BALANCE.rewards.rarityWeights[tier] } as Record<DropRarity, number>;
  weights.rare += corruptionTier(r.corruption) * BALANCE.corruption.rareWeightPerTier;

  const count = BALANCE.rewards.choices + (content.vaultShifts[r.vaultShiftId]?.mods.rewardChoicesBonus ?? 0);
  const chosen: CardDef[] = [];
  for (let i = 0; i < count; i++) {
    const rarity = rngWeighted(r.rng, weights);
    // Fall back to any rarity if this one is used up.
    const options = byRarity(rarity).filter((c) => !chosen.includes(c));
    const fallback = pool.filter((c) => !chosen.includes(c));
    const pickFrom = options.length ? options : fallback;
    if (pickFrom.length === 0) break;
    chosen.push(rngPick(r.rng, pickFrom));
  }

  // The tainted offer is always a rare that is not already on the table.
  const rares = byRarity('rare').filter((c) => !chosen.includes(c));
  const tainted = rares.length ? rngPick(r.rng, rares).id : null;
  return { cards: chosen.map((c) => c.id), tainted };
}

/** Up to `count` distinct class relics the player does not own. */
export function rollRelics(r: RunState, content: Content, count: number, opts: { allowTainted: boolean }): string[] {
  const pool = content.classes[r.classId].relicPool.filter((id) => {
    if (r.relics.includes(id)) return false;
    return opts.allowTainted || !content.relics[id].corruption;
  });
  return rngShuffle(r.rng, pool).slice(0, count);
}
