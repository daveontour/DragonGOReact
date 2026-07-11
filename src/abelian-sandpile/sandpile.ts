export const GRID_SIZE = 201;
export const CENTER = Math.floor(GRID_SIZE / 2);
export const TOPPLE_THRESHOLD = 4;

export const MIN_GRAINS = 100;
export const MAX_GRAINS = 30_000;
export const DEFAULT_GRAINS = 15_000;

export const MIN_TOPPLES_PER_FRAME = 100;
export const MAX_TOPPLES_PER_FRAME = 20_000;
export const DEFAULT_TOPPLES_PER_FRAME = 2000;

/** Colors for chip counts 0/1/2/3 (and anything transiently >=3 while
 * queued for a topple it hasn't received its turn for yet — clamped to the
 * top tier rather than indexed out of bounds). */
export const SANDPILE_COLORS: Array<[number, number, number]> = [
  [10, 13, 24],
  [58, 130, 168],
  [230, 168, 68],
  [214, 84, 84],
];

export interface SandpileState {
  size: number;
  grid: Uint16Array;
}

export function clampGrainCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_GRAINS;
  }
  return Math.min(MAX_GRAINS, Math.max(MIN_GRAINS, Math.round(value)));
}

export function clampTopplesPerFrame(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TOPPLES_PER_FRAME;
  }
  return Math.min(
    MAX_TOPPLES_PER_FRAME,
    Math.max(MIN_TOPPLES_PER_FRAME, Math.round(value))
  );
}

export function createSandpileState(size: number): SandpileState {
  return { size, grid: new Uint16Array(size * size) };
}

/** -4 to the toppling cell, +1 to each in-grid neighbor (open boundary:
 * shares that would go off-grid are simply lost), queueing any neighbor
 * that reaches the threshold. A cell that received many increments before
 * its first turn in the worklist (e.g. a near neighbor of a huge point
 * drop) can still be >= threshold after a single -4, so it re-queues
 * itself in that case rather than being dropped as "resolved" after only
 * one topple — without this, relaxation falsely reports completion while
 * cells are still far above threshold, badly truncating the pattern. The
 * grid itself is a Uint16Array rather than Uint8Array for the same class
 * of reason: a neighbor of the drop point can transiently accumulate
 * thousands of grains before its first topple, which would silently wrap
 * a Uint8Array. */
function topple(state: SandpileState, idx: number, queue: number[]): void {
  const { size, grid } = state;
  const x = idx % size;
  const y = Math.floor(idx / size);
  grid[idx] -= TOPPLE_THRESHOLD;

  const neighbors: Array<[number, number]> = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];
  for (const [nx, ny] of neighbors) {
    if (nx < 0 || nx >= size || ny < 0 || ny >= size) {
      continue;
    }
    const nIdx = ny * size + nx;
    grid[nIdx] += 1;
    if (grid[nIdx] >= TOPPLE_THRESHOLD) {
      queue.push(nIdx);
    }
  }

  if (grid[idx] >= TOPPLE_THRESHOLD) {
    queue.push(idx);
  }
}

/** Adds `count` grains to a single cell one at a time, self-toppling that
 * cell back down immediately whenever it reaches the threshold. This is
 * the critical correctness fix: bulk-adding (`grid[idx] += count`) would
 * silently wrap a Uint8Array at 256 with no error and corrupt the
 * simulation, since count can be in the tens of thousands. Incrementing
 * one grain at a time and toppling immediately keeps the target cell's
 * value bounded to 0-4 at every point during the loop, and correctly
 * queues the outward cascade for the normal per-frame relax budget. */
export function dropGrains(
  state: SandpileState,
  x: number,
  y: number,
  count: number,
  queue: number[]
): void {
  const idx = y * state.size + x;
  for (let i = 0; i < count; i++) {
    state.grid[idx] += 1;
    if (state.grid[idx] >= TOPPLE_THRESHOLD) {
      topple(state, idx, queue);
    }
  }
}

/** Pops one entry from the worklist and topples it if it's still unstable
 * (duplicate/stale entries — already resolved by an earlier topple
 * elsewhere — are a correctly-skipped no-op, not an error). Returns
 * whether a real topple happened. Pops from the end (LIFO via
 * Array.pop, O(1)) rather than the front (FIFO via Array.shift, O(n) —
 * with a queue that can grow into the millions of duplicate entries for a
 * large grain count, shift() turns relaxation into an O(n^2) crawl). The
 * abelian property guarantees the final stable state is identical
 * regardless of processing order, so this is a pure performance fix, not
 * a behavior change. */
export function relaxOne(state: SandpileState, queue: number[]): boolean {
  if (queue.length === 0) {
    return false;
  }
  const idx = queue.pop() as number;
  if (state.grid[idx] < TOPPLE_THRESHOLD) {
    return false;
  }
  topple(state, idx, queue);
  return true;
}

/** Processes up to maxTopples real topples (bounding both successful
 * topples and, generously, total stale-skip work) so relaxation animates
 * visibly across frames instead of freezing the UI on a large grain drop. */
export function runToppleBudget(
  state: SandpileState,
  queue: number[],
  maxTopples: number
): number {
  let topples = 0;
  let iterations = 0;
  const maxIterations = maxTopples * 4;
  while (topples < maxTopples && queue.length > 0 && iterations < maxIterations) {
    iterations++;
    if (relaxOne(state, queue)) {
      topples++;
    }
  }
  return topples;
}

export function isFullyStable(state: SandpileState): boolean {
  for (let i = 0; i < state.grid.length; i++) {
    if (state.grid[i] >= TOPPLE_THRESHOLD) {
      return false;
    }
  }
  return true;
}

export function renderSandpile(imageData: ImageData, state: SandpileState): void {
  const { grid } = state;
  const { data } = imageData;

  for (let i = 0; i < grid.length; i++) {
    const tier = Math.min(SANDPILE_COLORS.length - 1, grid[i]);
    const [r, g, b] = SANDPILE_COLORS[tier];
    const offset = i * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = 255;
  }
}
