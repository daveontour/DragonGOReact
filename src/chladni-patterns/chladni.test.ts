import { describe, expect, it } from "vitest";
import {
  chladniZ,
  clampMode,
  clampParticleCount,
  clampThreshold,
  CHLADNI_PLATE_COLOR,
  CHLADNI_SAND_COLOR,
  DEFAULT_MODE_N,
  DEFAULT_PARTICLES,
  DEFAULT_THRESHOLD,
  generateSandParticles,
  MAX_MODE,
  MAX_PARTICLES,
  MAX_THRESHOLD,
  MIN_MODE,
  MIN_PARTICLES,
  MIN_THRESHOLD,
  nodalCoverageFraction,
  pixelToPlate,
  renderChladniNodalLines,
  renderChladniSandParticles,
  sandAcceptWeight,
} from "./chladni";

describe("chladni", () => {
  it("is antisymmetric under swapping the two modes", () => {
    expect(chladniZ(3, 5, 0.2, -0.4)).toBeCloseTo(-chladniZ(5, 3, 0.2, -0.4));
  });

  it("is exactly zero everywhere when the two modes are equal", () => {
    for (const [x, y] of [
      [0, 0],
      [0.3, 0.7],
      [-0.9, 0.1],
    ]) {
      expect(chladniZ(4, 4, x, y)).toBeCloseTo(0);
    }
  });

  it("matches a hand-computed value at the plate center", () => {
    expect(chladniZ(1, 2, 0, 0)).toBeCloseTo(0);
  });

  it("maps pixel corners and center to plate coordinates", () => {
    const width = 101;
    const height = 101;
    expect(pixelToPlate(0, 0, width, height)).toEqual({ x: -1, y: -1 });
    expect(pixelToPlate(width - 1, height - 1, width, height)).toEqual({ x: 1, y: 1 });
    const center = pixelToPlate((width - 1) / 2, (height - 1) / 2, width, height);
    expect(center.x).toBeCloseTo(0);
    expect(center.y).toBeCloseTo(0);
  });

  it("clamps mode, threshold, and particle count to their supported ranges", () => {
    expect(clampMode(0)).toBe(MIN_MODE);
    expect(clampMode(999)).toBe(MAX_MODE);
    expect(clampMode(NaN)).toBe(DEFAULT_MODE_N);

    expect(clampThreshold(0)).toBe(MIN_THRESHOLD);
    expect(clampThreshold(999)).toBe(MAX_THRESHOLD);
    expect(clampThreshold(NaN)).toBe(DEFAULT_THRESHOLD);

    expect(clampParticleCount(0)).toBe(MIN_PARTICLES);
    expect(clampParticleCount(999999)).toBe(MAX_PARTICLES);
    expect(clampParticleCount(NaN)).toBe(DEFAULT_PARTICLES);
  });

  it("weighs sand acceptance highest at the nodal line and zero past the threshold", () => {
    expect(sandAcceptWeight(0, 0.1)).toBeCloseTo(1);
    expect(sandAcceptWeight(0.1, 0.1)).toBeCloseTo(0);
    expect(sandAcceptWeight(0.2, 0.1)).toBeCloseTo(0);
    expect(sandAcceptWeight(0.02, 0.1)).toBeGreaterThan(sandAcceptWeight(0.05, 0.1));
  });

  it("generates deterministic particles for a given seed, and different ones for a different seed", () => {
    const a = generateSandParticles(3, 5, 200, 42, 0.15);
    const b = generateSandParticles(3, 5, 200, 42, 0.15);
    const c = generateSandParticles(3, 5, 200, 43, 0.15);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("biases generated particles toward the nodal lines rather than scattering uniformly", () => {
    const n = 3;
    const m = 5;
    const threshold = 0.15;
    const particles = generateSandParticles(n, m, 500, 7, threshold);
    const particleMeanAbsZ =
      particles.reduce((sum, p) => sum + Math.abs(chladniZ(n, m, p.x, p.y)), 0) /
      particles.length;

    const rng = (() => {
      let state = 99;
      return () => {
        state = (state * 48271) % 2147483647;
        return state / 2147483647;
      };
    })();
    let uniformSum = 0;
    const uniformCount = 500;
    for (let i = 0; i < uniformCount; i++) {
      const x = rng() * 2 - 1;
      const y = rng() * 2 - 1;
      uniformSum += Math.abs(chladniZ(n, m, x, y));
    }
    const uniformMeanAbsZ = uniformSum / uniformCount;

    expect(particleMeanAbsZ).toBeLessThan(uniformMeanAbsZ * 0.5);
  });

  it("increases nodal coverage as the threshold widens", () => {
    const width = 60;
    const height = 60;
    const makeImageData = () =>
      ({
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4),
      } as ImageData);

    const narrow = makeImageData();
    renderChladniNodalLines(narrow, 2, 3, 0.08);
    const wide = makeImageData();
    renderChladniNodalLines(wide, 2, 3, 0.35);

    const narrowCoverage = nodalCoverageFraction(narrow);
    const wideCoverage = nodalCoverageFraction(wide);
    expect(narrowCoverage).toBeGreaterThan(0);
    expect(wideCoverage).toBeGreaterThan(narrowCoverage);
  });

  it("plots sand particles only at their rasterized location", () => {
    const width = 10;
    const height = 10;
    const imageData = {
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    } as ImageData;

    renderChladniSandParticles(imageData, [{ x: 0, y: 0 }], 1);

    const centerOffset = (5 * width + 5) * 4;
    expect(imageData.data[centerOffset]).toBe(CHLADNI_SAND_COLOR[0]);
    expect(imageData.data[centerOffset + 1]).toBe(CHLADNI_SAND_COLOR[1]);
    expect(imageData.data[centerOffset + 2]).toBe(CHLADNI_SAND_COLOR[2]);

    const cornerOffset = 0;
    expect(imageData.data[cornerOffset]).toBe(CHLADNI_PLATE_COLOR[0]);
  });
});
