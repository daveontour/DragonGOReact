import { describe, expect, it } from "vitest";
import {
  carveMazeDFS,
  createMaze,
  DIR,
  isOpen,
  neighborIndex,
  OPPOSITE,
  solveMazeBFS,
} from "./maze";

function carvedEdgeCount(width: number, height: number, walls: Uint8Array): number {
  let count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Count only N and W to avoid double-counting each carved edge twice.
      if ((walls[y * width + x] & (1 << DIR.N)) !== 0) count++;
      if ((walls[y * width + x] & (1 << DIR.W)) !== 0) count++;
    }
  }
  return count;
}

describe("carveMazeDFS", () => {
  it("makes every cell reachable from the start (no -1 distances)", () => {
    const maze = createMaze(15, 12);
    carveMazeDFS(maze, 42);
    const result = solveMazeBFS(maze, 0, maze.width * maze.height - 1);
    for (const d of result.distances) {
      expect(d).toBeGreaterThanOrEqual(0);
    }
  });

  it("carves exactly width*height-1 edges (a spanning tree / perfect maze)", () => {
    const width = 10;
    const height = 8;
    const maze = createMaze(width, height);
    carveMazeDFS(maze, 7);
    expect(carvedEdgeCount(width, height, maze.walls)).toBe(width * height - 1);
  });

  it("keeps wall bits symmetric between neighboring cells", () => {
    const width = 12;
    const height = 9;
    const maze = createMaze(width, height);
    carveMazeDFS(maze, 99);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let dir = 0; dir < 4; dir++) {
          if (!isOpen(maze, x, y, dir)) {
            continue;
          }
          const nIdx = neighborIndex(maze, x, y, dir);
          expect(nIdx).toBeGreaterThanOrEqual(0);
          const nx = nIdx % width;
          const ny = Math.floor(nIdx / width);
          expect(isOpen(maze, nx, ny, OPPOSITE[dir])).toBe(true);
        }
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const a = createMaze(10, 10);
    const b = createMaze(10, 10);
    carveMazeDFS(a, 123);
    carveMazeDFS(b, 123);
    expect(Array.from(a.walls)).toEqual(Array.from(b.walls));
  });

  it("never returns a neighbor index outside the grid", () => {
    const width = 6;
    const height = 6;
    const maze = createMaze(width, height);
    carveMazeDFS(maze, 5);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let dir = 0; dir < 4; dir++) {
          const idx = neighborIndex(maze, x, y, dir);
          if (idx !== -1) {
            expect(idx).toBeGreaterThanOrEqual(0);
            expect(idx).toBeLessThan(width * height);
          }
        }
      }
    }
  });
});

describe("solveMazeBFS", () => {
  it("path length matches the recorded distance to the end", () => {
    const maze = createMaze(10, 10);
    carveMazeDFS(maze, 17);
    const endIdx = maze.width * maze.height - 1;
    const result = solveMazeBFS(maze, 0, endIdx);
    expect(result.path.length - 1).toBe(result.distances[endIdx]);
  });

  it("every consecutive pair in the path is connected by an open passage", () => {
    const maze = createMaze(10, 10);
    carveMazeDFS(maze, 17);
    const endIdx = maze.width * maze.height - 1;
    const result = solveMazeBFS(maze, 0, endIdx);
    for (let i = 0; i < result.path.length - 1; i++) {
      const a = result.path[i];
      const b = result.path[i + 1];
      const ax = a % maze.width;
      const ay = Math.floor(a / maze.width);
      let connected = false;
      for (let dir = 0; dir < 4; dir++) {
        if (isOpen(maze, ax, ay, dir) && neighborIndex(maze, ax, ay, dir) === b) {
          connected = true;
        }
      }
      expect(connected).toBe(true);
    }
  });
});
