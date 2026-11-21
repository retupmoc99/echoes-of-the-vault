# Changelog

## 0.16.0 — The Choices pass (2026-11-21)

### Added
- **Choose what events take.** Altar of Cinders and The Door That Breathes let you pick the card you give up, for 3 more HP than before. The Tithe Collector keeps its random "Pay in memory" and adds "Pay in chosen memory" for 3 HP more.
- **Search the last Shrines.** Shrines in the row before the boss gain a third rite: open a sealed relic cache instead of resting or cutting a card.
- **Resting Echoes recover** 2 stability per hour, up to half their starting stability. The Echo card says when one is recovering.
- **Rewrite**, a rare Hour-Thief card (1, Fade): choose a card in your discard pile and return it to your hand; it costs 0 this turn (gold cost gem). Includes painted art.

### Balance
- **The Relic-Breaker's kits are evened out** (bot sim, 600 loops): Fault-Walker 45% → 40%, Bastion 24% → 40%, standard 36%. Both now drop Overcharge:
  - **Fault-Walker:** Twin Shards and Hollow Vow in place of a Strike and Overcharge.
  - **Bastion:** keeps Shatter Lens; Mirror Sigil and Bulwark Slam in place of a Strike and Overcharge. *(The proposal guessed at swapping Bulwark Slam for a damage card. In the sim, the missing lens was the real problem.)*

## 0.15.0 — Starting kits (2026-11-21)

### Added
- **Four new starting kits,** two each for the Hour-Thief and the Echo-Caller. Each is a Work for 60 Shards and swaps 2 of the 10 starting cards for a theme:
  - **The Fuse-Setter** (Hour-Thief): Patient Blade and Accelerate. Delayed blows that land sooner.
  - **The Afterimage** (Hour-Thief): Afterimage and Repeating Edge. Echo cards that play twice.
  - **The Shepherd** (Echo-Caller): Rally the Dead and Hymn of Iron. A second Call, and Ward for your allies.
  - **The Mourner** (Echo-Caller): Release and Mourning. Spend your allies for damage and Ward.
- A Warden's kit works stay hidden in Works until you own that Warden.
- `SIM_KITS=1 npm run sim` compares every kit on the same seeds.

### Balance
- Each new kit wins within 2 points of its Warden's standard deck in the bot sim (31–39%).
- **Changed from the plan:** the Fuse-Setter uses Accelerate instead of Sundial Ward, and the Afterimage uses Repeating Edge instead of Refrain. With the planned cards, the Fuse-Setter won 48% and the Afterimage 26%. The Shepherd keeps its cards but replaces two Grave Strikes instead of a Strike and a Shroud (it won 22% the first way).

## 0.14.3 — Wide screens (2026-11-21)

### Changed
- **The game scales up to fill wide screens,** such as a foldable's inner screen held upright. It used to sit in a narrow phone-sized strip with phone-sized cards and text. Now everything (cards, text, enemies and buttons) grows to fill the width: 1.3× at 720×960 and 1.5× at 900×1100.
  - The scale is also limited by the screen's height, so nothing gets cut off. Phones, and screens held sideways, are unchanged.
  - The played-card flight still lands on its target when scaled.
## 0.14.2 — Touch targets and fit (2026-11-21)

### Fixed
- **Every tappable chip now meets the 44px touch-target rule.**
  - The Vault Shift chip and timeline chips are now 44px tall.
  - Enemy intent badges, status chips and Echo trait chips keep their look but get an invisible 44×44 tap area.
- **Enemy art shrinks to fit on short screens.** With two allies and a timeline on a small phone, the art used to overflow onto the turn label, and its name and HP bar collided with the info line and the ally row. It now scales between 64px and full size to fit the space left.

### Changed
- Rerolled art for *Soul Lance* (now a reaper hurling a spear of light) and *Severed Thread* (a thick cord splitting with blue lightning).

## 0.14.1 — Echo-Caller art (2026-11-21)

### Added
- **Painted art for all 24 Echo-Caller cards and 7 relics,** in a spectral blue-and-silver style. Subjects vary on purpose: lanterns, hands, crowds, armour and gravestones as well as ghosts. Every art slot in the game now has an image: 132 images, 3.8 MB, loaded on demand.
- `npm run art:gen` reads the new Echo-Caller sections in `ART_GUIDE.md`.

## 0.14.0 — The Echo-Caller (2026-11-21)

### Added
- **Third Warden: the Echo-Caller** (66 HP). Unlocked with the Outpost Work *The Lantern of Names* (150 Shards).
  - **Call** brings your own Outpost Echoes into the fight as allies, up to two at once. Each plays the deck its loop ended with, at three-quarters strength, after your turn. Once your Chorus is spent, a Nameless Echo answers.
  - **Echo traits fight differently:** Unbroken, Ravenous, Haunted, Pathfinder, Scarred, Hoarder and Fleeting each change how an ally plays.
  - **Enemies still attack you**, unless an ally Guards. Enemy area attacks reach allies.
  - **Calling costs the Echo stability** (8 per Call, 12 per fall), settled when the loop ends. An Echo drained to nothing Unravels, and the Call card warns you first. The end-of-loop screen and each Echo card show what was spent.
  - **24 cards** in three archetypes (the Chorus, Communion, Remembrance), 6 of them locked behind Research.
  - **7 relics:** the starter Lantern of Names, 2 tainted relics, and 3 shared neutral ones in its pool.
