import type { EncounterDef, EnemyDef } from '../../engine/types';

export const ENEMIES: EnemyDef[] = [
  {
    id: 'hollow-sentinel',
    name: 'Hollow Sentinel',
    tier: 'normal',
    hp: [38, 42],
    moves: {
      sunder: { name: 'Sundering Arm', effects: [{ kind: 'damage', amount: 8 }] },
      seal: {
        name: 'Seal',
        effects: [
          { kind: 'ward', amount: 7 },
          { kind: 'damage', amount: 4 },
        ],
      },
    },
    pattern: { kind: 'cycle', order: ['sunder', 'seal'] },
    sigil: { sides: 4, innerSides: 4, rings: 1, hue: 200, spin: 24 },
    flavor: 'Still guarding a door that no longer exists.',
  },
  {
    id: 'bleeding-lattice',
    name: 'Bleeding Lattice',
    tier: 'normal',
    hp: [30, 34],
    moves: {
      lacerate: {
        name: 'Lacerate',
        effects: [
          { kind: 'damage', amount: 4 },
          { kind: 'applyStatus', status: 'bleed', amount: 2, target: 'target' },
        ],
      },
      fold: { name: 'Fold Inward', effects: [{ kind: 'ward', amount: 8 }] },
    },
    pattern: { kind: 'weighted', weights: { lacerate: 2, fold: 1 }, noRepeat: true },
    sigil: { sides: 6, innerSides: 3, rings: 2, hue: 350, spin: -18 },
    flavor: 'A geometry that cuts whatever it touches.',
  },
  {
    id: 'mirror-wraith',
    name: 'Mirror Wraith',
    tier: 'normal',
    hp: [34, 38],
    moves: {
      gaze: {
        name: 'Unmaking Gaze',
        effects: [
          { kind: 'applyStatus', status: 'exposed', amount: 2, target: 'target' },
          { kind: 'damage', amount: 3 },
        ],
      },
      rend: { name: 'Rend', effects: [{ kind: 'damage', amount: 9 }] },
    },
    pattern: { kind: 'cycle', order: ['rend', 'gaze'], opening: 'gaze' },
    sigil: { sides: 3, innerSides: 0, rings: 1, hue: 265, spin: 30 },
    flavor: 'It wears your outline. Badly.',
  },
  {
    id: 'choir-shard',
    name: 'Choir Shard',
    tier: 'normal',
    hp: [18, 22],
    moves: {
      hum: {
        name: 'Dirge',
        effects: [
          { kind: 'applyStatus', status: 'weakened', amount: 1, target: 'target' },
          { kind: 'ward', amount: 4 },
        ],
      },
      shriek: { name: 'Shriek', effects: [{ kind: 'damage', amount: 5 }] },
    },
    pattern: { kind: 'weighted', weights: { hum: 1, shriek: 2 }, noRepeat: true },
    sigil: { sides: 5, innerSides: 5, rings: 0, hue: 170, spin: 12 },
    flavor: 'They sang the vault shut. They never stopped.',
  },

  // ─── Deeper normal enemies ───
  {
    id: 'rust-seraph',
    name: 'Rust Seraph',
    tier: 'normal',
    hp: [44, 48],
    moves: {
      wingblade: { name: 'Wingblade', effects: [{ kind: 'damage', amount: 5, hits: 2 }] },
      ascend: {
        name: 'Ascend',
        effects: [
          { kind: 'applyStatus', status: 'fracture', amount: 2, target: 'self' },
          { kind: 'ward', amount: 6 },
        ],
      },
    },
    pattern: { kind: 'cycle', order: ['wingblade', 'ascend', 'wingblade'] },
    sigil: { sides: 3, innerSides: 3, rings: 2, hue: 25, spin: 20 },
    flavor: 'It cracks itself open to burn brighter. So do you.',
  },
  {
    id: 'vein-crawler',
    name: 'Vein Crawler',
    tier: 'normal',
    hp: [40, 44],
    moves: {
      sap: { name: 'Sap', effects: [{ kind: 'applyStatus', status: 'bleed', amount: 4, target: 'target' }] },
      gnash: { name: 'Gnash', effects: [{ kind: 'damage', amount: 11 }] },
      burrow: { name: 'Burrow', effects: [{ kind: 'ward', amount: 10 }] },
    },
    pattern: { kind: 'weighted', weights: { sap: 2, gnash: 2, burrow: 1 }, noRepeat: true },
    sigil: { sides: 8, innerSides: 4, rings: 1, hue: 340, spin: -14 },
    flavor: 'It follows the old conduits. Now it follows yours.',
  },
  {
    id: 'ash-hound',
    name: 'Ash Hound',
    tier: 'normal',
    hp: [22, 26],
    moves: {
      bite: { name: 'Bite', effects: [{ kind: 'damage', amount: 6 }] },
      howl: {
        name: 'Howl',
        effects: [
          { kind: 'applyStatus', status: 'exposed', amount: 1, target: 'target' },
          { kind: 'ward', amount: 3 },
        ],
      },
    },
    pattern: { kind: 'weighted', weights: { bite: 2, howl: 1 }, noRepeat: true },
    sigil: { sides: 3, innerSides: 0, rings: 1, hue: 15, spin: -9 },
    flavor: 'Bred to hunt the vault’s makers. It settles for you.',
  },
  {
    id: 'tithe-engine',
    name: 'Tithe Engine',
    tier: 'normal',
    hp: [50, 54],
    moves: {
      gather: { name: 'Gather', effects: [{ kind: 'ward', amount: 12 }] },
      collect: { name: 'Collect', effects: [{ kind: 'damage', amount: 14 }] },
      grind: {
        name: 'Grind',
        effects: [
          { kind: 'damage', amount: 4 },
          { kind: 'applyStatus', status: 'weakened', amount: 2, target: 'target' },
        ],
      },
    },
    pattern: { kind: 'cycle', order: ['gather', 'collect', 'grind'] },
    sigil: { sides: 6, innerSides: 6, rings: 3, hue: 48, spin: 40 },
    flavor: 'It still takes its due. No one remembers what for.',
  },

  // ─── Elites ───
  {
    id: 'warden-unmade',
    name: 'Warden Unmade',
    tier: 'elite',
    hp: [74, 80],
    moves: {
      mark: {
        name: 'Mark the Weak',
        effects: [
          { kind: 'applyStatus', status: 'exposed', amount: 2, target: 'target' },
          { kind: 'applyStatus', status: 'weakened', amount: 1, target: 'target' },
        ],
      },
      execute: { name: 'Execute', effects: [{ kind: 'damage', amount: 16 }] },
      riposte: {
        name: 'Riposte',
        effects: [
          { kind: 'ward', amount: 10 },
          { kind: 'damage', amount: 6 },
        ],
      },
    },
    pattern: { kind: 'cycle', order: ['mark', 'execute', 'riposte'] },
    sigil: { sides: 4, innerSides: 8, rings: 2, hue: 210, spin: -26 },
    flavor: 'A Warden from an earlier loop. It forgot which side it was on.',
  },
  {
    id: 'lens-tyrant',
    name: 'Lens Tyrant',
    tier: 'elite',
    hp: [70, 76],
    moves: {
      focus: { name: 'Focus', effects: [{ kind: 'applyStatus', status: 'fracture', amount: 3, target: 'self' }] },
      beam: { name: 'Beam', effects: [{ kind: 'damage', amount: 6, hits: 2 }] },
      refract: {
        name: 'Refract',
        effects: [
          { kind: 'ward', amount: 12 },
          { kind: 'applyStatus', status: 'bleed', amount: 2, target: 'target' },
        ],
      },
    },
    pattern: { kind: 'cycle', order: ['focus', 'beam', 'refract'] },
    sigil: { sides: 0, innerSides: 6, rings: 3, hue: 300, spin: 16 },
    flavor: 'It grows brighter as it breaks. Outlast it, or burn with it.',
  },

  // ─── Boss ───
  {
    id: 'grieving-lock',
    name: 'The Grieving Lock',
    tier: 'boss',
    hp: [140, 148],
    moves: {
      toll: {
        name: 'Toll',
        effects: [
          { kind: 'ward', amount: 15 },
          { kind: 'applyStatus', status: 'weakened', amount: 1, target: 'target' },
        ],
      },
      shatter: {
        name: 'Shatter',
        effects: [
          { kind: 'damage', amount: 12 },
          { kind: 'applyStatus', status: 'fracture', amount: 1, target: 'self' },
        ],
      },
      litany: { name: 'Litany', effects: [{ kind: 'damage', amount: 4, hits: 3 }] },
      bind: {
        name: 'Bind',
        effects: [
          { kind: 'applyStatus', status: 'bleed', amount: 3, target: 'target' },
          { kind: 'applyStatus', status: 'exposed', amount: 2, target: 'target' },
        ],
      },
    },
    pattern: { kind: 'cycle', order: ['shatter', 'litany', 'bind', 'toll'], opening: 'toll' },
    sigil: { sides: 8, innerSides: 4, rings: 4, hue: 280, spin: 50 },
    flavor: 'It guards the way down. It weeps for what waits there.',
  },
];

