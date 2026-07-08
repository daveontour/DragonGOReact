export const MIN_GRID_DIMENSION = 8;
export const MAX_GRID_DIMENSION = 120;
export const DEFAULT_GRID_COLS = 60;
export const DEFAULT_GRID_ROWS = 60;

export const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

export type GoldenRatioOrientation = "horizontal-long" | "vertical-long";

export const DEFAULT_GOLDEN_ORIENTATION: GoldenRatioOrientation = "horizontal-long";

export const MIN_CELL_SIZE = 4;
export const MAX_CELL_SIZE = 24;
export const DEFAULT_CELL_SIZE = 8;

export const MIN_GUTTER = 0;
export const MAX_GUTTER = 5;
export const DEFAULT_GUTTER = 1;

export const MIN_COLOR_WEIGHT = 0;
export const MAX_COLOR_WEIGHT = 100;
export const DEFAULT_COLOR_WEIGHTS = {
  red: 45,
  green: 5,
  blue: 45,
  orange: 5,
} as const;

export const GRID_LINE_COLOR = "#111111";
export const GRID_BACKGROUND = "#111111";

export type TileColorId = "red" | "green" | "blue" | "orange";

export const TILE_COLOR_MAP: Record<TileColorId, string> = {
  red: "#d62828",
  green: "#2a6e3f",
  blue: "#3d5fab",
  orange: "#f77f00",
};

export const TILE_COLOR_OPTIONS: Array<{ id: TileColorId; label: string }> = [
  { id: "red", label: "Red" },
  { id: "green", label: "Green" },
  { id: "blue", label: "Blue" },
  { id: "orange", label: "Orange" },
];

export interface TileColorWeights {
  red: number;
  green: number;
  blue: number;
  orange: number;
}

export interface MorelletTilesParams {
  cols: number;
  rows: number;
  cellSize: number;
  gutter: number;
  colorWeights: TileColorWeights;
  exactMix?: boolean;
  seed: number;
}

export interface ResolvedMorelletTilesParams extends MorelletTilesParams {
  cols: number;
  rows: number;
  cellSize: number;
  gutter: number;
  colorWeights: TileColorWeights;
  exactMix: boolean;
}

export interface MorelletTilesArtwork {
  cells: TileColorId[];
  params: ResolvedMorelletTilesParams;
}

export function clampGridDimension(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(
    MAX_GRID_DIMENSION,
    Math.max(MIN_GRID_DIMENSION, Math.round(value))
  );
}

export function rowsForGoldenCols(
  cols: number,
  orientation: GoldenRatioOrientation = DEFAULT_GOLDEN_ORIENTATION
): number {
  const paired =
    orientation === "horizontal-long"
      ? Math.round(cols / GOLDEN_RATIO)
      : Math.round(cols * GOLDEN_RATIO);
  return clampGridDimension(paired, DEFAULT_GRID_ROWS);
}

export function colsForGoldenRows(
  rows: number,
  orientation: GoldenRatioOrientation = DEFAULT_GOLDEN_ORIENTATION
): number {
  const paired =
    orientation === "horizontal-long"
      ? Math.round(rows * GOLDEN_RATIO)
      : Math.round(rows / GOLDEN_RATIO);
  return clampGridDimension(paired, DEFAULT_GRID_COLS);
}

export function snapGridToGoldenRatio(
  cols: number,
  orientation: GoldenRatioOrientation = DEFAULT_GOLDEN_ORIENTATION
): { cols: number; rows: number } {
  const clampedCols = clampGridDimension(cols, DEFAULT_GRID_COLS);
  return {
    cols: clampedCols,
    rows: rowsForGoldenCols(clampedCols, orientation),
  };
}

export function clampCellSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_CELL_SIZE;
  }
  return Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, Math.round(value)));
}

export function clampGutter(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_GUTTER;
  }
  return Math.min(MAX_GUTTER, Math.max(MIN_GUTTER, Math.round(value)));
}

