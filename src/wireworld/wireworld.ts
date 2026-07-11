export type AutomatonMode = "wireworld" | "briansbrain";

// Wireworld cell states
export const WIRE_EMPTY = 0;
export const WIRE_HEAD = 1;
export const WIRE_TAIL = 2;
export const WIRE_CONDUCTOR = 3;

// Brian's Brain cell states
export const BRAIN_OFF = 0;
export const BRAIN_ON = 1;
export const BRAIN_DYING = 2;

export const GRID_WIDTH = 120;
export const GRID_HEIGHT = 80;

export const MIN_STEPS_PER_FRAME = 1;
export const MAX_STEPS_PER_FRAME = 60;
export const DEFAULT_STEPS_PER_FRAME = 10;

export const MIN_SEED_DENSITY = 0.05;
export const MAX_SEED_DENSITY = 0.4;
export const DEFAULT_SEED_DENSITY = 0.15;

export const WIREWORLD_BACKGROUND: [number, number, number] = [10, 13, 24];

export interface AutomatonState {
  width: number;
  height: number;
  current: Uint8Array;
  next: Uint8Array;
}

export function createAutomatonState(width: number, height: number): AutomatonState {
  return {
    width,
    height,
    current: new Uint8Array(width * height),
    next: new Uint8Array(width * height),
  };
}

export function clampStepsPerFrame(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_STEPS_PER_FRAME;
  }
  return Math.min(MAX_STEPS_PER_FRAME, Math.max(MIN_STEPS_PER_FRAME, Math.round(value)));
}

export function clampSeedDensity(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SEED_DENSITY;
  }
  return Math.min(MAX_SEED_DENSITY, Math.max(MIN_SEED_DENSITY, value));
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

/** Non-wrapping (clamped) Moore-neighborhood count — deliberate, since
 * Wireworld gates and Brian's Brain patterns are meant to sit inside a
 * bounded canvas rather than wrap around toroidally. */
export function countMooreNeighborsWithState(
  grid: Uint8Array,
  x: number,
  y: number,
  width: number,
  height: number,
  targetState: number
): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
        continue;
      }
      if (grid[ny * width + nx] === targetState) {
        count++;
      }
    }
  }
  return count;
}

/** head -> tail always; tail -> conductor always; conductor -> head IFF
 * exactly 1 or 2 Moore-neighbors are heads, else stays conductor; empty
 * stays empty. (Brian Silverman, 1987.) */
export function stepWireworld(state: AutomatonState): void {
  const { width, height, current, next } = state;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const cell = current[idx];
      if (cell === WIRE_HEAD) {
        next[idx] = WIRE_TAIL;
      } else if (cell === WIRE_TAIL) {
        next[idx] = WIRE_CONDUCTOR;
      } else if (cell === WIRE_CONDUCTOR) {
        const heads = countMooreNeighborsWithState(current, x, y, width, height, WIRE_HEAD);
        next[idx] = heads === 1 || heads === 2 ? WIRE_HEAD : WIRE_CONDUCTOR;
      } else {
        next[idx] = WIRE_EMPTY;
      }
    }
  }
  state.current = next;
  state.next = current;
}

/** on -> dying always; dying -> off always; off -> on IFF exactly 2
 * Moore-neighbors are "on", else stays off. (Brian Silverman, early 1990s.) */
export function stepBriansBrain(state: AutomatonState): void {
  const { width, height, current, next } = state;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const cell = current[idx];
      if (cell === BRAIN_ON) {
        next[idx] = BRAIN_DYING;
      } else if (cell === BRAIN_DYING) {
        next[idx] = BRAIN_OFF;
      } else {
        const onCount = countMooreNeighborsWithState(current, x, y, width, height, BRAIN_ON);
        next[idx] = onCount === 2 ? BRAIN_ON : BRAIN_OFF;
      }
    }
  }
  state.current = next;
  state.next = current;
}

export function stepAutomaton(state: AutomatonState, mode: AutomatonMode): void {
  if (mode === "wireworld") {
    stepWireworld(state);
  } else {
    stepBriansBrain(state);
  }
}

export function runSteps(state: AutomatonState, mode: AutomatonMode, steps: number): void {
  for (let i = 0; i < steps; i++) {
    stepAutomaton(state, mode);
  }
}

export function setCell(state: AutomatonState, x: number, y: number, value: number): void {
  if (x < 0 || x >= state.width || y < 0 || y >= state.height) {
    return;
  }
  state.current[y * state.width + x] = value;
}

export function clearGrid(state: AutomatonState): void {
  state.current.fill(0);
  state.next.fill(0);
}

