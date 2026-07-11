import { describe, expect, it } from "vitest";
import {
  createGrid,
  dijkstraPathCost,
  initAStar,
  MUD_COST,
  NORMAL_COST,
  pathCost,
  reconstructPath,
  runAStarSteps,
  WALL_COST,
} from "./astar";

function solve(grid: ReturnType<typeof createGrid>, startIdx: number, goalIdx: number) {
  const state = initAStar(grid, startIdx);
  runAStarSteps(grid, state, goalIdx, grid.width * grid.height + 10);
  return state;
}

describe("A* finds the optimal path around a hand-built wall", () => {
  it("matches an independently-computed expected detour cost", () => {
    const grid = createGrid(5, 5);
    // Wall across column x=2 except a gap at y=4, forcing a detour down and around.
    for (let y = 0; y < 4; y++) {
      grid.cost[y * 5 + 2] = WALL_COST;
    }
    const startIdx = 0 * 5 + 0; // (0,0)
    const goalIdx = 0 * 5 + 4; // (4,0)
    const state = solve(grid, startIdx, goalIdx);
    const path = reconstructPath(state, startIdx, goalIdx);
    expect(state.found).toBe(true);
    // Shortest route: (0,0) down to (0,4) [4 steps], across to (4,4)
    // through the gap at x=2 [4 steps], back up to (4,0) [4 steps] = 12.
    expect(pathCost(grid, path)).toBe(12);
  });
});

describe("differential test against a Dijkstra baseline", () => {
  it("A* path cost matches Dijkstra (h=0) on random grids with mixed terrain", () => {
    const width = 12;
    const height = 12;
    for (let seed = 0; seed < 8; seed++) {
      const grid = createGrid(width, height);
      // deterministic pseudo-random terrain via a simple LCG, avoiding
      // walling off start/goal
      let s = seed * 7919 + 13;
      const next = () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
      };
      for (let i = 0; i < grid.cost.length; i++) {
        const r = next();
        grid.cost[i] = r < 0.2 ? WALL_COST : r < 0.35 ? MUD_COST : NORMAL_COST;
      }
      const startIdx = 0;
      const goalIdx = width * height - 1;
      grid.cost[startIdx] = NORMAL_COST;
      grid.cost[goalIdx] = NORMAL_COST;

      const state = solve(grid, startIdx, goalIdx);
      const path = reconstructPath(state, startIdx, goalIdx);
      const dijkstraCost = dijkstraPathCost(grid, startIdx, goalIdx);

      if (Number.isFinite(dijkstraCost)) {
        expect(state.found).toBe(true);
        expect(pathCost(grid, path)).toBeCloseTo(dijkstraCost);
      } else {
        expect(state.found).toBe(false);
      }
    }
  });
});

describe("unreachable goal", () => {
  it("terminates with found=false and an empty openSet, no infinite loop", () => {
    const grid = createGrid(6, 6);
    const goalIdx = 3 * 6 + 3;
    // Wall off the goal entirely.
    for (let d = 0; d < 4; d++) {
      const dx = [0, 1, 0, -1][d];
      const dy = [-1, 0, 1, 0][d];
      grid.cost[(3 + dy) * 6 + (3 + dx)] = WALL_COST;
    }
    const state = solve(grid, 0, goalIdx);
    expect(state.done).toBe(true);
    expect(state.found).toBe(false);
    expect(state.openSet.length).toBe(0);
  });
});

describe("heuristic consistency", () => {
  it("popped fScore values are non-decreasing on a uniform-cost grid", () => {
    const grid = createGrid(15, 15);
    const startIdx = 0;
    const goalIdx = 15 * 15 - 1;
    const state = initAStar(grid, startIdx);
    const poppedFScores: number[] = [];

    // Instrument by re-implementing the pop-order observation via repeated
    // single steps and reading state.current's fScore right after each step.
    while (!state.done) {
      runAStarSteps(grid, state, goalIdx, 1);
      if (state.current !== null) {
        poppedFScores.push(state.fScore[state.current]);
      }
    }

    for (let i = 1; i < poppedFScores.length; i++) {
      expect(poppedFScores[i]).toBeGreaterThanOrEqual(poppedFScores[i - 1] - 1e-9);
    }
  });
});

describe("reconstructPath", () => {
  it("produces a contiguous 4-connected sequence from start to goal", () => {
    const grid = createGrid(10, 10);
    const startIdx = 0;
    const goalIdx = 9 * 10 + 9;
    const state = solve(grid, startIdx, goalIdx);
    const path = reconstructPath(state, startIdx, goalIdx);
    expect(path[0]).toBe(startIdx);
    expect(path[path.length - 1]).toBe(goalIdx);
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1];
      const b = path[i];
      const ax = a % 10;
      const ay = Math.floor(a / 10);
      const bx = b % 10;
      const by = Math.floor(b / 10);
      const manhattan = Math.abs(ax - bx) + Math.abs(ay - by);
      expect(manhattan).toBe(1);
    }
  });
});
