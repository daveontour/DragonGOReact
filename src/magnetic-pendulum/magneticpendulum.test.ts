import { describe, expect, it } from "vitest";
import {
  BobState,
  defaultMagnets,
  hasConverged,
  Magnet,
  nearestMagnetAfterSettling,
  PENDULUM_HEIGHT,
  PendulumParams,
  SIMULATION_DT,
  SPRING_K,
  stepMagneticPendulum,
} from "./magneticpendulum";

const BASE_PARAMS: PendulumParams = {
  damping: 0.25,
  springK: SPRING_K,
  strength: 1.2,
  height: PENDULUM_HEIGHT,
  dt: SIMULATION_DT,
};

describe("stepMagneticPendulum with magnets off (strength=0)", () => {
  it("spirals toward the origin under pure spring + damping, no fractal structure", () => {
    const params: PendulumParams = { ...BASE_PARAMS, strength: 0 };
    const state: BobState = { x: 0.5, y: 0.3, vx: 0, vy: 0 };
    const startDist = Math.hypot(state.x, state.y);
    for (let i = 0; i < 2000; i++) {
      stepMagneticPendulum(state, [], params);
    }
    const endDist = Math.hypot(state.x, state.y);
    expect(endDist).toBeLessThan(startDist * 0.05);
  });

  it("is non-increasing in mechanical energy step to step (pure damped dissipation)", () => {
    const params: PendulumParams = { ...BASE_PARAMS, strength: 0 };
    const state: BobState = { x: 0.4, y: -0.2, vx: 0.1, vy: 0.05 };
    const energyOf = (s: BobState) =>
      0.5 * (s.vx * s.vx + s.vy * s.vy) + 0.5 * params.springK * (s.x * s.x + s.y * s.y);

    let previousEnergy = energyOf(state);
    for (let i = 0; i < 500; i++) {
      stepMagneticPendulum(state, [], params);
      const energy = energyOf(state);
      // Allow a tiny numerical tolerance for the semi-implicit Euler step.
      expect(energy).toBeLessThanOrEqual(previousEnergy + 1e-6);
      previousEnergy = energy;
    }
  });
});

describe("nearestMagnetAfterSettling", () => {
  it("converges to the single magnet present when there's only one", () => {
    const magnets: Magnet[] = [{ x: 0.3, y: 0.1, color: "#ff0000" }];
    const result = nearestMagnetAfterSettling(0.1, -0.1, magnets, BASE_PARAMS, 2000);
    expect(result).toBe(0);
  });

  it("always resolves to a valid magnet index, never out of range", () => {
    const magnets = defaultMagnets(3);
    for (const [x, y] of [
      [0, 0],
      [0.5, 0.5],
      [-0.4, 0.2],
      [0.6, -0.6],
    ]) {
      const result = nearestMagnetAfterSettling(x, y, magnets, BASE_PARAMS, 600);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(magnets.length);
    }
  });

  it("the symmetric centroid start (equidistant from all magnets) still terminates and resolves to a valid index", () => {
    const magnets = defaultMagnets(3);
    const result = nearestMagnetAfterSettling(0, 0, magnets, BASE_PARAMS, 600);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(magnets.length);
  });
});

describe("hasConverged", () => {
  it("requires both proximity AND low speed — a fast pass-by near a magnet does not count", () => {
    const magnets: Magnet[] = [{ x: 0.3, y: 0.1, color: "#ff0000" }];
    const fastNearMagnet: BobState = { x: 0.31, y: 0.1, vx: 3, vy: 0 };
    expect(hasConverged(fastNearMagnet, magnets, 0.06, 0.05)).toBe(-1);
  });

  it("reports the magnet index when both close and slow", () => {
    const magnets: Magnet[] = [{ x: 0.3, y: 0.1, color: "#ff0000" }];
    const settled: BobState = { x: 0.31, y: 0.1, vx: 0.001, vy: 0.001 };
    expect(hasConverged(settled, magnets, 0.06, 0.05)).toBe(0);
  });
});

describe("defaultMagnets", () => {
  it("places magnets at equal angular spacing around the same radius", () => {
    const magnets = defaultMagnets(4);
    expect(magnets.length).toBe(4);
    const radii = magnets.map((m) => Math.hypot(m.x, m.y));
    for (const r of radii) {
      expect(r).toBeCloseTo(radii[0]);
    }
  });
});
