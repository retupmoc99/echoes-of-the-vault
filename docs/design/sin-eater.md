# Design: the Sin-Eater (Warden 5)

*Status: built in 0.21.0.*

**Changed in tuning (bot sim):**
- **Tainted cards cost the Sin-Eater a curse, not Corruption.** Taking them as designed sank it to 5–15%, because Corruption made every enemy stronger while the curses barely helped. Paying in curses fits the class and makes the tainted offer its real engine.
- **HP 66.** Black Salt gives 3 Ward per Devour. Swallow deals 6, plus 10 with Devour.
- Burden numbers are lower, because curses now come in faster:
  - Bitter Feast: 4 + 2 per curse.
  - Sin-Bloated: 2 per curse, twice.
  - Heavy Heart: 5 + 1 per curse, twice.
- Gorge, Maw and Gnash were trimmed for the same reason.
- Sin Shield gives 12 Ward, plus 8 with Devour (not "retain Ward", which lasts the whole fight).
- **Bot:** 27% standard; the Glutton 24% and the Penitent 36%.

**Changed in 0.21.1 (with the drafting bot):**
- The old 27% came from the bot always taking the tainted card. Drafting properly, the Sin-Eater wins 54%, in line with the others.
- **Communion of Ash:** 3 Ward + 1 per curse (at most 9), was 3 per curse + 3. **Gorge:** 8 per curse eaten, was 7.
- **Burden caps:** Bitter Feast at most 16, Heavy Heart at most 11 a hit, Sin-Bloated at most 12 a hit, Sin Ledger at most 6, Ash Crown at most 12.
- **Kits:** the Glutton is Gorge and Sackcloth; the Penitent is just Communion of Ash. Bot: Glutton 48%, Penitent 56%.
*Unlocked by the deed **Fed on sin** (close a loop carrying 3+ curses), then the Work **The Ash Table** (170 Shards).*

> Every curse is a meal. The Sin-Eater is never full.

## The pitch
Every other Warden treats curses as a cost. The Sin-Eater **eats** them. A curse in hand becomes fuel for its **Devour** cards, and cards with **Burden** grow with every curse it carries.

That turns the game's punishments into resources. The tainted offer after each fight, the curses Corruption plants, and the events that curse you all become things it wants. Corruption still raises enemy HP and damage, so greed stays a real risk.

## Core rules
- **Devour:** *"Devour: if you hold a curse, eat it, then [bonus]."*
  - It eats the leftmost curse in your hand. There's nothing to pick.
  - An eaten curse is gone **for this fight only** (it Fades). Its "if held at end of turn" penalty never fires.
  - With no curse in hand, the card does only its base effect.
- **For good:** only *Absolution* (rare) removes curses from your deck permanently. **Design change from the idea:** Devour used to remove curses for good, which made the tainted offer nearly free. Now curses come back each fight, as fuel.
- **Burden:** some cards scale with **curses in your deck**: every curse across your hand, draw pile and discard pile in this fight, eaten ones not counted.
- **Making curses:** a few cards shuffle a random curse into your **draw pile** for this fight only (Take the Sin, Last Supper). It's never added to your real deck.
- **The starting deck holds one curse** (Gnawing Static), so Devour works from the first fight.

## The Warden
- **HP 68.** Starter relic: **Black Salt** (whenever you Devour, gain 3 Ward).
- Archetypes: `devour` and `burden`.
- 23 cards of its own: 3 starters plus 20 rewards, six research-locked (🔒).

### Starting deck (standard kit, *The Sin-Eater*)
| Card | Cost | Type | Effect |
|---|---|---|---|
| Bitter Strike ×4 | 1 | strike | Deal 6. |
| Ash Shroud ×4 | 1 | ward | Gain 5 Ward. |
| Swallow | 1 | strike | Deal 5. Devour: deal 8 more. |
| Gnawing Static | – | curse | Unplayable. (The first meal.) |