export const ENCOUNTERS: EncounterDef[] = [
  // Early rows
  { id: 'lone-sentinel', tier: 'normal', stage: 'early', enemies: ['hollow-sentinel'] },
  { id: 'lattice', tier: 'normal', stage: 'early', enemies: ['bleeding-lattice'] },
  { id: 'wraith', tier: 'normal', stage: 'early', enemies: ['mirror-wraith'] },
  { id: 'choir-pair', tier: 'normal', stage: 'early', enemies: ['choir-shard', 'choir-shard'] },
  // Deeper rows
  { id: 'seraph', tier: 'normal', stage: 'late', enemies: ['rust-seraph'] },
  { id: 'crawler', tier: 'normal', stage: 'late', enemies: ['vein-crawler'] },
  { id: 'hound-pack', tier: 'normal', stage: 'late', enemies: ['ash-hound', 'ash-hound'] },
  { id: 'tithe', tier: 'normal', stage: 'late', enemies: ['tithe-engine'] },
  { id: 'sentinel-choir', tier: 'normal', stage: 'late', enemies: ['hollow-sentinel', 'choir-shard'] },
  // Elites and boss
  { id: 'warden-unmade', tier: 'elite', enemies: ['warden-unmade'] },
  { id: 'lens-tyrant', tier: 'elite', enemies: ['lens-tyrant'] },
  { id: 'grieving-lock', tier: 'boss', enemies: ['grieving-lock'] },
];
