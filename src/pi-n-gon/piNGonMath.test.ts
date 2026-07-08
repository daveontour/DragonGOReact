import { describe, expect, it } from "vitest";
import {
  calculatePiBounds,
  clampNGonSides,
  circumscribedNGonVertices,
  estimatePiInscribed,
  estimatePiLowerBound,
  estimatePiUpperBound,
  inscribedNGonVertices,
  polygonPath,
} from "./piNGonMath";

describe("piNGonMath", () => {
  it("brackets pi with a hexagon", () => {
    const bounds = calculatePiBounds(6);
    expect(bounds.lower).toBeCloseTo(3, 10);
    expect(bounds.upper).toBeCloseTo(6 / Math.sqrt(3), 10);
    expect(bounds.lower).toBeLessThan(Math.PI);
    expect(bounds.upper).toBeGreaterThan(Math.PI);
  });

  it("tightens the bracket as n increases", () => {
    const small = calculatePiBounds(6);
    const large = calculatePiBounds(1000);
    expect(large.upper - large.lower).toBeLessThan(small.upper - small.lower);
    expect(large.lower).toBeCloseTo(Math.PI, 3);
    expect(large.upper).toBeCloseTo(Math.PI, 3);
  });

  it("keeps inscribed estimate as lower bound alias", () => {
    expect(estimatePiInscribed(8)).toBe(estimatePiLowerBound(8));
  });

  it("builds closed polygon paths", () => {
    const inner = polygonPath(inscribedNGonVertices(4, 0, 0, 1));
    const outer = polygonPath(circumscribedNGonVertices(4, 0, 0, 1));
    expect(inner.endsWith(" Z")).toBe(true);
    expect(outer.endsWith(" Z")).toBe(true);
  });

  it("places circumscribed vertices outside the unit circle", () => {
    const outer = circumscribedNGonVertices(6, 0, 0, 1);
    for (const vertex of outer) {
      const distance = Math.hypot(vertex.x, vertex.y);
      expect(distance).toBeGreaterThan(1);
      expect(distance).toBeCloseTo(1 / Math.cos(Math.PI / 6), 5);
    }
  });

  it("clamps side count", () => {
    expect(clampNGonSides(2)).toBe(3);
    expect(clampNGonSides(99999)).toBe(5000);
  });

  it("upper bound exceeds lower bound for all valid n", () => {
    for (const n of [3, 4, 6, 12, 100]) {
      expect(estimatePiUpperBound(n)).toBeGreaterThan(estimatePiLowerBound(n));
    }
  });
});
