# Design: the Tollkeeper (Warden 9, reworked)

*Status: built in 0.21.0.*

**Changed in tuning:**
- **The Tollhouse Lantern** gives 1 Toll as each fight begins, plus 3 per kill (4 for an elite, 6 for a boss). The draft's 1/2/4 left too little to spend.
- Exact Payment deals 8, with +3 Toll on a kill.
- Bribe the Dark gives 6 Ward when you can't pay.
- Hired Steel deals 7 unpaid.
- Bought Time and Hostile Takeover cost 2 to pay.
- Paid Guard gives 12 Ward when paid (not "retain Ward").
- **Toll from the killing blow** still counts after the fight is won, since it carries on in the loop.
- **Kits:** the Miser is Golden Hail and Counting House (Interest made it too strong); the Spendthrift swaps a blade and a ledger.
- **Bot:** 33% standard; the Miser 28% and the Spendthrift 28%.
*Unlocked by the Work **The Toll Gate** (150 Shards): no deed, as agreed.*

> Nothing passes free. Not even the dead.

## The pitch
The Tollkeeper collects **Toll** from everything it kills and spends it, inside the loop, on stronger cards and better rests.

**The rework:** in the first idea, leftover Toll turned into Shards at the Outpost. That would make the Tollkeeper the best Warden for the idle economy, which breaks the "options, not raw power" rule. Now **Toll never leaves the loop.** Every coin is spent on this run or lost when it ends. The question is "spend now or save for a bigger moment", not "spend or bank".

## Core rules
- **Toll** is a loop-wide count, shown as a coin chip by your HP.
- **Gaining Toll:**
  - The starter relic takes Toll from every foe killed: 1 per normal foe, 2 per elite, 4 per boss.
  - Some cards take extra Toll if they kill ("If this kills, gain 2 Toll").
- **Pay N:** a card's bonus, bought with Toll. If you have enough, you pay and get the bonus; if not, you get only the base effect. There's no prompt: what you can afford, you buy.
- **Spending between fights:**
  - **Shrines** gain the rite **Tithe**: pay 4 Toll to rest *and* cut a card.
  - **Card rewards** can be rerolled for 3 Toll each.
- **When the loop ends, Toll is gone.** It's never turned into Shards, so the Daily needs no special rule.

## The Warden
- **HP 70.** Starter relic: **Tollhouse Lantern** (whenever a foe dies, gain Toll: 1, elite 2, boss 4).
- Archetypes: `toll` and `coin`.
- 24 cards of its own: 4 starters plus 20 rewards, six research-locked (🔒).

### Starting deck
| Card | Cost | Type | Effect |
|---|---|---|---|
| Collector's Blade ×4 | 1 | strike | Deal 6. |
| Iron Ledger ×4 | 1 | ward | Gain 5 Ward. |
| Exact Payment | 1 | strike | Deal 7. If this kills, gain 2 Toll. |
| Bribe the Dark | 1 | rite | Pay 2: gain 2 Resonance and draw 1. Otherwise, gain 4 Ward. |