export function seedBriansBrainRandom(state: AutomatonState, seed: number, density: number): void {
  const rng = createSeededRandom(seed);
  for (let i = 0; i < state.current.length; i++) {
    state.current[i] = rng() < density ? BRAIN_ON : BRAIN_OFF;
  }
}

export interface WireworldPresetCell {
  x: number;
  y: number;
  state: number;
}

export interface WireworldPreset {
  id: string;
  label: string;
  cells: WireworldPresetCell[];
}

/** A single-file rectangular loop with each 90-degree corner replaced by a
 * one-cell 45-degree diagonal cut. A sharp orthogonal L-corner would leave
 * the two cells flanking it Moore-adjacent to each other (they're a (1,1)
 * diagonal step apart), which lets a circulating electron's head leak into
 * the perpendicular arm and split into two — the diagonal cut removes that
 * spurious adjacency, matching how real Wireworld wire corners are built. */
function octagonLoopPath(x0: number, y0: number, w: number, h: number): Array<[number, number]> {
  const path: Array<[number, number]> = [];
  let x = x0 + 1;
  let y = y0;
  path.push([x, y]);

  const walk = (dx: number, dy: number, steps: number) => {
    for (let i = 0; i < steps; i++) {
      x += dx;
      y += dy;
      path.push([x, y]);
    }
  };

  walk(1, 0, w - 3); // top edge
  walk(1, 1, 1); // top-right diagonal cut
  walk(0, 1, h - 3); // right edge
  walk(-1, 1, 1); // bottom-right diagonal cut
  walk(-1, 0, w - 3); // bottom edge
  walk(-1, -1, 1); // bottom-left diagonal cut
  walk(0, -1, h - 3); // left edge
  // the loop closes implicitly: the last point here and path[0] are already
  // a valid (1,-1) diagonal step apart, so no explicit closing cell is added.

  return path;
}

function rectangleLoopCells(x0: number, y0: number, w: number, h: number): WireworldPresetCell[] {
  const path = octagonLoopPath(x0, y0, w, h);
  const cells: WireworldPresetCell[] = path.map(([x, y]) => ({ x, y, state: WIRE_CONDUCTOR }));
  // seed one electron (head immediately followed, behind it, by its tail)
  // to start circulation in the direction the path was walked.
  const [hx, hy] = path[0];
  const [tx, ty] = path[path.length - 1];
  cells.push({ x: hx, y: hy, state: WIRE_HEAD });
  cells.push({ x: tx, y: ty, state: WIRE_TAIL });
  return cells;
}

function straightWireCells(x0: number, y0: number, length: number): WireworldPresetCell[] {
  const cells: WireworldPresetCell[] = [];
  for (let x = x0; x < x0 + length; x++) {
    cells.push({ x, y: y0, state: WIRE_CONDUCTOR });
  }
  cells.push({ x: x0 + 1, y: y0, state: WIRE_HEAD });
  cells.push({ x: x0, y: y0, state: WIRE_TAIL });
  return cells;
}

export const WIREWORLD_PRESETS: WireworldPreset[] = [
  { id: "loop", label: "Oscillating loop", cells: rectangleLoopCells(10, 10, 100, 60) },
  { id: "pulse", label: "Straight pulse", cells: straightWireCells(10, 40, 100) },
];

export function applyPreset(state: AutomatonState, preset: WireworldPreset): void {
  clearGrid(state);
  for (const cell of preset.cells) {
    setCell(state, cell.x, cell.y, cell.state);
  }
}

export function wireworldColor(state: number): [number, number, number] {
  switch (state) {
    case WIRE_HEAD:
      return [255, 255, 140];
    case WIRE_TAIL:
      return [80, 140, 230];
    case WIRE_CONDUCTOR:
      return [200, 140, 50];
    default:
      return WIREWORLD_BACKGROUND;
  }
}

export function briansBrainColor(state: number): [number, number, number] {
  switch (state) {
    case BRAIN_ON:
      return [255, 255, 255];
    case BRAIN_DYING:
      return [80, 150, 255];
    default:
      return WIREWORLD_BACKGROUND;
  }
}

export function renderAutomaton(
  imageData: ImageData,
  state: AutomatonState,
  mode: AutomatonMode
): void {
  const { data } = imageData;
  const grid = state.current;
  const colorFn = mode === "wireworld" ? wireworldColor : briansBrainColor;

  for (let i = 0; i < grid.length; i++) {
    const [r, g, b] = colorFn(grid[i]);
    const offset = i * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = 255;
  }
}
