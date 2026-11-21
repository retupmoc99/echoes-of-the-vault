import { describe, expect, it } from 'vitest';
import { BALANCE } from '../../data/balance';
import { createRng } from '../rng';
import type { MapGraph, MapNode } from '../types';
import { connectRows, generateMap } from './map';

const SEEDS = Array.from({ length: 200 }, (_, i) => `map-${i}`);
const maps = SEEDS.map((s) => generateMap(createRng(s)));
const cfg = BALANCE.map;

const byRow = (m: MapGraph) => {
  const rows: MapNode[][] = [];
  for (const n of Object.values(m.nodes)) (rows[n.row] ??= []).push(n);
  return rows.map((r) => r.sort((a, b) => a.col - b.col));
};

describe('map generation', () => {
  it('is deterministic for a seed', () => {
    expect(generateMap(createRng('same'))).toEqual(generateMap(createRng('same')));
    expect(generateMap(createRng('a'))).not.toEqual(generateMap(createRng('b')));
  });

  it('has the configured shape: fights first, shrines last, one boss', () => {
    for (const m of maps) {
      const rows = byRow(m);
      expect(rows).toHaveLength(cfg.rows + 1);
      expect(rows[0].every((n) => n.type === 'fight')).toBe(true);
      expect(rows[cfg.rows - 1].every((n) => n.type === 'shrine')).toBe(true);
      expect(rows[cfg.rows]).toEqual([m.nodes[m.bossId]]);
      for (const row of rows.slice(0, cfg.rows)) {
        expect(row.length).toBeGreaterThanOrEqual(cfg.minWidth);
        expect(row.length).toBeLessThanOrEqual(cfg.maxWidth);
      }
    }
  });

  it('connects only to the next row, and every node is reachable from the start', () => {
    for (const m of maps) {
      const seen = new Set<string>(m.startIds);
      const queue = [...m.startIds];
      while (queue.length) {
        const node = m.nodes[queue.shift()!];
        if (node.id !== m.bossId) expect(node.next.length).toBeGreaterThan(0);
        for (const id of node.next) {
          expect(m.nodes[id].row).toBe(node.row + 1);
          if (!seen.has(id)) {
            seen.add(id);
            queue.push(id);
          }
        }
      }
      expect(seen.size).toBe(Object.keys(m.nodes).length);
    }
  });

  it('never draws crossing paths', () => {
    for (const m of maps) {
      for (const row of byRow(m)) {
        for (let i = 0; i < row.length - 1; i++) {
          const maxLeft = Math.max(...row[i].next.map((id) => m.nodes[id].col));
          const minRight = Math.min(...row[i + 1].next.map((id) => m.nodes[id].col));
          if (row[i].next.length && row[i + 1].next.length) expect(maxLeft).toBeLessThanOrEqual(minRight);
        }
      }
    }
  });

  it('keeps elites out of early rows and never repeats elite/shrine/cache along a path', () => {
    for (const m of maps) {
      for (const n of Object.values(m.nodes)) {
        if (n.type === 'elite') expect(n.row).toBeGreaterThanOrEqual(cfg.eliteMinRow);
        for (const id of n.next) {
          const child = m.nodes[id];
          if (['elite', 'cache'].includes(n.type) || (n.type === 'shrine' && n.row < cfg.rows - 1)) {
            expect(child.type, `${n.id}→${id}`).not.toBe(n.type);
          }
        }
      }
    }
  });

  it('offers real choices: most maps contain elites, events and branching', () => {
    const withElite = maps.filter((m) => Object.values(m.nodes).some((n) => n.type === 'elite')).length;
    const withEvent = maps.filter((m) => Object.values(m.nodes).some((n) => n.type === 'event')).length;
    const branching = maps.filter((m) => Object.values(m.nodes).filter((n) => n.next.length > 1).length >= 3).length;
    expect(withElite / maps.length).toBeGreaterThan(0.9);
    expect(withEvent / maps.length).toBeGreaterThan(0.9);
    expect(branching / maps.length).toBeGreaterThan(0.9);
  });
});

describe('connectRows', () => {
  it('gives every lower node a parent for all width combinations', () => {
    const rng = createRng('rows');
    for (let a = 1; a <= 4; a++) {
      for (let b = 1; b <= 4; b++) {
        for (let t = 0; t < 30; t++) {
          const ranges = connectRows(rng, a, b, 0.5);
          const covered = new Set(ranges.flatMap(([lo, hi]) => Array.from({ length: hi - lo + 1 }, (_, k) => lo + k)));
          expect(covered.size).toBe(b);
        }
      }
    }
  });
});
