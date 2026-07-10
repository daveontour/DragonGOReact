import { describe, expect, it } from "vitest";
import {
  buildPermutationTable,
  clampDriftSpeed,
  clampNoiseScale,
  clampParticleCount,
  clampSpeed,
  clampTrailAlpha,
  clampTurbulence,
  createFlowField,
  DEFAULT_DRIFT_SPEED,
  DEFAULT_NOISE_SCALE,
  DEFAULT_PARTICLES,
  DEFAULT_SPEED,
  DEFAULT_TRAIL_ALPHA,
  DEFAULT_TURBULENCE,
  FlowFieldState,
  flowAngle,
  MAX_DRIFT_SPEED,
  MAX_NOISE_SCALE,
  MAX_PARTICLES,
  MAX_SPEED,
  MAX_TRAIL_ALPHA,
  MAX_TURBULENCE,
  MIN_DRIFT_SPEED,
  MIN_NOISE_SCALE,
  MIN_PARTICLES,
  MIN_SPEED,
  MIN_TRAIL_ALPHA,
  MIN_TURBULENCE,
  perlin2D,
  stepFlowField,
} from "./flowfields";

describe("flowfields", () => {
  it("builds a valid permutation of 0..255", () => {
    const perm = buildPermutationTable(1);
    const first256 = Array.from(perm.slice(0, 256)).sort((a, b) => a - b);
    expect(first256).toEqual(Array.from({ length: 256 }, (_, i) => i));
  });

  it("is deterministic for the same seed and inputs", () => {
    const perm = buildPermutationTable(5);
    const a = perlin2D(3.14, 2.71, perm);
    const b = perlin2D(3.14, 2.71, perm);
    expect(a).toBe(b);
  });

  it("produces different values for different seeds", () => {
    const permA = buildPermutationTable(1);
    const permB = buildPermutationTable(2);
    expect(perlin2D(3.14, 2.71, permA)).not.toBe(perlin2D(3.14, 2.71, permB));
  });

  it("stays within a sane bound across a grid of samples", () => {
    const perm = buildPermutationTable(9);
    for (let x = 0; x < 20; x++) {
      for (let y = 0; y < 20; y++) {
        const value = perlin2D(x * 0.37, y * 0.53, perm);
        expect(value).toBeGreaterThanOrEqual(-1.5);
        expect(value).toBeLessThanOrEqual(1.5);
      }
    }
  });

  it("is exactly zero at integer lattice points", () => {
    const perm = buildPermutationTable(3);
    expect(perlin2D(4, 7, perm)).toBeCloseTo(0);
    expect(perlin2D(0, 0, perm)).toBeCloseTo(0);
    expect(perlin2D(-2, 5, perm)).toBeCloseTo(0);
  });

  it("computes a deterministic flow angle that changes with scale and time", () => {
    const perm = buildPermutationTable(11);
    const baseParams = { noiseScale: DEFAULT_NOISE_SCALE, angleMultiplier: DEFAULT_TURBULENCE, speed: DEFAULT_SPEED, driftSpeed: DEFAULT_DRIFT_SPEED };
    const a = flowAngle(120, 80, 0, baseParams, perm);
    const b = flowAngle(120, 80, 0, baseParams, perm);
    expect(a).toBe(b);

    const differentScale = flowAngle(120, 80, 0, { ...baseParams, noiseScale: 0.02 }, perm);
    expect(differentScale).not.toBe(a);

    const differentTime = flowAngle(120, 80, 5, baseParams, perm);
    expect(differentTime).not.toBe(a);
  });

  it("moves a particle by exactly speed * dt per step", () => {
    const state: FlowFieldState = {
      particles: [
        { x: 500, y: 500, prevX: 500, prevY: 500, age: 0, life: 1000, hue: 0 },
      ],
      perm: buildPermutationTable(4),
      time: 0,
      width: 1000,
      height: 1000,
    };
    const params = { noiseScale: DEFAULT_NOISE_SCALE, angleMultiplier: DEFAULT_TURBULENCE, speed: 1.5, driftSpeed: 0 };
    const before = { x: state.particles[0].x, y: state.particles[0].y };
    stepFlowField(state, params, 1);
    const after = state.particles[0];
    const displacement = Math.hypot(after.x - before.x, after.y - before.y);
    expect(displacement).toBeCloseTo(1.5);
  });

  it("respawns a particle once it exceeds its life or leaves the canvas", () => {
    const state: FlowFieldState = {
      particles: [
        { x: 500, y: 500, prevX: 500, prevY: 500, age: 999, life: 10, hue: 0 },
      ],
      perm: buildPermutationTable(4),
      time: 0,
      width: 1000,
      height: 1000,
    };
    const params = { noiseScale: DEFAULT_NOISE_SCALE, angleMultiplier: DEFAULT_TURBULENCE, speed: 1.5, driftSpeed: 0 };
    stepFlowField(state, params, 1);
    const particle = state.particles[0];
    expect(particle.age).toBe(0);
    expect(particle.x).toBeGreaterThanOrEqual(0);
    expect(particle.x).toBeLessThanOrEqual(1000);
    expect(particle.y).toBeGreaterThanOrEqual(0);
    expect(particle.y).toBeLessThanOrEqual(1000);
  });

  it("creates the requested number of in-bounds particles", () => {
    const state = createFlowField(400, 300, 50, 1);
    expect(state.particles.length).toBe(50);
    for (const particle of state.particles) {
      expect(particle.x).toBeGreaterThanOrEqual(0);
      expect(particle.x).toBeLessThanOrEqual(400);
      expect(particle.y).toBeGreaterThanOrEqual(0);
      expect(particle.y).toBeLessThanOrEqual(300);
    }
  });

  it("clamps every parameter to its supported range", () => {
    expect(clampParticleCount(0)).toBe(MIN_PARTICLES);
    expect(clampParticleCount(999999)).toBe(MAX_PARTICLES);
    expect(clampParticleCount(NaN)).toBe(DEFAULT_PARTICLES);

    expect(clampNoiseScale(0)).toBe(MIN_NOISE_SCALE);
    expect(clampNoiseScale(999)).toBe(MAX_NOISE_SCALE);
    expect(clampNoiseScale(NaN)).toBe(DEFAULT_NOISE_SCALE);

    expect(clampTurbulence(0)).toBe(MIN_TURBULENCE);
    expect(clampTurbulence(999)).toBe(MAX_TURBULENCE);
    expect(clampTurbulence(NaN)).toBe(DEFAULT_TURBULENCE);

    expect(clampSpeed(0)).toBe(MIN_SPEED);
    expect(clampSpeed(999)).toBe(MAX_SPEED);
    expect(clampSpeed(NaN)).toBe(DEFAULT_SPEED);

    expect(clampDriftSpeed(-1)).toBe(MIN_DRIFT_SPEED);
    expect(clampDriftSpeed(999)).toBe(MAX_DRIFT_SPEED);
    expect(clampDriftSpeed(NaN)).toBe(DEFAULT_DRIFT_SPEED);

    expect(clampTrailAlpha(0)).toBe(MIN_TRAIL_ALPHA);
    expect(clampTrailAlpha(999)).toBe(MAX_TRAIL_ALPHA);
    expect(clampTrailAlpha(NaN)).toBe(DEFAULT_TRAIL_ALPHA);
  });
});
