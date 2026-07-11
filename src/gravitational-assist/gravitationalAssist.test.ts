import { describe, expect, it } from "vitest";
import {
  clampEncounterAngle,
  clampImpactParameter,
  createGravitationalAssistEncounter,
  DEFAULT_ENCOUNTER_ANGLE,
  DEFAULT_IMPACT_PARAMETER,
  hyperbolicTurnAngleRad,
  MAX_ENCOUNTER_ANGLE,
  MIN_ENCOUNTER_ANGLE,
  relativeVelocity,
  bodySpeed,
  speed,
  stepGravitationalAssist,
} from "./gravitationalAssist";

describe("gravitationalAssist", () => {
  it("clamps encounter angle and impact parameter", () => {
    expect(clampEncounterAngle(-999)).toBe(MIN_ENCOUNTER_ANGLE);
    expect(clampEncounterAngle(999)).toBe(MAX_ENCOUNTER_ANGLE);
    expect(clampEncounterAngle(NaN)).toBe(DEFAULT_ENCOUNTER_ANGLE);
    expect(clampImpactParameter(0)).toBe(20);
    expect(clampImpactParameter(NaN)).toBe(DEFAULT_IMPACT_PARAMETER);
  });

  it("predicts a larger hyperbolic turn for tighter flybys", () => {
    const wide = hyperbolicTurnAngleRad(100, 55);
    const tight = hyperbolicTurnAngleRad(30, 55);
    expect(tight).toBeGreaterThan(wide);
  });

  it("creates an encounter with the requested relative approach angle", () => {
    const sim = createGravitationalAssistEncounter({
      encounterAngleDeg: 45,
      approachSpeed: 60,
      planetSpeed: 40,
      impactParameter: 50,
    });
    const rel = relativeVelocity(sim.spacecraft, sim.planet);
    const relAngle =
      (Math.atan2(rel.y, rel.x) * 180) / Math.PI;
    expect(relAngle).toBeCloseTo(45, 0);
    expect(speed(rel)).toBeCloseTo(60, 0);
    expect(sim.planet.vx).toBeCloseTo(40, 0);
  });

  it("can gain speed in the inertial frame during a prograde assist", () => {
    const sim = createGravitationalAssistEncounter({
      encounterAngleDeg: 20,
      approachSpeed: 55,
      planetSpeed: 45,
      impactParameter: 45,
    });
    const initial = bodySpeed(sim.spacecraft);
    for (let i = 0; i < 8000; i++) {
      stepGravitationalAssist(sim, 1 / 120);
      if (sim.finished) {
        break;
      }
    }
    expect(sim.finished).toBe(true);
    expect(sim.exitSpeed).not.toBeNull();
    if (sim.exitSpeed !== null) {
      expect(sim.exitSpeed).toBeGreaterThan(initial);
    }
  });
});
