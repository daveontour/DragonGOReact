export type ChaosGameMode = "polygon" | "fern";
export type ChaosGameColorMode = "mono" | "thermal";

export const MIN_VERTICES = 3;
export const MAX_VERTICES = 8;
export const DEFAULT_VERTICES = 3;

export const MIN_RATIO = 0.3;
export const MAX_RATIO = 0.7;
export const DEFAULT_RATIO = 0.5;

export const MIN_RESTRICTION_K = 0;
export const MAX_RESTRICTION_K = 3;
export const DEFAULT_RESTRICTION_K = 0;

export const MIN_POINT_COUNT = 50_000;
export const MAX_POINT_COUNT = 200_000;
export const DEFAULT_POINT_COUNT = 100_000;

export const BURN_IN_ITERATIONS = 20;
export const CHAOS_GAME_MAX_RENDER_SIZE = 640;

export const CHAOS_GAME_BACKGROUND: [number, number, number] = [10, 13, 24];

// The fern's well-known bounding box in its own affine coordinate space.
export const FERN_X_MIN = -2.3;
export const FERN_X_MAX = 2.75;
export const FERN_Y_MIN = 0;
export const FERN_Y_MAX = 10.1;

export interface ChaosGamePoint {
  x: number;
  y: number;
}

export interface BarnsleyTransform {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  p: number;
}

/** Barnsley's classic 4-transform IFS for a fern frond. */
export const BARNSLEY_TRANSFORMS: BarnsleyTransform[] = [
  { a: 0, b: 0, c: 0, d: 0.16, e: 0, f: 0, p: 0.01 },
  { a: 0.85, b: 0.04, c: -0.04, d: 0.85, e: 0, f: 1.6, p: 0.85 },
  { a: 0.2, b: -0.26, c: 0.23, d: 0.22, e: 0, f: 1.6, p: 0.07 },
  { a: -0.15, b: 0.28, c: 0.26, d: 0.24, e: 0, f: 0.44, p: 0.07 },
];

export interface ChaosGameDensityParams {
  mode: ChaosGameMode;
  width: number;
  height: number;
  vertices: number;
  ratio: number;
  restrictionK: number;
  pointCount: number;
  seed: number;
}

export function clampVertexCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_VERTICES;
  }
  return Math.min(MAX_VERTICES, Math.max(MIN_VERTICES, Math.round(value)));
}

export function clampRatio(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_RATIO;
  }
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, value));
}

export function clampRestrictionK(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_RESTRICTION_K;
  }
  return Math.min(MAX_RESTRICTION_K, Math.max(MIN_RESTRICTION_K, Math.round(value)));
}

export function clampPointCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_POINT_COUNT;
  }
  return Math.min(MAX_POINT_COUNT, Math.max(MIN_POINT_COUNT, Math.round(value)));
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

/** n vertices evenly spaced on the unit circle, vertex 0 at angle 0. */
export function polygonVertices(n: number): ChaosGamePoint[] {
  const points: ChaosGamePoint[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    points.push({ x: Math.cos(angle), y: Math.sin(angle) });
  }
  return points;
}

/** Picks a random vertex index, optionally forbidding the last
 * `restrictionK` picks from being chosen again — the "restricted chaos
 * game" mechanism that breaks the plain-filled-polygon degeneracy at n>=4.
 * (This is a recency-window exclusion, not the specific adjacency-based
 * "famous pentagon" rule some sources describe — a real, documented
 * restricted-chaos-game variant, just not that particular one.) */
export function pickNextVertexIndex(
  rng: () => number,
  n: number,
  recentPicks: number[],
  restrictionK: number
): number {
  const effectiveK = Math.min(restrictionK, n - 1);
  if (effectiveK <= 0) {
    return Math.floor(rng() * n);
  }
  const forbidden = new Set(recentPicks.slice(-effectiveK));
  let candidate = Math.floor(rng() * n);
  let attempts = 0;
  while (forbidden.has(candidate) && attempts < 100) {
    candidate = Math.floor(rng() * n);
    attempts++;
  }
  return candidate;
}

export function stepChaosGamePolygon(
  point: ChaosGamePoint,
  vertex: ChaosGamePoint,
  ratio: number
): ChaosGamePoint {
  return {
    x: point.x + (vertex.x - point.x) * ratio,
    y: point.y + (vertex.y - point.y) * ratio,
  };
}

