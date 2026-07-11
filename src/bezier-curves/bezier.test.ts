import { describe, expect, it } from "vitest";
import {
  clampControlPointCount,
  deCasteljauLevels,
  defaultControlPoints,
  evaluateBezier,
  MAX_CONTROL_POINTS,
  MIN_CONTROL_POINTS,
  Point,
  sampleBezierCurve,
} from "./bezier";

function cubicBernstein(points: [Point, Point, Point, Point], t: number): Point {
  const mt = 1 - t;
  const b0 = mt * mt * mt;
  const b1 = 3 * mt * mt * t;
  const b2 = 3 * mt * t * t;
  const b3 = t * t * t;
  return {
    x: b0 * points[0].x + b1 * points[1].x + b2 * points[2].x + b3 * points[3].x,
    y: b0 * points[0].y + b1 * points[1].y + b2 * points[2].y + b3 * points[3].y,
  };
}

describe("evaluateBezier endpoints", () => {
  it("t=0 returns the first control point and t=1 returns the last, for every point count 2..6", () => {
    for (let n = MIN_CONTROL_POINTS; n <= MAX_CONTROL_POINTS; n++) {
      const points = defaultControlPoints(n);
      const start = evaluateBezier(points, 0);
      const end = evaluateBezier(points, 1);
      expect(start.x).toBeCloseTo(points[0].x);
      expect(start.y).toBeCloseTo(points[0].y);
      expect(end.x).toBeCloseTo(points[n - 1].x);
      expect(end.y).toBeCloseTo(points[n - 1].y);
    }
  });
});

describe("2-point case degenerates to exact linear interpolation", () => {
  it("matches a direct lerp at several t values", () => {
    const points: Point[] = [{ x: 0, y: 0 }, { x: 10, y: 20 }];
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const p = evaluateBezier(points, t);
      expect(p.x).toBeCloseTo(10 * t);
      expect(p.y).toBeCloseTo(20 * t);
    }
  });
});

describe("De Casteljau matches the direct Bernstein polynomial formula", () => {
  it("agrees with the cubic Bernstein formula for a 4-point curve", () => {
    const points: [Point, Point, Point, Point] = [
      { x: 0, y: 0 },
      { x: 30, y: 90 },
      { x: 70, y: -40 },
      { x: 100, y: 50 },
    ];
    for (const t of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1]) {
      const deCasteljau = evaluateBezier(points, t);
      const bernstein = cubicBernstein(points, t);
      expect(deCasteljau.x).toBeCloseTo(bernstein.x, 6);
      expect(deCasteljau.y).toBeCloseTo(bernstein.y, 6);
    }
  });
});

describe("convex hull invariant", () => {
  it("every sampled curve point stays within the control points' bounding box", () => {
    for (let n = MIN_CONTROL_POINTS; n <= MAX_CONTROL_POINTS; n++) {
      const points = defaultControlPoints(n);
      const minX = Math.min(...points.map((p) => p.x));
      const maxX = Math.max(...points.map((p) => p.x));
      const minY = Math.min(...points.map((p) => p.y));
      const maxY = Math.max(...points.map((p) => p.y));
      const curve = sampleBezierCurve(points);
      for (const p of curve) {
        expect(p.x).toBeGreaterThanOrEqual(minX - 1e-9);
        expect(p.x).toBeLessThanOrEqual(maxX + 1e-9);
        expect(p.y).toBeGreaterThanOrEqual(minY - 1e-9);
        expect(p.y).toBeLessThanOrEqual(maxY + 1e-9);
      }
    }
  });
});

describe("deCasteljauLevels", () => {
  it("returns levels of length N, N-1, ..., 1 for N control points", () => {
    for (let n = MIN_CONTROL_POINTS; n <= MAX_CONTROL_POINTS; n++) {
      const points = defaultControlPoints(n);
      const levels = deCasteljauLevels(points, 0.5);
      expect(levels.length).toBe(n);
      levels.forEach((level, i) => expect(level.length).toBe(n - i));
    }
  });
});

describe("clampControlPointCount", () => {
  it("clamps to the valid range and rounds", () => {
    expect(clampControlPointCount(0)).toBe(MIN_CONTROL_POINTS);
    expect(clampControlPointCount(100)).toBe(MAX_CONTROL_POINTS);
    expect(clampControlPointCount(3.6)).toBe(4);
  });
});
