export const DIR = { N: 0, E: 1, S: 2, W: 3 } as const;
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];
export const OPPOSITE = [2, 3, 0, 1];

export const MIN_GRID_SIZE = 10;
export const MAX_GRID_SIZE = 60;
export const DEFAULT_GRID_SIZE = 30;

export const MIN_OBSTACLE_DENSITY = 0;
export const MAX_OBSTACLE_DENSITY = 0.5;
export const DEFAULT_OBSTACLE_DENSITY = 0.25;

export const NORMAL_COST = 1;
export const MUD_COST = 5;
export const WALL_COST = Infinity;

export const MIN_STEPS_PER_FRAME = 1;
export const MAX_STEPS_PER_FRAME = 200;
export const DEFAULT_STEPS_PER_FRAME = 20;

export function clampGridSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_GRID_SIZE;
  }
  return Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, Math.round(value)));
}

export function clampObstacleDensity(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_OBSTACLE_DENSITY;
  }
  return Math.min(MAX_OBSTACLE_DENSITY, Math.max(MIN_OBSTACLE_DENSITY, value));
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

export interface AStarGrid {
  width: number;
  height: number;
  cost: Float64Array;
}

export function createGrid(width: number, height: number): AStarGrid {
  return { width, height, cost: new Float64Array(width * height).fill(NORMAL_COST) };
}

export function generateRandomObstacles(
  grid: AStarGrid,
  density: number,
  seed: number,
  startIdx: number,
  goalIdx: number
): void {
  const rng = createSeededRandom(seed);
  for (let i = 0; i < grid.cost.length; i++) {
    if (i === startIdx || i === goalIdx) {
      grid.cost[i] = NORMAL_COST;
      continue;
    }
    const r = rng();
    if (r < density) {
      grid.cost[i] = WALL_COST;
    } else if (r < density + 0.15) {
      grid.cost[i] = MUD_COST;
    } else {
      grid.cost[i] = NORMAL_COST;
    }
  }
}

/** Manhattan distance. Admissible and consistent here specifically because
 * every enterable cell costs at least 1 to enter (NORMAL_COST=1, mud costs
 * more) — so cell-count is always a valid lower bound on the true
 * remaining cost. Do not scale this by any terrain cost. */