### Reward cards
| Card | Cost | Rarity | Type | Effect |
|---|---|---|---|---|
| Take the Sin | 0 | common | rite | Shuffle a random curse into your draw pile. Gain 1 Resonance. Fade. |
| Bitter Feast | 1 | common | strike | Deal 4, plus 3 per curse in your deck. |
| Grave Hunger | 1 | common | ward | Gain 5 Ward. Devour: draw 2. |
| Gnash | 1 | common | strike | Deal 7. Devour: deal 7 more. |
| Salt the Wound | 1 | common | rite | Apply 3 Bleed. Devour: apply 3 more. |
| Sackcloth | 1 | common | ward | Gain 7 Ward. If you hold a curse, gain 3 more. |
| Hungry Eyes | 0 | common | rite | Draw 1. Devour: draw 2 more. |
| Ash Mouth | 1 | common | strike | Deal 4 to all foes. Devour: deal 4 to all foes again. |
| Communion of Ash | 1 | uncommon | ward | Gain 4 Ward per curse in your deck. |
| Gorge | 2 | uncommon | strike | Devour up to 3 curses. Each one: deal 8 to all foes. |
| Feast of Crows | 1 | uncommon | strike | Deal 5, plus 4 per curse eaten this fight. |
| Bile | 1 | uncommon | rite | Apply 2 Weakened. Devour: apply 2 Exposed too. |
| 🔒 Sin Shield | 2 | uncommon | ward | Gain 12 Ward. Devour: your Ward isn't removed next turn. |
| 🔒 Heavy Heart | 1 | uncommon | strike | Deal 6, plus 2 per curse in your deck, twice. |
| 🔒 Glutton | 1 | uncommon | rite | Devour: gain 2 Resonance and draw 1. |
| Absolution | 2 | rare | rite | Devour every curse in hand, **removing them from your deck for good**. Each one: gain 6 Ward. Fade. |
| Sin-Bloated | 2 | rare | strike | Deal 3 per curse in your deck to all foes, twice. |
| 🔒 Maw of the Vault | 3 | rare | strike | Devour every curse in hand. Each one: deal 10 to all foes. |
| 🔒 Last Supper | 1 | rare | rite | Shuffle 2 random curses into your draw pile. Gain 2 Resonance. Draw 2. Fade. |
| 🔒 Eat the Sky | 2 | rare | strike | Deal 16. Devour: deal 16 more. |

### Relics (7, plus the starter and the Well relic)
| Relic | Rarity | Effect |
|---|---|---|
| Black Salt (starter) | starter | Whenever you Devour, gain 3 Ward. |
| Iron Stomach | common | Turn start: if you hold a curse, gain 4 Ward. |
| Bone Fork | common | Whenever you Devour, deal 4 to a random foe. |
| Tithe Bowl | uncommon | Fight start: shuffle a random curse into your draw pile and draw 1. |
| Sin Ledger | uncommon | Turn end: gain 1 Ward per curse in your deck. |
| Gilded Tongue | uncommon (tainted, +1 Corruption) | Whenever you Devour, gain 1 Resonance. |
| The Last Meal | rare | Whenever you Devour, draw 1. |
| Ash Crown | rare | Fight start: gain 2 Ward per curse in your deck. |
| Drowned Chalice (the Well) | rare | Whenever you Devour, deal 3 to all foes. |

Plus the shared relics (Lodestone Heart, Mirrorglass Ward, Ash Rosary) in its pool.

### Kits (60 Shards each, shown once the Sin-Eater is owned)
- **The Glutton:** Gorge and Sackcloth in place of two Bitter Strikes. Eat everything. *(0.21.1: was Gorge and Take the Sin.)*
- **The Penitent:** Communion of Ash in place of an Ash Shroud. Carry the weight, wear it as armour. *(0.21.1: was Communion and Sackcloth, which won 69%.)*

## Engine work
- **Effect `devour { count | 'all', each, permanent? }`:** eats up to `count` curses from hand (leftmost first). For each one it resolves `each`, fires the `devoured` trigger, and counts toward `devouredThisFight`. With `permanent`, it also records the card for removal from the run deck when the fight ends (`CombatState.purged`, applied in `leave`).
- **Effect `shuffleIn { cardId | 'randomCurse', count, pile }`:** player-sourced fight-only copies. It sits alongside the enemy-only `addToDiscard`.
- **Amounts:** `cursesInDeck` and `devouredThisFight`. **Condition:** `curseInHand`. **Trigger:** `devoured`.
- **Retained Ward:** Sin Shield reuses `retainWard`.
- **Bot:** it plays Devour cards when it holds a curse, plays Burden cards late, and **takes the tainted offer**. A new bot rule, only for this class.

## UI
- Devour cards dim their "Devour:" clause when no curse is in hand. A small tag on curses ("edible") reminds you they're fuel.
- **First-time hint (`sin-eater`):** "Curses are food. Devour cards eat the leftmost curse in your hand for a bonus; it's back next fight."

## Balance targets
- 32–37% at Awakening stage 0, with kits within 4 points; checks at stages 3 and 5 and on floor 2.
- **Watch:** Burden scaling with deliberate Corruption (Sin-Bloated at 5 curses is 30 to all foes), and Absolution as a free deck-thinner.

## Art direction
Ash grey, bone white and **sickly gold**: mouths, bowls, salt, ash, candle smoke, gilded rot. Prompts go in `ART_GUIDE.md` under "Sin-Eater cards" and "Sin-Eater relics".
