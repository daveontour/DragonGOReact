export interface StrokeSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
}

export const MIN_SYMMETRY = 2;
export const MAX_SYMMETRY = 16;
export const DEFAULT_SYMMETRY = 8;

export const MIN_LINE_WIDTH = 1;
export const MAX_LINE_WIDTH = 12;
export const DEFAULT_LINE_WIDTH = 3;

export function clampSymmetry(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SYMMETRY;
  }
  return Math.min(MAX_SYMMETRY, Math.max(MIN_SYMMETRY, Math.round(value)));
}

export function clampLineWidth(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LINE_WIDTH;
  }
  return Math.min(MAX_LINE_WIDTH, Math.max(MIN_LINE_WIDTH, value));
}

/** Rotates (and optionally mirrors) a point about (cx, cy). Both endpoints
 * of a segment are transformed with the same (k, flip) per copy, so each
 * copy is a rigid isometry of the whole segment — it stays straight, never
 * shears. flip negates the angle before rotating, which is exactly what a
 * mirror reflection does to a point's angle relative to the center. */
function transformPoint(x: number, y: number, cx: number, cy: number, k: number, order: number, flip: boolean) {
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.hypot(dx, dy);
  const phi = Math.atan2(dy, dx);
  const baseAngle = flip ? -phi : phi;
  const theta = baseAngle + k * ((2 * Math.PI) / order);
  return { x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) };
}

/** Generates `order` rotational copies of a segment (mirror=false), or
 * `2*order` copies (mirror=true) — together the dihedral group of order
 * 2*order when mirroring is on. */
export function symmetryCopies(
  seg: StrokeSegment,
  cx: number,
  cy: number,
  order: number,
  mirror: boolean
): StrokeSegment[] {
  const copies: StrokeSegment[] = [];
  for (let k = 0; k < order; k++) {
    const p1 = transformPoint(seg.x1, seg.y1, cx, cy, k, order, false);
    const p2 = transformPoint(seg.x2, seg.y2, cx, cy, k, order, false);
    copies.push({ ...seg, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
  }
  if (mirror) {
    for (let k = 0; k < order; k++) {
      const p1 = transformPoint(seg.x1, seg.y1, cx, cy, k, order, true);
      const p2 = transformPoint(seg.x2, seg.y2, cx, cy, k, order, true);
      copies.push({ ...seg, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
    }
  }
  return copies;
}

export function drawStroke(ctx: CanvasRenderingContext2D, seg: StrokeSegment): void {
  ctx.strokeStyle = seg.color;
  ctx.lineWidth = seg.width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(seg.x1, seg.y1);
  ctx.lineTo(seg.x2, seg.y2);
  ctx.stroke();
}

export function drawSegmentWithSymmetry(
  ctx: CanvasRenderingContext2D,
  seg: StrokeSegment,
  cx: number,
  cy: number,
  order: number,
  mirror: boolean
): void {
  for (const copy of symmetryCopies(seg, cx, cy, order, mirror)) {
    drawStroke(ctx, copy);
  }
}

export function replayStrokes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokes: StrokeSegment[],
  cx: number,
  cy: number,
  order: number,
  mirror: boolean
): void {
  ctx.fillStyle = "#0a0d18";
  ctx.fillRect(0, 0, width, height);
  for (const seg of strokes) {
    drawSegmentWithSymmetry(ctx, seg, cx, cy, order, mirror);
  }
}
