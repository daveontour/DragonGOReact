import { describe, expect, it } from "vitest";
import {
  applyBarnsleyTransform,
  BARNSLEY_TRANSFORMS,
  clampPointCount,
  clampRatio,
  clampRestrictionK,
  clampVertexCount,
  createSeededRandom,
  DEFAULT_POINT_COUNT,
  DEFAULT_RATIO,
  DEFAULT_RESTRICTION_K,
  DEFAULT_VERTICES,
  MAX_POINT_COUNT,
  MAX_RATIO,
  MAX_RESTRICTION_K,
  MAX_VERTICES,
  MIN_POINT_COUNT,
  MIN_RATIO,
  MIN_RESTRICTION_K,
  MIN_VERTICES,
  pickBarnsleyTransformIndex,
  pickNextVertexIndex,
  polygonVertices,
  runChaosGameDensity,
  stepChaosGamePolygon,
} from "./chaosgame";

describe("chaosgame", () => {
  it("places four evenly spaced vertices at the classic square positions", () => {
    const vertices = polygonVertices(4);
    expect(vertices[0].x).toBeCloseTo(1);
    expect(vertices[0].y).toBeCloseTo(0);
    expect(vertices[1].x).toBeCloseTo(0);
    expect(vertices[1].y).toBeCloseTo(1);
    expect(vertices[2].x).toBeCloseTo(-1);
    expect(vertices[2].y).toBeCloseTo(0);
    expect(vertices[3].x).toBeCloseTo(0);
    expect(vertices[3].y).toBeCloseTo(-1);
  });

  it("moves exactly halfway toward the target vertex at ratio 0.5", () => {
    const result = stepChaosGamePolygon({ x: 0, y: 0 }, { x: 1, y: 0 }, 0.5);
    expect(result.x).toBeCloseTo(0.5);
    expect(result.y).toBeCloseTo(0);
  });

  it("matches the hand-computed Barnsley f2 transform", () => {
    const result = applyBarnsleyTransform({ x: 1, y: 1 }, BARNSLEY_TRANSFORMS[1]);
    expect(result.x).toBeCloseTo(0.89);
    expect(result.y).toBeCloseTo(2.41);
  });

  it("never repeats the immediately previous vertex when restrictionK=1", () => {
    const rng = createSeededRandom(42);
    const recentPicks: number[] = [];
    for (let i = 0; i < 500; i++) {
      const pick = pickNextVertexIndex(rng, 5, recentPicks, 1);
      if (recentPicks.length > 0) {
        expect(pick).not.toBe(recentPicks[recentPicks.length - 1]);
      }
      recentPicks.push(pick);
      if (recentPicks.length > 3) {
        recentPicks.shift();
      }
    }
  });

  it("picks the dominant Barnsley transform (f2) roughly 85% of the time", () => {
    const rng = createSeededRandom(7);
    const total = 20000;
    let f2Count = 0;
    for (let i = 0; i < total; i++) {
      if (pickBarnsleyTransformIndex(rng) === 1) {
        f2Count++;
      }
    }
    const frequency = f2Count / total;
    expect(frequency).toBeGreaterThan(0.8);
    expect(frequency).toBeLessThan(0.9);
  });

  it("produces deterministic density for a given seed, and different density for a different seed", () => {
    const paramsA = {
      mode: "polygon" as const,
      width: 50,
      height: 50,
      vertices: 3,
      ratio: 0.5,
      restrictionK: 0,
      pointCount: 2000,
      seed: 11,
    };
    const a = runChaosGameDensity(paramsA);
    const b = runChaosGameDensity(paramsA);
    const c = runChaosGameDensity({ ...paramsA, seed: 12 });

    expect(Array.from(a)).toEqual(Array.from(b));
    expect(Array.from(a)).not.toEqual(Array.from(c));
  });

  it("produces a non-empty fern density for the fern mode", () => {
    const density = runChaosGameDensity({
      mode: "fern",
      width: 50,
      height: 50,
      vertices: 3,
      ratio: 0.5,
      restrictionK: 0,
      pointCount: 5000,
      seed: 3,
    });
    const totalHits = density.reduce((sum, v) => sum + v, 0);
    expect(totalHits).toBeGreaterThan(0);
  });

  it("clamps every parameter to its supported range", () => {
    expect(clampVertexCount(0)).toBe(MIN_VERTICES);
    expect(clampVertexCount(9999)).toBe(MAX_VERTICES);
    expect(clampVertexCount(NaN)).toBe(DEFAULT_VERTICES);

    expect(clampRatio(0)).toBe(MIN_RATIO);
    expect(clampRatio(9999)).toBe(MAX_RATIO);
    expect(clampRatio(NaN)).toBe(DEFAULT_RATIO);

    expect(clampRestrictionK(-1)).toBe(MIN_RESTRICTION_K);
    expect(clampRestrictionK(9999)).toBe(MAX_RESTRICTION_K);
    expect(clampRestrictionK(NaN)).toBe(DEFAULT_RESTRICTION_K);

    expect(clampPointCount(0)).toBe(MIN_POINT_COUNT);
    expect(clampPointCount(9999999)).toBe(MAX_POINT_COUNT);
    expect(clampPointCount(NaN)).toBe(DEFAULT_POINT_COUNT);
  });
});
