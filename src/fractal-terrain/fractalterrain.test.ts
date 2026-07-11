import { describe, expect, it } from "vitest";
import {
  createSeededRandom,
  generateDiamondSquare,
  gridSizeForDetail,
} from "./fractalterrain";

/** Returns `firstValues[i]` for the first N calls, then `fallback` forever
 * after — lets a test give the four corners distinct, known values while
 * keeping every subsequent random offset at a known constant (0.5 ->
 * rand()=0), isolating the pure averaging/clamping logic from randomness. */
function scriptedRng(firstValues: number[], fallback: number): () => number {
  let i = 0;
  return () => (i < firstValues.length ? firstValues[i++] : fallback);
}

describe("diamond step with a scripted rng", () => {
  it("the single diamond point of an n=1 grid exactly equals the average of the 4 corners", () => {
    // n=1 -> size=3, one diamond step, one point at (1,1).
    const rng = scriptedRng([0.9, 0.6, 0.2, 0.8], 0.5);
    const heights = generateDiamondSquare(1, 0.75, rng);
    const size = gridSizeForDetail(1);
    const idx = (x: number, y: number) => y * size + x;

    // rand() = rng()*2-1: corners in source order (0,0),(size-1,0),(0,size-1),(size-1,size-1)
    const c00 = 0.9 * 2 - 1;
    const c10 = 0.6 * 2 - 1;
    const c01 = 0.2 * 2 - 1;
    const c11 = 0.8 * 2 - 1;
    expect(heights[idx(0, 0)]).toBeCloseTo(c00);
    expect(heights[idx(size - 1, 0)]).toBeCloseTo(c10);
    expect(heights[idx(0, size - 1)]).toBeCloseTo(c01);
    expect(heights[idx(size - 1, size - 1)]).toBeCloseTo(c11);

    const expectedCenter = (c00 + c10 + c01 + c11) / 4; // + rand()*amplitude, and the 5th rng call is the fallback (0.5 -> rand=0)
    expect(heights[idx(1, 1)]).toBeCloseTo(expectedCenter);
  });
});

describe("square step edge clamping with a scripted rng", () => {
  it("a non-corner edge midpoint equals the average of exactly its 3 in-bounds neighbors", () => {
    const rng = scriptedRng([0.9, 0.6, 0.2, 0.8], 0.5);
    const heights = generateDiamondSquare(1, 0.75, rng);
    const size = gridSizeForDetail(1);
    const idx = (x: number, y: number) => y * size + x;

    // Top-edge midpoint (1,0): neighbors are (0,0), (2,0), and (1,1) — no
    // (1,-1), since it's off-grid — so this directly verifies clamping to
    // 3 neighbors, not 4.
    const expected = (heights[idx(0, 0)] + heights[idx(2, 0)] + heights[idx(1, 1)]) / 3;
    expect(heights[idx(1, 0)]).toBeCloseTo(expected);
  });
});

describe("corner invariant", () => {
  it("the 4 initial corners are never overwritten by any later diamond/square step", () => {
    const rng = scriptedRng([0.9, 0.6, 0.2, 0.8], 0.5);
    const heights = generateDiamondSquare(4, 0.75, rng);
    const size = gridSizeForDetail(4);
    const idx = (x: number, y: number) => y * size + x;

    expect(heights[idx(0, 0)]).toBeCloseTo(0.9 * 2 - 1);
    expect(heights[idx(size - 1, 0)]).toBeCloseTo(0.6 * 2 - 1);
    expect(heights[idx(0, size - 1)]).toBeCloseTo(0.2 * 2 - 1);
    expect(heights[idx(size - 1, size - 1)]).toBeCloseTo(0.8 * 2 - 1);
  });
});

describe("finiteness across detail/roughness combinations", () => {
  it("every value in the final array is finite for several parameter combinations", () => {
    for (const n of [3, 5, 7]) {
      for (const hurst of [0.3, 0.75, 1.2]) {
        const rng = createSeededRandom(n * 100 + hurst * 10);
        const heights = generateDiamondSquare(n, hurst, rng);
        for (const h of heights) {
          expect(Number.isFinite(h)).toBe(true);
        }
      }
    }
  });
});

describe("determinism", () => {
  it("the same seed produces an identical heightmap", () => {
    const a = generateDiamondSquare(5, 0.75, createSeededRandom(123));
    const b = generateDiamondSquare(5, 0.75, createSeededRandom(123));
    expect(Array.from(a)).toEqual(Array.from(b));
  });
});
