export type ChladniRenderMode = "nodal-lines" | "sand-particles";

export const MIN_MODE = 1;
export const MAX_MODE = 12;
export const DEFAULT_MODE_N = 3;
export const DEFAULT_MODE_M = 5;

export const MIN_THRESHOLD = 0.02;
export const MAX_THRESHOLD = 0.5;
export const DEFAULT_THRESHOLD = 0.12;

export const MIN_PARTICLES = 1000;
export const MAX_PARTICLES = 20000;
export const DEFAULT_PARTICLES = 6000;
export const MAX_SAND_ATTEMPTS = 40;

export const CHLADNI_PLATE_COLOR: [number, number, number] = [10, 12, 20];
export const CHLADNI_LINE_COLOR: [number, number, number] = [180, 220, 255];
export const CHLADNI_SAND_COLOR: [number, number, number] = [240, 230, 200];

export interface ChladniPoint {
  x: number;
  y: number;
}

export interface ChladniRenderParams {
  mode: ChladniRenderMode;
  n: number;
  m: number;
  threshold: number;
  particleCount: number;
  seed: number;
}

export function clampMode(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MODE_N;
  }
  return Math.min(MAX_MODE, Math.max(MIN_MODE, Math.round(value)));
}

export function clampThreshold(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_THRESHOLD;
  }
  return Math.min(MAX_THRESHOLD, Math.max(MIN_THRESHOLD, value));
}

export function clampParticleCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PARTICLES;
  }
  return Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, Math.round(value)));
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

/** The classic square-plate Chladni eigenmode formula, x,y in [-1, 1]. */
export function chladniZ(n: number, m: number, x: number, y: number): number {
  return (
    Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) -
    Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y)
  );
}

export function pixelToPlate(
  px: number,
  py: number,
  width: number,
  height: number
): ChladniPoint {
  return {
    x: (px / (width - 1)) * 2 - 1,
    y: (py / (height - 1)) * 2 - 1,
  };
}

/** Weight for accepting a sand particle: 1 at the nodal line, 0 once |z|
 * reaches the threshold, squared for tighter grain-like clustering. */
export function sandAcceptWeight(z: number, threshold: number): number {
  const w = Math.max(0, 1 - Math.abs(z) / threshold);
  return w * w;
}

export function renderChladniNodalLines(
  imageData: ImageData,
  n: number,
  m: number,
  threshold: number,
  plateColor: [number, number, number] = CHLADNI_PLATE_COLOR,
  lineColor: [number, number, number] = CHLADNI_LINE_COLOR
): void {
  const { width, height, data } = imageData;
  const [pr, pg, pb] = plateColor;
  const [lr, lg, lb] = lineColor;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const { x, y } = pixelToPlate(px, py, width, height);
      const z = chladniZ(n, m, x, y);
      const brightness = Math.max(0, 1 - Math.abs(z) / threshold);
      const offset = (py * width + px) * 4;
      data[offset] = pr + (lr - pr) * brightness;
      data[offset + 1] = pg + (lg - pg) * brightness;
      data[offset + 2] = pb + (lb - pb) * brightness;
      data[offset + 3] = 255;
    }
  }
}

/** Rejection-samples plate-space points biased toward the nodal lines,
 * mirroring where sand settles on a real vibrating plate. */
export function generateSandParticles(
  n: number,
  m: number,
  count: number,
  seed: number,
  threshold: number,
  maxAttempts: number = MAX_SAND_ATTEMPTS
): ChladniPoint[] {
  const rng = createSeededRandom(seed);
  const particles: ChladniPoint[] = [];

  for (let i = 0; i < count; i++) {
    let accepted: ChladniPoint | null = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = rng() * 2 - 1;
      const y = rng() * 2 - 1;
      const z = chladniZ(n, m, x, y);
      if (rng() < sandAcceptWeight(z, threshold)) {
        accepted = { x, y };
        break;
      }
    }
    if (accepted) {
      particles.push(accepted);
    }
  }

  return particles;
}

export function renderChladniSandParticles(
  imageData: ImageData,
  particles: ChladniPoint[],
  dotSizePx: number,
  plateColor: [number, number, number] = CHLADNI_PLATE_COLOR,
  sandColor: [number, number, number] = CHLADNI_SAND_COLOR
): void {
  const { width, height, data } = imageData;
  const [pr, pg, pb] = plateColor;
  const [sr, sg, sb] = sandColor;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = pr;
    data[i + 1] = pg;
    data[i + 2] = pb;
    data[i + 3] = 255;
  }

  const half = Math.max(1, Math.round(dotSizePx / 2));
  for (const particle of particles) {
    const cx = Math.round(((particle.x + 1) / 2) * (width - 1));
    const cy = Math.round(((particle.y + 1) / 2) * (height - 1));
    for (let dy = -half; dy <= half; dy++) {
      const py = cy + dy;
      if (py < 0 || py >= height) {
        continue;
      }
      for (let dx = -half; dx <= half; dx++) {
        const px = cx + dx;
        if (px < 0 || px >= width) {
          continue;
        }
        const offset = (py * width + px) * 4;
        data[offset] = sr;
        data[offset + 1] = sg;
        data[offset + 2] = sb;
        data[offset + 3] = 255;
      }
    }
  }
}

export function renderChladni(imageData: ImageData, params: ChladniRenderParams): void {
  if (params.mode === "sand-particles") {
    const particles = generateSandParticles(
      params.n,
      params.m,
      params.particleCount,
      params.seed,
      params.threshold
    );
    renderChladniSandParticles(imageData, particles, 2);
    return;
  }

  renderChladniNodalLines(imageData, params.n, params.m, params.threshold);
}

/** Fraction of pixels whose brightness is closer to the line color than
 * the plate color, used as the "nodal coverage" results readout. */
export function nodalCoverageFraction(imageData: ImageData): number {
  const { width, height, data } = imageData;
  const [pr, pg, pb] = CHLADNI_PLATE_COLOR;
  let litCount = 0;
  const totalPixels = width * height;

  for (let i = 0; i < data.length; i += 4) {
    const dist = Math.abs(data[i] - pr) + Math.abs(data[i + 1] - pg) + Math.abs(data[i + 2] - pb);
    if (dist > 30) {
      litCount++;
    }
  }

  return totalPixels === 0 ? 0 : litCount / totalPixels;
}
