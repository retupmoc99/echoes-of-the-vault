# Design: the Somnant (Warden 4)

*Status: built in 0.20.0 (engine, cards, relics, UI, tuning and art).*

**Changed in tuning (the bot sim won 4% with the numbers below as first drafted):**
- **Sleep lasts longer:** a sleeper skips its turn, *stays Asleep through your next turn*, then makes its planned move. As drafted it woke straight after the skipped turn, so waking blows only worked in the turn it fell asleep.
- **Sleepers take 50% more attack damage**, so every strike pays off in the dream window, not just the waking-blow cards.
- **Lower thresholds:** normal 4 (+2 per sleep), elite 7 (+3), boss 9 (+3), the Sleeper 12 (+3, no once-per-fight cap; a cap of 1 or 2 shut the Somnant out of stage 5).
- **Sleeper's Hum:** 2 Drowse, +2 per two Awakening stages (2, 2, 4, 4, 6, 6). From stage 2, normal foes start a fight asleep.
- **Card numbers:**
  - Lullaby also deals 3 to all foes.
  - Nightfall Cut deals 6, or 18 on a sleeper.
  - Cradle Song also deals 4 to all foes.
  - Whisper Down deals 5.
  - Soft Step gives 5 Ward.
- **Moth Lantern** draws 1 each time a foe falls asleep (not 2 once a fight).
- **Bot result:** 33% at Awakening stage 0 (the others: 33–36%), kits 32–36%, 28% at stage 3 (the others: 27–29%). It's weaker at stage 5: 8% against 11–17%.
*Unlocked by a deed (see `deed-unlocks.md`): reach Awakening stage 3, then build the Work.*

> It learned the Sleeper's lullaby. It hums it to everything.

## The pitch
Every Warden so far races damage. The Somnant controls **when enemies act**. It builds **Drowse** on enemies until they fall **Asleep** and lose a turn, then hits them hard while they dream.

It's tied to the Awakening, the game's long arc. Its starter relic grows as the Sleeper stirs, which gives players a reason to let it wake instead of Lulling it.

## Core rules

### Drowse and Asleep
- **Drowse** is a new status. Only enemies can carry it (player cards that apply it target foes).
- Each enemy has a **sleep threshold**, by tier:

| Tier | Threshold | Rises by after each sleep |
|---|---|---|
| Normal | 6 | +3 |
| Elite | 10 | +4 |
| Boss | 16 | +6 |
| The Sleeper | 24 | can only be slept once per fight |

- When Drowse reaches the threshold, the enemy falls **Asleep** at once:
  - Its intent shows **Asleep** (a closed eye) in place of its move. The planned move is kept.
  - Drowse resets to 0, and its threshold rises.
