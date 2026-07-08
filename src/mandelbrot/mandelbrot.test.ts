import { describe, expect, it } from "vitest";
import {
  colorForSmoothValue,
  DEFAULT_MANDELBROT_VIEW,
  mandelbrotIterations,
  smoothMandelbrotValue,
  zoomViewAt,
} from "./mandelbrot";

describe("mandelbrot", () => {
  it("marks a point inside the main cardioid as in-set", () => {
    expect(mandelbrotIterations(-0.5, 0, 200)).toBe(200);
  });

  it("escapes quickly outside the set", () => {
    expect(mandelbrotIterations(2, 0, 200)).toBeLessThan(10);
  });

  it("zooms toward a target point", () => {
    const zoomed = zoomViewAt(DEFAULT_MANDELBROT_VIEW, -0.75, 0.1, 0.5);
    expect(zoomed.centerRe).toBe(-0.75);
    expect(zoomed.scale).toBeCloseTo(DEFAULT_MANDELBROT_VIEW.scale * 0.5);
  });

  it("colors interior points dark", () => {
    const [r, g, b] = colorForSmoothValue(200, 200);
    expect(r).toBeLessThan(30);
    expect(g).toBeLessThan(30);
    expect(b).toBeLessThan(40);
  });

  it("returns smooth values between integer escapes", () => {
    const smooth = smoothMandelbrotValue(2, 0, 200);
    expect(smooth).toBeGreaterThan(0);
    expect(smooth).toBeLessThan(10);
  });
});
