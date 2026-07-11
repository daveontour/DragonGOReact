import { describe, expect, it } from "vitest";
import {
  collapseStep,
  createSeededRandom,
  createWfcState,
  DIR,
  isFullyResolved,
  NEIGHBOR_MASK,
  OPPOSITE,
  runWfc,
  TILE_COUNT,
  TILE_SET,
} from "./wavefunctioncollapse";

describe("NEIGHBOR_MASK compatibility symmetry", () => {
  it("A is compatible as B's neighbor in dir D iff B is compatible as A's neighbor in the opposite direction", () => {
    for (let a = 0; a < TILE_COUNT; a++) {
      for (let b = 0; b < TILE_COUNT; b++) {
        for (let dir = 0; dir < 4; dir++) {
          const aHasB = (NEIGHBOR_MASK[a][dir] & (1 << b)) !== 0;
          const bHasA = (NEIGHBOR_MASK[b][OPPOSITE[dir]] & (1 << a)) !== 0;
          expect(aHasB).toBe(bHasA);
        }
      }
    }
  });
});

describe("runWfc produces a fully resolved, mutually compatible tiling", () => {
  it("every cell's mask is a power of two after a successful run", () => {
    const { state } = runWfc(12, 12, 42);
    expect(isFullyResolved(state)).toBe(true);
    for (const mask of state.cells) {
      expect(mask & (mask - 1)).toBe(0); // power-of-two check
      expect(mask).not.toBe(0);
    }
  });

  it("every adjacent resolved pair is mutually socket-compatible", () => {
    const { state } = runWfc(15, 12, 7);
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const i = y * state.width + x;
        const tileA = TILE_SET[Math.log2(state.cells[i])];
        if (x + 1 < state.width) {
          const j = y * state.width + (x + 1);
          const tileB = TILE_SET[Math.log2(state.cells[j])];
          expect(tileA.edges[DIR.E]).toBe(tileB.edges[DIR.W]);
        }
        if (y + 1 < state.height) {
          const j = (y + 1) * state.width + x;
          const tileB = TILE_SET[Math.log2(state.cells[j])];
          expect(tileA.edges[DIR.S]).toBe(tileB.edges[DIR.N]);
        }
      }
    }
  });

  it("restart rate stays low across several seeds (tile weights keep contradictions rare)", () => {
    let totalRestarts = 0;
    const trials = 10;
    for (let seed = 1; seed <= trials; seed++) {
      const { restarts } = runWfc(16, 16, seed * 101);
      totalRestarts += restarts;
    }
    // Not a hard correctness requirement, but a regression guard: if tile
    // weights are later changed and contradictions become frequent, this
    // will start failing well before restarts approach MAX_RESTARTS.
    expect(totalRestarts / trials).toBeLessThan(5);
  });
});

describe("tiny 2x1 grid propagation", () => {
  it("collapsing cell 0 constrains cell 1 to exactly the precomputed neighbor mask", () => {
    const state = createWfcState(2, 1);
    // Force a deterministic pick by using a tile-set-sized rng sequence:
    // first call selects the lowest-entropy cell (only one candidate, index
    // irrelevant), second call selects which tile via weighted pick.
    const rng = createSeededRandom(99);
    const ok = collapseStep(state, rng);
    expect(ok).toBe(true);

    const cell0Mask = state.cells[0];
    expect(cell0Mask & (cell0Mask - 1)).toBe(0); // resolved to one tile
    const chosenTile = Math.log2(cell0Mask);
    expect(state.cells[1]).toBe(NEIGHBOR_MASK[chosenTile][DIR.E]);
  });
});

describe("determinism", () => {
  it("the same seed produces an identical collapse sequence and final grid", () => {
    const a = runWfc(10, 10, 555);
    const b = runWfc(10, 10, 555);
    expect(Array.from(a.state.cells)).toEqual(Array.from(b.state.cells));
    expect(a.restarts).toBe(b.restarts);
  });
});
