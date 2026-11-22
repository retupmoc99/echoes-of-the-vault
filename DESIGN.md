# Echoes of the Vault — Design

Living document: the current design and balance decisions. Numbers marked *(balance)* live in `src/data/balance.ts`.

## Pillars
1. **Fight repetition.** Synergies over flat upgrades, random Vault Shifts and events, several classes, a world that changes.
2. **Short bursts.** Auto-save after every action. Close mid-fight, resume exactly.
3. **Phone first.** Portrait, one thumb, touch targets ≥ 44px, nothing hover-only.

## Architecture
| Layer | Folder | Rule |
|---|---|---|
| Engine | `src/engine/` | Pure TypeScript. No React, no DOM, no clock: time is passed in. Deterministic from a seed. |
| Content | `src/data/` | Cards, relics, enemies, encounters, classes as typed `.ts` data. `balance.ts` holds global tuning. |
| Store | `src/store/` | Calls the engine, writes the save, forwards events to the FX layer. |
| UI | `src/ui/` | React screens and components, code-drawn SVG, FX (shake, flashes, haptics). |

**Key decisions**
- **Reducer engine.** `step(state, action, content) → { state, events }`. Inside, the step mutates a `structuredClone` of the state (readable rules); outside, states are immutable. A refused action returns the original state plus an `error`.
- **Events drive feedback.** The engine emits `attack`, `hpLoss`, `ward`, `status`, `relicOverload`… and the UI animates them. The engine never knows about the screen.
- **RNG lives in the state** (mulberry32, one 32-bit number). Reloading cannot re-roll a draw. Tested: saving and reloading after every action gives an identical fight.
- **Content is injected** into the engine. Tests use their own round-number content, so rebalancing real cards doesn't break engine tests.
- **Content as `.ts`, not JSON.** The compiler catches typos and gives autocomplete; adding content still never touches the engine.
- **Rules text is generated** from effect data (`engine/text/describe.ts`), so it can't drift from the numbers. In the hand it shows *live* values (Fracture, Weakened, Exposed already applied). A card can still override it with `text`.
- **Per-card numbers live with the card**, global rules in `balance.ts`. Putting "Shatter Lens deals 12" in the balance file would separate a card from its own text.

## Combat
- 3 Resonance and 5 cards per turn *(balance)*. Hand limit 10.
- Turn order: player turn → end of turn (discard hand, end-of-turn statuses) → each enemy in order (clear Ward, start-of-turn statuses, act, end-of-turn statuses) → new intents → player turn starts (clear Ward unless retained, Bleed, refill Resonance, draw).
- **Ward** absorbs attack damage and clears at the start of its owner's turn.
- **Damage formula:** `floor((base + Fracture + enemy bonus) × Weakened × Exposed)`. Previews and resolution use the same function.
- **Intents** are chosen at the end of the enemy turn and stored in the save. Patterns: `cycle` (with optional opening move) or `weighted` (with optional no-repeat).

### Statuses
| Status | Effect | Timing |
|---|---|---|
| Fracture | +1 attack damage per stack; lose ½ stacks (rounded down) in HP | End of owner's turn; **never fades** |
| Bleed | Lose HP equal to stacks (ignores Ward), then −1 | Start of owner's turn |
| Weakened | Attacks deal 25% less | −1 at end of owner's turn |
| Exposed | Takes 50% more attack damage | −1 at end of owner's turn |
| Paradox | Nothing, until it snaps: at 5+, lose 2 HP per stack, then reset to 0 | End of owner's turn |

### Time mechanics (any card can use them; the Hour-Thief is built on them)
- **Delay N:** effects go onto the **timeline** and land at the start of your turn N turns later, before you draw. Played on turn 3 with Delay 2, it lands at the start of turn 5.
  - The effect keeps its target; if that enemy died, it hits the first living one.
  - Delayed text shows *base* numbers, since modifiers may change before it lands.
  - Effects queued when a fight begins land after N turn starts, counting turn 1.
- **Hasten N:** every waiting effect moves N closer; anything at 0 lands immediately.
- **Echo:** after an Echo card is played, a *fading copy* returns to your hand at the start of your next turn.
  - Copies vanish when played (no discard) or at the end of the turn if not played.
  - Copies echo too, so a chain gives one copy per turn: bounded, never exponential.
