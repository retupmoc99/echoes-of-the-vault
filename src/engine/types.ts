/**
 * Core engine types.
 *
 * Content definitions (CardDef, EnemyDef, …) describe *what exists*.
 * State types (CombatState, …) describe *what is happening right now* and
 * must stay plain JSON so they can be saved after every action.
 */
import type { IdleContent } from './idleTypes';
import type { RngState } from './rng';

export * from './idleTypes';

// ───────────────────────────── Shared ids ─────────────────────────────

export type StatusId = 'fracture' | 'bleed' | 'weakened' | 'exposed';

/** Card type decides the accent colour and which triggers react to it. */
export type CardType = 'strike' | 'ward' | 'overload' | 'rite' | 'curse';

/** Synergy family, used for reward weighting and the card library. */
export type Archetype = 'fracture' | 'ward' | 'overload' | 'bleed';

export type Rarity = 'starter' | 'common' | 'uncommon' | 'rare' | 'curse';

// ───────────────────────────── Effects ─────────────────────────────

/**
 * A number, or a number computed from the current situation.
 * Lets cards like "Deal 3 per Fracture" stay pure data.
 */
export type Amount =
  | number
  | { per: 'selfStatus' | 'targetStatus'; status: StatusId; times: number; plus?: number }
  | { per: 'selfWard' | 'overloadsThisTurn'; times: number; plus?: number };

/**
 * Targets are relative to whoever is acting:
 * - self:    the card player / the acting enemy
 * - target:  the chosen enemy (for the player) / the player (for an enemy)
 * - allFoes: every living opponent
 */
export type EffectTarget = 'self' | 'target' | 'allFoes';

export type Condition =
  | { kind: 'overloadedThisTurn' }
  | { kind: 'selfStatusAtLeast'; status: StatusId; n: number }
  | { kind: 'targetHasStatus'; status: StatusId };

export type Effect =
  | { kind: 'damage'; amount: Amount; target?: 'target' | 'allFoes'; hits?: number }
  | { kind: 'ward'; amount: Amount }
  | { kind: 'applyStatus'; status: StatusId; amount: Amount; target: EffectTarget }
  | { kind: 'removeStatus'; status: StatusId; target: EffectTarget }
  | { kind: 'loseHp'; amount: number }
  // Player-only effects (ignored when an enemy uses them):
  | { kind: 'gainResonance'; amount: number }
  | { kind: 'draw'; amount: number }
  | { kind: 'overloadRelic'; which: 'random' | 'all' }
  | { kind: 'clearStrain' }
  | { kind: 'retainWard' }
  | { kind: 'clearWard' }
  | { kind: 'if'; cond: Condition; then: Effect[]; else?: Effect[] };

/** Something that reacts to combat events (used by relics; card "powers" later). */
export interface Trigger {
  on: 'combatStart' | 'turnStart' | 'turnEnd' | 'cardPlayed' | 'gainedStatus';
  /** For cardPlayed: only react to this card type. */
  cardType?: CardType;
  /** For gainedStatus: only react to this status. */
  status?: StatusId;
  effects: Effect[];
}

// ───────────────────────────── Content ─────────────────────────────

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  rarity: Rarity;
  archetype?: Archetype;
  effects: Effect[];
  /** Removed for the rest of the fight after being played. */
  fade?: boolean;
  unplayable?: boolean;
  /** Runs if the card is still in hand when you end your turn (curses). */
  inHandAtTurnEnd?: Effect[];
  /** Hand-written rules text. If omitted, text is generated from effects. */
  text?: string;
  flavor: string;
  /** Optional art, relative to public/assets/. Code-drawn fallback otherwise. */
  image?: string;
}

export interface RelicDef {
  id: string;
  name: string;
  rarity: Rarity;
  /** Always-on behaviour. */
  passive?: Trigger[];
  /** What happens when an Overload card activates this relic. */
  overload?: Effect[];
  /** Overloads before it cracks. Defaults to BALANCE.relic.defaultMaxStrain. */
  maxStrain?: number;
  /** Tainted relics add this much Corruption when taken. */
  corruption?: number;
  flavor: string;
  image?: string;
}

