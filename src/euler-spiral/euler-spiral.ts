export type EulerSpiralColorMode = "mono" | "rainbow";

export const MIN_T_MAX = 2;
export const MAX_T_MAX = 8;
export const DEFAULT_T_MAX = 5;

export const EULER_SPIRAL_TOTAL_STEPS = 4000;

export const EULER_SPIRAL_BACKGROUND = "#0a0d18";
export const EULER_SPIRAL_CURVE_COLOR = "#7fd4ff";

export interface EulerSpiralPoint {
  t: number;
  x: number;
  y: number;
}

export function clampTMax(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_T_MAX;
  }
  return Math.min(MAX_T_MAX, Math.max(MIN_T_MAX, value));
}

function fresnelIntegrand(u: number): { dx: number; dy: number } {
  const phase = (Math.PI * u * u) / 2;
  return { dx: Math.cos(phase), dy: Math.sin(phase) };
}

/** The Fresnel integrals have no closed form, so each point is a running
 * cumulative sum of many small trapezoidal steps. Integration starts at
 * t=0 (where x=y=0 by definition of the integral) and walks outward to
 * +tMax; the negative half is then built from the positive half via the
 * integrals' exact odd symmetry (point(-t) = -point(t), since cos/sin of
 * pi*u^2/2 are even functions of u) rather than re-integrating, which also
 * guarantees the two halves meet exactly at the origin. */
export function generateEulerSpiralPoints(tMax: number): EulerSpiralPoint[] {
  const halfSteps = EULER_SPIRAL_TOTAL_STEPS / 2;
  const dt = tMax / halfSteps;

  const positive: EulerSpiralPoint[] = [{ t: 0, x: 0, y: 0 }];
  let x = 0;
  let y = 0;
  let prev = fresnelIntegrand(0);
  for (let i = 1; i <= halfSteps; i++) {
    const t = i * dt;
    const cur = fresnelIntegrand(t);
    x += ((prev.dx + cur.dx) / 2) * dt;
    y += ((prev.dy + cur.dy) / 2) * dt;
    positive.push({ t, x, y });
    prev = cur;
  }

  const negative: EulerSpiralPoint[] = [];
  for (let i = halfSteps; i >= 1; i--) {
    const p = positive[i];
    negative.push({ t: -p.t, x: -p.x, y: -p.y });
  }

  return [...negative, ...positive];
}

export function drawEulerSpiral(
  ctx: CanvasRenderingContext2D,
  size: number,
  points: EulerSpiralPoint[],
  scale: number,
  lineWidth: number,
  colorMode: EulerSpiralColorMode,
  revealCount: number = points.length
): void {
  ctx.fillStyle = EULER_SPIRAL_BACKGROUND;
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const total = points.length;
  const half = Math.floor(total / 2);
  const count = Math.max(0, Math.min(revealCount, total));

  // Reveal grows outward from the center in both directions rather than
  // sweeping left-to-right, matching the curve's own construction.
  const startIndex = Math.max(0, half - Math.floor(count / 2));
  const endIndex = Math.min(total, half + Math.ceil(count / 2));
  if (endIndex - startIndex < 2) {
    return;
  }

  ctx.lineWidth = lineWidth;

  if (colorMode === "mono") {
    ctx.strokeStyle = EULER_SPIRAL_CURVE_COLOR;
    ctx.beginPath();
    ctx.moveTo(cx + points[startIndex].x * scale, cy - points[startIndex].y * scale);
    for (let i = startIndex + 1; i < endIndex; i++) {
      ctx.lineTo(cx + points[i].x * scale, cy - points[i].y * scale);
    }
    ctx.stroke();
    return;
  }

  for (let i = startIndex + 1; i < endIndex; i++) {
    const hue = (i / total) * 360;
    ctx.strokeStyle = `hsl(${hue.toFixed(1)}, 75%, 62%)`;
    ctx.beginPath();
    ctx.moveTo(cx + points[i - 1].x * scale, cy - points[i - 1].y * scale);
    ctx.lineTo(cx + points[i].x * scale, cy - points[i].y * scale);
    ctx.stroke();
  }
}
