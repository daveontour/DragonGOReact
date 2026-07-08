export const MIN_GRID_COUNT = 4;
export const MAX_GRID_COUNT = 32;
export const DEFAULT_GRID_COLS = 14;
export const DEFAULT_GRID_ROWS = 10;
export const MIN_LINE_WIDTH = 1;
export const MAX_LINE_WIDTH = 8;
export const DEFAULT_LINE_WIDTH = 2;
export const MIN_ANGLE = 0;
export const MAX_ANGLE = 180;
export const DEFAULT_PRIMARY_ANGLE = 45;
export const MIN_SECONDARY_OFFSET = 15;
export const MAX_SECONDARY_OFFSET = 165;
export const DEFAULT_SECONDARY_OFFSET = 90;
export const MIN_EMPTY_PROBABILITY = 0;
export const MAX_EMPTY_PROBABILITY = 0.6;
export const DEFAULT_EMPTY_PROBABILITY = 0.15;
export const MIN_LINE_SPACING = 8;
export const MAX_LINE_SPACING = 48;
export const DEFAULT_LINE_SPACING = 20;

export const MORELLET_WHITE = "#ffffff";
export const MORELLET_BLACK = "#111111";
export const MORELLET_RED = "#e4002b";

export type MorelletPatternId = "random-tiles" | "crossed-trames" | "six-axes";

export const MORELLET_PATTERNS: Array<{
  id: MorelletPatternId;
  label: string;
  description: string;
}> = [
  {
    id: "random-tiles",
    label: "Random tiles",
    description: "Each cell gets a line at 0° or 90°, like Répartition aléatoire.",
  },
  {
    id: "crossed-trames",
    label: "Crossed trames",
    description: "Two overlapping line fields at adjustable angles.",
  },
  {
    id: "six-axes",
    label: "Six axes",
    description: "Each cell picks one of six directions in 30° steps.",
  },
];

export interface MorelletTile {
  col: number;
  row: number;
  angleDeg: number;
}

export interface MorelletParams {
  width: number;
  height: number;
  cols: number;
  rows: number;
  lineWidth: number;
  pattern: MorelletPatternId;
  primaryAngle: number;
  secondaryOffset: number;
  lineSpacing: number;
  emptyProbability: number;
  seed: number;
  showTileGrid: boolean;
  accentRed: boolean;
}

export interface ResolvedMorelletParams extends MorelletParams {
  cols: number;
  rows: number;
}

export interface MorelletArtwork {
  tiles: MorelletTile[];
  params: ResolvedMorelletParams;
}

export function clampGridCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_GRID_COLS;
  }
  return Math.min(MAX_GRID_COUNT, Math.max(MIN_GRID_COUNT, Math.round(value)));
}

export function clampLineWidth(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LINE_WIDTH;
  }
  return Math.min(MAX_LINE_WIDTH, Math.max(MIN_LINE_WIDTH, Math.round(value)));
}

export function clampAngle(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PRIMARY_ANGLE;
  }
  return Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, Math.round(value)));
}

export function clampSecondaryOffset(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SECONDARY_OFFSET;
  }
  return Math.min(
    MAX_SECONDARY_OFFSET,
    Math.max(MIN_SECONDARY_OFFSET, Math.round(value))
  );
}

export function clampEmptyProbability(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_EMPTY_PROBABILITY;
  }
  return Math.min(
    MAX_EMPTY_PROBABILITY,
    Math.max(MIN_EMPTY_PROBABILITY, value)
  );
}

export function clampLineSpacing(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LINE_SPACING;
  }
  return Math.min(MAX_LINE_SPACING, Math.max(MIN_LINE_SPACING, Math.round(value)));
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

function normalizeParams(params: MorelletParams): ResolvedMorelletParams {
  return {
    width: Math.max(1, Math.round(params.width)),
    height: Math.max(1, Math.round(params.height)),
    cols: clampGridCount(params.cols),
    rows: clampGridCount(params.rows),
    lineWidth: clampLineWidth(params.lineWidth),
    pattern: params.pattern,
    primaryAngle: clampAngle(params.primaryAngle),
    secondaryOffset: clampSecondaryOffset(params.secondaryOffset),
    lineSpacing: clampLineSpacing(params.lineSpacing),
    emptyProbability: clampEmptyProbability(params.emptyProbability),
    seed: Math.abs(Math.trunc(params.seed)) || 1,
    showTileGrid: params.showTileGrid,
    accentRed: params.accentRed,
  };
}

