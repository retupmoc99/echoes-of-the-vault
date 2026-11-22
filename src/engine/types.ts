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

export type StatusId = 'fracture' | 'bleed' | 'weakened' | 'exposed' | 'paradox';

/** Card type decides the accent colour and which triggers react to it. */
export type CardType = 'strike' | 'ward' | 'overload' | 'rite' | 'temporal' | 'curse';

/** Synergy family, used for reward weighting and the card library. */
export type Archetype = 'fracture' | 'ward' | 'overload' | 'bleed' | 'delay' | 'echo' | 'unwinding' | 'chorus' | 'communion' | 'remembrance';

export type Rarity = 'starter' | 'common' | 'uncommon' | 'rare' | 'curse';

// ───────────────────────────── Effects ─────────────────────────────

/**
 * A number, or a number computed from the current situation.
 * Lets cards like "Deal 3 per Fracture" stay pure data.
 */
export type Amount =
  | number
  | { per: 'selfStatus' | 'targetStatus'; status: StatusId; times: number; plus?: number }
  | { per: 'selfWard' | 'overloadsThisTurn' | 'timeline'; times: number; plus?: number }
  /** Allies on the field, allies fallen this fight, or the cost of each ally's next card (Echo-Caller). */
  | { per: 'allies' | 'alliesFallen' | 'allyTopCost'; times: number; plus?: number };

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
  | { kind: 'targetHasStatus'; status: StatusId }
  | { kind: 'allyFellThisFight' };

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
  /** Queue effects on the timeline; they resolve after `turns` of your turns. */
  | { kind: 'delay'; turns: number; effects: Effect[] }
  /** Bring every delayed effect `turns` closer (those reaching 0 resolve now). */
  | { kind: 'hasten'; turns: number }
  /** Return the most recent `count` cards from the discard pile to your hand. */
  | { kind: 'rewind'; count: number }
  /** Return a card you choose from your discard pile (default: the last one); `free` makes it cost 0 this turn. */
  | { kind: 'recall'; free?: boolean }
  // Echo-Caller: allies. "Newest" is the most recently Called living ally.
  /** Bring Echoes from your Chorus into the fight as allies (a Nameless one if none are left). */
  | { kind: 'call'; count: number }
  /** Allies play their next card now (at their usual strength). */
  | { kind: 'allyAct'; who: 'newest' | 'all' }
  /** Each living ally resolves these effects itself (e.g. gains Ward). */
  | { kind: 'allies'; effects: Effect[] }
  /** The newest ally resolves these effects itself. */
  | { kind: 'newestAlly'; effects: Effect[] }
  /** The newest ally Guards: enemy attacks aimed at you hit it instead, until your next turn. */
  | { kind: 'guard' }
  /** Allies fade; each deals its remaining HP (or a fixed amount) to all foes. */
  | { kind: 'releaseAlly'; who: 'newest' | 'all'; damage: 'hp' | number }
  /** Play the top card(s) of the newest ally's deck yourself, at full strength. */
  | { kind: 'playAllyTop'; count: number }
  /** For the rest of the fight: allies act more often, and/or lose HP each time they act. */
  | { kind: 'empowerAllies'; acts?: number; hpLoss?: number }
  /** Enemies only: put a card into the player's discard pile (Rot Lantern's Smoke). */
  | { kind: 'addToDiscard'; cardId: string; count?: number }
  | { kind: 'if'; cond: Condition; then: Effect[]; else?: Effect[] };

/** Something that reacts to combat events (used by relics; card "powers" later). */
export interface Trigger {
  on: 'combatStart' | 'turnStart' | 'turnEnd' | 'cardPlayed' | 'gainedStatus' | 'delayFired' | 'allyCalled' | 'allyFell';
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
  /** After it is played, a fading copy returns to your hand next turn. */
  echo?: boolean;
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
  /** Found at the bottom of the Well: joins this Warden's relic pool once floor 2 has been escaped. */
  deepFor?: string;
  /** Hand-written rules text for effects outside combat (shown before any passive text). */
  text?: string;
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
  /** Later phases, entered as HP falls (in order). */
  phases?: EnemyPhase[];
  /**
   * Opens by replaying the strongest move of each enemy you've fought this
   * loop (the Sleeper). Falls back to its own moves if there are none.
   */
  memories?: boolean;
  /** When another enemy in the fight dies, this one gains Ward and/or hits harder (Hollow Pilgrims). */
  onKinDeath?: { ward?: number; damageBonus?: number };
}

