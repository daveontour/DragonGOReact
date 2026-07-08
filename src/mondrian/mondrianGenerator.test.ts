import { describe, expect, it } from "vitest";
import {
  countColoredCells,
  createSeededRandom,
  DEFAULT_MONDRIAN_DEPTH,
  generateMondrian,
  MONDRIAN_RED,
  MONDRIAN_WHITE,
  normalizeEnabledColors,
  toggleEnabledColor,
} from "./mondrianGenerator";

describe("mondrianGenerator", () => {
  it("is deterministic for the same seed", () => {
    const params = {
      width: 400,
      height: 300,
      maxDepth: DEFAULT_MONDRIAN_DEPTH,
      lineWidth: 10,
      minCellSize: 40,
      colorProbability: 0.2,
      seed: 42,
    };
    const first = generateMondrian(params);
    const second = generateMondrian(params);
    expect(first.cells).toEqual(second.cells);
  });

  it("produces different art for different seeds", () => {
    const base = {
      width: 400,
      height: 300,
      maxDepth: 8,
      lineWidth: 10,
      minCellSize: 40,
      colorProbability: 0.2,
    };
    const a = generateMondrian({ ...base, seed: 1 });
    const b = generateMondrian({ ...base, seed: 2 });
    expect(a.cells).not.toEqual(b.cells);
  });

  it("generates more cells with higher complexity", () => {
    const base = {
      width: 500,
      height: 400,
      lineWidth: 8,
      minCellSize: 36,
      colorProbability: 0.15,
      seed: 99,
    };
    const shallow = generateMondrian({ ...base, maxDepth: 4 });
    const deep = generateMondrian({ ...base, maxDepth: 10 });
    expect(deep.cells.length).toBeGreaterThan(shallow.cells.length);
  });

  it("includes primary colors when probability is high", () => {
    const artwork = generateMondrian({
      width: 600,
      height: 450,
      maxDepth: 9,
      lineWidth: 8,
      minCellSize: 30,
      colorProbability: 0.45,
      seed: 7,
    });
    expect(countColoredCells(artwork.cells)).toBeGreaterThan(0);
    expect(artwork.cells.some((cell) => cell.color === MONDRIAN_WHITE)).toBe(true);
  });

  it("creates seeded random values in range", () => {
    const rng = createSeededRandom(123);
    for (let i = 0; i < 20; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("only uses enabled fill colours", () => {
    const artwork = generateMondrian({
      width: 600,
      height: 450,
      maxDepth: 9,
      lineWidth: 8,
      minCellSize: 30,
      colorProbability: 0.45,
      enabledColors: ["red"],
      seed: 7,
    });
    const fillColors = new Set(
      artwork.cells
        .map((cell) => cell.color)
        .filter((color) => color !== MONDRIAN_WHITE)
    );
    expect(fillColors.size).toBeGreaterThan(0);
    expect([...fillColors]).toEqual([MONDRIAN_RED]);
  });

  it("normalizes enabled colours and keeps at least one selected", () => {
    expect(normalizeEnabledColors([])).toEqual([
      "red",
      "blue",
      "yellow",
      "black",
    ]);
    expect(toggleEnabledColor(["red"], "red")).toEqual(["red"]);
    expect(toggleEnabledColor(["red", "blue"], "red")).toEqual(["blue"]);
  });
});
