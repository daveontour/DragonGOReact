export const MIN_PARTICLES = 200;
export const MAX_PARTICLES = 4000;
export const DEFAULT_PARTICLES = 1200;

export const MIN_NOISE_SCALE = 0.001;
export const MAX_NOISE_SCALE = 0.02;
export const DEFAULT_NOISE_SCALE = 0.004;

export const MIN_TURBULENCE = 1;
export const MAX_TURBULENCE = 6;
export const DEFAULT_TURBULENCE = 2;

export const MIN_SPEED = 0.5;
export const MAX_SPEED = 4;
export const DEFAULT_SPEED = 1.5;

export const MIN_DRIFT_SPEED = 0;
export const MAX_DRIFT_SPEED = 1;
export const DEFAULT_DRIFT_SPEED = 0.1;

export const MIN_TRAIL_ALPHA = 0.02;
export const MAX_TRAIL_ALPHA = 0.4;
export const DEFAULT_TRAIL_ALPHA = 0.12;

const DRIFT_RADIUS = 1000;
const MIN_PARTICLE_LIFE = 60;
const MAX_PARTICLE_LIFE = 240;

export type FlowFieldColorMode = "ink" | "angle-hue";

export interface FlowFieldParticle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  age: number;
  life: number;
  hue: number;
}

export interface FlowFieldState {
  particles: FlowFieldParticle[];
  perm: Uint8Array;
  time: number;
  width: number;
  height: number;
}

export interface FlowFieldParams {
  noiseScale: number;
  angleMultiplier: number;
  speed: number;
  driftSpeed: number;
}

export function clampParticleCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PARTICLES;
  }
  return Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, Math.round(value)));
}

export function clampNoiseScale(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_NOISE_SCALE;
  }
  return Math.min(MAX_NOISE_SCALE, Math.max(MIN_NOISE_SCALE, value));
}

export function clampTurbulence(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TURBULENCE;
  }
  return Math.min(MAX_TURBULENCE, Math.max(MIN_TURBULENCE, value));
}

export function clampSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SPEED;
  }
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, value));
}

export function clampDriftSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_DRIFT_SPEED;
  }
  return Math.min(MAX_DRIFT_SPEED, Math.max(MIN_DRIFT_SPEED, value));
}

export function clampTrailAlpha(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TRAIL_ALPHA;
  }
  return Math.min(MAX_TRAIL_ALPHA, Math.max(MIN_TRAIL_ALPHA, value));
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

/** Seeded Fisher-Yates shuffle of [0..255], duplicated to 512 entries so
 * lattice lookups never need to wrap the index (the standard Perlin trick). */
export function buildPermutationTable(seed: number): Uint8Array {
  const rng = createSeededRandom(seed);
  const table = new Uint8Array(512);
  const base = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    base[i] = i;
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = base[i];
    base[i] = base[j];
    base[j] = tmp;
  }
  for (let i = 0; i < 512; i++) {
    table[i] = base[i & 255];
  }
  return table;
}

export function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const GRADIENTS: Array<[number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];

export function grad2(hash: number, x: number, y: number): number {
  const [gx, gy] = GRADIENTS[hash & 7];
  return gx * x + gy * y;
}

/** Standard 2D Perlin gradient noise, roughly in [-1, 1]. */
export function perlin2D(x: number, y: number, perm: Uint8Array): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  const u = fade(xf);
  const v = fade(yf);

  const aa = perm[perm[xi] + yi];
  const ab = perm[perm[xi] + yi + 1];
  const ba = perm[perm[xi + 1] + yi];
  const bb = perm[perm[xi + 1] + yi + 1];

  const x1 = lerp(grad2(aa, xf, yf), grad2(ba, xf - 1, yf), u);
  const x2 = lerp(grad2(ab, xf, yf - 1), grad2(bb, xf - 1, yf - 1), u);

  return lerp(x1, x2, v);
}

/** Samples the noise field at a point that itself drifts along a circle in
 * noise-space over time, giving cheap pseudo-time-evolution without a third
 * noise dimension. */
export function flowAngle(
  x: number,
  y: number,
  time: number,
  params: FlowFieldParams,
  perm: Uint8Array
): number {
  const sampleX = x * params.noiseScale + Math.cos(time) * DRIFT_RADIUS * params.noiseScale;
  const sampleY = y * params.noiseScale + Math.sin(time) * DRIFT_RADIUS * params.noiseScale;
  const noiseValue = perlin2D(sampleX, sampleY, perm);
  return noiseValue * params.angleMultiplier * Math.PI;
}

export function spawnParticle(
  rng: () => number,
  width: number,
  height: number
): FlowFieldParticle {
  const x = rng() * width;
  const y = rng() * height;
  return {
    x,
    y,
    prevX: x,
    prevY: y,
    age: 0,
    life: MIN_PARTICLE_LIFE + rng() * (MAX_PARTICLE_LIFE - MIN_PARTICLE_LIFE),
    hue: rng() * 360,
  };
}

export function createFlowField(
  width: number,
  height: number,
  particleCount: number,
  seed: number
): FlowFieldState {
  const rng = createSeededRandom(seed);
  const particles: FlowFieldParticle[] = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push(spawnParticle(rng, width, height));
  }
  return {
    particles,
    perm: buildPermutationTable(seed),
    time: 0,
    width,
    height,
  };
}

export function stepFlowField(
  state: FlowFieldState,
  params: FlowFieldParams,
  dt: number
): void {
  const rng = createSeededRandom(Math.floor(state.time * 1000) + 1);

  for (const particle of state.particles) {
    particle.prevX = particle.x;
    particle.prevY = particle.y;

    const angle = flowAngle(particle.x, particle.y, state.time, params, state.perm);
    particle.x += Math.cos(angle) * params.speed * dt;
    particle.y += Math.sin(angle) * params.speed * dt;
    particle.age += dt;

    const outOfBounds =
      particle.x < 0 || particle.x > state.width || particle.y < 0 || particle.y > state.height;

    if (particle.age > particle.life || outOfBounds) {
      const respawned = spawnParticle(rng, state.width, state.height);
      particle.x = respawned.x;
      particle.y = respawned.y;
      particle.prevX = respawned.x;
      particle.prevY = respawned.y;
      particle.age = 0;
      particle.life = respawned.life;
      particle.hue = respawned.hue;
    }
  }

  state.time += dt * params.driftSpeed;
}

export function fillFlowFieldBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colorMode: FlowFieldColorMode
): void {
  ctx.globalAlpha = 1;
  ctx.fillStyle = colorMode === "ink" ? "#f4f1ea" : "#0a0d18";
  ctx.fillRect(0, 0, width, height);
}

/** Deliberately does not clear the canvas: each frame only strokes the new
 * particle-position segments at low alpha onto the existing content, so
 * trails accumulate into a painterly composition rather than redrawing from
 * scratch like the other animated visualizations. */
export function drawFlowFieldFrame(
  ctx: CanvasRenderingContext2D,
  state: FlowFieldState,
  colorMode: FlowFieldColorMode,
  trailAlpha: number
): void {
  ctx.globalAlpha = trailAlpha;
  ctx.lineWidth = 1;

  for (const particle of state.particles) {
    ctx.strokeStyle =
      colorMode === "ink" ? "#1a1a1a" : `hsl(${particle.hue}, 70%, 60%)`;
    ctx.beginPath();
    ctx.moveTo(particle.prevX, particle.prevY);
    ctx.lineTo(particle.x, particle.y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
