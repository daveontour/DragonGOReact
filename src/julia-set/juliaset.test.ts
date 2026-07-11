import { describe, expect, it } from "vitest";
import {
  clampJuliaScale,
  colorForSmoothValue,
  DEFAULT_JULIA_VIEW,
  juliaIterations,
  smoothJuliaValue,
  zoomViewAt,
  zoomViewKeepingPoint,
} from "./juliaset";

describe("juliaIterations", () => {
  it("escapes immediately when the starting point is already outside the bailout radius", () => {
    expect(juliaIterations(3, 0, -0.7, 0.27015, 200)).toBe(0);
  });

  it("never escapes for c=0 with a starting point inside the unit disk", () => {
    // z -> z^2 with |z0| < 1 keeps shrinking toward 0, so it stays bounded forever.
    expect(juliaIterations(0.3, 0.1, 0, 0, 500)).toBe(500);
  });

  it("escapes within two iterations for a large starting magnitude regardless of a small c", () => {
    expect(juliaIterations(10, 10, 0.1, 0.1, 200)).toBeLessThanOrEqual(2);
  });
});

describe("smoothJuliaValue", () => {
  it("returns a finite, non-negative value with no NaN near the escape boundary", () => {
    const smooth = smoothJuliaValue(2, 0, -0.7, 0.27015, 200);
    expect(Number.isNaN(smooth)).toBe(false);
    expect(smooth).toBeGreaterThan(0);
  });

  it("returns exactly maxIterations for a point that never escapes", () => {
    expect(smoothJuliaValue(0, 0, 0, 0, 300)).toBe(300);
  });
});

describe("colorForSmoothValue", () => {
  it("colors non-escaping points dark", () => {
    const [r, g, b] = colorForSmoothValue(200, 200);
    expect(r).toBeLessThan(30);
    expect(g).toBeLessThan(30);
    expect(b).toBeLessThan(40);
  });
});

describe("view/zoom helpers", () => {
  it("zooms toward a target point", () => {
    const zoomed = zoomViewAt(DEFAULT_JULIA_VIEW, 0.3, -0.2, 0.5);
    expect(zoomed.centerRe).toBe(0.3);
    expect(zoomed.centerIm).toBe(-0.2);
    expect(zoomed.scale).toBeCloseTo(DEFAULT_JULIA_VIEW.scale * 0.5);
  });

  it("keeps the targeted point fixed on screen when zooming", () => {
    const view = { centerRe: 0.1, centerIm: -0.1, scale: 1 };
    const zoomed = zoomViewKeepingPoint(view, 0.5, 0.5, 0.5);
    // At the anchor point itself, re-deriving the pixel position should
    // still land on (0.5, 0.5) after the zoom.
    const dxBefore = 0.5 - view.centerRe;
    const dyBefore = 0.5 - view.centerIm;
    const dxAfter = 0.5 - zoomed.centerRe;
    const dyAfter = 0.5 - zoomed.centerIm;
    expect(dxAfter).toBeCloseTo(dxBefore * (zoomed.scale / view.scale));
    expect(dyAfter).toBeCloseTo(dyBefore * (zoomed.scale / view.scale));
  });

  it("clamps scale to the valid range", () => {
    expect(clampJuliaScale(0)).toBeGreaterThan(0);
    expect(clampJuliaScale(-5)).toBeGreaterThan(0);
    expect(clampJuliaScale(1e9)).toBeLessThanOrEqual(2.5);
  });
});
