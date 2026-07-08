export function sieveOfEratosthenes(limit: number): Uint8Array {
  const isPrime = new Uint8Array(limit + 1).fill(1);
  if (limit >= 0) {
    isPrime[0] = 0;
  }
  if (limit >= 1) {
    isPrime[1] = 0;
  }
  for (let i = 2; i * i <= limit; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= limit; j += i) {
        isPrime[j] = 0;
      }
    }
  }
  return isPrime;
}

export interface SpiralPoint {
  n: number;
  x: number;
  y: number;
  isPrime: boolean;
}

export type SpiralType = "ulam" | "sacks";

export const MIN_SPIRAL_N = 100;
export const MAX_SPIRAL_N = 60000;
export const DEFAULT_SPIRAL_N = 10000;

export function clampSpiralN(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SPIRAL_N;
  }
  return Math.min(MAX_SPIRAL_N, Math.max(MIN_SPIRAL_N, Math.round(value)));
}

const ULAM_DIRECTIONS: Array<[number, number]> = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

export function ulamSpiralPoints(
  maxN: number,
  primeFlags: Uint8Array
): SpiralPoint[] {
  const points: SpiralPoint[] = [];
  let x = 0;
  let y = 0;
  let n = 1;
  points.push({ n, x, y, isPrime: primeFlags[n] === 1 });

  let dirIndex = 0;
  let segmentLength = 1;
  let segmentsAtLength = 0;

  while (n < maxN) {
    const [dx, dy] = ULAM_DIRECTIONS[dirIndex];
    for (let s = 0; s < segmentLength && n < maxN; s++) {
      x += dx;
      y += dy;
      n++;
      points.push({ n, x, y, isPrime: primeFlags[n] === 1 });
    }
    dirIndex = (dirIndex + 1) % 4;
    segmentsAtLength++;
    if (segmentsAtLength === 2) {
      segmentsAtLength = 0;
      segmentLength++;
    }
  }

  return points;
}

export function sacksSpiralPoints(
  maxN: number,
  primeFlags: Uint8Array
): SpiralPoint[] {
  const points: SpiralPoint[] = [];
  for (let n = 1; n <= maxN; n++) {
    const r = Math.sqrt(n);
    const theta = 2 * Math.PI * Math.sqrt(n);
    points.push({
      n,
      x: r * Math.cos(theta),
      y: r * Math.sin(theta),
      isPrime: primeFlags[n] === 1,
    });
  }
  return points;
}

export function generateSpiralPoints(
  type: SpiralType,
  maxN: number
): SpiralPoint[] {
  const clamped = clampSpiralN(maxN);
  const primeFlags = sieveOfEratosthenes(clamped);
  return type === "ulam"
    ? ulamSpiralPoints(clamped, primeFlags)
    : sacksSpiralPoints(clamped, primeFlags);
}

export interface ScreenPoint {
  n: number;
  x: number;
  y: number;
  isPrime: boolean;
}

export function fitPointsToViewport(
  points: SpiralPoint[],
  width: number,
  height: number,
  padding: number
): ScreenPoint[] {
  if (points.length === 0) {
    return [];
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const spanX = Math.max(maxX - minX, 1e-9);
  const spanY = Math.max(maxY - minY, 1e-9);
  const availableW = Math.max(width - padding * 2, 1);
  const availableH = Math.max(height - padding * 2, 1);
  const scale = Math.min(availableW / spanX, availableH / spanY);
  const offsetX = padding + (availableW - spanX * scale) / 2 - minX * scale;
  const offsetY = padding + (availableH - spanY * scale) / 2 - minY * scale;

  return points.map((p) => ({
    n: p.n,
    x: p.x * scale + offsetX,
    y: p.y * scale + offsetY,
    isPrime: p.isPrime,
  }));
}
