import { describe, expect, it } from "vitest";
import {
  Ant,
  clampAntCount,
  clampStepsPerFrame,
  DEFAULT_ANT_COUNT,
  DEFAULT_STEPS_PER_FRAME,
  isValidRule,
  MAX_ANT_COUNT,
  MAX_STEPS_PER_FRAME,
  MIN_ANT_COUNT,
  MIN_STEPS_PER_FRAME,
  runTurmiteSteps,
  stepAnt,
  stepTurmite,
  turnLeft,
  turnRight,
  TurmiteState,
  wrapIndex,
} from "./langtonsant";

function makeState(size: number, rule: string, ants: Ant[]): TurmiteState {
  return { size, rule, grid: new Uint8Array(size * size), ants };
}

describe("langtonsant", () => {
  it("cycles turnLeft and turnRight through all four directions", () => {
    expect(turnRight(0)).toBe(1);
    expect(turnRight(1)).toBe(2);
    expect(turnRight(2)).toBe(3);
    expect(turnRight(3)).toBe(0);

    expect(turnLeft(0)).toBe(3);
    expect(turnLeft(3)).toBe(2);
    expect(turnLeft(2)).toBe(1);
    expect(turnLeft(1)).toBe(0);
  });

  it("wraps indices toroidally", () => {
    expect(wrapIndex(-1, 11)).toBe(10);
    expect(wrapIndex(11, 11)).toBe(0);
    expect(wrapIndex(5, 11)).toBe(5);
  });

  it("matches the hand-computed first two classic RL steps", () => {
    const state = makeState(11, "RL", [{ x: 5, y: 5, dir: 0 }]);
    const ant = state.ants[0];

    stepAnt(state, ant);
    expect(state.grid[5 * 11 + 5]).toBe(1);
    expect(ant).toEqual({ x: 6, y: 5, dir: 1 });

    stepAnt(state, ant);
    expect(state.grid[5 * 11 + 6]).toBe(1);
    expect(ant).toEqual({ x: 6, y: 6, dir: 2 });
  });

  it("wraps the ant around the grid edge", () => {
    // Facing up on an unvisited (color 0) cell turns right to face right
    // (rule[0]='R') before moving, so starting at the right edge facing up
    // sends the ant off the right edge, wrapping x back to 0.
    const size = 11;
    const state = makeState(size, "RL", [{ x: size - 1, y: 5, dir: 0 }]);
    stepAnt(state, state.ants[0]);
    expect(state.ants[0].x).toBe(0);
    expect(state.ants[0].y).toBe(5);
  });

  it("cycles a revisited cell's color through all k values", () => {
    const state = makeState(11, "RRL", [{ x: 5, y: 5, dir: 0 }]);
    const idx = 5 * 11 + 5;
    const ant = state.ants[0];

    stepAnt(state, ant);
    expect(state.grid[idx]).toBe(1);

    ant.x = 5;
    ant.y = 5;
    stepAnt(state, ant);
    expect(state.grid[idx]).toBe(2);

    ant.x = 5;
    ant.y = 5;
    stepAnt(state, ant);
    expect(state.grid[idx]).toBe(0);
  });

  it("steps every ant exactly once per tick", () => {
    const state = makeState(11, "RL", [
      { x: 2, y: 2, dir: 0 },
      { x: 8, y: 8, dir: 1 },
    ]);
    stepTurmite(state);
    expect(state.grid[2 * 11 + 2]).toBe(1);
    expect(state.grid[8 * 11 + 8]).toBe(1);
  });

  it("runs N steps equivalently to N individual stepTurmite calls", () => {
    const a = makeState(21, "RL", [{ x: 10, y: 10, dir: 0 }]);
    const b = makeState(21, "RL", [{ x: 10, y: 10, dir: 0 }]);
    for (let i = 0; i < 50; i++) {
      stepTurmite(a);
    }
    runTurmiteSteps(b, 50);
    expect(Array.from(a.grid)).toEqual(Array.from(b.grid));
    expect(a.ants[0]).toEqual(b.ants[0]);
  });

  it("validates rule strings", () => {
    expect(isValidRule("RL")).toBe(true);
    expect(isValidRule("LLRRRLRLRLLR")).toBe(false); // too long (> 8)
    expect(isValidRule("R")).toBe(false); // too short (< 2)
    expect(isValidRule("RLX")).toBe(false); // invalid character
    expect(isValidRule("")).toBe(false);
  });

  it("clamps ant count and steps-per-frame to their supported ranges", () => {
    expect(clampAntCount(0)).toBe(MIN_ANT_COUNT);
    expect(clampAntCount(9999)).toBe(MAX_ANT_COUNT);
    expect(clampAntCount(NaN)).toBe(DEFAULT_ANT_COUNT);

    expect(clampStepsPerFrame(0)).toBe(MIN_STEPS_PER_FRAME);
    expect(clampStepsPerFrame(9999999)).toBe(MAX_STEPS_PER_FRAME);
    expect(clampStepsPerFrame(NaN)).toBe(DEFAULT_STEPS_PER_FRAME);
  });
});
