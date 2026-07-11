export const MIN_JULIA_ITERATIONS = 16;
export const MAX_JULIA_ITERATIONS = 2000;
export const DEFAULT_JULIA_ITERATIONS = 200;

export interface JuliaView {
  centerRe: number;
  centerIm: number;
  /** Half-height of the viewport in complex-plane units. */
  scale: number;
}

/** Julia sets are typically viewed centered at the origin, unlike the
 * Mandelbrot set whose interesting structure sits off to the left. */
export const DEFAULT_JULIA_VIEW: JuliaView = {
  centerRe: 0,
  centerIm: 0,
  scale: 1.5,
};

export const MAX_JULIA_SCALE = 2.5;
export const MIN_JULIA_SCALE = 1e-13;
export const ZOOM_IN_FACTOR = 0.5;
export const ZOOM_OUT_FACTOR = 2;

export function clampJuliaScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) {
    return DEFAULT_JULIA_VIEW.scale;
  }
  return Math.min(MAX_JULIA_SCALE, Math.max(MIN_JULIA_SCALE, scale));
}

export interface JuliaPreset {
  id: string;
  label: string;
  cRe: number;
  cIm: number;
}

export const JULIA_PRESETS: JuliaPreset[] = [
  { id: "spiral", label: "Spiral", cRe: -0.7, cIm: 0.27015 },
  { id: "dendrite", label: "Dendrite", cRe: 0, cIm: 1 },
  { id: "douady-rabbit", label: "Douady's Rabbit", cRe: -0.123, cIm: 0.745 },
  { id: "san-marco", label: "San Marco", cRe: -0.75, cIm: 0 },
  { id: "siegel-disk", label: "Siegel Disk", cRe: -0.390541, cIm: -0.586788 },
  { id: "airplane", label: "Airplane", cRe: -1.75488, cIm: 0 },
];

export const DEFAULT_JULIA_C = JULIA_PRESETS[0];

/** Escape-time iteration of z -> z^2 + c with c FIXED and z0 = the pixel's
 * own coordinate — the inverse role assignment from Mandelbrot, where c
 * varies per pixel and z0 is always 0. */
export function juliaIterations(
  zr0: number,
  zi0: number,
  cRe: number,
  cIm: number,
  maxIterations: number
): number {
  let zr = zr0;
  let zi = zi0;

  for (let i = 0; i < maxIterations; i++) {
    const zr2 = zr * zr - zi * zi + cRe;
    const zi2 = 2 * zr * zi + cIm;
    zr = zr2;
    zi = zi2;
    if (zr * zr + zi * zi > 4) {
      return i;
    }
  }

  return maxIterations;
}

export function smoothJuliaValue(
  zr0: number,
  zi0: number,
  cRe: number,
  cIm: number,
  maxIterations: number
): number {
  let zr = zr0;
  let zi = zi0;

  for (let i = 0; i < maxIterations; i++) {
    const zr2 = zr * zr - zi * zi + cRe;
    const zi2 = 2 * zr * zi + cIm;
    zr = zr2;
    zi = zi2;
    const magnitude = zr * zr + zi * zi;
    if (magnitude > 4) {
      const logZn = Math.log(magnitude) / 2;
      const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
      return i + 1 - nu;
    }
  }

  return maxIterations;
}

export function clampJuliaIterations(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_JULIA_ITERATIONS;
  }
  return Math.min(
    MAX_JULIA_ITERATIONS,
    Math.max(MIN_JULIA_ITERATIONS, Math.round(value))
  );
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export function colorForSmoothValue(
  value: number,
  maxIterations: number
): [number, number, number] {
  if (value >= maxIterations) {
    return [12, 14, 28];
  }

  const t = value / maxIterations;
  const hue = 280 - t * 240;
  const lightness = 0.16 + t * 0.58;
  return hslToRgb(hue, 0.85, lightness);
}

export function complexFromPixel(
  px: number,
  py: number,
  width: number,
  height: number,
  view: JuliaView
): { re: number; im: number } {
  const aspect = width / height;
  return {
    re: view.centerRe + (px / width - 0.5) * 2 * view.scale * aspect,
    im: view.centerIm - (py / height - 0.5) * 2 * view.scale,
  };
}

export function zoomViewAt(
  view: JuliaView,
  re: number,
  im: number,
  factor: number
): JuliaView {
  return {
    centerRe: re,
    centerIm: im,
    scale: clampJuliaScale(view.scale * factor),
  };
}

export function zoomViewKeepingPoint(
  view: JuliaView,
  re: number,
  im: number,
  factor: number
): JuliaView {
  const nextScale = clampJuliaScale(view.scale * factor);
  const appliedFactor = nextScale / view.scale;
  return {
    centerRe: re - (re - view.centerRe) * appliedFactor,
    centerIm: im - (im - view.centerIm) * appliedFactor,
    scale: nextScale,
  };
}

export function zoomViewCentered(view: JuliaView, factor: number): JuliaView {
  return {
    ...view,
    scale: clampJuliaScale(view.scale * factor),
  };
}

export function renderJulia(
  imageData: ImageData,
  view: JuliaView,
  cRe: number,
  cIm: number,
  maxIterations: number
): void {
  const { width, height, data } = imageData;
  const aspect = width / height;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const zr0 = view.centerRe + (px / width - 0.5) * 2 * view.scale * aspect;
      const zi0 = view.centerIm - (py / height - 0.5) * 2 * view.scale;
      const smooth = smoothJuliaValue(zr0, zi0, cRe, cIm, maxIterations);
      const [r, g, b] = colorForSmoothValue(smooth, maxIterations);
      const index = (py * width + px) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }
}
