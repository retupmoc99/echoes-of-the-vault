# Design proposal: the Echo-Caller (third Warden)

*Status: draft for review. Nothing here is built.*
*Decided: the Echo-Caller summons your **real** Outpost Echoes.*

> The loop remembers every one of you. The Echo-Caller makes it answer.

## The pitch
Every loop you've played left an Echo at the Outpost. The Echo-Caller brings them into the fight. Each Echo fights beside you with **the deck it died with**, so a loop you lost badly still matters. Its trait shapes how it fights.

Calling has a price. It drains the Echo's stability, the same stability that powers Dig, Research and Scout. Lean on your Echoes in a run and they work less at home. Lose one in battle and it may Unravel for good.

## How it works

### The Chorus
- When an Echo-Caller loop starts, the Echoes in your Outpost slots (up to 3) form its **Chorus**. The engine copies them into the loop: name, trait, deck snapshot, and stability. The loop never reaches back into Outpost state, so fights stay deterministic and resumable.
- **Call** brings the next unused Chorus member into the fight as an **ally**. At most **2 allies** are on the field at once, because of phone screen space.
- **Empty Chorus?** Call summons a **Nameless Echo** instead: 8 HP, a deck of 3 Grave Strike and 3 Shroud. The class still works for a brand-new player with no Echoes.

### Allies in a fight
- **HP:** 6 + 2 per depth the Echo's loop reached, capped at 24, then adjusted by trait.
- **Turn:** after you end your turn and before the enemies act, each ally **plays the top card of its own deck**.
  - The card resolves at **half strength**, rounded up: "an Echo remembers dimly".
  - It costs nothing. Curses in its deck fizzle and cost the ally 2 HP.
  - It aims at your current target.
- **Being attacked:** enemies attack **you**, as now, so intent badges stay honest. Allies only take hits when a card says so: *Guard* redirects attacks aimed at you to that ally for one turn. Area attacks hit allies too.
- **Falling:** at 0 HP an ally fades for the rest of the fight. It can be Called again in a later fight.

### Traits in battle
Each Outpost trait gets a combat meaning, so your idle Echoes feel like characters.

| Trait | In battle |
|---|---|
| Unbroken | +50% HP |
| Ravenous | Plays 2 cards a turn, loses 2 HP a turn |
| Haunted | Its curses hit enemies for 4 instead of fizzling |
| Pathfinder | Acts at the start of your turn, so you see its card before you plan |
| Scarred | Gains 3 Ward at the start of each turn |
| Hoarder | Plays the most expensive of its top 3 cards |
| Fleeting | Full strength instead of half, but fades after 2 turns |
| Faded | No change |

### The price: stability
- **Calling** an Echo costs **10 stability**. Its **falling** in battle costs **15 more**.
- Costs are added up during the loop and applied **when the loop closes**, the same moment the new Echo is made.
- The Call button warns you first: *"Veyra has 12 stability. Calling her leaves 2."*
- If the costs drain an Echo to 0, it **Unravels when the loop closes**. You can do it knowingly: a last stand. *(Flagged: see open questions.)*
- The Echoes tab shows what last loop took: *"Called 3 times, fell once: −40 stability."*

## Cards (about 25)
These are working names and numbers. Six would be locked behind Research, like the other classes.

**Starter deck (10):** Grave Strike ×4 (1: deal 6), Shroud ×4 (1: gain 5 Ward), Call the Fallen, Whispered Name.

**The Chorus** (more allies, stronger allies)

| Card | Cost | Effect |
|---|---|---|
| Call the Fallen | 1 | Call an Echo. *(starter)* |
| Whispered Name | 0 | An ally acts now. Draw 1. *(starter)* |
| Gathering Dark | 2 | Call two Echoes. Fade. |
| Requiem | 1 | Every ally acts now. |
| Hymn of Iron | 1 | Allies gain 6 Ward. |
| Stand Before Me | 0 | An ally Guards this turn. |
| Kindred Blade | 1 | Deal 4, plus 3 per ally. |
| Choir of the Lost | 3 | This fight, allies act twice a turn. Fade. *(rare)* |

