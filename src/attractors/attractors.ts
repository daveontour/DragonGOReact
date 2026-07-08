export type AttractorId = "lorenz" | "rossler" | "clifford" | "de-jong";

export type AttractorKind = "flow" | "map";

export interface AttractorPreset {
  id: AttractorId;
  name: string;
  kind: AttractorKind;
  description: string;
}

export const ATTRACTOR_PRESETS: Record<AttractorId, AttractorPreset> = {
  lorenz: {
    id: "lorenz",
    name: "Lorenz Attractor",
    kind: "flow",
    description:
      "A simplified convection model whose trajectory never repeats or settles, tracing the classic butterfly.",
  },
  rossler: {
    id: "rossler",
    name: "Rössler Attractor",
    kind: "flow",
    description:
      "A single-scroll chaotic flow that spirals outward then folds back through itself.",
  },
  clifford: {
    id: "clifford",
    name: "Clifford Attractor",
    kind: "map",
    description:
      "A trigonometric iterated map: millions of visits accumulate into a smooth, organic density cloud.",
  },
  "de-jong": {
    id: "de-jong",
    name: "De Jong Attractor",
    kind: "map",
    description:
      "A close cousin of the Clifford map with its own family of swirling, ribbon-like densities.",
  },
};

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface LorenzParams {
  sigma: number;
  rho: number;
  beta: number;
}

export const DEFAULT_LORENZ_PARAMS: LorenzParams = {
  sigma: 10,
  rho: 28,
  beta: 8 / 3,
};

export const MIN_LORENZ_RHO = 5;
export const MAX_LORENZ_RHO = 45;

export function clampLorenzRho(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LORENZ_PARAMS.rho;
  }
  return Math.min(MAX_LORENZ_RHO, Math.max(MIN_LORENZ_RHO, value));
}

function lorenzDerivative(state: Vec3, params: LorenzParams): Vec3 {
  return {
    x: params.sigma * (state.y - state.x),
    y: state.x * (params.rho - state.z) - state.y,
    z: state.x * state.y - params.beta * state.z,
  };
}

export function lorenzStep(state: Vec3, params: LorenzParams, dt: number): Vec3 {
  const k1 = lorenzDerivative(state, params);
  const s2 = {
    x: state.x + (k1.x * dt) / 2,
    y: state.y + (k1.y * dt) / 2,
    z: state.z + (k1.z * dt) / 2,
  };
  const k2 = lorenzDerivative(s2, params);
  const s3 = {
    x: state.x + (k2.x * dt) / 2,
    y: state.y + (k2.y * dt) / 2,
    z: state.z + (k2.z * dt) / 2,
  };
  const k3 = lorenzDerivative(s3, params);
  const s4 = {
    x: state.x + k3.x * dt,
    y: state.y + k3.y * dt,
    z: state.z + k3.z * dt,
  };
  const k4 = lorenzDerivative(s4, params);

  return {
    x: state.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: state.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    z: state.z + (dt / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
  };
}

export interface RosslerParams {
  a: number;
  b: number;
  c: number;
}

export const DEFAULT_ROSSLER_PARAMS: RosslerParams = { a: 0.2, b: 0.2, c: 5.7 };
export const MIN_ROSSLER_C = 2;
export const MAX_ROSSLER_C = 18;

export function clampRosslerC(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ROSSLER_PARAMS.c;
  }
  return Math.min(MAX_ROSSLER_C, Math.max(MIN_ROSSLER_C, value));
}

function rosslerDerivative(state: Vec3, params: RosslerParams): Vec3 {
  return {
    x: -state.y - state.z,
    y: state.x + params.a * state.y,
    z: params.b + state.z * (state.x - params.c),
  };
}

