export const GRID_SIZE = 128;
export const DIFFUSION_U = 1.0;
export const DIFFUSION_V = 0.5;
export const REACTION_DT = 1;

export const MIN_FEED = 0.01;
export const MAX_FEED = 0.09;
export const DEFAULT_FEED = 0.037;

export const MIN_KILL = 0.045;
export const MAX_KILL = 0.07;
export const DEFAULT_KILL = 0.06;

export const MIN_STEPS_PER_FRAME = 1;
export const MAX_STEPS_PER_FRAME = 40;
export const DEFAULT_STEPS_PER_FRAME = 16;

export type ReactionDiffusionColorMode = "mono" | "ocean" | "thermal";

export interface ReactionDiffusionPreset {
  id: string;
  label: string;
  feed: number;
  kill: number;
}

export const REACTION_DIFFUSION_PRESETS: ReactionDiffusionPreset[] = [
  { id: "coral", label: "Coral growth", feed: 0.0545, kill: 0.062 },
  { id: "mitosis", label: "Mitosis", feed: 0.0367, kill: 0.0649 },
  { id: "spots", label: "Spots", feed: 0.035, kill: 0.065 },
  { id: "stripes", label: "Stripes / maze", feed: 0.026, kill: 0.055 },
  { id: "turbulence", label: "Turbulence", feed: 0.02, kill: 0.05 },
];

export interface ReactionDiffusionState {
  size: number;
  u: Float32Array;
  v: Float32Array;
  uNext: Float32Array;
  vNext: Float32Array;
}

export function clampFeed(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_FEED;
  }
  return Math.min(MAX_FEED, Math.max(MIN_FEED, value));
}

export function clampKill(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_KILL;
  }
  return Math.min(MAX_KILL, Math.max(MIN_KILL, value));
}

export function clampStepsPerFrame(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_STEPS_PER_FRAME;
  }
  return Math.min(
    MAX_STEPS_PER_FRAME,
    Math.max(MIN_STEPS_PER_FRAME, Math.round(value))
  );
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

export function wrapIndex(value: number, size: number): number {
  return ((value % size) + size) % size;
}

/** The classic 9-point Gray-Scott stencil (edges 0.2, corners 0.05, center
 * weight -1), sampled with toroidal (wraparound) boundaries so the pattern
 * tiles seamlessly instead of showing edge artifacts. */
export function laplacianAt(
  grid: Float32Array,
  x: number,
  y: number,
  size: number
): number {
  const xm1 = wrapIndex(x - 1, size);
  const xp1 = wrapIndex(x + 1, size);
  const ym1 = wrapIndex(y - 1, size);
  const yp1 = wrapIndex(y + 1, size);

  const center = grid[y * size + x];
  const edgeSum =
    grid[y * size + xm1] +
    grid[y * size + xp1] +
    grid[ym1 * size + x] +
    grid[yp1 * size + x];
  const cornerSum =
    grid[ym1 * size + xm1] +
    grid[ym1 * size + xp1] +
    grid[yp1 * size + xm1] +
    grid[yp1 * size + xp1];

  return edgeSum * 0.2 + cornerSum * 0.05 - center;
}

/** Drops a few small round blobs of the "reacted" state (u=0.5, v~0.25) near
 * the center so the simulation has something to grow from; the seeded RNG
 * jitters blob position and v slightly to break perfect symmetry. */
export function seedCenterPerturbation(
  state: ReactionDiffusionState,
  seed: number
): void {
  const rng = createSeededRandom(seed);
  const { size, u, v } = state;
  const blobRadius = Math.max(2, Math.round(size * 0.05));
  const blobCount = 3;

  for (let b = 0; b < blobCount; b++) {
    const cx = Math.floor(size / 2 + (rng() - 0.5) * size * 0.2);
    const cy = Math.floor(size / 2 + (rng() - 0.5) * size * 0.2);
    for (let dy = -blobRadius; dy <= blobRadius; dy++) {
      for (let dx = -blobRadius; dx <= blobRadius; dx++) {
        if (dx * dx + dy * dy > blobRadius * blobRadius) {
          continue;
        }
        const x = wrapIndex(cx + dx, size);
        const y = wrapIndex(cy + dy, size);
        const idx = y * size + x;
        u[idx] = 0.5;
        v[idx] = 0.25 + rng() * 0.05;
      }
    }
  }
}

export function createReactionDiffusionState(
  size: number,
  seed: number
): ReactionDiffusionState {
  const total = size * size;
  const state: ReactionDiffusionState = {
    size,
    u: new Float32Array(total).fill(1),
    v: new Float32Array(total),
    uNext: new Float32Array(total),
    vNext: new Float32Array(total),
  };
  seedCenterPerturbation(state, seed);
  return state;
}

/** One Gray-Scott Euler step: diffuse both chemicals, react u+2v -> 3v, feed
 * u back in, and kill v off, then ping-pong the buffers (no array copy). */
export function stepReactionDiffusion(
  state: ReactionDiffusionState,
  feed: number,
  kill: number
): void {
  const { size, u, v, uNext, vNext } = state;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const uVal = u[idx];
      const vVal = v[idx];
      const reaction = uVal * vVal * vVal;
      const lu = laplacianAt(u, x, y, size);
      const lv = laplacianAt(v, x, y, size);

      uNext[idx] =
        uVal + (DIFFUSION_U * lu - reaction + feed * (1 - uVal)) * REACTION_DT;
      vNext[idx] =
        vVal + (DIFFUSION_V * lv + reaction - (feed + kill) * vVal) * REACTION_DT;
    }
  }

  state.u = uNext;
  state.v = vNext;
  state.uNext = u;
  state.vNext = v;
}

export function runReactionDiffusionSteps(
  state: ReactionDiffusionState,
  feed: number,
  kill: number,
  steps: number
): void {
  for (let i = 0; i < steps; i++) {
    stepReactionDiffusion(state, feed, kill);
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function colorForConcentration(
  value: number,
  colorMode: ReactionDiffusionColorMode
): [number, number, number] {
  const t = clamp01(value);

  if (colorMode === "ocean") {
    return [
      lerpChannel(6, 235, t),
      lerpChannel(20, 245, t),
      lerpChannel(46, 250, t),
    ];
  }

  if (colorMode === "thermal") {
    return [
      lerpChannel(10, 255, t),
      lerpChannel(6, 210, t ** 1.6),
      lerpChannel(20, 120, t ** 3),
    ];
  }

  const c = lerpChannel(8, 250, t);
  return [c, c, c];
}

/** Renders u-v (background chemical minus the reacting one) so untouched
 * plate reads bright and reacted regions read dark, matching the classic
 * Gray-Scott look; imageData is expected to be state.size x state.size. */
export function renderReactionDiffusion(
  imageData: ImageData,
  state: ReactionDiffusionState,
  colorMode: ReactionDiffusionColorMode
): void {
  const { u, v } = state;
  const { data } = imageData;

  for (let i = 0; i < u.length; i++) {
    const value = clamp01(u[i] - v[i]);
    const [r, g, b] = colorForConcentration(value, colorMode);
    const offset = i * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = 255;
  }
}