- On its next turn an Asleep enemy **skips its move**, then wakes. Its next intent is the move it had planned, so cycle patterns stay in step and nothing is lost or reshuffled.
- **While Asleep:**
  - It still ticks Bleed and Fracture, and its own delayed attacks still land (the Bellringer's toll still tolls).
  - Taking damage does **not** wake it. Waking blows are the whole point.
  - Drowse applied to it is **lost**. This stops two sleeps in a row and makes timing matter.
- **Bosses:** a phase change wakes a sleeping boss. Its sleep is lost and it shows its new phase's move. This stops bosses being slept through their big moments.
- **The badge:** the Drowse chip shows progress, e.g. "◐ 4/6", so the player always knows how close a foe is. Tapping it explains the threshold.

### The Awakening link
**Starter relic, Sleeper's Hum:** at the start of each fight, apply Drowse to all foes equal to **2 + half the Awakening stage** (rounded down). That's 2 at Dormant and 4 at Awake.

This answers the open question from `warden-ideas.md`: a new Somnant is never toothless, but it grows as the world does.

## The Warden
- **HP 68.** Starter relic: Sleeper's Hum. Archetypes: `slumber` (Drowse and sleep) and `dream` (waking blows).
- **Card pool:** 24 cards: 4 starters, 20 rewards. Six of the rewards are research-locked (marked 🔒), as with the other Wardens.

### Starting deck (standard kit, *The Somnant*)
| Card | Cost | Type | Effect |
|---|---|---|---|
| Dull Blade ×4 | 1 | strike | Deal 6. |
| Veil of Sleep ×4 | 1 | ward | Gain 5 Ward. |
| Lullaby | 1 | rite | Apply 3 Drowse to all foes. |
| Nightfall Cut | 1 | strike | Deal 5. If the target is Asleep, deal 15 instead. |

### Reward cards
| Card | Cost | Rarity | Type | Effect |
|---|---|---|---|---|
| Heavy Eyelids | 0 | common | rite | Apply 2 Drowse. |
| Yawn | 0 | common | rite | Apply 1 Drowse to all foes. Draw 1. |
| Whisper Down | 1 | common | strike | Deal 4. Apply 2 Drowse. |
| Dream Thief | 1 | common | strike | Deal 5. If the target is Asleep, draw 2. |
| Sleepwalker's Ward | 1 | common | ward | Gain 6 Ward. If any foe is Asleep, gain 10 instead. |
| Soft Step | 1 | common | ward | Gain 4 Ward. Apply 1 Drowse to all foes. |
| Pillow of Ash | 1 | common | ward | Gain 7 Ward. Next turn: apply 2 Drowse to all foes. |
| Counting Down | 1 | common | rite | Apply 3 Drowse. If it falls Asleep, gain 1 Resonance. |
| Murmured Name | 1 | uncommon | rite | Apply 4 Drowse. Draw 1. |
| Cradle Song | 2 | uncommon | rite | Apply 4 Drowse to all foes. |
| Dreamless Edge | 2 | uncommon | strike | Deal 5 twice. If the target is Asleep, four times. |
| Deep Rest | 1 | uncommon | rite | If any foe is Asleep, gain 2 Resonance. Otherwise, apply 3 Drowse. |
| 🔒 Lucid Strike | 1 | uncommon | strike | Deal 6, plus 2 per Drowse on the target. |
| 🔒 Slumber Ward | 2 | uncommon | ward | Gain 10 Ward, plus 4 per Asleep foe. |
| 🔒 Undertow Hymn | 2 | uncommon | rite | Apply 3 Drowse and 1 Weakened to all foes. |
| Nightmare | 2 | rare | strike | Deal 3 per Drowse on the target, then clear its Drowse. |
| Sleeper's Kiss | 3 | rare | strike | If the target is Asleep, deal 30. Otherwise, apply 6 Drowse. |
| 🔒 Dreamwalk | 1 | rare | strike | Deal 12 to every Asleep foe. |
| 🔒 Long Night | 2 | rare | rite | This fight, every foe's sleep threshold is 2 lower. Fade. |
| 🔒 Eternal Lullaby | 3 | rare | rite | Apply 8 Drowse to all foes. Fade. |

Numbers are a starting point. The bot sim sets the final ones (target: the same 32–37% loop win rate as the other Wardens).

### Relics (7, plus the starter)
| Relic | Rarity | Effect |
|---|---|---|
| Sleeper's Hum (starter) | starter | Fight start: apply 2 + ½ Awakening stage Drowse to all foes. |
| Moth Lantern | common | The first time a foe falls Asleep each fight, draw 2. |
| Pillow Stone | common | Turn start: if any foe is Asleep, gain 5 Ward. |
| Cracked Music Box | uncommon | Turn end: apply 1 Drowse to all foes. |
| Dream Catcher | uncommon | Whenever a foe falls Asleep, gain 1 Resonance. |
| Nightcap | uncommon (tainted, +1 Corruption) | Every foe's sleep threshold is 2 lower. |
| Lethe Vial | rare | Whenever a foe wakes, apply 2 Weakened to it. |
| The Last Lullaby | rare | Bosses' thresholds are 4 lower, and the Sleeper can be slept twice. |

The relic pool also carries the shared class-neutral relics (Lodestone Heart, Mirrorglass Ward, Ash Rosary), as the other Wardens do. The Well's relic for the Somnant: **Drowned Hymnal** (when a foe falls Asleep, gain 6 Ward).

### Kits (Works, 60 Shards each, shown once the Somnant is owned)
- **The Lullaby:** Cradle Song and Heavy Eyelids in place of two Dull Blades. Sleep the whole room.
- **The Night-Knife:** Dreamless Edge and Whisper Down in place of a Dull Blade and a Veil of Sleep. One target, one long dream, one wound.

Both are tuned with `SIM_KITS` to within a few points of the standard kit, as with the others.

### As an Echo and an ally
A Somnant Echo plays its deck as an Echo-Caller ally like any other. Its Drowse cards apply at ally strength (75%, rounded). No special rules are needed.

## Engine work
All small, and all in existing places:
- **Status:** `drowse` on `StatusId`, with an info entry ("◐", a soft violet). It never decays on its own.
- **Enemy state:** `asleep?: boolean`, `sleepThreshold?: number` (set from tier when the fight starts) and `sleeps?: number`.
- **Falling asleep:** checked in `addStatus` when Drowse is added to an enemy. On reaching the threshold, the enemy is set Asleep, Drowse resets, the threshold rises, and a `fellAsleep` event fires (for the closed-eye animation and relic triggers).
- **Enemy turn:** an Asleep enemy ticks its statuses and delayed attacks as usual, skips its move, then wakes. It sets `asleep = false` and fires `woke`; its intent stays the planned one.
- **Bosses:** `checkPhase` clears `asleep` on a phase change. The Sleeper's single sleep is a per-enemy cap (`maxSleeps`), set from data.
- **Conditions:** `targetAsleep` and `anyFoeAsleep` for `if`.
- **Amounts:** `{ per: 'targetStatus', status: 'drowse' }` already works. Add `{ per: 'foesAsleep' }`.
- **Effects:** `thresholdMod` (Long Night; a per-fight number on combat state). `clearStatus` on the target already exists as `removeStatus`.
- **Triggers:** `foeSlept` and `foeWoke` for relics (Moth Lantern, Dream Catcher, Lethe Vial).
- **Combat modifiers:** `sleepThresholdBonus` (Nightcap, The Last Lullaby on bosses), applied when thresholds are set.
- **Intents:** `previewIntent` returns kind `asleep` while Asleep, and the enemy view shows the closed eye with "Asleep · skips its turn".
- **Bot:** push Drowse onto the enemy with the biggest incoming attack. Play waking blows on Asleep targets. Otherwise play as now.

## UI
- **Drowse chip** on enemies: "◐ 4/6". Tapping it says "Drowse: at 6, it falls Asleep and skips its next turn. Each sleep raises the threshold."
- **Asleep intent:** a closed-eye badge in the intent slot, and a slow "z" drift particle (the fx bus already supports this kind of burst).
- **Card text:** "If the target is Asleep" uses the same conditional style as existing cards (generated by `describe.ts`).
- **First-time hint** (`somnant`): what Drowse and Asleep do, shown in the first fight as the Somnant.
- Nothing new needs to fit on the 320px screen beyond one chip and one badge.

## Balance and testing
- **Sim:** the bot can play it with the rules above. The target is a 32–37% loop win rate, with kits within 4 points, and checks at Awakening stages 0, 3 and 5 (the relic scales).
- **Watch for:**
  - Sleep-locking: a single enemy slept every other turn. The rising thresholds and "Drowse on a sleeper is lost" are the brakes; the sim reports turns skipped per fight.
  - Nightmare plus big Drowse stacks becoming a second damage engine.
- **Tests:**
  - thresholds by tier and rising after each sleep
  - the skipped turn keeps the planned intent
  - Drowse on a sleeper is lost
  - a phase change wakes a boss; the Sleeper sleeps only once
  - Bleed and delayed attacks still tick while Asleep
  - each new condition, amount and trigger
  - the Sleeper's Hum scales with the stage
  - a save with a Somnant run in progress round-trips

## Unlock
Deed **"You hear it dreaming"**: reach Awakening stage 3 (Restless) at any point. Then Work **The Sleeper's Hymnal** (170 Shards) appears.
> *"We sang it to keep the thing asleep. Then we learned it works on anything."*

## Art (milestone 2)
24 cards and 8 relics (plus the Drowned Hymnal): about 33 images, roughly 0.9 MB. Style: muted violet and silver, moths, closed eyes, candles, cloth, soft light. Prompts go in `ART_GUIDE.md` under "Somnant cards" and "Somnant relics", in the existing format.

## Build plan
1. **Milestone 1 (about one build):**
   - status, sleep rules, conditions, triggers, intent
   - the 24 cards, 8 relics, class, 2 kits, Work and deed
   - research entries, hints, bot rules
   - tuning with the sim, tests, docs
2. **Milestone 2:** art for the cards and relics.

## Open questions (with recommendations)
- **Should damage wake a sleeper?** *No*, as above. If waking blows prove too strong, the fix is lowering their numbers, not adding wake-on-hit.
- **Can allies' Drowse cards sleep enemies?** *Yes*, at 75%. It's a nice Echo-Caller synergy and cheap.
- **Should the Asleep enemy's turn still count for its pattern?** *No.* It resumes the planned move, so players can plan around a known move.
