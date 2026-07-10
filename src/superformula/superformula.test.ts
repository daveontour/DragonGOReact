import { describe, expect, it } from "vitest";
import {
  clampExponent,
  clampM,
  DEFAULT_M,
  DEFAULT_N1,
  MAX_M,
  MAX_N,
  MIN_M,
  MIN_N,
  randomSuperformulaParams,
  superformulaRadius,
  SUPERFORMULA_MAX_R,
} from "./superformula";

describe("superformula", () => {
  it("is always exactly 1 at theta=0, independent of every exponent", () => {
    const cases: Array<[number, number, number, number]> = [
      [4, 2, 2, 2],
      [5, 0.3, 1.7, 1.7],
      [16, 0.5, 0.8, 0.8],
      [3, 1, 1, 1],
    ];
    for (const [m, n1, n2, n3] of cases) {
      expect(superformulaRadius(0, m, n1, n2, n3)).toBeCloseTo(1);
    }
  });

  it("traces a perfect unit circle when n1=n2=n3=2, for any m and theta", () => {
    for (const m of [1, 4, 7, 12]) {
      for (let i = 0; i <= 8; i++) {
        const theta = (i / 8) * Math.PI * 2;
        expect(superformulaRadius(theta, m, 2, 2, 2)).toBeCloseTo(1);
      }
    }
  });

  it("clamps the radius at the extreme high-exponent/low-n1 corner instead of blowing up", () => {
    // mθ/4 = π/4 is where |cos|=|sin|≈0.707, the worst case for large n2,n3.
    const theta = Math.PI / 5; // m=5 -> mθ/4 = π/4
    const radius = superformulaRadius(theta, 5, MIN_N, MAX_N, MAX_N);
    expect(Number.isFinite(radius)).toBe(true);
    expect(radius).toBe(SUPERFORMULA_MAX_R);
  });

  it("never engages the clamp for a normal, well-behaved shape", () => {
    for (let i = 0; i <= 40; i++) {
      const theta = (i / 40) * Math.PI * 2;
      const radius = superformulaRadius(theta, 5, 2, 6, 6);
      expect(radius).toBeLessThan(SUPERFORMULA_MAX_R);
    }
  });

  it("keeps randomized params within their supported ranges", () => {
    let seed = 777;
    const rng = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 20; i++) {
      const params = randomSuperformulaParams(rng);
      expect(params.m).toBeGreaterThanOrEqual(3);
      expect(params.m).toBeLessThanOrEqual(16);
      expect(params.n1).toBeGreaterThan(0);
      expect(params.n2).toBeGreaterThan(0);
      expect(params.n3).toBeGreaterThan(0);
    }
  });

  it("clamps m and the shared exponent to their supported ranges", () => {
    expect(clampM(0)).toBe(MIN_M);
    expect(clampM(9999)).toBe(MAX_M);
    expect(clampM(NaN)).toBe(DEFAULT_M);

    expect(clampExponent(0)).toBe(MIN_N);
    expect(clampExponent(9999)).toBe(MAX_N);
    expect(clampExponent(NaN)).toBe(DEFAULT_N1);
  });
});
