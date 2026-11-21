/**
 * Text events. Every option costs something. There are no free lunches,
 * and "walk away" is never quite free either.
 */
import type { EventDef } from '../../engine/types';

export const EVENTS: EventDef[] = [
  {
    id: 'weeping-font',
    title: 'The Weeping Font',
    text: 'Black water rises from a cracked basin. It is warm. It smells of iron and of home.',
    options: [
      {
        label: 'Drink deep',
        hint: 'Heal 18 HP. Gain 2 Corruption.',
        outcomes: [{ text: 'It fills the hollows in you. Something else fills them too.', effects: [{ kind: 'heal', amount: 18 }, { kind: 'corruption', amount: 2 }] }],
      },
      {
        label: 'Wet your lips',
        hint: 'Heal 6 HP. Gain 1 Corruption.',
        outcomes: [{ text: 'Just a taste. It lingers on your tongue for hours.', effects: [{ kind: 'heal', amount: 6 }, { kind: 'corruption', amount: 1 }] }],
      },
      {
        label: 'Walk past',
        hint: 'Nothing changes.',
        outcomes: [{ text: 'You hear it weeping long after the hall is behind you.', effects: [] }],
      },
    ],
  },
  {
    id: 'hall-of-sleepers',
    title: 'Hall of Sleepers',
    text: 'Rows of glass coffins. Inside, Wardens like you, breathing slowly. One opens its eyes as you pass.',
    options: [
      {
        label: 'Wake it fully',
        hint: 'Gain a rare card. Gain a curse.',
        outcomes: [{ text: 'It teaches you one thing before it screams. You will hear the scream for a long time.', effects: [{ kind: 'addRandomCard', rarity: 'rare' }, { kind: 'addCurse' }] }],
      },
      {
        label: 'Take a memory',
        hint: 'Lose 7 HP. Gain an uncommon card.',
        outcomes: [{ text: 'You reach through the glass. It cuts. The memory is worth it.', effects: [{ kind: 'loseHp', amount: 7 }, { kind: 'addRandomCard', rarity: 'uncommon' }] }],
      },
      {
        label: 'Let them sleep',
        hint: 'Nothing changes.',
        outcomes: [{ text: 'Its eyes follow you to the door.', effects: [] }],
      },
    ],
  },
  {
    id: 'cartographer',
    title: 'The Cartographer',
    text: 'A body in a Warden’s coat, curled around a satchel. The face is yours, older.',
    options: [
      {
        label: 'Search the satchel',
        hint: 'Gain a random relic. Gain 2 Corruption.',
        outcomes: [{ text: 'You take what you once carried. It remembers your hands.', effects: [{ kind: 'gainRelic' }, { kind: 'corruption', amount: 2 }] }],
      },
      {
        label: 'Bury yourself',
        hint: 'Lose 4 HP. Lose 1 Corruption.',
        outcomes: [{ text: 'The stone floor breaks your nails. The vault loosens its grip, a little.', effects: [{ kind: 'loseHp', amount: 4 }, { kind: 'corruption', amount: -1 }] }],
      },
    ],
  },
  {
    id: 'altar-of-cinders',
    title: 'Altar of Cinders',
    text: 'An altar heaped with ash. Carved above it: GIVE, AND BE LESS.',
    options: [
      {
        label: 'Give blood',
        hint: 'Lose 12 HP. Remove a card of your choice.',
        outcomes: [{ text: 'The ash drinks, and waits for you to name what it takes.', effects: [{ kind: 'loseHp', amount: 12 }, { kind: 'removeChosenCard', count: 1 }] }],
      },
      {
        label: 'Give a relic',
        hint: 'Lose a random relic. Gain a rare card.',
        outcomes: [{ text: 'The relic melts like wax. The altar gives back something sharper.', effects: [{ kind: 'loseRandomRelic' }, { kind: 'addRandomCard', rarity: 'rare' }] }],
      },
      {
        label: 'Give nothing',
        hint: 'Gain 1 Corruption.',
        outcomes: [{ text: 'The ash stirs as you leave. It has your scent now.', effects: [{ kind: 'corruption', amount: 1 }] }],
      },
    ],
  },
  {
    id: 'remembering-mirror',
    title: 'The Mirror That Remembers',
    text: 'A pane of dark glass. Your reflection is a moment late, and it is smiling.',
    options: [
      {
        label: 'Look closer',
        hint: 'Even odds: a rare card, or a curse.',
        outcomes: [
          { weight: 1, text: 'It shows you a way to win. You do not ask what it costs.', effects: [{ kind: 'addRandomCard', rarity: 'rare' }] },
          { weight: 1, text: 'It steps out. You step in. Only one of you leaves.', effects: [{ kind: 'addCurse' }] },
        ],
      },
      {
        label: 'Shatter it',
        hint: 'Lose 5 HP. Gain Shatter Lens.',
        outcomes: [{ text: 'A shard stays in your palm. It hums.', effects: [{ kind: 'loseHp', amount: 5 }, { kind: 'addCard', cardId: 'shatter-lens' }] }],
      },
      {
        label: 'Turn away',
        hint: 'Nothing changes.',
        outcomes: [{ text: 'It keeps smiling at your back.', effects: [] }],
      },
    ],
  },
  {
    id: 'starving-echo',
    title: 'A Starving Echo',
    minRow: 2,
    text: 'A faint ghost of a Warden kneels in the dust, holding out cupped hands. They are empty.',
    options: [
      {
        label: 'Feed it',
        hint: 'Lose 6 max HP. Gain a random relic.',
        outcomes: [{ text: 'It drinks from you and grows solid enough to give something back.', effects: [{ kind: 'maxHp', amount: -6 }, { kind: 'gainRelic' }] }],
      },
      {
        label: 'Banish it',
        hint: 'Heal 10 HP. Gain 2 Corruption.',
        outcomes: [{ text: 'It comes apart like smoke. Its warmth becomes yours. So does its hunger.', effects: [{ kind: 'heal', amount: 10 }, { kind: 'corruption', amount: 2 }] }],
      },
      {
        label: 'Leave it be',
        hint: 'Nothing changes.',
        outcomes: [{ text: 'It is still kneeling when the loop takes you.', effects: [] }],
      },
    ],
  },
  {
    id: 'tithe-collector',
    title: 'The Tithe Collector',
    text: 'A tall shape in rusted vestments bars the way. It holds out a bowl. It will not let you pass empty-handed.',
    options: [
      {
        label: 'Pay in flesh',
        hint: 'Lose 12 HP. Lose 2 Corruption.',
        outcomes: [{ text: 'It takes its due and blesses you, in its way.', effects: [{ kind: 'loseHp', amount: 12 }, { kind: 'corruption', amount: -2 }] }],
      },
      {
        label: 'Pay in memory',
        hint: 'Remove 2 random cards. Lose 1 Corruption.',
        outcomes: [{ text: 'You forget two things. You will never know which.', effects: [{ kind: 'removeRandomCard', count: 2 }, { kind: 'corruption', amount: -1 }] }],
      },
      {
        label: 'Pay in chosen memory',
        hint: 'Lose 3 HP. Remove 2 cards of your choice. Lose 1 Corruption.',
        outcomes: [{ text: 'It lets you choose what to forget. Choosing hurts more.', effects: [{ kind: 'loseHp', amount: 3 }, { kind: 'removeChosenCard', count: 2 }, { kind: 'corruption', amount: -1 }] }],
      },
      {
        label: 'Refuse',
        hint: 'Gain 2 Corruption.',
        outcomes: [{ text: 'It lets you pass. It marks you as it does.', effects: [{ kind: 'corruption', amount: 2 }] }],
      },
    ],
  },
  {
    id: 'sealed-armory',
    title: 'Sealed Armory',
    text: 'A vault door, half-melted. Through the gap, racks of relic-weapons glow in the dark.',
    options: [
      {
        label: 'Force it open',
        hint: 'Gain an uncommon and a rare card. Gain a curse.',
        outcomes: [
          {
            text: 'The door gives. So does something in you.',
            effects: [{ kind: 'addRandomCard', rarity: 'uncommon' }, { kind: 'addRandomCard', rarity: 'rare' }, { kind: 'addCurse' }],
          },
        ],
      },
      {
        label: 'Reach through the gap',
        hint: 'Lose 4 HP. Gain a common card.',
        outcomes: [{ text: 'Your arm comes back burned, holding something useful.', effects: [{ kind: 'loseHp', amount: 4 }, { kind: 'addRandomCard', rarity: 'common' }] }],
      },
      {
        label: 'Leave it sealed',
        hint: 'Nothing changes.',
        outcomes: [{ text: 'Some doors stay closed for a reason.', effects: [] }],
      },
    ],
  },
];