function tileAnglesForPattern(pattern: MorelletPatternId): number[] {
  switch (pattern) {
    case "six-axes":
      return [0, 30, 60, 90, 120, 150];
    case "random-tiles":
    default:
      return [0, 90];
  }
}

export function generateMorellet(params: MorelletParams): MorelletArtwork {
  const normalized = normalizeParams(params);
  const tiles: MorelletTile[] = [];

  if (normalized.pattern === "crossed-trames") {
    return { tiles, params: normalized };
  }

  const rng = createSeededRandom(normalized.seed);
  const angles = tileAnglesForPattern(normalized.pattern);

  for (let row = 0; row < normalized.rows; row++) {
    for (let col = 0; col < normalized.cols; col++) {
      if (rng() < normalized.emptyProbability) {
        continue;
      }
      const angleIndex = Math.floor(rng() * angles.length);
      tiles.push({
        col,
        row,
        angleDeg: angles[angleIndex],
      });
    }
  }

  return { tiles, params: normalized };
}

function lineColorForTile(
  accentRed: boolean,
  col: number,
  row: number,
  angleDeg: number
): string {
  if (!accentRed) {
    return MORELLET_BLACK;
  }
  return (col + row + angleDeg) % 3 === 0 ? MORELLET_RED : MORELLET_BLACK;
}

export function drawTileLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  angleDeg: number,
  color: string,
  lineWidth: number
): void {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const angle = (angleDeg * Math.PI) / 180;
  const halfLength = Math.sqrt(width * width + height * height) / 2;
  const dx = Math.cos(angle) * halfLength;
  const dy = Math.sin(angle) * halfLength;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(cx - dx, cy - dy);
  ctx.lineTo(cx + dx, cy + dy);
  ctx.stroke();
}

export function drawParallelLineField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  angleDeg: number,
  spacing: number,
  color: string,
  lineWidth: number
): void {
  const angle = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const nx = Math.cos(angle + Math.PI / 2);
  const ny = Math.sin(angle + Math.PI / 2);
  const diagonal = Math.sqrt(width * width + height * height);
  const lineCount = Math.ceil(diagonal / spacing) + 2;
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "butt";

  for (let i = -lineCount; i <= lineCount; i++) {
    const offset = i * spacing;
    const ox = centerX + nx * offset;
    const oy = centerY + ny * offset;
    ctx.beginPath();
    ctx.moveTo(ox - dx * diagonal, oy - dy * diagonal);
    ctx.lineTo(ox + dx * diagonal, oy + dy * diagonal);
    ctx.stroke();
  }
}

export function renderMorellet(
  ctx: CanvasRenderingContext2D,
  artwork: MorelletArtwork
): void {
  const { width, height, cols, rows, lineWidth, pattern, primaryAngle, secondaryOffset, lineSpacing, showTileGrid, accentRed } =
    artwork.params;

  ctx.fillStyle = MORELLET_WHITE;
  ctx.fillRect(0, 0, width, height);

  if (pattern === "crossed-trames") {
    drawParallelLineField(
      ctx,
      width,
      height,
      primaryAngle,
      lineSpacing,
      MORELLET_BLACK,
      lineWidth
    );
    drawParallelLineField(
      ctx,
      width,
      height,
      primaryAngle + secondaryOffset,
      lineSpacing,
      accentRed ? MORELLET_RED : MORELLET_BLACK,
      lineWidth
    );
    return;
  }

  const cellWidth = width / cols;
  const cellHeight = height / rows;

  for (const tile of artwork.tiles) {
    const x = tile.col * cellWidth;
    const y = tile.row * cellHeight;
    const color = lineColorForTile(accentRed, tile.col, tile.row, tile.angleDeg);
    drawTileLine(ctx, x, y, cellWidth, cellHeight, tile.angleDeg, color, lineWidth);
  }

  if (showTileGrid) {
    ctx.strokeStyle = "rgba(17, 17, 17, 0.2)";
    ctx.lineWidth = 1;
    for (let col = 0; col <= cols; col++) {
      const x = col * cellWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let row = 0; row <= rows; row++) {
      const y = row * cellHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
}

export function renderMorelletScaled(
  ctx: CanvasRenderingContext2D,
  artwork: MorelletArtwork,
  targetWidth: number,
  targetHeight: number
): void {
  const offscreen = document.createElement("canvas");
  offscreen.width = artwork.params.width;
  offscreen.height = artwork.params.height;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) {
    return;
  }
  renderMorellet(offCtx, artwork);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(offscreen, 0, 0, targetWidth, targetHeight);
}

export function countFilledTiles(artwork: MorelletArtwork): number {
  return artwork.tiles.length;
}
