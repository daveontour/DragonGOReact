export type RoseColorMode = "mono" | "rainbow";

export const MIN_ROSE_N = 1;
export const MAX_ROSE_N = 12;
export const DEFAULT_ROSE_N = 4;

export const MIN_ROSE_D = 1;
export const MAX_ROSE_D = 12;
export const DEFAULT_ROSE_D = 1;

export const ROSE_SAMPLES_PER_PI = 400;

export const ROSE_BACKGROUND = "#0a0d18";
export const ROSE_CURVE_COLOR = "#7fd4ff";

export interface RosePoint {
  x: number;
  y: number;
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

export function reduceFraction(n: number, d: number): { n: number; d: number } {
  const divisor = gcd(n, d);
  return { n: n / divisor, d: d / divisor };
}

/** For r = cos(k*theta), k = n/d reduced to lowest terms: if n*d is odd the
 * curve closes after d*pi and has n petals; if n*d is even it needs a full
 * 2*d*pi to close and has 2n petals. (r=cos(2*theta), the classic 4-petal
 * rose, is the canonical even case: n=2,d=1 -> n*d=2 even -> sweep 2pi,
 * petals=4 -- verified against that textbook example.) */
export function roseSweepTheta(n: number, d: number): number {
  const { n: rn, d: rd } = reduceFraction(n, d);
  return (rn * rd) % 2 === 0 ? 2 * rd * Math.PI : rd * Math.PI;
}

export function rosePetalCount(n: number, d: number): number {
  const { n: rn, d: rd } = reduceFraction(n, d);
  return (rn * rd) % 2 === 0 ? 2 * rn : rn;
}

export function rosePoint(theta: number, n: number, d: number): RosePoint {
  const k = n / d;
  const r = Math.cos(k * theta);
  return {
    x: r * Math.cos(theta),
    y: r * Math.sin(theta),
  };
}

export function generateRosePoints(n: number, d: number): RosePoint[] {
  const sweep = roseSweepTheta(n, d);
  const sampleCount = Math.max(2, Math.round((sweep / Math.PI) * ROSE_SAMPLES_PER_PI));
  const points: RosePoint[] = [];
  for (let i = 0; i <= sampleCount; i++) {
    const theta = (i / sampleCount) * sweep;
    points.push(rosePoint(theta, n, d));
  }
  return points;
}

export function clampRoseN(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ROSE_N;
  }
  return Math.min(MAX_ROSE_N, Math.max(MIN_ROSE_N, Math.round(value)));
}

export function clampRoseD(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ROSE_D;
  }
  return Math.min(MAX_ROSE_D, Math.max(MIN_ROSE_D, Math.round(value)));
}

export function drawRoseCurve(
  ctx: CanvasRenderingContext2D,
  size: number,
  points: RosePoint[],
  scale: number,
  lineWidth: number,
  colorMode: RoseColorMode,
  revealCount: number = points.length
): void {
  ctx.fillStyle = ROSE_BACKGROUND;
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const count = Math.max(0, Math.min(revealCount, points.length));
  if (count < 2) {
    return;
  }

  ctx.lineWidth = lineWidth;

  if (colorMode === "mono") {
    ctx.strokeStyle = ROSE_CURVE_COLOR;
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
