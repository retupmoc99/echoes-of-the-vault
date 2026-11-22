# Design: the Shiftwright (Warden 7)

*Status: built in 0.21.0.*

**Changed in tuning:**
- **Drowned is now "Bleed you apply to foes is 1 stronger"**, with normal fading. "Bleed never fades" won 85–90% even with no reward cards. The cards' own Bleed came down by 1 to match.
- **Fractured is +1 per hit** (+2 doubled), and still costs 1 HP a turn.
- **Attune only counts when the Aspect changes**, so the Weathervane can't be milked by re-attuning. **Turn the Tide costs 1.**
- **Bot:** 37% standard; the Drowned 37% and the Stormcaller 36%.
*Unlocked by the deed **Weathered** (escape under 3 different Vault Shifts), then the Work **The Weathervane** (180 Shards).*

> The halls drown. The sky breaks. It chooses which.

## The pitch
The Vault Shifts bend whole loops. The Shiftwright carries three of them **inside itself** and switches between them mid-fight. Each fight begins in the Aspect that matches the loop's Shift, so scouting the next Shift and ringing the Shift Bell become part of planning a run.

## Core rules
- **Aspects:** the Shiftwright is always in exactly one, shown as a coloured chip by its HP with its own icon (so it isn't colour alone).

| Aspect | Effect (on you and your cards only) | Icon |
|---|---|---|
| **Drowned** | Bleed on foes doesn't fade. | a water drop |
| **Fractured** | Your attacks deal +2. At the end of your turn, lose 1 HP. | a crack |
| **Choir** | Draw 1 more card at the start of your turn. | a bell |

- **The Shift link:** each fight starts in Drowned under *The Drowned Halls*, Fractured under *The Fractured Sky*, and Choir under *The Choir Awake*. Under any other Shift it starts in Drowned.
- **Attune X** switches your Aspect, effective at once (Choir's extra draw comes at your next turn).
- **"In X:"** bonuses apply only while you're in that Aspect. Card text shows them lit or dimmed.
- **Design change from the idea:** Fractured's self-damage is 1 HP, not 2. It pairs with +2 damage on every hit, and 2 HP a turn was a tax the sim punished hard.

## The Warden
- **HP 68.** Starter relic: **Weathervane** (whenever you Attune, draw 1; at most once a turn).
- Archetypes: `tide`, `storm` and `choir`.
- 24 cards of its own: 4 starters plus 20 rewards, six research-locked (🔒).

### Starting deck
| Card | Cost | Type | Effect |
|---|---|---|---|
| Tide Strike ×4 | 1 | strike | Deal 6. |
| Squall Ward ×4 | 1 | ward | Gain 5 Ward. |
| Turn the Tide | 0 | rite | Attune Drowned. Apply 3 Bleed. |
| Break the Sky | 1 | strike | Attune Fractured. Deal 7. |

### Reward cards
| Card | Cost | Rarity | Type | Effect |
|---|---|---|---|---|
| Undertow | 1 | common | strike | Deal 5. In Drowned: apply 3 Bleed. |
| Stormglass | 1 | common | ward | Gain 5 Ward. In Fractured: gain 9 instead. |
| Hymn of the Choir | 1 | common | ward | Attune Choir. Gain 6 Ward. |
| Rising Water | 1 | common | rite | Attune Drowned. Apply 2 Bleed to all foes. |
| Thunderclap | 1 | common | strike | Attune Fractured. Deal 4 to all foes. |
| Plainsong | 0 | common | rite | Attune Choir. Draw 1. |
| Squall Line | 1 | common | strike | Deal 4 twice. In Fractured: three times. |
| Brine Ward | 1 | common | ward | Gain 6 Ward. In Drowned: apply 2 Bleed too. |
| Riptide | 2 | uncommon | rite | Apply 2 Bleed to all foes. In Drowned: twice. |
| Skyfall | 2 | uncommon | strike | Deal 4 to all foes, twice. In Fractured: three times. |
| Chorus of Storms | 1 | uncommon | rite | Draw 2. In Choir: also gain 1 Resonance. |
| Barometer | 1 | uncommon | ward | Gain 8 Ward. Attune to the next Aspect (Drowned → Fractured → Choir → Drowned). |
| 🔒 Deep Current | 1 | uncommon | strike | Deal 4, plus 2 per Bleed on the target. In Drowned: plus 3 per Bleed. |
| 🔒 Lightning Rod | 1 | uncommon | ward | Gain 10 Ward. In Fractured: deal 6 to a random foe. |
| 🔒 Canticle | 1 | uncommon | rite | In Choir: gain 2 Resonance. Otherwise Attune Choir. |
| Eye of the Storm | 1 | rare | rite | Until the end of the turn, you count as in every Aspect. Draw 1. Fade. |
| The Long Weather | 2 | rare | rite | Your Aspect's effect is doubled for the rest of the fight (Drowned also adds 1 Bleed to each attack's target; Fractured +4 and lose 2 HP; Choir draws 2 more). Fade. |
| 🔒 Maelstrom | 2 | rare | strike | Deal 6 to all foes. Drowned: apply 4 Bleed to all. Fractured: deal 6 more to all. Choir: draw 2. |
| 🔒 Weathermaker | 1 | rare | rite | Attune to the next Aspect. Gain 1 Resonance. Draw 1. Fade. |
| 🔒 Cataclysm | 3 | rare | strike | Deal 20. In Fractured: deal 10 to all other foes too. |


### Relics
| Relic | Rarity | Effect |
|---|---|---|
| Weathervane (starter) | starter | Whenever you Attune, draw 1 (once a turn). |
| Rain Chime | common | Whenever you Attune, gain 3 Ward. |
| Storm Jar | common | Turn start: in Fractured, gain 3 Ward. |
| Tide Pool | uncommon | Turn start: in Drowned, apply 1 Bleed to all foes. |
| Choir Bell | uncommon | Turn start: in Choir, gain 4 Ward. |
| Broken Barometer | uncommon (tainted, +1 Corruption) | Whenever you Attune, gain 1 Resonance. |
| Eye of the Vault | rare | Fight start: Attune to the next Aspect and gain 6 Ward. |
| The Fourth Weather | rare | Your "In X:" bonuses work in every Aspect for your first turn each fight. |
| Drowned Vane (the Well) | rare | Whenever you Attune, apply 2 Bleed to all foes. |

### Kits
- **The Drowned:** Undertow and Riptide in place of two Tide Strikes. Bleed that never ends.
- **The Stormcaller:** Skyfall and Stormglass in place of a Tide Strike and a Squall Ward. Burn for blows.

## Engine work
- **State:** `CombatState.aspect` and `aspectBoost` (The Long Weather), set at fight start from the loop's Shift. The run passes it in the combat setup.
- **Effect `attune { aspect | 'next' }`:** sets the Aspect and fires `attuned`. **Condition:** `inAspect` (true for any Aspect during Eye of the Storm's turn).
- **Aspect hooks:**
  - Drowned: enemies' Bleed decay is 0.
  - Fractured: the player's attacks get +2 (more with boosts), and the player loses HP at turn end.
  - Choir: +1 draw at turn start.
- **Effects:** `aspectBoost` and `allAspects` (Eye of the Storm). **Trigger:** `attuned`.
- **Bot:** Attune to the Aspect the most cards in hand want; Drowned when holding Bleed cards.

## UI
- An Aspect chip by the player's HP, with icon and colour (Drowned blue, Fractured magenta, Choir gold). Tapping it explains the effect.
- **First-time hint (`shiftwright`):** "You carry three weathers. Attune cards switch them; 'In X:' bonuses only work in that Aspect."

## Balance targets
- 32–37% at stage 0, with kits within 4 points. Check it under each of the three matching Shifts.

## Art direction
**Stormy teal, deep blue and lightning white:** weather vanes, rain, cracked skies, bells, tides, barometers. Prompts under "Shiftwright cards" and "Shiftwright relics".
