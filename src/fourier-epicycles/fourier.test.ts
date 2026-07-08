import { describe, expect, it } from "vitest";
import {
  clampFourierSpeed,
  clampHarmonics,
  computeDFT,
  Complex,
  epicycleChainPositions,
  generatePresetPath,
} from "./fourier";

describe("fourier", () => {
  it("recovers a single dominant frequency from a unit circle", () => {
    const N = 64;
    const points: Complex[] = [];
    for (let n = 0; n < N; n++) {
      const t = (2 * Math.PI * n) / N;
      points.push({ re: Math.cos(t), im: Math.sin(t) });
    }
    const epicycles = computeDFT(points);
    expect(epicycles[0].freq).toBe(1);
    expect(epicycles[0].amp).toBeCloseTo(1, 5);
    for (let i = 1; i < epicycles.length; i++) {
      expect(epicycles[i].amp).toBeLessThanOrEqual(epicycles[0].amp);
    }
  });

  it("sorts epicycles by descending amplitude", () => {
    const N = 32;
    const points: Complex[] = [];
    for (let n = 0; n < N; n++) {
      const t = (2 * Math.PI * n) / N;
      points.push({
        re: Math.cos(t) + 0.3 * Math.cos(3 * t),
        im: Math.sin(t) + 0.3 * Math.sin(3 * t),
      });
    }
    const epicycles = computeDFT(points);
    for (let i = 1; i < epicycles.length; i++) {
      expect(epicycles[i - 1].amp).toBeGreaterThanOrEqual(epicycles[i].amp);
    }
  });

  it("chains epicycles starting from the origin", () => {
    const epicycles = [
      { freq: 1, amp: 2, phase: 0 },
      { freq: 2, amp: 1, phase: 0 },
    ];
    const chain = epicycleChainPositions(epicycles, 2, 0);
    expect(chain).toHaveLength(3);
    expect(chain[0]).toEqual({ re: 0, im: 0 });
    expect(chain[1].re).toBeCloseTo(2);
    expect(chain[1].im).toBeCloseTo(0);
    expect(chain[2].re).toBeCloseTo(3);
    expect(chain[2].im).toBeCloseTo(0);
  });

  it("limits the chain to the requested number of harmonics", () => {
    const epicycles = [
      { freq: 1, amp: 2, phase: 0 },
      { freq: 2, amp: 1, phase: 0 },
      { freq: 3, amp: 0.5, phase: 0 },
    ];
    const chain = epicycleChainPositions(epicycles, 1, 0);
    expect(chain).toHaveLength(2);
  });

  it("generates preset paths with the requested sample count", () => {
    for (const id of ["star", "heart", "square", "infinity"] as const) {
      const path = generatePresetPath(id, 100);
      expect(path).toHaveLength(100);
      for (const p of path) {
        expect(Number.isFinite(p.re)).toBe(true);
        expect(Number.isFinite(p.im)).toBe(true);
      }
    }
  });

  it("clamps harmonics and speed to supported ranges", () => {
    expect(clampHarmonics(0, 50)).toBe(1);
    expect(clampHarmonics(999, 50)).toBe(50);
    expect(clampFourierSpeed(0)).toBe(0.1);
    expect(clampFourierSpeed(99)).toBe(3);
  });
});
