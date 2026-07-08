import { describe, expect, it } from "vitest";
import {
  clampPointCount,
  generateRandomPoints,
  lloydRelax,
  nearestPointIndex,
  palette,
  renderVoronoi,
} from "./voronoi";

describe("voronoi", () => {
  it("finds the nearest point index by Euclidean distance", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(nearestPointIndex(1, 1, points)).toBe(0);
    expect(nearestPointIndex(9, 9, points)).toBe(1);
  });

  it("generates the requested number of points within bounds", () => {
    const points = generateRandomPoints(20, 100, 50);
    expect(points).toHaveLength(20);
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(100);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(50);
    }
  });

  it("clamps point counts to the supported range", () => {
    expect(clampPointCount(1)).toBe(3);
    expect(clampPointCount(1000)).toBe(48);
  });

  it("produces distinct colors for each point", () => {
    const colors = palette(5);
    const unique = new Set(colors.map((c) => c.join(",")));
    expect(unique.size).toBe(5);
  });

  it("colors every pixel with its nearest point's color", () => {
    const points = [
      { x: 0, y: 2 },
      { x: 4, y: 2 },
    ];
    const imageData = {
      width: 4,
      height: 4,
      data: new Uint8ClampedArray(4 * 4 * 4),
    } as ImageData;
    renderVoronoi(imageData, points, false);
    const leftColor = points.length ? palette(2)[0] : [0, 0, 0];
    const offset = (2 * 4 + 0) * 4;
    expect(imageData.data[offset]).toBe(leftColor[0]);
  });

  it("moves points toward the centroid of their region when relaxed", () => {
    const points = [{ x: 0, y: 0 }];
    const relaxed = lloydRelax(points, 10, 10, 1);
    expect(relaxed[0].x).toBeCloseTo(4.5, 0);
    expect(relaxed[0].y).toBeCloseTo(4.5, 0);
  });
});
