import { describe, expect, it } from "vitest";
import {
  clampTMax,
  DEFAULT_T_MAX,
  EULER_SPIRAL_TOTAL_STEPS,
  generateEulerSpiralPoints,
  MAX_T_MAX,
  MIN_T_MAX,
} from "./euler-spiral";

describe("euler-spiral", () => {
  it("passes through the origin at t=0", () => {
    const points = generateEulerSpiralPoints(8);
    const midIndex = EULER_SPIRAL_TOTAL_STEPS / 2;
    const origin = points[midIndex];
    expect(origin.t).toBeCloseTo(0);
    expect(origin.x).toBeCloseTo(0);
    expect(origin.y).toBeCloseTo(0);
  });

  it("is an odd function: point(-t) is the negation of point(t)", () => {
    const points = generateEulerSpiralPoints(8);
    const midIndex = EULER_SPIRAL_TOTAL_STEPS / 2;
    for (const offset of [1, 100, 500, 2000]) {
      const positive = points[midIndex + offset];
      const negative = points[midIndex - offset];
      expect(negative.t).toBeCloseTo(-positive.t);
      expect(negative.x).toBeCloseTo(-positive.x);
      expect(negative.y).toBeCloseTo(-positive.y);
    }
  });

  it("winds toward the (0.5, 0.5) asymptotic spiral center", () => {
    // Convergence is only asymptotic (error ~ 1/(pi*t)), so at t=8 the
    // endpoint is within roughly 0.05 of the true center, not tighter.
    const points = generateEulerSpiralPoints(8);
    const endpoint = points[points.length - 1];
    expect(Math.abs(endpoint.x - 0.5)).toBeLessThan(0.05);
    expect(Math.abs(endpoint.y - 0.5)).toBeLessThan(0.05);
  });

  it("stays within a loose sanity bound across the full range (Fresnel integrals overshoot slightly before settling)", () => {
    const points = generateEulerSpiralPoints(8);
    for (const point of points) {
      expect(Math.abs(point.x)).toBeLessThan(0.8);
      expect(Math.abs(point.y)).toBeLessThan(0.8);
    }
  });

  it("generates a point for every step across the full range", () => {
    const points = generateEulerSpiralPoints(5);
    expect(points.length).toBe(EULER_SPIRAL_TOTAL_STEPS + 1);
  });

  it("clamps tMax to its supported range", () => {
    expect(clampTMax(0)).toBe(MIN_T_MAX);
    expect(clampTMax(9999)).toBe(MAX_T_MAX);
    expect(clampTMax(NaN)).toBe(DEFAULT_T_MAX);
  });
});
