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

Content: 30 cards (4 starter, 23 reward pool, 3 curses), 11 relics, 8 events, 5 Vault Shifts, 8 normal enemies, 2 elites, 1 boss.

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
- **Shrine:** rest (heal 30% of max HP), or remove a card (deck can't drop below 5).
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
| The Drowned Halls | Bleed never fades. Shrine rest heals half. |
| The Choir Awake | Enemies +15% HP. Rewards offer 4 cards. |
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
| **The Grieving Lock** | boss | 140–150 | Opens with Toll, then Shatter 12 (+1 Fracture) → Litany 4×3 → Bind (3 Bleed + 2 Exposed) → Toll (15 Ward + 1 Weakened) |

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
- Echoes never regain stability. Resting only pauses the drain.

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
| Second Sight | 70 | Reroll one card reward per loop |
| Shrine of Ash | 80 | Shrines gain "Purge 2 Corruption" |
| The Shift Bell | 90 | Reroll the Vault Shift once per loop |
| Reliquary Key | 100 | Relic Caches offer 3 relics instead of 2 |

Total 460 Shards: roughly 8 to 10 Echo lifetimes of digging.

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

## Save system
- `localStorage` key `eotv.save`, JSON, synchronous write after every action.
- `SaveData.version` + `MIGRATIONS[n]` (n → n+1). The old raw save is copied to `eotv.save.backup.vN` before migrating, and the migrated save is written straight away.
- Corrupt saves are copied to `eotv.save.corrupt.<time>`, never deleted. Saves from a newer version are never overwritten.
- **v5** (current) contains:
  - `run`: the whole loop, including any live fight
  - `meta`: loops, victories, deaths
  - `nextLoop`, `echoes`, `pendingEcho`, `outpost` (shards, unlocks, research, cards, lore, scouting, kit)
  - `idle.lastTickAt`
  - `world`: factions and awakening, reserved and empty
  - `settings`
- Migration history:
  - v1 → v2: the sandbox save becomes an empty v2; sandbox fights weren't loops.
  - v2 → v3: a loop in progress is *kept*. It gains Corruption 0, the Still Vault Shift, and full combat modifiers. A cache's single relic becomes a one-item list. A pending placeholder event is skipped.
  - v4 → v5: adds `settings.hints` and `settings.hintsSeen`. Veterans (1+ loops) start with the basic hints dismissed.
  - v3 → v4: a loop in progress keeps the full 23-card pool it had. The pool is hard-coded in the migration, because migrations describe history. Idle time starts counting from the last save.

## Future hooks (not built)
- **Classes:** `WardenClassDef` holds the deck, pools and HP. A new mechanic means new `Effect` kinds.
- **Factions / awakening:** `SaveData.world` exists (empty). The idle tick is where real-days progress for the awakening threat would go.
- **Echo allies:** each Echo stores its loop's deck snapshot and origin.
- **Multi-floor runs:** `RunState.floor` exists (always 1). The map generator takes a config, so deeper floors can use their own config.
- **Multiplayer:** not planned. To revisit in a later milestone.
- **Sound:** the FX event bus is where audio will hook in.

## Open questions / flagged
- **Hand overflow.** Past 5 cards, the hand scrolls sideways instead of overlapping, so every card stays a full-size tap target. Revisit if scrolling feels clumsy.
- **Targeting reach.** Enemies sit at the top of the screen, which is a stretch for one thumb. They're only tapped to switch targets in multi-enemy fights, and the default target is the first living enemy.
- **iOS haptics.** Safari doesn't support vibration, so iPhones get visual feedback only.
- **The boss is still the wall.** About half of the bot's loops die at the Lock, even with rewards. A human should do much better, but if the Lock feels unfair, cutting it to ~125 HP is the first lever.
- **The Choir Awake is the hardest Shift** (11% for the bot). The fourth reward card may not make up for +15% enemy HP. If it feels punishing, drop the HP bonus to +10%.
- **The tainted offer appears after every fight.** Alternative if it feels like too much: show it only on elite rewards, or on 50% of rewards.
- **Unraveling is a countdown, not a dice roll.** The brief said tasks "risk" Unraveling. I made the risk deterministic and visible (hours of work left), because losing an Echo to a hidden roll while the app is closed feels unfair. If you want real tension, an alternative: once stability falls below 25%, each hour carries a chance to Unravel early.
- **Echoes never heal.** With only 3 slots and a fresh Echo every loop, supply is steady. If Echoes feel too disposable, a slow "Rest" recovery (e.g. +2 stability per hour, up to 50%) would make them precious.
- **Event removals are random** ("remove a random card"). That's grim on purpose, but it can delete a key card. The alternative is to let the player pick, at a higher cost.
- **The last row is all Shrines.** That guarantees a rest before the boss, but it isn't a choice. If it feels flat, a mix of Shrine and Cache could work instead.
