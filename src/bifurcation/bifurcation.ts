export interface BifurcationView {
  rMin: number;
  rMax: number;
}

export const FULL_R_MIN = 2.4;
export const FULL_R_MAX = 4.0;
export const DEFAULT_BIFURCATION_VIEW: BifurcationView = {
  rMin: FULL_R_MIN,
  rMax: FULL_R_MAX,
};

export const MIN_BIFURCATION_ITERATIONS = 50;
export const MAX_BIFURCATION_ITERATIONS = 600;
export const DEFAULT_BIFURCATION_ITERATIONS = 250;
export const DEFAULT_BIFURCATION_DISCARD = 200;
export const MIN_BIFURCATION_SPAN = 1e-6;

export function logisticMap(x: number, r: number): number {
  return r * x * (1 - x);
}

export function clampBifurcationIterations(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_BIFURCATION_ITERATIONS;
  }
  return Math.min(
    MAX_BIFURCATION_ITERATIONS,
    Math.max(MIN_BIFURCATION_ITERATIONS, Math.round(value))
  );
}

export function rAtPixel(
  px: number,
  width: number,
  view: BifurcationView
): number {
  return view.rMin + (px / width) * (view.rMax - view.rMin);
}

export function zoomBifurcationAt(
  view: BifurcationView,
  rTarget: number,
  factor: number
): BifurcationView {
  const halfWidth = Math.max(
    MIN_BIFURCATION_SPAN,
    ((view.rMax - view.rMin) / 2) * factor
  );
  return { rMin: rTarget - halfWidth, rMax: rTarget + halfWidth };
}

export function renderBifurcation(
  imageData: ImageData,
  view: BifurcationView,
  iterations: number,
  discard: number,
  colorRgb: [number, number, number]
): void {
  const { width, height, data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 8;
    data[i + 1] = 9;
    data[i + 2] = 16;
    data[i + 3] = 255;
  }

  const [r, g, b] = colorRgb;

  for (let px = 0; px < width; px++) {
    const r0 = rAtPixel(px, width, view);
    let x = 0.5;
    for (let i = 0; i < discard; i++) {
      x = logisticMap(x, r0);
    }
    for (let i = 0; i < iterations; i++) {
      x = logisticMap(x, r0);
      if (x < 0 || x > 1 || !Number.isFinite(x)) {
        continue;
      }
      const py = Math.min(height - 1, Math.floor((1 - x) * height));
      const offset = (py * width + px) * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = 255;
    }
  }
}
