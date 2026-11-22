# Design ideas: six more Wardens

*Status: all six built (the Somnant in 0.20, the rest in 0.21). Each has its own design doc with the as-built numbers. Original agreed build order: Somnant, Sin-Eater, Mirrorborn, Shiftwright, Pilgrim; the Tollkeeper to be reworked (Toll spent inside the loop, never turned into Shards) or dropped. Each Warden is unlocked by a deed (see `deed-unlocks.md`). The Somnant is fully designed in `somnant.md`.*

> The vault keeps more than three kinds of prisoner. Some of them have learned its rules.

## The brief
Six candidates for the fourth Warden and beyond. Each one needs:
- a core mechanic unlike the Relic-Breaker (Overload, Fracture, Bleed), the Hour-Thief (Delay, Echo, Rewind, Paradox) and the Echo-Caller (allies from your Echoes), and unlike each other;
- a link to one distinctive system of the game, the way the Echo-Caller is built on Echoes;
- phone-first play: one thumb, no drag, no complex targeting, readable at 320px.

All numbers use the current scale: strikes deal about 6, wards give about 5, 3 Resonance and 5 cards a turn, 66–70 HP. Every Warden follows the existing class shape: a 10-card starting deck (4 strikes, 4 wards, 2 signature cards), a starter relic, a reward pool of about 24 cards (6 locked behind Research), two 60-Shard kits, and an Outpost Work to unlock it.

| # | Warden | Built on | One line |
|---|---|---|---|
| 1 | The Sin-Eater | Curses and Corruption | Eats curses for power |
| 2 | The Somnant | The Awakening and the Sleeper | Puts enemies to sleep |
| 3 | The Pilgrim | The map | Cards grow with every step |
| 4 | The Shiftwright | Vault Shifts | Switches between three weathers |
| 5 | The Mirrorborn | Enemy intents | Copies or steals the enemy's next move |
| 6 | The Tollkeeper | The Outpost economy | Collects a toll, spends it or carries it home |

---

## 1. The Sin-Eater
**Pitch:** Takes the vault's curses into itself and turns them into strength.

> Every curse is a meal. The Sin-Eater is never full.

### Core mechanic
- **Devour** is a keyword: *"Devour: if you hold a curse, remove it from your deck for good, then [bonus]."* It always takes the leftmost curse in your hand, so there is nothing to pick. With no curse in hand, the card does only its base effect.
- **Burden:** some cards scale with the number of curses in your deck.
- So curses become fuel. The Warden *wants* the tainted offer, because Corruption tiers 2 and 3 plant curses. Corruption still raises enemy HP and damage, so greed stays a real risk.
- The starting deck holds one curse, so Devour works from the first fight.

**Reuses:** `damage`, `ward`, `draw`, `gainResonance`, `if`.
**New engine pieces:**
- Effect `devour { then }` and condition `curseInHand`.
- Amounts `cursesInDeck` and `devouredThisFight`.
- Combat can change the run deck (remove a curse, add one). Today a fight never edits the run deck, so this needs a list of deck changes applied when the fight ends.
- Effect `corruption` (events have it) made usable from a card.
- Trigger `devoured` for relics.

### Starting deck (68 HP)
| Card | Cost | Effect |
|---|---|---|
| Bitter Strike ×4 | 1 | Deal 6. |
| Ash Shroud ×4 | 1 | Gain 5 Ward. |
| Swallow | 1 | Deal 5. Devour: deal 8 more. |
| Gnawing Static | – | Curse. Unplayable. (The first meal.) |

**Starter relic: Black Salt.** The first time you Devour each fight, gain 1 Resonance.

### Example reward cards
| Card | Cost | Rarity | Effect |
|---|---|---|---|
| Take the Sin | 0 | common | Add a Gnawing Static to your deck and your draw pile. Gain 2 Resonance. Fade. |
| Bitter Feast | 1 | common | Deal 4, plus 3 per curse in your deck. |
| Grave Hunger | 1 | common | Gain 5 Ward. Devour: draw 2. |
| Communion of Ash | 1 | uncommon | Gain 4 Ward per curse in your deck (max 20). |
| Penance | 1 | uncommon | Lose 1 Corruption. Add a random curse to your deck. Fade. |
| Gorge | 2 | uncommon | Devour up to 3 curses. Deal 8 to all foes per curse eaten. |
| Absolution | 2 | rare | Devour every curse in hand. Each one: lose 1 Corruption, gain 6 Ward. Fade. |
| Sin-Bloated | 2 | rare | Deal 3 per curse in your deck to all foes, twice. |

