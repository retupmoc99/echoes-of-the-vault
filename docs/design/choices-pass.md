# Design proposal: the Choices pass

*Status: built in 0.16.0 with the recommended choices. Changes from this proposal are listed in the changelog (the Relic-Breaker kit picks came from the sim).*

> Fewer coin flips, more decisions.

## The pitch
DESIGN.md has a list of **open questions**: rules I picked during earlier builds and flagged instead of quietly deciding. Most of them are about taking a decision away from the player: a random card removal, a last row with no choice, Echoes that can only be used up. This build settles them in one small pass, before adding anything big.

It's also the cheapest build of the three, with no new art, so it's a good one to play between the larger builds.

## The items

### 1. Event removals: you pick the card *(recommended: yes)*
**Now:** events that remove a card ("remove a random card") can delete your best card.
**Proposed:** you choose the card, but the event costs more to make up for it.
- Each event that removes a random card gets a picker (the same deck sheet the Shrine uses).
- The price goes up one step: 3 more HP, or +1 Corruption where the event already costs Corruption.
- Events whose *point* is the gamble can keep the random version as one of their options, at the old price.

### 2. The last row: Shrines gain a third rite *(recommended: Search)*
**Now:** the row before the boss is all Shrines: a guaranteed rest, but no real choice.
**Proposed:** keep the row (the rest before the boss matters), and give its Shrines a third rite:
- **Search the shrine:** open a sealed relic cache (2 relics, take one, Tainted ones possible), but no heal and no removal.
- So the last stop asks a real question: heal up, thin the deck, or gamble on one more relic.
- *Alternative:* mix Shrines and Caches in that row. I don't recommend it: some paths could reach the boss with no rest.

### 3. Echoes recover while resting *(recommended: yes)*
**Now:** Echoes never regain stability. Resting only pauses the drain.
**Why it matters more now:** the Echo-Caller spends Echo stability every time it Calls (8 per Call, 12 when one falls). A favourite Echo is used up quickly.
**Proposed:** a resting Echo recovers **2 stability per hour, up to half its starting stability.**
- It can never go above half, so new Echoes stay valuable and the slots still turn over.
- Unravelling stays a visible countdown, as before.
- Recovery counts within the existing 8-hour offline limit, so a long break still gives at most +16.

### 4. Evening out the Relic-Breaker's kits *(recommended: yes)*
**Now (bot sim):** Breaker 36%, Fault-Walker 46%, Bastion 24%.
**Proposed:** tune both with the same `SIM_KITS` method used for the new kits, to within about 4 points of the standard deck. Likely changes:
- **Fault-Walker:** replace Overcharge with a Ward Sigil.
- **Bastion:** keep Mirror Sigil, but replace Bulwark Slam with a damage card, so it can still close out fights.

The final picks come from the sim, and I'll report them before committing.

### 5. The tainted offer *(recommended: leave as is for now)*
**Now:** every card reward shows one extra rare card that costs +1 Corruption.
**Options:** show it only on elite rewards, or on half of all rewards.
**Recommendation:** no change until you've played more. If it starts to feel like noise, "elites only" is a two-line change.

### 6. Rewind picker as a rare card *(recommended: yes, one card)*
**Now:** Rewind always returns the most recent discards. That's predictable and phone-friendly, and it stays.
**Proposed:** add one rare Hour-Thief card, **Rewrite** (1 cost, Fade): *choose a card in your discard pile; return it to your hand; it costs 0 this turn.* It uses the same picker as item 1, and needs one new card image.

## Not in this build
These flags stay open, because they need real play to judge, not a design change:
- Paradox at 5 and Doomsday Clock (Hour-Thief tuning).
- Boss difficulty.
- Vault Shifts favouring one class or another.
- Hand overflow and targeting reach.

## Engine and save
- **Picker:** a small `chooseCard` follow-up step for events and the new card, reusing the Shrine's removal flow.
- **Shrine rite:** a `search` rite that rolls a cache, using the existing Cache code.
- **Echo recovery:** one change in the idle tick: resting adds stability, capped at `startStability × 0.5`. The drain logic is untouched. Existing saves need no migration (the starting stability is already stored).
- **Balance:** new keys `idle.restRecoveryPerHour: 2` and `idle.restRecoveryCap: 0.5`.

## Testing
- **Engine tests:** event pick versus random, the Search rite, recovery and its cap (including offline in pieces versus one block), and Rewrite.
- **`SIM_KITS` report** before and after the kit changes.
- **Preview check** of the pickers on 320px and wide screens.

## Art
- One card image: Rewrite.