- **The ally row** in fights shows each ally's name, HP, Ward, Guard and next card; tap one to read it.
- Sounds and particles for Calls, ally actions and falls. A first-time hint. 2 new lore fragments in Research.
- Save v10. 20 new tests (208 total).

### Fixed
- The end-of-loop screen said "The Lock is broken." after unmaking the Sleeper.

## 0.13.0 — The Awakening, part 2: the Sleeper (2026-11-21)

### Added
- **Stage 4, Wakeful:**
  - A new Vault Shift, *The Sleeper's Breath*: enemies +10% HP, more Elites and Caches, and you start with 1 Corruption.
  - The Grieving Lock weeps open at half HP, a second phase with new moves.
  - Escaping banks 50 Shards.
- **Stage 5, Awake: the Sleeper,** a new final boss with its own art, takes the Lock's place.
  - It opens by replaying the hardest move of each enemy you fought that loop.
  - At two-thirds HP it starts Dreaming: attacks that land two of its turns later. They show as red timeline chips, and Ward blocks them.
  - At one-third it Wakes and Fractures itself every turn: a race.
  - Lull and Give stop working while it's awake.
- **Cycles:** unmaking the Sleeper pays 200 Shards, gives you the *Sleeper's Eye* (6 Ward and a draw at the start of every fight) for every later loop, reveals its lore, and starts the next cycle from Dormant. Each cycle after the first gives enemies +5% HP, up to +20%.
- **Engine:**
  - Boss phases: new moves, a new pattern and a new name at an HP threshold.
  - Enemies can now delay attacks; these land on the enemy's own turn.
  - 2 new lore fragments for the stages, 1 for the first unmaking, and 2 new hints.
- Phase changes have their own sound and particle burst. The meter shows the cycle, History marks loops that unmade the Sleeper, and a notice announces each new cycle.
- Save v9 (loops gain a cycle). 13 new tests (188 total).

## 0.12.0 — The Awakening, part 1 (2026-11-21)

### Added
- **The Awakening:** something sleeps beneath the vault, and every loop wakes it a little.
  - **The meter rises with activity only:** each closed loop, more for escaping, and Echo work. Time away never raises it.
  - **Stages 1–3**, each with a danger and a reward:
    - Murmur: 3 grim new events; Dig +15%.
    - Stirring: Waking versions of the 4 early enemies, with more HP and a new move; Research +25%.
    - Restless: elites carry an affix (Hardened, Frenzied or Warded); rarer rewards; elites drop 25 Shards.
  - Each stage reveals a lore fragment the first time it's reached.
  - **Push it back** by spending Shards to Lull it (on the meter), or by giving it an Echo (on the Echo card, two taps). Stages go down as well as up.
  - **Where it shows:** the meter on the Descend tab, a stage chip during loops, affix names on elites, the stage on each History entry, and notices when the stage changes.
- `SIM_STAGE=3 npm run sim` plays the balance report at an Awakening stage.
- Save v8: the Awakening state. Loops in progress continue at stage 0.
- 16 new tests (175 total): stages and the progress cap, loop and Echo-work progress, lore granted once, the Dig boost, Lull pricing and refusals, giving an Echo, events, Waking enemies and elite affixes by stage, Shards banked from elites, stage 0 unchanged, the v7→v8 migration.

### Notes
- Stages 4–5 (a new Shift, the Lock's second phase, and the Sleeper as the final boss) come in part 2. Until then, progress stops just short of stage 4.

## 0.11.0 — Sound, Archive, balance (2026-11-21)

### Added
- **Sound and music,** all generated in code (no audio files):
  - Effects for card plays, hits, Ward, kills, Overload, cracking, time effects, Paradox, victory and defeat.
  - An ambient drone with sparse bells that changes with each screen and Vault Shift, and adds a slow pulse in fights.
  - Sound and Music volume settings (Off / Low / Mid / High). On iOS the game follows the silent switch.
- **Archive → History:** your last 20 loops, with stats, relics, final deck and the Echo each left.
- **Archive → Cards:** a library of every card by Warden, with art, type filters, and lock state (Research or Warden). Tap one to read it in full.
- Archive is split into History, Cards, Fragments and Settings.
- **`npm run sim`:** a balance report from a bot playing many loops. It gives win rates per class and Vault Shift, where loops die, and which cards go with winning.
- Save v7: loop history and sound settings. Past loops weren't recorded, so history starts empty.
- 4 new tests (159 total): history order and cap, the v6→v7 migration, Shrine-heal scaling.

### Changed
- **Balance** (bot win rate, 1,500 loops per class: Relic-Breaker 32% → 35%, Hour-Thief 26% → 33%):
  - The Drowned Halls: Bleed still never fades, but Shrines now heal normally. It was the hardest Shift for both classes.
  - The Choir Awake: enemies +10% HP, down from +15%.
  - The Grieving Lock: 140–148 HP, down from 140–150.
  - The Hour-Thief starts with 68 HP, up from 64.
  - Age the Flesh: delayed Bleed 4 → 3.
- Rerolled art for 5 weaker cards: Second Hand is now a blade, Loop the Moment, Unmake the Hour and Mirror Sigil sit on dark backgrounds, and Twin Shards was redrawn.
- The deploy workflow uses current GitHub Actions versions, which removes the Node 20 deprecation warning.

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
