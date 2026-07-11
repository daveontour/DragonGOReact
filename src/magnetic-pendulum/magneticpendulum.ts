export interface Magnet {
  x: number;
  y: number;
  color: string;
}

export interface BobState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface PendulumParams {
  damping: number;
  springK: number;
  strength: number;
  height: number;
  dt: number;
}

export const MIN_DAMPING = 0.05;
export const MAX_DAMPING = 1.0;
export const DEFAULT_DAMPING = 0.25;

export const MIN_STRENGTH = 0.2;
export const MAX_STRENGTH = 5;
export const DEFAULT_STRENGTH = 1.2;

/** Fixed internal shaping constants, not user-tunable. */
export const PENDULUM_HEIGHT = 0.3;
export const SPRING_K = 1;
export const SIMULATION_DT = 0.02;

export const DEFAULT_MAGNET_COUNT = 3;

export const MAX_STEPS_PER_PIXEL = 600;
export const CONVERGE_POSITION_EPSILON = 0.06;
export const CONVERGE_VELOCITY_EPSILON = 0.05;

export const MIN_BASIN_RESOLUTION = 120;
export const DEFAULT_BASIN_RESOLUTION = 240;
export const MAX_BASIN_RESOLUTION = 480;

export const MAGNET_COLORS = ["#e6545a", "#4ac96e", "#5a8fd4", "#e6a844", "#b478e6"];

export function clampDamping(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_DAMPING;
  }
  return Math.min(MAX_DAMPING, Math.max(MIN_DAMPING, value));
}

export function clampStrength(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_STRENGTH;
  }
  return Math.min(MAX_STRENGTH, Math.max(MIN_STRENGTH, value));
}

export function clampMagnetCount(value: number): 3 | 4 | 5 {
  const rounded = Math.round(value);
  if (rounded <= 3) return 3;
  if (rounded >= 5) return 5;
  return 4;
}

export function defaultMagnets(count: 3 | 4 | 5): Magnet[] {
  const radius = 0.6;
  const magnets: Magnet[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    magnets.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      color: MAGNET_COLORS[i % MAGNET_COLORS.length],
    });
  }
  return magnets;
}

/** Standard simplified 2D model for this classic desktop toy: the bob's
 * horizontal position is a damped harmonic oscillator (spring pulling back
 * toward the rest position, standing in for gravity's restoring torque at
 * small swing angles) plus an inverse-cube attraction toward each magnet,
 * softened by a fixed height offset so the force stays finite exactly over
 * a magnet. Integrated with semi-implicit Euler, matching this repo's
 * n-body convention — this damped system doesn't need RK4's accuracy. */
export function stepMagneticPendulum(
  state: BobState,
  magnets: Magnet[],
  params: PendulumParams
): void {
  let ax = -params.damping * state.vx - params.springK * state.x;
  let ay = -params.damping * state.vy - params.springK * state.y;

  for (const magnet of magnets) {
    const dx = magnet.x - state.x;
    const dy = magnet.y - state.y;
    const r2 = dx * dx + dy * dy + params.height * params.height;
    const r3 = r2 * Math.sqrt(r2);
    ax += (params.strength * dx) / r3;
    ay += (params.strength * dy) / r3;
  }

  state.vx += ax * params.dt;
  state.vy += ay * params.dt;
  state.x += state.vx * params.dt;
  state.y += state.vy * params.dt;
}

/** Requires BOTH low speed and proximity to a magnet — checking position
 * alone would misreport a fast pass-by near a magnet as "converged". */
export function hasConverged(
  state: BobState,
  magnets: Magnet[],
  posEps: number,
  velEps: number
): number {
  const speed2 = state.vx * state.vx + state.vy * state.vy;
  if (speed2 > velEps * velEps) {
    return -1;
  }
  for (let i = 0; i < magnets.length; i++) {
    const dx = magnets[i].x - state.x;
    const dy = magnets[i].y - state.y;
    if (dx * dx + dy * dy < posEps * posEps) {
      return i;
    }
  }
  return -1;
}

/** Simulates a bob released from rest at (startX, startY) until it settles
 * near a magnet or the step budget runs out — at which point it falls back
 * to "nearest magnet by final position" so every pixel of a basin map
 * resolves to a real magnet index, never a sentinel. */
export function nearestMagnetAfterSettling(
  startX: number,
  startY: number,
  magnets: Magnet[],
  params: PendulumParams,
  maxSteps: number,
  posEps: number = CONVERGE_POSITION_EPSILON,
  velEps: number = CONVERGE_VELOCITY_EPSILON
): number {
  const state: BobState = { x: startX, y: startY, vx: 0, vy: 0 };
  for (let i = 0; i < maxSteps; i++) {
    stepMagneticPendulum(state, magnets, params);
    const converged = hasConverged(state, magnets, posEps, velEps);
    if (converged !== -1) {
      return converged;
    }
  }

  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < magnets.length; i++) {
    const dx = magnets[i].x - state.x;
    const dy = magnets[i].y - state.y;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function renderBasinMap(
  imageData: ImageData,
  magnets: Magnet[],
  params: PendulumParams,
  worldExtent: number,
  maxStepsPerPixel: number
): void {
  const { width, height, data } = imageData;
  const colors = magnets.map((m) => hexToRgb(m.color));

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const x = (px / width - 0.5) * 2 * worldExtent;
      const y = (0.5 - py / height) * 2 * worldExtent;
      const magnetIdx = nearestMagnetAfterSettling(x, y, magnets, params, maxStepsPerPixel);
      const [r, g, b] = colors[magnetIdx];
      const idx = (py * width + px) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
}

export function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bobState: BobState,
  trail: Array<{ x: number; y: number }>,
  magnets: Magnet[],
  scale: number
): void {
  const cx = width / 2;
  const cy = height / 2;

  for (const magnet of magnets) {
    const mx = cx + magnet.x * scale;
    const my = cy - magnet.y * scale;
    ctx.fillStyle = magnet.color;
    ctx.beginPath();
    ctx.arc(mx, my, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  if (trail.length > 1) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + trail[0].x * scale, cy - trail[0].y * scale);
    for (let i = 1; i < trail.length; i++) {
      ctx.lineTo(cx + trail[i].x * scale, cy - trail[i].y * scale);
    }
    ctx.stroke();
  }

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx + bobState.x * scale, cy - bobState.y * scale, 6, 0, Math.PI * 2);
  ctx.fill();
}
