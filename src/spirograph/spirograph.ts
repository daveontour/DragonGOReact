export type SpirographMode = "hypotrochoid" | "epitrochoid";
export type SpirographColorMode = "mono" | "rainbow";

export const MIN_R = 10;
export const MAX_R = 60;
export const DEFAULT_R = 40;

export const MIN_SMALL_R = 1;
export const MAX_SMALL_R = 50;
export const DEFAULT_SMALL_R = 17;

export const MIN_PEN_OFFSET = 0;
export const DEFAULT_PEN_OFFSET_RATIO = 0.75;

export const MIN_ECCENTRICITY = 0;
export const MAX_ECCENTRICITY = 0.95;
export const DEFAULT_ECCENTRICITY = 0;

export const SPIROGRAPH_SAMPLES_PER_LOOP = 300;
export const SPIROGRAPH_MAX_SAMPLES = 20000;

export const MIN_ANIMATE_SPEED = 0.25;
export const MAX_ANIMATE_SPEED = 4;
export const DEFAULT_ANIMATE_SPEED = 1;

export const SPIROGRAPH_BACKGROUND = "#0a0d18";
export const SPIROGRAPH_CURVE_COLOR = "#7fd4ff";
export const SPIROGRAPH_CONSTRUCTION_COLOR = "rgba(255, 196, 92, 0.9)";
export const SPIROGRAPH_CONSTRUCTION_LINE_WIDTH = 1.75;
export const SPIROGRAPH_CONSTRUCTION_DASH: [number, number] = [6, 5];
export const SPIROGRAPH_CONSTRUCTION_DOT_RADIUS = 3.5;

export interface SpirographPoint {
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

/** How many full 2π trips the wheel makes around the ring before the curve
 * retraces itself — identical for hypotrochoid and epitrochoid, since the
 * sign on r cancels out of the gcd argument. */
export function spirographLoopCount(R: number, r: number): number {
  return r / gcd(R, r);
}

export function spirographPeriod(R: number, r: number): number {
  return 2 * Math.PI * spirographLoopCount(R, r);
}

export function clampR(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_R;
  }
  return Math.min(MAX_R, Math.max(MIN_R, Math.round(value)));
}

/** In hypotrochoid mode r must stay below R or the wheel no longer fits
 * inside the ring (R=r collapses the curve to a single point). */
export function clampSmallR(value: number, R: number, mode: SpirographMode): number {
  if (!Number.isFinite(value)) {
    return Math.min(DEFAULT_SMALL_R, R - 1);
  }
  const max = mode === "hypotrochoid" ? Math.min(MAX_SMALL_R, R - 1) : MAX_SMALL_R;
  return Math.min(max, Math.max(MIN_SMALL_R, Math.round(value)));
}

export function clampPenOffset(value: number, r: number): number {
  const max = r * 1.5;
  if (!Number.isFinite(value)) {
    return r * DEFAULT_PEN_OFFSET_RATIO;
  }
  return Math.min(max, Math.max(MIN_PEN_OFFSET, value));
}

export function clampEccentricity(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ECCENTRICITY;
  }
  return Math.min(MAX_ECCENTRICITY, Math.max(MIN_ECCENTRICITY, value));
}

export function clampAnimateSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ANIMATE_SPEED;
  }
  return Math.min(MAX_ANIMATE_SPEED, Math.max(MIN_ANIMATE_SPEED, value));
}

/** Semi-minor/semi-major ratio for an ellipse of the given eccentricity —
 * 1 at e=0 (a circle), shrinking toward 0 as e approaches 1 (a flat line). */
export function eccentricityToMinorScale(eccentricity: number): number {
  return Math.sqrt(Math.max(0, 1 - eccentricity * eccentricity));
}

/** The ring and wheel each get their own eccentricity by squashing their
 * respective rotating arm along y: the (R∓r) "ring arm" (the wheel
 * center's orbit around the ring) uses eRing, and the d "wheel arm" (the
 * pen's orbit around the wheel center) uses eWheel. Both default to 0,
 * which reduces exactly to the classic circular formulas. Because only the
 * y-amplitude is scaled — the angular arguments t and ratio*t are
 * untouched — the closure period 2π·r/gcd(R,r) still holds exactly at any
 * eccentricity. */
