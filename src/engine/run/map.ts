/**
 * Seeded branching map.
 *
 *   row 0         all Fights (2–4 nodes)
 *   rows 1..n-2   mixed node types
 *   row n-1       all Shrines (a breath before the boss)
 *   boss row      one Boss node
 *
 * Paths never cross: each node connects to a contiguous range of nodes in
 * the next row, and neighbouring ranges may share an endpoint but never
 * overlap. That keeps the map readable on a narrow phone screen.
 */
import { BALANCE } from '../../data/balance';
import { rngInt, rngNext, rngWeighted, type RngState } from '../rng';
import type { MapGraph, MapNode, NodeType } from '../types';

export interface MapConfig {
  rows: number;
  minWidth: number;
  maxWidth: number;
  branchChance: number;
  eliteMinRow: number;
  shrineMinRow: number;
  weights: Record<'fight' | 'event' | 'elite' | 'cache' | 'shrine', number>;
}

/** Node types that should never appear twice in a row along a path. */
const NO_BACK_TO_BACK: NodeType[] = ['elite', 'shrine', 'cache'];

export function generateMap(rng: RngState, cfg: MapConfig = BALANCE.map): MapGraph {
  const rows: MapNode[][] = [];

  for (let r = 0; r < cfg.rows; r++) {
    const width = rngInt(rng, cfg.minWidth, cfg.maxWidth);
    const row: MapNode[] = [];
    for (let c = 0; c < width; c++) {
      const jitter = (rngNext(rng) - 0.5) * (0.5 / width);
      row.push({ id: `r${r}c${c}`, row: r, col: c, x: (c + 0.5) / width + jitter, type: 'fight', next: [] });
    }
    rows.push(row);
  }

  for (let r = 0; r < cfg.rows - 1; r++) {
    const ranges = connectRows(rng, rows[r].length, rows[r + 1].length, cfg.branchChance);
    rows[r].forEach((node, i) => {
      for (let j = ranges[i][0]; j <= ranges[i][1]; j++) node.next.push(rows[r + 1][j].id);
    });
  }

  const boss: MapNode = { id: 'boss', row: cfg.rows, col: 0, x: 0.5, type: 'boss', next: [] };
  for (const node of rows[cfg.rows - 1]) node.next.push(boss.id);

  const nodes: Record<string, MapNode> = { [boss.id]: boss };
  for (const node of rows.flat()) nodes[node.id] = node;
  assignTypes(rng, rows, nodes, cfg);

  return { rows: cfg.rows, nodes, startIds: rows[0].map((n) => n.id), bossId: boss.id };
}

/**
 * For each of `a` nodes, an inclusive [lo, hi] range of the `b` nodes below.
 * Base ranges split the next row proportionally (so every node has a parent);
 * random extensions add branches without crossings.
 */
export function connectRows(rng: RngState, a: number, b: number, branchChance: number): [number, number][] {
  const lo = Array.from({ length: a }, (_, i) => Math.floor((i * b) / a));
  const hi = Array.from({ length: a }, (_, i) => Math.ceil(((i + 1) * b) / a) - 1);
  const baseLo = [...lo];

  for (let i = 0; i < a; i++) {
    // Extend left only if it still doesn't pass the previous node's final range.
    if (i > 0 && lo[i] - 1 >= hi[i - 1] && lo[i] > 0 && rngNext(rng) < branchChance) lo[i]--;
    // Extend right only up to the next node's base start (shared endpoint is fine).
    const limit = i < a - 1 ? baseLo[i + 1] : b - 1;
    if (hi[i] + 1 <= limit && rngNext(rng) < branchChance) hi[i]++;
  }
  return lo.map((l, i) => [l, hi[i]]);
}

function assignTypes(rng: RngState, rows: MapNode[][], nodes: Record<string, MapNode>, cfg: MapConfig): void {
  const parents = new Map<string, MapNode[]>();
  for (const node of Object.values(nodes)) {
    for (const id of node.next) parents.set(id, [...(parents.get(id) ?? []), node]);
  }

  for (const row of rows) {
    for (const node of row) {
      const r = node.row;
      if (r === 0) node.type = 'fight';
      else if (r === cfg.rows - 1) node.type = 'shrine';
      else {
        const weights: Record<string, number> = { ...cfg.weights };
        if (r < cfg.eliteMinRow) weights.elite = 0;
        // No Shrine right before the Shrine row.
        if (r < cfg.shrineMinRow || r === cfg.rows - 2) weights.shrine = 0;
        // Forbid repeating a parent's "special" type along the same path.
        for (const p of parents.get(node.id) ?? []) {
          if (NO_BACK_TO_BACK.includes(p.type)) weights[p.type] = 0;
        }
        node.type = rngWeighted(rng, weights) as NodeType;
      }
    }
  }

  // Every loop should offer at least one Elite risk and one Event.
  ensureType(rng, rows, 'elite', cfg.eliteMinRow, cfg.rows - 2);
  ensureType(rng, rows, 'event', 1, cfg.rows - 2);
}

/** If no node of `type` exists in rows [from, to], turn a random Fight there into one. */
function ensureType(rng: RngState, rows: MapNode[][], type: NodeType, from: number, to: number): void {
  const band = rows.slice(from, to + 1).flat();
  if (band.some((n) => n.type === type)) return;
  const fights = band.filter((n) => n.type === 'fight');
  if (fights.length) fights[Math.floor(rngNext(rng) * fights.length)].type = type;
}

/** Nodes the player may step onto next. */
export function reachableNodes(map: MapGraph, position: string | null): string[] {
  return position === null ? map.startIds : map.nodes[position].next;
}