### Alternate kits
- **The Glutton:** Take the Sin and Bitter Feast in place of a Bitter Strike and an Ash Shroud. Feed the deck, then hit hard.
- **The Confessor:** Penance and Communion of Ash in place of two Bitter Strikes. Carry curses, hide behind them.

### Unlock
Work **The Salt and the Bread**, 160 Shards.
> *"Leave bread on the dead man's chest. Someone always comes to eat it."*

### Build size: M
- **Balance:** Devour removes curses for good, which can undo the price of Corruption. Watch whether the tainted offer becomes free. Curses in hand are dead draws, so the early turns may feel weak.
- **Phone UI:** low. A Devour card glows when a curse is in hand. The curse it will take is the leftmost one, marked.
- **Bot sim:** easy. Play Devour cards when a curse is in hand; take tainted rewards up to tier 2.

---

## 2. The Somnant
**Pitch:** Sings enemies to sleep, then strikes while they dream. Grows stronger as the Sleeper wakes.

> It learned the Sleeper's lullaby. It hums it to everything.

### Core mechanic
- **Drowse** is a new status on enemies. Each enemy has a **sleep threshold**: 6 for normal enemies, 10 for elites, 16 for bosses. The badge shows it as "4/6".
- When Drowse reaches the threshold, the enemy falls **Asleep**. Its intent changes to *Asleep*: it does nothing on its next turn. Then Drowse resets to 0 and the threshold rises by 3 for the rest of the fight, so you can't sleep-lock it.
- **Waking blows:** some cards do more against an Asleep target ("If Asleep: deal 15 instead").
- **The Awakening link:** the starter relic puts Drowse on every enemy at the start of each fight, equal to the Awakening stage (at least 1). So the Somnant gets stronger as the world gets harder. The Sleeper itself has a threshold of 24 and can only be slept once.

**Reuses:** `applyStatus` (new status), `damage`, `ward`, `draw`, `if` with `targetHasStatus`.
**New engine pieces:**
- Status `drowse` and an enemy flag `asleep` that replaces the stored intent for one turn.
- A per-enemy threshold, by tier, rising each time it sleeps.
- Condition `targetAsleep` and `anyFoeAsleep`.
- The Awakening stage passed into the fight (the loop already knows it).
- A rule for boss phases: a phase change wakes the boss.

### Starting deck (68 HP)
| Card | Cost | Effect |
|---|---|---|
| Dull Blade ×4 | 1 | Deal 6. |
| Veil of Sleep ×4 | 1 | Gain 5 Ward. |
| Lullaby | 1 | Apply 3 Drowse to all foes. |
| Nightfall Cut | 1 | Deal 5. If the target is Asleep, deal 15 instead. |

**Starter relic: Sleeper's Hum.** At the start of each fight, apply Drowse to all foes equal to the Awakening stage (at least 1).

### Example reward cards
| Card | Cost | Rarity | Effect |
|---|---|---|---|
| Heavy Eyelids | 0 | common | Apply 2 Drowse. |
| Whisper Down | 1 | common | Deal 4. Apply 2 Drowse. |
| Sleepwalker's Ward | 1 | common | Gain 6 Ward. If any foe is Asleep, gain 10 instead. |
| Murmured Name | 1 | uncommon | Apply 4 Drowse. Draw 1. |
| Cradle Song | 2 | uncommon | Apply 4 Drowse to all foes. |
| Dreamless Edge | 2 | uncommon | Deal 5 twice. If the target is Asleep, four times. |
| Nightmare | 2 | rare | Deal 3 per Drowse on the target, then clear its Drowse. |
| Sleeper's Kiss | 3 | rare | If the target is Asleep, deal 30. Otherwise, apply 6 Drowse. |

### Alternate kits
- **The Lullaby:** Cradle Song and Heavy Eyelids in place of two Dull Blades. Sleep the whole room.
- **The Night-Knife:** Dreamless Edge and Whisper Down in place of a Dull Blade and a Veil of Sleep. One target, one long dream, one wound.

### Unlock
Work **The Sleeper's Hymnal**, 170 Shards. Shown once the Awakening has reached stage 1 (Murmur).
> *"We sang it to keep the thing asleep. Then we learned it works on anything."*

