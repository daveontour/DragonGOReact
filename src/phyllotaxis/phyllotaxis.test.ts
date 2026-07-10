import { describe, expect, it } from "vitest";
import {
  clampAngleDeg,
  clampAnimateSpeed,
  clampDotRadius,
  clampPointCount,
  clampScale,
  colorForPoint,
  DEFAULT_ANGLE_DEG,
  DEFAULT_ANIMATE_SPEED,
  DEFAULT_DOT_RADIUS,
  DEFAULT_POINTS,
  DEFAULT_SCALE,
  generatePhyllotaxisPoints,
  GOLDEN_ANGLE_DEG,
  MAX_ANGLE_DEG,
  MAX_ANIMATE_SPEED,
  MAX_DOT_RADIUS,
  MAX_POINTS,
  MAX_SCALE,
  MIN_ANGLE_DEG,
  MIN_ANIMATE_SPEED,
  MIN_DOT_RADIUS,
  MIN_POINTS,
  MIN_SCALE,
  phyllotaxisPoint,
} from "./phyllotaxis";

describe("phyllotaxis", () => {
  it("places the golden angle just above 137.5 degrees", () => {
    expect(GOLDEN_ANGLE_DEG).toBeCloseTo(137.5077640500378, 5);
  });

  it("places the first seed at the origin regardless of angle", () => {
    const point = phyllotaxisPoint(0, GOLDEN_ANGLE_DEG, 6);
    expect(point.radius).toBe(0);
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(0);
  });

  it("grows radius proportional to the square root of the index", () => {
    const a = phyllotaxisPoint(100, GOLDEN_ANGLE_DEG, 6);
    const b = phyllotaxisPoint(400, GOLDEN_ANGLE_DEG, 6);
    expect(b.radius).toBeCloseTo(a.radius * 2);
  });

  it("wraps the accumulated angle to 0-360 degrees", () => {
    const point = phyllotaxisPoint(5, 137.5, 6);
    const expected = (5 * 137.5) % 360;
    expect(point.angleDeg).toBeCloseTo(expected);
  });

  it("keeps x,y consistent with the reported radius", () => {
    const point = phyllotaxisPoint(37, GOLDEN_ANGLE_DEG, 6);
    expect(Math.hypot(point.x, point.y)).toBeCloseTo(point.radius);
  });

  it("generates exactly the requested number of points, starting at the origin", () => {
    const points = generatePhyllotaxisPoints(250, GOLDEN_ANGLE_DEG, 6);
    expect(points.length).toBe(250);
    expect(points[0].radius).toBe(0);
  });

  it("clamps every parameter to its supported range", () => {
    expect(clampPointCount(0)).toBe(MIN_POINTS);
    expect(clampPointCount(999999)).toBe(MAX_POINTS);
    expect(clampPointCount(NaN)).toBe(DEFAULT_POINTS);

    expect(clampAngleDeg(0)).toBe(MIN_ANGLE_DEG);
    expect(clampAngleDeg(999)).toBe(MAX_ANGLE_DEG);
    expect(clampAngleDeg(NaN)).toBe(DEFAULT_ANGLE_DEG);

    expect(clampScale(0)).toBe(MIN_SCALE);
    expect(clampScale(999)).toBe(MAX_SCALE);
    expect(clampScale(NaN)).toBe(DEFAULT_SCALE);

    expect(clampDotRadius(0)).toBe(MIN_DOT_RADIUS);
    expect(clampDotRadius(999)).toBe(MAX_DOT_RADIUS);
    expect(clampDotRadius(NaN)).toBe(DEFAULT_DOT_RADIUS);

    expect(clampAnimateSpeed(0)).toBe(MIN_ANIMATE_SPEED);
    expect(clampAnimateSpeed(999)).toBe(MAX_ANIMATE_SPEED);
    expect(clampAnimateSpeed(NaN)).toBe(DEFAULT_ANIMATE_SPEED);
  });

  it("returns the same mono color regardless of index or radius", () => {
    const a = colorForPoint(0, 500, 0, 100, "mono");
    const b = colorForPoint(400, 500, 90, 100, "mono");
    expect(a).toBe(b);
  });

  it("varies index-mode color with position in the sequence", () => {
    const first = colorForPoint(0, 500, 0, 100, "index");
    const middle = colorForPoint(250, 500, 50, 100, "index");
    const last = colorForPoint(499, 500, 100, 100, "index");
    expect(first).not.toBe(middle);
    expect(middle).not.toBe(last);
  });

  it("varies radius-mode color between the center and the outer edge", () => {
    const center = colorForPoint(0, 500, 0, 100, "radius");
    const edge = colorForPoint(499, 500, 100, 100, "radius");
    expect(center).not.toBe(edge);
  });
});
