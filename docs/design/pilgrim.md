# Design: the Pilgrim (Warden 8)

*Status: built in 0.21.0.*

**Changed in tuning:**
- **HP 62.**
- **Road damage grows by about 1 per 3 Miles, not 1 per Mile.** Long Stride is 5 + ⅓ per Mile, and Footsore 6 + ⅓.
- **Road Ward grows at ⅓ per Mile:** Milestone 4 + ⅓, Wayshrine Ward 5 + ⅓.
- **Payoffs halved:** Long Road Home 1 per Mile, Pilgrim's End 10 + 1 per Mile, Thousand Steps ½ per Mile twice, The Last Mile 1½ per Mile.
- Carved Stone gives 2 Miles. Worn Compass gives 1 Ward per 3 Miles, at most 4.
- **Pilgrim's Rest** gives 7 Ward + ½ per Mile and draws 1. "Retain Ward" lasts the whole fight, which made Ward stack forever.
- **Kits:** the Wanderer swaps two Road Strikes; the Long Road swaps a strike and a cloak.
- **Bot:** 38% standard; the Wanderer 42% and the Long Road 40%.
*Unlocked by the deed **Back from the Well** (escape floor 2), then the Work **The Worn Road** (180 Shards).*

> The road is long. It counts every stone.

## The pitch
The Pilgrim starts weak and grows with every step. Its cards get stronger the farther you've walked this loop. It's the one Warden that loves long loops, which makes it the natural fit for the Deeper Vault: floor 2 is where it shines.

## Core rules
- **Miles:** you gain **1 Mile for every map node you enter** (fights, events, Shrines, Caches, the boss), floor 2 included. Elites give 2. Miles last for the whole loop and reset when it ends.
- **Road cards** scale with Miles: "Deal 3, plus 1 per Mile". A loop reaches about 9 Miles by the floor-1 boss and about 16 by floor 2's.
- The Mile count shows by your HP; tapping it explains it.
- **Design change from the idea:** Miles are **one count for the loop**, not stored on each card. Per-card Miles would have changed the save format of every deck, plus rewards, Shrines, events and Echo snapshots. One count keeps the same feel (the deck grows as you walk) for a fraction of the risk. *Tend* (Shrine) and *Carved Stone* still add Miles, just to the shared count.
- **Gaining Miles in a fight:** a few cards give Miles that count at once and stay for the loop.

## The Warden
- **HP 70.** Starter relic: **Worn Compass** (fight start: gain 1 Ward per Mile, at most 10).
- Archetypes: `road` and `rest`.
- 24 cards of its own: 4 starters plus 20 rewards, six research-locked (🔒).

### Starting deck
| Card | Cost | Type | Effect |
|---|---|---|---|
| Road Strike ×4 | 1 | strike | Deal 6. |
| Travel Cloak ×4 | 1 | ward | Gain 5 Ward. |
| Long Stride | 1 | strike | Deal 4, plus 1 per Mile. |
| Milestone | 1 | ward | Gain 4 Ward, plus 1 per Mile. |

