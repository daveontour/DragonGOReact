import { describe, expect, it } from "vitest";
import {
  clampFrequency,
  clampPhase,
  DEFAULT_FREQ_A,
  DEFAULT_PHASE,
  generateLissajousPoints,
  lissajousPoint,
  MAX_FREQUENCY,
  MAX_PHASE,
  MIN_FREQUENCY,
  MIN_PHASE,
} from "./lissajous";

describe("lissajous", () => {
  it("traces a perfect circle at a=b=1 with a quarter-turn phase", () => {
    for (let i = 0; i <= 20; i++) {
      const t = (i / 20) * Math.PI * 2;
      const point = lissajousPoint(t, 1, 1, Math.PI / 2);
      expect(point.x * point.x + point.y * point.y).toBeCloseTo(1);
    }
  });

  it("degenerates to a straight diagonal line at a=b=1, delta=0", () => {
    for (let i = 0; i <= 20; i++) {
      const t = (i / 20) * Math.PI * 2;
      const point = lissajousPoint(t, 1, 1, 0);
      expect(point.x).toBeCloseTo(point.y);
    }
  });

  it("closes exactly after a full 0..2π sweep for any integer frequencies", () => {
    const cases: Array<[number, number, number]> = [
      [3, 2, Math.PI / 2],
      [5, 4, 0],
      [12, 7, 1.3],
    ];
    for (const [a, b, delta] of cases) {
      const start = lissajousPoint(0, a, b, delta);
      const end = lissajousPoint(Math.PI * 2, a, b, delta);
      expect(end.x).toBeCloseTo(start.x);
      expect(end.y).toBeCloseTo(start.y);
    }
  });

  it("harmlessly retraces when gcd(a,b) > 1", () => {
    // a=2,b=4 has gcd=2, so the true period is π; the pattern must repeat
    // exactly halfway through the full 2π sweep.
    for (let i = 0; i <= 10; i++) {
      const theta = (i / 10) * Math.PI;
      const first = lissajousPoint(theta, 2, 4, 0.4);
      const second = lissajousPoint(theta + Math.PI, 2, 4, 0.4);
      expect(second.x).toBeCloseTo(first.x);
      expect(second.y).toBeCloseTo(first.y);
    }
  });

  it("reaches its full bounding extent across the sampled sweep", () => {
    const points = generateLissajousPoints(3, 2, Math.PI / 2);
    const maxX = Math.max(...points.map((p) => Math.abs(p.x)));
    const maxY = Math.max(...points.map((p) => Math.abs(p.y)));
    expect(maxX).toBeCloseTo(1, 1);
    expect(maxY).toBeCloseTo(1, 1);
  });

  it("clamps frequency and phase to their supported ranges", () => {
    expect(clampFrequency(0)).toBe(MIN_FREQUENCY);
    expect(clampFrequency(9999)).toBe(MAX_FREQUENCY);
    expect(clampFrequency(NaN)).toBe(DEFAULT_FREQ_A);

    expect(clampPhase(-1)).toBe(MIN_PHASE);
    expect(clampPhase(9999)).toBe(MAX_PHASE);
    expect(clampPhase(NaN)).toBe(DEFAULT_PHASE);
  });
});
