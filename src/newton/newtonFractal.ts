export interface Complex {
  re: number;
  im: number;
}

export const MIN_NEWTON_DEGREE = 2;
export const MAX_NEWTON_DEGREE = 6;
export const DEFAULT_NEWTON_DEGREE = 3;
export const MIN_NEWTON_ITERATIONS = 4;
export const MAX_NEWTON_ITERATIONS = 60;
export const DEFAULT_NEWTON_ITERATIONS = 24;

export interface NewtonView {
  centerRe: number;
  centerIm: number;
  scale: number;
}

export const DEFAULT_NEWTON_VIEW: NewtonView = {
  centerRe: 0,
  centerIm: 0,
  scale: 1.6,
};

export function clampNewtonDegree(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_NEWTON_DEGREE;
  }
  return Math.min(MAX_NEWTON_DEGREE, Math.max(MIN_NEWTON_DEGREE, Math.round(value)));
}

export function clampNewtonIterations(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_NEWTON_ITERATIONS;
  }
  return Math.min(
    MAX_NEWTON_ITERATIONS,
    Math.max(MIN_NEWTON_ITERATIONS, Math.round(value))
  );
}

/** Roots of unity for z^degree - 1 = 0. */
export function rootsOfUnity(degree: number): Complex[] {
  const roots: Complex[] = [];
  for (let k = 0; k < degree; k++) {
    const angle = (2 * Math.PI * k) / degree;
    roots.push({ re: Math.cos(angle), im: Math.sin(angle) });
  }
  return roots;
}

function complexMul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

/** Evaluates z^degree - 1 and its derivative degree * z^(degree-1) at z. */
export function evaluatePolynomial(
  z: Complex,
  degree: number
): { value: Complex; derivative: Complex } {
  let power: Complex = { re: 1, im: 0 };
  for (let i = 0; i < degree - 1; i++) {
    power = complexMul(power, z);
  }
  const zPowDegree = complexMul(power, z);
  const value: Complex = { re: zPowDegree.re - 1, im: zPowDegree.im };
  const derivative: Complex = { re: degree * power.re, im: degree * power.im };
  return { value, derivative };
}

export interface NewtonResult {
  rootIndex: number;
  iterations: number;
}

const CONVERGENCE_EPS_SQ = 1e-12;

export function newtonIterate(
  startRe: number,
  startIm: number,
  degree: number,
  maxIterations: number,
  roots: Complex[]
): NewtonResult {
  let re = startRe;
  let im = startIm;

  for (let i = 0; i < maxIterations; i++) {
    const { value, derivative } = evaluatePolynomial({ re, im }, degree);
    const denom = derivative.re * derivative.re + derivative.im * derivative.im;
    if (denom < 1e-18) {
      break;
    }
    // z - f(z)/f'(z), computed via complex division f(z) * conj(f'(z)) / |f'(z)|^2
    const deltaRe = (value.re * derivative.re + value.im * derivative.im) / denom;
    const deltaIm = (value.im * derivative.re - value.re * derivative.im) / denom;
    re -= deltaRe;
    im -= deltaIm;

    for (let r = 0; r < roots.length; r++) {
      const dre = re - roots[r].re;
      const dim = im - roots[r].im;
      if (dre * dre + dim * dim < CONVERGENCE_EPS_SQ) {
        return { rootIndex: r, iterations: i + 1 };
      }
    }
  }

  return { rootIndex: -1, iterations: maxIterations };
}

const ROOT_HUES = [0, 55, 110, 200, 260, 320];

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

export function colorForResult(
  result: NewtonResult,
  maxIterations: number
): [number, number, number] {
  if (result.rootIndex < 0) {
    return [8, 9, 16];
  }
  const hue = ROOT_HUES[result.rootIndex % ROOT_HUES.length];
  const t = 1 - Math.min(result.iterations / maxIterations, 1);
  const lightness = 0.28 + t * 0.4;
  return hslToRgb(hue, 0.75, lightness);
}

export function complexFromPixel(
  px: number,
  py: number,
  width: number,
  height: number,
  view: NewtonView
): Complex {
  const aspect = width / height;
  return {
    re: view.centerRe + (px / width - 0.5) * 2 * view.scale * aspect,
    im: view.centerIm - (py / height - 0.5) * 2 * view.scale,
  };
}

export function zoomNewtonViewAt(
  view: NewtonView,
  re: number,
  im: number,
  factor: number
): NewtonView {
  return { centerRe: re, centerIm: im, scale: view.scale * factor };
}

export function renderNewtonFractal(
  imageData: ImageData,
  view: NewtonView,
  degree: number,
  maxIterations: number
): void {
  const { width, height, data } = imageData;
  const roots = rootsOfUnity(degree);
  const aspect = width / height;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const re = view.centerRe + (px / width - 0.5) * 2 * view.scale * aspect;
      const im = view.centerIm - (py / height - 0.5) * 2 * view.scale;
      const result = newtonIterate(re, im, degree, maxIterations, roots);
      const [r, g, b] = colorForResult(result, maxIterations);
      const offset = (py * width + px) * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = 255;
    }
  }
}
