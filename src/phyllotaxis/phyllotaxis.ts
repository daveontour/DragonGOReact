export type PhyllotaxisColorMode = "radius" | "index" | "mono";

const PHI = (1 + Math.sqrt(5)) / 2;
export const GOLDEN_ANGLE_DEG = 360 / (PHI * PHI);

export const MIN_POINTS = 100;
export const MAX_POINTS = 3000;
export const DEFAULT_POINTS = 800;

export const MIN_ANGLE_DEG = 100;
export const MAX_ANGLE_DEG = 160;
export const DEFAULT_ANGLE_DEG = GOLDEN_ANGLE_DEG;

export const MIN_SCALE = 2;
export const MAX_SCALE = 14;
export const DEFAULT_SCALE = 6;

export const MIN_DOT_RADIUS = 1;
export const MAX_DOT_RADIUS = 6;
export const DEFAULT_DOT_RADIUS = 3;

export const MIN_ANIMATE_SPEED = 0.005;
export const MAX_ANIMATE_SPEED = 0.5;
export const DEFAULT_ANIMATE_SPEED = 0.05;

export const PHYLLOTAXIS_BACKGROUND = "#0a0d18";

export interface PhyllotaxisPoint {
  x: number;
  y: number;
  radius: number;
  angleDeg: number;
}

export function clampPointCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_POINTS;
  }
  return Math.min(MAX_POINTS, Math.max(MIN_POINTS, Math.round(value)));
}

export function clampAngleDeg(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ANGLE_DEG;
  }
  return Math.min(MAX_ANGLE_DEG, Math.max(MIN_ANGLE_DEG, value));
}

export function clampScale(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SCALE;
  }
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

export function clampDotRadius(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_DOT_RADIUS;
  }
  return Math.min(MAX_DOT_RADIUS, Math.max(MIN_DOT_RADIUS, value));
}

export function clampAnimateSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ANIMATE_SPEED;
  }
  return Math.min(MAX_ANIMATE_SPEED, Math.max(MIN_ANIMATE_SPEED, value));
}

/** The classic Vogel model: each seed turns a fixed angle from the last and
 * pushes outward proportional to sqrt(index), so equal-area rings pack seeds
 * at a constant density. */
export function phyllotaxisPoint(
  index: number,
  angleDeg: number,
  scale: number
): PhyllotaxisPoint {
  const pointAngleDeg = index * angleDeg;
  const radius = scale * Math.sqrt(index);
  const rad = (pointAngleDeg * Math.PI) / 180;
  return {
    x: radius * Math.cos(rad),
    y: radius * Math.sin(rad),
    radius,
    angleDeg: pointAngleDeg % 360,
  };
}

export function generatePhyllotaxisPoints(
  count: number,
  angleDeg: number,
  scale: number
): PhyllotaxisPoint[] {
  const points: PhyllotaxisPoint[] = [];
  for (let i = 0; i < count; i++) {
    points.push(phyllotaxisPoint(i, angleDeg, scale));
  }
  return points;
}

function hslString(hue: number, saturation: number, lightness: number): string {
  return `hsl(${hue.toFixed(1)}, ${saturation}%, ${lightness}%)`;
}

export function colorForPoint(
  index: number,
  count: number,
  radius: number,
  maxRadius: number,
  colorMode: PhyllotaxisColorMode
): string {
  if (colorMode === "mono") {
    return "#7fd4ff";
  }
  if (colorMode === "index") {
    const hue = count <= 1 ? 0 : (index / count) * 360;
    return hslString(hue, 70, 62);
  }
  const t = maxRadius <= 0 ? 0 : Math.min(1, radius / maxRadius);
  const hue = 260 - t * 220;
  return hslString(hue, 75, 60);
}

export function drawPhyllotaxis(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  count: number,
  angleDeg: number,
  scale: number,
  dotRadius: number,
  colorMode: PhyllotaxisColorMode
): void {
  ctx.fillStyle = PHYLLOTAXIS_BACKGROUND;
  ctx.fillRect(0, 0, width, height);

  const points = generatePhyllotaxisPoints(count, angleDeg, scale);
  const maxRadius = points.length > 0 ? points[points.length - 1].radius : 0;
  const centerX = width / 2;
  const centerY = height / 2;

  points.forEach((point, index) => {
    ctx.fillStyle = colorForPoint(index, points.length, point.radius, maxRadius, colorMode);
    ctx.beginPath();
    ctx.arc(centerX + point.x, centerY - point.y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}
