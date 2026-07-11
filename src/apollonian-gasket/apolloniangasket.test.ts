import { describe, expect, it } from "vitest";
import {
  Circle,
  generateGasket,
  nextCircleByVieta,
  seedGasket,
  solveFourthCircle,
} from "./apolloniangasket";

function dist(a: Circle, b: Circle): number {
  return Math.hypot(b.re - a.re, b.im - a.im);
}

function isTangent(a: Circle, b: Circle, tolerance = 1e-6): boolean {
  const d = dist(a, b);
  const ra = 1 / a.k;
  const rb = 1 / b.k;
  // Internally tangent (one circle's negative curvature encloses the
  // other) means the center distance equals the DIFFERENCE of radii;
  // externally tangent circles have distance equal to the SUM.
  return Math.abs(d - Math.abs(ra + rb)) < tolerance || Math.abs(d - Math.abs(ra - rb)) < tolerance;
}

describe("seedGasket", () => {
  it("produces four pairwise-tangent circles matching the canonical (-1,2,2,3) example", () => {
    const [outer, inner1, inner2, top] = seedGasket(1);
    expect(outer.k).toBeCloseTo(-1);
    expect(inner1.k).toBeCloseTo(2);
    expect(inner2.k).toBeCloseTo(2);
    expect(top.k).toBeCloseTo(3);
    expect(top.re).toBeCloseTo(0);
    expect(Math.abs(top.im)).toBeCloseTo(2 / 3);

    expect(isTangent(outer, inner1)).toBe(true);
    expect(isTangent(outer, inner2)).toBe(true);
    expect(isTangent(inner1, inner2)).toBe(true);
    expect(isTangent(outer, top)).toBe(true);
    expect(isTangent(inner1, top)).toBe(true);
    expect(isTangent(inner2, top)).toBe(true);
  });
});

describe("nextCircleByVieta", () => {
  it("jumping away from the top circle reproduces the mirror-image bottom circle", () => {
    const [outer, inner1, inner2, top] = seedGasket(1);
    const bottom = nextCircleByVieta(outer, inner1, inner2, top);
    expect(bottom.k).toBeCloseTo(top.k);
    expect(bottom.re).toBeCloseTo(top.re);
    expect(bottom.im).toBeCloseTo(-top.im);
  });

  it("round-trip: jumping away from the newly found circle reproduces the original", () => {
    const [outer, inner1, inner2, top] = seedGasket(1);
    const bottom = nextCircleByVieta(outer, inner1, inner2, top);
    const backAgain = nextCircleByVieta(outer, inner1, inner2, bottom);
    expect(backAgain.k).toBeCloseTo(top.k);
    expect(backAgain.re).toBeCloseTo(top.re);
    expect(backAgain.im).toBeCloseTo(top.im);
  });

  it("a Vieta-jumped circle is exactly tangent to all three of its triple", () => {
    const [outer, inner1, inner2, top] = seedGasket(1);
    const bottom = nextCircleByVieta(outer, inner1, inner2, top);
    expect(isTangent(outer, bottom)).toBe(true);
    expect(isTangent(inner1, bottom)).toBe(true);
    expect(isTangent(inner2, bottom)).toBe(true);
  });
});

describe("solveFourthCircle", () => {
  it("the two sign choices are exact mirror images across the diameter", () => {
    const [outer, inner1, inner2] = seedGasket(1);
    const plus = solveFourthCircle(outer, inner1, inner2, 1);
    const minus = solveFourthCircle(outer, inner1, inner2, -1);
    expect(plus.re).toBeCloseTo(minus.re);
    expect(plus.im).toBeCloseTo(-minus.im);
  });
});

describe("generateGasket", () => {
  it("terminates (returns a finite, bounded list) for a very small minRadiusFraction", () => {
    const circles = generateGasket(1, 0.001, 12);
    expect(circles.length).toBeGreaterThan(4);
    expect(Number.isFinite(circles.length)).toBe(true);
    expect(circles.length).toBeLessThan(200_000);
  });

  it("every generated circle is tangent to at least the outer circle's curvature sign convention (finite, valid radius)", () => {
    const circles = generateGasket(1, 0.005, 8);
    for (const circle of circles) {
      const radius = Math.abs(1 / circle.k);
      expect(Number.isFinite(radius)).toBe(true);
      expect(radius).toBeGreaterThan(0);
    }
  });

  it("produces more circles at greater depth (monotonic growth in packing density)", () => {
    const shallow = generateGasket(1, 0.005, 4);
    const deep = generateGasket(1, 0.005, 10);
    expect(deep.length).toBeGreaterThan(shallow.length);
  });

  it("is deterministic for the same parameters", () => {
    const a = generateGasket(1, 0.003, 9);
    const b = generateGasket(1, 0.003, 9);
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(a[i].k).toBeCloseTo(b[i].k);
    }
  });
});
