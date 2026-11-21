# Changelog

## 0.10.0 — Enemies, relics and map icons (2026-11-21)

### Added
- **Painted art for all 11 enemies, 18 relics and 6 map icons,** cut out with transparent backgrounds. With this, every art slot in the game has an image: 98 images, 3.1 MB, all loaded on demand.
- `npm run art:gen -- --folder enemies|relics|ui` cuts sprites out with ComfyUI's built-in Remove Background node (BiRefNet model). It keeps coloured glow near the subject as soft falloff, so sprites don't get a hard cut-out edge.

### Changed
- Enemy images glow in each enemy's own colour instead of a fixed violet.
- `ART_GUIDE.md`: sprite prompts, what to avoid ("isolated" gives white backdrops; abstract enemies need "no body"), and reworded prompts for 4 items.

## 0.9.0 — Painted backgrounds (2026-11-21)

### Added
- **Painted backgrounds for all 8 screens:** the Outpost, the Vault, combat, and one for each of the 5 Vault Shifts, each lit in its Shift's colour. They total 710 KB and load on demand.
- `npm run art:gen -- --folder backgrounds`. Backgrounds get a second detail pass using built-in ComfyUI nodes, so no upscaler model is needed. Guide sections can now add to the negative prompt too.

### Fixed
- **Backgrounds fill wide screens,** such as a foldable's inner screen, instead of stopping at the 480px game column with black bars at the sides. They also stay still when combat shakes.
- The darkening layer over backgrounds never showed, so background art would have been at full brightness behind the UI.
- Spoils cards size themselves to the screen: art scales with card width and cards grow to fit their text, from 320px phones to wide inner screens.
- Card names and text no longer spill out of wide reward cards onto the description line.

## 0.8.0 — Card art (2026-11-21)

### Added
- **Painted art for all 55 cards** (30 Relic-Breaker, 25 Hour-Thief), generated with ComfyUI: SDXL base plus the LaxpeintXL LoRA at 0.45. The set is 1.21 MB of WebP, loaded on demand, so the offline install doesn't grow.
- **`npm run art:gen`:** queues card prompts from `ART_GUIDE.md` on a local ComfyUI server and saves 2 candidates per card to `art-raw/_candidates/`.

### Changed
- `ART_GUIDE.md` now has a "Tested setup", based on what worked:
  - The subject goes before the style prompt.
  - Each card gets its own seed rather than one seed per folder.
  - The negative prompt bans pale and desert backgrounds.
  - The Hour-Thief style cue is now "pale jade and silver glow". The old "clockwork, hourglass sand" made every card an hourglass.
- Reworded prompts for 5 cards whose first results missed the subject.

## 0.7.0 — The Hour-Thief (2026-11-20)

### Added
- **Second Warden class: the Hour-Thief** (64 HP). Unlocked with the Outpost Work *The Stolen Hour* (120 Shards), chosen on the Descend tab.
  - 25 cards across three archetypes: The Long Fuse (Delay), Recurrence (Echo), Unwinding (Rewind and Paradox). 6 are locked behind Research.
  - 7 relics, including the starter Cracked Hourglass and 2 tainted relics, plus 3 shared neutral relics.
- **Time mechanics in the engine:** Delay (a timeline of effects that land on later turns), Hasten, Echo copies that fade, and Rewind.
  - New status Paradox, which snaps back at 5 stacks.
  - New card type Temporal, trigger `delayFired`, and an amount that scales with the timeline.
- **UI:**
  - A timeline strip of countdown chips above the hand.
  - Dashed, glowing Echo copies.
  - A class picker; class shown on Echoes and on the end-of-loop screen.
  - Jade particle bursts when delays land or Paradox snaps.
  - 4 new hints.
- Research queue gains 6 Hour-Thief cards and 2 lore fragments.
- `ART_GUIDE.md` has prompts for all new cards and relics.
- Save v6: existing progress becomes the Relic-Breaker's, and fights in progress gain a timeline.
- 18 new tests (155 total): Delay timing and targeting, Hasten, timeline scaling, the `delayFired` trigger, Echo copies, Rewind order, the Paradox snap, class unlock and selection, an unchanged scouted map when switching class, a full Hour-Thief loop, the v5→v6 migration.