### Build size: M
- **Balance:** skipping enemy turns is strong. The rising threshold and the boss rules are the brakes. Nightmare plus big Drowse stacks could become a second damage engine; cap it if needed.
- **Phone UI:** low. One new badge ("4/6") and one new intent icon (closed eye). Intents stay honest: an Asleep enemy shows *Asleep*.
- **Bot sim:** easy. Push Drowse on the enemy with the biggest intent; play waking blows on sleeping ones.

---

## 3. The Pilgrim
**Pitch:** Walks the vault one step at a time. Every step, its cards remember the road.

> The road is long. It counts every stone.

### Core mechanic
- **Waymark** is a keyword on some cards. Each time you enter a map node, one Waymarked card in your deck gains **1 Mile**. It's the Waymarked card with the fewest Miles (ties: deck order), so no picker is needed. Elites give 2 Miles.
- **Miles** make the card stronger for the rest of the loop, as its text says: "Deal 3, plus 2 per Mile". The card shows a small Mile number.
- Miles are kept in the Echo's deck snapshot, so a Pilgrim's Echo fights well for the Echo-Caller.
- Shrines gain a fourth rite for the Pilgrim, **Tend**: give 2 Miles to a card you choose (a plain list, one tap).
- The first card upgrade system in the game. The deck starts weak and grows through the map.

**Reuses:** `damage`, `ward`, `draw`, `gainResonance`, `if`.
**New engine pieces:**
- Per-card state in the run deck: entries become `{ id, miles }` instead of plain ids. This touches rewards, Shrine removal, events, the Echo snapshot, the Archive and the save (a migration).
- Amount `miles` (this card's) and `totalMiles` (the deck's), and `row` (map depth).
- Mile gain on node entry, in the run step.
- Rules text with live Mile values, which the describer already does for statuses.

### Starting deck (70 HP)
| Card | Cost | Effect |
|---|---|---|
| Road Strike ×4 | 1 | Deal 6. |
| Travel Cloak ×4 | 1 | Gain 5 Ward. |
| Long Stride | 1 | Waymark. Deal 3, plus 2 per Mile. |
| Milestone | 1 | Waymark. Gain 3 Ward, plus 2 per Mile. |

By the boss, each starting Waymark card has about 4 Miles: Long Stride deals 11.

**Starter relic: Worn Compass.** Shrines and Events also give an extra Mile.

### Example reward cards
| Card | Cost | Rarity | Effect |
|---|---|---|---|
| Trailblaze | 1 | common | Waymark. Deal 2, plus 1 per Mile, to all foes. |
| Wayshrine Ward | 1 | common | Waymark. Gain 4 Ward, plus 2 per Mile. |
| Second Wind | 0 | common | Waymark. Draw 1. At 3+ Miles, draw 2. |
| Footsore | 1 | uncommon | Deal 3, plus 2 per map row reached. |
| Pack Mule | 1 | uncommon | Waymark. Gain 1 Resonance, plus 1 at 4+ Miles. Fade. |
| Long Road Home | 2 | uncommon | Deal damage equal to the Miles in your whole deck. |
| Carved Stone | 1 | rare | Every Waymarked card in your hand gains 1 Mile (for the loop). Fade. |
| Pilgrim's End | 3 | rare | Waymark (gains 2 per node). Deal 10, plus 4 per Mile. |

### Alternate kits
- **The Wanderer:** Trailblaze and Wayshrine Ward in place of a Road Strike and a Travel Cloak. More cards that grow.
- **The Long Road:** Footsore and Long Road Home in place of two Road Strikes. Payoff for walking far.

### Unlock
Work **The Worn Road**, 180 Shards.
> *"Its boots were worn through. Its feet were not."*

### Build size: L
- **Balance:** snowballing. Weak early fights, very strong late ones. Cap Miles at 6 per card. The Deeper Vault (second floor) would compound it; Miles may need to stop on floor 2.
- **Phone UI:** low to medium. A Mile badge on cards and a short "Long Stride +1 Mile" toast on the map.
- **Bot sim:** easy to play; the risk is the data change, not the bot.
- **Main cost:** per-card deck state is the biggest engine change on this list. It would also make future upgrades cheap, which is a plus.

---

## 4. The Shiftwright
**Pitch:** Carries the vault's weather inside it, and changes it at will.

> The halls drown. The sky breaks. It chooses which.

