export interface Complex {
  re: number;
  im: number;
}

export interface Epicycle {
  freq: number;
  amp: number;
  phase: number;
}

export function computeDFT(points: Complex[]): Epicycle[] {
  const N = points.length;
  const result: Epicycle[] = [];

  for (let k = 0; k < N; k++) {
    let sumRe = 0;
    let sumIm = 0;
    for (let n = 0; n < N; n++) {
      const phi = (2 * Math.PI * k * n) / N;
      const cos = Math.cos(phi);
      const sin = Math.sin(phi);
      sumRe += points[n].re * cos + points[n].im * sin;
      sumIm += -points[n].re * sin + points[n].im * cos;
    }
    sumRe /= N;
    sumIm /= N;

    const freq = k <= N / 2 ? k : k - N;
    const amp = Math.hypot(sumRe, sumIm);
    const phase = Math.atan2(sumIm, sumRe);
    result.push({ freq, amp, phase });
  }

  return result.sort((a, b) => b.amp - a.amp);
}

export function epicycleChainPositions(
  epicycles: Epicycle[],
  numHarmonics: number,
  t: number
): Complex[] {
  let x = 0;
  let y = 0;
  const points: Complex[] = [{ re: 0, im: 0 }];
  const used = epicycles.slice(0, Math.max(0, numHarmonics));

  for (const e of used) {
    const angle = e.freq * t + e.phase;
    x += e.amp * Math.cos(angle);
    y += e.amp * Math.sin(angle);
    points.push({ re: x, im: y });
  }

  return points;
}

export type FourierPresetId = "star" | "heart" | "square" | "infinity";

export interface FourierPreset {
  id: FourierPresetId;
  name: string;
}

export const FOURIER_PRESETS: Record<FourierPresetId, FourierPreset> = {
  star: { id: "star", name: "Five-Point Star" },
  heart: { id: "heart", name: "Heart Curve" },
  square: { id: "square", name: "Square" },
  infinity: { id: "infinity", name: "Infinity Symbol" },
};

function lerp(a: Complex, b: Complex, t: number): Complex {
  return { re: a.re + (b.re - a.re) * t, im: a.im + (b.im - a.im) * t };
}

function samplePolyline(vertices: Complex[], samples: number): Complex[] {
  const segments = vertices.length;
  const points: Complex[] = [];
  for (let i = 0; i < samples; i++) {
    const pos = (i / samples) * segments;
    const segIndex = Math.floor(pos) % segments;
    const localT = pos - Math.floor(pos);
    const a = vertices[segIndex];
    const b = vertices[(segIndex + 1) % segments];
    points.push(lerp(a, b, localT));
  }
  return points;
}

function starVertices(): Complex[] {
  const outerR = 1;
  const innerR = 0.42;
  const vertices: Complex[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    vertices.push({ re: r * Math.cos(angle), im: r * Math.sin(angle) });
  }
  return vertices;
}

function squareVertices(): Complex[] {
  return [
    { re: -1, im: -1 },
    { re: 1, im: -1 },
    { re: 1, im: 1 },
    { re: -1, im: 1 },
  ];
}

export function generatePresetPath(
  id: FourierPresetId,
  samples: number
): Complex[] {
  if (id === "star") {
    return samplePolyline(starVertices(), samples);
  }
  if (id === "square") {
    return samplePolyline(squareVertices(), samples);
  }

  const points: Complex[] = [];
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * Math.PI * 2;
    if (id === "heart") {
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);
      points.push({ re: x / 16, im: -y / 16 });
    } else {
      points.push({ re: Math.cos(t), im: Math.sin(t) * Math.cos(t) });
    }
  }
  return points;
}

export const MIN_FOURIER_HARMONICS = 1;
export const DEFAULT_FOURIER_SAMPLES = 120;

export function clampHarmonics(value: number, maxHarmonics: number): number {
  if (!Number.isFinite(value)) {
    return maxHarmonics;
  }
  return Math.min(maxHarmonics, Math.max(MIN_FOURIER_HARMONICS, Math.round(value)));
}

export const MIN_FOURIER_SPEED = 0.1;
export const MAX_FOURIER_SPEED = 3;
export const DEFAULT_FOURIER_SPEED = 1;

export function clampFourierSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_FOURIER_SPEED;
  }
  return Math.min(MAX_FOURIER_SPEED, Math.max(MIN_FOURIER_SPEED, value));
}
