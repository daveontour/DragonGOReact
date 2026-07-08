export const MIN_MONDRIAN_DEPTH = 3;
export const MAX_MONDRIAN_DEPTH = 12;
export const DEFAULT_MONDRIAN_DEPTH = 7;
export const MIN_LINE_WIDTH = 4;
export const MAX_LINE_WIDTH = 20;
export const DEFAULT_LINE_WIDTH = 10;
export const MIN_COLOR_PROBABILITY = 0;
export const MAX_COLOR_PROBABILITY = 0.45;
export const DEFAULT_COLOR_PROBABILITY = 0.14;
export const MIN_CELL_SIZE = 24;
export const MAX_CELL_SIZE = 120;
export const DEFAULT_CELL_SIZE = 48;

export const MONDRIAN_WHITE = "#ffffff";
export const MONDRIAN_RED = "#e3051c";
export const MONDRIAN_BLUE = "#1e52a0";
export const MONDRIAN_YELLOW = "#fecb00";
export const MONDRIAN_BLACK = "#000000";

export const MONDRIAN_PRIMARIES = [
  MONDRIAN_RED,
  MONDRIAN_BLUE,
  MONDRIAN_YELLOW,
] as const;

export type MondrianColorId = "red" | "blue" | "yellow" | "black";

export const MONDRIAN_COLOR_MAP: Record<MondrianColorId, string> = {
  red: MONDRIAN_RED,
  blue: MONDRIAN_BLUE,
  yellow: MONDRIAN_YELLOW,
  black: MONDRIAN_BLACK,
};

export const MONDRIAN_COLOR_OPTIONS: Array<{
  id: MondrianColorId;
  label: string;
}> = [
  { id: "red", label: "Red" },
  { id: "blue", label: "Blue" },
  { id: "yellow", label: "Yellow" },
  { id: "black", label: "Black" },
];

export const DEFAULT_ENABLED_COLORS: MondrianColorId[] = [
  "red",
  "blue",
  "yellow",
  "black",
];

export interface MondrianRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MondrianCell extends MondrianRect {
  color: string;
}

export interface MondrianParams {
  width: number;
  height: number;
  maxDepth: number;
  lineWidth: number;
  minCellSize: number;
  colorProbability: number;
  enabledColors?: MondrianColorId[];
  seed: number;
}

export interface ResolvedMondrianParams
  extends Omit<MondrianParams, "enabledColors"> {
  enabledColors: MondrianColorId[];
}

export interface MondrianArtwork {
  cells: MondrianCell[];
  params: ResolvedMondrianParams;
}

export function clampMondrianDepth(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MONDRIAN_DEPTH;
  }
  return Math.min(MAX_MONDRIAN_DEPTH, Math.max(MIN_MONDRIAN_DEPTH, Math.round(value)));
}

export function clampLineWidth(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LINE_WIDTH;
  }
  return Math.min(MAX_LINE_WIDTH, Math.max(MIN_LINE_WIDTH, Math.round(value)));
}

export function clampColorProbability(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_COLOR_PROBABILITY;
  }
  return Math.min(
    MAX_COLOR_PROBABILITY,
    Math.max(MIN_COLOR_PROBABILITY, value)
  );
}

export function clampCellSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_CELL_SIZE;
  }
  return Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, Math.round(value)));
}

export function normalizeEnabledColors(
  colors: MondrianColorId[] | undefined
): MondrianColorId[] {
  if (!colors || colors.length === 0) {
    return [...DEFAULT_ENABLED_COLORS];
  }
  const valid = colors.filter((color) => color in MONDRIAN_COLOR_MAP);
  return valid.length > 0 ? valid : [...DEFAULT_ENABLED_COLORS];
}