### Core mechanic
- **Aspects:** the Shiftwright is always in one of three Aspects, shown as one coloured chip by its HP. Each is a small slice of a Vault Shift, and it only affects you and your cards:
  - **Drowned:** Bleed you apply doesn't fade.
  - **Fractured:** your attacks deal +2; lose 2 HP at the end of your turn.
  - **Choir:** draw 1 more card at the start of your turn.
- **Attune** cards switch your Aspect. Other cards have bonuses that only work in one Aspect ("In Drowned: apply 3 Bleed"). The bonus lights up when it's active.
- **The Shift link:** each fight starts in the Aspect that matches the loop's Vault Shift (Drowned Halls, Fractured Sky, Choir Awake; any other Shift starts in Drowned). Scouting the next Shift and the Shift Bell now help you plan a Shiftwright loop.

**Reuses:** `applyStatus` (Bleed), `damage`, `ward`, `draw`, `loseHp`, `if`.
**New engine pieces:**
- `CombatState.aspect`, effect `attune { aspect }`, condition `inAspect`.
- Aspects as small, player-only versions of the combat modifiers the Shifts already set (Bleed fading, damage bonus, draw count), read live instead of fixed at fight start.
- Trigger `attuned` for relics.

### Starting deck (68 HP)
| Card | Cost | Effect |
|---|---|---|
| Tide Strike ×4 | 1 | Deal 6. |
| Squall Ward ×4 | 1 | Gain 5 Ward. |
| Turn the Tide | 0 | Attune Drowned. Apply 3 Bleed. |
| Break the Sky | 1 | Attune Fractured. Deal 7. |

**Starter relic: Weathervane.** The first time you Attune each turn, draw 1.

### Example reward cards
| Card | Cost | Rarity | Effect |
|---|---|---|---|
| Undertow | 1 | common | Deal 5. In Drowned: apply 3 Bleed. |
| Stormglass | 1 | common | Gain 5 Ward. In Fractured: gain 9 instead. |
| Hymn of the Choir | 1 | common | Attune Choir. Gain 6 Ward. |
| Riptide | 2 | uncommon | Apply 2 Bleed to all foes. In Drowned: twice. |
| Skyfall | 2 | uncommon | Deal 4 to all foes, twice. In Fractured: three times. |
| Chorus of Storms | 1 | uncommon | Draw 2. In Choir: also gain 1 Resonance. |
| Eye of the Storm | 1 | rare | Until end of turn, you count as being in every Aspect. Fade. |
| The Long Weather | 2 | rare | Your Aspect can't change this fight. Its effect doubles. Fade. |

### Alternate kits
- **The Drowned:** Undertow and Riptide in place of two Tide Strikes. Bleed that never ends.
- **The Stormcaller:** Skyfall and Stormglass in place of a Tide Strike and a Squall Ward. Burn HP for blows.

### Unlock
Work **The Weathervane**, 160 Shards.
> *"It turned in no wind. It pointed where the vault was going."*

### Build size: M
- **Balance:** Shifts already favour some classes; this Warden favours three Shifts openly. Drowned plus Bleed may echo the Relic-Breaker's strongest Bleed builds. The Long Weather doubling Fractured (+4, lose 4 HP) needs a check.
- **Phone UI:** medium. "In X:" text must be easy to read; the active bonus should light up, inactive ones dim. Three colours must stay distinct for colour-blind players (add an icon per Aspect).
- **Bot sim:** moderate. The bot needs a simple rule for when to Attune (match the Aspect to the most cards in hand).

---

## 5. The Mirrorborn
**Pitch:** Reads what the enemy is about to do, and does it first.

> It has no face of its own. It borrows yours.

### Core mechanic
- **Mirror:** you play the target's *current intent* yourself, at 75% strength (rounded up). Its attack becomes your attack on it. Its Ward becomes your Ward. Debuffs it planned for you land on it. Buffs it planned for itself go to you.
- **Steal:** you take the intent away. The enemy does nothing this turn (its intent shows *Robbed*). A **Stolen** card that copies the move goes into your hand: cost 1, Fades, gone at end of turn if not played. Bosses can't be robbed; Steal on a boss halves its move instead.
- Intents are already chosen, stored and shown, so the player always sees what a Mirror will do. The card shows a live preview: "Mirror: Sunder 8 → deal 6".
- **The link:** the Sleeper replays your enemies' moves; the Mirrorborn does the same to them. It also fits the Mirror Wraith and *The Mirror That Remembers*.

