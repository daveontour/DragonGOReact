import { describe, expect, it } from "vitest";
import {
  clampGrainCount,
  clampTopplesPerFrame,
  createSandpileState,
  DEFAULT_GRAINS,
  DEFAULT_TOPPLES_PER_FRAME,
  dropGrains,
  isFullyStable,
  MAX_GRAINS,
  MAX_TOPPLES_PER_FRAME,
  MIN_GRAINS,
  MIN_TOPPLES_PER_FRAME,
  relaxOne,
  runToppleBudget,
} from "./sandpile";

describe("sandpile", () => {
  it("topples an interior cell exactly, redistributing to all four neighbors", () => {
    const state = createSandpileState(11);
    const idx = 5 * 11 + 5;
    state.grid[idx] = 4;
    const queue = [idx];

    relaxOne(state, queue);

    expect(state.grid[idx]).toBe(0);
    expect(state.grid[5 * 11 + 4]).toBe(1); // left
    expect(state.grid[5 * 11 + 6]).toBe(1); // right
    expect(state.grid[4 * 11 + 5]).toBe(1); // up
    expect(state.grid[6 * 11 + 5]).toBe(1); // down
  });

  it("loses the off-grid shares when a corner cell topples (open boundary)", () => {
    const size = 5;
    const state = createSandpileState(size);
    const idx = 0; // corner (0,0): only 2 in-grid neighbors
    state.grid[idx] = 4;
    const totalBefore = state.grid.reduce((sum, v) => sum + v, 0);
    const queue = [idx];

    relaxOne(state, queue);

    const totalAfter = state.grid.reduce((sum, v) => sum + v, 0);
    expect(totalBefore - totalAfter).toBe(2); // 2 shares lost off-grid
    expect(state.grid[idx]).toBe(0);
    expect(state.grid[1]).toBe(1); // right neighbor (1,0)
    expect(state.grid[size]).toBe(1); // down neighbor (0,1)
  });

  it("treats a duplicate queue entry as a correctly-skipped no-op", () => {
    const state = createSandpileState(11);
    const idx = 5 * 11 + 5;
    state.grid[idx] = 5;
    const queue = [idx, idx];

    expect(relaxOne(state, queue)).toBe(true);
    expect(state.grid[idx]).toBe(1);

    expect(relaxOne(state, queue)).toBe(false); // stale: grid[idx]=1 < threshold
    expect(state.grid[idx]).toBe(1);
  });

  it("never lets a cell transiently exceed a small bound and ends fully stable via incremental drops", () => {
    const state = createSandpileState(21);
    const queue: number[] = [];
    let maxSeen = 0;

    for (let i = 0; i < 500; i++) {
      dropGrains(state, 10, 10, 1, queue);
      for (const v of state.grid) {
        if (v > maxSeen) {
          maxSeen = v;
        }
      }
      runToppleBudget(state, queue, 100);
    }
    runToppleBudget(state, queue, 1_000_000);

    expect(maxSeen).toBeLessThanOrEqual(7);
    expect(isFullyStable(state)).toBe(true);
  });

  it("reaches an identical stable state regardless of the order grains are dropped in", () => {
    // Grain counts are kept proportional to this small grid (pattern
    // radius scales as sqrt(grains), so a 41-cell-wide grid should only
    // ever see a few hundred grains at each point, mirroring the real
    // app's much larger grid/grain-count calibration) -- oversized counts
    // here just mean enormous, pointlessly slow boundary-dissipated
    // cascades without testing anything the small case doesn't already.
    const size = 41;
    const p1 = { x: 15, y: 20 };
    const p2 = { x: 25, y: 20 };

    const stateA = createSandpileState(size);
    const queueA: number[] = [];
    dropGrains(stateA, p1.x, p1.y, 300, queueA);
    runToppleBudget(stateA, queueA, 1_000_000);
    dropGrains(stateA, p2.x, p2.y, 200, queueA);
    runToppleBudget(stateA, queueA, 1_000_000);

    const stateB = createSandpileState(size);
    const queueB: number[] = [];
    dropGrains(stateB, p2.x, p2.y, 200, queueB);
    runToppleBudget(stateB, queueB, 1_000_000);
    dropGrains(stateB, p1.x, p1.y, 300, queueB);
    runToppleBudget(stateB, queueB, 1_000_000);

    expect(Array.from(stateA.grid)).toEqual(Array.from(stateB.grid));
  });

  it("terminates with a fully stable grid within a generous topple budget", () => {
    const state = createSandpileState(9);
    const queue: number[] = [];
    dropGrains(state, 4, 4, 200, queue);

    const topples = runToppleBudget(state, queue, 1_000_000);

    expect(isFullyStable(state)).toBe(true);
    expect(topples).toBeGreaterThan(0);
  });

  it("clamps grain count and topples-per-frame to their supported ranges", () => {
    expect(clampGrainCount(0)).toBe(MIN_GRAINS);
    expect(clampGrainCount(9999999)).toBe(MAX_GRAINS);
    expect(clampGrainCount(NaN)).toBe(DEFAULT_GRAINS);

    expect(clampTopplesPerFrame(0)).toBe(MIN_TOPPLES_PER_FRAME);
    expect(clampTopplesPerFrame(9999999)).toBe(MAX_TOPPLES_PER_FRAME);
    expect(clampTopplesPerFrame(NaN)).toBe(DEFAULT_TOPPLES_PER_FRAME);
  });
});