function heuristic(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export interface AStarState {
  openSet: number[];
  openSetMember: Uint8Array;
  closed: Uint8Array;
  gScore: Float64Array;
  fScore: Float64Array;
  cameFrom: Int32Array;
  current: number | null;
  done: boolean;
  found: boolean;
  expandedOrder: number[];
}

export function initAStar(grid: AStarGrid, startIdx: number): AStarState {
  const n = grid.width * grid.height;
  const gScore = new Float64Array(n).fill(Infinity);
  const fScore = new Float64Array(n).fill(Infinity);
  gScore[startIdx] = 0;
  const sx = startIdx % grid.width;
  const sy = Math.floor(startIdx / grid.width);
  fScore[startIdx] = heuristic(sx, sy, sx, sy);

  return {
    openSet: [startIdx],
    openSetMember: (() => {
      const arr = new Uint8Array(n);
      arr[startIdx] = 1;
      return arr;
    })(),
    closed: new Uint8Array(n),
    gScore,
    fScore,
    cameFrom: new Int32Array(n).fill(-1),
    current: null,
    done: false,
    found: false,
    expandedOrder: [],
  };
}

/** Pops the lowest-fScore open cell (linear scan + swap-pop — fine at grid
 * sizes up to a few thousand cells, no heap needed), marks it closed, and
 * relaxes its 4-connected neighbors. */
export function stepAStar(grid: AStarGrid, state: AStarState, goalIdx: number): void {
  if (state.openSet.length === 0) {
    state.done = true;
    state.found = false;
    return;
  }

  let bestPos = 0;
  for (let i = 1; i < state.openSet.length; i++) {
    if (state.fScore[state.openSet[i]] < state.fScore[state.openSet[bestPos]]) {
      bestPos = i;
    }
  }
  const current = state.openSet[bestPos];
  state.openSet[bestPos] = state.openSet[state.openSet.length - 1];
  state.openSet.pop();
  state.openSetMember[current] = 0;
  state.closed[current] = 1;
  state.current = current;
  state.expandedOrder.push(current);

  if (current === goalIdx) {
    state.done = true;
    state.found = true;
    return;
  }

  const cx = current % grid.width;
  const cy = Math.floor(current / grid.width);
  const gx = goalIdx % grid.width;
  const gy = Math.floor(goalIdx / grid.width);

  for (let d = 0; d < 4; d++) {
    const nx = cx + DX[d];
    const ny = cy + DY[d];
    if (nx < 0 || nx >= grid.width || ny < 0 || ny >= grid.height) {
      continue;
    }
    const neighbor = ny * grid.width + nx;
    if (grid.cost[neighbor] === WALL_COST || state.closed[neighbor]) {
      continue;
    }
    const tentativeG = state.gScore[current] + grid.cost[neighbor];
    if (tentativeG < state.gScore[neighbor]) {
      state.cameFrom[neighbor] = current;
      state.gScore[neighbor] = tentativeG;
      state.fScore[neighbor] = tentativeG + heuristic(nx, ny, gx, gy);
      if (!state.openSetMember[neighbor]) {
        state.openSet.push(neighbor);
        state.openSetMember[neighbor] = 1;
      }
    }
  }
}

export function runAStarSteps(grid: AStarGrid, state: AStarState, goalIdx: number, steps: number): void {
  for (let i = 0; i < steps && !state.done; i++) {
    stepAStar(grid, state, goalIdx);
  }
}

export function reconstructPath(state: AStarState, startIdx: number, goalIdx: number): number[] {
  if (state.gScore[goalIdx] === Infinity) {
    return [];
  }
  const path = [goalIdx];
  let cur = goalIdx;
  while (cur !== startIdx) {
    cur = state.cameFrom[cur];
    path.push(cur);
  }
  return path.reverse();
}

/** Dijkstra is just A* with h=0 — reusing stepAStar with an
 * always-zero heuristic would require branching inside the hot loop, so
 * this is a small standalone reference implementation used only for
 * differential testing against A*, not shipped in the app itself. */
export function dijkstraPathCost(grid: AStarGrid, startIdx: number, goalIdx: number): number {
  const n = grid.width * grid.height;
  const dist = new Float64Array(n).fill(Infinity);
  const visited = new Uint8Array(n);
  dist[startIdx] = 0;
  const queue = [startIdx];

  while (queue.length > 0) {
    let bestPos = 0;
    for (let i = 1; i < queue.length; i++) {
      if (dist[queue[i]] < dist[queue[bestPos]]) {
        bestPos = i;
      }
    }
    const current = queue[bestPos];
    queue[bestPos] = queue[queue.length - 1];
    queue.pop();
    if (visited[current]) {
      continue;
    }
    visited[current] = 1;
    if (current === goalIdx) {
      return dist[current];
    }

    const cx = current % grid.width;
    const cy = Math.floor(current / grid.width);
    for (let d = 0; d < 4; d++) {
      const nx = cx + DX[d];
      const ny = cy + DY[d];
      if (nx < 0 || nx >= grid.width || ny < 0 || ny >= grid.height) {
        continue;
      }
      const neighbor = ny * grid.width + nx;
      if (grid.cost[neighbor] === WALL_COST || visited[neighbor]) {
        continue;
      }
      const alt = dist[current] + grid.cost[neighbor];
      if (alt < dist[neighbor]) {
        dist[neighbor] = alt;
        queue.push(neighbor);
      }
    }
  }
  return dist[goalIdx];
}

export function pathCost(grid: AStarGrid, path: number[]): number {
  let cost = 0;
  for (let i = 1; i < path.length; i++) {
    cost += grid.cost[path[i]];
  }
  return cost;
}

export function drawAStarGrid(
  ctx: CanvasRenderingContext2D,
  size: number,
  grid: AStarGrid,
  state: AStarState | null,
  startIdx: number,
  goalIdx: number,
  path: number[]
): void {
  ctx.fillStyle = "#0a0d18";
  ctx.fillRect(0, 0, size, size);

  const cellSize = size / Math.max(grid.width, grid.height);

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const i = y * grid.width + x;
      let color: string | null = null;
      if (grid.cost[i] === WALL_COST) {
        color = "#1a1f33";
      } else if (grid.cost[i] === MUD_COST) {
        color = "rgba(120, 90, 50, 0.7)";
      } else if (state && state.closed[i]) {
        color = "rgba(90, 143, 212, 0.35)";
      } else if (state && state.openSetMember[i]) {
        color = "rgba(90, 200, 212, 0.5)";
      }
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize + 0.5, cellSize + 0.5);
      }
    }
  }

  if (path.length > 1) {
    ctx.strokeStyle = "#e6a844";
    ctx.lineWidth = Math.max(2, cellSize * 0.35);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    path.forEach((idx, i) => {
      const x = (idx % grid.width) * cellSize + cellSize / 2;
      const y = Math.floor(idx / grid.width) * cellSize + cellSize / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  const drawMarker = (idx: number, color: string) => {
    const x = (idx % grid.width) * cellSize + cellSize / 2;
    const y = Math.floor(idx / grid.width) * cellSize + cellSize / 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, cellSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
  };
  drawMarker(startIdx, "#4ac96e");
  drawMarker(goalIdx, "#e6545a");
}