export interface EnemyMove {
  name: string;
  effects: Effect[];
}

export type IntentPattern =
  /** Repeats moves in order. */
  | { kind: 'cycle'; order: string[]; opening?: string }
  /** Random by weight. noRepeat forbids the same move twice in a row. */
  | { kind: 'weighted'; weights: Record<string, number>; noRepeat?: boolean; opening?: string };

/** Parameters for the code-drawn glowing sigil. Each enemy gets its own. */
export interface SigilSpec {
  /** Sides of the outer polygon (3 = triangle, 0 = circle). */
  sides: number;
  /** Sides of the inner shape. */
  innerSides: number;
  /** Number of orbit rings. */
  rings: number;
  hue: number;
  /** Seconds per rotation; negative spins the other way. */
  spin: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  tier: 'normal' | 'elite' | 'boss';
  hp: [min: number, max: number];
  moves: Record<string, EnemyMove>;
  pattern: IntentPattern;
  sigil: SigilSpec;
  flavor: string;
  image?: string;
}

export interface EncounterDef {
  id: string;
  tier: 'normal' | 'elite' | 'boss';
  /** Normal fights only: early rows draw from 'early', deeper rows from 'late'. */
  stage?: 'early' | 'late';
  enemies: string[];
}

/**
 * A playable Warden. New classes are new data: their own deck, pool and
 * relics. A class with a genuinely new mechanic adds new Effect kinds.
 */
export interface WardenClassDef {
  id: string;
  name: string;
  maxHp: number;
  starterDeck: string[];
  starterRelics: string[];
  /** Cards that can appear as rewards for this class. */
  cardPool: string[];
  /** Pool cards that stay out of rewards until an Echo Researches them. */
  lockedCards: string[];
  relicPool: string[];
  /** Starting decks. The first is the default; others need an Outpost unlock. */
  kits: StarterKit[];
  flavor: string;
}

export interface StarterKit {
  id: string;
  name: string;
  description: string;
  deck: string[];
  /** Outpost unlock id required to pick this kit. */
  unlock?: string;
}

/** Changes to the run itself (events use these). */
export type RunEffect =
  | { kind: 'loseHp'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'maxHp'; amount: number }
  | { kind: 'corruption'; amount: number }
  | { kind: 'addCard'; cardId: string }
  | { kind: 'addRandomCard'; rarity: 'common' | 'uncommon' | 'rare' }
  | { kind: 'addCurse' }
  | { kind: 'removeRandomCard'; count: number }
  | { kind: 'gainRelic' }
  | { kind: 'loseRandomRelic' };

export interface EventOutcome {
  /** Relative odds when an option has several outcomes. */
  weight?: number;
  /** What the player reads after choosing. */
  text: string;
  effects: RunEffect[];
}

export interface EventOption {
  label: string;
  /** Short cost/benefit line under the label, e.g. "Lose 10 HP. Gain a rare card." */
  hint: string;
  outcomes: EventOutcome[];
}

export interface EventDef {
  id: string;
  title: string;
  text: string;
  options: EventOption[];
  /** Earliest map row this event may appear on. */
  minRow?: number;
  image?: string;
}

/**
 * A global modifier rolled once per loop. Only these knobs exist, so new
 * Shifts are pure data as long as they use them.
 */
export interface VaultShiftMods {
  /** enemyHpMult multiplies, enemyDamageBonus adds, other fields replace. */
  combat?: Partial<CombatModifiers>;
  /** Multipliers on map node weights. */
  nodeWeights?: Partial<Record<'fight' | 'event' | 'elite' | 'cache' | 'shrine', number>>;
  shrineHealMult?: number;
  rewardChoicesBonus?: number;
  startCorruption?: number;
}

