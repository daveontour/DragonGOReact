import { describe, expect, it } from "vitest";
import {
  clampBodyCount,
  clampNBodyTimescale,
  createRandomNBodySystem,
  stepNBodySimulation,
  systemExtent,
  totalMomentum,
} from "./nbody";

describe("nbody", () => {
  it("creates the requested number of bodies", () => {
    const sim = createRandomNBodySystem(5);
    expect(sim.bodies).toHaveLength(5);
    expect(sim.time).toBe(0);
  });

  it("advances simulation time on each step", () => {
    const sim = createRandomNBodySystem(3);
    stepNBodySimulation(sim, 0.1);
    expect(sim.time).toBeCloseTo(0.1);
  });

  it("pulls two bodies toward each other under gravity", () => {
    const sim = {
      bodies: [
        { id: 0, x: -50, y: 0, vx: 0, vy: 0, mass: 100, radius: 5, color: "#fff" },
        { id: 1, x: 50, y: 0, vx: 0, vy: 0, mass: 100, radius: 5, color: "#fff" },
      ],
      time: 0,
    };
    stepNBodySimulation(sim, 0.05);
    expect(sim.bodies[0].vx).toBeGreaterThan(0);
    expect(sim.bodies[1].vx).toBeLessThan(0);
  });

  it("keeps a symmetric two-body system's momentum near zero", () => {
    const sim = {
      bodies: [
        { id: 0, x: -50, y: 0, vx: 0, vy: 5, mass: 100, radius: 5, color: "#fff" },
        { id: 1, x: 50, y: 0, vx: 0, vy: -5, mass: 100, radius: 5, color: "#fff" },
      ],
      time: 0,
    };
    const { px, py } = totalMomentum(sim);
    expect(px).toBeCloseTo(0);
    expect(py).toBeCloseTo(0);
  });

  it("computes system extent covering the farthest body", () => {
    const sim = {
      bodies: [
        { id: 0, x: 0, y: 0, vx: 0, vy: 0, mass: 10, radius: 5, color: "#fff" },
        { id: 1, x: 300, y: 0, vx: 0, vy: 0, mass: 10, radius: 5, color: "#fff" },
      ],
      time: 0,
    };
    expect(systemExtent(sim)).toBeGreaterThanOrEqual(305);
  });

  it("clamps body count and timescale to supported ranges", () => {
    expect(clampBodyCount(1)).toBe(2);
    expect(clampBodyCount(50)).toBe(8);
    expect(clampNBodyTimescale(0)).toBe(0.1);
    expect(clampNBodyTimescale(10)).toBe(3);
  });
});
