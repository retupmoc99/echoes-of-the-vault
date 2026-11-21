# Design proposal: the Deeper Vault

*Status: proposed (2026-11-21). Planned as 0.18.0 (Floor 2 playable) and 0.19.0 (its art and rewards).*

> Past the Lock there are stairs. Nobody who took them has come back the same.

## The pitch
Today a loop ends at the boss. This build adds a **second floor**: after the boss, you can **Escape** (as now) or **Descend**. Descending keeps your deck, relics and Corruption and takes you into a shorter, harsher floor with its own enemies and its own boss.

It's a push-your-luck choice at the moment you feel strongest. It's also the first big content step since the Awakening, and it feeds the Echo-Caller: Echoes born deep come back with stronger decks.

## The choice at the Lock
After beating the floor-1 boss, a new screen offers two doors:

| | Escape | Descend |
|---|---|---|
| Result | Loop ends as a victory, as now | Floor 2 starts right away |
| Shards | Escape bonus now | Escape bonus held; ×2 if you escape floor 2 |
| If you die on floor 2 | — | You keep half the held bonus; the loop counts as a death *at depth 10+* |
| HP | — | Heal 25% of max HP on the stairs |

- **Unlock:** Descend appears after your first escape, with a one-time hint.
- **Awakening:** floor 2 adds +2 progress on top of the loop's normal +3/+2.
- **The Sleeper:** when it's awake, it stays the floor-1 boss. Beating it ends the cycle as now, and the Descend door is still offered after it. *(Flagged: this keeps the Awakening unchanged. The alternative, the Sleeper moving down to floor 2, is a bigger change to that design.)*

## Floor 2
- **Map:** 6 rows plus the boss. Row 0 is all Fights; the last row is Shrines with the Search rite (from the Choices pass, if built first, otherwise plain Shrines).
- **Node odds:** Fight 40, Elite 15, Event 20, Shrine 10, Cache 15. Fewer rows, more danger, more loot.
- **Rules of the depths:** one fixed floor rule, **The Weight**: each turn you start with 0 Ward, you take 1 damage. Gentle, but it pushes you to keep blocking and makes Ward-heavy builds shine.
- **Rewards:** card rewards use the elite rarity odds (25/50/25) in normal fights, and elites drop a relic *and* 20 Shards.

### Floor 2 enemies (draft)
Six normal enemies, two elites and a boss. Each one uses a mechanic the floor-1 enemies don't:

| Enemy | Kind | HP | Idea |
|---|---|---|---|
| Drowned Bellringer | normal | 52–56 | Tolls on a 3-turn timer: a delayed 18 you can see coming on the timeline |
| Hollow Pilgrim ×2 | normal | 28–32 each | When one dies, the other gains 6 Ward and +3 damage |
| Rot Lantern | normal | 46–50 | Each turn, adds a Smoke card to your discard (1 cost, Fade, does nothing) |
| Gnawing Dark | normal | 40–44 | Steals your last-played card's cost as Ward |
| Stitched Choir ×3 | normal | 16–20 each | Small and loud: each one Shrieks for 4 |
| The Unwound | normal | 58–62 | Rewinds itself: at half HP, heals back 20 once |
| **Keeper of Stairs** | elite | 96–104 | Alternates a big attack with Exposing you; enters with 12 Ward |
| **The Many-Handed** | elite | 88–94 | Plays a random card from *your* deck each turn |
| **The Bottom of the Well** | boss | 190–200 | Three phases: floods (delayed waves), drains (steals Ward), then drowns (attacks scale with turn count) |

The numbers are a starting point; the bot sim sets the final ones.

## What deep runs leave behind
- **Echoes from floor 2** get +4 stability per floor-2 depth reached and a new trait, **Deepborn** (stability ×1.2; in battle, starts with 6 Ward). They also carry their bigger deck, so Echo-Caller allies called from them are noticeably stronger.
- **A Floor 2 escape** adds a mark in the Archive and unlocks one relic per Warden for future loops (3 new relics).
- **Lore:** 3 new fragments in Research, about the stairs and the well.

## Milestones
**0.18.0: Floor 2 playable**
- The Escape-or-Descend screen, floor-2 map config, The Weight, and the 9 enemies with code-drawn sigils.
- Echo and save changes, plus the bot sim run through floor 2.

**0.19.0: Art and rewards**
- Painted art: 9 enemy sprites, 1 floor-2 background, and 1 stairs background for the choice screen.
- The 3 new relics, Deepborn, lore, and an Archive panel.
- A tuning pass from the sim and from your play.

## Engine and save
- `RunState.floor` already exists (always 1). The map generator already takes a config, so floor 2 is a second config.
- **New run phase:** `stairs` (the choice after the floor-1 boss). The run ends either there or after floor 2.
- **History and Echoes** record `floor` and depth across both floors (depth 10–16 means floor 2).
- **Save v11 or v12** (depending on whether the Daily lands first): `floor` on history entries and Echoes, the Deepborn trait, and a floor-2 escape count. Older saves migrate with floor 1.

## Balance targets
- Choosing Descend should win floor 2 about 35–45% of the time for a deck that just beat the Lock. Floor 2 should feel like a real risk, not a lottery.
- Average loop time grows by about 6–8 minutes when you descend; escaping stays as long as today.
- **Sim:** a `SIM_DESCEND=1` mode where the bot always descends, reporting floor-2 win rates per Warden and kit.

## Testing
- Engine tests for the stairs choice, held and halved bonuses, The Weight, each new enemy's special rule, depth and Echo stability across floors, and the save migration.
- Sim report per Warden.
- Preview check of the choice screen on 320px and wide screens.

## Art (0.19.0)
- 9 enemy sprites, 2 backgrounds, 3 relic icons, 1 node icon if floor 2 gets a unique node.
- About 15 images, roughly 0.5 MB.

## Open questions
- **The Sleeper's place** (above): stay on floor 1 *(recommended)* or move down to floor 2.
- **Half the held bonus on a floor-2 death:** generous enough? It could be none (pure push-your-luck) or all (no risk to Shards, only to the loop's record). *Recommended: half.*
- **A third floor later?** The structure supports any number. I'd wait until floor 2 has been played.