export interface VaultShiftDef {
  id: string;
  name: string;
  /** Rules summary shown to the player. */
  text: string;
  flavor: string;
  /** Roll weight. 0 = never rolled (used for special/migrated loops). */
  weight: number;
  mods: VaultShiftMods;
  image?: string;
}

/** All content, injected into the engine (so tests can use their own). */
export interface Content {
  classes: Record<string, WardenClassDef>;
  cards: Record<string, CardDef>;
  relics: Record<string, RelicDef>;
  enemies: Record<string, EnemyDef>;
  encounters: Record<string, EncounterDef>;
  events: Record<string, EventDef>;
  vaultShifts: Record<string, VaultShiftDef>;
  idle: IdleContent;
}

// ───────────────────────────── Combat state ─────────────────────────────

export type Statuses = Partial<Record<StatusId, number>>;

export interface Combatant {
  /** 'player' or an enemy uid like 'e0'. */
  id: string;
  hp: number;
  maxHp: number;
  ward: number;
  statuses: Statuses;
}

export interface PlayerState extends Combatant {
  /** Set by Bastion-type cards: Ward is not cleared at turn start. */
  retainWard: boolean;
}

export interface EnemyState extends Combatant {
  defId: string;
  /** Move id the enemy will use on its next turn (shown as its intent). */
  intent: string;
  history: string[];
}

export interface RelicState {
  relicId: string;
  strain: number;
  cracked: boolean;
}

export interface CardInstance {
  uid: string;
  cardId: string;
}

/**
 * Per-fight rule values. Defaults come from BALANCE; Corruption and the
 * loop's Vault Shift adjust them when the fight starts.
 */
export interface CombatModifiers {
  enemyHpMult: number;
  enemyDamageBonus: number;
  bleedDecay: number;
  fractureDamagePerStack: number;
  fractureSelfDamageRatio: number;
  maxStrainBonus: number;
}

export interface CombatState {
  turn: number;
  /** 'enemy' only exists while the enemy turn is being resolved. */
  phase: 'player' | 'enemy' | 'won' | 'lost';
  resonance: number;
  player: PlayerState;
  enemies: EnemyState[];
  relics: RelicState[];
  piles: {
    draw: CardInstance[];
    hand: CardInstance[];
    discard: CardInstance[];
    faded: CardInstance[];
  };
  overloadsThisTurn: number;
  rng: RngState;
  nextUid: number;
  modifiers: CombatModifiers;
}

export interface CombatSetup {
  seed: string;
  deck: string[];
  hp: number;
  maxHp: number;
  relics: string[];
  encounterId: string;
  modifiers?: Partial<CombatModifiers>;
}

// ───────────────────────────── Actions & events ─────────────────────────────

export type CombatAction =
  | { type: 'playCard'; uid: string; targetId?: string }
  | { type: 'endTurn' };

/**
 * What happened, in order. The UI turns these into animations, haptics and
 * floating numbers. The engine never touches the screen itself.
 */
export type CombatEvent =
  | { type: 'turnStart'; turn: number }
  | { type: 'cardPlayed'; uid: string; cardId: string }
  | { type: 'draw'; count: number }
  | { type: 'shuffle' }
  | { type: 'attack'; sourceId: string; targetId: string; amount: number; blocked: number }
  | { type: 'hpLoss'; targetId: string; amount: number; cause: 'bleed' | 'fracture' | 'effect' }
  | { type: 'ward'; targetId: string; amount: number }
  | { type: 'status'; targetId: string; status: StatusId; delta: number }
  | { type: 'enemyMove'; enemyId: string; moveId: string; moveName: string }
  | { type: 'relicOverload'; relicId: string; strain: number }
  | { type: 'relicCracked'; relicId: string }
  | { type: 'overloadFizzled' }
  | { type: 'death'; targetId: string }
  | { type: 'victory' }
  | { type: 'defeat' };

export interface StepResult {
  state: CombatState;
  events: CombatEvent[];
  /** Set when the action was refused; state is then unchanged. */
  error?: string;
}

// ───────────────────────────── Map & run ─────────────────────────────