export function toggleEnabledColor(
  colors: MondrianColorId[],
  color: MondrianColorId
): MondrianColorId[] {
  if (colors.includes(color)) {
    if (colors.length === 1) {
      return colors;
    }
    return colors.filter((entry) => entry !== color);
  }
  return [...colors, color];
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

function pickColor(
  rng: () => number,
  colorProbability: number,
  enabledColors: MondrianColorId[]
): string {
  if (rng() > colorProbability || enabledColors.length === 0) {
    return MONDRIAN_WHITE;
  }
  const index = Math.floor(rng() * enabledColors.length);
  return MONDRIAN_COLOR_MAP[enabledColors[index]];
}

function splitRect(
  rect: MondrianRect,
  depth: number,
  params: ResolvedMondrianParams,
  rng: () => number,
  cells: MondrianCell[]
): void {
  const { maxDepth, lineWidth, minCellSize, colorProbability, enabledColors } =
    params;

  if (
    depth >= maxDepth ||
    rect.width < minCellSize ||
    rect.height < minCellSize
  ) {
    cells.push({
      ...rect,
      color: pickColor(rng, colorProbability, enabledColors),
    });
    return;
  }

  const splitHorizontally = rect.width > rect.height;
  const splitVertically = rect.height > rect.width;

  if (splitHorizontally && rect.width >= minCellSize * 2 + lineWidth) {
    const minSplit = rect.x + minCellSize;
    const maxSplit = rect.x + rect.width - minCellSize - lineWidth;
    if (minSplit >= maxSplit) {
      cells.push({
        ...rect,
        color: pickColor(rng, colorProbability, enabledColors),
      });
      return;
    }
    const splitX = minSplit + rng() * (maxSplit - minSplit);
    splitRect(
      { x: rect.x, y: rect.y, width: splitX - rect.x, height: rect.height },
      depth + 1,
      params,
      rng,
      cells
    );
    splitRect(
      {
        x: splitX + lineWidth,
        y: rect.y,
        width: rect.x + rect.width - splitX - lineWidth,
        height: rect.height,
      },
      depth + 1,
      params,
      rng,
      cells
    );
    return;
  }

  if (splitVertically && rect.height >= minCellSize * 2 + lineWidth) {
    const minSplit = rect.y + minCellSize;
    const maxSplit = rect.y + rect.height - minCellSize - lineWidth;
    if (minSplit >= maxSplit) {
      cells.push({
        ...rect,
        color: pickColor(rng, colorProbability, enabledColors),
      });
      return;
    }
    const splitY = minSplit + rng() * (maxSplit - minSplit);
    splitRect(
      { x: rect.x, y: rect.y, width: rect.width, height: splitY - rect.y },
      depth + 1,
      params,
      rng,
      cells
    );
    splitRect(
      {
        x: rect.x,
        y: splitY + lineWidth,
        width: rect.width,
        height: rect.y + rect.height - splitY - lineWidth,
      },
      depth + 1,
      params,
      rng,
      cells
    );
    return;
  }

  cells.push({ ...rect, color: pickColor(rng, colorProbability, enabledColors) });
}

export function generateMondrian(params: MondrianParams): MondrianArtwork {
  const normalized: ResolvedMondrianParams = {
    width: Math.max(1, Math.round(params.width)),
    height: Math.max(1, Math.round(params.height)),
    maxDepth: clampMondrianDepth(params.maxDepth),
    lineWidth: clampLineWidth(params.lineWidth),
    minCellSize: clampCellSize(params.minCellSize),
    colorProbability: clampColorProbability(params.colorProbability),
    enabledColors: normalizeEnabledColors(params.enabledColors),
    seed: Math.abs(Math.trunc(params.seed)) || 1,
  };

  const rng = createSeededRandom(normalized.seed);
  const cells: MondrianCell[] = [];

  splitRect(
    { x: 0, y: 0, width: normalized.width, height: normalized.height },
    0,
    normalized,
    rng,
    cells
  );

  return { cells, params: normalized };
}

export function countColoredCells(cells: MondrianCell[]): number {
  return cells.filter((cell) => cell.color !== MONDRIAN_WHITE).length;
}

export function renderMondrian(
  ctx: CanvasRenderingContext2D,
  artwork: MondrianArtwork
): void {
  const { width, height } = artwork.params;
  ctx.fillStyle = MONDRIAN_BLACK;
  ctx.fillRect(0, 0, width, height);

  for (const cell of artwork.cells) {
    ctx.fillStyle = cell.color;
    ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
  }
}

export function renderMondrianScaled(
  ctx: CanvasRenderingContext2D,
  artwork: MondrianArtwork,
  targetWidth: number,
  targetHeight: number,
  options?: { showGridOverlay?: boolean }
): void {
  const offscreen = document.createElement("canvas");
  offscreen.width = artwork.params.width;
  offscreen.height = artwork.params.height;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) {
    return;
  }
  renderMondrian(offCtx, artwork);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offscreen, 0, 0, targetWidth, targetHeight);

  if (options?.showGridOverlay) {
    renderMondrianGridOverlay(ctx, artwork, targetWidth, targetHeight);
  }
}

export function renderMondrianGridOverlay(
  ctx: CanvasRenderingContext2D,
  artwork: MondrianArtwork,
  targetWidth: number,
  targetHeight: number
): void {
  const { width, height, lineWidth } = artwork.params;
  if (lineWidth <= 0) {
    return;
  }

  const scaleX = targetWidth / width;
  const scaleY = targetHeight / height;

  ctx.save();
  ctx.fillStyle = MONDRIAN_BLACK;
  ctx.imageSmoothingEnabled = false;

  for (let x = 0; x <= width; x += lineWidth) {
    const sx = Math.round(x * scaleX);
    if (sx < targetWidth) {
      ctx.fillRect(sx, 0, 1, targetHeight);
    }
  }
  for (let y = 0; y <= height; y += lineWidth) {
    const sy = Math.round(y * scaleY);
    if (sy < targetHeight) {
      ctx.fillRect(0, sy, targetWidth, 1);
    }
  }
  ctx.restore();
}
