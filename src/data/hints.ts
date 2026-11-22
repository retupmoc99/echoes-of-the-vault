/**
 * First-time hints: one short note the first time each mechanic appears.
 * Clarity first, atmosphere second. Each is dismissed once, for good.
 */
export interface HintDef {
  title: string;
  text: string;
}

export const HINTS = {
  'outpost-welcome': {
    title: 'The loop',
    text: 'You are a Warden, caught in a time loop. Each descent is one run through a vault that changes every time. Win or die, you wake here. Tap Descend.',
  },
  'map-first': {
    title: 'Choose your path',
    text: 'Lit chambers are open to you. Tap one to read it, tap again to enter. The Vault Shift at the top bends the rules for this whole loop.',
  },
  'combat-cards': {
    title: 'Playing cards',
    text: 'Tap a card to read it, then tap Play (or the card again). Cards cost Resonance ◆: you get 3 each turn and draw 5 cards.',
  },
  'combat-intents': {
    title: 'Read the enemy',
    text: 'The badge above an enemy shows its next move and damage. Ward ⬡ blocks damage but fades at the start of your turn. End Turn when you are done.',
  },
  statuses: {
    title: 'Tap to learn',
    text: 'Tap any status, relic or intent to see exactly what it does. Nothing here needs guessing.',
  },
  overload: {
    title: 'Overload',
    text: 'Overload cards wake your relics. Each use adds Strain (the dots under a relic); at full Strain it cracks and goes dark for the rest of the fight.',
  },
  reward: {
    title: 'Spoils',
    text: 'Take one card, or none: a lean deck draws its best cards more often. The Tainted card is rare and strong, but adds Corruption.',
  },
  corruption: {
    title: 'Corruption',
    text: 'Power has a price. At 3, 6 and 9 Corruption, enemies grow stronger and rares grow common; at 6 and 9, a curse joins your deck.',
  },
  event: {
    title: 'Choices',
    text: 'Every option costs something. Options you cannot afford are shown, but greyed out.',
  },
  shrine: {
    title: 'Shrines',
    text: 'Rest to heal, or cut a weak card from your deck. HP does not return between fights otherwise.',
  },
  'run-end': {
    title: 'An Echo remains',
    text: 'Every loop, won or lost, leaves an Echo at the Outpost. Echoes work while you are away.',
  },
  echoes: {
    title: 'Echoes',
    text: 'Give each Echo a task: Dig for Shards, Research new cards and lore, or Scout the next loop. Work wears them down; when it runs out, they Unravel for good.',
  },
  works: {
    title: 'Works',
    text: 'Spend Shards on new options (starting decks, rerolls, rites), not raw power. The vault never gets easy, only more varied.',
  },
  timeline: {
    title: 'The timeline',
    text: 'Delayed effects wait in the row above your hand, counting down at the start of each turn. Tap one to see what lands, and when.',
  },
  'echo-copy': {
    title: 'Echoes of cards',
    text: 'A card marked "Echo" came back as a fading copy. Play it this turn or lose it. Played copies echo again.',
  },
  paradox: {
    title: 'Paradox',
    text: 'Bending time builds Paradox. End a turn at 5 or more and the timeline snaps back: 2 damage per stack, then it resets. Spend it before then.',
  },
  'new-warden': {
    title: 'A second Warden',
    text: 'The Hour-Thief is yours. Choose your Warden above before you descend: each plays very differently.',
  },
  awakening: {
    title: 'The Sleeper stirs',
    text: 'Every loop you close, and every hour your Echoes work, wakes it a little. Each stage makes loops harder and richer. Lull it with Shards, or give it an Echo, if you want it quiet.',
  },
  'sleeper-awake': {
    title: 'It is awake',
    text: "The Sleeper now waits at the bottom of every loop, in the Lock's place. It opens with what it remembers of your loop. Lull and Give no longer work: only unmaking it ends the cycle.",
  },
  daily: {
    title: 'The Daily Descent',
    text: 'Once a day, the same vault for everyone, with an Omen that bends one rule. One try. It leaves no Echo and does not stir the Sleeper. Missing a day costs nothing.',
  },
  somnant: {
    title: 'Drowse and sleep',
    text: 'Drowse builds on a foe; the chip shows how close it is (4/6). At its threshold it falls Asleep and skips its next turn. Hit it then: some cards strike far harder at a sleeper.',
  },
  'sin-eater': {
    title: 'Curses are food',
    text: 'Devour cards eat the leftmost curse in your hand for a bonus. It is back next fight. Cards with Burden grow with every curse you carry, so the tainted offer is a meal.',
  },
  mirrorborn: {
    title: 'Mirror',
    text: 'Mirror plays the enemy’s shown move yourself, turned around: its attack hits it, its Ward shields you, its debuffs land on it. Steal takes the move away entirely.',
  },
  shiftwright: {
    title: 'Three weathers',
    text: 'You are always in one Aspect: Drowned (Bleed on foes stays), Fractured (+2 per hit, lose 1 HP a turn) or Choir (draw 1 more). Attune cards switch; "In X:" bonuses only work in that Aspect. Fights start in the loop’s Shift.',
  },
  pilgrim: {
    title: 'Miles',
    text: 'Every chamber you enter is a Mile (elites give 2). Road cards grow with your Miles, so you are weak early and strong deep in a loop, and on floor 2.',
  },
  tollkeeper: {
    title: 'Toll',
    text: 'Foes pay Toll when they die. Pay cards spend it for a bonus; Shrines and rewards take it too. Toll is gone when the loop ends: spend it.',
  },
  stairs: {
    title: 'The stairs',
    text: 'Past the boss, the vault goes on. Escape now and the loop ends as a win. Descend and you keep everything for a shorter, harsher floor: escape it for far more Shards, but die there and the loop counts as a death.',
  },
  allies: {
    title: 'Your Echoes fight beside you',
    text: 'After you end your turn, each ally plays the next card from the deck it died with, at three-quarters strength, at your target. Enemies still attack you, unless an ally Guards. Every Call, and every fall, costs that Echo stability when the loop ends.',
  },
  backup: {
    title: 'Keep a backup',
    text: 'Your progress lives in this browser only. Copy a save code now and then from Archive → Backup.',
  },
} satisfies Record<string, HintDef>;

export type HintId = keyof typeof HINTS;
