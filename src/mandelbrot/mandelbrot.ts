export const MIN_MANDELBROT_ITERATIONS = 16;
export const MAX_MANDELBROT_ITERATIONS = 2000;
export const DEFAULT_MANDELBROT_ITERATIONS = 200;

export interface MandelbrotView {
  centerRe: number;
  centerIm: number;
  /** Half-height of the viewport in complex-plane units. */
  scale: number;
}

export const DEFAULT_MANDELBROT_VIEW: MandelbrotView = {
  centerRe: -0.5,
  centerIm: 0,
  scale: 1.35,
};

/** Widest view allowed when zooming out. */
export const MAX_MANDELBROT_SCALE = 2.5;
/** Tightest view allowed before double precision degrades. */
export const MIN_MANDELBROT_SCALE = 1e-13;
/** Multiplier applied for a single zoom-in step. */
export const ZOOM_IN_FACTOR = 0.5;
/** Multiplier applied for a single zoom-out step. */
export const ZOOM_OUT_FACTOR = 2;

export function clampMandelbrotScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) {
    return DEFAULT_MANDELBROT_VIEW.scale;
  }
  return Math.min(MAX_MANDELBROT_SCALE, Math.max(MIN_MANDELBROT_SCALE, scale));
}

export function mandelbrotIterations(
  cr: number,
  ci: number,
  maxIterations: number
): number {
  let zr = 0;
  let zi = 0;

  for (let i = 0; i < maxIterations; i++) {
    const zr2 = zr * zr - zi * zi + cr;
    const zi2 = 2 * zr * zi + ci;
    zr = zr2;
    zi = zi2;
    if (zr * zr + zi * zi > 4) {
      return i;
    }
  }

  return maxIterations;
}

export function smoothMandelbrotValue(
  cr: number,
  ci: number,
  maxIterations: number
): number {
  let zr = 0;
  let zi = 0;

  for (let i = 0; i < maxIterations; i++) {
    const zr2 = zr * zr - zi * zi + cr;
    const zi2 = 2 * zr * zi + ci;
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

export function clampMandelbrotIterations(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MANDELBROT_ITERATIONS;
  }
  return Math.min(
    MAX_MANDELBROT_ITERATIONS,
    Math.max(MIN_MANDELBROT_ITERATIONS, Math.round(value))
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
  const hue = 240 - t * 200;
  const lightness = 0.18 + t * 0.55;
  return hslToRgb(hue, 0.85, lightness);
}

export function complexFromPixel(
  px: number,
  py: number,
  width: number,
  height: number,
  view: MandelbrotView
): { re: number; im: number } {
  const aspect = width / height;
  return {
    re: view.centerRe + (px / width - 0.5) * 2 * view.scale * aspect,
    im: view.centerIm - (py / height - 0.5) * 2 * view.scale,
  };
}

export function zoomViewAt(
  view: MandelbrotView,
  re: number,
  im: number,
  factor: number
): MandelbrotView {
  return {
    centerRe: re,
    centerIm: im,
    scale: clampMandelbrotScale(view.scale * factor),
  };
}

/**
 * Zooms by `factor` while keeping the complex point (re, im) anchored to the
 * same screen position, so scrolling in/out tracks the cursor.
 */
export function zoomViewKeepingPoint(
  view: MandelbrotView,
  re: number,
  im: number,
  factor: number
): MandelbrotView {
  const nextScale = clampMandelbrotScale(view.scale * factor);
  const appliedFactor = nextScale / view.scale;
  return {
    centerRe: re - (re - view.centerRe) * appliedFactor,
    centerIm: im - (im - view.centerIm) * appliedFactor,
    scale: nextScale,
  };
}

/** Zooms about the current view centre (used by the zoom buttons). */
export function zoomViewCentered(
  view: MandelbrotView,
  factor: number
): MandelbrotView {
  return {
    ...view,
    scale: clampMandelbrotScale(view.scale * factor),
  };
}

export function renderMandelbrot(
  imageData: ImageData,
  view: MandelbrotView,
  maxIterations: number
): void {
  const { width, height, data } = imageData;
  const aspect = width / height;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const cr = view.centerRe + (px / width - 0.5) * 2 * view.scale * aspect;
      const ci = view.centerIm - (py / height - 0.5) * 2 * view.scale;
      const smooth = smoothMandelbrotValue(cr, ci, maxIterations);
      const [r, g, b] = colorForSmoothValue(smooth, maxIterations);
      const index = (py * width + px) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }
}
