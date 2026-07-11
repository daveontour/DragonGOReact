export const GRID_SIZE = 161;
export const CENTER = Math.floor(GRID_SIZE / 2);

export const MIN_ANT_COUNT = 1;
export const MAX_ANT_COUNT = 4;
export const DEFAULT_ANT_COUNT = 1;

export const MIN_RULE_LENGTH = 2;
export const MAX_RULE_LENGTH = 8;
export const DEFAULT_RULE = "RL";

export const MIN_STEPS_PER_FRAME = 1;
export const MAX_STEPS_PER_FRAME = 2000;
export const DEFAULT_STEPS_PER_FRAME = 200;

export const LANGTONS_ANT_BACKGROUND: [number, number, number] = [10, 13, 24];

export const RULE_PRESETS: Array<{ id: string; label: string; rule: string }> = [
  { id: "classic", label: "Classic (highway)", rule: "RL" },
  { id: "spiral", label: "Spiral", rule: "RRLL" },
  { id: "symmetric", label: "Symmetric growth", rule: "LLRR" },
  { id: "chaotic", label: "Chaotic filler", rule: "LRRRRRLLR" },
];

/** 0=up, 1=right, 2=down, 3=left — clockwise order so +1 is a right turn. */
export type Direction = 0 | 1 | 2 | 3;
export const DIRECTION_DELTAS: Array<[number, number]> = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export interface Ant {
  x: number;
  y: number;
  dir: Direction;
}

export interface TurmiteState {
  size: number;
  rule: string;
  grid: Uint8Array;
  ants: Ant[];
}

export function isValidRule(rule: string): boolean {
  return /^[LR]{2,8}$/.test(rule);
}

export function clampAntCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ANT_COUNT;
  }
  return Math.min(MAX_ANT_COUNT, Math.max(MIN_ANT_COUNT, Math.round(value)));
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

export function turnLeft(dir: Direction): Direction {
  return ((dir + 3) % 4) as Direction;
}

export function turnRight(dir: Direction): Direction {
  return ((dir + 1) % 4) as Direction;
}

export function createTurmiteState(
  size: number,
  rule: string,
  antCount: number,
  seed: number
): TurmiteState {
  const rng = createSeededRandom(seed);
  const mid = Math.floor(size / 2);
  const ants: Ant[] = [];
  for (let i = 0; i < antCount; i++) {
    const offsetX = antCount === 1 ? 0 : Math.round((rng() - 0.5) * size * 0.1);
    const offsetY = antCount === 1 ? 0 : Math.round((rng() - 0.5) * size * 0.1);
    ants.push({
      x: wrapIndex(mid + offsetX, size),
      y: wrapIndex(mid + offsetY, size),
      dir: Math.floor(rng() * 4) as Direction,
    });
  }
  return {
    size,
    rule,
    grid: new Uint8Array(size * size),
    ants,
  };
}

/** Reads the ant's current cell, turns per rule[color] (pre-update color),
 * advances that cell's color to (color+1) mod k, then moves forward one
 * cell with toroidal wraparound. This exact order reproduces the classic
 * two-color rule exactly: color 0 ("white") -> rule[0] -> flip to 1. */
export function stepAnt(state: TurmiteState, ant: Ant): void {
  const { size, rule, grid } = state;
  const idx = ant.y * size + ant.x;
  const color = grid[idx];
  const k = rule.length;

  ant.dir = rule[color] === "L" ? turnLeft(ant.dir) : turnRight(ant.dir);
  grid[idx] = (color + 1) % k;

  const [dx, dy] = DIRECTION_DELTAS[ant.dir];
  ant.x = wrapIndex(ant.x + dx, size);
  ant.y = wrapIndex(ant.y + dy, size);
}

export function stepTurmite(state: TurmiteState): void {
  for (const ant of state.ants) {
    stepAnt(state, ant);
  }
}

export function runTurmiteSteps(state: TurmiteState, steps: number): void {
  for (let i = 0; i < steps; i++) {
    stepTurmite(state);
  }
}

function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
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
  const m = lightness - c / 2;
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/** Color 0 is the dark background; colors 1..k-1 spread evenly across a hue
 * range so each color in a longer rule string reads as visually distinct. */
export function colorForCell(color: number, k: number): [number, number, number] {
  if (color === 0) {
    return LANGTONS_ANT_BACKGROUND;
  }
  const hue = ((color - 1) / Math.max(1, k - 1)) * 300;
  return hslToRgb(hue, 0.75, 0.62);
}

export function renderTurmite(imageData: ImageData, state: TurmiteState): void {
  const { grid, rule } = state;
  const { data } = imageData;
  const k = rule.length;

  for (let i = 0; i < grid.length; i++) {
    const [r, g, b] = colorForCell(grid[i], k);
    const offset = i * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = 255;
  }
}
