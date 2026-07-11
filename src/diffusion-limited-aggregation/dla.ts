export type DLAColorMode = "mono" | "age";

export const GRID_SIZE = 161;
export const CENTER = (GRID_SIZE - 1) / 2;

export const MIN_STICKINESS = 0.05;
export const MAX_STICKINESS = 1;
export const DEFAULT_STICKINESS = 1;

export const MIN_LAUNCH_MARGIN = 4;
export const MAX_LAUNCH_MARGIN = 20;
export const DEFAULT_LAUNCH_MARGIN = 10;

export const MIN_KILL_RADIUS_MULTIPLIER = 1.5;
export const MAX_KILL_RADIUS_MULTIPLIER = 3;
export const DEFAULT_KILL_RADIUS_MULTIPLIER = 2;

export const MIN_ATTEMPTS_PER_FRAME = 1;
export const MAX_ATTEMPTS_PER_FRAME = 200;
export const DEFAULT_ATTEMPTS_PER_FRAME = 40;

// A particle that wanders this many lattice steps without sticking or
// exceeding the kill radius is abandoned — a hard backstop so a low
// stickiness value can't let one unlucky particle eat a whole frame budget.
export const MAX_STEPS_PER_PARTICLE = 5000;

export const MOORE_OFFSETS: Array<[number, number]> = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

export const DLA_BACKGROUND: [number, number, number] = [10, 13, 24];

export interface DLAState {
  size: number;
  occupied: Uint8Array;
  stickOrder: Uint16Array;
  maxOccupiedRadius: number;
  stuckCount: number;
}

export function clampStickiness(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_STICKINESS;
  }
  return Math.min(MAX_STICKINESS, Math.max(MIN_STICKINESS, value));
}

export function clampLaunchMargin(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LAUNCH_MARGIN;
  }
  return Math.min(MAX_LAUNCH_MARGIN, Math.max(MIN_LAUNCH_MARGIN, Math.round(value)));
}

export function clampKillRadiusMultiplier(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_KILL_RADIUS_MULTIPLIER;
  }
  return Math.min(
    MAX_KILL_RADIUS_MULTIPLIER,
    Math.max(MIN_KILL_RADIUS_MULTIPLIER, value)
  );
}