### Fixed
- Centred panels (hints, the update prompt) slid in from the side during their entrance animation.
- Haptics no longer try to vibrate before the first real tap (browsers block it and log an error).

## 0.6.0 — Backups and first-run hints (2026-11-20)

### Added
- **Save backup and restore** (Archive → Backup):
  - Copy a save code, or save it as a file.
  - Restore from a pasted code or a file. Restoring takes a second tap, and the replaced save is kept as a safety copy.
  - Codes carry a checksum, tolerate line breaks, and restore old backups through the save migrations.
  - The panel shows how long since the last backup, and warns after 7 days.
- **Persistent storage request,** so the browser is less likely to evict the save.
- **First-run hints:** 14 one-time notes, shown one at a time the first time each mechanic appears (cards, intents, Overload, statuses, rewards, Corruption, events, Shrines, Echoes, Works, backups). There's a toggle and "show all again" in Settings.
- Save v5 (hint settings). Players who have already finished loops skip the basic hints.
- 7 new tests (137 total): save code round-trips, damaged and foreign codes, Unicode, old-version restores, the v4→v5 migration.

## 0.5.0 — Milestone 5: Visual polish, PWA and the art pipeline (2026-11-20)

### Added
- **PWA:**
  - Installable to the home screen, with a manifest, code-drawn icons (`npm run icons`) and iOS support.
  - Plays fully offline: the app shell is precached and art is cached on first view.
  - An in-game "new version ready" prompt.
- **Polish:**
  - Bundled Inter and Cinzel fonts.
  - A canvas particle layer (ambient motes; bursts on hits, Ward, deaths and Overloads).
  - Card flight on play, enemy lunges, pulsing attack intents, and an End Turn hint when out of moves.
  - A haptics setting; reduced-motion support.
- **Art slots:**
  - Optional images for every card, enemy, relic, map node and background (including per-Vault-Shift backgrounds), with code-drawn fallbacks.
  - `src/data/assets.generated.ts` lists the art that exists.
- **`npm run art`:** converts `art-raw/` into spec-sized WebP, enforcing transparency and file-size budgets.
- **`ART_GUIDE.md`:** specs, budgets, a shared ComfyUI style prompt and negative prompt, workflow and seed strategy, background removal, a prompt for every piece of content (30 cards, 11 enemies, 11 relics, 6 node icons, 8 backgrounds), and Blender guidance with render settings.
- **Deployment:** a GitHub Pages workflow (tests, then build, then publish) and `netlify.toml`.

### Changed
- Build output moved to `dist/app/`, so `dist/assets/` holds only art.

## 0.4.0 — Milestone 4: Echoes, the Outpost, offline progress and saving (2026-11-20)

### Added
- **Echoes:** every closed loop leaves one, with a generated name, a deck snapshot, one of 8 traits based on how the loop went, and a stability set by depth and outcome. 3 slots; a new Echo waits when they're full.
- **Tasks:** Dig (Shards), Research (unlocks 6 locked cards and 6 lore fragments, alternating), Scout (reveals the next Vault Shift, then the first 4 rows of the real next map). Work drains stability until the Echo Unravels.
- **Offline progress** from real timestamps, capped at 8 hours. It ticks every 15 seconds while open and catches up on return. A "while you were away" report appears after long absences.
- **Outpost works** (460 Shards in total): two alternate starter kits, Second Sight, Shrine of Ash, The Shift Bell, Reliquary Key.
- **The next loop is rolled in advance**, so scouting reveals exactly what you will face.
- **Outpost screen** with Descend, Echoes, Works and Archive tabs. The end-of-loop screen previews the loop's Echo.
- Save v4, with a migration that keeps loops in progress.
- 22 new tests (130 total):
  - idle math: rates, the 8-hour cap, a clock set backwards, small ticks equal one long absence, exact Unravel timing, trait modifiers
  - research order and the locked card pool
  - the scout preview matching the real map
  - Echo slots and the pending Echo
  - Outpost purchases, kits, the Shift Bell, and in-loop options
  - the v3→v4 migration

