import { describe, expect, it } from "vitest";
import {
  bobPositions,
  BASE_TIME_STEP,
  pendulumDerivative,
  PendulumParams,
  PendulumState,
  perturbState,
  rk4PendulumStep,
  runPendulumSteps,
  totalPendulumEnergy,
} from "./doublependulum";

const DEFAULT_PARAMS: PendulumParams = { m1: 1, m2: 1, L1: 1, L2: 1, g: 9.81 };

describe("totalPendulumEnergy conservation (primary correctness gate for the EOM)", () => {
  it("stays within a small band of its initial value over thousands of RK4 steps", () => {
    const initial: PendulumState = { theta1: 2.0, theta2: 1.0, omega1: 0, omega2: 0 };
    const startEnergy = totalPendulumEnergy(initial, DEFAULT_PARAMS);

    let state = initial;
    let maxDeviation = 0;
    for (let i = 0; i < 5000; i++) {
      state = rk4PendulumStep(state, DEFAULT_PARAMS, BASE_TIME_STEP);
      const energy = totalPendulumEnergy(state, DEFAULT_PARAMS);
      maxDeviation = Math.max(maxDeviation, Math.abs(energy - startEnergy));
    }

    // A sign error in the equations of motion causes energy to run away or
    // decay monotonically; a correct implementation only drifts a little
    // from RK4's non-symplectic integration error over this many steps.
    expect(maxDeviation).toBeLessThan(Math.abs(startEnergy) * 0.02 + 0.05);
  });

  it("also conserves energy for an asymmetric-mass, asymmetric-length configuration", () => {
    const params: PendulumParams = { m1: 2.5, m2: 0.6, L1: 1.4, L2: 0.7, g: 9.81 };
    const initial: PendulumState = { theta1: 2.6, theta2: -1.2, omega1: 0.4, omega2: -0.3 };
    const startEnergy = totalPendulumEnergy(initial, params);

    const state = runPendulumSteps(initial, params, BASE_TIME_STEP, 4000);
    const endEnergy = totalPendulumEnergy(state, params);

    expect(Math.abs(endEnergy - startEnergy)).toBeLessThan(Math.abs(startEnergy) * 0.03 + 0.05);
  });
});

describe("pendulumDerivative", () => {
  it("is exactly zero at the stable hanging-at-rest equilibrium", () => {
    const rest: PendulumState = { theta1: 0, theta2: 0, omega1: 0, omega2: 0 };
    const d = pendulumDerivative(rest, DEFAULT_PARAMS);
    expect(d.dtheta1).toBe(0);
    expect(d.dtheta2).toBe(0);
    // Arithmetic through sin(0)*... can yield -0, which is mathematically
    // zero but fails Object.is-based toBe(0); toBeCloseTo treats them equal.
    expect(d.domega1).toBeCloseTo(0);
    expect(d.domega2).toBeCloseTo(0);
  });

  it("reduces to the simple-pendulum small-angle equation as m2 -> 0", () => {
    const params: PendulumParams = { m1: 1, m2: 0.0001, L1: 1, L2: 1, g: 9.81 };
    const theta1 = 0.05;
    const state: PendulumState = { theta1, theta2: 0.3, omega1: 0, omega2: 0 };
    const d = pendulumDerivative(state, params);
    // theta1'' ~= -(g/L1) * sin(theta1) ~= -(g/L1) * theta1 for small theta1,
    // independent of theta2 once m2 is negligible.
    const expected = -(params.g / params.L1) * Math.sin(theta1);
    expect(d.domega1).toBeCloseTo(expected, 3);
  });
});

describe("rk4PendulumStep", () => {
  it("produces finite, near-linear motion for a very small dt", () => {
    const state: PendulumState = { theta1: 1, theta2: 0.5, omega1: 0.2, omega2: -0.1 };
    const next = rk4PendulumStep(state, DEFAULT_PARAMS, 1e-6);
    expect(Number.isFinite(next.theta1)).toBe(true);
    expect(Number.isFinite(next.theta2)).toBe(true);
    expect(Number.isFinite(next.omega1)).toBe(true);
    expect(Number.isFinite(next.omega2)).toBe(true);
    expect(Math.abs(next.theta1 - state.theta1)).toBeLessThan(1e-4);
  });
});

describe("bobPositions", () => {
  it("matches direct trigonometry for a fixed angle pair", () => {
    const state: PendulumState = { theta1: Math.PI / 2, theta2: 0, omega1: 0, omega2: 0 };
    const params: PendulumParams = { m1: 1, m2: 1, L1: 2, L2: 3, g: 9.81 };
    const { x1, y1, x2, y2 } = bobPositions(state, params);
    expect(x1).toBeCloseTo(2 * Math.sin(Math.PI / 2));
    expect(y1).toBeCloseTo(2 * Math.cos(Math.PI / 2));
    expect(x2).toBeCloseTo(x1 + 3 * Math.sin(0));
    expect(y2).toBeCloseTo(y1 + 3 * Math.cos(0));
  });
});

describe("perturbState", () => {
  it("changes only theta1 by the requested epsilon", () => {
    const state: PendulumState = { theta1: 1, theta2: 2, omega1: 0.1, omega2: 0.2 };
    const perturbed = perturbState(state, 0.001);
    expect(perturbed.theta1).toBeCloseTo(1.001);
    expect(perturbed.theta2).toBe(state.theta2);
    expect(perturbed.omega1).toBe(state.omega1);
    expect(perturbed.omega2).toBe(state.omega2);
  });
});
