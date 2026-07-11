export const DIR = { N: 0, E: 1, S: 2, W: 3 } as const;
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];
export const OPPOSITE = [2, 3, 0, 1];

export const MIN_MAZE_SIZE = 5;
export const MAX_MAZE_SIZE = 60;
export const DEFAULT_MAZE_SIZE = 25;

export const MIN_SOLVE_STEPS_PER_FRAME = 1;
export const MAX_SOLVE_STEPS_PER_FRAME = 800;
export const DEFAULT_SOLVE_STEPS_PER_FRAME = 120;

export const MAZE_BACKGROUND = "#0a0d18";
export const MAZE_WALL_COLOR = "#7fd4ff";
export const MAZE_PATH_COLOR = "#e6a844";
export const MAZE_FRONTIER_COLOR = "rgba(90, 170, 255, 0.18)";

/** Each cell stores a 4-bit passage bitmask (bit N/E/S/W = 1 means a
 * passage has been carved that way, i.e. no wall). Every cell starts with
 * all four bits clear ("fully walled") and carving sets bits in pairs. */
export interface MazeState {
  width: number;
  height: number;
  walls: Uint8Array;
}

export function clampMazeSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MAZE_SIZE;
  }
  return Math.min(MAX_MAZE_SIZE, Math.max(MIN_MAZE_SIZE, Math.round(value)));
}

export function clampSolveStepsPerFrame(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SOLVE_STEPS_PER_FRAME;
  }
  return Math.min(
    MAX_SOLVE_STEPS_PER_FRAME,
    Math.max(MIN_SOLVE_STEPS_PER_FRAME, Math.round(value))
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

export function createMaze(width: number, height: number): MazeState {
  return { width, height, walls: new Uint8Array(width * height) };
}

function shuffledDirections(rng: () => number): number[] {
  const dirs = [0, 1, 2, 3];
  for (let i = dirs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
  }
  return dirs;
}

export function isOpen(maze: MazeState, x: number, y: number, dir: number): boolean {
  if (x < 0 || x >= maze.width || y < 0 || y >= maze.height) {
    return false;
  }
  return (maze.walls[y * maze.width + x] & (1 << dir)) !== 0;
}

export function neighborIndex(maze: MazeState, x: number, y: number, dir: number): number {
  const nx = x + DX[dir];
  const ny = y + DY[dir];
  if (nx < 0 || nx >= maze.width || ny < 0 || ny >= maze.height) {
    return -1;
  }
  return ny * maze.width + nx;
}

/** Randomized depth-first search ("recursive backtracker"), written
 * iteratively with an explicit stack so it isn't bounded by JS call-stack
 * depth on large mazes. Produces a "perfect maze": exactly one path
 * between any two cells, since every carve marks the target visited and
 * carving never revisits a cell. */
export function carveMazeDFS(maze: MazeState, seed: number): void {
  const { width, height, walls } = maze;
  const total = width * height;
  if (total === 0) {
    return;
  }
  const visited = new Uint8Array(total);
  const rng = createSeededRandom(seed);
  const stack: number[] = [0];
  visited[0] = 1;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const cx = current % width;
    const cy = Math.floor(current / width);

    let carved = false;
    for (const dir of shuffledDirections(rng)) {
      const nx = cx + DX[dir];
      const ny = cy + DY[dir];
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
        continue;
      }
      const nIdx = ny * width + nx;
      if (visited[nIdx]) {
        continue;
      }
      walls[current] |= 1 << dir;
      walls[nIdx] |= 1 << OPPOSITE[dir];
      visited[nIdx] = 1;
      stack.push(nIdx);
      carved = true;
      break;
    }

    if (!carved) {
      stack.pop();
    }
  }
}

export interface BFSResult {
  distances: Int32Array;
  parent: Int32Array;
  path: number[];
}

function reconstructPath(
  distances: Int32Array,
  parent: Int32Array,
  startIdx: number,
  endIdx: number
): number[] {
  if (distances[endIdx] === -1) {
    return [];
  }
  const path: number[] = [];
  let node = endIdx;
  while (node !== -1) {
    path.push(node);
    if (node === startIdx) {
      break;
    }
    node = parent[node];
  }
  path.reverse();
  return path;
}

/** Full, synchronous breadth-first search — used by tests and for
 * instant-solve; the animated frontier reveal below re-implements the same
 * traversal incrementally over a step budget. */
export function solveMazeBFS(maze: MazeState, startIdx: number, endIdx: number): BFSResult {
  const total = maze.width * maze.height;
  const distances = new Int32Array(total).fill(-1);
  const parent = new Int32Array(total).fill(-1);
  const queue: number[] = [startIdx];
  distances[startIdx] = 0;

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const cx = current % maze.width;
    const cy = Math.floor(current / maze.width);
    for (let dir = 0; dir < 4; dir++) {
      if (!isOpen(maze, cx, cy, dir)) {
        continue;
      }
      const nIdx = neighborIndex(maze, cx, cy, dir);
      if (nIdx === -1 || distances[nIdx] !== -1) {
        continue;
      }
      distances[nIdx] = distances[current] + 1;
      parent[nIdx] = current;
      queue.push(nIdx);
    }
  }

  return { distances, parent, path: reconstructPath(distances, parent, startIdx, endIdx) };
}

