import { describe, expect, it } from "vitest";
import {
  circularOrbitSpeed,
  clampTimescale,
  createOrbitSimulation,
  DEFAULT_PLANET1_ECCENTRICITY,
  DEFAULT_PLANET1_RADIUS,
  DEFAULT_PLANET2_ECCENTRICITY,
  DEFAULT_PLANET2_RADIUS,
  DEFAULT_SPACECRAFT_ORBIT,
  getBody,
  maxOrbitExtent,
  spacecraftAltitude,
  stepOrbitSimulation,
  visVivaSpeed,
} from "./orbitSimulation";

function defaultParams() {
  return {
    planet1: {
      semiMajorAxis: DEFAULT_PLANET1_RADIUS,
      eccentricity: DEFAULT_PLANET1_ECCENTRICITY,
    },
    planet2: {
      semiMajorAxis: DEFAULT_PLANET2_RADIUS,
      eccentricity: DEFAULT_PLANET2_ECCENTRICITY,
    },
    spacecraftOrbitRadius: DEFAULT_SPACECRAFT_ORBIT,
  };
}

describe("orbitSimulation", () => {
  it("creates two planets and a spacecraft", () => {
    const sim = createOrbitSimulation(defaultParams());

    expect(sim.bodies).toHaveLength(4);
    expect(getBody(sim, "planet1").x).toBeGreaterThan(0);
    expect(getBody(sim, "planet2").x).toBeLessThan(0);
    expect(getBody(sim, "spacecraft").id).toBe("spacecraft");
  });

  it("supports different orbit sizes per planet", () => {
    const sim = createOrbitSimulation({
      ...defaultParams(),
      planet1: { semiMajorAxis: 100, eccentricity: 0.1 },
      planet2: { semiMajorAxis: 200, eccentricity: 0.4 },
    });

    expect(sim.params.planet1.semiMajorAxis).toBe(100);
    expect(sim.params.planet2.semiMajorAxis).toBe(200);
    expect(maxOrbitExtent(sim.params)).toBeCloseTo(200 * 1.4, 5);
  });

  it("computes vis-viva speed at periapsis", () => {
    const speed = visVivaSpeed(12000, 112, 140);
    expect(speed).toBeGreaterThan(0);
  });

  it("keeps spacecraft near its parent planet initially", () => {
    const sim = createOrbitSimulation({
      ...defaultParams(),
      planet1: { semiMajorAxis: DEFAULT_PLANET1_RADIUS, eccentricity: 0 },
    });
    expect(spacecraftAltitude(sim)).toBeCloseTo(DEFAULT_SPACECRAFT_ORBIT, 0);
  });

  it("changes spacecraft speed under prograde thrust", () => {
    const sim = createOrbitSimulation(defaultParams());
    const spacecraft = getBody(sim, "spacecraft");
    const initialSpeed = Math.hypot(spacecraft.vx, spacecraft.vy);

    for (let i = 0; i < 30; i++) {
      stepOrbitSimulation(sim, 0.05, "prograde");
    }

    const finalSpeed = Math.hypot(spacecraft.vx, spacecraft.vy);
    expect(finalSpeed).toBeGreaterThan(initialSpeed);
  });

  it("uses circular orbit speed helper", () => {
    expect(circularOrbitSpeed(18, 28)).toBeGreaterThan(0);
  });

  it("clamps timescale", () => {
    expect(clampTimescale(0)).toBe(0.1);
    expect(clampTimescale(10)).toBe(5);
  });
});
