import { describe, expect, it } from "vitest";
import {
  clampFeed,
  clampKill,
  clampStepsPerFrame,
  createReactionDiffusionState,
  DEFAULT_FEED,
  DEFAULT_KILL,
  DEFAULT_STEPS_PER_FRAME,
  GRID_SIZE,
  laplacianAt,
  MAX_FEED,
  MAX_KILL,
  MAX_STEPS_PER_FRAME,
  MIN_FEED,
  MIN_KILL,
  MIN_STEPS_PER_FRAME,
  ReactionDiffusionState,
  renderReactionDiffusion,
  runReactionDiffusionSteps,
  seedCenterPerturbation,
  stepReactionDiffusion,
  wrapIndex,
} from "./reactiondiffusion";

function makeState(size: number): ReactionDiffusionState {
  const total = size * size;
  return {
    size,
    u: new Float32Array(total),
    v: new Float32Array(total),
    uNext: new Float32Array(total),
    vNext: new Float32Array(total),
  };
}

describe("reactiondiffusion", () => {
  it("wraps indices toroidally", () => {
    expect(wrapIndex(-1, 10)).toBe(9);
    expect(wrapIndex(10, 10)).toBe(0);
    expect(wrapIndex(5, 10)).toBe(5);
  });

  it("computes zero laplacian on a perfectly uniform grid", () => {
    const size = 8;
    const grid = new Float32Array(size * size).fill(0.42);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        expect(laplacianAt(grid, x, y, size)).toBeCloseTo(0);
      }
    }
  });

  it("matches the hand-computed stencil around a single hot pixel", () => {
    const size = 5;
    const grid = new Float32Array(size * size);
    grid[2 * size + 2] = 1; // hot pixel at (2, 2)

    expect(laplacianAt(grid, 2, 2, size)).toBeCloseTo(-1);
    expect(laplacianAt(grid, 1, 2, size)).toBeCloseTo(0.2); // edge neighbor
    expect(laplacianAt(grid, 1, 1, size)).toBeCloseTo(0.05); // corner neighbor
    expect(laplacianAt(grid, 0, 2, size)).toBeCloseTo(0); // two cells away
  });

  it("wraps the laplacian across the grid boundary", () => {
    const size = 5;
    const grid = new Float32Array(size * size);
    grid[0] = 1; // hot pixel at (0, 0), top-left corner
    // The cell at the opposite edge (size-1, 0) is toroidally adjacent to (0,0).
    expect(laplacianAt(grid, size - 1, 0, size)).toBeCloseTo(0.2);
  });

  it("leaves a uniform steady state unchanged", () => {
    const state = makeState(10);
    state.u.fill(1);
    state.v.fill(0);
    stepReactionDiffusion(state, DEFAULT_FEED, DEFAULT_KILL);

    for (let i = 0; i < state.u.length; i++) {
      expect(state.u[i]).toBeCloseTo(1);
      expect(state.v[i]).toBeCloseTo(0);
    }
  });

  it("grows v in a perturbed region once reaction has something to react with", () => {
    // A single isolated pixel loses more to outward diffusion than the
    // reaction can replace; a small contiguous blob (like the real seed)
    // has near-zero interior Laplacian, so its center is dominated by the
    // reaction term instead and should grow.
    const size = 20;
    const state = makeState(size);
    state.u.fill(1);
    const cx = 10;
    const cy = 10;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const idx = (cy + dy) * size + (cx + dx);
        state.u[idx] = 0.5;
        state.v[idx] = 0.25;
      }
    }

    const centerIdx = cy * size + cx;
    const before = state.v[centerIdx];
    stepReactionDiffusion(state, DEFAULT_FEED, DEFAULT_KILL);
    expect(state.v[centerIdx]).toBeGreaterThan(before);
  });

  it("seeds deterministic perturbations for a given seed, different for another seed", () => {
    const a = createReactionDiffusionState(40, 1);
    const b = createReactionDiffusionState(40, 1);
    const c = createReactionDiffusionState(40, 2);
    expect(Array.from(a.v)).toEqual(Array.from(b.v));
    expect(Array.from(a.v)).not.toEqual(Array.from(c.v));
  });

  it("only perturbs cells near the center, leaving the rest untouched", () => {
    const state = makeState(40);
    state.u.fill(1);
    seedCenterPerturbation(state, 5);

    const corner = 0 * 40 + 0;
    expect(state.u[corner]).toBeCloseTo(1);
    expect(state.v[corner]).toBeCloseTo(0);

    let touched = 0;
    for (let i = 0; i < state.v.length; i++) {
      if (state.v[i] > 0) {
        touched++;
      }
    }
    expect(touched).toBeGreaterThan(0);
    expect(touched).toBeLessThan(state.v.length / 2);
  });

  it("runs the requested number of steps", () => {
    const single = makeState(15);
    single.u.fill(1);
    single.u[15 * 7 + 7] = 0.5;
    single.v[15 * 7 + 7] = 0.25;
    stepReactionDiffusion(single, DEFAULT_FEED, DEFAULT_KILL);
    stepReactionDiffusion(single, DEFAULT_FEED, DEFAULT_KILL);
    stepReactionDiffusion(single, DEFAULT_FEED, DEFAULT_KILL);

    const looped = makeState(15);
    looped.u.fill(1);
    looped.u[15 * 7 + 7] = 0.5;
    looped.v[15 * 7 + 7] = 0.25;
    runReactionDiffusionSteps(looped, DEFAULT_FEED, DEFAULT_KILL, 3);

    expect(Array.from(looped.v)).toEqual(Array.from(single.v));
  });

  it("clamps feed, kill, and steps-per-frame to their supported ranges", () => {
    expect(clampFeed(0)).toBe(MIN_FEED);
    expect(clampFeed(999)).toBe(MAX_FEED);
    expect(clampFeed(NaN)).toBe(DEFAULT_FEED);

    expect(clampKill(0)).toBe(MIN_KILL);
    expect(clampKill(999)).toBe(MAX_KILL);
    expect(clampKill(NaN)).toBe(DEFAULT_KILL);

    expect(clampStepsPerFrame(0)).toBe(MIN_STEPS_PER_FRAME);
    expect(clampStepsPerFrame(999)).toBe(MAX_STEPS_PER_FRAME);
    expect(clampStepsPerFrame(NaN)).toBe(DEFAULT_STEPS_PER_FRAME);
  });

  it("renders untouched background brighter than fully-reacted regions in mono mode", () => {
    const size = 4;
    const state = makeState(size);
    state.u.fill(1); // background: u=1, v=0
    const reactedIdx = 5;
    state.u[reactedIdx] = 0;
    state.v[reactedIdx] = 1; // fully reacted: u-v = -1 -> clamps to 0

    const imageData = {
      width: size,
      height: size,
      data: new Uint8ClampedArray(size * size * 4),
    } as ImageData;
    renderReactionDiffusion(imageData, state, "mono");

    const backgroundOffset = 0 * 4;
    const reactedOffset = reactedIdx * 4;
    expect(imageData.data[backgroundOffset]).toBeGreaterThan(
      imageData.data[reactedOffset]
    );
  });

  it("creates a state sized to the grid with mostly-background chemistry", () => {
    const state = createReactionDiffusionState(GRID_SIZE, 3);
    expect(state.u.length).toBe(GRID_SIZE * GRID_SIZE);
    expect(state.v.length).toBe(GRID_SIZE * GRID_SIZE);
    expect(state.u[0]).toBeCloseTo(1);
    expect(state.v[0]).toBeCloseTo(0);
  });
});
