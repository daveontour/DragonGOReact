import { describe, expect, it } from "vitest";
import {
  addMonteCarloSamples,
  clampSamplesPerFrame,
  clampTargetSamples,
  createMonteCarloPiSimulation,
  estimatePi,
  isInsideUnitCircle,
  MAX_SAMPLES_PER_FRAME,
  MAX_TARGET_SAMPLES,
  MIN_SAMPLES_PER_FRAME,
  MIN_TARGET_SAMPLES,
} from "./monteCarloPi";

describe("monteCarloPi", () => {
  it("classifies points against the unit circle", () => {
    expect(isInsideUnitCircle(0, 0)).toBe(true);
    expect(isInsideUnitCircle(0.6, 0.8)).toBe(true);
    expect(isInsideUnitCircle(1, 1)).toBe(false);
  });

  it("calculates pi from the circle-to-square hit ratio", () => {
    expect(estimatePi(785, 1_000)).toBeCloseTo(3.14, 2);
    expect(estimatePi(0, 0)).toBe(0);
  });

  it("generates deterministic samples and respects the target", () => {
    const first = createMonteCarloPiSimulation(1234);
    const second = createMonteCarloPiSimulation(1234);

    addMonteCarloSamples(first, 100, 75);
    addMonteCarloSamples(second, 75, 75);

    expect(first.points).toEqual(second.points);
    expect(first.insideCount).toBe(second.insideCount);
    expect(first.points).toHaveLength(75);
  });

  it("converges near pi for a large deterministic sample", () => {
    const simulation = createMonteCarloPiSimulation(42);
    addMonteCarloSamples(simulation, 100_000);
    expect(estimatePi(simulation.insideCount, simulation.points.length)).toBeCloseTo(
      Math.PI,
      2
    );
  });

  it("clamps control values", () => {
    expect(clampTargetSamples(0)).toBe(MIN_TARGET_SAMPLES);
    expect(clampTargetSamples(999_999)).toBe(MAX_TARGET_SAMPLES);
    expect(clampSamplesPerFrame(0)).toBe(MIN_SAMPLES_PER_FRAME);
    expect(clampSamplesPerFrame(99_999)).toBe(MAX_SAMPLES_PER_FRAME);
  });
});
