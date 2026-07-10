import { describe, expect, it } from "vitest";
import {
  clampDamping,
  clampFrequency,
  clampPhase,
  DEFAULT_DAMPING,
  DEFAULT_F1,
  DEFAULT_P1,
  generateHarmonographPoints,
  harmonographDecayEnvelope,
  harmonographPoint,
  HARMONOGRAPH_MAX_SAMPLES,
  HARMONOGRAPH_SAMPLES_PER_CYCLE,
  HarmonographParams,
  MAX_DAMPING,
  MAX_FREQUENCY,
  MAX_PHASE,
  MIN_DAMPING,
  MIN_FREQUENCY,
  MIN_PHASE,
  randomHarmonographParams,
} from "./harmonograph";

describe("harmonograph", () => {
  it("has no decay at t=0 regardless of damping", () => {
    expect(harmonographDecayEnvelope(0, 0.0001)).toBe(1);
    expect(harmonographDecayEnvelope(0, 0.02)).toBe(1);
  });

  it("starts exactly at (sin p1, sin p3) since t=0 collapses both undamped second terms to zero", () => {
    const params: HarmonographParams = {
      f1: 3,
      p1: 0.7,
      f2: 5,
      f3: 2,
      p3: 1.4,
      f4: 6,
      damping: 0.005,
    };
    const point = harmonographPoint(0, params);
    expect(point.x).toBeCloseTo(Math.sin(0.7));
    expect(point.y).toBeCloseTo(Math.sin(1.4));
  });

  it("terminates well before the sample budget at high damping with a low fastest-frequency", () => {
    const params: HarmonographParams = {
      f1: 1,
      p1: 0,
      f2: 1,
      f3: 1,
      p3: 0,
      f4: 1,
      damping: MAX_DAMPING,
    };
    const points = generateHarmonographPoints(params);
    expect(points.length).toBeLessThan(HARMONOGRAPH_MAX_SAMPLES);
  });

  it("hits the sample budget at very low damping, staying bounded in amplitude", () => {
    const params: HarmonographParams = {
      f1: 3,
      p1: 0,
      f2: 3.01,
      f3: 2,
      p3: 0,
      f4: 2.02,
      damping: MIN_DAMPING,
    };
    const points = generateHarmonographPoints(params);
    expect(points.length).toBe(HARMONOGRAPH_MAX_SAMPLES);
    for (const point of points) {
      expect(Math.abs(point.x)).toBeLessThan(2.1);
      expect(Math.abs(point.y)).toBeLessThan(2.1);
    }
  });

  it("keeps the per-sample angular step bounded regardless of frequency (regression guard against aliasing)", () => {
    for (const fMax of [1, 6, 12]) {
      const dt = ((2 * Math.PI) / fMax) / HARMONOGRAPH_SAMPLES_PER_CYCLE;
      expect(fMax * dt).toBeLessThan((2 * Math.PI) / 8);
    }
  });

  it("keeps randomized params within their supported ranges", () => {
    let seed = 12345;
    const rng = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 20; i++) {
      const params = randomHarmonographParams(rng);
      expect(params.f1).toBeGreaterThanOrEqual(MIN_FREQUENCY);
      expect(params.f2).toBeLessThanOrEqual(MAX_FREQUENCY);
      expect(params.f3).toBeGreaterThanOrEqual(MIN_FREQUENCY);
      expect(params.f4).toBeLessThanOrEqual(MAX_FREQUENCY);
      expect(params.damping).toBeGreaterThanOrEqual(MIN_DAMPING);
      expect(params.damping).toBeLessThanOrEqual(MAX_DAMPING);
    }
  });

  it("clamps frequency, phase, and damping to their supported ranges", () => {
    expect(clampFrequency(0)).toBe(MIN_FREQUENCY);
    expect(clampFrequency(9999)).toBe(MAX_FREQUENCY);
    expect(clampFrequency(NaN)).toBe(DEFAULT_F1);

    expect(clampPhase(-1)).toBe(MIN_PHASE);
    expect(clampPhase(9999)).toBe(MAX_PHASE);
    expect(clampPhase(NaN)).toBe(DEFAULT_P1);

    expect(clampDamping(0)).toBe(MIN_DAMPING);
    expect(clampDamping(9999)).toBe(MAX_DAMPING);
    expect(clampDamping(NaN)).toBe(DEFAULT_DAMPING);
  });
});
