# Design proposal: the Daily Descent

*Status: built in 0.17.0 with the recommended answers (standard kit, no Echo). Omens Mirror and Thin Veil were replaced by Heavy Hands and Paper Walls (simpler to read on a phone), Ascetic and Borrowed Strength were simplified, and five Omens were retuned with the bot sim; see DESIGN.md → Daily Descent.*

> The vault dreams one shared dream each day. Everyone who descends walks the same halls.

## The pitch
**One special loop per day,** the same for every player: the same map, Vault Shift, fights and rewards, plus one **Omen**, a rule that bends the game for that day. You get one attempt. Afterwards you get a short result line to share, so friends can compare runs on exactly the same vault.

It gives a reason to open the game daily that doesn't depend on the idle timers. It also follows the main pillar: **missing a day never costs you anything.**

## How it works
- **The seed comes from the date** (`daily:2026-11-22`, local calendar day), so there's no server. Every copy of the game builds the identical loop from it.
- **One attempt per day.** Starting it uses up the day; abandoning counts as a death. You can't start it while a normal loop is in progress (one run slot, as now).
- **Your Warden, the day's setup.** You pick the Warden; the kit is always that Warden's standard kit, so everyone starts even.
  - Rewards draw from the **full card pool** (as if all Research is done), so newer players aren't behind.
  - The Shift, map and Omen are fixed by the date.
- **It sits outside the long game.** The Daily leaves no Echo, doesn't move the Awakening, and ignores your Cycle. It's a side room, not a step forward.

## Omens (one per day)
Each Omen is one rule and fits on one line. There are 12 in the first set, rotated by the date with no repeat inside 12 days.

| Omen | Rule |
|---|---|
| Glass Vault | Max HP halved; card rewards offer 4 cards |
| Hoard | Start with 2 random relics; no Relic Caches on the map |
| Quickened | Draw 6 cards a turn; enemies have +20% HP |
| Bleeding Moon | Every attack also applies 1 Bleed, yours and theirs |
| Quiet Vault | No Events; one extra Cache and Shrine |
| Ascetic | No card rewards; Shrine removals are free and don't use your visit |
| Crowded Halls | Every normal fight adds a Choir Shard |
| Borrowed Strength | Start with 3 Corruption and a rare card of your choice |
| Long Night | One extra map row; Shrines heal 50% |
| Mirror | Elites copy your last-played card once per fight |
| Thin Veil | Every Echo trait's battle bonus applies to you (Echo-Caller: twice to allies) |
| Clockwork | Every card costs 1 (0-cost cards included) |

The list lives in data (`src/data/omens.ts`), so more Omens are just data.

## Rewards
Small and flat. It's a daily treat, not a requirement:
- **Finishing (win or lose):** 25 Shards.
- **Escaping:** 50 more, plus one Daily mark in the Archive.
- **Days played** is shown as a total, never as a streak. There's nothing to break.

## Sharing
After the Daily, a result card shows the date, Omen, Warden, how far you got, and turns taken. The **Share** button uses the phone's own share sheet (Web Share API), or copies to the clipboard. For example:

```
Echoes of the Vault · Daily 2026-11-22
Omen: Glass Vault · Hour-Thief
Escaped · depth 9/9 · 41 turns
◆◆◆◆◆◆◆◆◇ Lock
```

There's no leaderboard and no account; you share it wherever you like. No data leaves the phone unless you tap Share.

## Screens
- **Descend tab:** a "Daily Descent" card above the normal loop. It shows today's Omen and Shift, then "Done today ✓" plus your result once played.
- **Run header:** a small Omen chip (tap it to read the rule).
- **Archive → History:** Daily runs are listed with a sun mark; there's also a small Daily panel (days played, escapes, best depth).

## Engine and save
- `createRun` gets `omenId`. Omens are applied through hooks the engine already has: run options (deck, HP, reward count), combat modifiers (draw, enemy HP, cost override), and map config (rows, node odds).
  - Glass Vault, Quickened, Quiet Vault, Long Night and Clockwork are config only.
  - Bleeding Moon, Mirror and Crowded Halls need small engine hooks.
- **Save v11:** `daily: { lastPlayed: 'YYYY-MM-DD', daysPlayed, escapes, bestDepth }`, plus a `daily` flag on the run and on its history entry.
- **Date handling:** the day is the phone's local date. Changing the phone's clock could give an extra attempt; that's fine (there's no competition to protect).

## Balance
- `SIM_OMEN=<id> npm run sim` runs the bot under each Omen. The aim is win rates of roughly 20–45%: harder or easier days are fine, a 5% day is not.

## Testing
- **Same seed and Omen give the same map, fights and rewards** (tested on two saves with different research).
- One attempt per day; no Echo and no Awakening change.
- The share text format, and a preview check on 320px and wide screens.

## Art
- None required. Optional: 12 small Omen glyphs (code-drawn SVG, like map nodes).

## Open questions
- **Should the Daily ignore your kit unlocks** (standard kits only, as proposed) or let you choose? Standard keeps it fair to compare. *Recommended: standard.*
- **Should the Daily ever leave an Echo?** The proposal says no, so the Daily stays a side room. An "Echo of the Daily" that only Rests would be a cute keepsake. *Recommended: no for now.*