- **Rewind N:** returns the most recent N cards from the discard pile to your hand.
  - It never picks the card being played (that isn't discarded until after it resolves). Play order matters.
- New amount `timeline` (per waiting effect), trigger `delayFired`, and card type **Temporal** (pale jade).

### Relics and Overload
- Relics can have a **passive** (triggers: `combatStart`, `turnStart`, `turnEnd`, `cardPlayed`, `gainedStatus`) and an **Overload** effect.
- Overload cards activate relics. Each activation adds **1 Strain**; at max Strain (default 3) the relic **cracks** and stops working entirely for the fight, passive included.
- Relic effects that need a target hit a random living enemy.
- Trigger chains are capped at depth 4 *(balance)*.

## Relic-Breaker (class 1)
70 HP. Starter: 4× Shard Strike, 4× Ward Sigil, Shatter Lens, Overcharge. Starter relic: Cinder Core.

| Archetype | Engine | Payoff |
|---|---|---|
| Fracture | Shatter Lens, Twin Shards, Fault Line, Hollow Vow, Crack the Seal | Blood Price (4+ Fracture), Release the Fault (3 per stack, then clears) |
| Ward | Ward Sigil, Glyph Wall, Mirror Sigil, Sigil Lattice | Bulwark Slam (damage = Ward), Rampart Breaker (2× Ward, then lose it), Bastion Rite (Ward stops fading) |
| Overload | Overcharge, Spark Tithe, Cascade, Coolant Litany, Unbind | Arc Conduit, Resonant Feedback (4 + 4 per Overload this turn) |
| Bleed | Serrate, Open Veins (all foes), Thorned Halo | Hemorrhage Glyph (doubles Bleed), Red Harvest (2 + 2× target's Bleed) |

**Bridges between archetypes** (so builds can mix):
- Scar Tissue: Ward from Fracture.
- Spark Tithe: Overload paid in HP.
- Unbind: Overload that adds Fracture.
- Fault Engine: Fracture gains deal AoE damage.
- Grieving Prism: Fracture gains give Ward.

**Curses:**
- Gnawing Static: unplayable.
- Hollow Echo: unplayable; lose 2 HP if it's still in your hand at end of turn.
- Leaden Thought: costs 1 Resonance, does nothing, Fades.

### Relics (10 in the pool, plus starter Cinder Core)
| Relic | Passive | Overload | Taint |
|---|---|---|---|
| Grieving Prism | Gain Fracture → 3 Ward | | |
| Thorned Halo | | 3 Bleed to all foes | |
| Stilled Heart | Turn start: 2 Ward | 8 Ward (max Strain 2) | |
| Bone Abacus | Play Overload card → 3 Ward | | |
| Lodestone Heart | Fight start: 1 Weakened to all foes | 4 Ward, draw 1 | |
| Ash Rosary | Play a Rite → 2 damage to all foes | | |
| Mirrorglass Ward | Turn end: 3 Ward | | |
| Fault Engine | Gain Fracture → 3 damage to all foes | | +1 |
| Hungering Eye | Turn start: +1 Resonance | | +2 |
| Grave Lantern | Turn start: gain 1 Fracture | 10 damage to all foes | +2 |

Relic-Breaker content: 30 cards (4 starter, 23 reward pool, 3 curses) and 11 relics.

## Hour-Thief (class 2)
68 HP *(balance; was 64 before 0.11)*: fragile, because its power arrives late.
- **Starter deck:** 4× Second Hand, 4× Stilled Moment, Slow Fuse (in 2 turns: deal 16), Stolen Second (Rewind 1, gain 1 Paradox).
- **Starter relic:** Cracked Hourglass (when a delayed effect lands: gain 3 Ward).
- **Unlock:** the Outpost Work *The Stolen Hour* (120 Shards). Choose the class on the Descend tab; switching Warden never changes the scouted map.

| Archetype | Engine | Payoff |
|---|---|---|
| The Long Fuse (Delay) | Slow Fuse, Patient Blade, Held Breath, Age the Flesh | Hour Bomb (in 3: 26 to all), Doomsday Clock (in 4: 50 to all), Countdown and Sundial Ward (scale with waiting effects), Accelerate (Hasten) |
| Recurrence (Echo) | Flicker (0 cost), Afterimage, Repeating Edge | Refrain (draw 2, echo), Chorus of Moments (+2 Resonance, +2 Paradox, echo) |
| Unwinding (Rewind and Paradox) | Stolen Second, Undo, Loop the Moment, Fray the Thread, Borrowed Time | Paradox Lance (4 per Paradox, then clear), Stitch the Wound, Temporal Shear (bonus at 3+ Paradox), Unmake the Hour |

- **Relics** (6 class relics plus 3 neutral):
  - Stopped Clock: end of turn at 3+ Paradox, 6 Ward.
  - Gilded Gear: play a Temporal card, 2 damage to all foes.
  - Reversed Compass: gain Paradox, 2 damage to all foes.
  - Last-Breath Locket: fight start, delayed 12 damage to all foes.
  - Pendulum of Ash: +1 Resonance and +1 Paradox each turn. Tainted +1.
  - Thief of Moments: draw 1 each turn. Tainted +2.
  - Neutral: Lodestone Heart, Mirrorglass Ward, Ash Rosary.
- **Research:** 6 cards are locked (Countdown, Stitch the Wound, Hour Bomb, Unmake the Hour, Chorus of Moments, Temporal Shear). They're appended to the Research queue with 2 new lore fragments. The queue is index-based, so appending keeps existing progress valid.
- **Bot check** (300 loops each, same simple bot):

  | Class | Wins | Turns per fight |
  |---|---|---|
  | Hour-Thief | 17% | 5.5 |
  | Relic-Breaker | 13% | 5.0 |

  The Relic-Breaker's number dropped from milestone 3 because its strongest bridge cards are now locked behind Research, and the bot never researches. The Hour-Thief's fights run longer, as you'd expect when damage arrives late.

**Shared content:** 8 events, 5 Vault Shifts, 8 normal enemies, 2 elites, 1 boss. Events and enemies are class-neutral by design.

## The run (one loop)
- **Map:** 8 rows plus the boss *(balance)*. Each row has 2–4 nodes. You visit one node per row, so 9 nodes per loop.
  - Row 0 is all Fights, and the last row before the boss is all Shrines (a breath before the Lock).
  - Paths never cross: each node links to a contiguous range of the next row.
  - Elites only appear from row 3. Elite, Shrine and Cache never repeat back-to-back along a path.
  - Every map has at least one Elite and one Event.
- **Node odds** (middle rows): Fight 45, Event 22, Shrine 13, Elite 10, Cache 10 *(balance)*.
- **Fight pools:** rows 0–3 draw from the *early* pool, rows 4+ from the *late* pool. Encounters you've already seen this loop are avoided.
- **Fight seeds:** each fight's seed is `runSeed:nodeId`, so a fight replays identically whatever path led to it.
- **HP carries over** between fights. There's no healing except at Shrines.
- **Shrine:** rest (heal 30% of max HP), or remove a card (deck can't drop below 5). Shrines in the last row before the boss add a third rite, **Search**: open a sealed relic cache instead (Tainted relics possible; the Reliquary Key adds a third relic).
- **Relic Cache:** two sealed relics, take one (or neither). Tainted relics can appear here.
- **Event:** one of 8 text events, never repeated within a loop.
- **Ending:** beating the boss is a *victory*. Dying or abandoning is a *death*. Either way the loop closes and is counted on the outpost screen.

## Rewards
- After every normal or elite fight: **pick 1 of 3 cards, or take nothing**.
  - Rarity odds: normal fights 60/32/8 (common/uncommon/rare); elites 25/50/25 *(balance)*.
- **Tainted offer:** every reward also shows one extra rare card that costs **+1 Corruption**. This is the main "power at a price" choice and it's always on the table.
- **Elites** also drop one relic (never a tainted one).
- When everything on the reward screen is resolved, you return to the map automatically. Fewer taps.

## Corruption (run-wide)
- **Sources:** tainted cards, tainted relics (+1 or +2), events, and the Hollow Bargain Shift. Some events *lower* it, at a cost.
- **Thresholds** 3 / 6 / 9 give tiers 1 / 2 / 3. Each tier:
  - enemies get **+8% max HP** and **+1 attack damage**
  - rewards get **+7 rare weight**
  - crossing into **tiers 2 and 3** plants a random curse in your deck, once
- Dropping below a threshold lowers the tier, but curses stay.
- Shown as a meter with threshold ticks; tap it for the current effects. Crossing a threshold shows a notice.

**Bot check** (300 loops; first path, first card):

| Bot | Wins | Peak Corruption | Curses per loop |
|---|---|---|---|
| Never takes the tainted card | 23% | 1.5 | 0.5 |
| Always takes the tainted card | 14% | 5.3 | 0.9 |

The greedy bot wins fights faster (4.4 vs 4.9 turns per fight) but loses more loops. Corruption has a real price. A human choosing *when* to be greedy should do far better than either bot.

## Events
Eight events, every option costs something:
- The Weeping Font
- Hall of Sleepers
- The Cartographer
- Altar of Cinders
- The Mirror That Remembers (a coin flip between a rare card and a curse)
- A Starving Echo
- The Tithe Collector (an ambush: every option hurts)
- Sealed Armory

Rules:
- Options you can't afford are shown but disabled: an option that would kill you, a relic you don't have, a deck already at its minimum. Events never kill outright.
- Random outcomes use the run's seed: same loop, same result.
- Effects available to events: lose HP, heal, max HP, Corruption ±, add card (specific, or random by rarity), add curse, remove random cards, gain or lose a random relic.

## Vault Shifts (one per loop)
| Shift | Effect |
|---|---|
| The Drowned Halls | Bleed never fades, on anyone. *(0.11: the "Shrines heal half" rule was dropped; it made this the hardest Shift for both classes.)* |
| The Choir Awake | Enemies +10% HP *(was +15%)*. Rewards offer 4 cards. |
| The Fractured Sky | Fracture gives +2 damage per stack but costs HP equal to *all* stacks each turn. |
| The Restless Engines | Relics take +1 Strain before cracking. Elites ×2.2 as common. |
| The Hollow Bargain | Start at 2 Corruption. Events and Caches ×1.6 as common. |
| *The Still Vault* | Neutral. Never rolled; given to loops that were in progress when milestone 3 arrived. |

How Shifts work:
- A Shift can only turn existing knobs: combat modifiers, node weights, Shrine healing, reward count, starting Corruption. New Shifts built from those knobs are pure data.
- The Shift is rolled from the run seed *before* the map, so it can reshape the map. `RunSetup.vaultShiftId` can force one, which is how Scout will reveal the next loop's Shift in milestone 4.
- **Combat modifiers** are computed when a fight starts: defaults, then the Shift, then Corruption tiers. They're stored in the fight's state, so a saved fight keeps its rules.
- Bot win rate by Shift (plain bot): Choir Awake 11%, Drowned Halls 19%, Fractured Sky 25%, Restless Engines 27%, Hollow Bargain 31%.

## Enemies
| Enemy | Pool | HP | Pattern |
|---|---|---|---|
| Hollow Sentinel | early | 38–42 | Cycle: Sunder 8 → Seal (7 Ward + 4) |
| Bleeding Lattice | early | 30–34 | Weighted, no repeat: Lacerate (4 + 2 Bleed) ×2, Fold (8 Ward) ×1 |
| Mirror Wraith | early | 34–38 | Opens with Gaze (2 Exposed + 3), then Rend 9 ↔ Gaze |
| Choir Shard ×2 | early | 18–22 each | Weighted, no repeat: Shriek 5 ×2, Dirge (1 Weakened + 4 Ward) ×1 |
| Rust Seraph | late | 44–48 | Cycle: Wingblade 5×2 → Ascend (gain 2 Fracture, 6 Ward) → Wingblade |
| Vein Crawler | late | 40–44 | Weighted, no repeat: Sap (4 Bleed), Gnash 11, Burrow (10 Ward) |
| Ash Hound ×2 | late | 22–26 each | Weighted, no repeat: Bite 6 ×2, Howl (1 Exposed + 3 Ward) |
| Tithe Engine | late | 50–54 | Cycle: Gather (12 Ward) → Collect 14 → Grind (4 + 2 Weakened) |
| Sentinel + Choir Shard | late | | Mixed pair |
| **Warden Unmade** | elite | 74–80 | Cycle: Mark (2 Exposed + 1 Weakened) → Execute 16 → Riposte (10 Ward + 6) |
| **Lens Tyrant** | elite | 70–76 | Cycle: Focus (+3 Fracture) → Beam 6×2 → Refract (12 Ward + 2 Bleed). Grows stronger *and* bleeds itself: a race. |
| **The Grieving Lock** | boss | 140–148 | Opens with Toll, then Shatter 12 (+1 Fracture) → Litany 4×3 → Bind (3 Bleed + 2 Exposed) → Toll (15 Ward + 1 Weakened) |

Enemies use Fracture too: it makes them hit harder and hurts them every turn.

Target: about 1 minute (3–5 turns) per normal fight.

**Bot check (milestone 2, no rewards):** won 22% of loops, most deaths at the boss, 5.2 turns per fight. See the Corruption section for milestone 3 numbers.

## Echoes and the Outpost (idle layer)
**Echoes.** Every closed loop, won or lost, leaves an Echo:
- **Name:** generated from the run seed, e.g. "Veyra the Hollowed".
- **Deck snapshot:** kept as a hook for summoning Echoes as allies.
- **Trait:** the first matching rule from the list below.
- **Stability:** 50 + 6 per depth reached, +30 for escaping, then × the trait's multiplier.

| Trait | When | Effect |
|---|---|---|
| Unbroken | escaped | stability ×1.3 |
| Ravenous | peak Corruption ≥ 6 | dig ×1.5, drain ×1.3 |
| Haunted | 2+ curses | research ×1.5, stability ×0.85 |
| Pathfinder | 2+ elites | scout ×1.6 |
| Scarred | 120+ damage taken | drain ×0.75 |
| Hoarder | deck ≥ 18 | research ×1.3 |
| Fleeting | depth ≤ 3 | stability ×0.7, all output ×1.25 |
| Faded | otherwise | none |

**Slots and tasks:**
- **3 slots.** With all three full, a new Echo waits: keep it by releasing an old one, or let it fade.
- **Tasks:** Rest (no drain, no output), Dig, Research, Scout.

| Task | Output | Drain per hour |
|---|---|---|
| Dig | 12 Shards per hour | 10 |
| Research | 1 point per hour; item *i* costs 2 + 0.5·*i* | 12 |
| Scout | 1 scout-hour per hour. 1.5h reveals the next Shift; 4h reveals the first 4 map rows | 8 |

**Unraveling is deterministic** (a decision I made; flagged below):
- An Echo works until its stability is gone, then Unravels at that exact moment, and output stops then too.
- The UI shows hours of work left, so the risk is visible and planned around, not a dice roll while you're away.
- **Resting Echoes recover** 2 stability per hour, up to half their starting stability, and never above it (0.16). Working Echoes don't recover.

**Offline progress:**
- `advanceIdle(save, now)` counts real time since `lastTickAt`, at most **8 hours** per absence.
- The same function runs on load, every 15 seconds while the app is open, and when the tab becomes visible again. One code path, and many small ticks give the same result as one long absence (tested).
- A clock set backwards counts as zero and never rewinds `lastTickAt`.
- After 90+ seconds away, a "while you were away" report appears. While the app is open, progress shows as toasts instead.

**Next loop and Scout:**
- The next loop is rolled in advance (`nextLoop`). Its seed is derived from the save, so the engine needs no clock.
- The scouted map preview is the *actual* map: the preview is built with exactly the same setup as the loop you will start (tested).
- The Shift Bell rerolls the Shift once per loop. A rerolled Shift reshapes the map, so an earlier map scout no longer applies.

**Research:**
- Six cards start locked out of rewards: Scar Tissue, Resonant Feedback, Red Harvest, Rampart Breaker, Unbind, Crack the Seal.
- Research unlocks them one at a time, alternating with six lore fragments. The full queue is about 57 Echo-hours, so the reward pool keeps growing for weeks.

**Outpost works** (options, not raw power):

| Work | Cost | Effect |
|---|---|---|
| Kit: The Fault-Walker | 60 | Alternate starting deck (Fracture) |
| Kit: The Bastion | 60 | Alternate starting deck (Ward) |
| Kit: The Fuse-Setter | 60 | Hour-Thief deck: Patient Blade and Accelerate (delayed blows) |
| Kit: The Afterimage | 60 | Hour-Thief deck: Afterimage and Repeating Edge (Echo cards) |
| Kit: The Shepherd | 60 | Echo-Caller deck: Rally the Dead and Hymn of Iron (more allies, shielded) |
| Kit: The Mourner | 60 | Echo-Caller deck: Release and Mourning (spends allies) |
| Second Sight | 70 | Reroll one card reward per loop |
| Shrine of Ash | 80 | Shrines gain "Purge 2 Corruption" |
| The Shift Bell | 90 | Reroll the Vault Shift once per loop |
| Reliquary Key | 100 | Relic Caches offer 3 relics instead of 2 |

Total 460 Shards for the Relic-Breaker's works: roughly 8 to 10 Echo lifetimes of digging. Each other Warden's two kits add 120 more.

**Kits** swap 2 of the 10 starting cards for 2 themed cards from that Warden's reward pool, never research-locked ones. They set a direction, not more power. A Warden's kit works stay hidden until that Warden is built (`requires` on the work).

**UI:**
- The Outpost replaces the old title screen. Bottom tabs: Descend, Echoes, Works, Archive.
- Opening the app with a loop in progress resumes straight into the loop.

## Look and feel
- **Glowing minimal:**
  - Near-black backgrounds with radial gradients.
  - Code-drawn SVG sigils for enemies, glyphs for map nodes, and a single accent hue per card type.
- **Fonts** are bundled, so they work offline:
  - Inter (variable) for all body and card text, for readability.
  - Cinzel only for titles.
  - Only the Latin subsets are precached.
- **Feedback:**
  - A canvas particle layer: ambient motes, plus bursts on hits, Bleed, Ward, deaths, Overloads and cracks. It finds positions through `data-fx-id` attributes.
  - Card flight: the played card flies to its target and burns out.
  - Hit flashes, floating numbers, screen shake, an enemy lunge when it acts, pulsing attack intents, and an End Turn button that breathes when no card is playable.
  - Haptics where supported; they can be turned off in Archive → Settings.
- **Reduced motion:** `prefers-reduced-motion` turns off ambient particles, bursts, card flight, shake and pulses.
- **Screen sizes:** the game is laid out for a phone, in a column up to 480px wide.
  - On wider screens (520px and up), such as a foldable's inner screen held upright, the whole game scales up with CSS `zoom` to fill the width.
  - The scale is the smaller of width ÷ 440 and height ÷ 720, in steps of 0.05, between 1 and 1.75. So no screen has less than 720px of layout height, and sideways screens barely scale.
  - Examples: 720×960 gives 1.3, 900×1100 gives 1.5, and phones and sideways screens give 1.
  - The particle layer and the painted background stay outside the scaled layer. Code that positions things from screen coordinates converts them with `layoutRect()` (`src/ui/uiScale.ts`).

## PWA
- `vite-plugin-pwa` in `generateSW` mode, with a manifest (standalone, portrait), icons (192, 512, maskable, Apple touch) and iOS meta tags.
- **Precached app shell** is about 700 KB: code, CSS, Latin fonts, icons.
- **Art is runtime-cached** (CacheFirst, `eotv-art`), so it never bloats the install.
- **Updates use `registerType: 'prompt'`:** a new version waits until the player taps Update, so the game never reloads mid-tap. Reloading is lossless anyway, since the save is written after every action.
- **Build layout:** hashed build files go in `dist/app/`; `dist/assets/` holds only art.
- **Service workers need HTTPS:** the Wi-Fi dev address runs the game but can't install it. Deploy to test installing.

## Art pipeline
- Every card, enemy, relic, node type and Vault Shift has an optional `image` field. By convention, `public/assets/<folder>/<content-id>.webp` is picked up automatically.
- `npm run art` converts `art-raw/` to spec and writes `src/data/assets.generated.ts`, the list of existing art. The game only requests images that exist: no 404s, and the code-drawn fallback otherwise. `<ArtImg>` also falls back if an image fails to load.
- Background keys: `outpost`, `vault`, `combat`, and optional `shift-<id>` per Vault Shift.
- Specs, budgets, ComfyUI prompts and Blender settings: see `ART_GUIDE.md`.

## Somnant (class 4)
Built in 0.20. See `docs/design/somnant.md` for the full card and relic list.
- **Drowse:** a status on foes. At the sleep threshold (normal 4, elite 7, boss 9, the Sleeper 12) the foe falls **Asleep** and its threshold rises (+2 normal, +3 otherwise).
- **Asleep:** it skips its next turn, stays asleep through your next turn, then makes the move it had planned (its intent shows "Waking: …"). Sleepers take 50% more attack damage. Drowse on a sleeper is lost, and hits don't wake it. A boss's phase change wakes it. Bleed, Fracture and its own delayed attacks still tick while it sleeps.
- **The Awakening link:** the starter relic, Sleeper's Hum, applies 2 Drowse to every foe as a fight begins, +2 per two Awakening stages.
- **The Warden:** 68 HP, 24 cards (6 research-locked), 7 relics plus the starter, two kits (the Lullaby, the Night-Knife), and the Drowned Hymnal as its Well relic.
- **On screen:** a Drowse chip shows progress ("◐ 2/4"). A sleeping foe dims, breathes slowly, and shows a violet closed-eye intent.
- **Unlock:** the deed *You hear it dreaming* (reach Awakening stage 3), then the Work *The Sleeper's Hymnal* (170 Shards).
- **Bot check:** 33% at stage 0 (the others: 33–36%), 28% at stage 3. **Flagged:** 8% at stage 5 (the others: 11–17%), and it escapes floor 2 20% of the time (the others: 28–47%). It struggles in long fights against big HP pools (the Sleeper, the Well). If that holds in real play, the likely fix is more damage on its rares, not more sleep.

## Wardens 5–9
Built in 0.21. Full designs: `docs/design/sin-eater.md`, `mirrorborn.md`, `shiftwright.md`, `pilgrim.md`, `tollkeeper.md`.

| Warden | Core rule | Unlock |
|---|---|---|
| **Sin-Eater** (66 HP) | **Devour** eats the leftmost curse in hand for a bonus (back next fight). **Burden** cards scale with curses carried. Tainted cards cost it a curse instead of Corruption. | Deed *Fed on sin* (close a loop with 3+ curses), then The Ash Table (170) |
| **Mirrorborn** (62 HP) | **Mirror** plays a foe's shown move yourself, turned around. **Steal** mirrors at 50% and robs the foe of its move (bosses: Weakened 2). | Deed *Seen in every glass* (beat every elite), then The Mirror That Kept Its Face (180) |
| **Shiftwright** (68 HP) | Always in one **Aspect**: Drowned (+1 to Bleed you apply), Fractured (+1 per hit, 1 HP a turn), Choir (+1 draw). Attune cards switch; fights start in the loop's Shift. | Deed *Weathered* (escape under 3 Shifts), then The Weathervane (180) |
| **Pilgrim** (62 HP) | **Miles:** +1 per chamber (elites 2) for the loop. Road cards grow with Miles. | Deed *Back from the Well* (escape floor 2), then The Worn Road (180) |
| **Tollkeeper** (70 HP) | **Toll:** from kills; **Pay N** cards spend it for a bonus; Shrines' Tithe (4) and reward rerolls (3) take it too. Never becomes Shards. | The Toll Gate (150), no deed |

- Each has 23–24 cards (6 research-locked), 7 relics plus a starter and a Well relic, two kits, a hint, and painted art.
- **Engine pieces added:** Devour and fight-only curses, Mirror and Steal (enemy moves resolved from the player), Aspects, run-level Miles and Toll carried into fights, `ifKilled`, once-per-turn relic triggers, relic `combatMods`, intent-reading amounts and conditions, and scaling draw and Resonance amounts.
- **Fixed on the way:**
  - Ward gained at the very start of a fight (Sleeper's Eye, Ash Crown) used to be wiped before your first turn.
  - "Retain Ward" lasts the whole fight. It's only used where that's intended.
- **Balance note (0.21.0):** the old bot won *more* with no card rewards (the Relic-Breaker 56% against 36% with them), because it took the rarest card, not the best.

### Test mode (0.21.1)
A hidden option for trying Wardens without earning them. Tap the version line at the foot of Archive → Settings five times, and an *Unlock all Wardens and kits* button appears. It adds every class's and kit's unlock (`testUnlockWardens`), costs nothing, leaves deeds and Shards alone, and sets `settings.testMode`. After that the section stays visible and the version line says "test unlocks used". **Design flag:** it's open to any player who finds it. That's fine for a free single-player game, but it could be hidden behind a dev build later.

### The drafting bot (0.21.1)
The balance bot now **drafts** (`src/sim/draft.ts`). It scores each offered card by rough value per Resonance, a bonus for archetypes already in the deck, and what the deck is short of (Ward or damage). It **skips** any card that doesn't beat the deck's average by a margin that grows with deck size. The Sin-Eater weighs the tainted card the same way, instead of always taking it.
- It beats both the old rarest-first bot and taking no cards, for every Warden (Relic-Breaker 69% against 38% and 55%). Its numbers are the ones to trust, and `SIM_PICK=rarest|none` still runs the old modes. `SIM_CLASS=<id>` sims one Warden.
- **All win rates rose about 20 points.** The old 32–37% target was set against the weak bot. With the drafter, the Wardens sit at **45–68%** at stage 0, about **17–28%** at stage 5, and 24–48% for a full floor-2 loop. Whether the game should be harder overall is an open question; the spread between Wardens is what the tuning aims at.
- **Old flags that were bot artifacts:** the Sin-Eater's 27% (always taking the tainted card) and the Somnant's stage-5 weakness. Both are mid-pack now.
- **Bot check, standard decks (400 loops, stage 0):** Relic-Breaker 68%, Somnant 60%, Pilgrim 55%, Sin-Eater 54%, Mirrorborn 54%, Shiftwright 53%, Tollkeeper 51%, Hour-Thief 50%, Echo-Caller 45%.
- **Still open:**
  - The Relic-Breaker is high and the Echo-Caller low.
  - Kits more than 5 points off: the Fuse-Setter +11, the Mourner +13, the Spendthrift −10, the Drowned −7, the Glutton −6.
  - On a full floor-2 loop the Sin-Eater (46%) and the Pilgrim (48%) lead; the others are at 24–30%, apart from the Relic-Breaker (44%). The Pilgrim is meant to shine there; the Sin-Eater isn't.

## Deeds
See `docs/design/deed-unlocks.md`. New Wardens (the Somnant first) are revealed by a **deed**: something done in the vault that fits the Warden. Then their Work appears with a Shards cost.
- The save keeps a **tally**: peak Awakening stage, most curses carried, elites beaten, Shifts escaped, and floor-2 escapes. It's updated when loops (and Dailies) close and when the Awakening rises.
- A deed is done whenever its goal (data) is met. A Work with `requires: 'deed:<id>'` stays hidden until then.
- Locked Wardens show their deed and progress. A notice marks the moment a deed is done, and Archive → Fragments lists deeds.
- The Hour-Thief and Echo-Caller stay Shards-only.

## The Deeper Vault (floor 2)
Built in 0.18–0.19. See `docs/design/deeper-vault.md`.
- **The stairs:** after your first escape, beating the floor-1 boss opens a choice. **Escape** ends the loop as a win, as before. **Descend** keeps your deck, relics and Corruption, heals 50% of max HP, and starts floor 2. Dailies never offer the stairs.
- **Floor 2:** 6 rows plus a boss (*The Bottom of the Well*). Node odds Fight 40, Event 20, Elite 15, Cache 15, Shrine 10; elites from row 1. Normal fights roll rewards with elite odds; elites also drop 20 Shards. The last row's Shrines can be Searched.
- **The Weight:** if the enemies broke through all your Ward, you lose 1 HP as your next turn starts. (Checked before Ward resets; the first draft checked after, so it hit every turn.)
- **Shards:** any stage-4 escape bonus is *held* while you go down. Escape floor 2 for twice the held bonus plus 60; die there and keep half of it. Unmaking the Sleeper on floor 1 still ends the cycle even if you then die below.
- **Depth** counts on from floor 1 (floor 2's first row is depth 10), so floor-2 Echoes are much steadier. Echoes from floor 2 get the **Deepborn** trait (stability ×1.2; as allies, +4 Ward each turn). A floor-2 loop adds +2 Awakening progress.
- **The Well's relics:** the first escape from floor 2 adds one rare relic per Warden to its reward pool for good (Drowned Crown, Waterclock, Well-Rope). History counts escapes from the Well. Three lore fragments join the end of Research.
- **Enemies** (each leans on a rule floor 1 doesn't use): Drowned Bellringer (a timed toll of 15 you see coming), Hollow Pilgrims (a pair; when one dies the other gains Ward and hits harder), Rot Lantern (adds Smoke, a do-nothing card, to your discard pile), Gnawing Dark, three Stitched Choristers, The Unwound (gains 14 Ward at half HP); elites Keeper of Stairs and The Many-Handed; boss The Bottom of the Well (124–130 HP, three phases: waves, draining, drowning).
- **Bot check** (`SIM_DESCEND=1 npm run sim`, 600 loops, the bot always descends): it reaches floor 2 in about a third of loops and escapes it 34% (Relic-Breaker), 45% (Hour-Thief), 28% (Echo-Caller) of the time. The first draft was far too hard (2–3%); see the changelog for the passes.

## Daily Descent
One loop a day, the same for every player (0.17). See `docs/design/daily-descent.md`.
- **Seed:** `daily:YYYY-MM-DD` from the phone's local date, so every copy builds the same map, Shift, fights and rewards with no server.
- **Setup:** your chosen Warden with its standard kit, the full card pool, no Outpost works, Awakening and Cycle ignored. The Echo-Caller still Calls your own Echoes (so its Daily differs per player), but Calls cost them nothing.
- **One try per day.** Starting uses up the day; abandoning counts as a death. It can't start while a normal loop is running, and it leaves the next loop (and its scouting) untouched.
- **A side room:** no Echo, no Awakening progress, no change to the loop count. It pays 25 Shards, plus 50 for escaping, and adds a History row marked ☀.
- **Days played** is a total, never a streak. The Descend tab shows a Daily card from your second loop on, then "Done today" with a **Share** button (the phone's share sheet, or the clipboard).
- **Omens** (`src/data/omens.ts`): 12 one-line rules, rotated by date with no repeat inside 12 days. Each is data applied where the matching rule already lives (map config, rewards, combat modifiers, starting deck).

| Omen | Rule | Bot win rate (RB / HT / EC) |
|---|---|---|
| Glass Vault | 20% less max HP; 4-card rewards; Shrines heal 50% | 25 / 19 / 21 |
| Hoard | 2 extra starting relics; no Caches | 46 / 48 / 42 |
| Quickened | Draw 6; enemies +20% HP | 22 / 29 / 27 |
| Bleeding Moon | Attacks past Ward add 1 Bleed, both sides; enemies +15% HP | 38 / 32 / 38 |
| Quiet Vault | No Events; Shrines and Caches twice as common | 46 / 42 / 43 |
| Ascetic | No card rewards; enemies +10% HP | 38 / 24 / 27 |
| Crowded Halls | A Choir Shard joins every normal fight | 19 / 18 / 20 |
| Borrowed Strength | Start with 2 Corruption and a random rare | 29 / 28 / 18 |
| Long Night | One extra row; Shrines heal 50% | 47 / 40 / 39 |
| Heavy Hands | 4 Resonance, draw 4; enemies +15% HP | 48 / 33 / 28 |
| Paper Walls | 40% less Ward for you; enemies −20% HP | 27 / 22 / 23 |
| Clockwork | Every card costs 1 | 42 / 43 / 38 |

`SIM_OMENS=1 npm run sim` produces the table (300 loops each). The aim is roughly 20–45%: some days harder, none hopeless. First drafts of Glass Vault (half HP, 2%) and Ascetic (heal 6 per fight, 74%) were retuned.

## First run
New things arrive one at a time, so a new player isn't met with every system after one loop (0.19):
- **Loop 0:** the welcome hint, the Warden picker (other Wardens show as locked, with the Work that unlocks them) and Descend.
- **After loop 1:** scouting appears, and the Echoes tab shows a dot until the first Echo is set to work.
- **From loop 2:** the Awakening panel, and Give to the Sleeper on Echo cards. The Lull button appears once a stage is close.
- **From loop 3:** the Daily Descent card, with its own first-time hint.
- **After the first escape:** the stairs, with a hint.
- The Descend button is pinned to the bottom of the Outpost's scroll area, so it stays in reach however much is above it.

## Backups and hints
- **Save codes:** `EOTV1.<checksum>.<base64 UTF-8 JSON>`.
  - The FNV-1a checksum rejects truncated or edited pastes, and whitespace is ignored.
  - Importing runs the normal migrations, so an old backup restores into a newer build.
  - Restoring keeps the replaced save at `eotv.save.beforeImport`.
- **Last backup** time is stored per device (`eotv.lastBackup`), outside the save, so restoring doesn't reset it.
- **Hints:** texts live in `src/data/hints.ts`.
  - Each screen lists `[hintId, appliesNow]` candidates in priority order, and `<HintSlot>` shows the first unseen one.
  - Dismissed ids are kept in `settings.hintsSeen`.
  - In fights, hints sit above the player panel, so the intent and the cards stay visible.

## Echo-Caller (class 3)
Full design: [docs/design/echo-caller.md](docs/design/echo-caller.md). 66 HP *(balance)*. Unlocked with the Work *The Lantern of Names* (150 Shards).
- **The Chorus:** your Outpost Echoes (up to 3), copied into the loop when it starts.
- **Call** brings the next unused Chorus member into the fight as an ally (a Nameless Echo once the Chorus is spent), up to 2 at once.
- **Allies** have 6 + 2 per depth HP (max 24, scaled by trait). After you end your turn, each plays the top card of the deck its loop ended with, at **75% strength** (rounded up), at your target. Curses fizzle and cost the ally 2 HP.
- **Enemies attack you**, not your allies, unless an ally **Guards**. Enemy area attacks reach allies.
- **Traits fight:** Unbroken +50% HP; Ravenous 2 cards a turn, −2 HP each; Haunted curses hit the enemy for 4; Pathfinder acts at the start of your turn; Scarred +3 Ward a turn; Hoarder plays the costliest of its top 3; Fleeting full strength, fades after 2 turns.
- **Stability:** each Call costs that Echo 8, and each fall (or Release) 12, settled when the loop closes. An Echo drained to 0 Unravels. The Call card warns first. *Severed Thread* makes Calls free.
- **Cards** (24): The Chorus (Call, buff allies, make them act), Communion (spend allies: Release, Soul Lance, Mourning) and Remembrance (use their decks: Borrowed Hand, Memory of Victory). "An ally" always means your newest one.
- **Bot check** (1,500 loops, three mid-depth Echoes): 33%, in line with the other Wardens.

## The Awakening
Full design: [docs/design/awakening.md](docs/design/awakening.md). Stages 1–3 built in 0.12.0; stages 4–5, the Sleeper and cycles in 0.13.0.
- **Rises with activity only:** +3 per closed loop, +2 more for escaping, +1 per 4 Echo-hours of work *(balance)*. Time away alone never raises it; resting Echoes add nothing.
- **Stages** at 10 / 25 / 45 / 70 / 100 progress. Each brings a danger and a reward, and they build up:

| Stage | Danger | Reward |
|---|---|---|
| 1 Murmur | 3 Awakening events join the pool | Dig +15% |
| 2 Stirring | The 4 early enemies become Waking versions (+15% HP, one new move each) | Research +25% |
| 3 Restless | Elites get an affix: Hardened (+20% HP), Frenzied (+3 damage) or Warded (10 Ward) | +5 rare weight; elites drop 25 Shards |
| 4 Wakeful | New Shift *The Sleeper's Breath* (+10% enemy HP, more Elites and Caches, start with 1 Corruption); the Lock weeps open at half HP (a second phase) | Escaping banks 50 Shards |
| 5 Awake | **The Sleeper** replaces the Lock; Lull and Give stop working; progress can't fall | Unmake it: 200 Shards, the Sleeper's Eye in every later loop, and a new cycle |

- **Each stage reveals a lore fragment** the first time it's reached.
- **The stage is fixed when a loop starts.** Changing it mid-loop does nothing until the next loop.
- **Pushing it back:** *Lull* (on the meter) costs 40 Shards, +20 per Lull at the same stage, for −5 progress. *Give* (on an Echo card, two taps) releases an Echo for −(stability ÷ 5). Stages go down as well as up.
- **Cycles:** unmaking the Sleeper resets the Awakening to Dormant and starts the next cycle. Each cycle after the first gives enemies +5% HP, up to Cycle 5 (+20%).
- **The Sleeper** (150–160 HP, three phases): it opens by replaying the hardest move of each enemy you fought that loop; below two-thirds HP it Dreams (attacks that land on its turn two turns later, shown as red timeline chips, blockable with Ward); below one-third it Wakes and Fractures itself every turn.
- **Boss phases and enemy delays** are general engine features (`src/engine/combat/phases.ts`, `time.ts`).
- Stage changes are announced as a notice; loops show a stage chip; History records each loop's stage.

## Balance testing
`npm run sim` plays many loops with a bot (`src/sim/bot.ts`) and prints a report: win rate per class, how often the boss is reached and beaten, deaths by node type and row, win rate per Vault Shift, and the cards most and least linked to winning. `SIM_RUNS=1500 npm run sim` for steadier numbers (about 10 seconds).
- The bot plays like a careful new player: it blocks when enemies will out-hit its Ward, otherwise plays its most expensive card; takes Shrines when hurt and Elites only when healthy; takes the rarest reward, never the tainted one. Loops use the full card pool (all research done).
- It plays any affordable card, so cards that need setup (Release the Fault, Rampart Breaker) score badly in the card list through no fault of their own.
- `SIM_KITS=1 npm run sim` plays every starting kit on the same seeds, so kits can be compared. **0.15 kit check** (400 loops each): Breaker 36%, Fault-Walker 46%, Bastion 24%; Thief 37%, Fuse-Setter 37%, Afterimage 39%; Caller 32%, Shepherd 31%, Mourner 37%. The bot is very sensitive to single swaps (Flicker or Stand Before Me in a kit pushed it to 57–66%), so new kits were tuned to within a few points of their standard deck. The Relic-Breaker's two older kits are further apart; see Open questions.
- **0.11 pass** (1,500 loops per class), before → after:
  - Relic-Breaker 32% → 35%; Hour-Thief 26% → 33%.
  - Boss beaten when reached: 39% / 37% → 43% / 43%.
  - Worst Shift: Drowned Halls 16% / 16% → 25% / 26%. Spread across Shifts: 16–41% → 25–43%.
  - Changes: Drowned Halls lost its Shrine penalty; Choir Awake +15% → +10% enemy HP; the Lock 140–150 → 140–148 HP; Hour-Thief 64 → 68 HP; Age the Flesh's delayed Bleed 4 → 3.
  - The older "Bot check" numbers in this document came from a weaker bot (first path, first card) and aren't comparable.

## Sound
All sound is generated in code with Web Audio (`src/ui/audio/`): no audio files, nothing extra to download or cache.
- **Effects** come from the same engine events as particles and haptics: card plays (a voice per card type), hits on you and on enemies, glancing blows on Ward, Ward gained, kills, Overload and cracking, Delay landing (a jade bell), Echo returns, Rewind, Paradox snapping, victory and defeat.
- **Music** is an ambient drone with sparse bell notes, never a melody. Each screen and Vault Shift has its own root note and brightness; changing screens crossfades. Fights add a slow low pulse.
- **Settings:** Sound and Music, each Off / Low / Mid / High (defaults Mid and Low). Off stops the music entirely rather than muting it.
- Audio starts on the first tap (browsers require it) and pauses while the app is hidden. On iOS the audio session is "ambient": the silent switch silences the game, and it mixes with other audio.

## Archive
- **History:** the last 20 loops *(balance)*, newest first. Each shows Warden, Vault Shift, result and depth; tap for stats, relics, final deck and the Echo it left.
- **Cards:** every card by Warden (plus Curses), filterable by type, with art. Research-locked and Warden-locked cards are shown greyed out with a tag. Tap a card for the full text and how often it was in your recent final decks.
- **Fragments** (lore) and **Settings** (backup, sound, music, haptics, hints).

## Save system
- `localStorage` key `eotv.save`, JSON, synchronous write after every action.
- `SaveData.version` + `MIGRATIONS[n]` (n → n+1). The old raw save is copied to `eotv.save.backup.vN` before migrating, and the migrated save is written straight away.
- Corrupt saves are copied to `eotv.save.corrupt.<time>`, never deleted. Saves from a newer version are never overwritten.
- **v12** (current) contains:
  - `run`: the whole loop, including any live fight
  - `meta`: loops, victories, deaths, and `history` (the last 20 loops)
  - `nextLoop`, `echoes`, `pendingEcho`, `outpost` (shards, unlocks, research, cards, lore, scouting, kit)
  - `idle.lastTickAt`
  - `world`: `awakening` (stage, progress, cycle, Lulls this stage); `factions` still reserved and empty
  - `daily`: last day played, days played, escapes, best depth, and the last result
  - `deeds`: the deed tally (peak Awakening, most curses carried, elites beaten, Shifts escaped, floor-2 escapes)
  - `settings`
- Migration history:
  - v11 → v12: adds `deeds`, credited from what the save shows: peak stage (5 if a cycle was completed), curses in History's final decks, and Shifts of History's victories. Elites beaten start empty.
  - v10 → v11: adds `daily` (nothing played yet). Runs gain optional `daily` and `omenId`; history rows gain optional `daily` and `omenId`.
  - v9 → v10: a loop in progress gains an empty `chorus`; a live fight gains empty ally state.
  - v8 → v9: a loop in progress gains `awakeningCycle: 1`.
  - v7 → v8: completes `world.awakening` (adds `cycle` and `lullsThisStage`); a loop in progress runs at stage 0 with no Shards found; history rows gain `awakeningStage: 0`.
  - v6 → v7: adds `meta.history` (empty: past loops weren't recorded) and the `sound` / `music` settings.
  - v1 → v2: the sandbox save becomes an empty v2; sandbox fights weren't loops.
  - v2 → v3: a loop in progress is *kept*. It gains Corruption 0, the Still Vault Shift, and full combat modifiers. A cache's single relic becomes a one-item list. A pending placeholder event is skipped.
  - v5 → v6: second Warden. Adds `outpost.classId` and `Echo.origin.classId` (existing data becomes the Relic-Breaker's); live fights gain an empty `timeline` and `echoQueue`.
  - v4 → v5: adds `settings.hints` and `settings.hintsSeen`. Veterans (1+ loops) start with the basic hints dismissed.
  - v3 → v4: a loop in progress keeps the full 23-card pool it had. The pool is hard-coded in the migration, because migrations describe history. Idle time starts counting from the last save.

## Next builds (proposed 2026-11-21)
1. **The Choices pass** (0.16, built): settles the open questions below: pick-your-card event removals, a Search rite on the last Shrines, Echoes recovering while resting, evening out the Relic-Breaker's kits, and a Rewrite card. See `docs/design/choices-pass.md`.
2. **The Daily Descent** (0.17, built): one shared, date-seeded loop a day, with a rule-bending Omen and a shareable result. It leaves no Echo, doesn't move the Awakening, and there's no streak to break. See `docs/design/daily-descent.md`.
3. **The Deeper Vault** (0.18–0.19, built): Escape or Descend after the boss, into a shorter, harsher second floor with 9 new enemies; Echoes born there are stronger. See `docs/design/deeper-vault.md`.
4. **The Somnant** (Warden 4, built in 0.20): builds Drowse until enemies fall Asleep and skip a turn; grows with the Awakening. Unlocked by the first deed. See `docs/design/somnant.md`.
5. **Deed unlocks** (built in 0.20): new Wardens appear as Works only after a themed deed (reach Awakening stage 3, carry 3 curses, beat every elite, escape under 3 Shifts, escape floor 2). See `docs/design/deed-unlocks.md`.
6. **Wardens 5–9** (built in 0.21): the Sin-Eater, Mirrorborn, Shiftwright, Pilgrim and Tollkeeper. See "Wardens 5–9" above.

## Future hooks (not built)
- **Classes:** `WardenClassDef` holds the deck, pools, kits, HP and an optional unlock. The Hour-Thief proved the pattern: a new class is mostly data, plus new `Effect` kinds for genuinely new mechanics. Built in 0.14.0 (see "Echo-Caller (class 3)"). **Decided (2026-11-21):** it summons your *real* Outpost Echoes as allies, each fighting from its own deck snapshot, with its trait shaping how it fights. Needs player-side ally combatants. Full design to be agreed before building.
- **Factions / awakening:** `SaveData.world` exists (empty). **Decided (2026-11-21):** the Awakening rises with *activity only* (loops played, Echo work done), never with real time away, so breaks are never punished. As it rises, loops get new dangers and new rewards, and the Outpost can push it back. Stages 1–3 built in 0.12.0; see "The Awakening" above.
- **Echo allies:** each Echo stores its loop's deck snapshot and origin.
- **More floors:** floor 2 is built (see The Deeper Vault). `descend()` works for any floor, so a third floor is mostly a new map config and enemy set.
- **More Wardens:** all six concepts from `docs/design/warden-ideas.md` are built (the Somnant in 0.20, the other five in 0.21).
- **Multiplayer:** not planned. To revisit in a later milestone.

## Open questions / flagged
- **Hand overflow.** Past 5 cards, the hand scrolls sideways instead of overlapping, so every card stays a full-size tap target. Revisit if scrolling feels clumsy.
- **Targeting reach.** Enemies sit at the top of the screen, which is a stretch for one thumb. They're only tapped to switch targets in multi-enemy fights, and the default target is the first living enemy.
- **iOS haptics.** Safari doesn't support vibration, so iPhones get visual feedback only.
- **The boss is still the hardest fight.** After the 0.11 pass, about 40% of the bot's loops still end at the Lock, and it beats the Lock 43% of the time when it gets there. 134–142 HP gives the bot 38% / 37% overall if it should feel easier.
- **Vault Shifts favour classes.** Drowned Halls (permanent Bleed) helps the Relic-Breaker's Bleed cards and only hurts the Hour-Thief; Fractured Sky helps Fracture builds. That asymmetry is flavour, but worth watching. Drowned Halls lost its Shrine penalty in 0.11, so it's now a one-rule Shift.
- **Age the Flesh** is still the card most linked to Hour-Thief wins (56%) after its 0.11 trim. Bleed may simply be strong for that class.
- **Locked Wardens' cards are visible in the library** (greyed out). That previews what's coming; hide them if you'd rather keep it a surprise.
- **The tainted offer appears after every fight.** Alternative if it feels like too much: show it only on elite rewards, or on 50% of rewards.
- **Unraveling is a countdown, not a dice roll.** The brief said tasks "risk" Unraveling. I made the risk deterministic and visible (hours of work left), because losing an Echo to a hidden roll while the app is closed feels unfair. If you want real tension, an alternative: once stability falls below 25%, each hour carries a chance to Unravel early.
- **Event removals** (settled 0.16): Altar of Cinders and The Door That Breathes now let you choose the card, at 3 more HP. The Tithe Collector keeps its random "Pay in memory" (that one is the gamble) and adds "Pay in chosen memory" for 3 HP more.
- **The last row is all Shrines** (settled 0.16): kept, so every path rests before the boss, but those Shrines gain the Search rite.
- **Hour-Thief tuning to watch:**
  - Paradox at 5 is a hard ceiling. If it feels too punishing, raise the threshold to 6 or lower the damage per stack.
  - Doomsday Clock (50 to all foes in 4 turns) may trivialise the boss once researched.
  - Echo-chaining Flicker is free damage every turn. Watch whether it crowds out real choices.
- **Rewind takes the most recent discards**, not a card you choose. It's predictable and phone-friendly (no picker), and it makes play order a puzzle. Since 0.16 the rare **Rewrite** (1, Fade) lets you choose: it returns any discarded card, free this turn.
