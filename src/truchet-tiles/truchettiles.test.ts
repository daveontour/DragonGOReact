import { describe, expect, it } from "vitest";
import {
  arcsForTile,
  clampGridSize,
  clampLineWidth,
  generateTruchetGrid,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  orientationCountFor,
} from "./truchettiles";

describe("clampGridSize", () => {
  it("clamps to the valid range", () => {
    expect(clampGridSize(0)).toBe(MIN_GRID_SIZE);
    expect(clampGridSize(1000)).toBe(MAX_GRID_SIZE);
    expect(clampGridSize(Number.NaN)).toBeGreaterThanOrEqual(MIN_GRID_SIZE);
  });
});

describe("clampLineWidth", () => {
  it("clamps to the valid range", () => {
    expect(clampLineWidth(-5)).toBeGreaterThan(0);
    expect(clampLineWidth(999)).toBeLessThanOrEqual(8);
  });
});

describe("orientationCountFor", () => {
  it("gives arcs/diagonal two orientations and smith four", () => {
    expect(orientationCountFor("arcs")).toBe(2);
    expect(orientationCountFor("diagonal")).toBe(2);
    expect(orientationCountFor("smith")).toBe(4);
  });
});

describe("generateTruchetGrid", () => {
  it("produces exactly cols*rows orientation entries", () => {
    const grid = generateTruchetGrid(5, 7, "arcs", 42);
    expect(grid.orientations.length).toBe(35);
    expect(grid.cols).toBe(5);
    expect(grid.rows).toBe(7);
  });

  it("keeps every orientation within the style's valid range", () => {
    const gridArcs = generateTruchetGrid(10, 10, "arcs", 7);
    for (const o of gridArcs.orientations) {
      expect(o).toBeLessThan(2);
    }
    const gridSmith = generateTruchetGrid(10, 10, "smith", 7);
    for (const o of gridSmith.orientations) {
      expect(o).toBeLessThan(4);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generateTruchetGrid(8, 8, "arcs", 123);
    const b = generateTruchetGrid(8, 8, "arcs", 123);
    expect(Array.from(a.orientations)).toEqual(Array.from(b.orientations));
  });

  it("changing tile size does not affect the orientation array itself", () => {
    const grid = generateTruchetGrid(6, 6, "diagonal", 99);
    expect(grid.orientations.length).toBe(36);
  });
});

describe("arcsForTile mirror-image property", () => {
  it("orientation 0 and 1 use mirrored corner pairs", () => {
    const orientation0 = arcsForTile(10, 20, 30, 0, "arcs");
    const orientation1 = arcsForTile(10, 20, 30, 1, "arcs");

    expect(orientation0).toEqual([
      { cx: 10, cy: 20, start: 0, end: Math.PI / 2 },
      { cx: 40, cy: 50, start: Math.PI, end: (3 * Math.PI) / 2 },
    ]);
    expect(orientation1).toEqual([
      { cx: 40, cy: 20, start: Math.PI / 2, end: Math.PI },
      { cx: 10, cy: 50, start: (3 * Math.PI) / 2, end: 2 * Math.PI },
    ]);
  });

  it("returns no arcs for the diagonal style", () => {
    expect(arcsForTile(0, 0, 10, 0, "diagonal")).toEqual([]);
  });

  it("smith style rotates a single-corner motif through all four corners", () => {
    const corners = [0, 1, 2, 3].map((o) => {
      const arc = arcsForTile(0, 0, 10, o, "smith")[0];
      return `${arc.cx},${arc.cy}`;
    });
    expect(new Set(corners).size).toBe(4);
  });
});
