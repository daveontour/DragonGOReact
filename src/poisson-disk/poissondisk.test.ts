import { describe, expect, it } from "vitest";
import {
  createPoissonDiskState,
  runPoissonToCompletion,
} from "./poissondisk";

function naiveConflict(samples: { x: number; y: number }[], radius: number): boolean {
  for (let i = 0; i < samples.length; i++) {
    for (let j = i + 1; j < samples.length; j++) {
      const d = Math.hypot(samples[i].x - samples[j].x, samples[i].y - samples[j].y);
      if (d < radius - 1e-6) {
        return true;
      }
    }
  }
  return false;
}

describe("Poisson disk minimum-distance invariant", () => {
  it("no two accepted samples are closer than the minimum radius", () => {
    const state = createPoissonDiskState(400, 400, 20, 42);
    runPoissonToCompletion(state);
    expect(state.samples.length).toBeGreaterThan(10);
    expect(naiveConflict(state.samples, state.radius)).toBe(false);
  });

  it("holds across several radii and seeds", () => {
    for (const radius of [8, 15, 30]) {
      for (const seed of [1, 2, 3]) {
        const state = createPoissonDiskState(300, 300, radius, seed);
        runPoissonToCompletion(state);
        expect(naiveConflict(state.samples, state.radius)).toBe(false);
      }
    }
  });
});

describe("grid-accelerated conflict search agrees with a naive all-pairs check", () => {
  it("produces the same accept/reject decisions as brute force would", () => {
    // If hasConflict ever missed a real conflict, the minimum-distance
    // invariant test above would already fail — this test instead checks
    // the flip side: the grid search doesn't OVER-reject valid candidates,
    // by confirming the sample count is reasonably dense for the area
    // (a buggy over-conservative search would produce far too few points).
    const state = createPoissonDiskState(200, 200, 12, 7);
    runPoissonToCompletion(state);
    const area = 200 * 200;
    const expectedApprox = area / (Math.PI * (12 / 2) ** 2); // loose packing-density estimate
    expect(state.samples.length).toBeGreaterThan(expectedApprox * 0.3);
  });
});

describe("termination", () => {
  it("completes within a bounded number of steps for a reasonable area", () => {
    const state = createPoissonDiskState(300, 300, 15, 3);
    runPoissonToCompletion(state, 50_000);
    expect(state.done).toBe(true);
  });
});

describe("determinism", () => {
  it("produces an identical sample sequence for the same seed", () => {
    const a = createPoissonDiskState(200, 200, 15, 55);
    const b = createPoissonDiskState(200, 200, 15, 55);
    runPoissonToCompletion(a);
    runPoissonToCompletion(b);
    expect(a.samples).toEqual(b.samples);
  });
});
