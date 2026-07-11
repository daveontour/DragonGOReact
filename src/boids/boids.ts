export interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface BoidParams {
  perceptionRadius: number;
  maxSpeed: number;
  maxForce: number;
  separationWeight: number;
  alignmentWeight: number;
  cohesionWeight: number;
  predator: { x: number; y: number } | null;
}

export const MIN_BOID_COUNT = 20;
export const MAX_BOID_COUNT = 400;
export const DEFAULT_BOID_COUNT = 150;

export const MIN_PERCEPTION_RADIUS = 20;
export const MAX_PERCEPTION_RADIUS = 150;
export const DEFAULT_PERCEPTION_RADIUS = 60;

/** Separation only reacts to neighbors within perceptionRadius*this factor. */
export const SEPARATION_RADIUS_FACTOR = 0.5;

export const MIN_MAX_SPEED = 1;
export const MAX_MAX_SPEED = 8;
export const DEFAULT_MAX_SPEED = 3.5;

export const MIN_MAX_FORCE = 0.01;
export const MAX_MAX_FORCE = 0.5;
export const DEFAULT_MAX_FORCE = 0.15;

export const MIN_WEIGHT = 0;
export const MAX_WEIGHT = 3;
export const DEFAULT_SEPARATION_WEIGHT = 1.5;
export const DEFAULT_ALIGNMENT_WEIGHT = 1.0;
export const DEFAULT_COHESION_WEIGHT = 1.0;

export const PREDATOR_AVOID_RADIUS = 90;
export const PREDATOR_WEIGHT = 4;

export function clampBoidCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_BOID_COUNT;
  }
  return Math.min(MAX_BOID_COUNT, Math.max(MIN_BOID_COUNT, Math.round(value)));
}

export function clampPerceptionRadius(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PERCEPTION_RADIUS;
  }
  return Math.min(MAX_PERCEPTION_RADIUS, Math.max(MIN_PERCEPTION_RADIUS, value));
}

export function clampMaxSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MAX_SPEED;
  }
  return Math.min(MAX_MAX_SPEED, Math.max(MIN_MAX_SPEED, value));
}

export function clampMaxForce(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MAX_FORCE;
  }
  return Math.min(MAX_MAX_FORCE, Math.max(MIN_MAX_FORCE, value));
}

export function clampWeight(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, value));
}

export function createSeededRandom(seed: number): () => number {
  let state = (Math.abs(Math.trunc(seed)) || 1) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRandomBoids(count: number, width: number, height: number, seed: number): Boid[] {
  const rng = createSeededRandom(seed);
  const boids: Boid[] = [];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    boids.push({
      x: rng() * width,
      y: rng() * height,
      vx: Math.cos(angle) * DEFAULT_MAX_SPEED * 0.5,
      vy: Math.sin(angle) * DEFAULT_MAX_SPEED * 0.5,
    });
  }
  return boids;
}

function limit(vx: number, vy: number, max: number): [number, number] {
  const m = Math.hypot(vx, vy);
  return m > max ? [(vx / m) * max, (vy / m) * max] : [vx, vy];
}

function steerToward(
  boid: Boid,
  desiredVx: number,
  desiredVy: number,
  maxSpeed: number,
  maxForce: number
): [number, number] {
  const m = Math.hypot(desiredVx, desiredVy);
  if (m === 0) {
    return [0, 0];
  }
  const dvx = (desiredVx / m) * maxSpeed;
  const dvy = (desiredVy / m) * maxSpeed;
  return limit(dvx - boid.vx, dvy - boid.vy, maxForce);
}

/** One tick of Reynolds' 1986 boids model: separation, alignment, and
 * cohesion, each computed only over neighbors within perceptionRadius.
 * Accelerations are computed into a scratch array first and applied only
 * after every boid has been evaluated, so no boid's steering depends on
 * another boid's already-updated velocity within the same tick — avoiding
 * an order-dependent bias that mutating in place would introduce.
 * Wrap-around (torus) edges: note the naive distance check below does not
 * perceive neighbors across the wrap boundary (a boid near x=0 won't see
 * one near x=width) — an accepted simplification for a demo-scale O(n^2)
 * boids viz, not a bug. */
export function stepBoids(boids: Boid[], params: BoidParams, width: number, height: number): void {
  const sepRadius = params.perceptionRadius * SEPARATION_RADIUS_FACTOR;
  const accelerations: Array<[number, number]> = new Array(boids.length);

  for (let i = 0; i < boids.length; i++) {
    const boid = boids[i];
    let sepX = 0;
    let sepY = 0;
    let aliVx = 0;
    let aliVy = 0;
    let aliCount = 0;
    let cohX = 0;
    let cohY = 0;
    let cohCount = 0;

    for (let j = 0; j < boids.length; j++) {
      if (j === i) {
        continue;
      }
      const other = boids[j];
      const dx = boid.x - other.x;
      const dy = boid.y - other.y;
      const d = Math.hypot(dx, dy);
      if (d === 0 || d > params.perceptionRadius) {
        continue;
      }
      if (d < sepRadius) {
        sepX += dx / (d * d);
        sepY += dy / (d * d);
      }
      aliVx += other.vx;
      aliVy += other.vy;
      aliCount++;
      cohX += other.x;
      cohY += other.y;
      cohCount++;
    }

    const [sepAx, sepAy] = steerToward(boid, sepX, sepY, params.maxSpeed, params.maxForce);
    const [aliAx, aliAy] =
      aliCount > 0 ? steerToward(boid, aliVx / aliCount, aliVy / aliCount, params.maxSpeed, params.maxForce) : [0, 0];
    const [cohAx, cohAy] =
      cohCount > 0
        ? steerToward(boid, cohX / cohCount - boid.x, cohY / cohCount - boid.y, params.maxSpeed, params.maxForce)
        : [0, 0];

    let ax = sepAx * params.separationWeight + aliAx * params.alignmentWeight + cohAx * params.cohesionWeight;
    let ay = sepAy * params.separationWeight + aliAy * params.alignmentWeight + cohAy * params.cohesionWeight;

    if (params.predator) {
      const dx = boid.x - params.predator.x;
      const dy = boid.y - params.predator.y;
      const d = Math.hypot(dx, dy);
      if (d < PREDATOR_AVOID_RADIUS && d > 0) {
        const [fx, fy] = steerToward(boid, dx / d, dy / d, params.maxSpeed, params.maxForce);
        ax += fx * PREDATOR_WEIGHT;
        ay += fy * PREDATOR_WEIGHT;
      }
    }

    accelerations[i] = [ax, ay];
  }

  for (let i = 0; i < boids.length; i++) {
    const boid = boids[i];
    boid.vx += accelerations[i][0];
    boid.vy += accelerations[i][1];
    [boid.vx, boid.vy] = limit(boid.vx, boid.vy, params.maxSpeed);
    boid.x = ((boid.x + boid.vx) % width + width) % width;
    boid.y = ((boid.y + boid.vy) % height + height) % height;
  }
}

export function drawBoids(ctx: CanvasRenderingContext2D, width: number, height: number, boids: Boid[]): void {
  ctx.fillStyle = "#0a0d18";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#7fd4ff";
  for (const boid of boids) {
    const angle = Math.atan2(boid.vy, boid.vx);
    const size = 6;
    ctx.save();
    ctx.translate(boid.x, boid.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, size * 0.5);
    ctx.lineTo(-size * 0.4, 0);
    ctx.lineTo(-size * 0.7, -size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