**Communion** (spend your allies)

| Card | Cost | Effect |
|---|---|---|
| Release | 1 | An ally fades. Deal its HP to all enemies. |
| Grave Tithe | 0 | An ally loses 6 HP. Gain 2 Resonance. |
| Soul Lance | 2 | Deal 10. If an ally fell this fight, deal 10 more. |
| Mourning | 1 | Gain 4 Ward per ally fallen this fight (max 20). |
| Final Chorus | 2 | Every ally fades. Each deals 8 to all enemies. *(rare)* |

**Remembrance** (use your allies' decks)

| Card | Cost | Effect |
|---|---|---|
| Borrowed Hand | 1 | Play the top card of an ally's deck yourself, at full strength. |
| Remembered Ward | 1 | Gain Ward: 3 per cost of each ally's top card. |
| Echoing Cut | 1 | Deal 5. Echo. *(reuses the Hour-Thief's Echo keyword)* |
| What They Knew | 1 | See each ally's next card. Draw 2. |
| Memory of Victory | 2 | Play the top 3 cards of an ally's deck yourself. *(rare)* |

Plus a few bridges, such as an ally card that applies Bleed, so Relic-Breaker-style decks come through in Echoes' snapshots.

## Relics (7)
| Relic | Effect |
|---|---|
| **Lantern of Names** *(starter)* | At the start of each fight, Call an Echo. |
| Bell of the Drowned | Allies enter with 5 Ward. |
| Ashen Locket | When an ally falls, draw 2. |
| Choir Stone | Allies have +4 max HP. |
| Mourner's Veil | The first time an ally falls each fight, gain 2 Resonance. |
| Grave Ledger *(tainted, +1)* | Allies act twice, but lose 3 HP a turn. |
| Severed Thread *(tainted, +2)* | Calling costs no stability. |

## Unlock
An Outpost Work, **The Lantern of Names**, for 150 Shards. That's a little more than the Hour-Thief's 120, since it's best once you have a few Echoes.

## What has to be built
- **Engine:**
  - Ally combatants: `CombatState.allies` and `RunState.chorus`.
  - An ally phase between your turn and the enemies'.
  - Effects resolving with an ally as the source, at half strength.
  - Guard redirection, and area damage reaching allies.
  - New effect kinds: `call`, `allyAct`, `guard`, `releaseAlly`, `playAllyTop`.
  - New events: `allyCalled`, `allyActed`, `allyFell`.
- **Idle link:** loop start copies the Chorus, and `closeLoop` applies stability costs and Unravels drained Echoes.
- **Save v8:** fights and loops in progress gain an empty `allies` and `chorus`.
- **UI:**
  - An ally row above your HP bar: name, HP, Ward, and the next card shown as a small icon.
  - The Call warning, plus Guard and fall animations.
  - Echo cards show last loop's cost.
- **Content:** about 25 cards, 7 relics, the unlock Work, 6 research items, and art via `npm run art:gen`.
- **Balance:** the sim bot learns to Call and Guard. Target: the same win rate as the other two classes.

**Two milestones:**
1. Engine, allies UI, save v8 and about 8 cards, playable end to end.
2. The full card set, relics, art, sim tuning and docs.

## Open questions for you
1. **Can a Call Unravel an Echo?** That's the proposal: allowed, with a clear warning. It's dramatic, but you could lose an Echo you liked. The alternative: Call is disabled once an Echo is too weak.
2. **Is a stability cost of 10 per Call and 15 per fall right?** An average Echo has about 80–120 stability, so a heavy-Calling loop could cost a quarter of an Echo's working life.
3. **Two allies at once:** enough presence on a phone screen, or should it be one, kept simpler?
4. **Allies only take hits through Guard and area attacks.** That keeps enemy intents simple. The alternative: enemies sometimes target allies, which is livelier but harder to read.
