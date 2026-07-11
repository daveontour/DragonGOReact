export const DIR = { N: 0, E: 1, S: 2, W: 3 } as const;
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];
export const OPPOSITE = [2, 3, 0, 1];

export interface TileDef {
  id: string;
  /** Socket at each edge, indexed by DIR: 0 = blank/grass, 1 = pipe. */
  edges: [number, number, number, number];
  weight: number;
}

/** A small hand-authored "pipe" tile set. Weights bias collapse toward
 * simpler, less-constraining tiles (blank/straight/corner) and away from
 * highly-connective ones (T-junctions, cross), which keeps contradictions
 * rare in practice — a cross or T-junction demands a matching pipe socket
 * on 3-4 sides at once, while blank/straight/corner are compatible with
 * blank neighbors on their non-pipe sides. */
export const TILE_SET: TileDef[] = [
  { id: "blank", edges: [0, 0, 0, 0], weight: 1.0 },
  { id: "straight-h", edges: [0, 1, 0, 1], weight: 1.0 },
  { id: "straight-v", edges: [1, 0, 1, 0], weight: 1.0 },
  { id: "corner-ne", edges: [1, 1, 0, 0], weight: 1.0 },
  { id: "corner-se", edges: [0, 1, 1, 0], weight: 1.0 },
  { id: "corner-sw", edges: [0, 0, 1, 1], weight: 1.0 },
  { id: "corner-nw", edges: [1, 0, 0, 1], weight: 1.0 },
  { id: "t-no-n", edges: [0, 1, 1, 1], weight: 0.6 },
  { id: "t-no-e", edges: [1, 0, 1, 1], weight: 0.6 },
  { id: "t-no-s", edges: [1, 1, 0, 1], weight: 0.6 },
  { id: "t-no-w", edges: [1, 1, 1, 0], weight: 0.6 },
  { id: "cross", edges: [1, 1, 1, 1], weight: 0.4 },
];

export const TILE_COUNT = TILE_SET.length;
export const FULL_MASK = (1 << TILE_COUNT) - 1;

/** NEIGHBOR_MASK[tile][dir] = bitmask of tiles compatible as the neighbor
 * in direction `dir`: tileA's socket facing dir must equal tileB's socket
 * facing the opposite direction. Precomputed once at module load. */
export const NEIGHBOR_MASK: number[][] = TILE_SET.map((tileA) =>
  [0, 1, 2, 3].map((dir) => {
    let mask = 0;
    TILE_SET.forEach((tileB, j) => {
      if (tileA.edges[dir] === tileB.edges[OPPOSITE[dir]]) {
        mask |= 1 << j;
      }
    });
    return mask;
  })
);

export const MIN_WFC_GRID_SIZE = 8;
export const MAX_WFC_GRID_SIZE = 40;
export const DEFAULT_WFC_GRID_SIZE = 20;

export const MAX_RESTARTS = 50;

export function clampWfcGridSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_WFC_GRID_SIZE;
  }
  return Math.min(MAX_WFC_GRID_SIZE, Math.max(MIN_WFC_GRID_SIZE, Math.round(value)));
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

function popcount(n: number): number {
  let c = 0;
  while (n) {
    c += n & 1;
    n >>= 1;
  }
  return c;
}

export interface WfcState {
  width: number;
  height: number;
  cells: Uint16Array;
}

export function createWfcState(width: number, height: number): WfcState {
  return { width, height, cells: new Uint16Array(width * height).fill(FULL_MASK) };
}

function pickLowestEntropyCell(state: WfcState, rng: () => number): number | null {
  let minEntropy = Infinity;
  const candidates: number[] = [];
  for (let i = 0; i < state.cells.length; i++) {
    const e = popcount(state.cells[i]);
    if (e <= 1) {
      continue;
    }
    if (e < minEntropy) {
      minEntropy = e;
      candidates.length = 0;
      candidates.push(i);
    } else if (e === minEntropy) {
      candidates.push(i);
    }
  }
  if (candidates.length === 0) {
    return null;
  }
  return candidates[Math.floor(rng() * candidates.length)];
}

