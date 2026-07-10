export type HarmonographColorMode = "mono" | "rainbow";

export const MIN_FREQUENCY = 1;
export const MAX_FREQUENCY = 12;
export const DEFAULT_F1 = 3;
export const DEFAULT_F2 = 3.01;
export const DEFAULT_F3 = 2;
export const DEFAULT_F4 = 2.02;

export const MIN_PHASE = 0;
export const MAX_PHASE = 2 * Math.PI;
export const DEFAULT_P1 = 0;
export const DEFAULT_P3 = Math.PI / 2;

export const MIN_DAMPING = 0.0001;
export const MAX_DAMPING = 0.02;
export const DEFAULT_DAMPING = 0.002;

export const HARMONOGRAPH_DECAY_EPSILON = 0.001;
export const HARMONOGRAPH_SAMPLES_PER_CYCLE = 24;
export const HARMONOGRAPH_MAX_SAMPLES = 12000;

export const HARMONOGRAPH_BACKGROUND = "#0a0d18";
export const HARMONOGRAPH_CURVE_COLOR = "#7fd4ff";

export interface HarmonographParams {
  f1: number;
  p1: number;
  f2: number;
  f3: number;
  p3: number;
  f4: number;
  damping: number;
}

export interface HarmonographPoint {
  x: number;
  y: number;
}

export function clampFrequency(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_F1;
  }
  return Math.min(MAX_FREQUENCY, Math.max(MIN_FREQUENCY, value));
}

export function clampPhase(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_P1;
  }
  return Math.min(MAX_PHASE, Math.max(MIN_PHASE, value));
}

export function clampDamping(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_DAMPING;
  }
  return Math.min(MAX_DAMPING, Math.max(MIN_DAMPING, value));
}

export function harmonographDecayEnvelope(t: number, damping: number): number {
  return Math.exp(-damping * t);
}

export function harmonographPoint(
  t: number,
  params: HarmonographParams
): HarmonographPoint {
  const decay = harmonographDecayEnvelope(t, params.damping);
  const x = (Math.sin(params.f1 * t + params.p1) + Math.sin(params.f2 * t)) * decay;
  const y = (Math.sin(params.f3 * t + params.p3) + Math.sin(params.f4 * t)) * decay;
  return { x, y };
}

/** dt is derived from the fastest oscillation so it always gets enough
 * samples/cycle regardless of damping; damping alone (via the decay
 * threshold) then decides how many dt-steps are actually taken, bounded by
 * a sample budget so very slow decay can't run unbounded. Deriving dt this
 * way (rather than from a fixed total-duration/sample-count split) avoids
 * aliasing the fastest-oscillating term at low damping. */
export function generateHarmonographPoints(
  params: HarmonographParams
): HarmonographPoint[] {
  const fMax = Math.max(params.f1, params.f2, params.f3, params.f4);
  const dt = (2 * Math.PI) / fMax / HARMONOGRAPH_SAMPLES_PER_CYCLE;

  const points: HarmonographPoint[] = [];
  let t = 0;
  for (let i = 0; i < HARMONOGRAPH_MAX_SAMPLES; i++) {
    points.push(harmonographPoint(t, params));
    if (harmonographDecayEnvelope(t, params.damping) < HARMONOGRAPH_DECAY_EPSILON) {
      break;
    }
    t += dt;
  }
  return points;
}

export function randomHarmonographParams(
  rng: () => number = Math.random
): HarmonographParams {
  const base1 = MIN_FREQUENCY + rng() * (MAX_FREQUENCY - MIN_FREQUENCY);
  const base2 = MIN_FREQUENCY + rng() * (MAX_FREQUENCY - MIN_FREQUENCY);
  const beat = 0.01 + rng() * 0.05;
  return {
    f1: base1,
    p1: rng() * MAX_PHASE,
    f2: Math.min(MAX_FREQUENCY, base1 + beat),
    f3: base2,
    p3: rng() * MAX_PHASE,
    f4: Math.min(MAX_FREQUENCY, base2 + beat),
    damping: MIN_DAMPING + rng() * (MAX_DAMPING - MIN_DAMPING) * 0.3,
  };
}

export function drawHarmonograph(
  ctx: CanvasRenderingContext2D,
  size: number,
  points: HarmonographPoint[],
  scale: number,
  lineWidth: number,
  colorMode: HarmonographColorMode,
  revealCount: number = points.length
): void {
  ctx.fillStyle = HARMONOGRAPH_BACKGROUND;
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const count = Math.max(0, Math.min(revealCount, points.length));
  if (count < 2) {
    return;
  }

  ctx.lineWidth = lineWidth;

  if (colorMode === "mono") {
    ctx.strokeStyle = HARMONOGRAPH_CURVE_COLOR;
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
