export const MIN_CELL_PX = 1;
export const MAX_CELL_PX = 20;
export const DEFAULT_CELL_PX = 3;
export const MIN_GRID_COLS = 48;
export const MIN_GRID_ROWS = 32;
export const DEFAULT_COLS = 160;
export const DEFAULT_ROWS = 100;
export const MIN_SPEED = 1;
export const MAX_SPEED = 30;
export const DEFAULT_SPEED = 8;
export const DEFAULT_DENSITY = 0.28;

export type LifeGrid = Uint8Array;

export function createEmptyGrid(cols: number, rows: number): LifeGrid {
  return new Uint8Array(cols * rows);
}

export function createRandomGrid(
  cols: number,
  rows: number,
  density: number
): LifeGrid {
  const grid = createEmptyGrid(cols, rows);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = Math.random() < density ? 1 : 0;
  }
  return grid;
}

export function measureGridDimensions(
  width: number,
  height: number,
  minCellPx: number = DEFAULT_CELL_PX
): { cols: number; rows: number } {
  return {
    cols: Math.max(MIN_GRID_COLS, Math.floor(width / minCellPx)),
    rows: Math.max(MIN_GRID_ROWS, Math.floor(height / minCellPx)),
  };
}

export function clampCellPixelSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_CELL_PX;
  }
  return Math.min(MAX_CELL_PX, Math.max(MIN_CELL_PX, Math.round(value)));
}

export function resizeGrid(
  grid: LifeGrid,
  oldCols: number,
  oldRows: number,
  newCols: number,
  newRows: number
): LifeGrid {
  if (oldCols === newCols && oldRows === newRows) {
    return grid;
  }
  const next = createEmptyGrid(newCols, newRows);
  const copyCols = Math.min(oldCols, newCols);
  const copyRows = Math.min(oldRows, newRows);
  for (let y = 0; y < copyRows; y++) {
    for (let x = 0; x < copyCols; x++) {
      next[cellIndex(newCols, x, y)] = grid[cellIndex(oldCols, x, y)];
    }
  }
  return next;
}

export function cellIndex(cols: number, x: number, y: number): number {
  return y * cols + x;
}

export function getCell(
  grid: LifeGrid,
  cols: number,
  rows: number,
  x: number,
  y: number,
  wrap: boolean
): number {
  let cx = x;
  let cy = y;
  if (wrap) {
    cx = ((x % cols) + cols) % cols;
    cy = ((y % rows) + rows) % rows;
  } else if (x < 0 || x >= cols || y < 0 || y >= rows) {
    return 0;
  }
  return grid[cellIndex(cols, cx, cy)];
}

export function countLiveNeighbors(
  grid: LifeGrid,
  cols: number,
  rows: number,
  x: number,
  y: number,
  wrap: boolean
): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      count += getCell(grid, cols, rows, x + dx, y + dy, wrap);
    }
  }
  return count;
}

export function stepGameOfLife(
  grid: LifeGrid,
  cols: number,
  rows: number,
  wrap: boolean
): LifeGrid {
  const next = createEmptyGrid(cols, rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const alive = grid[cellIndex(cols, x, y)] === 1;
      const neighbors = countLiveNeighbors(grid, cols, rows, x, y, wrap);
      const survives = alive && (neighbors === 2 || neighbors === 3);
      const born = !alive && neighbors === 3;
      next[cellIndex(cols, x, y)] = survives || born ? 1 : 0;
    }
  }
  return next;
}

export function toggleCell(
  grid: LifeGrid,
  cols: number,
  x: number,
  y: number
): LifeGrid {
  const next = grid.slice();
  const index = cellIndex(cols, x, y);
  next[index] = next[index] ? 0 : 1;
  return next;
}

export function countLiveCells(grid: LifeGrid): number {
  let count = 0;
  for (let i = 0; i < grid.length; i++) {
    count += grid[i];
  }
  return count;
}

export type LifePatternId = "glider" | "pulsar" | "glider-gun" | "block" | "toad";

export interface LifePattern {
  id: LifePatternId;
  name: string;
  cells: Array<[number, number]>;
}

const GLIDER: Array<[number, number]> = [
  [1, 0],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
];

const TOAD: Array<[number, number]> = [
  [1, 0],
  [2, 0],
  [3, 0],
  [0, 1],
  [1, 1],
  [2, 1],
];

const BLOCK: Array<[number, number]> = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
];

const PULSAR: Array<[number, number]> = (() => {
  const arms = [
    [2, 0], [3, 0], [4, 0], [2, 5], [3, 5], [4, 5],
    [2, 7], [3, 7], [4, 7], [2, 12], [3, 12], [4, 12],
    [0, 2], [0, 3], [0, 4], [5, 2], [5, 3], [5, 4],
    [7, 2], [7, 3], [7, 4], [12, 2], [12, 3], [12, 4],
  ];
  const cells: Array<[number, number]> = [];
  for (const [x, y] of arms) {
    cells.push([x, y]);
  }
  return cells;
})();

const GLIDER_GUN: Array<[number, number]> = [
  [24, 0],
  [22, 1], [24, 1],
  [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2],
  [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3],
  [0, 4], [1, 4], [10, 4], [16, 4], [20, 4], [21, 4],
  [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5], [22, 5], [24, 5],
  [10, 6], [16, 6], [24, 6],
  [11, 7], [15, 7],
  [12, 8], [13, 8],
];

export const LIFE_PATTERNS: Record<LifePatternId, LifePattern> = {
  glider: { id: "glider", name: "Glider", cells: GLIDER },
  toad: { id: "toad", name: "Toad", cells: TOAD },
  block: { id: "block", name: "Block", cells: BLOCK },
  pulsar: { id: "pulsar", name: "Pulsar", cells: PULSAR },
  "glider-gun": { id: "glider-gun", name: "Gosper Glider Gun", cells: GLIDER_GUN },
};

export function stampPattern(
  grid: LifeGrid,
  cols: number,
  rows: number,
  pattern: LifePattern,
  originX: number,
  originY: number
): LifeGrid {
  const next = grid.slice();
  for (const [dx, dy] of pattern.cells) {
    const x = originX + dx;
    const y = originY + dy;
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      next[cellIndex(cols, x, y)] = 1;
    }
  }
  return next;
}

export function clampSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SPEED;
  }
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, Math.round(value)));
}
