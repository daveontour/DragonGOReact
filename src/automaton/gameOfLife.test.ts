import { describe, expect, it } from "vitest";
import {
  cellIndex,
  clampSpeed,
  countLiveCells,
  countLiveNeighbors,
  createEmptyGrid,
  getCell,
  LIFE_PATTERNS,
  stampPattern,
  stepGameOfLife,
  toggleCell,
} from "./gameOfLife";

function setCells(
  cols: number,
  rows: number,
  cells: Array<[number, number]>
): Uint8Array {
  const grid = createEmptyGrid(cols, rows);
  for (const [x, y] of cells) {
    grid[cellIndex(cols, x, y)] = 1;
  }
  return grid;
}

describe("gameOfLife", () => {
  it("kills an isolated live cell from underpopulation", () => {
    const grid = setCells(5, 5, [[2, 2]]);
    const next = stepGameOfLife(grid, 5, 5, false);
    expect(countLiveCells(next)).toBe(0);
  });

  it("keeps a block still life stable", () => {
    const grid = setCells(6, 6, [
      [2, 2],
      [3, 2],
      [2, 3],
      [3, 3],
    ]);
    const next = stepGameOfLife(grid, 6, 6, false);
    expect(next).toEqual(grid);
  });

  it("oscillates a blinker between horizontal and vertical", () => {
    const grid = setCells(5, 5, [
      [1, 2],
      [2, 2],
      [3, 2],
    ]);
    const next = stepGameOfLife(grid, 5, 5, false);
    expect(getCell(next, 5, 5, 2, 1, false)).toBe(1);
    expect(getCell(next, 5, 5, 2, 2, false)).toBe(1);
    expect(getCell(next, 5, 5, 2, 3, false)).toBe(1);
    expect(getCell(next, 5, 5, 1, 2, false)).toBe(0);
  });

  it("births a cell with exactly three neighbors", () => {
    const grid = setCells(5, 5, [
      [1, 1],
      [2, 1],
      [1, 2],
    ]);
    const neighbors = countLiveNeighbors(grid, 5, 5, 2, 2, false);
    expect(neighbors).toBe(3);
  });

  it("wraps neighbor lookups across edges when enabled", () => {
    const grid = setCells(4, 4, [[0, 0]]);
    expect(getCell(grid, 4, 4, 4, 4, true)).toBe(1);
    expect(getCell(grid, 4, 4, 4, 4, false)).toBe(0);
  });

  it("toggles a cell without mutating the original grid", () => {
    const grid = createEmptyGrid(3, 3);
    const next = toggleCell(grid, 3, 1, 1);
    expect(grid[cellIndex(3, 1, 1)]).toBe(0);
    expect(next[cellIndex(3, 1, 1)]).toBe(1);
  });

  it("stamps a glider pattern at the given origin", () => {
    const grid = createEmptyGrid(10, 10);
    const stamped = stampPattern(grid, 10, 10, LIFE_PATTERNS.glider, 2, 2);
    expect(countLiveCells(stamped)).toBe(LIFE_PATTERNS.glider.cells.length);
  });

  it("clamps speed to the supported range", () => {
    expect(clampSpeed(0)).toBe(1);
    expect(clampSpeed(999)).toBe(30);
  });
});