function weightedPickTile(mask: number, rng: () => number): number {
  let totalWeight = 0;
  const bits: number[] = [];
  for (let i = 0; i < TILE_COUNT; i++) {
    if (mask & (1 << i)) {
      bits.push(i);
      totalWeight += TILE_SET[i].weight;
    }
  }
  let r = rng() * totalWeight;
  for (const i of bits) {
    r -= TILE_SET[i].weight;
    if (r <= 0) {
      return i;
    }
  }
  return bits[bits.length - 1];
}

/** Collapses one cell (the lowest-entropy unresolved one) to a single
 * weighted-random tile, then propagates the constraint outward via an
 * explicit stack. Termination of the propagation loop is guaranteed
 * because every push corresponds to a strict popcount decrease in that
 * cell's mask, bounded below by 0. Returns false on contradiction (a
 * neighbor's mask reduced to zero) — the caller restarts with a new seed
 * rather than backtracking. Returns true (a no-op) once every cell is
 * already resolved. */
export function collapseStep(state: WfcState, rng: () => number): boolean {
  const cellIdx = pickLowestEntropyCell(state, rng);
  if (cellIdx === null) {
    return true;
  }

  const chosen = weightedPickTile(state.cells[cellIdx], rng);
  state.cells[cellIdx] = 1 << chosen;

  const { width, height } = state;
  const stack: number[] = [cellIdx];
  while (stack.length > 0) {
    const c = stack.pop() as number;
    const cx = c % width;
    const cy = Math.floor(c / width);
    for (let dir = 0; dir < 4; dir++) {
      const nx = cx + DX[dir];
      const ny = cy + DY[dir];
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
        continue;
      }
      const n = ny * width + nx;
      let allowed = 0;
      for (let t = 0; t < TILE_COUNT; t++) {
        if (state.cells[c] & (1 << t)) {
          allowed |= NEIGHBOR_MASK[t][dir];
        }
      }
      const newMask = state.cells[n] & allowed;
      if (newMask !== state.cells[n]) {
        if (newMask === 0) {
          return false;
        }
        state.cells[n] = newMask;
        stack.push(n);
      }
    }
  }
  return true;
}

export function isFullyResolved(state: WfcState): boolean {
  for (let i = 0; i < state.cells.length; i++) {
    if (popcount(state.cells[i]) !== 1) {
      return false;
    }
  }
  return true;
}

export interface WfcRunResult {
  state: WfcState;
  restarts: number;
}

export function runWfc(width: number, height: number, seed: number, maxRestarts: number = MAX_RESTARTS): WfcRunResult {
  for (let attempt = 0; attempt <= maxRestarts; attempt++) {
    const rng = createSeededRandom(seed + attempt * 7919);
    const state = createWfcState(width, height);
    let ok = true;
    while (ok && !isFullyResolved(state)) {
      ok = collapseStep(state, rng);
    }
    if (ok) {
      return { state, restarts: attempt };
    }
  }
  throw new Error("WFC failed to converge after max restarts");
}

export function drawWfcGrid(
  ctx: CanvasRenderingContext2D,
  size: number,
  state: WfcState,
  revealCount: number = state.cells.length
): void {
  ctx.fillStyle = "#0a0d18";
  ctx.fillRect(0, 0, size, size);

  const cellSize = size / Math.max(state.width, state.height);
  const count = Math.max(0, Math.min(revealCount, state.cells.length));

  ctx.strokeStyle = "#e6a844";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1.5, cellSize * 0.14);

  for (let i = 0; i < count; i++) {
    const mask = state.cells[i];
    if (popcount(mask) !== 1) {
      continue;
    }
    const tileIdx = Math.log2(mask);
    const tile = TILE_SET[tileIdx];
    const x = i % state.width;
    const y = Math.floor(i / state.width);
    const px = x * cellSize;
    const py = y * cellSize;
    const cx = px + cellSize / 2;
    const cy = py + cellSize / 2;

    ctx.beginPath();
    if (tile.edges[DIR.N]) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, py);
    }
    if (tile.edges[DIR.E]) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(px + cellSize, cy);
    }
    if (tile.edges[DIR.S]) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, py + cellSize);
    }
    if (tile.edges[DIR.W]) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, cy);
    }
    ctx.stroke();
  }
}
