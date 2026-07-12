import { describe, expect, it } from "vitest";
import {
  clampMassB,
  createElasticCollisionSimulation,
  elasticCollisionVelocities,
  stepElasticCollision,
  totalKineticEnergy,
  totalMomentum,
  MAX_MASS_B,
} from "./elasticCollisions";

describe("elasticCollisions", () => {
  it("swaps velocities for equal masses", () => {
    expect(elasticCollisionVelocities(2, 0.3, 2, -0.1)).toEqual([
      -0.1, 0.3,
    ]);
  });

  it("conserves momentum and kinetic energy in a body collision", () => {
    const simulation = createElasticCollisionSimulation({
      massA: 3,
      massB: 9,
      velocityA: 0.3,
      velocityB: -0.1,
    });
    const momentumBefore = totalMomentum(simulation);
    const energyBefore = totalKineticEnergy(simulation);

    for (let i = 0; i < 300 && simulation.bodyCollisions === 0; i++) {
      stepElasticCollision(simulation, 1 / 120);
    }

    expect(simulation.bodyCollisions).toBe(1);
    expect(totalMomentum(simulation)).toBeCloseTo(momentumBefore, 10);
    expect(totalKineticEnergy(simulation)).toBeCloseTo(energyBefore, 10);
  });

  it("reverses velocity at the wall without changing speed", () => {
    const simulation = createElasticCollisionSimulation({
      massA: 4,
      massB: 8,
      velocityA: -0.3,
      velocityB: 0,
    });
    simulation.bodyA.x = simulation.bodyA.radius + 0.001;
    stepElasticCollision(simulation, 1 / 60);

    expect(simulation.wallBounces).toBe(1);
    expect(simulation.bodyA.velocity).toBeCloseTo(0.3);
    expect(simulation.bodyA.x).toBeGreaterThanOrEqual(simulation.bodyA.radius);
  });

  it("allows mass B to reach 100,000 kg", () => {
    expect(clampMassB(250_000)).toBe(MAX_MASS_B);
    const simulation = createElasticCollisionSimulation({
      massA: 4,
      massB: 100_000,
      velocityA: 0.3,
      velocityB: 0,
    });
    expect(simulation.bodyB.mass).toBe(100_000);
  });
});
