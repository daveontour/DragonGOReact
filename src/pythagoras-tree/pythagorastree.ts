export interface Point {
  x: number;
  y: number;
}

export type TreeBranch = "root" | "left" | "right";

export interface TreeSquare {
  corners: [Point, Point, Point, Point];
  depth: number;
  branch: TreeBranch;
}

export type PythagorasColorMode = "by-depth" | "by-branch-side" | "mono";

export const MIN_DEPTH = 1;
export const MAX_DEPTH = 14;
export const DEFAULT_DEPTH = 10;

export const MIN_ANGLE_DEG = 10;
export const MAX_ANGLE_DEG = 80;
export const DEFAULT_ANGLE_DEG = 45;

export function clampPythagorasDepth(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_DEPTH;
  }
  return Math.min(MAX_DEPTH, Math.max(MIN_DEPTH, Math.round(value)));
}

export function clampPythagorasAngle(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ANGLE_DEG;
  }
  return Math.min(MAX_ANGLE_DEG, Math.max(MIN_ANGLE_DEG, value));
}

export function rotate(v: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

function vecLength(v: Point): number {
  return Math.hypot(v.x, v.y);
}

function normalize(v: Point): Point {
  const len = vecLength(v) || 1;
  return { x: v.x / len, y: v.y / len };
}

/** Builds the square standing on growth edge p1->p2, with the square's
 * body on the "-90 degree rotation of the edge" side. Every recursive call
 * uses this exact same rotation, which is what keeps the tree from
 * mirroring itself generation to generation. */
export function squareFromEdge(p1: Point, p2: Point): [Point, Point, Point, Point] {
  const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
  const perpIn = rotate(edge, -Math.PI / 2);
  const p3 = { x: p2.x + perpIn.x, y: p2.y + perpIn.y };
  const p4 = { x: p1.x + perpIn.x, y: p1.y + perpIn.y };
  return [p1, p2, p3, p4];
}

export function colorForDepth(depth: number, maxDepth: number): string {
  const t = maxDepth > 0 ? depth / maxDepth : 0;
  const hue = 130 - t * 90; // green (130) sweeping toward gold/orange (40)
  const lightness = 32 + t * 30;
  return `hsl(${hue.toFixed(1)}, 55%, ${lightness.toFixed(1)}%)`;
}

export function colorForBranch(branch: TreeBranch): string {
  if (branch === "left") {
    return "hsl(160, 55%, 45%)";
  }
  if (branch === "right") {
    return "hsl(35, 65%, 55%)";
  }
  return "hsl(210, 20%, 60%)";
}

interface GrowthEdge {
  p1: Point;
  p2: Point;
  depth: number;
  branch: TreeBranch;
}

/** Recurses generation by generation (breadth-first), so the returned
 * array is naturally ordered by depth — used directly for a
 * generation-by-generation "animate growth" reveal without any sorting. */
export function buildPythagorasTree(
  rootP1: Point,
  rootP2: Point,
  maxDepth: number,
  angleRad: number
): TreeSquare[] {
  const squares: TreeSquare[] = [];
  let frontier: GrowthEdge[] = [{ p1: rootP1, p2: rootP2, depth: 0, branch: "root" }];

  const cosT = Math.cos(angleRad);
  const sinT = Math.sin(angleRad);

  while (frontier.length > 0) {
    const next: GrowthEdge[] = [];
    for (const edge of frontier) {
      squares.push({
        corners: squareFromEdge(edge.p1, edge.p2),
        depth: edge.depth,
        branch: edge.branch,
      });

      if (edge.depth >= maxDepth) {
        continue;
      }

      const dirVec = { x: edge.p2.x - edge.p1.x, y: edge.p2.y - edge.p1.y };
      const length = vecLength(dirVec);
      const dir = normalize(dirVec);
      const perpOut = rotate(dir, Math.PI / 2);

      const apex: Point = {
        x: edge.p1.x + dir.x * length * cosT * cosT + perpOut.x * length * sinT * cosT,
        y: edge.p1.y + dir.y * length * cosT * cosT + perpOut.y * length * sinT * cosT,
      };

      const leftBranch: TreeBranch = edge.branch === "root" ? "left" : edge.branch;
      const rightBranch: TreeBranch = edge.branch === "root" ? "right" : edge.branch;
      next.push({ p1: edge.p1, p2: apex, depth: edge.depth + 1, branch: leftBranch });
      next.push({ p1: apex, p2: edge.p2, depth: edge.depth + 1, branch: rightBranch });
    }
    frontier = next;
  }

  return squares;
}

export interface PythagorasBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function boundsForSquares(squares: TreeSquare[]): PythagorasBounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const square of squares) {
    for (const corner of square.corners) {
      if (corner.x < minX) minX = corner.x;
      if (corner.x > maxX) maxX = corner.x;
      if (corner.y < minY) minY = corner.y;
      if (corner.y > maxY) maxY = corner.y;
    }
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  }
  return { minX, maxX, minY, maxY };
}

/** Squares are generated in a fixed local coordinate space (independent of
 * canvas size), so drawing projects each corner through a scale + center
 * offset computed from the tree's own bounding box — the same
 * "compute a maxExtent, then scale/center around it" pattern used by the
 * curve-based visualizations (spirograph, superformula, etc.), which keeps
 * the whole tree in view regardless of depth or branch angle. */
export function drawPythagorasTree(
  ctx: CanvasRenderingContext2D,
  size: number,
  squares: TreeSquare[],
  colorMode: PythagorasColorMode,
  maxDepth: number,
  scale: number,
  centerX: number,
  centerY: number,
  revealCount: number = squares.length
): void {
  ctx.fillStyle = "#0a0d18";
  ctx.fillRect(0, 0, size, size);

  const count = Math.max(0, Math.min(revealCount, squares.length));
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(10, 13, 24, 0.5)";

  const project = (p: Point): Point => ({
    x: size / 2 + (p.x - centerX) * scale,
    y: size / 2 + (p.y - centerY) * scale,
  });

  for (let i = 0; i < count; i++) {
    const square = squares[i];
    ctx.fillStyle =
      colorMode === "mono"
        ? "hsl(140, 40%, 45%)"
        : colorMode === "by-branch-side"
          ? colorForBranch(square.branch)
          : colorForDepth(square.depth, maxDepth);

    const pts = square.corners.map(project);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let c = 1; c < 4; c++) {
      ctx.lineTo(pts[c].x, pts[c].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
