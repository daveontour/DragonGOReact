export const MIN_DETAIL = 5;
export const MAX_DETAIL = 9;
export const DEFAULT_DETAIL = 8;

export const MIN_ROUGHNESS = 0.3;
export const MAX_ROUGHNESS = 1.2;
export const DEFAULT_ROUGHNESS = 0.75;

export const MIN_SEA_LEVEL = 0;
export const MAX_SEA_LEVEL = 1;
export const DEFAULT_SEA_LEVEL = 0.35;

export const INITIAL_AMPLITUDE = 1.0;

export function clampDetail(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_DETAIL;
  }
  return Math.min(MAX_DETAIL, Math.max(MIN_DETAIL, Math.round(value)));
}

export function clampRoughness(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ROUGHNESS;
  }
  return Math.min(MAX_ROUGHNESS, Math.max(MIN_ROUGHNESS, value));
}

export function clampSeaLevel(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SEA_LEVEL;
  }
  return Math.min(MAX_SEA_LEVEL, Math.max(MIN_SEA_LEVEL, value));
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

export function gridSizeForDetail(n: number): number {
  return (1 << n) + 1;
}

/** Fournier/Fussell/Carpenter 1982 midpoint displacement. Diamond-step
 * points always land at (x/half + y/half) EVEN parity; square-step points
 * always land at ODD parity — the two sets never overlap, so no
 * "already set" guard is needed and there's no ambiguous alternating-row
 * offset to hand-derive. Square-step neighbors are clamped to in-bounds
 * N/E/S/W points only (2 at corners, 3 on edges, 4 interior) — never
 * wraparound, since no tiling was requested and wrapping-by-mistake is the
 * classic source of visible terrain seams. */
export function generateDiamondSquare(n: number, hurst: number, rng: () => number): Float32Array {
  const size = gridSizeForDetail(n);
  const heights = new Float32Array(size * size);
  const idx = (x: number, y: number) => y * size + x;
  const rand = () => rng() * 2 - 1;

  heights[idx(0, 0)] = rand();
  heights[idx(size - 1, 0)] = rand();
  heights[idx(0, size - 1)] = rand();
  heights[idx(size - 1, size - 1)] = rand();

  let step = size - 1;
  let amplitude = INITIAL_AMPLITUDE;

  while (step > 1) {
    const half = step / 2;

    // Diamond step: fill the center of every step-sized square.
    for (let y = half; y < size; y += step) {
      for (let x = half; x < size; x += step) {
        const avg =
          (heights[idx(x - half, y - half)] +
            heights[idx(x + half, y - half)] +
            heights[idx(x - half, y + half)] +
            heights[idx(x + half, y + half)]) /
          4;
        heights[idx(x, y)] = avg + rand() * amplitude;
      }
    }

    // Square step: fill every remaining point at spacing `half` (the
    // odd-parity points — diamond-step points above are always even-parity).
    for (let y = 0; y < size; y += half) {
      for (let x = 0; x < size; x += half) {
        if ((x / half + y / half) % 2 === 0) {
          continue;
        }
        let sum = 0;
        let count = 0;
        if (x - half >= 0) {
          sum += heights[idx(x - half, y)];
          count++;
        }
        if (x + half < size) {
          sum += heights[idx(x + half, y)];
          count++;
        }
        if (y - half >= 0) {
          sum += heights[idx(x, y - half)];
          count++;
        }
        if (y + half < size) {
          sum += heights[idx(x, y + half)];
          count++;
        }
        heights[idx(x, y)] = sum / count + rand() * amplitude;
      }
    }

    step = half;
    amplitude *= Math.pow(2, -hurst);
  }

  return heights;
}

export interface TerrainColorRamp {
  seaLevel: number;
}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function colorForHeight(h: number, seaLevel: number): [number, number, number] {
  const deepWater: [number, number, number] = [10, 30, 70];
  const shallowWater: [number, number, number] = [30, 90, 150];
  const sand: [number, number, number] = [210, 190, 140];
  const grass: [number, number, number] = [70, 130, 60];
  const forest: [number, number, number] = [40, 90, 45];
  const rock: [number, number, number] = [110, 100, 95];
  const snow: [number, number, number] = [245, 245, 250];

  if (h < seaLevel) {
    const t = seaLevel <= 0 ? 1 : h / seaLevel;
    return lerpColor(deepWater, shallowWater, Math.max(0, Math.min(1, t)));
  }
  const landSpan = Math.max(1e-6, 1 - seaLevel);
  const t = (h - seaLevel) / landSpan;
  if (t < 0.06) {
    return lerpColor(sand, grass, t / 0.06);
  }
  if (t < 0.45) {
    return lerpColor(grass, forest, (t - 0.06) / 0.39);
  }
  if (t < 0.8) {
    return lerpColor(forest, rock, (t - 0.45) / 0.35);
  }
  return lerpColor(rock, snow, (t - 0.8) / 0.2);
}

export function renderTerrain(imageData: ImageData, heights: Float32Array, size: number, seaLevel: number): void {
  const { data } = imageData;
  let min = Infinity;
  let max = -Infinity;
  for (const h of heights) {
    if (h < min) min = h;
    if (h > max) max = h;
  }
  const span = Math.max(1e-6, max - min);

  for (let i = 0; i < size * size; i++) {
    const normalized = (heights[i] - min) / span;
    const [r, g, b] = colorForHeight(normalized, seaLevel);
    const offset = i * 4;
    data[offset] = Math.round(r);
    data[offset + 1] = Math.round(g);
    data[offset + 2] = Math.round(b);
    data[offset + 3] = 255;
  }
}