export interface BFSIterState {
  maze: MazeState;
  distances: Int32Array;
  parent: Int32Array;
  visited: Uint8Array;
  queue: number[];
  head: number;
  startIdx: number;
  endIdx: number;
  done: boolean;
}

export function createBFSIterState(maze: MazeState, startIdx: number, endIdx: number): BFSIterState {
  const total = maze.width * maze.height;
  const distances = new Int32Array(total).fill(-1);
  const parent = new Int32Array(total).fill(-1);
  const visited = new Uint8Array(total);
  distances[startIdx] = 0;
  visited[startIdx] = 1;
  return {
    maze,
    distances,
    parent,
    visited,
    queue: [startIdx],
    head: 0,
    startIdx,
    endIdx,
    done: false,
  };
}

/** Advances the frontier by up to `steps` dequeued cells. Returns true once
 * the search is complete (either the target was reached or the whole
 * reachable region has been explored) — the steps-per-frame budget pattern
 * used elsewhere in the gallery for animated grid traversals. */
export function runBFSFrontierSteps(state: BFSIterState, steps: number): boolean {
  for (let i = 0; i < steps && state.head < state.queue.length; i++) {
    const current = state.queue[state.head++];
    if (current === state.endIdx) {
      state.done = true;
      break;
    }
    const cx = current % state.maze.width;
    const cy = Math.floor(current / state.maze.width);
    for (let dir = 0; dir < 4; dir++) {
      if (!isOpen(state.maze, cx, cy, dir)) {
        continue;
      }
      const nIdx = neighborIndex(state.maze, cx, cy, dir);
      if (nIdx === -1 || state.distances[nIdx] !== -1) {
        continue;
      }
      state.distances[nIdx] = state.distances[current] + 1;
      state.parent[nIdx] = current;
      state.visited[nIdx] = 1;
      state.queue.push(nIdx);
    }
  }

  if (state.head >= state.queue.length) {
    state.done = true;
  }
  return state.done;
}

export function pathFromBFSIterState(state: BFSIterState): number[] {
  return reconstructPath(state.distances, state.parent, state.startIdx, state.endIdx);
}

export function drawMaze(
  ctx: CanvasRenderingContext2D,
  size: number,
  maze: MazeState,
  lineWidth: number = 2,
  frontier: Uint8Array | null = null,
  path: number[] = []
): void {
  ctx.fillStyle = MAZE_BACKGROUND;
  ctx.fillRect(0, 0, size, size);

  const cellSize = size / Math.max(maze.width, maze.height);

  if (frontier) {
    ctx.fillStyle = MAZE_FRONTIER_COLOR;
    for (let i = 0; i < frontier.length; i++) {
      if (frontier[i]) {
        const x = i % maze.width;
        const y = Math.floor(i / maze.width);
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  ctx.strokeStyle = MAZE_WALL_COLOR;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "square";
  ctx.beginPath();
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      const px = x * cellSize;
      const py = y * cellSize;
      if (!isOpen(maze, x, y, DIR.N)) {
        ctx.moveTo(px, py);
        ctx.lineTo(px + cellSize, py);
      }
      if (!isOpen(maze, x, y, DIR.W)) {
        ctx.moveTo(px, py);
        ctx.lineTo(px, py + cellSize);
      }
      // South/East walls are only drawn on the outer boundary — interior
      // south/east walls are already drawn as the next cell's north/west.
      if (y === maze.height - 1 && !isOpen(maze, x, y, DIR.S)) {
        ctx.moveTo(px, py + cellSize);
        ctx.lineTo(px + cellSize, py + cellSize);
      }
      if (x === maze.width - 1 && !isOpen(maze, x, y, DIR.E)) {
        ctx.moveTo(px + cellSize, py);
        ctx.lineTo(px + cellSize, py + cellSize);
      }
    }
  }
  ctx.stroke();

  if (path.length > 1) {
    ctx.strokeStyle = MAZE_PATH_COLOR;
    ctx.lineWidth = Math.max(2, cellSize * 0.3);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const x = path[i] % maze.width;
      const y = Math.floor(path[i] / maze.width);
      const cx = x * cellSize + cellSize / 2;
      const cy = y * cellSize + cellSize / 2;
      if (i === 0) {
        ctx.moveTo(cx, cy);
      } else {
        ctx.lineTo(cx, cy);
      }
    }
    ctx.stroke();
  }
}
