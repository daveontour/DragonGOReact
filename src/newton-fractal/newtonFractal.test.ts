import { describe, expect, it } from "vitest";
import {
  clampNewtonDegree,
  clampNewtonIterations,
  colorForResult,
  DEFAULT_NEWTON_VIEW,
  evaluatePolynomial,
  newtonIterate,
  rootsOfUnity,
  zoomNewtonViewAt,
} from "./newtonFractal";

describe("newtonFractal", () => {
  it("computes the correct roots of unity", () => {
    const roots = rootsOfUnity(4);
    expect(roots).toHaveLength(4);
    expect(roots[0].re).toBeCloseTo(1);
    expect(roots[0].im).toBeCloseTo(0);
    expect(roots[1].re).toBeCloseTo(0, 5);
    expect(roots[1].im).toBeCloseTo(1, 5);
  });

  it("evaluates z^n - 1 as zero at a root of unity", () => {
    const { value } = evaluatePolynomial({ re: 1, im: 0 }, 3);
    expect(value.re).toBeCloseTo(0);
    expect(value.im).toBeCloseTo(0);
  });

  it("converges to the nearest root of unity from a point close to it", () => {
    const roots = rootsOfUnity(3);
    const result = newtonIterate(0.9, 0.1, 3, 30, roots);
    expect(result.rootIndex).toBe(0);
    expect(result.iterations).toBeGreaterThan(0);
  });

  it("converges to different roots depending on starting point", () => {
    const roots = rootsOfUnity(3);
    const near120 = newtonIterate(-0.4, 0.9, 3, 30, roots);
    expect(near120.rootIndex).toBe(1);
  });

  it("clamps degree and iteration counts to supported ranges", () => {
    expect(clampNewtonDegree(1)).toBe(2);
    expect(clampNewtonDegree(99)).toBe(6);
    expect(clampNewtonIterations(0)).toBe(4);
    expect(clampNewtonIterations(999)).toBe(60);
  });

  it("assigns a distinct dark color when a point fails to converge", () => {
    const [r, g, b] = colorForResult({ rootIndex: -1, iterations: 24 }, 24);
    expect(r).toBeLessThan(20);
    expect(g).toBeLessThan(20);
    expect(b).toBeLessThan(20);
  });

  it("zooms the view toward a target point", () => {
    const zoomed = zoomNewtonViewAt(DEFAULT_NEWTON_VIEW, 0.5, -0.25, 0.5);
    expect(zoomed.centerRe).toBe(0.5);
    expect(zoomed.centerIm).toBe(-0.25);
    expect(zoomed.scale).toBeCloseTo(DEFAULT_NEWTON_VIEW.scale * 0.5);
  });
});