export function rosslerStep(
  state: Vec3,
  params: RosslerParams,
  dt: number
): Vec3 {
  const k1 = rosslerDerivative(state, params);
  const s2 = {
    x: state.x + (k1.x * dt) / 2,
    y: state.y + (k1.y * dt) / 2,
    z: state.z + (k1.z * dt) / 2,
  };
  const k2 = rosslerDerivative(s2, params);
  const s3 = {
    x: state.x + (k2.x * dt) / 2,
    y: state.y + (k2.y * dt) / 2,
    z: state.z + (k2.z * dt) / 2,
  };
  const k3 = rosslerDerivative(s3, params);
  const s4 = {
    x: state.x + k3.x * dt,
    y: state.y + k3.y * dt,
    z: state.z + k3.z * dt,
  };
  const k4 = rosslerDerivative(s4, params);

  return {
    x: state.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: state.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    z: state.z + (dt / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
  };
}

export interface MapParams {
  a: number;
  b: number;
  c: number;
  d: number;
}

export const DEFAULT_CLIFFORD_PARAMS: MapParams = {
  a: -1.4,
  b: 1.6,
  c: 1.0,
  d: 0.7,
};

export const DEFAULT_DE_JONG_PARAMS: MapParams = {
  a: -2.0,
  b: -2.0,
  c: -1.2,
  d: 2.0,
};

export function cliffordStep(
  x: number,
  y: number,
  params: MapParams
): { x: number; y: number } {
  return {
    x: Math.sin(params.a * y) + params.c * Math.cos(params.a * x),
    y: Math.sin(params.b * x) + params.d * Math.cos(params.b * y),
  };
}

export function deJongStep(
  x: number,
  y: number,
  params: MapParams
): { x: number; y: number } {
  return {
    x: Math.sin(params.a * y) - Math.cos(params.b * x),
    y: Math.sin(params.c * x) - Math.cos(params.d * y),
  };
}

export function randomMapParams(): MapParams {
  const rand = () => Math.random() * 4 - 2;
  return { a: rand(), b: rand(), c: rand(), d: rand() };
}

export const MIN_MAP_ITERATIONS = 20000;
export const MAX_MAP_ITERATIONS = 3000000;
export const DEFAULT_MAP_ITERATIONS = 400000;

export function clampMapIterations(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MAP_ITERATIONS;
  }
  return Math.min(
    MAX_MAP_ITERATIONS,
    Math.max(MIN_MAP_ITERATIONS, Math.round(value))
  );
}

export function renderAttractorDensity(
  imageData: ImageData,
  stepFn: (x: number, y: number, params: MapParams) => { x: number; y: number },
  params: MapParams,
  iterations: number,
  colorRgb: [number, number, number]
): void {
  const { width, height, data } = imageData;
  const histogram = new Float64Array(width * height);

  let x = 0.1;
  let y = 0.1;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const warmup = Math.min(200, iterations);
  for (let i = 0; i < warmup; i++) {
    const next = stepFn(x, y, params);
    x = next.x;
    y = next.y;
  }

  const samples = new Float64Array(iterations * 2);
  for (let i = 0; i < iterations; i++) {
    const next = stepFn(x, y, params);
    x = next.x;
    y = next.y;
    samples[i * 2] = x;
    samples[i * 2 + 1] = y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const spanX = Math.max(maxX - minX, 1e-6);
  const spanY = Math.max(maxY - minY, 1e-6);
  const scale = Math.min(width / spanX, height / spanY) * 0.92;
  const offsetX = width / 2 - ((minX + maxX) / 2) * scale;
  const offsetY = height / 2 - ((minY + maxY) / 2) * scale;

  let maxHits = 0;
  for (let i = 0; i < iterations; i++) {
    const px = Math.floor(samples[i * 2] * scale + offsetX);
    const py = Math.floor(samples[i * 2 + 1] * scale + offsetY);
    if (px < 0 || px >= width || py < 0 || py >= height) {
      continue;
    }
    const idx = py * width + px;
    histogram[idx] += 1;
    if (histogram[idx] > maxHits) {
      maxHits = histogram[idx];
    }
  }

  const logMax = Math.log(maxHits + 1);
  const [r, g, b] = colorRgb;
  for (let i = 0; i < histogram.length; i++) {
    const hits = histogram[i];
    const offset = i * 4;
    if (hits === 0) {
      data[offset] = 8;
      data[offset + 1] = 9;
      data[offset + 2] = 16;
      data[offset + 3] = 255;
      continue;
    }
    const t = logMax > 0 ? Math.log(hits + 1) / logMax : 0;
    data[offset] = Math.round(8 + t * (r - 8));
    data[offset + 1] = Math.round(9 + t * (g - 9));
    data[offset + 2] = Math.round(16 + t * (b - 16));
    data[offset + 3] = 255;
  }
}