export function applyBarnsleyTransform(
  point: ChaosGamePoint,
  t: BarnsleyTransform
): ChaosGamePoint {
  return {
    x: t.a * point.x + t.b * point.y + t.e,
    y: t.c * point.x + t.d * point.y + t.f,
  };
}

export function pickBarnsleyTransformIndex(rng: () => number): number {
  const r = rng();
  let cumulative = 0;
  for (let i = 0; i < BARNSLEY_TRANSFORMS.length; i++) {
    cumulative += BARNSLEY_TRANSFORMS[i].p;
    if (r < cumulative) {
      return i;
    }
  }
  return BARNSLEY_TRANSFORMS.length - 1;
}

/** Accumulates hit-counts per pixel rather than plotting individual points
 * — the standard "chaos game density" rendering, letting the final image
 * show which regions the attractor visits most densely. */
export function runChaosGameDensity(params: ChaosGameDensityParams): Uint32Array {
  const { mode, width, height, vertices, ratio, restrictionK, pointCount, seed } = params;
  const density = new Uint32Array(width * height);
  const rng = createSeededRandom(seed);
  let point: ChaosGamePoint = { x: 0, y: 0 };

  const totalIterations = pointCount + BURN_IN_ITERATIONS;

  if (mode === "polygon") {
    const verts = polygonVertices(vertices);
    const recentPicks: number[] = [];
    const scale = (Math.min(width, height) / 2) * 0.92;
    const cx = width / 2;
    const cy = height / 2;

    for (let i = 0; i < totalIterations; i++) {
      const idx = pickNextVertexIndex(rng, vertices, recentPicks, restrictionK);
      recentPicks.push(idx);
      if (recentPicks.length > MAX_RESTRICTION_K) {
        recentPicks.shift();
      }
      point = stepChaosGamePolygon(point, verts[idx], ratio);

      if (i >= BURN_IN_ITERATIONS) {
        const px = Math.round(cx + point.x * scale);
        const py = Math.round(cy - point.y * scale);
        if (px >= 0 && px < width && py >= 0 && py < height) {
          density[py * width + px]++;
        }
      }
    }
  } else {
    const xRange = FERN_X_MAX - FERN_X_MIN;
    const yRange = FERN_Y_MAX - FERN_Y_MIN;
    const scale = Math.min(width / xRange, height / yRange) * 0.95;
    const cx = width / 2 - ((FERN_X_MIN + FERN_X_MAX) / 2) * scale;
    const cy = height * 0.97;

    for (let i = 0; i < totalIterations; i++) {
      const tIdx = pickBarnsleyTransformIndex(rng);
      point = applyBarnsleyTransform(point, BARNSLEY_TRANSFORMS[tIdx]);

      if (i >= BURN_IN_ITERATIONS) {
        const px = Math.round(cx + point.x * scale);
        const py = Math.round(cy - point.y * scale);
        if (px >= 0 && px < width && py >= 0 && py < height) {
          density[py * width + px]++;
        }
      }
    }
  }

  return density;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

export function densityToColor(
  count: number,
  maxCount: number,
  colorMode: ChaosGameColorMode
): [number, number, number] {
  if (count === 0) {
    return CHAOS_GAME_BACKGROUND;
  }
  const t = clamp01(Math.log1p(count) / Math.log1p(Math.max(1, maxCount)));

  if (colorMode === "thermal") {
    return [lerpChannel(40, 255, t), lerpChannel(10, 140, t ** 1.5), lerpChannel(60, 40, t ** 2)];
  }
  return [lerpChannel(20, 127, t), lerpChannel(30, 212, t), lerpChannel(50, 255, t)];
}

export function renderChaosGameDensity(
  imageData: ImageData,
  density: Uint32Array,
  colorMode: ChaosGameColorMode
): void {
  const { data } = imageData;
  let maxCount = 1;
  for (let i = 0; i < density.length; i++) {
    if (density[i] > maxCount) {
      maxCount = density[i];
    }
  }
  for (let i = 0; i < density.length; i++) {
    const [r, g, b] = densityToColor(density[i], maxCount, colorMode);
    const offset = i * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = 255;
  }
}