export function hypotrochoidPoint(
  t: number,
  R: number,
  r: number,
  d: number,
  eRing: number = 0,
  eWheel: number = 0
): SpirographPoint {
  const ratio = (R - r) / r;
  const bRing = eccentricityToMinorScale(eRing);
  const bWheel = eccentricityToMinorScale(eWheel);
  return {
    x: (R - r) * Math.cos(t) + d * Math.cos(ratio * t),
    y: (R - r) * bRing * Math.sin(t) - d * bWheel * Math.sin(ratio * t),
  };
}

export function epitrochoidPoint(
  t: number,
  R: number,
  r: number,
  d: number,
  eRing: number = 0,
  eWheel: number = 0
): SpirographPoint {
  const ratio = (R + r) / r;
  const bRing = eccentricityToMinorScale(eRing);
  const bWheel = eccentricityToMinorScale(eWheel);
  return {
    x: (R + r) * Math.cos(t) - d * Math.cos(ratio * t),
    y: (R + r) * bRing * Math.sin(t) - d * bWheel * Math.sin(ratio * t),
  };
}

export function spirographPoint(
  mode: SpirographMode,
  t: number,
  R: number,
  r: number,
  d: number,
  eRing: number = 0,
  eWheel: number = 0
): SpirographPoint {
  return mode === "hypotrochoid"
    ? hypotrochoidPoint(t, R, r, d, eRing, eWheel)
    : epitrochoidPoint(t, R, r, d, eRing, eWheel);
}

export function generateSpirographPoints(
  mode: SpirographMode,
  R: number,
  r: number,
  d: number,
  eRing: number = 0,
  eWheel: number = 0
): SpirographPoint[] {
  const loopCount = spirographLoopCount(R, r);
  const requestedSamples = Math.ceil(loopCount * SPIROGRAPH_SAMPLES_PER_LOOP);
  const sampleCount = Math.min(SPIROGRAPH_MAX_SAMPLES, requestedSamples);
  const period = spirographPeriod(R, r);

  const points: SpirographPoint[] = [];
  for (let i = 0; i <= sampleCount; i++) {
    const t = (i / sampleCount) * period;
    points.push(spirographPoint(mode, t, R, r, d, eRing, eWheel));
  }
  return points;
}

export function drawSpirograph(
  ctx: CanvasRenderingContext2D,
  size: number,
  points: SpirographPoint[],
  scale: number,
  lineWidth: number,
  colorMode: SpirographColorMode,
  showConstruction: boolean,
  R: number,
  r: number,
  revealCount: number = points.length,
  eRing: number = 0,
  eWheel: number = 0
): void {
  ctx.fillStyle = SPIROGRAPH_BACKGROUND;
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const count = Math.max(0, Math.min(revealCount, points.length));

  if (showConstruction) {
    const bRing = eccentricityToMinorScale(eRing);
    const bWheel = eccentricityToMinorScale(eWheel);

    ctx.save();
    ctx.strokeStyle = SPIROGRAPH_CONSTRUCTION_COLOR;
    ctx.fillStyle = SPIROGRAPH_CONSTRUCTION_COLOR;
    ctx.lineWidth = SPIROGRAPH_CONSTRUCTION_LINE_WIDTH;
    ctx.setLineDash(SPIROGRAPH_CONSTRUCTION_DASH);

    ctx.beginPath();
    ctx.ellipse(cx, cy, R * scale, R * scale * bRing, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (count > 0) {
      const tip = points[count - 1];
      const wheelCenterAngle = Math.atan2(-tip.y, tip.x);
      const wheelCx = cx + Math.cos(wheelCenterAngle) * (R - r) * scale;
      const wheelCy = cy - Math.sin(wheelCenterAngle) * (R - r) * scale * bRing;

      ctx.beginPath();
      ctx.ellipse(wheelCx, wheelCy, r * scale, r * scale * bWheel, 0, 0, Math.PI * 2);
      ctx.stroke();

      // The solid connecting arm and center dots make the ring-center ->
      // wheel-center relationship legible at a glance, rather than leaving
      // the viewer to infer it from two dashed outlines alone.
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(wheelCx, wheelCy);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, SPIROGRAPH_CONSTRUCTION_DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(wheelCx, wheelCy, SPIROGRAPH_CONSTRUCTION_DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  if (count < 2) {
    return;
  }

  ctx.lineWidth = lineWidth;
  if (colorMode === "mono") {
    ctx.strokeStyle = SPIROGRAPH_CURVE_COLOR;
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
