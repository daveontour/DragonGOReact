import { describe, expect, it } from "vitest";
import {
  findRoot,
  generateUniformField,
  isOpen,
  runPercolation,
  union,
} from "./percolation";

describe("findRoot path compression", () => {
  it("leaves parent[x] pointing directly at the root after being called", () => {
    // Build a chain 0 -> 1 -> 2 -> 3 (3 is the root)
    const parent = new Int32Array([1, 2, 3, 3]);
    const root = findRoot(parent, 0);
    expect(root).toBe(3);
    expect(parent[0]).toBe(3);
  });
});

describe("union by rank", () => {
  it("merges two disjoint sets so they share a root", () => {
    const n = 5;
    const parent = new Int32Array(n);
    for (let i = 0; i < n; i++) parent[i] = i;
    const rank = new Uint8Array(n);
    union(parent, rank, 0, 1);
    union(parent, rank, 2, 3);
    expect(findRoot(parent, 0)).toBe(findRoot(parent, 1));
    expect(findRoot(parent, 2)).toBe(findRoot(parent, 3));
    expect(findRoot(parent, 0)).not.toBe(findRoot(parent, 2));
  });
});

describe("runPercolation on hand-built fields", () => {
  it("always percolates when the entire middle column is open (3x3)", () => {
    const size = 3;
    // Column x=1 fully open (uniform=0 < any p>0), everything else closed (uniform=1).
    const field = new Float32Array(size * size).fill(1);
    for (let y = 0; y < size; y++) field[y * size + 1] = 0;
    const result = runPercolation(size, field, 0.5);
    expect(result.percolates).toBe(true);
  });

  it("never percolates on an all-closed grid", () => {
    const size = 5;
    const field = new Float32Array(size * size).fill(1);
    const result = runPercolation(size, field, 0.99);
    expect(result.percolates).toBe(false);
  });

  it("p=1 always percolates and p=0 never does, for a random field", () => {
    const size = 20;
    const field = generateUniformField(size, 42);
    expect(runPercolation(size, field, 1).percolates).toBe(true);
    expect(runPercolation(size, field, 0).percolates).toBe(false);
  });
});

describe("monotonicity of a coupled field in p", () => {
  it("percolating at p1 implies percolating at any p2 > p1 on the same field", () => {
    const size = 40;
    const field = generateUniformField(size, 7);
    let foundPercolating = false;
    for (let step = 0; step <= 40; step++) {
      const p = step / 40;
      const percolates = runPercolation(size, field, p).percolates;
      if (percolates) {
        foundPercolating = true;
      }
      if (foundPercolating) {
        // Once we've seen a percolating p, every larger p tested afterward
        // (since we're iterating p in increasing order) must also percolate.
        expect(percolates).toBe(true);
      }
    }
  });
});

describe("openCount matches isOpen count", () => {
  it("reports the same open-cell count as a direct scan", () => {
    const size = 15;
    const field = generateUniformField(size, 99);
    const p = 0.5;
    const result = runPercolation(size, field, p);
    let manualCount = 0;
    for (let i = 0; i < size * size; i++) {
      if (isOpen(field, i, p)) manualCount++;
    }
    expect(result.openCount).toBe(manualCount);
  });
});