export function tilePitch(cellSize: number, gutter: number): number {
  return cellSize + gutter;
}

export function gridPixelSpan(cells: number, cellSize: number, gutter: number): number {
  if (cells <= 0) {
    return 0;
  }
  return cells * cellSize + (cells - 1) * gutter;
}

export function clampColorWeight(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(MAX_COLOR_WEIGHT, Math.max(MIN_COLOR_WEIGHT, Math.round(value)));
}

export function normalizeColorWeights(weights: TileColorWeights): TileColorWeights {
  const clamped: TileColorWeights = {
    red: clampColorWeight(weights.red),
    green: clampColorWeight(weights.green),
    blue: clampColorWeight(weights.blue),
    orange: clampColorWeight(weights.orange),
  };
  const total =
    clamped.red + clamped.green + clamped.blue + clamped.orange;
  if (total <= 0) {
    return { ...DEFAULT_COLOR_WEIGHTS };
  }
  return clamped;
}

export function colorWeightTotal(weights: TileColorWeights): number {
  return weights.red + weights.green + weights.blue + weights.orange;
}

export function colorPercentages(weights: TileColorWeights): TileColorWeights {
  const normalized = normalizeColorWeights(weights);
  const total = colorWeightTotal(normalized);
  if (total <= 0) {
    return { red: 25, green: 25, blue: 25, orange: 25 };
  }
  return {
    red: (normalized.red / total) * 100,
    green: (normalized.green / total) * 100,
    blue: (normalized.blue / total) * 100,
    orange: (normalized.orange / total) * 100,
  };
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

export function pickWeightedTileColor(
  rng: () => number,
  weights: TileColorWeights
): TileColorId {
  const normalized = normalizeColorWeights(weights);
  const total = colorWeightTotal(normalized);
  const roll = rng() * total;
  let cumulative = 0;
  for (const id of TILE_COLOR_OPTIONS.map((option) => option.id)) {
    cumulative += normalized[id];
    if (roll < cumulative) {
      return id;
    }
  }
  return "red";
}

export function exactColorCounts(
  total: number,
  weights: TileColorWeights
): Record<TileColorId, number> {
  const order = TILE_COLOR_OPTIONS.map((option) => option.id);
  const counts: Record<TileColorId, number> = {
    red: 0,
    green: 0,
    blue: 0,
    orange: 0,
  };
  if (total <= 0) {
    return counts;
  }

  const normalized = normalizeColorWeights(weights);
  const weightTotal = colorWeightTotal(normalized);
  if (weightTotal <= 0) {
    return counts;
  }

  // Largest-remainder allocation so the parts sum to exactly `total`.
  const remainders: Array<{ id: TileColorId; remainder: number }> = [];
  let allocated = 0;
  for (const id of order) {
    const exact = (normalized[id] / weightTotal) * total;
    const floor = Math.floor(exact);
    counts[id] = floor;
    allocated += floor;
    remainders.push({ id, remainder: exact - floor });
  }

  let leftover = total - allocated;
  remainders.sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < remainders.length && leftover > 0; i++) {
    counts[remainders[i].id] += 1;
    leftover -= 1;
  }

  return counts;
}

function buildExactMixCells(
  total: number,
  weights: TileColorWeights,
  rng: () => number
): TileColorId[] {
  const counts = exactColorCounts(total, weights);
  const bag: TileColorId[] = new Array(total);
  let index = 0;
  for (const option of TILE_COLOR_OPTIONS) {
    for (let i = 0; i < counts[option.id]; i++) {
      bag[index++] = option.id;
    }
  }

  // Fisher-Yates: for each position, select one of the remaining tiles and
  // remove it from the pool by swapping it out of range.
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = bag[i];
    bag[i] = bag[j];
    bag[j] = temp;
  }

  return bag;
}

