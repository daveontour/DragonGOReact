export type TileStyle = "arcs" | "diagonal" | "smith";
export type TruchetColorMode = "mono" | "by-orientation" | "rainbow";

export const MIN_GRID_SIZE = 4;
export const MAX_GRID_SIZE = 48;
export const DEFAULT_GRID_SIZE = 16;

export const MIN_LINE_WIDTH = 1;
export const MAX_LINE_WIDTH = 8;
export const DEFAULT_LINE_WIDTH = 2.5;

export const TRUCHET_BACKGROUND = "#0a0d18";
export const TRUCHET_LINE_COLOR = "#7fd4ff";

export interface TruchetGrid {
  cols: number;
  rows: number;
  style: TileStyle;
  orientations: Uint8Array;
}

export interface ArcSpec {
  cx: number;
  cy: number;
  start: number;
  end: number;
}

export function clampGridSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_GRID_SIZE;
  }
  return Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, Math.round(value)));
}

export function clampLineWidth(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LINE_WIDTH;
  }
  return Math.min(MAX_LINE_WIDTH, Math.max(MIN_LINE_WIDTH, value));
}

/** "arcs"/"diagonal" only ever need one of two mirrored orientations;
 * "smith" rotates a single-corner motif through all four 90-degree steps. */
export function orientationCountFor(style: TileStyle): number {
  return style === "smith" ? 4 : 2;
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

export function generateTruchetGrid(
  cols: number,
  rows: number,
  style: TileStyle,
  seed: number
): TruchetGrid {
  const rng = createSeededRandom(seed);
  const orientationCount = orientationCountFor(style);
  const orientations = new Uint8Array(cols * rows);
  for (let i = 0; i < orientations.length; i++) {
    orientations[i] = Math.floor(rng() * orientationCount);
  }
  return { cols, rows, style, orientations };
}

/** Returns the quarter-circle arcs (center + angle sweep) that make up a
 * tile, in tile-local pixel coordinates. Split out from drawTruchetTile so
 * the geometry itself — in particular the "orientation 0 and 1 are mirror
 * images" claim — can be asserted without a canvas. */
export function arcsForTile(
  x: number,
  y: number,
  tileSize: number,
  orientation: number,
  style: TileStyle
): ArcSpec[] {
  if (style === "diagonal") {
    return [];
  }

  if (style === "smith") {
    const corners: Array<[number, number, number]> = [
      [x, y, 0],
      [x + tileSize, y, Math.PI / 2],
      [x + tileSize, y + tileSize, Math.PI],
      [x, y + tileSize, (3 * Math.PI) / 2],
    ];
    const [cx, cy, start] = corners[orientation % 4];
    return [{ cx, cy, start, end: start + Math.PI / 2 }];
  }

  if (orientation === 0) {
    return [
      { cx: x, cy: y, start: 0, end: Math.PI / 2 },
      { cx: x + tileSize, cy: y + tileSize, start: Math.PI, end: (3 * Math.PI) / 2 },
    ];
  }
  return [
    { cx: x + tileSize, cy: y, start: Math.PI / 2, end: Math.PI },
    { cx: x, cy: y + tileSize, start: (3 * Math.PI) / 2, end: 2 * Math.PI },
  ];
}

export function drawTruchetTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  orientation: number,
  style: TileStyle,
  lineWidth: number,
  strokeStyle: string
): void {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";

  if (style === "diagonal") {
    ctx.beginPath();
    if (orientation === 0) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + tileSize, y + tileSize);
    } else {
      ctx.moveTo(x + tileSize, y);
      ctx.lineTo(x, y + tileSize);
    }
    ctx.stroke();
    return;
  }

  const half = tileSize / 2;
  for (const arc of arcsForTile(x, y, tileSize, orientation, style)) {
    ctx.beginPath();
    ctx.arc(arc.cx, arc.cy, half, arc.start, arc.end);
    ctx.stroke();
  }
}

export function renderTruchetGrid(
  ctx: CanvasRenderingContext2D,
  size: number,
  grid: TruchetGrid,
  colorMode: TruchetColorMode,
  lineWidth: number = DEFAULT_LINE_WIDTH,
  revealCount: number = grid.orientations.length
): void {
  ctx.fillStyle = TRUCHET_BACKGROUND;
  ctx.fillRect(0, 0, size, size);

  const tileSize = size / Math.max(grid.cols, grid.rows);
  const orientationCount = orientationCountFor(grid.style);
  const count = Math.max(0, Math.min(revealCount, grid.orientations.length));

  for (let i = 0; i < count; i++) {
    const gx = i % grid.cols;
    const gy = Math.floor(i / grid.cols);
    const orientation = grid.orientations[i];

    let strokeStyle = TRUCHET_LINE_COLOR;
    if (colorMode === "by-orientation") {
      const hue = (orientation / orientationCount) * 300;
      strokeStyle = `hsl(${hue.toFixed(1)}, 70%, 62%)`;
    } else if (colorMode === "rainbow") {
      const hue = (i / grid.orientations.length) * 360;
      strokeStyle = `hsl(${hue.toFixed(1)}, 75%, 62%)`;
    }

    drawTruchetTile(ctx, gx * tileSize, gy * tileSize, tileSize, orientation, grid.style, lineWidth, strokeStyle);
  }
}
