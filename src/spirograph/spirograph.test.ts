import { describe, expect, it } from "vitest";
import {
  clampAnimateSpeed,
  clampEccentricity,
  clampPenOffset,
  clampR,
  clampSmallR,
  DEFAULT_ANIMATE_SPEED,
  DEFAULT_ECCENTRICITY,
  DEFAULT_R,
  DEFAULT_SMALL_R,
  eccentricityToMinorScale,
  epitrochoidPoint,
  gcd,
  generateSpirographPoints,
  hypotrochoidPoint,
  MAX_ANIMATE_SPEED,
  MAX_ECCENTRICITY,
  MAX_R,
  MAX_SMALL_R,
  MIN_ANIMATE_SPEED,
  MIN_ECCENTRICITY,
  MIN_R,
  MIN_SMALL_R,
  spirographLoopCount,
  spirographPeriod,
} from "./spirograph";

describe("spirograph", () => {
  it("computes gcd correctly, including coprime pairs", () => {
    expect(gcd(4, 1)).toBe(1);
    expect(gcd(10, 6)).toBe(2);
    expect(gcd(5, 3)).toBe(1);
  });

  it("computes the astroid's period as a single loop", () => {
    // R=4, r=1 is the classic astroid: R,r coprime -> one full loop.
    expect(spirographPeriod(4, 1)).toBeCloseTo(2 * Math.PI);
  });

  it("computes a three-loop period for a coprime 5:3 ratio", () => {
    expect(spirographPeriod(5, 3)).toBeCloseTo(6 * Math.PI);
  });

  it("gives the same reduced loop count when R and r share a common factor", () => {
    expect(spirographLoopCount(10, 6)).toBeCloseTo(spirographLoopCount(5, 3));
    expect(spirographPeriod(10, 6)).toBeCloseTo(spirographPeriod(5, 3));
  });

  it("closes the hypotrochoid curve after one full period", () => {
    const cases: Array<[number, number, number]> = [
      [40, 17, 12],
      [5, 3, 2],
      [10, 6, 4],
    ];
    for (const [R, r, d] of cases) {
      const period = spirographPeriod(R, r);
      const start = hypotrochoidPoint(0, R, r, d);
      const end = hypotrochoidPoint(period, R, r, d);
      expect(end.x).toBeCloseTo(start.x, 5);
      expect(end.y).toBeCloseTo(start.y, 5);
    }
  });

  it("closes the epitrochoid curve after one full period", () => {
    const cases: Array<[number, number, number]> = [
      [40, 17, 12],
      [5, 3, 2],
      [10, 6, 4],
    ];
    for (const [R, r, d] of cases) {
      const period = spirographPeriod(R, r);
      const start = epitrochoidPoint(0, R, r, d);
      const end = epitrochoidPoint(period, R, r, d);
      expect(end.x).toBeCloseTo(start.x, 5);
      expect(end.y).toBeCloseTo(start.y, 5);
    }
  });

  it("collapses the hypotrochoid to a fixed point when R equals r", () => {
    const R = 10;
    const r = 10;
    const d = 4;
    for (const t of [0, 1, 2.5, Math.PI]) {
      const point = hypotrochoidPoint(t, R, r, d);
      expect(point.x).toBeCloseTo(d);
      expect(point.y).toBeCloseTo(0);
    }
  });

  it("generates a bounded, non-empty set of points", () => {
    const points = generateSpirographPoints("hypotrochoid", 40, 17, 12);
    expect(points.length).toBeGreaterThan(0);
    expect(points.length).toBeLessThanOrEqual(20000);
  });

  it("keeps eccentricity 0 mathematically identical to the classic circular curve", () => {
    expect(eccentricityToMinorScale(0)).toBe(1);
    const withDefaults = hypotrochoidPoint(1.3, 40, 17, 12);
    const withExplicitZero = hypotrochoidPoint(1.3, 40, 17, 12, 0, 0);
    expect(withDefaults).toEqual(withExplicitZero);
  });

  it("shrinks the minor-axis scale toward zero as eccentricity approaches 1, never going negative", () => {
    expect(eccentricityToMinorScale(MAX_ECCENTRICITY)).toBeGreaterThan(0);
    expect(eccentricityToMinorScale(MAX_ECCENTRICITY)).toBeLessThan(1);
  });

  it("still closes hypotrochoid and epitrochoid curves at nonzero ring/wheel eccentricity", () => {
    const cases: Array<[number, number, number, number, number]> = [
      [40, 17, 12, 0.6, 0],
      [40, 17, 12, 0, 0.6],
      [5, 3, 2, 0.4, 0.4],
    ];
    for (const [R, r, d, eRing, eWheel] of cases) {
      const period = spirographPeriod(R, r);
      const hStart = hypotrochoidPoint(0, R, r, d, eRing, eWheel);
      const hEnd = hypotrochoidPoint(period, R, r, d, eRing, eWheel);
      expect(hEnd.x).toBeCloseTo(hStart.x, 5);
      expect(hEnd.y).toBeCloseTo(hStart.y, 5);

      const eStart = epitrochoidPoint(0, R, r, d, eRing, eWheel);
      const eEnd = epitrochoidPoint(period, R, r, d, eRing, eWheel);
      expect(eEnd.x).toBeCloseTo(eStart.x, 5);
      expect(eEnd.y).toBeCloseTo(eStart.y, 5);
    }
  });

  it("flattens the curve's vertical extent as ring or wheel eccentricity increases", () => {
    const flat = (points: { y: number }[]) =>
      Math.max(...points.map((p) => Math.abs(p.y)));

    const circular = generateSpirographPoints("hypotrochoid", 40, 17, 12, 0, 0);
    const ringSquashed = generateSpirographPoints("hypotrochoid", 40, 17, 12, 0.8, 0);
    const wheelSquashed = generateSpirographPoints("hypotrochoid", 40, 17, 12, 0, 0.8);

    expect(flat(ringSquashed)).toBeLessThan(flat(circular));
    expect(flat(wheelSquashed)).toBeLessThan(flat(circular));
  });

  it("clamps eccentricity to its supported range", () => {
    expect(clampEccentricity(-1)).toBe(MIN_ECCENTRICITY);
    expect(clampEccentricity(9999)).toBe(MAX_ECCENTRICITY);
    expect(clampEccentricity(NaN)).toBe(DEFAULT_ECCENTRICITY);
  });

  it("clamps animate speed to its supported range", () => {
    expect(clampAnimateSpeed(0)).toBe(MIN_ANIMATE_SPEED);
    expect(clampAnimateSpeed(9999)).toBe(MAX_ANIMATE_SPEED);
    expect(clampAnimateSpeed(NaN)).toBe(DEFAULT_ANIMATE_SPEED);
  });

  it("clamps R, small r (mode-aware), and pen offset to their supported ranges", () => {
    expect(clampR(0)).toBe(MIN_R);
    expect(clampR(9999)).toBe(MAX_R);
    expect(clampR(NaN)).toBe(DEFAULT_R);

    expect(clampSmallR(0, 40, "hypotrochoid")).toBe(MIN_SMALL_R);
    expect(clampSmallR(9999, 40, "hypotrochoid")).toBe(39); // R-1, not the global max
    expect(clampSmallR(9999, 40, "epitrochoid")).toBe(MAX_SMALL_R);
    expect(clampSmallR(NaN, 40, "hypotrochoid")).toBe(
      Math.min(DEFAULT_SMALL_R, 39)
    );

    expect(clampPenOffset(-5, 10)).toBe(0);
    expect(clampPenOffset(9999, 10)).toBe(15);
    expect(clampPenOffset(NaN, 10)).toBeCloseTo(7.5);
  });
});
