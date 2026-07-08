import { describe, expect, it } from "vitest";
import {
  clampPenroseDivisions,
  createSunTriangles,
  fitTrianglesToViewport,
  generatePenroseTriangles,
  subdivide,
  subdivideTriangle,
} from "./penrose";

describe("penrose", () => {
  it("creates ten thick triangles radiating from the origin", () => {
    const triangles = createSunTriangles();
    expect(triangles).toHaveLength(10);
    for (const t of triangles) {
      expect(t.color).toBe(1);
      expect(t.a).toEqual({ x: 0, y: 0 });
    }
  });

  it("splits a thin triangle into one thin and one thick child", () => {
    const t = {
      color: 0 as const,
      a: { x: 0, y: 0 },
      b: { x: 1, y: 0 },
      c: { x: 0, y: 1 },
    };
    const children = subdivideTriangle(t);
    expect(children).toHaveLength(2);
    expect(children.map((c) => c.color).sort()).toEqual([0, 1]);
    for (const child of children) {
      expect(Number.isFinite(child.a.x)).toBe(true);
      expect(Number.isFinite(child.b.y)).toBe(true);
    }
  });

  it("splits a thick triangle into two thick and one thin child", () => {
    const t = {
      color: 1 as const,
      a: { x: 0, y: 0 },
      b: { x: 1, y: 0 },
      c: { x: 0, y: 1 },
    };
    const children = subdivideTriangle(t);
    expect(children).toHaveLength(3);
    expect(children.filter((c) => c.color === 1)).toHaveLength(2);
    expect(children.filter((c) => c.color === 0)).toHaveLength(1);
  });

  it("grows the triangle count with each subdivision pass", () => {
    let triangles = createSunTriangles();
    const counts = [triangles.length];
    for (let i = 0; i < 3; i++) {
      triangles = subdivide(triangles);
      counts.push(triangles.length);
    }
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThan(counts[i - 1]);
    }
  });

  it("returns the unsubdivided sun for zero divisions", () => {
    const triangles = generatePenroseTriangles(0);
    expect(triangles).toEqual(createSunTriangles());
  });

  it("clamps division counts to the supported range", () => {
    expect(clampPenroseDivisions(-2)).toBe(0);
    expect(clampPenroseDivisions(99)).toBe(8);
  });

  it("fits triangles within the padded viewport", () => {
    const triangles = generatePenroseTriangles(2);
    const fitted = fitTrianglesToViewport(triangles, 200, 200, 10);
    for (const t of fitted) {
      for (const p of [t.a, t.b, t.c]) {
        expect(p.x).toBeGreaterThanOrEqual(9);
        expect(p.x).toBeLessThanOrEqual(191);
        expect(p.y).toBeGreaterThanOrEqual(9);
        expect(p.y).toBeLessThanOrEqual(191);
      }
    }
  });
});
