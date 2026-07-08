export const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

export interface PenrosePoint {
  x: number;
  y: number;
}

/** 0 = thin ("red") golden gnomon half-rhombus, 1 = thick ("blue") golden triangle half-rhombus. */
export type PenroseColor = 0 | 1;

export interface PenroseTriangle {
  color: PenroseColor;
  a: PenrosePoint;
  b: PenrosePoint;
  c: PenrosePoint;
}

function lerpPoint(p: PenrosePoint, q: PenrosePoint, t: number): PenrosePoint {
  return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
}

export function subdivideTriangle(t: PenroseTriangle): PenroseTriangle[] {
  if (t.color === 0) {
    const p = lerpPoint(t.a, t.b, 1 / GOLDEN_RATIO);
    return [
      { color: 0, a: t.c, b: p, c: t.b },
      { color: 1, a: p, b: t.c, c: t.a },
    ];
  }

  const q = lerpPoint(t.b, t.a, 1 / GOLDEN_RATIO);
  const r = lerpPoint(t.b, t.c, 1 / GOLDEN_RATIO);
  return [
    { color: 1, a: r, b: t.c, c: t.a },
    { color: 1, a: q, b: r, c: t.b },
    { color: 0, a: r, b: q, c: t.a },
  ];
}

export function subdivide(triangles: PenroseTriangle[]): PenroseTriangle[] {
  const result: PenroseTriangle[] = [];
  for (const t of triangles) {
    result.push(...subdivideTriangle(t));
  }
  return result;
}

export function createSunTriangles(): PenroseTriangle[] {
  const triangles: PenroseTriangle[] = [];
  const center: PenrosePoint = { x: 0, y: 0 };

  for (let i = 0; i < 10; i++) {
    let b: PenrosePoint = {
      x: Math.cos(((2 * i - 1) * Math.PI) / 10),
      y: Math.sin(((2 * i - 1) * Math.PI) / 10),
    };
    let c: PenrosePoint = {
      x: Math.cos(((2 * i + 1) * Math.PI) / 10),
      y: Math.sin(((2 * i + 1) * Math.PI) / 10),
    };
    if (i % 2 === 0) {
      [b, c] = [c, b];
    }
    triangles.push({ color: 1, a: center, b, c });
  }

  return triangles;
}

export const MIN_PENROSE_DIVISIONS = 0;
export const MAX_PENROSE_DIVISIONS = 8;
export const DEFAULT_PENROSE_DIVISIONS = 5;

export function clampPenroseDivisions(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PENROSE_DIVISIONS;
  }
  return Math.min(
    MAX_PENROSE_DIVISIONS,
    Math.max(MIN_PENROSE_DIVISIONS, Math.round(value))
  );
}

export function generatePenroseTriangles(divisions: number): PenroseTriangle[] {
  let triangles = createSunTriangles();
  const clamped = clampPenroseDivisions(divisions);
  for (let i = 0; i < clamped; i++) {
    triangles = subdivide(triangles);
  }
  return triangles;
}

export function fitTrianglesToViewport(
  triangles: PenroseTriangle[],
  width: number,
  height: number,
  padding: number
): PenroseTriangle[] {
  if (triangles.length === 0) {
    return [];
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const t of triangles) {
    for (const p of [t.a, t.b, t.c]) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
  }

  const spanX = Math.max(maxX - minX, 1e-9);
  const spanY = Math.max(maxY - minY, 1e-9);
  const availableW = Math.max(width - padding * 2, 1);
  const availableH = Math.max(height - padding * 2, 1);
  const scale = Math.min(availableW / spanX, availableH / spanY);
  const offsetX = padding + (availableW - spanX * scale) / 2 - minX * scale;
  const offsetY = padding + (availableH - spanY * scale) / 2 - minY * scale;

  const transform = (p: PenrosePoint): PenrosePoint => ({
    x: p.x * scale + offsetX,
    y: p.y * scale + offsetY,
  });

  return triangles.map((t) => ({
    color: t.color,
    a: transform(t.a),
    b: transform(t.b),
    c: transform(t.c),
  }));
}