/** A boss phase: new moves and pattern once HP falls far enough. */
export interface EnemyPhase {
  /** Entered when HP falls to or below this share of max HP. */
  atHpRatio: number;
  /** Shown instead of the enemy's name during this phase. */
  name?: string;
  /** Moves added in this phase (earlier moves stay available). */
  moves?: Record<string, EnemyMove>;
  pattern: IntentPattern;
  /** Resolved once, by the enemy, on entering the phase. */
  onEnter?: Effect[];
  /** Only exists at this Awakening stage or higher. */
  minAwakening?: number;
}

export interface EncounterDef {
  id: string;
  tier: 'normal' | 'elite' | 'boss';
  /** Normal fights only: early rows draw from 'early', deeper rows from 'late'. */
  stage?: 'early' | 'late';
  enemies: string[];
  /** Only used once the Awakening has reached this stage. */
  minAwakening?: number;
  /** When usable, this encounter replaces that one (Waking variants). */
  replaces?: string;
  /** The floor it belongs to (default 1). */
  floor?: number;
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
  /** Outpost unlock needed to play this class (none = available from the start). */
  unlock?: string;
  /** One line on how the class plays, for the class picker. */
  summary: string;
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
  /** The player picks which cards go (after the event's text shows). */
  | { kind: 'removeChosenCard'; count: number }
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
  /** Only appears once the Awakening has reached this stage. */
  minAwakening?: number;
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
  /** Only rolled once the Awakening has reached this stage. */
  minAwakening?: number;
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

/**
 * A Daily Descent Omen: one rule that bends the whole loop. Every field is
 * optional; each is applied where the matching rule already lives.
 */
export interface OmenDef {
  id: string;
  name: string;
  /** The rule, in one line. */
  text: string;
  flavor: string;
  mods: OmenMods;
}

export interface OmenMods {
  maxHpMult?: number;
  /** Extra cards on every card reward. */
  rewardChoicesBonus?: number;
  /** No card rewards at all (elites still drop a relic). */
  noCardRewards?: boolean;
  /** HP healed after every fight won. */
  healAfterFight?: number;
  /** Random class relics (never tainted) to start with. */
  startRelics?: number;
  startCorruption?: number;
  /** Random rare cards from the class pool added to the starting deck. */
  startRares?: number;
  /** Extra map rows before the boss. */
  extraRows?: number;
  /** Multipliers on middle-row node odds (0 removes a node type). */
  nodeWeights?: Partial<Record<'fight' | 'event' | 'elite' | 'cache' | 'shrine', number>>;
  shrineHealMult?: number;
  /** An enemy added to every normal fight. */
  extraEnemy?: string;
  combat?: Partial<CombatModifiers>;
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
  /** Daily Descent Omens (optional so test content can skip them). */
  omens?: Record<string, OmenDef>;
  idle: IdleContent;
  awakening: AwakeningContent;
}

/** Text and affixes for the Awakening. Numbers live in BALANCE.awakening. */
export interface AwakeningContent {
  /** Index = stage (0 = Dormant). */
  stages: AwakeningStageDef[];
  affixes: Record<string, EliteAffixDef>;
}

export interface AwakeningStageDef {
  name: string;
  /** What gets harder at this stage (empty for Dormant). */
  danger: string;
  /** What gets better at this stage. */
  reward: string;
  /** Lore fragment granted the first time this stage is reached. */
  loreId?: string;
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

/** An Echo fighting beside you (Echo-Caller). It plays its own deck. */
export interface AllyState extends Combatant {
  /** The Outpost Echo it came from; null for a Nameless Echo. */
  echoId: string | null;
  name: string;
  traitId: string;
  draw: string[];
  discard: string[];
  /** Taking enemy attacks aimed at you, until your next turn. */
  guard: boolean;
  /** Fleeting: turns left before it fades. */
  turnsLeft?: number;
}

/** One of your Outpost Echoes, as the loop knows it (Echo-Caller's Chorus). */
export interface ChorusMember {
  echoId: string;
  name: string;
  traitId: string;
  deck: string[];
  /** HP as an ally (from its depth and trait). */
  maxHp: number;
  /** Its stability when the loop began (to warn before a Call drains it). */
  stability: number;
  /** Times Called and times fallen so far this loop; they cost stability when the loop closes. */
  calls: number;
  falls: number;
}

export interface EnemyState extends Combatant {
  defId: string;
  /** Elite affix from the Awakening (stage 3+), if any. */
  affix?: string;
  /** Index into its def's phases, once it has entered one. */
  phase?: number;
  /** Remembered moves (the Sleeper), keyed like moves. */
  memoryMoves?: Record<string, EnemyMove>;
  /** Extra damage on every attack (the Frenzied affix). */
  damageBonus?: number;
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
  /** An Echo copy: it fades when played, or at the end of the turn if not. */
  ephemeral?: boolean;
  /** Costs 0 until it leaves your hand (Rewrite). */
  freeThisTurn?: boolean;
}

/** An effect waiting on the timeline (from a Delay card). */
export interface TimelineEntry {
  id: string;
  /** Your turns until it resolves (it resolves when this reaches 0). */
  turnsLeft: number;
  effects: Effect[];
  /** The card that queued it (for display). */
  sourceCardId: string;
  /** Who it was aimed at; falls back to the first living enemy. */
  targetId?: string;
  /** Set when an enemy queued it: it ticks on that enemy's turns and fizzles if it dies. */
  sourceId?: string;
  /** Display name for enemy entries (the move's name). */
  label?: string;
}

/**
 * Per-fight rule values. Defaults come from BALANCE; Corruption and the
 * loop's Vault Shift adjust them when the fight starts.
 */
export interface CombatModifiers {
  /** Awakening stage of the loop (gates boss phases). Missing in older saves: treat as 0. */
  awakeningStage?: number;
  enemyHpMult: number;
  enemyDamageBonus: number;
  bleedDecay: number;
  fractureDamagePerStack: number;
  fractureSelfDamageRatio: number;
  maxStrainBonus: number;
  /** Omens (all optional; missing = no change). */
  drawBonus?: number;
  resonanceBonus?: number;
  /** Every card costs this much (unplayable cards stay unplayable; Rewrite still makes a card free). */
  costOverride?: number;
  /** Bleed applied by every attack that gets past Ward, on both sides. */
  bleedOnAttack?: number;
  /** Multiplier on the Ward you (not enemies or allies) gain. */
  playerWardMult?: number;
  /** Floor 2's Weight: HP you lose at the start of each turn you begin with no Ward. */
  weightDamage?: number;
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
  /** Delayed effects waiting to resolve. */
  timeline: TimelineEntry[];
  /** Echo copies that return to hand at the start of your next turn. */
  echoQueue: CardInstance[];
  /** Echo-Caller: allies on the field (fallen ones stay with 0 HP). */
  allies: AllyState[];
  /** The loop's Chorus, as it stood when the fight began. */
  chorus: ChorusMember[];
  /** Echo ids Called this fight ('nameless' for Nameless Echoes). */
  called: string[];
  /** Echo ids of allies that fell this fight. */
  fallen: string[];
  /** Times each ally acts per turn, and HP it loses each time (empowerAllies). */
  allyActs: number;
  allyHpLoss: number;
  /** The enemy you last aimed at: allies aim there too. */
  focusId?: string;
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
  /** Elite affix to apply to every enemy in the fight (Awakening stage 3+). */
  affix?: EliteAffixDef;
  /** Enemy ids fought earlier this loop (for enemies with `memories`). */
  memories?: string[];
  /** The loop's Chorus (Echo-Caller). */
  chorus?: ChorusMember[];
  /** Enemies added to the encounter (Omen: Crowded Halls). */
  extraEnemies?: string[];
}

/** An Awakening elite affix: pure numbers, applied when the fight starts. */
export interface EliteAffixDef {
  id: string;
  name: string;
  description: string;
  hpMult?: number;
  damageBonus?: number;
  ward?: number;
}

// ───────────────────────────── Actions & events ─────────────────────────────

export type CombatAction =
  /** `pickUid`: the discard-pile card chosen for a Recall effect (Rewrite). */
  | { type: 'playCard'; uid: string; targetId?: string; pickUid?: string }
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
  | { type: 'hpLoss'; targetId: string; amount: number; cause: HpLossCause }
  | { type: 'ward'; targetId: string; amount: number }
  | { type: 'status'; targetId: string; status: StatusId; delta: number }
  | { type: 'enemyMove'; enemyId: string; moveId: string; moveName: string }
  | { type: 'relicOverload'; relicId: string; strain: number }
  | { type: 'relicCracked'; relicId: string }
  | { type: 'overloadFizzled' }
  | { type: 'delayQueued'; entryId: string; turns: number }
  | { type: 'delayFired'; entryId: string; targetId?: string }
  | { type: 'echoReturned'; count: number }
  | { type: 'rewound'; count: number }
  | { type: 'paradoxSnap'; damage: number }
  | { type: 'phaseChange'; enemyId: string; name: string }
  | { type: 'allyCalled'; allyId: string; name: string }
  | { type: 'allyActed'; allyId: string; cardId: string }
  | { type: 'allyFell'; allyId: string }
  | { type: 'death'; targetId: string }
  | { type: 'victory' }
  | { type: 'defeat' };

export type HpLossCause = 'bleed' | 'fracture' | 'paradox' | 'effect' | 'weight';

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
  | {
      kind: 'event';
      nodeId: string;
      eventId: string;
      resolved: { optionIndex: number; text: string } | null;
      /** Cards the player still has to choose to remove (removeChosenCard). */
      toRemove?: number;
    }
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
  /** The Sleeper was unmade this loop (even if the loop then died on floor 2). */
  sleeperUnmade?: boolean;
  /** Floor 2's boss was beaten. */
  deepBossWon?: boolean;
}

export interface RunState {
  seed: string;
  classId: string;
  /** Daily Descent: the day (YYYY-MM-DD) this loop belongs to. */
  daily?: string;
  /** Daily Descent Omen in force. */
  omenId?: string;
  /** Deeper Vault: depth reached on earlier floors (added to this floor's row), and the escape bonus held while descending. */
  depthBase?: number;
  heldShards?: number;
  /** Relics rewards may offer on top of the class pool (the Well's relics). */
  extraRelicPool?: string[];
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
  /** 'stairs': the floor-1 boss is beaten; Escape or Descend. */
  phase: 'map' | 'node' | 'stairs' | 'ended';
  node: NodeState | null;
  combat: CombatState | null;
  seenEncounters: string[];
  seenEvents: string[];
  /** Run-wide meter. Thresholds strengthen enemies, add curses and improve loot. */
  corruption: number;
  vaultShiftId: string;
  /** Awakening stage this loop runs at (fixed for the whole loop). */
  awakeningStage: number;
  /** Awakening cycle (1 until the Sleeper is first unmade). Raises enemy HP. */
  awakeningCycle: number;
  /** Your Outpost Echoes, as allies to Call (Echo-Caller). */
  chorus: ChorusMember[];
  /** Shards found this loop (elites at Awakening stage 3+), banked when it closes. */
  shardsFound: number;
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
  /** The Descend door is offered after the floor-1 boss (after your first escape). */
  stairs?: boolean;
}

export interface RunSetup {
  seed: string;
  classId: string;
  /** Awakening stage this loop runs at (0 = Dormant). */
  awakeningStage?: number;
  awakeningCycle?: number;
  /** Relics added to the starting relics (the Sleeper's Eye, after a cycle). */
  extraRelics?: string[];
  /** Outpost Echoes the loop can Call (Echo-Caller). */
  chorus?: ChorusMember[];
  /** Forced Shift (Scout reveals it in advance). Rolled from the seed otherwise. */
  vaultShiftId?: string;
  /** Starter kit; defaults to the class's first kit. */
  kitId?: string;
  /** Researched cards (from the class's locked list) that may appear this loop. */
  unlockedCards?: string[];
  options?: Partial<RunOptions>;
  /** Daily Descent: the day, and its Omen. */
  daily?: string;
  omenId?: string;
  /** Relics added to the class's reward pool (the Well's relics). */
  extraRelicPool?: string[];
}

export type RunAction =
  | { type: 'chooseNode'; nodeId: string }
  | { type: 'combat'; action: CombatAction }
  | { type: 'shrineRest' }
  | { type: 'shrineRemove'; deckIndex: number }
  | { type: 'shrinePurge' }
  /** Last-row Shrines: open a sealed relic cache instead of resting. */
  | { type: 'shrineSearch' }
  /** An event asked you to remove cards of your choice. */
  | { type: 'removeCard'; deckIndex: number }
  | { type: 'rerollReward' }
  /** Cache: which of the offered relics. Reward: the elite relic (index ignored). */
  | { type: 'takeRelic'; index?: number }
  | { type: 'pickCard'; choice: number | 'tainted' }
  | { type: 'chooseOption'; index: number }
  /** Leave the current node (after a fight, a cache, an event, a reward). */
  | { type: 'leave' }
  /** At the stairs: end the loop as a victory, or go down to floor 2. */
  | { type: 'escape' }
  | { type: 'descend' }
  | { type: 'abandon' };

export interface RunStepResult {
  run: RunState;
  /** Combat events to animate, if the action touched a fight. */
  events: CombatEvent[];
  /** Things worth telling the player (a curse took root, a threshold crossed). */
  notices: string[];
  error?: string;
}
