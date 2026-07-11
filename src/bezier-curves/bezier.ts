export interface Point {
  x: number;
  y: number;
}

export const MIN_CONTROL_POINTS = 2;
export const MAX_CONTROL_POINTS = 6;
export const DEFAULT_CONTROL_POINTS = 4;

export const CURVE_SAMPLES = 120;
export const POINT_HIT_RADIUS = 14;

export function clampControlPointCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_CONTROL_POINTS;
  }
  return Math.min(MAX_CONTROL_POINTS, Math.max(MIN_CONTROL_POINTS, Math.round(value)));
}

/** A pleasant default layout (normalized [0,1] space) for any point count,
 * so switching the count doesn't require hand-authored cases per N. */
export function defaultControlPoints(count: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    points.push({
      x: 0.12 + 0.76 * t,
      y: 0.5 + 0.32 * Math.sin(i * 2.1 + 0.6),
    });
  }
  return points;
}

/** Repeatedly lerps every consecutive pair of points, one fewer point each
 * round, until a single point remains — De Casteljau's construction.
 * levels[0] is the input points; levels[levels.length-1] is [pointAtT].
 * With 2 input points this naturally degenerates to plain linear
 * interpolation (levels = [points, [lerp]]), no special-casing needed. */
export function deCasteljauLevels(points: Point[], t: number): Point[][] {
  const levels: Point[][] = [points];
  let current = points;
  while (current.length > 1) {
    const next: Point[] = [];
    for (let i = 0; i < current.length - 1; i++) {
      next.push({
        x: current[i].x + (current[i + 1].x - current[i].x) * t,
        y: current[i].y + (current[i + 1].y - current[i].y) * t,
      });
    }
    levels.push(next);
    current = next;
  }
  return levels;
}

export function evaluateBezier(points: Point[], t: number): Point {
  const levels = deCasteljauLevels(points, t);
  return levels[levels.length - 1][0];
}

export function sampleBezierCurve(points: Point[], samples: number = CURVE_SAMPLES): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    out.push(evaluateBezier(points, i / samples));
  }
  return out;
}

export function drawBezierCurve(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  points: Point[],
  t: number,
  lineWidth: number,
  showScaffolding: boolean
): void {
  ctx.fillStyle = "#0a0d18";
  ctx.fillRect(0, 0, width, height);

  const toPixel = (p: Point) => ({ x: p.x * width, y: p.y * height });

  if (points.length >= 2) {
    const curve = sampleBezierCurve(points).map(toPixel);
    ctx.strokeStyle = "#7fd4ff";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(curve[0].x, curve[0].y);
    for (let i = 1; i < curve.length; i++) {
      ctx.lineTo(curve[i].x, curve[i].y);
    }
    ctx.stroke();
  }

  // Control polygon (faint straight lines connecting the raw control points)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  const pixelPoints = points.map(toPixel);
  pixelPoints.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();

  if (showScaffolding && points.length >= 2) {
    const levels = deCasteljauLevels(points, t).map((level) => level.map(toPixel));
    const scaffoldColors = ["#e6a844", "#4ac96e", "#b478e6", "#e6545a"];
    for (let l = 1; l < levels.length - 1; l++) {
      ctx.strokeStyle = scaffoldColors[(l - 1) % scaffoldColors.length];
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      levels[l].forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      ctx.globalAlpha = 1;
      for (const p of levels[l]) {
        ctx.fillStyle = scaffoldColors[(l - 1) % scaffoldColors.length];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const finalPoint = levels[levels.length - 1][0];
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(finalPoint.x, finalPoint.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Control points on top
  pixelPoints.forEach((p, i) => {
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText(String(i), p.x + 8, p.y - 8);
  });
}
