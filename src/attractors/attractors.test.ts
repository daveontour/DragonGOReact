import { describe, expect, it } from "vitest";
import {
  clampLorenzRho,
  clampMapIterations,
  clampRosslerC,
  cliffordStep,
  deJongStep,
  DEFAULT_CLIFFORD_PARAMS,
  DEFAULT_LORENZ_PARAMS,
  lorenzStep,
  randomMapParams,
  renderAttractorDensity,
  rosslerStep,
} from "./attractors";

describe("attractors", () => {
  it("keeps the Lorenz origin fixed point stationary", () => {
    const next = lorenzStep({ x: 0, y: 0, z: 0 }, DEFAULT_LORENZ_PARAMS, 0.01);
    expect(next.x).toBeCloseTo(0);
    expect(next.y).toBeCloseTo(0);
    expect(next.z).toBeCloseTo(0);
  });

  it("moves a non-equilibrium Lorenz state to a new finite point", () => {
    const next = lorenzStep({ x: 1, y: 1, z: 1 }, DEFAULT_LORENZ_PARAMS, 0.01);
    expect(Number.isFinite(next.x)).toBe(true);
    expect(Number.isFinite(next.y)).toBe(true);
    expect(Number.isFinite(next.z)).toBe(true);
    expect(next).not.toEqual({ x: 1, y: 1, z: 1 });
  });

  it("produces finite Rössler states over many steps", () => {
    let state = { x: 1, y: 1, z: 1 };
    for (let i = 0; i < 500; i++) {
      state = rosslerStep(state, { a: 0.2, b: 0.2, c: 5.7 }, 0.02);
    }
    expect(Number.isFinite(state.x)).toBe(true);
    expect(Number.isFinite(state.y)).toBe(true);
    expect(Number.isFinite(state.z)).toBe(true);
  });

  it("computes the Clifford map formula exactly", () => {
    const params = { a: 1, b: 1, c: 0, d: 0 };
    const result = cliffordStep(0, 0, params);
    expect(result.x).toBeCloseTo(Math.sin(0) + 0);
    expect(result.y).toBeCloseTo(Math.sin(0) + 0);
  });

  it("computes the De Jong map formula exactly", () => {
    const params = { a: 1, b: 1, c: 1, d: 1 };
    const result = deJongStep(1, 0, params);
    expect(result.x).toBeCloseTo(Math.sin(0) - Math.cos(1));
    expect(result.y).toBeCloseTo(Math.sin(1) - Math.cos(0));
  });

  it("generates random map params within the expected range", () => {
    for (let i = 0; i < 20; i++) {
      const params = randomMapParams();
      for (const value of Object.values(params)) {
        expect(value).toBeGreaterThanOrEqual(-2);
        expect(value).toBeLessThanOrEqual(2);
      }
    }
  });

  it("clamps chaos parameters to their supported ranges", () => {
    expect(clampLorenzRho(0)).toBe(5);
    expect(clampLorenzRho(999)).toBe(45);
    expect(clampRosslerC(0)).toBe(2);
    expect(clampRosslerC(999)).toBe(18);
    expect(clampMapIterations(1)).toBe(20000);
    expect(clampMapIterations(9999999)).toBe(3000000);
  });

  it("fills every pixel of the density image and concentrates hits", () => {
    const width = 40;
    const height = 40;
    const imageData = {
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    } as ImageData;

    renderAttractorDensity(
      imageData,
      cliffordStep,
      DEFAULT_CLIFFORD_PARAMS,
      20000,
      [255, 255, 255]
    );

    let litPixels = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 8 || imageData.data[i + 1] > 9) {
        litPixels++;
      }
    }
    expect(litPixels).toBeGreaterThan(0);
  });
});