/** Join the event pool once the Awakening reaches stage 1 ("Murmur"). */
export const AWAKENING_EVENTS: EventDef[] = [
  {
    id: 'sleepers-pulse',
    title: "The Sleeper's Pulse",
    text: 'A seam in the floor throbs, warm and slow. Something enormous is dreaming beneath your feet.',
    minAwakening: 1,
    options: [
      {
        label: 'Press your ear to it',
        hint: 'Lose 8 HP. Gain a rare card.',
        outcomes: [{ text: 'It dreams in shapes you can almost hold. One comes away in your hands. So does blood, from your ear.', effects: [{ kind: 'loseHp', amount: 8 }, { kind: 'addRandomCard', rarity: 'rare' }] }],
      },
      {
        label: 'Drive a shard into it',
        hint: 'Gain a relic. Gain 2 Corruption.',
        outcomes: [{ text: 'The seam bleeds light and spits something out. Far below, the pulse quickens.', effects: [{ kind: 'gainRelic' }, { kind: 'corruption', amount: 2 }] }],
      },
      {
        label: 'Step softly away',
        hint: 'Lose 3 HP.',
        outcomes: [{ text: 'Not softly enough. The floor bucks once, hard, and you fall.', effects: [{ kind: 'loseHp', amount: 3 }] }],
      },
    ],
  },
  {
    id: 'dreamed-warden',
    title: 'A Dreamed Warden',
    text: 'A Warden flickers in the hall. It is you, as the Sleeper imagines you: taller, crueler, wrong.',
    minAwakening: 1,
    options: [
      {
        label: 'Let it teach you',
        hint: 'Gain 2 uncommon cards. Gain a curse.',
        outcomes: [
          {
            text: 'It shows you how it would fight. You learn. You also learn how it would live, and that stays.',
            effects: [{ kind: 'addRandomCard', rarity: 'uncommon' }, { kind: 'addRandomCard', rarity: 'uncommon' }, { kind: 'addCurse' }],
          },
        ],
      },
      {
        label: 'Trade places for a moment',
        hint: 'Lose a random relic. Heal 15 HP. Gain 6 max HP.',
        outcomes: [{ text: 'For one breath you are the dream. You come back larger, and missing something.', effects: [{ kind: 'loseRandomRelic' }, { kind: 'heal', amount: 15 }, { kind: 'maxHp', amount: 6 }] }],
      },
      {
        label: 'Look away',
        hint: 'Gain 1 Corruption.',
        outcomes: [{ text: 'It is still there when you look back. It is always there now.', effects: [{ kind: 'corruption', amount: 1 }] }],
      },
    ],
  },
  {
    id: 'breathing-door',
    title: 'The Door That Breathes',
    text: 'A door in the wall exhales as you near it. Behind it: warm dark, and the sound of slow lungs.',
    minAwakening: 1,
    options: [
      {
        label: 'Step through',
        hint: 'A gamble: a rare card and healing, or wounds and a curse.',
        outcomes: [
          { weight: 1, text: 'The dark is kind, this once. It gives you something and lets you go.', effects: [{ kind: 'addRandomCard', rarity: 'rare' }, { kind: 'heal', amount: 10 }] },
          { weight: 1, text: 'The lungs draw in, and you with them. You claw your way back out, changed.', effects: [{ kind: 'loseHp', amount: 12 }, { kind: 'addCurse' }] },
        ],
      },
      {
        label: 'Wedge it shut',
        hint: 'Lose 8 HP. Remove a card of your choice.',
        outcomes: [{ text: 'You jam something of yours into the gap. It holds. You do not get it back.', effects: [{ kind: 'loseHp', amount: 8 }, { kind: 'removeChosenCard', count: 1 }] }],
      },
      {
        label: 'Leave it breathing',
        hint: 'Nothing changes.',
        outcomes: [{ text: 'It breathes slower as you walk away. As if it has time.', effects: [] }],
      },
    ],
  },
];
