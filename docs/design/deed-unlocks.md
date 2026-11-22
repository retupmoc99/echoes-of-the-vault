# Design: deed unlocks

*Status: built in 0.20.0 with the Somnant.*

**As built:**
- The save keeps only the **tally**. A deed counts as done whenever its goal is met, so there is no separate "done" list to fall out of step.
- Goals are plain data (`DeedGoal`: `peakAwakening`, `cursesCarried`, `shiftsEscaped`, `deepEscapes`, `allElites`), because content must stay cloneable.
- Only the Somnant's deed exists so far. The tally already tracks everything the later deeds need.
- Finishing a deed shows a notice. The Works dot and "New" tag were left out; the notice and the Work appearing were enough.
- Deeds are listed in Archive → Fragments.

> The Outpost does not sell its secrets. It waits until you have earned them.

## The pitch
New Wardens shouldn't just be a Shards purchase. Each one is tied to a **deed**: something you do in the vault that fits its theme. When you've done the deed, its Work appears in the Works tab with a Shards cost, as now.

You earn the Warden by playing, the Work turns up with a small fanfare, and the roster paces itself with no guide needed.

The Hour-Thief and the Echo-Caller stay as they are (Shards only). Most players already own them, and they are the early Wardens.

## How it works
- A **deed** is data: an id, a title, a line of flavour, and a condition on what the player has done.
- **Progress is tracked across loops** in a new save record, `deeds`. It's updated when a loop closes, and when the Awakening changes stage.
- A Work can require a deed: `requires: 'deed:<id>'`. This uses the `requires` rule already used to hide kit Works until their Warden is owned. Until the deed is done, the Work is hidden.
- **Completing a deed:**
  - A notice ("Deed done: You hear it dreaming. A new Work stands at the Outpost.").
  - A dot on the Works tab until it is opened.
  - A line in the Archive.
- **Locked Wardens show their deed**, so nothing is a mystery. The Warden picker shows "Locked. *You hear it dreaming:* reach the Awakening's third stage (now: stage 1)." This replaces today's "Build X in Works", for deed-gated Wardens.
- An **Archive → Deeds** list shows every deed, done or not, with progress where it has a number ("Shifts escaped: 2 / 3").

## What's tracked
One small record in the save, covering every planned deed:

| Tally | Updated when | Used by |
|---|---|---|
| `peakAwakening` | the Awakening reaches a stage | Somnant |
| `maxCursesCarried` | a loop closes (curses in the final deck) | Sin-Eater |
| `elitesBeaten` (ids) | a loop closes (elite fights won) | Mirrorborn |
| `shiftsEscaped` (ids) | a loop closes as a victory | Shiftwright |
| `deepEscapes` | a loop escapes floor 2 (already in `meta`) | Pilgrim |

Dailies count toward deeds too. They're real play, and it costs nothing to allow.

## The deeds
| Warden | Deed | Condition | Work (cost) |
|---|---|---|---|
| Somnant | **You hear it dreaming** | Reach Awakening stage 3 | The Sleeper's Hymnal (170) |
| Sin-Eater | **Fed on sin** | Close a loop carrying 3+ curses | The Ash Table (170) |
| Mirrorborn | **Seen in every glass** | Beat every elite at least once (floor 1's and floor 2's) | The Mirror That Remembers (180) |
| Shiftwright | **Weathered** | Escape under 3 different Vault Shifts | The Weathervane (180) |
| Pilgrim | **Back from the Well** | Escape floor 2 | The Long Road (200) |
| Tollkeeper (if kept) | none | Shards only | The Toll Gate (150) |

Each deed fits its Warden: the Somnant hears the Sleeper, the Sin-Eater has already eaten curses, the Mirrorborn has faced every elite, and so on. They come roughly in the order a player reaches them, matching the suggested build order.

## Existing saves
Deeds should credit what a player has already done, so nobody is told to redo it. The migration (save v12) fills the tallies from what the save already knows:
- `peakAwakening`: 5 if a Sleeper cycle has ever been completed (cycle > 1), otherwise the current stage.
- `maxCursesCarried`: the most curse cards in any final deck in History.
- `shiftsEscaped`: Shifts of the victories in History.
- `deepEscapes`: from `meta`.
- `elitesBeaten`: unknown for past loops, so it starts empty. This only affects the Mirrorborn's deed, which is the furthest out anyway.

History keeps only the last 20 loops, so a long-time player may get slightly less credit than earned. That's acceptable: every deed is still reachable in normal play.

## Engine work
- **Data:** `src/data/deeds.ts` lists each deed with its `id`, `title`, `flavor`, `hint` (shown while locked), and `check(tally) → { done, progress?, goal? }`.
- **Save v12:** `deeds: { tally: {...}, done: string[] }`, plus the migration above.
- **Updates:**
  - `closeLoop` and `closeDaily` update the tally from the run (curses in the deck, elite encounters won, the Shift on victory, floor-2 escape).
  - `addAwakening` and `completeCycle` update `peakAwakening`.
  - After each update, newly done deeds are added to `done` and reported as notices.
- **Works:** `requires` accepts `deed:<id>`. The buy check and the Works list already honour `requires`.
- **Classes:** `WardenClassDef.deed?: string` for the picker's locked text.
- **Tests:**
  - each deed's condition
  - tallies update on close (and on Dailies)
  - the migration credits History
  - deed-gated Works stay hidden and can't be bought early
  - the notice fires once

## UI
- **Warden picker:** a locked deed-gated Warden shows the deed's title and hint, with progress.
- **Works tab:** a newly revealed Work gets a "New" tag until it's seen, plus the tab dot.
- **Archive:** a fifth sub-tab, Deeds. Or, to keep it tight on a phone, a section at the top of Fragments. *Recommended: a section in Fragments*, since four sub-tabs already fill a 320px row.

## Open questions (with recommendations)
- **Gate the Hour-Thief and Echo-Caller too?** *No.* They're the early Wardens, and changing them would lock existing players out of nothing but add confusion.
- **Show deeds for Wardens not built yet?** *No.* Only deeds whose Warden exists appear, so the list never promises things that aren't in the game.
- **Should deeds give anything besides the Work?** *Not at first.* Lore or a cosmetic title could come later.
