import { describe, expect, it } from "vitest";
import {
  attemptStick,
  clampAttemptsPerFrame,
  clampKillRadiusMultiplier,
  clampLaunchMargin,
  clampStickiness,
  createDLAState,
  createSeededRandom,
  DEFAULT_ATTEMPTS_PER_FRAME,
  DEFAULT_KILL_RADIUS_MULTIPLIER,
  DEFAULT_LAUNCH_MARGIN,
  DEFAULT_STICKINESS,
  DLAState,
  hasOccupiedMooreNeighbor,
  MAX_ATTEMPTS_PER_FRAME,
  MAX_KILL_RADIUS_MULTIPLIER,
  MAX_LAUNCH_MARGIN,
  MAX_STICKINESS,
  MIN_ATTEMPTS_PER_FRAME,
  MIN_KILL_RADIUS_MULTIPLIER,
  MIN_LAUNCH_MARGIN,
  MIN_STICKINESS,
  runDLAParticleAttempts,
  runParticleToCompletion,
  spawnParticle,
} from "./dla";

function floodFillConnectedCount(state: DLAState): number {
  const { size, occupied } = state;
  const cx = Math.round((size - 1) / 2);
  const cy = Math.round((size - 1) / 2);
  const visited = new Uint8Array(size * size);
  const stack = [cy * size + cx];
  visited[cy * size + cx] = 1;
  let count = 0;

  while (stack.length > 0) {
    const idx = stack.pop() as number;
    count++;
    const x = idx % size;
    const y = Math.floor(idx / size);
    for (const [dx, dy] of [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0], [1, 0],
      [-1, 1], [0, 1], [1, 1],
    ] as Array<[number, number]>) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
      const nIdx = ny * size + nx;
      if (occupied[nIdx] === 1 && visited[nIdx] === 0) {
        visited[nIdx] = 1;
        stack.push(nIdx);
      }
    }
  }
  return count;
}

function totalOccupied(state: DLAState): number {
  return state.occupied.reduce((sum, v) => sum + v, 0);
}

describe("dla", () => {
  it("detects a diagonal occupied neighbor (Moore, not von Neumann)", () => {
    const state = createDLAState(21);
    // Seed sits at the grid center; a diagonal cell relative to it should
    // count as an occupied Moore neighbor even though it isn't 4-adjacent.
    const center = Math.round((21 - 1) / 2);
    expect(hasOccupiedMooreNeighbor(state, center + 1, center + 1)).toBe(true);
    expect(hasOccupiedMooreNeighbor(state, center + 2, center + 2)).toBe(false);
  });

  it("spawns particles at the expected launch radius", () => {
    const state = createDLAState(101);
    const rng = createSeededRandom(5);
    const center = (101 - 1) / 2;
    const margin = 10;
    const particle = spawnParticle(state, rng, margin);
    const dist = Math.hypot(particle.x - center, particle.y - center);
    expect(dist).toBeCloseTo(state.maxOccupiedRadius + margin, 0);
  });

  it("always sticks when adjacent and stickiness is 1", () => {
    const state = createDLAState(21);
    const center = Math.round((21 - 1) / 2);
    const adjacent = { x: center + 1, y: center };
    const stuck = attemptStick(state, adjacent, () => 0, 1);
    expect(stuck).toBe(true);
    expect(hasOccupiedMooreNeighbor(state, center + 1, center)).toBe(true);
  });

  it("never sticks when the roll exceeds stickiness", () => {
    const state = createDLAState(21);
    const center = Math.round((21 - 1) / 2);
    const adjacent = { x: center + 1, y: center };
    const stuck = attemptStick(state, adjacent, () => 0.9, MIN_STICKINESS);
    expect(stuck).toBe(false);
  });

  it("abandons a particle that wanders past the kill radius", () => {
    const state = createDLAState(101);
    // A constant rng of 0.4 spawns the particle up and to the left of
    // center (angle = 0.8*pi) and always selects Moore offset index 3 =
    // (-1,0): every subsequent step moves it further left while its
    // vertical offset stays fixed, so it never re-approaches the seed's
    // neighborhood and its distance from center only grows until it
    // exceeds the kill radius.
    const rng = () => 0.4;
    const result = runParticleToCompletion(state, rng, MIN_LAUNCH_MARGIN, 1.5, 1);
    expect(result).toBe("killed");
  });

  it("keeps every stuck particle Moore-connected back to the seed", () => {
    const state = createDLAState(61);
    const rng = createSeededRandom(99);
    runDLAParticleAttempts(state, rng, 40, DEFAULT_LAUNCH_MARGIN, DEFAULT_KILL_RADIUS_MULTIPLIER, 1);

    const connected = floodFillConnectedCount(state);
    expect(connected).toBe(totalOccupied(state));
    expect(totalOccupied(state)).toBeGreaterThan(1);
  });

  it("updates maxOccupiedRadius only when a farther-out stick occurs", () => {
    const state = createDLAState(61);
    const center = Math.round((61 - 1) / 2);
    expect(state.maxOccupiedRadius).toBe(0);

    attemptStick(state, { x: center + 1, y: center }, () => 0, 1);
    const afterFirst = state.maxOccupiedRadius;
    expect(afterFirst).toBeCloseTo(1);

    // A stick closer than the current max shouldn't reduce it.
    attemptStick(state, { x: center, y: center + 1 }, () => 0, 1);
    expect(state.maxOccupiedRadius).toBeCloseTo(afterFirst);
  });

  it("clamps every parameter to its supported range", () => {
    expect(clampStickiness(0)).toBe(MIN_STICKINESS);
    expect(clampStickiness(9999)).toBe(MAX_STICKINESS);
    expect(clampStickiness(NaN)).toBe(DEFAULT_STICKINESS);

    expect(clampLaunchMargin(0)).toBe(MIN_LAUNCH_MARGIN);
    expect(clampLaunchMargin(9999)).toBe(MAX_LAUNCH_MARGIN);
    expect(clampLaunchMargin(NaN)).toBe(DEFAULT_LAUNCH_MARGIN);

    expect(clampKillRadiusMultiplier(0)).toBe(MIN_KILL_RADIUS_MULTIPLIER);
    expect(clampKillRadiusMultiplier(9999)).toBe(MAX_KILL_RADIUS_MULTIPLIER);
    expect(clampKillRadiusMultiplier(NaN)).toBe(DEFAULT_KILL_RADIUS_MULTIPLIER);

    expect(clampAttemptsPerFrame(0)).toBe(MIN_ATTEMPTS_PER_FRAME);
    expect(clampAttemptsPerFrame(9999)).toBe(MAX_ATTEMPTS_PER_FRAME);
    expect(clampAttemptsPerFrame(NaN)).toBe(DEFAULT_ATTEMPTS_PER_FRAME);
  });
});