export function generateMorelletTiles(
  params: MorelletTilesParams
): MorelletTilesArtwork {
  const resolved: ResolvedMorelletTilesParams = {
    cols: clampGridDimension(params.cols, DEFAULT_GRID_COLS),
    rows: clampGridDimension(params.rows, DEFAULT_GRID_ROWS),
    cellSize: clampCellSize(params.cellSize),
    gutter: clampGutter(params.gutter),
    colorWeights: normalizeColorWeights(params.colorWeights),
    exactMix: params.exactMix ?? false,
    seed: Math.abs(Math.trunc(params.seed)) || 1,
  };

  const rng = createSeededRandom(resolved.seed);
  const total = resolved.cols * resolved.rows;

  const cells: TileColorId[] = resolved.exactMix
    ? buildExactMixCells(total, resolved.colorWeights, rng)
    : (() => {
        const out: TileColorId[] = new Array(total);
        for (let i = 0; i < total; i++) {
          out[i] = pickWeightedTileColor(rng, resolved.colorWeights);
        }
        return out;
      })();

  return { cells, params: resolved };
}

export function countTilesByColor(
  cells: TileColorId[]
): Record<TileColorId, number> {
  const counts: Record<TileColorId, number> = {
    red: 0,
    green: 0,
    blue: 0,
    orange: 0,
  };
  for (const color of cells) {
    counts[color] += 1;
  }
  return counts;
}

export function artworkPixelSize(artwork: MorelletTilesArtwork): {
  width: number;
  height: number;
} {
  const { cols, rows, cellSize, gutter } = artwork.params;
  return {
    width: gridPixelSpan(cols, cellSize, gutter),
    height: gridPixelSpan(rows, cellSize, gutter),
  };
}

export function fitArtworkToViewport(
  artworkWidth: number,
  artworkHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  padding = 0
): {
  drawWidth: number;
  drawHeight: number;
  offsetX: number;
  offsetY: number;
  scale: number;
} {
  const availableWidth = Math.max(1, viewportWidth - padding * 2);
  const availableHeight = Math.max(1, viewportHeight - padding * 2);
  const scale = Math.min(
    availableWidth / artworkWidth,
    availableHeight / artworkHeight
  );
  const drawWidth = artworkWidth * scale;
  const drawHeight = artworkHeight * scale;
  return {
    drawWidth,
    drawHeight,
    offsetX: (viewportWidth - drawWidth) / 2,
    offsetY: (viewportHeight - drawHeight) / 2,
    scale,
  };
}

export function renderMorelletTiles(
  ctx: CanvasRenderingContext2D,
  artwork: MorelletTilesArtwork
): void {
  const { cols, rows, cellSize, gutter } = artwork.params;
  const width = gridPixelSpan(cols, cellSize, gutter);
  const height = gridPixelSpan(rows, cellSize, gutter);
  const pitch = tilePitch(cellSize, gutter);

  ctx.fillStyle = GRID_BACKGROUND;
  ctx.fillRect(0, 0, width, height);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const colorId = artwork.cells[row * cols + col];
      ctx.fillStyle = TILE_COLOR_MAP[colorId];
      ctx.fillRect(col * pitch, row * pitch, cellSize, cellSize);
    }
  }
}

export function renderMorelletTilesScaled(
  ctx: CanvasRenderingContext2D,
  artwork: MorelletTilesArtwork,
  targetWidth: number,
  targetHeight: number,
  options?: { fit?: boolean; background?: string }
): void {
  const { width, height } = artworkPixelSize(artwork);
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) {
    return;
  }
  renderMorelletTiles(offCtx, artwork);
  ctx.imageSmoothingEnabled = false;

  if (options?.fit) {
    const background = options.background ?? GRID_BACKGROUND;
    const fit = fitArtworkToViewport(width, height, targetWidth, targetHeight);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(
      offscreen,
      fit.offsetX,
      fit.offsetY,
      fit.drawWidth,
      fit.drawHeight
    );
    return;
  }

  ctx.drawImage(offscreen, 0, 0, targetWidth, targetHeight);
}
