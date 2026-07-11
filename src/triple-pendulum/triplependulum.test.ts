import { describe, expect, it } from "vitest";
import { rk4PendulumStep as rk4DoublePendulumStep } from "../double-pendulum/doublependulum";
import {
  BASE_TIME_STEP,
  rk4TripleStep,
  runTripleSteps,
  totalTripleEnergy,
  TriplePendulumParams,
  TriplePendulumState,
  tripleBobPositions,
  tripleDerivative,
  perturbTripleState,
} from "./triplependulum";

const DEFAULT_PARAMS: TriplePendulumParams = { m: [1, 1, 1], L: [1, 1, 1], g: 9.81 };

describe("totalTripleEnergy conservation (primary correctness gate for the general n-link EOM)", () => {
  it("stays within a small band of its initial value over thousands of RK4 steps", () => {
    const initial: TriplePendulumState = {
      theta: [2.0, 1.0, 0.4],
      omega: [0, 0, 0],
    };
    const startEnergy = totalTripleEnergy(initial, DEFAULT_PARAMS);

    let state = initial;
    let maxDeviation = 0;
    for (let i = 0; i < 5000; i++) {
      state = rk4TripleStep(state, DEFAULT_PARAMS, BASE_TIME_STEP);
      const energy = totalTripleEnergy(state, DEFAULT_PARAMS);
      maxDeviation = Math.max(maxDeviation, Math.abs(energy - startEnergy));
    }

    expect(maxDeviation).toBeLessThan(Math.abs(startEnergy) * 0.02 + 0.05);
  });

  it("also conserves energy for asymmetric masses and lengths", () => {
    const params: TriplePendulumParams = { m: [2.0, 0.6, 1.4], L: [1.2, 0.6, 0.9], g: 9.81 };
    const initial: TriplePendulumState = { theta: [2.6, -1.2, 0.8], omega: [0.4, -0.3, 0.2] };
    const startEnergy = totalTripleEnergy(initial, params);

    const state = runTripleSteps(initial, params, BASE_TIME_STEP, 4000);
    const endEnergy = totalTripleEnergy(state, params);

    expect(Math.abs(endEnergy - startEnergy)).toBeLessThan(Math.abs(startEnergy) * 0.03 + 0.05);
  });
});

describe("cross-check against the independently-validated double pendulum module", () => {
  it("reduces to the double pendulum's theta1/theta2 dynamics as the third mass -> 0", () => {
    // With m3 negligible, the third link exerts no force back on the first
    // two, so the general 3-link mass matrix and forcing vector should
    // collapse onto exactly the closed-form 2-link system for indices 0,1.
    const m3 = 1e-7;
    const tripleParams: TriplePendulumParams = { m: [1, 1, m3], L: [1, 1, 0.7], g: 9.81 };
    const doubleParams = { m1: 1, m2: 1, L1: 1, L2: 1, g: 9.81 };

    let tripleState: TriplePendulumState = { theta: [1.8, -0.6, 0.3], omega: [0, 0, 0] };
    let doubleState = { theta1: 1.8, theta2: -0.6, omega1: 0, omega2: 0 };

    for (let i = 0; i < 500; i++) {
      tripleState = rk4TripleStep(tripleState, tripleParams, BASE_TIME_STEP);
      doubleState = rk4DoublePendulumStep(doubleState, doubleParams, BASE_TIME_STEP);
    }

    expect(tripleState.theta[0]).toBeCloseTo(doubleState.theta1, 2);
    expect(tripleState.theta[1]).toBeCloseTo(doubleState.theta2, 2);
  });
});

describe("tripleDerivative", () => {
  it("is exactly zero at the stable hanging-at-rest equilibrium", () => {
    const rest: TriplePendulumState = { theta: [0, 0, 0], omega: [0, 0, 0] };
    const d = tripleDerivative(rest, DEFAULT_PARAMS);
    for (const v of d.dtheta) expect(v).toBe(0);
    for (const v of d.domega) expect(v).toBeCloseTo(0);
  });
});

describe("rk4TripleStep", () => {
  it("produces finite, near-linear motion for a very small dt", () => {
    const state: TriplePendulumState = { theta: [1, 0.5, -0.3], omega: [0.2, -0.1, 0.05] };
    const next = rk4TripleStep(state, DEFAULT_PARAMS, 1e-6);
    for (const v of [...next.theta, ...next.omega]) {
      expect(Number.isFinite(v)).toBe(true);
    }
    expect(Math.abs(next.theta[0] - state.theta[0])).toBeLessThan(1e-4);
  });
});

describe("tripleBobPositions", () => {
  it("matches direct trigonometry, chaining each bob off the previous one", () => {
    const state: TriplePendulumState = { theta: [Math.PI / 2, 0, Math.PI / 2], omega: [0, 0, 0] };
    const params: TriplePendulumParams = { m: [1, 1, 1], L: [2, 3, 1], g: 9.81 };
    const { x, y } = tripleBobPositions(state, params);
    expect(x[0]).toBeCloseTo(2 * Math.sin(Math.PI / 2));
    expect(y[0]).toBeCloseTo(2 * Math.cos(Math.PI / 2));
    expect(x[1]).toBeCloseTo(x[0] + 3 * Math.sin(0));
    expect(y[1]).toBeCloseTo(y[0] + 3 * Math.cos(0));
    expect(x[2]).toBeCloseTo(x[1] + 1 * Math.sin(Math.PI / 2));
    expect(y[2]).toBeCloseTo(y[1] + 1 * Math.cos(Math.PI / 2));
  });
});

describe("perturbTripleState", () => {
  it("changes only theta[0] by the requested epsilon", () => {
    const state: TriplePendulumState = { theta: [1, 2, 3], omega: [0.1, 0.2, 0.3] };
    const perturbed = perturbTripleState(state, 0.001);
    expect(perturbed.theta[0]).toBeCloseTo(1.001);
    expect(perturbed.theta[1]).toBe(state.theta[1]);
    expect(perturbed.theta[2]).toBe(state.theta[2]);
    expect(perturbed.omega).toEqual(state.omega);
  });
});
