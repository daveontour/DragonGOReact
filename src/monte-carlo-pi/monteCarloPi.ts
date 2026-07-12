export const MIN_TARGET_SAMPLES = 1_000;
export const MAX_TARGET_SAMPLES = 200_000;
export const DEFAULT_TARGET_SAMPLES = 50_000;

export const MIN_SAMPLES_PER_FRAME = 10;
export const MAX_SAMPLES_PER_FRAME = 2_000;
export const DEFAULT_SAMPLES_PER_FRAME = 250;

export interface MonteCarloPoint {
  x: number;
  y: number;
  inside: boolean;
}

export interface MonteCarloPiSimulation {
  points: MonteCarloPoint[];
  insideCount: number;
  seed: number;
  random: () => number;
}

export function clampTargetSamples(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TARGET_SAMPLES;
  }
  return Math.min(
    MAX_TARGET_SAMPLES,
    Math.max(MIN_TARGET_SAMPLES, Math.round(value))
  );
}

export function clampSamplesPerFrame(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SAMPLES_PER_FRAME;
  }
  return Math.min(
    MAX_SAMPLES_PER_FRAME,
    Math.max(MIN_SAMPLES_PER_FRAME, Math.round(value))
  );
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

export function isInsideUnitCircle(x: number, y: number): boolean {
  return x * x + y * y <= 1;
}

export function createMonteCarloPiSimulation(
  seed: number
): MonteCarloPiSimulation {
  return {
    points: [],
    insideCount: 0,
    seed,
    random: createSeededRandom(seed),
  };
}

export function addMonteCarloSamples(
  simulation: MonteCarloPiSimulation,
  count: number,
  targetSamples = Number.POSITIVE_INFINITY
): void {
  const remaining = Math.max(0, targetSamples - simulation.points.length);
  const sampleCount = Math.min(Math.max(0, Math.floor(count)), remaining);

  for (let i = 0; i < sampleCount; i++) {
    const x = simulation.random() * 2 - 1;
    const y = simulation.random() * 2 - 1;
    const inside = isInsideUnitCircle(x, y);
    simulation.points.push({ x, y, inside });
    if (inside) {
      simulation.insideCount++;
    }
  }
}

export function estimatePi(insideCount: number, totalCount: number): number {
  return totalCount > 0 ? (4 * insideCount) / totalCount : 0;
}

export function estimateError(estimate: number): number {
  return Math.abs(estimate - Math.PI);
}
