# Design proposal: the Awakening

*Status: draft for review. Nothing here is built.*
*Decided: it rises with **activity only**: loops played and Echo work done. Time away never raises it.*

> Something sleeps beneath the vault. Every loop is a footstep in its dream.

## The pitch
A long-term arc for both Wardens. The more you loop, the more **the Sleeper stirs**. As it wakes, loops get more dangerous and more rewarding. When it fully wakes, it replaces the Lock as the final boss. Beat it, and the cycle starts again.

You set the pace. The Outpost can lull the Sleeper back down, with Shards or by giving it an Echo. So the Awakening doubles as a **difficulty dial you choose**: push for the rewards and the ending, or keep it quiet while you build up.

## How it rises (activity only)
| Source | Progress |
|---|---|
| Closing a loop | +3 |
| Escaping (beating the boss) | +2 more |
| Echo work (Dig, Research, Scout) | +1 per 4 Echo-hours |

Echo work is counted through the existing idle tick, which is already capped at 8 hours per absence. So a week away adds at most about +2. Resting Echoes add nothing.

## Stages
Progress fills five stages: **10 / 25 / 45 / 70 / 100**. Effects build up as stages are reached, and every stage brings a danger and a reward.

| Stage | Name | Danger | Reward |
|---|---|---|---|
| 1 | **Murmur** | 3 Awakening events join the event pool (grim, high stakes) | Dig yields +15% Shards |
| 2 | **Stirring** | *Waking* versions of the 4 early enemies: +10% HP and one new move each | New Research: 2 lore fragments and 1 card per Warden |
| 3 | **Restless** | Elites gain a random affix: Hardened (+20% HP), Frenzied (+2 damage) or Warded (enters with 10 Ward) | Rewards +5 rare weight; elites drop 25 Shards |
| 4 | **Wakeful** | A new Vault Shift, *The Sleeper's Breath*, joins the rotation; the Lock gains a second phase at half HP | Shift-specific loot; the Lock drops a relic |
| 5 | **Awake** | **The Sleeper** replaces the Lock as every loop's boss | Beat it: +200 Shards, a unique relic added to both Wardens' pools, a trophy in the Archive, and a new cycle |

**A new cycle:** beating the Sleeper resets progress to 0 and starts Cycle 2. The Archive keeps your cycle count. *(Flagged: should each cycle make the vault a little harder, like an ascension level? See open questions.)*

## Pushing it back
Two Outpost actions, both choices rather than chores:
- **Lull** (in Works): spend Shards to lower progress by 5. It costs 40, plus 20 for each Lull at the current stage. Cheap to take the edge off, expensive to hold it down for long.
- **Give an Echo to the Sleeper:** release an Echo into the dream to lower progress by a fifth of its remaining stability. This turns an Echo that's nearly spent into one last use.

Progress can fall below a stage's threshold. Stages are a dial, not a ratchet. **Awake** is the exception: once reached, it holds until you beat the Sleeper.

## What you see
- **Descend tab:** an Awakening meter with the stage name, a progress bar, and the next stage's danger and reward spelled out. No surprises.
- **Archive → History:** each loop records the stage it ran at.
- **Archive:** a cycle count and trophies.
- **Hints:** a first-time note at stage 1, and another when the Sleeper wakes.

## The Sleeper (the new final boss)
A vast, half-formed shape, more dream than body.
- **Three phases**, around 220 HP in total:
  - **Phase 1** repeats moves from enemies you've already beaten this loop. It's the vault replaying your run.
  - **Phase 2** adds Dream (Delay-like attacks that land 2 turns later, shown on its own timeline chips).
  - **Phase 3** is a race: it gains Fracture every turn.
- **Art:** one large sprite and a stage-5 background, both via `npm run art:gen`.

## What has to be built
- **Engine:**
  - Progress in `closeLoop` and `advanceIdle`.
  - `RunSetup.awakeningStage`, feeding the event pool, enemy pools, elite affixes, the Shift pool and boss selection.
  - Elite affixes (new: a small modifier on enemy creation).
  - The Lock's second phase and the Sleeper's three phases (new: enemy phase changes at an HP threshold).
  - Lull and Give as Outpost actions.
- **Save v8:** `world.awakening` already exists (`stage`, `progress`). It gains `cycle` and `lullsThisStage`, and loop history gains the stage. If both designs are approved, v8 covers both.
- **Content:** 3 events, 4 Waking enemy variants, 3 elite affixes, the Sleeper, a new Vault Shift, a unique relic, 5 lore fragments, research items, and art.
- **UI:** the meter, the Lull and Give actions, the cycle trophy, and hints.
- **Balance:** the sim runs at each stage. Targets: stage 0 stays as now (about 34%); stage 3 is about 25%; stage 5 (the Sleeper) is about 15–20% for the bot.

**Two milestones:**
1. Progress, the meter, Lull and Give, and stages 1–3 (events, Waking enemies, affixes).
2. Stages 4–5 (the new Shift, the Lock's phase, the Sleeper), cycles, art and sim tuning.

## Open questions for you
1. **Do cycles stack difficulty?** The proposal: Cycle 2+ adds +5% enemy HP per cycle, so the game keeps a ceiling to climb. The alternative is a clean reset each time.
2. **Is giving an Echo to the Sleeper too costly a lever?** Losing an Echo is a big deal. The alternative is to let only Echoes that are almost spent (under 20% stability) be given.
3. **Pace:** is about 20–25 loops to reach Awake about right? That's roughly +3.7 per loop at the bot's win rate, plus a little from Echo work. Faster brings the Sleeper sooner; slower makes it a long-term goal.
4. **Should the Echo-Caller and the Awakening share save v8 and land together?** Or should each ship on its own? I'd build the Awakening first: it's smaller, it uses systems that already exist, and it gives both current Wardens a long-term goal.