export type NodeType = 'fight' | 'elite' | 'event' | 'cache' | 'shrine' | 'boss';

export interface MapNode {
  id: string;
  row: number;
  col: number;
  /** Horizontal position 0..1, with a little jitter so maps look hand-drawn. */
  x: number;
  type: NodeType;
  /** Ids of nodes in the next row this node leads to. */
  next: string[];
}

export interface MapGraph {
  /** Number of rows before the boss row. */
  rows: number;
  nodes: Record<string, MapNode>;
  startIds: string[];
  bossId: string;
}

/** What the player is doing inside the current node. */
export type NodeState =
  | { kind: 'combat'; nodeId: string; encounterId: string; hpBefore: number }
  | { kind: 'shrine'; nodeId: string }
  | { kind: 'cache'; nodeId: string; relicIds: string[] }
  | { kind: 'event'; nodeId: string; eventId: string; resolved: { optionIndex: number; text: string } | null }
  | {
      kind: 'reward';
      nodeId: string;
      cards: string[];
      /** A rare card on offer at the price of Corruption. */
      tainted: string | null;
      /** Elites also drop a relic. */
      relicId: string | null;
      cardTaken: boolean;
      relicTaken: boolean;
    };

export interface RunStats {
  fightsWon: number;
  elitesWon: number;
  bossWon: boolean;
  damageTaken: number;
  turns: number;
  cardsRemoved: number;
  abandoned: boolean;
  peakCorruption: number;
  cursesGained: number;
}

export interface RunState {
  seed: string;
  classId: string;
  /** Always 1 for now. Hook for deeper multi-floor runs. */
  floor: number;
  rng: RngState;
  hp: number;
  maxHp: number;
  deck: string[];
  relics: string[];
  map: MapGraph;
  /** Node the player stands on; null before the first step. */
  position: string | null;
  visited: string[];
  phase: 'map' | 'node' | 'ended';
  node: NodeState | null;
  combat: CombatState | null;
  seenEncounters: string[];
  seenEvents: string[];
  /** Run-wide meter. Thresholds strengthen enemies, add curses and improve loot. */
  corruption: number;
  vaultShiftId: string;
  /** Cards that can appear as rewards this loop (class pool minus unresearched cards). */
  cardPool: string[];
  /** Options granted by Outpost unlocks, fixed for the whole loop. */
  options: RunOptions;
  stats: RunStats;
  result: 'victory' | 'death' | null;
}

export interface RunOptions {
  /** Shrines offer "Purge": lower Corruption. */
  shrinePurge: boolean;
  /** Relics offered by a Relic Cache. */
  cacheChoices: number;
  /** Times card rewards can be rerolled this loop. */
  rewardRerolls: number;
}

export interface RunSetup {
  seed: string;
  classId: string;
  /** Forced Shift (Scout reveals it in advance). Rolled from the seed otherwise. */
  vaultShiftId?: string;
  /** Starter kit; defaults to the class's first kit. */
  kitId?: string;
  /** Researched cards (from the class's locked list) that may appear this loop. */
  unlockedCards?: string[];
  options?: Partial<RunOptions>;
}

export type RunAction =
  | { type: 'chooseNode'; nodeId: string }
  | { type: 'combat'; action: CombatAction }
  | { type: 'shrineRest' }
  | { type: 'shrineRemove'; deckIndex: number }
  | { type: 'shrinePurge' }
  | { type: 'rerollReward' }
  /** Cache: which of the offered relics. Reward: the elite relic (index ignored). */
  | { type: 'takeRelic'; index?: number }
  | { type: 'pickCard'; choice: number | 'tainted' }
  | { type: 'chooseOption'; index: number }
  /** Leave the current node (after a fight, a cache, an event, a reward). */
  | { type: 'leave' }
  | { type: 'abandon' };

export interface RunStepResult {
  run: RunState;
  /** Combat events to animate, if the action touched a fight. */
  events: CombatEvent[];
  /** Things worth telling the player (a curse took root, a threshold crossed). */
  notices: string[];
  error?: string;
}
