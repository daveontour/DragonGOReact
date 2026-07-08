import { describe, expect, it } from "vitest";
import {
  clampSpiralN,
  fitPointsToViewport,
  generateSpiralPoints,
  sacksSpiralPoints,
  sieveOfEratosthenes,
  ulamSpiralPoints,
} from "./primespiral";

describe("primespiral", () => {
  it("sieves the correct primes up to a small limit", () => {
    const flags = sieveOfEratosthenes(20);
    const primes: number[] = [];
    for (let i = 0; i <= 20; i++) {
      if (flags[i]) {
        primes.push(i);
      }
    }
    expect(primes).toEqual([2, 3, 5, 7, 11, 13, 17, 19]);
  });

  it("marks 0 and 1 as non-prime", () => {
    const flags = sieveOfEratosthenes(5);
    expect(flags[0]).toBe(0);
    expect(flags[1]).toBe(0);
  });

  it("generates one distinct lattice point per integer for the Ulam spiral", () => {
    const flags = sieveOfEratosthenes(50);
    const points = ulamSpiralPoints(50, flags);
    expect(points).toHaveLength(50);
    const coords = new Set(points.map((p) => `${p.x},${p.y}`));
    expect(coords.size).toBe(50);
    expect(points[0]).toEqual({ n: 1, x: 0, y: 0, isPrime: false });
  });

  it("marks Ulam spiral points as prime according to the sieve", () => {
    const flags = sieveOfEratosthenes(50);
    const points = ulamSpiralPoints(50, flags);
    const point7 = points.find((p) => p.n === 7);
    const point9 = points.find((p) => p.n === 9);
    expect(point7?.isPrime).toBe(true);
    expect(point9?.isPrime).toBe(false);
  });

  it("places Sacks spiral perfect squares on the same ray", () => {
    const flags = sieveOfEratosthenes(20);
    const points = sacksSpiralPoints(20, flags);
    const p1 = points.find((p) => p.n === 1)!;
    const p4 = points.find((p) => p.n === 4)!;
    const p9 = points.find((p) => p.n === 9)!;
    // sqrt(n) is an integer for perfect squares, so theta = 2*pi*integer -> angle 0.
    expect(p1.y).toBeCloseTo(0, 5);
    expect(p4.y).toBeCloseTo(0, 5);
    expect(p9.y).toBeCloseTo(0, 5);
  });

  it("clamps spiral point counts to the supported range", () => {
    expect(clampSpiralN(1)).toBe(100);
    expect(clampSpiralN(999999)).toBe(60000);
  });

  it("generates the requested type and count via the convenience function", () => {
    const points = generateSpiralPoints("ulam", 200);
    expect(points).toHaveLength(200);
  });

  it("fits points within the padded viewport bounds", () => {
    const points = [
      { n: 1, x: -5, y: 5, isPrime: false },
      { n: 2, x: 5, y: -5, isPrime: true },
    ];
    const fitted = fitPointsToViewport(points, 100, 100, 10);
    for (const p of fitted) {
      expect(p.x).toBeGreaterThanOrEqual(9);
      expect(p.x).toBeLessThanOrEqual(91);
      expect(p.y).toBeGreaterThanOrEqual(9);
      expect(p.y).toBeLessThanOrEqual(91);
    }
  });
});
