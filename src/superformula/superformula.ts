export type SuperformulaColorMode = "mono" | "rainbow";

export const MIN_M = 1;
export const MAX_M = 20;
export const DEFAULT_M = 5;

export const MIN_N = 0.1;
export const MAX_N = 40;
export const DEFAULT_N1 = 1;
export const DEFAULT_N2 = 6;
export const DEFAULT_N3 = 6;

export const SUPERFORMULA_EPSILON = 1e-9;
export const SUPERFORMULA_MAX_R = 20;
export const SUPERFORMULA_SAMPLES = 2000;

export const SUPERFORMULA_BACKGROUND = "#0a0d18";
export const SUPERFORMULA_CURVE_COLOR = "#7fd4ff";
export const SUPERFORMULA_FILL_COLOR = "rgba(127, 212, 255, 0.35)";

export interface SuperformulaPoint {
  x: number;
  y: number;
}

export interface SuperformulaPreset {
  id: string;
  label: string;
  m: number;
  n1: number;
  n2: number;
  n3: number;
}

export const SUPERFORMULA_PRESETS: SuperformulaPreset[] = [
  { id: "circle", label: "Circle", m: 4, n1: 2, n2: 2, n3: 2 },
  { id: "square", label: "Square", m: 4, n1: 40, n2: 40, n3: 40 },
  { id: "triangle", label: "Triangle", m: 3, n1: 1, n2: 1, n3: 1 },
  { id: "star", label: "Star", m: 5, n1: 0.3, n2: 1.7, n3: 1.7 },
  { id: "flower", label: "Flower", m: 16, n1: 0.5, n2: 0.8, n3: 0.8 },
];

export function clampM(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_M;
  }
  return Math.min(MAX_M, Math.max(MIN_M, Math.round(value)));
}

export function clampExponent(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_N1;
  }
  return Math.min(MAX_N, Math.max(MIN_N, value));
}

/** Gielis's superformula, a=b=1. Since cos^2+sin^2 = 1 the bracket can
 * never literally hit zero, but high n2/n3 with a small n1 can drive it to
 * an astronomically large-but-finite radius (e.g. ~1e57 at the extreme
 * corner of the slider ranges) -- an epsilon floor guards the theoretical
 * zero-underflow case, and a hard radius clamp is what actually contains
 * the realistic blowup. */
export function superformulaRadius(
  theta: number,
  m: number,
  n1: number,
  n2: number,
  n3: number
): number {
  const angle = (m * theta) / 4;
  const term1 = Math.pow(Math.abs(Math.cos(angle)), n2);
  const term2 = Math.pow(Math.abs(Math.sin(angle)), n3);
  const bracket = Math.max(SUPERFORMULA_EPSILON, term1 + term2);
  const r = Math.pow(bracket, -1 / n1);
  return Math.min(SUPERFORMULA_MAX_R, r);
}

export function superformulaPoint(
  theta: number,
  m: number,
  n1: number,
  n2: number,
  n3: number
): SuperformulaPoint {
  const r = superformulaRadius(theta, m, n1, n2, n3);
  return {
    x: r * Math.cos(theta),
    y: r * Math.sin(theta),
  };
}

export function generateSuperformulaPoints(
  m: number,
  n1: number,
  n2: number,
  n3: number
): SuperformulaPoint[] {
  const points: SuperformulaPoint[] = [];
  for (let i = 0; i <= SUPERFORMULA_SAMPLES; i++) {
    const theta = (i / SUPERFORMULA_SAMPLES) * Math.PI * 2;
    points.push(superformulaPoint(theta, m, n1, n2, n3));
  }
  return points;
}

export function randomSuperformulaParams(
  rng: () => number = Math.random
): { m: number; n1: number; n2: number; n3: number } {
  return {
    m: Math.round(3 + rng() * 13),
    n1: 0.2 + rng() * 2.8,
    n2: 0.5 + rng() * 9.5,
    n3: 0.5 + rng() * 9.5,
  };
}

export function drawSuperformula(
  ctx: CanvasRenderingContext2D,
  size: number,
  points: SuperformulaPoint[],
  scale: number,
  lineWidth: number,
  colorMode: SuperformulaColorMode,
  filled: boolean,
  revealCount: number = points.length
): void {
  ctx.fillStyle = SUPERFORMULA_BACKGROUND;
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const count = Math.max(0, Math.min(revealCount, points.length));
  if (count < 2) {
    return;
  }

  if (filled) {
    ctx.beginPath();
    ctx.moveTo(cx + points[0].x * scale, cy - points[0].y * scale);
    for (let i = 1; i < count; i++) {
      ctx.lineTo(cx + points[i].x * scale, cy - points[i].y * scale);
    }
    ctx.closePath();
    ctx.fillStyle = SUPERFORMULA_FILL_COLOR;
    ctx.fill();
  }

  ctx.lineWidth = lineWidth;

  if (colorMode === "mono") {
    ctx.strokeStyle = SUPERFORMULA_CURVE_COLOR;
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
