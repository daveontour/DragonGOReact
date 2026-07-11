export interface Point {
  x: number;
  y: number;
}

export const MIN_RADIUS = 6;
export const MAX_RADIUS = 60;
export const DEFAULT_RADIUS = 16;

/** Bridson's paper default — fixed, not user-tunable. */
export const K_CANDIDATES = 30;

export const MIN_STEPS_PER_FRAME = 1;
export const MAX_STEPS_PER_FRAME = 200;
export const DEFAULT_STEPS_PER_FRAME = 40;

export function clampRadius(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_RADIUS;
  }
  return Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, value));
}

export function clampStepsPerFrame(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_STEPS_PER_FRAME;
  }
  return Math.min(MAX_STEPS_PER_FRAME, Math.max(MIN_STEPS_PER_FRAME, Math.round(value)));
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

export interface PoissonDiskState {
  width: number;
  height: number;
  radius: number;
  cellSize: number;
  gridW: number;
  gridH: number;
  grid: Int32Array;
  samples: Point[];
  active: number[];
  rng: () => number;
  done: boolean;
}

export function createPoissonDiskState(
  width: number,
  height: number,
  radius: number,
  seed: number
): PoissonDiskState {
  const cellSize = radius / Math.SQRT2;
  const gridW = Math.max(1, Math.ceil(width / cellSize));
  const gridH = Math.max(1, Math.ceil(height / cellSize));
  const grid = new Int32Array(gridW * gridH).fill(-1);
  const rng = createSeededRandom(seed);

  const first: Point = { x: rng() * width, y: rng() * height };
  const samples: Point[] = [first];
  const gx = Math.min(gridW - 1, Math.floor(first.x / cellSize));
  const gy = Math.min(gridH - 1, Math.floor(first.y / cellSize));
  grid[gy * gridW + gx] = 0;

  return {
    width,
    height,
    radius,
    cellSize,
    gridW,
    gridH,
    grid,
    samples,
    active: [0],
    rng,
    done: false,
  };
}

function hasConflict(state: PoissonDiskState, candidate: Point): boolean {
  const cx = Math.floor(candidate.x / state.cellSize);
  const cy = Math.floor(candidate.y / state.cellSize);
  // A candidate can be at most 2r from the source point that spawned it,
  // and cellSize = r/sqrt2, so 2r/cellSize = 2*sqrt2 ~= 2.83 cells — a
  // window of +-2 cells always covers every cell a conflicting sample
  // could occupy.
  for (let gy = cy - 2; gy <= cy + 2; gy++) {
    if (gy < 0 || gy >= state.gridH) continue;
    for (let gx = cx - 2; gx <= cx + 2; gx++) {
      if (gx < 0 || gx >= state.gridW) continue;
      const idx = state.grid[gy * state.gridW + gx];
      if (idx === -1) continue;
      const other = state.samples[idx];
      if (Math.hypot(candidate.x - other.x, candidate.y - other.y) < state.radius) {
        return true;
      }
    }
  }
  return false;
}

/** One Bridson iteration: pop a random active point, try up to
 * K_CANDIDATES points in the annulus [r, 2r] around it, accept the first
 * conflict-free one, or drop the source point from the active list
 * (order doesn't matter, so removal is a cheap swap-pop) if none work. */
export function stepPoissonDisk(state: PoissonDiskState): void {
  if (state.active.length === 0) {
    state.done = true;
    return;
  }

  const activeSlot = Math.floor(state.rng() * state.active.length);
  const pointIdx = state.active[activeSlot];
  const p = state.samples[pointIdx];

  for (let i = 0; i < K_CANDIDATES; i++) {
    const angle = state.rng() * Math.PI * 2;
    const dist = state.radius * (1 + state.rng());
    const candidate: Point = { x: p.x + Math.cos(angle) * dist, y: p.y + Math.sin(angle) * dist };
    if (candidate.x < 0 || candidate.y < 0 || candidate.x >= state.width || candidate.y >= state.height) {
      continue;
    }
    if (hasConflict(state, candidate)) {
      continue;
    }
    const newIdx = state.samples.length;
    state.samples.push(candidate);
    state.active.push(newIdx);
    const gx = Math.min(state.gridW - 1, Math.floor(candidate.x / state.cellSize));
    const gy = Math.min(state.gridH - 1, Math.floor(candidate.y / state.cellSize));
    state.grid[gy * state.gridW + gx] = newIdx;
    return;
  }

  state.active[activeSlot] = state.active[state.active.length - 1];
  state.active.pop();
  if (state.active.length === 0) {
    state.done = true;
  }
}

export function runPoissonSteps(state: PoissonDiskState, steps: number): void {
  for (let i = 0; i < steps && !state.done; i++) {
    stepPoissonDisk(state);
  }
}

export function runPoissonToCompletion(state: PoissonDiskState, maxIterations: number = 200_000): void {
  let iterations = 0;
  while (!state.done && iterations < maxIterations) {
    stepPoissonDisk(state);
    iterations++;
  }
}

export function drawPoissonSamples(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: PoissonDiskState,
  dotRadius: number
): void {
  ctx.fillStyle = "#0a0d18";
  ctx.fillRect(0, 0, width, height);

  const activeSet = new Set(state.active);
  for (let i = 0; i < state.samples.length; i++) {
    const p = state.samples[i];
    ctx.fillStyle = activeSet.has(i) ? "#e6a844" : "#7fd4ff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}
