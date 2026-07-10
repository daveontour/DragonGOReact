export type LissajousColorMode = "mono" | "rainbow";

export const MIN_FREQUENCY = 1;
export const MAX_FREQUENCY = 12;
export const DEFAULT_FREQ_A = 3;
export const DEFAULT_FREQ_B = 2;

export const MIN_PHASE = 0;
export const MAX_PHASE = 2 * Math.PI;
export const DEFAULT_PHASE = Math.PI / 2;

export const LISSAJOUS_SAMPLE_COUNT = 2000;

export const LISSAJOUS_BACKGROUND = "#0a0d18";
export const LISSAJOUS_CURVE_COLOR = "#7fd4ff";

export interface LissajousPointXY {
  x: number;
  y: number;
}

export function clampFrequency(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_FREQ_A;
  }
  return Math.min(MAX_FREQUENCY, Math.max(MIN_FREQUENCY, Math.round(value)));
}

export function clampPhase(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PHASE;
  }
  return Math.min(MAX_PHASE, Math.max(MIN_PHASE, value));
}

export function lissajousPoint(
  t: number,
  a: number,
  b: number,
  delta: number
): LissajousPointXY {
  return {
    x: Math.sin(a * t + delta),
    y: Math.sin(b * t),
  };
}

/** A fixed 0..2π sweep always fully closes the curve for integer a,b — the
 * combined period is 2π/gcd(a,b), which is always <= 2π. */
export function generateLissajousPoints(
  a: number,
  b: number,
  delta: number
): LissajousPointXY[] {
  const points: LissajousPointXY[] = [];
  for (let i = 0; i <= LISSAJOUS_SAMPLE_COUNT; i++) {
    const t = (i / LISSAJOUS_SAMPLE_COUNT) * Math.PI * 2;
    points.push(lissajousPoint(t, a, b, delta));
  }
  return points;
}

export function drawLissajous(
  ctx: CanvasRenderingContext2D,
  size: number,
  points: LissajousPointXY[],
  scale: number,
  lineWidth: number,
  colorMode: LissajousColorMode,
  revealCount: number = points.length
): void {
  ctx.fillStyle = LISSAJOUS_BACKGROUND;
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const count = Math.max(0, Math.min(revealCount, points.length));
  if (count < 2) {
    return;
  }

  ctx.lineWidth = lineWidth;

  if (colorMode === "mono") {
    ctx.strokeStyle = LISSAJOUS_CURVE_COLOR;
    ctx.beginPath();
    ctx.moveTo(cx + points[0].x * scale, cy - points[0].y * scale);
    for (let i = 1; i < count; i++) {
      ctx.lineTo(cx + points[i].x * scale, cy - points[i].y * scale);
    }
    ctx.stroke();
    return;
  }

  for (let i = 1; i < count; i++) {
    const hue = (i / points.length) * 360;
    ctx.strokeStyle = `hsl(${hue.toFixed(1)}, 75%, 62%)`;
    ctx.beginPath();
    ctx.moveTo(cx + points[i - 1].x * scale, cy - points[i - 1].y * scale);
    ctx.lineTo(cx + points[i].x * scale, cy - points[i].y * scale);
    ctx.stroke();
  }
}