### Changed
- Run reward pools come from the loop's own card pool (class pool minus unresearched cards).
- Closing a loop moved from the save module to the idle module, since it now creates an Echo and rolls the next loop.

## 0.3.0 — Milestone 3: Rewards, relics, events, Corruption and Vault Shifts (2026-11-20)

### Added
- **Card rewards** after every fight: pick 1 of 3, or take nothing. A **tainted** rare is also on offer at +1 Corruption. Elites also drop a relic.
- **Corruption meter**, thresholds 3/6/9: enemies get tougher, rares get more common, and curses are planted at tiers 2 and 3.
- **8 text events** with grim tradeoffs. Unaffordable options are shown but disabled, and random outcomes are seeded.
- **5 Vault Shifts** (one per loop): Drowned Halls, Choir Awake, Fractured Sky, Restless Engines, Hollow Bargain.
- **11 new cards** (30 total), including archetype bridges and 2 new curses. **7 new relics** (11 total), including 3 tainted ones.
- Relic Caches offer a choice of 2 relics.
- Engine:
  - Combat rules (Bleed decay, Fracture strength, Strain limit, enemy bonuses) come from per-fight modifiers.
  - New amounts: `plus`, `overloadsThisTurn`. New effect: `clearWard`.
  - Curses can punish being held at end of turn.
- UI: Reward, Event and Cache screens; Corruption meter; Vault Shift chip and loop intro; toast notices for curses and thresholds.
- Save v3, with a migration that keeps loops in progress.
- 29 new tests (108 total): Corruption tiers and curses, loot quality, reward rules, every Vault Shift, events (costs, disabled options, seeded outcomes), turn-end curses, the v2→v3 migration with a fight in progress.

## 0.2.0 — Milestone 2: Map and the full run loop (2026-11-20)

### Added
- Seeded branching map: 8 rows plus the boss, paths never cross. At least one Elite and one Event per map.
- Run loop engine (`src/engine/run/`): walk the map; HP, deck and relics carry between fights; victory on beating the boss, death on dying or abandoning.
- Node types:
  - Fight, Elite and Boss start a fight.
  - Shrine: rest, or remove a card.
  - Relic Cache: take one random class relic.
  - Event: a placeholder until milestone 3.
- New enemies: Rust Seraph, Vein Crawler, Ash Hound, Tithe Engine; elites Warden Unmade and Lens Tyrant; boss The Grieving Lock. Early and late encounter pools.
- Screens: map (start at the bottom, tap twice to enter), Shrine, Relic Cache, Event, end of loop with stats, and a deck viewer. The outpost title screen shows Continue, Abandon (two taps) and loop records.
- Save v2 with a real migration from the v1 sandbox save.
- 27 new tests (79 total): map shape and fairness over 200 seeds, run flow, bot-played full loops, save/reload equivalence across a whole loop, the v1→v2 migration.

### Changed
- The milestone 1 combat sandbox is replaced by real loops.

## 0.1.0 — Milestone 1: Engine and combat (2026-11-20)

### Added
- Project setup: Vite, React, TypeScript, Vitest.
- Deterministic combat engine (`src/engine/`): seeded RNG, effect interpreter, 4 statuses (Fracture, Bleed, Weakened, Exposed), Ward, enemy intents, relic passives, Overload with Strain and cracking.
- Relic-Breaker content: 19 cards across the Fracture, Ward, Overload and Bleed archetypes; 4 relics; 4 enemies in 4 encounters.
- Rules text generated from card data, with live damage previews.
- Versioned save system with migrations, backups of corrupt saves, and protection for saves from newer versions.
- Combat sandbox UI: portrait layout, two-tap card play, code-drawn enemy sigils, floating numbers, hit flashes, screen shake, haptics. Auto-saves after every action.
- 52 engine tests: combat math, statuses, intents, Overload, determinism, save/reload resume, content integrity.

### Fixed
- An enemy dying to Bleed on its own turn could hand control back to the player after the fight had already ended.
