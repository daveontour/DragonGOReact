export interface VoronoiPoint {
  x: number;
  y: number;
}

export const MIN_VORONOI_POINTS = 3;
export const MAX_VORONOI_POINTS = 48;
export const DEFAULT_VORONOI_POINTS = 16;

export function clampPointCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_VORONOI_POINTS;
  }
  return Math.min(
    MAX_VORONOI_POINTS,
    Math.max(MIN_VORONOI_POINTS, Math.round(value))
  );
}

export function generateRandomPoints(
  count: number,
  width: number,
  height: number
): VoronoiPoint[] {
  const points: VoronoiPoint[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.random() * width,
      y: Math.random() * height,
    });
  }
  return points;
}

export function nearestPointIndex(
  x: number,
  y: number,
  points: VoronoiPoint[]
): number {
  let best = 0;
  let bestDistSq = Infinity;
  for (let i = 0; i < points.length; i++) {
    const dx = points[i].x - x;
    const dy = points[i].y - y;
    const distSq = dx * dx + dy * dy;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      best = i;
    }
  }
  return best;
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

export function palette(count: number): Array<[number, number, number]> {
  const colors: Array<[number, number, number]> = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 360) / Math.max(count, 1);
    colors.push(hslToRgb(hue, 0.55, 0.42));
  }
  return colors;
}

export function renderVoronoi(
  imageData: ImageData,
  points: VoronoiPoint[],
  showEdges: boolean
): void {
  const { width, height, data } = imageData;
  const colors = palette(points.length);
  const indexBuffer = new Int32Array(width * height);

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const idx = nearestPointIndex(px, py, points);
      indexBuffer[py * width + px] = idx;
      const [r, g, b] = colors[idx] ?? [20, 20, 20];
      const offset = (py * width + px) * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = 255;
    }
  }

  if (showEdges) {
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const here = indexBuffer[py * width + px];
        const right = px + 1 < width ? indexBuffer[py * width + px + 1] : here;
        const down = py + 1 < height ? indexBuffer[(py + 1) * width + px] : here;
        if (here !== right || here !== down) {
          const offset = (py * width + px) * 4;
          data[offset] = 10;
          data[offset + 1] = 12;
          data[offset + 2] = 18;
        }
      }
    }
  }
}

export function lloydRelax(
  points: VoronoiPoint[],
  width: number,
  height: number,
  sampleStep = 4
): VoronoiPoint[] {
  const sumX = new Float64Array(points.length);
  const sumY = new Float64Array(points.length);
  const count = new Float64Array(points.length);

  for (let py = 0; py < height; py += sampleStep) {
    for (let px = 0; px < width; px += sampleStep) {
      const idx = nearestPointIndex(px, py, points);
      sumX[idx] += px;
      sumY[idx] += py;
      count[idx] += 1;
    }
  }

  return points.map((point, i) => {
    if (count[i] === 0) {
      return point;
    }
    return {
      x: sumX[i] / count[i],
      y: sumY[i] / count[i],
    };
  });
}
