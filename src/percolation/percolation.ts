export const MIN_GRID_SIZE = 20;
export const MAX_GRID_SIZE = 150;
export const DEFAULT_GRID_SIZE = 60;

export const MIN_P = 0;
export const MAX_P = 1;
export const DEFAULT_P = 0.55;

/** Published critical threshold for 2D square-lattice site percolation
 * (a rigorously studied constant, not derived here). */
export const CRITICAL_P = 0.592746;

export const SWEEP_P_STEPS = 50;
export const SWEEP_TRIALS_PER_P = 24;

export function clampGridSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_GRID_SIZE;
  }
  return Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, Math.round(value)));
}

export function clampP(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_P;
  }
  return Math.min(MAX_P, Math.max(MIN_P, value));
}

export function createSeededRandom(seed: number): () => number {
  let state = (Math.abs(Math.trunc(seed)) || 1) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One uniform random per cell, generated once per seed. Because a cell is
 * "open" whenever its uniform is below p, the open-site field is monotonic
 * in p for a fixed field: percolating at p1 guarantees percolating at any
 * p2 > p1, since every cell open at p1 is still open at p2. This lets the
 * static and sweep views share one generator and makes monotonicity a
 * directly testable property. */
export function generateUniformField(size: number, seed: number): Float32Array {
  const rng = createSeededRandom(seed);
  const field = new Float32Array(size * size);
  for (let i = 0; i < field.length; i++) {
    field[i] = rng();
  }
  return field;
}

export function isOpen(field: Float32Array, index: number, p: number): boolean {
  return field[index] < p;
}

/** Iterative union-find with path compression + union by rank. */
export function findRoot(parent: Int32Array, x: number): number {
  let root = x;
  while (parent[root] !== root) {
    root = parent[root];
  }
  while (parent[x] !== root) {
    const next = parent[x];
    parent[x] = root;
    x = next;
  }
  return root;
}

export function union(parent: Int32Array, rank: Uint8Array, a: number, b: number): void {
  const rootA = findRoot(parent, a);
  const rootB = findRoot(parent, b);
  if (rootA === rootB) {
    return;
  }
  if (rank[rootA] < rank[rootB]) {
    parent[rootA] = rootB;
  } else if (rank[rootA] > rank[rootB]) {
    parent[rootB] = rootA;
  } else {
    parent[rootB] = rootA;
    rank[rootA]++;
  }
}

export interface PercolationResult {
  parent: Int32Array;
  size: number;
  topNode: number;
  bottomNode: number;
  percolates: boolean;
  openCount: number;
}

/** Two virtual nodes (appended after the grid) are unioned to every open
 * cell in row 0 / the last row respectively, so "does a cluster span the
 * grid" reduces to a single findRoot comparison — O(alpha(n)) amortized,
 * and avoids enumerating clusters just to check their row extents. */
export function runPercolation(size: number, field: Float32Array, p: number): PercolationResult {
  const n = size * size;
  const topNode = n;
  const bottomNode = n + 1;
  const parent = new Int32Array(n + 2);
  for (let i = 0; i < n + 2; i++) {
    parent[i] = i;
  }
  const rank = new Uint8Array(n + 2);
  let openCount = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      if (!isOpen(field, i, p)) {
        continue;
      }
      openCount++;
      if (x + 1 < size && isOpen(field, i + 1, p)) {
        union(parent, rank, i, i + 1);
      }
      if (y + 1 < size && isOpen(field, i + size, p)) {
        union(parent, rank, i, i + size);
      }
      if (y === 0) {
        union(parent, rank, i, topNode);
      }
      if (y === size - 1) {
        union(parent, rank, i, bottomNode);
      }
    }
  }

  return {
    parent,
    size,
    topNode,
    bottomNode,
    percolates: findRoot(parent, topNode) === findRoot(parent, bottomNode),
    openCount,
  };
}

export interface SweepPoint {
  p: number;
  fraction: number;
}

export function runSweep(size: number, baseSeed: number): SweepPoint[] {
  const points: SweepPoint[] = [];
  for (let step = 0; step <= SWEEP_P_STEPS; step++) {
    const p = step / SWEEP_P_STEPS;
    let successes = 0;
    for (let trial = 0; trial < SWEEP_TRIALS_PER_P; trial++) {
      const field = generateUniformField(size, baseSeed + step * 9973 + trial * 131);
      if (runPercolation(size, field, p).percolates) {
        successes++;
      }
    }
    points.push({ p, fraction: successes / SWEEP_TRIALS_PER_P });
  }
  return points;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

export function renderPercolation(
  imageData: ImageData,
  result: PercolationResult,
  field: Float32Array,
  p: number
): void {
  const { size } = result;
  const { data } = imageData;
  const spanningRoot = result.percolates ? findRoot(result.parent, result.topNode) : -1;

  for (let i = 0; i < size * size; i++) {
    const offset = i * 4;
    if (!isOpen(field, i, p)) {
      data[offset] = 8;
      data[offset + 1] = 9;
      data[offset + 2] = 16;
      data[offset + 3] = 255;
      continue;
    }

    const root = findRoot(result.parent, i);
    if (root === spanningRoot) {
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = 255;
      continue;
    }

    const hue = (root * 137.508) % 360;
    const [r, g, b] = hslToRgb(hue, 0.55, 0.5);
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = 255;
  }
}