### Reward cards
| Card | Cost | Rarity | Type | Effect |
|---|---|---|---|---|
| Shake Down | 1 | common | strike | Deal 7. If this kills, gain 2 Toll. |
| Hired Steel | 1 | common | strike | Pay 2: deal 14. Otherwise, deal 5. |
| Gilded Ward | 1 | common | ward | Pay 1: gain 10 Ward. Otherwise, gain 4. |
| Coin Toss | 0 | common | rite | Gain 1 Toll. Draw 1. Fade. |
| Counting House | 1 | common | ward | Gain 5 Ward, plus 1 per 2 Toll you hold. |
| Collection | 1 | common | strike | Deal 4 to all foes. If any dies, gain 1 Toll. |
| Paid Guard | 1 | common | ward | Pay 2: gain 8 Ward and retain it next turn. Otherwise, gain 5. |
| Small Change | 0 | common | strike | Deal 3. Pay 1: deal 6 more. |
| Interest | 0 | uncommon | rite | Gain 1 Toll per 4 Toll you hold (at most 3). Fade. |
| Bought Time | 1 | uncommon | rite | Pay 3: gain 2 Resonance and draw 2. Otherwise, draw 1. |
| Golden Hail | 2 | uncommon | strike | Deal 1 per Toll you hold to all foes (at most 20). Spends nothing. |
| Blood Money | 1 | uncommon | strike | Deal 10. If this kills, gain 3 Toll. |
| Ransom | 1 | uncommon | rite | Pay 4: apply 2 Weakened and 2 Exposed. Otherwise, apply 1 Weakened. |
| 🔒 Hostile Takeover | 2 | uncommon | strike | Pay 3: deal 20. Otherwise, deal 8. |
| 🔒 Vault Dividend | 1 | uncommon | ward | Gain 6 Ward, plus 2 per 3 Toll you hold. |
| Debt Collector | 2 | rare | strike | Deal 6, plus 3 per Toll paid this fight. |
| The Final Toll | 3 | rare | strike | Pay all your Toll. Deal 4 per Toll paid. Fade. |
| 🔒 Golden Ward | 2 | rare | ward | Pay all your Toll. Gain 3 Ward per Toll paid. Fade. |
| 🔒 Toll of Ages | 1 | rare | rite | Double your Toll (at most +10). Fade. |
| 🔒 Bankrupt the Dark | 3 | rare | strike | Deal 12 to all foes. Pay 5: deal 12 more to all. |

### Relics
| Relic | Rarity | Effect |
|---|---|---|
| Tollhouse Lantern (starter) | starter | Whenever a foe dies, gain Toll (1, elite 2, boss 4). |
| Coin Purse | common | Fight start: gain 1 Toll. |
| Brass Scales | common | Turn start: with 6+ Toll, gain 3 Ward. |
| Ledger of Debts | uncommon | Whenever you Pay, gain 2 Ward. |
| Weighted Dice | uncommon | Fight start: with 10+ Toll, gain 1 Resonance. |
| Gilded Hand | uncommon (tainted, +1 Corruption) | Foes give 1 more Toll when they die. |
| Golden Key | rare | Pay costs are 1 lower (at least 1). |
| The Last Coin | rare | Whenever you Pay, draw 1 (once a turn). |
| Drowned Coin (the Well) | rare | Whenever you Pay, deal 3 to all foes. |

### Kits
- **The Miser:** Golden Hail, Counting House and a Coin Toss in place of two Collector's Blades and an Iron Ledger. Hoard, and let the hoard hit. *(0.21.3: Coin Toss added; it was 8 points under the standard deck.)*
- **The Spendthrift:** Hired Steel, Gilded Ward and a Coin Toss in place of two Collector's Blades and an Iron Ledger. Spend every coin. *(0.21.3: Coin Toss added, for something to spend.)*

## Engine work
- **Run state:** `RunState.toll`, passed in as `CombatSetup.toll` and kept as `CombatState.toll` during the fight. The fight's Toll goes back to the run when you leave.
- **Effects:**
  - `gainToll { n | 'double' }`
  - `pay { amount | 'all', then, else }`, tracking `tollPaidThisFight` and firing the `paid` trigger.
  - `ifKilled { then }`: runs `then` if the card's damage killed its target.
- **Trigger `foeDied`**, with the tier passed in. Useful beyond this class.
- **Amounts:** `toll`, `tollPaid` and `tollStep { n }`. **Combat modifier:** `payDiscount` (Golden Key).
- **Run actions:** Shrine `shrineTithe` (rest and cut a card for 4 Toll) and `rerollReward` paid with Toll when there are no free rerolls.
- **Bot:** pays whenever it can (simple). It uses Tithe at Shrines when it has 4+ Toll and wants a removal.

## UI
- A coin chip by your HP ("◉ 7 Toll"). Pay cards dim the paid part when you can't afford it.
- The Tithe button on Shrines, and a Toll reroll on rewards.
- **First-time hint (`tollkeeper`):** "Foes pay a Toll when they die. Pay cards spend it for a bonus. Toll is gone when the loop ends, so spend it."

## Balance targets
- 32–37% at stage 0, with kits within 4 points.
- The Outpost economy is untouched: no Shards from Toll.

## Art direction
**Tarnished gold, black iron and lamp light:** coins, ledgers, scales, gates, lanterns, keys, toll booths. Prompts under "Tollkeeper cards" and "Tollkeeper relics".