**Reuses:** enemy moves are already `Effect` lists (damage, ward, applyStatus), so Mirror mostly resolves them with you as the source and `self` and `target` swapped. Fading copies already exist for Echo.
**New engine pieces:**
- Effects `mirrorIntent { scale, who }` and `stealIntent`.
- A generated temporary card built from a move, with generated text.
- An intent state *Robbed*, and a rule for delayed enemy attacks (the Sleeper's Dream): mirroring one queues it on your timeline.

### Starting deck (66 HP)
| Card | Cost | Effect |
|---|---|---|
| Glass Edge ×4 | 1 | Deal 6. |
| Silvered Ward ×4 | 1 | Gain 5 Ward. |
| Reflection | 1 | Mirror the target's intent at 75%. |
| Mimic's Guard | 1 | Gain Ward equal to the target's intended damage (max 12). |

**Starter relic: Cracked Mirror.** The first Mirror each fight resolves at full strength.

### Example reward cards
| Card | Cost | Rarity | Effect |
|---|---|---|---|
| Copycat | 0 | common | Mirror the target's intent at 50%. |
| Foreknowledge | 1 | common | Gain 4 Ward. If the target intends to attack, draw 1. |
| Two Faces | 1 | uncommon | Mirror the target's intent at 75%. Echo. |
| Turn It Back | 2 | uncommon | Gain Ward equal to the target's intended damage, and deal that much to it. |
| Pilfer | 2 | uncommon | Steal the target's intent. Fade. |
| Hall of Mirrors | 2 | uncommon | Mirror every enemy's intent at 75%. |
| Perfect Copy | 2 | rare | Mirror the target's intent at 150%. |
| Shatter the Glass | 3 | rare | Steal every enemy's intent. Fade. |

### Alternate kits
- **The Face-Thief:** Pilfer and Copycat in place of a Glass Edge and a Silvered Ward. Take their turn away.
- **The Glass Wall:** Foreknowledge and Turn It Back in place of two Glass Edges. Let them strike first, and pay it back.

### Unlock
Work **The Mirror That Kept Its Face**, 170 Shards.
> *"The glass remembered everyone who looked in. One day it stepped out."*

### Build size: M
- **Balance:** Mirror is only as good as the enemy's move. Ward-only turns make it weak, big hits make it great, so fights swing more. Steal on elites may trivialise them; it may need a once-per-fight limit.
- **Phone UI:** medium. The live preview on the card is the whole class; it must fit two short lines at 320px. Multi-enemy fights need the target clear (it already is).
- **Bot sim:** easy. Mirror attack intents, Ward on others.

---

## 6. The Tollkeeper
**Pitch:** Collects a toll from everything it kills, and decides whether to spend it now or carry it home.

> Nothing passes free. Not even the dead.

### Core mechanic
- **Toll** is a loop-wide resource, shown as a coin count by your HP. You gain it from kills (1 per normal enemy, 3 per elite, 5 for the boss) and from cards.
- **Pay N:** cards with a bonus you buy with Toll. If you have enough, you pay and get the bonus; if not, you get only the base effect. No choice prompt.
- **Carry it home:** when the loop closes, leftover Toll becomes Shards: 2 per Toll if you escaped, 1 per Toll if you died, at most 60 Shards per loop.
- So every Pay card asks the real question of the idle layer: spend for this fight, or bank for the Outpost.
- Shrines gain a rite for the Tollkeeper, **Tithe**: pay 5 Toll to heal 15% more.

**Reuses:** `damage`, `ward`, `draw`, `gainResonance`, `if`.
**New engine pieces:**
- `RunState.toll`, effects `gainToll` and `pay { amount, then, else }`.
- Amounts `toll` and `tollPaidThisFight`.
- Trigger `enemyDied` (useful beyond this class), and a "if this kills" condition.
- Toll to Shards in `closeLoop`, plus the Shrine rite.

### Starting deck (70 HP)
| Card | Cost | Effect |
|---|---|---|
| Collector's Blade ×4 | 1 | Deal 6. |
| Iron Ledger ×4 | 1 | Gain 5 Ward. |
| Exact Payment | 1 | Deal 7. If this kills, gain 2 Toll. |
| Bribe the Dark | 1 | Pay 2: gain 2 Resonance and draw 1. Otherwise, gain 4 Ward. |

**Starter relic: Tollhouse Lantern.** At the start of each fight, gain 1 Toll.

### Example reward cards
| Card | Cost | Rarity | Effect |
|---|---|---|---|
| Shake Down | 1 | common | Deal 7. If this kills, gain 2 Toll. |
| Hired Steel | 1 | common | Pay 2: deal 14. Otherwise, deal 5. |
| Gilded Ward | 1 | common | Pay 1: gain 10 Ward. Otherwise, gain 4. |
| Interest | 0 | uncommon | Gain 1 Toll per 5 Toll you hold (max 3). Fade. |
| Bought Time | 1 | uncommon | Pay 3: gain 2 Resonance and draw 2. |
| Golden Hail | 2 | uncommon | Deal 1 per Toll you hold to all foes (max 20). Pays nothing. |
| Debt Collector | 2 | rare | Deal 6, plus 3 per Toll paid this fight. |
| The Final Toll | 3 | rare | Pay all your Toll. Deal 5 per Toll paid. Fade. |

### Alternate kits
- **The Miser:** Golden Hail and Interest in place of a Collector's Blade and an Iron Ledger. Hoard, and let the hoard hit.
- **The Spendthrift:** Hired Steel and Gilded Ward in place of two Collector's Blades. Spend every coin.

### Unlock
Work **The Toll Gate**, 150 Shards. It pays itself back in a few good loops, which is the joke.
> *"The gate was never locked. You only had to pay."*

### Build size: S
- **Balance:** the Outpost economy. A Tollkeeper must not out-earn digging, or every other Warden feels poor. The 60-Shard cap and the "died: half rate" rule are the brakes. The Daily Descent (no Echo, no rewards) would have to ignore Toll.
- **Phone UI:** low. One counter, and Pay cards dim their bonus when you can't afford it.
- **Bot sim:** easy, but the sim's Shard totals must count Toll so the economy can be checked.

---

## Comparison
| Warden | Mechanic | Ties into | Build size | Phone-UI risk |
|---|---|---|---|---|
| Sin-Eater | Devour curses; scale with curses carried | Curses, Corruption | M | Low |
| Somnant | Drowse status puts enemies to sleep | Awakening, the Sleeper | M | Low |
| Pilgrim | Cards gain Miles as you walk the map | The map, Echo snapshots | L | Low–medium |
| Shiftwright | Three Aspects, switched by cards | Vault Shifts, Scout, Shift Bell | M | Medium |
| Mirrorborn | Copy or steal the enemy's intent | Enemy intents, the Sleeper | M | Medium |
| Tollkeeper | Toll currency, spend or bank as Shards | Outpost economy | S | Low |

## Recommendation
**Build the Somnant first.**
- It's the most different to play. The other three Wardens all race to deal damage; the Somnant controls *when enemies act*, which no class does yet.
- It ties into the Awakening, the game's long arc, and gives players a reason to let the Sleeper stir rather than Lull it.
- It's mostly one new status plus an intent state. The intent display, status badges and the `if`/status conditions all exist. Nothing new on screen except one badge and one icon.
- The bot can play it with simple rules, so the sim can tune it to the same win rate as the others (about 33–37%).

**Then the Tollkeeper**, as a quick, small build that makes the Outpost economy part of a run. Build it once the Shard totals in the sim are trusted.

**Leave the Pilgrim for last.** It's the best fit for "fight repetition", but per-card deck state is a big change. If card upgrades are ever wanted for all classes, build that system first and the Pilgrim becomes medium.

## Open questions
1. **Should Devour remove curses for good?** It makes the Sin-Eater's tainted rewards nearly free. The alternative: Devour removes the curse for this fight only, and only Absolution removes it for good.
2. **Should Wardens scale with world state?** The Somnant grows with the Awakening stage. That's a nice link, but it means a new player meets a weaker version. The alternative: a flat 2 Drowse at fight start, and the Awakening link only on rare cards.
3. **Can a Warden earn Shards directly?** The Tollkeeper is the first class that feeds the Outpost from inside a run. If that feels wrong, Toll could instead become Research points or reduce the next Lull's cost.
4. **Unlock gates beyond Shards?** The Somnant waits for Awakening stage 1. The Mirrorborn could wait until you've met *The Mirror That Remembers*. Gates add discovery but can hide a Warden for weeks. Recommendation: Shards only, with the gate shown as a hint, not a lock.
5. **How many Wardens in total?** Each one is about 24 cards, 7 relics, 2 kits and art. Six more would double the content. Recommendation: commit to one at a time and decide after each how the reward pools and the Archive cope.
