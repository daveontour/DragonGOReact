import { describe, expect, it } from "vitest";
import {
  boundsOfSegments,
  buildLSystemSegments,
  clampLSystemIterations,
  expandLSystem,
  fitSegmentsToViewport,
  interpretLSystem,
  LSYSTEM_PRESETS,
} from "./lsystems";

describe("lsystems", () => {
  it("expands an axiom using rewrite rules", () => {
    expect(expandLSystem("F", { F: "F+F" }, 0)).toBe("F");
    expect(expandLSystem("F", { F: "F+F" }, 1)).toBe("F+F");
    expect(expandLSystem("F", { F: "F+F" }, 2)).toBe("F+F+F+F");
  });

  it("leaves characters without a rule unchanged", () => {
    expect(expandLSystem("A+B", { A: "AA" }, 1)).toBe("AA+B");
  });

  it("draws a straight line for a single forward command", () => {
    const segments = interpretLSystem("F", 90, 0, ["F"]);
    expect(segments).toHaveLength(1);
    expect(segments[0].x1).toBeCloseTo(0);
    expect(segments[0].y1).toBeCloseTo(0);
    expect(segments[0].x2).toBeCloseTo(1);
    expect(segments[0].y2).toBeCloseTo(0);
  });

  it("turns by the configured angle", () => {
    const segments = interpretLSystem("F+F", 90, 0, ["F"]);
    expect(segments).toHaveLength(2);
    expect(segments[1].x2).toBeCloseTo(1, 5);
    expect(segments[1].y2).toBeCloseTo(1, 5);
  });

  it("restores position and heading with push/pop", () => {
    const segments = interpretLSystem("F[+F]F", 90, 0, ["F"]);
    expect(segments).toHaveLength(3);
    expect(segments[2].x1).toBeCloseTo(1);
    expect(segments[2].y1).toBeCloseTo(0);
  });

  it("clamps iteration counts to the preset range", () => {
    expect(clampLSystemIterations("koch-snowflake", -3)).toBe(0);
    expect(clampLSystemIterations("koch-snowflake", 999)).toBe(
      LSYSTEM_PRESETS["koch-snowflake"].maxIterations
    );
  });

  it("fits segments inside the requested viewport with padding", () => {
    const segments = [{ x1: 0, y1: 0, x2: 10, y2: 10 }];
    const fitted = fitSegmentsToViewport(segments, 100, 100, 10);
    for (const seg of fitted) {
      expect(seg.x1).toBeGreaterThanOrEqual(9);
      expect(seg.x1).toBeLessThanOrEqual(91);
      expect(seg.y1).toBeGreaterThanOrEqual(9);
      expect(seg.y1).toBeLessThanOrEqual(91);
    }
  });

  it("builds a non-empty segment list for every preset", () => {
    for (const id of Object.keys(LSYSTEM_PRESETS) as Array<
      keyof typeof LSYSTEM_PRESETS
    >) {
      const segments = buildLSystemSegments(id, 1);
      expect(segments.length).toBeGreaterThan(0);
    }
  });

  it("computes bounds that contain every segment endpoint", () => {
    const segments = [
      { x1: -2, y1: 3, x2: 5, y2: -1 },
      { x1: 0, y1: 0, x2: 8, y2: 4 },
    ];
    const bounds = boundsOfSegments(segments);
    expect(bounds.minX).toBe(-2);
    expect(bounds.minY).toBe(-1);
    expect(bounds.maxX).toBe(8);
    expect(bounds.maxY).toBe(4);
  });
});