### Reward cards
| Card | Cost | Rarity | Type | Effect |
|---|---|---|---|---|
| Trailblaze | 1 | common | strike | Deal 2 to all foes, plus 1 per 2 Miles. |
| Wayshrine Ward | 1 | common | ward | Gain 5 Ward, plus 1 per Mile. |
| Second Wind | 0 | common | rite | Draw 1. With 6+ Miles, draw 2. |
| Footsore | 1 | common | strike | Deal 5, plus 1 per Mile. |
| Walking Stick | 1 | common | strike | Deal 6. Gain 1 Mile. |
| Dust of the Road | 1 | common | rite | Apply 1 Weakened, plus 1 per 5 Miles. |
| Bedroll | 1 | common | ward | Gain 7 Ward. With 8+ Miles, gain 5 more. |
| Map Fragment | 0 | common | rite | Gain 1 Mile. Draw 1. Fade. |
| Pack Mule | 1 | uncommon | rite | Gain 1 Resonance. With 8+ Miles, gain 2 instead. Fade. |
| Long Road Home | 2 | uncommon | strike | Deal 2 per Mile. |
| Forced March | 1 | uncommon | rite | Gain 2 Miles. Lose 3 HP. |
| Pilgrim's Rest | 1 | uncommon | ward | Gain 3 Ward, plus 2 per 3 Miles, and retain your Ward next turn. |
| Milestone Ward | 2 | uncommon | ward | Gain 6 Ward, plus 1 per Mile, twice. |
| 🔒 Waystation | 1 | uncommon | rite | Draw 1, plus 1 per 6 Miles. |
| 🔒 Cairn | 1 | uncommon | ward | Gain 1 Mile. Gain 4 Ward, plus 1 per Mile. |
| Carved Stone | 1 | rare | rite | Gain 3 Miles. Fade. |
| Pilgrim's End | 3 | rare | strike | Deal 10, plus 2 per Mile. |
| 🔒 Thousand Steps | 2 | rare | strike | Deal 1 per Mile to all foes, twice. |
| 🔒 Far Horizon | 1 | rare | rite | Gain 1 Resonance per 5 Miles. Draw 1. Fade. |
| 🔒 The Last Mile | 2 | rare | strike | Deal 3 per Mile. Fade. |

### Relics
| Relic | Rarity | Effect |
|---|---|---|
| Worn Compass (starter) | starter | Fight start: gain 1 Ward per Mile (at most 10). |
| Hobnail Boots | common | Elites give 1 more Mile (3). |
| Prayer Beads | common | Turn start: with 8+ Miles, gain 3 Ward. |
| Road Map | uncommon | Fight start: gain 1 Mile. |
| Tin Cup | uncommon | Fight start: with 10+ Miles, gain 1 Resonance. |
| Pilgrim's Badge | uncommon (tainted, +1 Corruption) | Every node gives 1 more Mile. |
| Saint's Sandal | rare | Fight start: deal 1 per Mile to all foes (at most 12). |
| The Long Way Round | rare | Floor 2: every node gives 1 more Mile. |
| Drowned Lantern (the Well) | rare | Fight start: draw 1 per 8 Miles. |

### Kits
- **The Wanderer:** Trailblaze and Wayshrine Ward in place of a Road Strike and a Travel Cloak. More cards that grow.
- **The Long Road:** Footsore and Long Road Home in place of two Road Strikes. Payoff for walking far.

## Engine work
- **Run state:** `RunState.miles` (+1 per node entered, +2 for elites, plus relic bonuses). It's passed into each fight as `CombatSetup.miles`.
- **Fight state:** `CombatState.miles` (start value plus Miles gained in the fight). On leaving the fight, the gained Miles go back into the run.
- **Amounts:** `miles` (with `per`-step divisors through the existing `times`, using fractional times with floor) and `milesStep { n }` for "per N Miles". **Condition:** `milesAtLeast { n }`. **Effect:** `gainMiles { n }`.
- **Relics** read Miles at fight start through the same amounts. Hobnail Boots, Pilgrim's Badge and The Long Way Round are run-level and checked in `chooseNode`.
- **Bot:** plays normally. Road cards just get stronger.

## UI
- A Miles chip by your HP ("⟿ 7 Miles"); tapping it explains.
- **First-time hint (`pilgrim`):** "Every chamber you enter is a Mile. Road cards grow with your Miles, so the Pilgrim is strongest deep in a loop."

## Balance targets
- 32–37% at stage 0, with kits within 4 points. It should beat the others on floor 2: aim for 40%+ escaping floor 2 when it gets there.
- **Watch:** an early-floor weakness so harsh it dies at row 2.

## Art direction
**Dusty amber, road brown and candle gold:** boots, staffs, milestones, cairns, maps, distant lights, long roads. Prompts under "Pilgrim cards" and "Pilgrim relics".
