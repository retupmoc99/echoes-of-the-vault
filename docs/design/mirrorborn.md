# Design: the Mirrorborn (Warden 6)

*Status: built in 0.21.0.*

**Changed in tuning:**
- **HP 62.**
- **Mirror strengths:**
  - Reflection 50%.
  - Copycat 40% (a free 50% Mirror was the strongest card in the pool).
  - Two Faces 60%.
- **Intent-reading Ward is halved:**
  - Mimic's Guard: 2 + half the intended damage, at most 8.
  - Turn It Back: Ward for half, damage for the full amount.
  - Face of the Foe: 75%.
- Cracked Mirror gives 1 Ward. Black Glass deals 6 to the robbed foe (an enemy-Ward wipe wasn't a clean engine piece).
- **The Face-Thief** is Pilfer and Silver Tongue in place of two Glass Edges. With Copycat in it, it won 72%.
- **Bot:** 37% standard; the Face-Thief 37% and the Glass Wall 40%.
*Unlocked by the deed **Seen in every glass** (beat every elite at least once, floor 1's and floor 2's), then the Work **The Mirror That Kept Its Face** (180 Shards).*

> It has no face of its own. It borrows yours.

## The pitch
Every enemy shows its next move. The Mirrorborn **plays that move itself**, turned around: the enemy's attack hits the enemy, its Ward shields you, the curse it meant for you lands on it. Reading intents stops being defence and becomes the whole game.

## Core rules
- **Mirror (at N%):** resolve the target's current intent as if you made the move, at N% strength (rounded up). Each part is turned around:

| The enemy's move… | …becomes |
|---|---|
| Attack on you | your attack on it (all-foes attacks hit all foes) |
| Ward for itself | Ward for you |
| A status on you (Weakened, Exposed, Bleed) | that status on it |
| A status on itself (Fracture) | that status on you |
| A delayed attack (a Dream, a toll) | your delayed attack on it |
| Smoke into your deck | nothing |

  - A sleeping enemy (Somnant) or a robbed one has nothing to mirror.
  - The card text shows a live preview: "Mirror Sunder (8) → deal 6".
- **Steal:** mirror the target's intent at 50%, then it **loses that move**. It does nothing on its turn, and its intent shows *Robbed*; next turn it carries on with its pattern. **Bosses can't be robbed:** Steal on a boss gives it 2 Weakened instead. **Design change from the idea:** the generated "Stolen" card was dropped. Steal now plays the move at once, which reads better on a phone and needs no made-up cards.
- **Intent reading:**
  - The amount `targetIntentDamage` is the target's shown damage × hits.
  - The condition `targetIntends { attack | defend | debuff | buff }` matches what its badge shows.
  - Nothing is hidden: the player sees exactly what a Mirror will do.

## The Warden
- **HP 66.** Starter relic: **Cracked Mirror** (whenever you Mirror, gain 2 Ward).
- Archetypes: `reflection` and `theft`.
- 24 cards of its own: 4 starters plus 20 rewards, six research-locked (🔒).

### Starting deck
| Card | Cost | Type | Effect |
|---|---|---|---|
| Glass Edge ×4 | 1 | strike | Deal 6. |
| Silvered Ward ×4 | 1 | ward | Gain 5 Ward. |
| Reflection | 1 | rite | Mirror the target's intent at 75%. |
| Mimic's Guard | 1 | ward | Gain Ward equal to the target's intended damage (at most 12, at least 4). |

### Reward cards
| Card | Cost | Rarity | Type | Effect |
|---|---|---|---|---|
| Copycat | 0 | common | rite | Mirror the target's intent at 50%. |
| Foreknowledge | 1 | common | ward | Gain 4 Ward. If the target intends to attack, draw 1. |
| Glass Shards | 1 | common | strike | Deal 3 twice. If the target intends to attack, three times. |
| Reflected Ward | 1 | common | ward | Gain 6 Ward. If the target intends to defend, gain 6 more. |
| Silver Tongue | 1 | common | rite | Apply 2 Weakened. If the target intends to attack, apply 1 Exposed too. |
| Hairline Crack | 1 | common | strike | Deal 7. If the target intends a debuff, deal 7 more. |
| Mimicry | 1 | common | rite | Mirror the target's intent at 60%. Draw 1. |
| Second Glance | 0 | common | rite | Draw 2 if any foe intends to attack. Otherwise draw 1. |
| Two Faces | 1 | uncommon | rite | Mirror the target's intent at 75%. Echo. |
| Turn It Back | 2 | uncommon | ward | Gain Ward equal to the target's intended damage, and deal that much to it. |
| Pilfer | 2 | uncommon | rite | Steal the target's intent. Fade. |
| Hall of Mirrors | 2 | uncommon | rite | Mirror every enemy's intent at 75%. |
| Shard Storm | 2 | uncommon | strike | Deal 5 to all foes, plus 3 per foe intending to attack. |
| 🔒 Inverse | 1 | uncommon | rite | Mirror the target's intent at 100% if it intends a debuff; otherwise at 50%. |
| 🔒 Silvering | 1 | uncommon | ward | Gain 8 Ward, plus 2 per foe intending to attack. |
| Perfect Copy | 2 | rare | rite | Mirror the target's intent at 150%. |
| Shatter the Glass | 3 | rare | rite | Steal every enemy's intent. Fade. |
| 🔒 Mirror Maze | 2 | rare | rite | Mirror every enemy's intent at 100%. Fade. |
| 🔒 Face of the Foe | 1 | rare | ward | Gain Ward equal to all foes' intended damage. |
| 🔒 Thousand Faces | 3 | rare | rite | Mirror the target's intent at 75%, three times. Fade. |

### Relics
| Relic | Rarity | Effect |
|---|---|---|
| Cracked Mirror (starter) | starter | Whenever you Mirror, gain 2 Ward. |
| Silver Dust | common | Turn start: if any foe intends to attack, gain 3 Ward. |
| Hand Mirror | common | Whenever you Mirror, deal 2 to all foes. |
| Two-Sided Coin | uncommon | Fight start: apply 1 Exposed to all foes. |
| Thief's Glove | uncommon | Whenever you Steal, gain 1 Resonance. |
| Glass Heart | uncommon (tainted, +1 Corruption) | Your Mirrors are 25% stronger. |
| The True Reflection | rare | Whenever you Mirror, draw 1. |
| Black Glass | rare | Robbed foes also lose all their Ward. |
| Drowned Mirror (the Well) | rare | Whenever you Mirror, gain 4 Ward and apply 1 Weakened to the target. |

### Kits
- **The Face-Thief:** Pilfer and Copycat in place of a Glass Edge and a Silvered Ward. Take their turn away.
- **The Glass Wall:** Foreknowledge and Turn It Back in place of two Glass Edges. Let them strike first, and pay it back.

## Engine work
- **Effect `mirrorIntent { scale, who: 'target' | 'all', times? }`:** resolves the enemy's move effects from the player, mapping targets as in the table above, at `scale` potency (plus any `mirrorBonus`). It fires the `mirrored` trigger once per card.
- **Effect `stealIntent { who }`:** mirror at 50%, then set `robbed`. A robbed enemy skips its next move (like a sleeper, for one turn only) and shows a *Robbed* intent. On a boss it applies 2 Weakened instead. Fires the `stole` trigger.
- **Amounts:** `targetIntentDamage` and `allIntentDamage` (with an optional `max`, a new general cap on any amount), and `foesIntendingAttack`.
- **Condition:** `targetIntends`. **Triggers:** `mirrored` and `stole`. **Combat modifier:** `mirrorBonus`.
- **Bot:** Mirror the enemy with the biggest attack, use Steal on elites' big turns, and treat intended damage as the block target.

## UI
- Mirror cards show the live preview line in place of static text (the describer already previews with the live state).
- A *Robbed* intent badge (a broken mirror).
- **First-time hint (`mirrorborn`):** "Mirror plays the enemy's shown move yourself, turned around: its attack hits it, its Ward shields you."

## Balance targets
- 32–37% at stage 0, with kits within 4 points.
- **Watch:** Steal on elites (it may need a once-per-fight cap), and Perfect Copy on boss turns.

## Art direction
**Silver and cold cyan:** cracked mirrors, glass, reflections, masks, twin faces, shattered light. Prompts under "Mirrorborn cards" and "Mirrorborn relics".
