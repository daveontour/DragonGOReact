import { describe, expect, it } from "vitest";
import {
  applyPreset,
  BRAIN_DYING,
  BRAIN_OFF,
  BRAIN_ON,
  countMooreNeighborsWithState,
  createAutomatonState,
  runSteps,
  setCell,
  stepBriansBrain,
  stepWireworld,
  WIRE_CONDUCTOR,
  WIRE_EMPTY,
  WIRE_HEAD,
  WIRE_TAIL,
  WIREWORLD_PRESETS,
} from "./wireworld";

describe("stepWireworld", () => {
  it("advances a lone head one cell per step along a conductor", () => {
    const state = createAutomatonState(10, 3);
    setCell(state, 2, 1, WIRE_HEAD);
    setCell(state, 3, 1, WIRE_CONDUCTOR);
    setCell(state, 4, 1, WIRE_CONDUCTOR);

    stepWireworld(state);
    expect(state.current[1 * 10 + 3]).toBe(WIRE_HEAD);
    expect(state.current[1 * 10 + 2]).toBe(WIRE_TAIL);

    stepWireworld(state);
    expect(state.current[1 * 10 + 4]).toBe(WIRE_HEAD);
    expect(state.current[1 * 10 + 3]).toBe(WIRE_TAIL);
    expect(state.current[1 * 10 + 2]).toBe(WIRE_CONDUCTOR);
  });

  it("head always becomes tail", () => {
    const state = createAutomatonState(5, 5);
    setCell(state, 2, 2, WIRE_HEAD);
    stepWireworld(state);
    expect(state.current[2 * 5 + 2]).toBe(WIRE_TAIL);
  });

  it("tail always becomes conductor, not empty (regression guard)", () => {
    const state = createAutomatonState(5, 5);
    setCell(state, 2, 2, WIRE_TAIL);
    stepWireworld(state);
    expect(state.current[2 * 5 + 2]).toBe(WIRE_CONDUCTOR);
    expect(state.current[2 * 5 + 2]).not.toBe(WIRE_EMPTY);
  });

  it("a conductor with exactly 1 head neighbor becomes a head", () => {
    const state = createAutomatonState(5, 5);
    setCell(state, 2, 2, WIRE_CONDUCTOR);
    setCell(state, 1, 2, WIRE_HEAD);
    stepWireworld(state);
    expect(state.current[2 * 5 + 2]).toBe(WIRE_HEAD);
  });

  it("a conductor with exactly 2 head neighbors becomes a head", () => {
    const state = createAutomatonState(5, 5);
    setCell(state, 2, 2, WIRE_CONDUCTOR);
    setCell(state, 1, 1, WIRE_HEAD);
    setCell(state, 3, 3, WIRE_HEAD);
    stepWireworld(state);
    expect(state.current[2 * 5 + 2]).toBe(WIRE_HEAD);
  });

  it("a conductor with 0 head neighbors stays conductor", () => {
    const state = createAutomatonState(5, 5);
    setCell(state, 2, 2, WIRE_CONDUCTOR);
    stepWireworld(state);
    expect(state.current[2 * 5 + 2]).toBe(WIRE_CONDUCTOR);
  });

  it("a conductor with 3+ head neighbors stays conductor", () => {
    const state = createAutomatonState(5, 5);
    setCell(state, 2, 2, WIRE_CONDUCTOR);
    setCell(state, 1, 1, WIRE_HEAD);
    setCell(state, 3, 1, WIRE_HEAD);
    setCell(state, 1, 3, WIRE_HEAD);
    stepWireworld(state);
    expect(state.current[2 * 5 + 2]).toBe(WIRE_CONDUCTOR);
  });

  it("empty cells always stay empty", () => {
    const state = createAutomatonState(5, 5);
    setCell(state, 1, 1, WIRE_HEAD);
    stepWireworld(state);
    expect(state.current[2 * 5 + 2]).toBe(WIRE_EMPTY);
  });

  it("edge and corner cells with clamped neighbor counts don't throw", () => {
    const state = createAutomatonState(3, 3);
    setCell(state, 0, 0, WIRE_CONDUCTOR);
    expect(() => stepWireworld(state)).not.toThrow();
  });

  it("the oscillating loop preset returns to its exact starting configuration after one full circuit", () => {
    const loop = WIREWORLD_PRESETS.find((p) => p.id === "loop");
    if (!loop) {
      throw new Error("loop preset missing");
    }
    const state = createAutomatonState(120, 80);
    applyPreset(state, loop);
    const initial = Array.from(state.current);

    const perimeter = 2 * 100 + 2 * 60 - 8; // octagonLoopPath(10,10,100,60) cell count
    runSteps(state, "wireworld", perimeter);

    expect(Array.from(state.current)).toEqual(initial);
  });

  it("the loop preset always has exactly one head and one tail present (single circulating electron)", () => {
    const loop = WIREWORLD_PRESETS.find((p) => p.id === "loop");
    if (!loop) {
      throw new Error("loop preset missing");
    }
    const state = createAutomatonState(120, 80);
    applyPreset(state, loop);

    for (let i = 0; i < 20; i++) {
      const heads = state.current.filter((c) => c === WIRE_HEAD).length;
      const tails = state.current.filter((c) => c === WIRE_TAIL).length;
      expect(heads).toBe(1);
      expect(tails).toBe(1);
      stepWireworld(state);
    }
  });
});

