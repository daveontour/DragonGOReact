import { describe, expect, it } from "vitest";
import {
  clampRoseD,
  clampRoseN,
  DEFAULT_ROSE_D,
  DEFAULT_ROSE_N,
  generateRosePoints,
  MAX_ROSE_D,
  MAX_ROSE_N,
  MIN_ROSE_D,
  MIN_ROSE_N,
  roseSweepTheta,
  rosePetalCount,
  rosePoint,
} from "./rose-curves";

describe("rose-curves", () => {
  it("closes the curve exactly at its computed sweep angle for several n,d", () => {
    const cases: Array<[number, number]> = [
      [2, 1],
      [3, 1],
      [5, 1],
      [2, 3],
      [3, 2],
      [4, 2],
    ];
    for (const [n, d] of cases) {
      const sweep = roseSweepTheta(n, d);
      const start = rosePoint(0, n, d);
      const end = rosePoint(sweep, n, d);
      expect(end.x).toBeCloseTo(start.x, 5);
      expect(end.y).toBeCloseTo(start.y, 5);
    }
  });

  it("needs a full 2π to close the classic 4-petal rose (n=2,d=1)", () => {
    // r = cos(2*theta) is the textbook 4-petal rose and genuinely needs the
    // full 2π sweep; a naive parity rule that stops at just π would render
    // an incomplete 2-petal fragment for this extremely common default.
    expect(roseSweepTheta(2, 1)).toBeCloseTo(2 * Math.PI);
    expect(rosePetalCount(2, 1)).toBe(4);
  });

  it("only needs π to close the 3-petal rose (n=3,d=1)", () => {
    expect(roseSweepTheta(3, 1)).toBeCloseTo(Math.PI);
    expect(rosePetalCount(3, 1)).toBe(3);
  });

  it("reduces unreduced fractions before computing sweep and petal count", () => {
    expect(roseSweepTheta(4, 2)).toBeCloseTo(roseSweepTheta(2, 1));
    expect(rosePetalCount(4, 2)).toBe(4); // not 8, which an unreduced n would give
  });

  it("generates a bounded, non-empty set of points", () => {
    const points = generateRosePoints(DEFAULT_ROSE_N, DEFAULT_ROSE_D);
    expect(points.length).toBeGreaterThan(0);
  });

  it("clamps n and d to their supported ranges", () => {
    expect(clampRoseN(0)).toBe(MIN_ROSE_N);
    expect(clampRoseN(9999)).toBe(MAX_ROSE_N);
    expect(clampRoseN(NaN)).toBe(DEFAULT_ROSE_N);

    expect(clampRoseD(0)).toBe(MIN_ROSE_D);
    expect(clampRoseD(9999)).toBe(MAX_ROSE_D);
    expect(clampRoseD(NaN)).toBe(DEFAULT_ROSE_D);
  });
});
