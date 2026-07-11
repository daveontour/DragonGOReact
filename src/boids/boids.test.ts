import { describe, expect, it } from "vitest";
import { Boid, BoidParams, stepBoids } from "./boids";

function baseParams(overrides: Partial<BoidParams> = {}): BoidParams {
  return {
    perceptionRadius: 60,
    maxSpeed: 3.5,
    maxForce: 0.15,
    separationWeight: 0,
    alignmentWeight: 0,
    cohesionWeight: 0,
    predator: null,
    ...overrides,
  };
}

function circularVariance(angles: number[]): number {
  const sumCos = angles.reduce((s, a) => s + Math.cos(a), 0) / angles.length;
  const sumSin = angles.reduce((s, a) => s + Math.sin(a), 0) / angles.length;
  const meanResultantLength = Math.hypot(sumCos, sumSin);
  return 1 - meanResultantLength; // 0 = perfectly aligned, 1 = fully dispersed
}

describe("alignment-only converges headings", () => {
  it("circular variance of headings strictly decreases over many steps for a tight cluster", () => {
    const boids: Boid[] = [];
    const angles = [0.2, 1.5, -2.1, 0.9, -0.5, 2.8, -1.2, 0.4];
    for (let i = 0; i < angles.length; i++) {
      boids.push({
        x: 200 + (i % 3) * 5,
        y: 200 + Math.floor(i / 3) * 5,
        vx: Math.cos(angles[i]) * 2,
        vy: Math.sin(angles[i]) * 2,
      });
    }
    const params = baseParams({ alignmentWeight: 1 });
    const initialVariance = circularVariance(boids.map((b) => Math.atan2(b.vy, b.vx)));

    for (let i = 0; i < 60; i++) {
      stepBoids(boids, params, 800, 800);
    }
    const finalVariance = circularVariance(boids.map((b) => Math.atan2(b.vy, b.vx)));
    expect(finalVariance).toBeLessThan(initialVariance);
  });
});

describe("separation-only pushes overlapping boids apart", () => {
  it("distance between two overlapping boids increases over subsequent steps", () => {
    const boids: Boid[] = [
      { x: 100, y: 100, vx: 0, vy: 0 },
      { x: 102, y: 100, vx: 0, vy: 0 },
    ];
    const params = baseParams({ separationWeight: 1.5 });
    const initialDist = Math.hypot(boids[0].x - boids[1].x, boids[0].y - boids[1].y);
    for (let i = 0; i < 10; i++) {
      stepBoids(boids, params, 800, 800);
    }
    const finalDist = Math.hypot(boids[0].x - boids[1].x, boids[0].y - boids[1].y);
    expect(finalDist).toBeGreaterThan(initialDist);
  });
});

describe("speed limit invariant", () => {
  it("every boid's speed stays at or below maxSpeed after a step", () => {
    const boids: Boid[] = [];
    for (let i = 0; i < 30; i++) {
      boids.push({ x: (i * 37) % 400, y: (i * 53) % 400, vx: 0, vy: 0 });
    }
    const params = baseParams({ separationWeight: 1.5, alignmentWeight: 1, cohesionWeight: 1 });
    for (let i = 0; i < 20; i++) {
      stepBoids(boids, params, 400, 400);
      for (const b of boids) {
        expect(Math.hypot(b.vx, b.vy)).toBeLessThanOrEqual(params.maxSpeed + 1e-9);
      }
    }
  });
});

describe("wrap-around", () => {
  it("a boid moved past the width wraps into [0, width)", () => {
    const boids: Boid[] = [{ x: 799, y: 400, vx: 5, vy: 0 }];
    const params = baseParams();
    stepBoids(boids, params, 800, 800);
    expect(boids[0].x).toBeGreaterThanOrEqual(0);
    expect(boids[0].x).toBeLessThan(800);
  });

  it("a boid moved before 0 wraps into [0, width)", () => {
    const boids: Boid[] = [{ x: 1, y: 400, vx: -5, vy: 0 }];
    const params = baseParams();
    stepBoids(boids, params, 800, 800);
    expect(boids[0].x).toBeGreaterThanOrEqual(0);
    expect(boids[0].x).toBeLessThan(800);
  });
});

describe("hand-computed 3-boid cohesion-only case", () => {
  it("a lone boid steers toward the centroid of its two neighbors", () => {
    const boids: Boid[] = [
      { x: 0, y: 0, vx: 0, vy: 0 },
      { x: 100, y: 0, vx: 0, vy: 0 },
      { x: 0, y: 100, vx: 0, vy: 0 },
    ];
    const params = baseParams({ cohesionWeight: 1, perceptionRadius: 200 });
    stepBoids(boids, params, 1000, 1000);
    // Centroid of neighbors (100,0) and (0,100) is (50,50); boid 0 starts
    // at (0,0) with zero velocity, so it should now be moving toward
    // positive x and y (both accelerations positive).
    expect(boids[0].vx).toBeGreaterThan(0);
    expect(boids[0].vy).toBeGreaterThan(0);
  });
});