export function clampAttemptsPerFrame(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ATTEMPTS_PER_FRAME;
  }
  return Math.min(
    MAX_ATTEMPTS_PER_FRAME,
    Math.max(MIN_ATTEMPTS_PER_FRAME, Math.round(value))
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

export function createDLAState(size: number): DLAState {
  const center = (size - 1) / 2;
  const cx = Math.round(center);
  const cy = Math.round(center);
  const state: DLAState = {
    size,
    occupied: new Uint8Array(size * size),
    stickOrder: new Uint16Array(size * size),
    maxOccupiedRadius: 0,
    stuckCount: 1,
  };
  const idx = cy * size + cx;
  state.occupied[idx] = 1;
  state.stickOrder[idx] = 1;
  return state;
}

export function isOccupied(state: DLAState, x: number, y: number): boolean {
  if (x < 0 || x >= state.size || y < 0 || y >= state.size) {
    return false;
  }
  return state.occupied[y * state.size + x] === 1;
}

/** Moore (8-neighbor) adjacency, not von Neumann — reduces the square-
 * lattice anisotropy artifacts a 4-directional walk shows at small cluster
 * sizes, without changing the fractal's statistical dimension. */
export function hasOccupiedMooreNeighbor(state: DLAState, x: number, y: number): boolean {
  for (const [dx, dy] of MOORE_OFFSETS) {
    if (isOccupied(state, x + dx, y + dy)) {
      return true;
    }
  }
  return false;
}

export function spawnParticle(
  state: DLAState,
  rng: () => number,
  launchMargin: number
): { x: number; y: number } {
  const center = (state.size - 1) / 2;
  const radius = state.maxOccupiedRadius + launchMargin;
  const angle = rng() * Math.PI * 2;
  return {
    x: Math.round(center + Math.cos(angle) * radius),
    y: Math.round(center + Math.sin(angle) * radius),
  };
}

export function stepParticleRandomWalk(
  pos: { x: number; y: number },
  rng: () => number
): { x: number; y: number } {
  const [dx, dy] = MOORE_OFFSETS[Math.floor(rng() * MOORE_OFFSETS.length)];
  return { x: pos.x + dx, y: pos.y + dy };
}

/** If pos is Moore-adjacent to the aggregate, roll against stickiness and
 * (on success) commit it into the aggregate, updating stickOrder and
 * maxOccupiedRadius. Returns whether it stuck. Factored out from the
 * random-walk loop so the stick/no-stick decision is directly testable. */
export function attemptStick(
  state: DLAState,
  pos: { x: number; y: number },
  rng: () => number,
  stickiness: number
): boolean {
  if (!hasOccupiedMooreNeighbor(state, pos.x, pos.y)) {
    return false;
  }
  if (rng() >= stickiness) {
    return false;
  }
  if (pos.x < 0 || pos.x >= state.size || pos.y < 0 || pos.y >= state.size) {
    return false;
  }

  const idx = pos.y * state.size + pos.x;
  state.occupied[idx] = 1;
  state.stuckCount += 1;
  state.stickOrder[idx] = Math.min(65535, state.stuckCount);

  const center = (state.size - 1) / 2;
  const dist = Math.hypot(pos.x - center, pos.y - center);
  if (dist > state.maxOccupiedRadius) {
    state.maxOccupiedRadius = dist;
  }
  return true;
}

export function runParticleToCompletion(
  state: DLAState,
  rng: () => number,
  launchMargin: number,
  killRadiusMultiplier: number,
  stickiness: number
): "stuck" | "killed" | "step-cap" {
  const center = (state.size - 1) / 2;
  const launchRadius = state.maxOccupiedRadius + launchMargin;
  const killRadius = launchRadius * killRadiusMultiplier;
  let pos = spawnParticle(state, rng, launchMargin);

  for (let step = 0; step < MAX_STEPS_PER_PARTICLE; step++) {
    if (attemptStick(state, pos, rng, stickiness)) {
      return "stuck";
    }

    pos = stepParticleRandomWalk(pos, rng);
    const dist = Math.hypot(pos.x - center, pos.y - center);
    if (dist > killRadius) {
      return "killed";
    }
  }
  return "step-cap";
}

export function runDLAParticleAttempts(
  state: DLAState,
  rng: () => number,
  attempts: number,
  launchMargin: number,
  killRadiusMultiplier: number,
  stickiness: number
): number {
  let stuck = 0;
  for (let i = 0; i < attempts; i++) {
    const result = runParticleToCompletion(
      state,
      rng,
      launchMargin,
      killRadiusMultiplier,
      stickiness
    );
    if (result === "stuck") {
      stuck++;
    }
  }
  return stuck;
}

function hueToRgb(hue: number): [number, number, number] {
  const c = 0.75;
  const hp = hue / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = 0.62 - c / 2;
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export function renderDLA(
  imageData: ImageData,
  state: DLAState,
  colorMode: DLAColorMode
): void {
  const { data } = imageData;
  const maxOrder = Math.max(1, state.stuckCount);

  for (let i = 0; i < state.occupied.length; i++) {
    const offset = i * 4;
    if (state.occupied[i] === 0) {
      data[offset] = DLA_BACKGROUND[0];
      data[offset + 1] = DLA_BACKGROUND[1];
      data[offset + 2] = DLA_BACKGROUND[2];
      data[offset + 3] = 255;
      continue;
    }

    let r: number;
    let g: number;
    let b: number;
    if (colorMode === "mono") {
      [r, g, b] = [127, 212, 255];
    } else {
      const hue = (state.stickOrder[i] / maxOrder) * 300;
      [r, g, b] = hueToRgb(hue);
    }
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = 255;
  }
}