describe("stepBriansBrain", () => {
  it("on always becomes dying", () => {
    const state = createAutomatonState(5, 5);
    setCell(state, 2, 2, BRAIN_ON);
    stepBriansBrain(state);
    expect(state.current[2 * 5 + 2]).toBe(BRAIN_DYING);
  });

  it("dying always becomes off and never re-fires", () => {
    const state = createAutomatonState(5, 5);
    setCell(state, 2, 2, BRAIN_DYING);
    stepBriansBrain(state);
    expect(state.current[2 * 5 + 2]).toBe(BRAIN_OFF);
  });

  it("an off cell with exactly 2 'on' neighbors turns on", () => {
    const state = createAutomatonState(5, 5);
    setCell(state, 2, 2, BRAIN_OFF);
    setCell(state, 1, 2, BRAIN_ON);
    setCell(state, 3, 2, BRAIN_ON);
    stepBriansBrain(state);
    expect(state.current[2 * 5 + 2]).toBe(BRAIN_ON);
  });

  it("an off cell with 1 or 3 'on' neighbors stays off", () => {
    const stateOne = createAutomatonState(5, 5);
    setCell(stateOne, 2, 2, BRAIN_OFF);
    setCell(stateOne, 1, 2, BRAIN_ON);
    stepBriansBrain(stateOne);
    expect(stateOne.current[2 * 5 + 2]).toBe(BRAIN_OFF);

    const stateThree = createAutomatonState(5, 5);
    setCell(stateThree, 2, 2, BRAIN_OFF);
    setCell(stateThree, 1, 2, BRAIN_ON);
    setCell(stateThree, 3, 2, BRAIN_ON);
    setCell(stateThree, 2, 1, BRAIN_ON);
    stepBriansBrain(stateThree);
    expect(stateThree.current[2 * 5 + 2]).toBe(BRAIN_OFF);
  });

  it("an isolated single 'on' cell fully dies within 2 steps and never spontaneously returns", () => {
    const state = createAutomatonState(9, 9);
    setCell(state, 4, 4, BRAIN_ON);
    stepBriansBrain(state);
    stepBriansBrain(state);
    expect(Array.from(state.current).every((c) => c === BRAIN_OFF)).toBe(true);
    stepBriansBrain(state);
    expect(Array.from(state.current).every((c) => c === BRAIN_OFF)).toBe(true);
  });

  it("edge and corner cells with clamped neighbor counts don't throw", () => {
    const state = createAutomatonState(3, 3);
    setCell(state, 0, 0, BRAIN_ON);
    expect(() => stepBriansBrain(state)).not.toThrow();
  });
});

describe("countMooreNeighborsWithState", () => {
  it("does not wrap around the grid edges", () => {
    const state = createAutomatonState(3, 3);
    setCell(state, 2, 2, WIRE_HEAD);
    // top-left corner's Moore neighborhood should not see the far corner
    const count = countMooreNeighborsWithState(state.current, 0, 0, 3, 3, WIRE_HEAD);
    expect(count).toBe(0);
  });
});
