export const MIN_N_GON_SIDES = 3;
export const MAX_N_GON_SIDES = 5000;
export const DEFAULT_N_GON_SIDES = 6;

export interface Point2D {
  x: number;
  y: number;
}

export interface PiBounds {
  lower: number;
  upper: number;
}

/**
 * Unit circle (radius 1). Inscribed perimeter / 2 = N·sin(π/N) — lower bound on π.
 */
export function estimatePiLowerBound(n: number): number {
  if (n < MIN_N_GON_SIDES) {
    return 0;
  }
  return n * Math.sin(Math.PI / n);
}

/**
 * Unit circle (radius 1). Circumscribed perimeter / 2 = N·tan(π/N) — upper bound on π.
 */
export function estimatePiUpperBound(n: number): number {
  if (n < MIN_N_GON_SIDES) {
    return 0;
  }
  return n * Math.tan(Math.PI / n);
}

/** @deprecated Use estimatePiLowerBound */
export function estimatePiInscribed(n: number): number {
  return estimatePiLowerBound(n);
}

export function calculatePiBounds(n: number): PiBounds {
  return {
    lower: estimatePiLowerBound(n),
    upper: estimatePiUpperBound(n),
  };
}

export function inscribedNGonVertices(
  n: number,
  centerX: number,
  centerY: number,
  radius: number
): Point2D[] {
  const vertices: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    vertices.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  return vertices;
}

/** Circumscribed (exscribed) n-gon with edges tangent to the circle. */
export function circumscribedNGonVertices(
  n: number,
  centerX: number,
  centerY: number,
  radius: number
): Point2D[] {
  const vertexRadius = radius / Math.cos(Math.PI / n);
  const vertices: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + Math.PI / n + (2 * Math.PI * i) / n;
    vertices.push({
      x: centerX + vertexRadius * Math.cos(angle),
      y: centerY + vertexRadius * Math.sin(angle),
    });
  }
  return vertices;
}

export function polygonPath(vertices: Point2D[]): string {
  if (vertices.length === 0) {
    return "";
  }
  const [first, ...rest] = vertices;
  return (
    `M ${first.x} ${first.y} ` +
    rest.map((point) => `L ${point.x} ${point.y}`).join(" ") +
    " Z"
  );
}

export function circumscribedExtentRadius(unitCircleRadius: number, n: number): number {
  return unitCircleRadius / Math.cos(Math.PI / n);
}

export function clampNGonSides(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_N_GON_SIDES;
  }
  return Math.min(MAX_N_GON_SIDES, Math.max(MIN_N_GON_SIDES, Math.round(value)));
}

export function formatPi(value: number, digits = 12): string {
  return value.toFixed(digits);
}

export function piBracketWidth(bounds: PiBounds): number {
  return bounds.upper - bounds.lower;
}
