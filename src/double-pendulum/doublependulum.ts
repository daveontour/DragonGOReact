export interface PendulumState {
  theta1: number;
  theta2: number;
  omega1: number;
  omega2: number;
}

export interface PendulumParams {
  m1: number;
  m2: number;
  L1: number;
  L2: number;
  g: number;
}

export const MIN_MASS = 0.2;
export const MAX_MASS = 5;
export const DEFAULT_MASS = 1;

export const MIN_LENGTH = 0.5;
export const MAX_LENGTH = 2.5;
export const DEFAULT_LENGTH = 1;

export const MIN_GRAVITY = 1;
export const MAX_GRAVITY = 30;
export const DEFAULT_GRAVITY = 9.81;

export const DEFAULT_THETA1_DEG = 120;
export const DEFAULT_THETA2_DEG = -10;

export const MIN_TIMESCALE = 0.1;
export const MAX_TIMESCALE = 3;
export const DEFAULT_TIMESCALE = 1;

export const MIN_TRAIL = 50;
export const MAX_TRAIL = 2000;
export const DEFAULT_TRAIL = 600;

export const PERTURBATION_EPSILON_RAD = 0.001;

/** Fixed RK4 sub-step, finer than n-body's 1/60 since this stiffer chaotic
 * ODE benefits from a smaller step; the component runs several sub-steps
 * per rendered frame, scaled by the timescale slider. */
export const BASE_TIME_STEP = 1 / 240;

export function clampMass(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MASS;
  }
  return Math.min(MAX_MASS, Math.max(MIN_MASS, value));
}

export function clampLength(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LENGTH;
  }
  return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, value));
}

export function clampGravity(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_GRAVITY;
  }
  return Math.min(MAX_GRAVITY, Math.max(MIN_GRAVITY, value));
}

export function clampAngleDeg(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(180, Math.max(-180, value));
}

export function clampTimescale(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TIMESCALE;
  }
  return Math.min(MAX_TIMESCALE, Math.max(MIN_TIMESCALE, value));
}

export function clampTrailLength(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TRAIL;
  }
  return Math.min(MAX_TRAIL, Math.max(MIN_TRAIL, Math.round(value)));
}

export interface PendulumDerivative {
  dtheta1: number;
  dtheta2: number;
  domega1: number;
  domega2: number;
}

/** Standard Lagrangian-derived double-pendulum equations of motion
 * (angles measured from the downward vertical, y increasing downward).
 * The primary correctness gate for this formula is NOT code review but
 * totalPendulumEnergy staying bounded over many RK4 steps — a sign error
 * here would still "look chaotic" while silently leaking or gaining
 * energy. */
export function pendulumDerivative(
  state: PendulumState,
  params: PendulumParams
): PendulumDerivative {
  const { theta1, theta2, omega1, omega2 } = state;
  const { m1, m2, L1, L2, g } = params;
  const delta = theta1 - theta2;
  const sinDelta = Math.sin(delta);
  const cosDelta = Math.cos(delta);
  const den = L1 * (2 * m1 + m2 - m2 * Math.cos(2 * delta));

  const domega1 =
    (-g * (2 * m1 + m2) * Math.sin(theta1) -
      m2 * g * Math.sin(theta1 - 2 * theta2) -
      2 * sinDelta * m2 * (omega2 * omega2 * L2 + omega1 * omega1 * L1 * cosDelta)) /
    den;

  const domega2 =
    (2 *
      sinDelta *
      (omega1 * omega1 * L1 * (m1 + m2) +
        g * (m1 + m2) * Math.cos(theta1) +
        omega2 * omega2 * L2 * m2 * cosDelta)) /
    ((L2 / L1) * den);

  return { dtheta1: omega1, dtheta2: omega2, domega1, domega2 };
}

export function rk4PendulumStep(
  state: PendulumState,
  params: PendulumParams,
  dt: number
): PendulumState {
  const k1 = pendulumDerivative(state, params);
  const s2: PendulumState = {
    theta1: state.theta1 + (k1.dtheta1 * dt) / 2,
    theta2: state.theta2 + (k1.dtheta2 * dt) / 2,
    omega1: state.omega1 + (k1.domega1 * dt) / 2,
    omega2: state.omega2 + (k1.domega2 * dt) / 2,
  };
  const k2 = pendulumDerivative(s2, params);
  const s3: PendulumState = {
    theta1: state.theta1 + (k2.dtheta1 * dt) / 2,
    theta2: state.theta2 + (k2.dtheta2 * dt) / 2,
    omega1: state.omega1 + (k2.domega1 * dt) / 2,
    omega2: state.omega2 + (k2.domega2 * dt) / 2,
  };
  const k3 = pendulumDerivative(s3, params);
  const s4: PendulumState = {
    theta1: state.theta1 + k3.dtheta1 * dt,
    theta2: state.theta2 + k3.dtheta2 * dt,
    omega1: state.omega1 + k3.domega1 * dt,
    omega2: state.omega2 + k3.domega2 * dt,
  };
  const k4 = pendulumDerivative(s4, params);

  return {
    theta1: state.theta1 + (dt / 6) * (k1.dtheta1 + 2 * k2.dtheta1 + 2 * k3.dtheta1 + k4.dtheta1),
    theta2: state.theta2 + (dt / 6) * (k1.dtheta2 + 2 * k2.dtheta2 + 2 * k3.dtheta2 + k4.dtheta2),
    omega1: state.omega1 + (dt / 6) * (k1.domega1 + 2 * k2.domega1 + 2 * k3.domega1 + k4.domega1),
    omega2: state.omega2 + (dt / 6) * (k1.domega2 + 2 * k2.domega2 + 2 * k3.domega2 + k4.domega2),
  };
}

export function runPendulumSteps(
  state: PendulumState,
  params: PendulumParams,
  dt: number,
  steps: number
): PendulumState {
  let next = state;
  for (let i = 0; i < steps; i++) {
    next = rk4PendulumStep(next, params, dt);
  }
  return next;
}

/** Total mechanical energy, y measured downward-positive from the pivot
 * (so PE is negative when hanging below the pivot, as expected). Used as
 * the primary automated check that the equations of motion above are
 * correctly signed: it must stay within a small band, not drift. */
export function totalPendulumEnergy(state: PendulumState, params: PendulumParams): number {
  const { theta1, theta2, omega1, omega2 } = state;
  const { m1, m2, L1, L2, g } = params;
  const delta = theta1 - theta2;

  const pe = -(m1 + m2) * g * L1 * Math.cos(theta1) - m2 * g * L2 * Math.cos(theta2);
  const ke =
    0.5 * m1 * L1 * L1 * omega1 * omega1 +
    0.5 *
      m2 *
      (L1 * L1 * omega1 * omega1 +
        L2 * L2 * omega2 * omega2 +
        2 * L1 * L2 * omega1 * omega2 * Math.cos(delta));

  return pe + ke;
}

export interface BobPositions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function bobPositions(state: PendulumState, params: PendulumParams): BobPositions {
  const x1 = params.L1 * Math.sin(state.theta1);
  const y1 = params.L1 * Math.cos(state.theta1);
  const x2 = x1 + params.L2 * Math.sin(state.theta2);
  const y2 = y1 + params.L2 * Math.cos(state.theta2);
  return { x1, y1, x2, y2 };
}

export function perturbState(state: PendulumState, epsilonRad: number): PendulumState {
  return { ...state, theta1: state.theta1 + epsilonRad };
}

export function drawDoublePendulum(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: PendulumState,
  params: PendulumParams,
  trail: Array<{ x: number; y: number }>,
  scale: number,
  bobColor: string
): void {
  const pivotX = width / 2;
  const pivotY = height * 0.2;
  const { x1, y1, x2, y2 } = bobPositions(state, params);
  const p1 = { x: pivotX + x1 * scale, y: pivotY + y1 * scale };
  const p2 = { x: pivotX + x2 * scale, y: pivotY + y2 * scale };

  if (trail.length > 1) {
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    for (let i = 1; i < trail.length; i++) {
      ctx.globalAlpha = (i / trail.length) * 0.55;
      ctx.strokeStyle = bobColor;
      ctx.beginPath();
      ctx.moveTo(pivotX + trail[i - 1].x * scale, pivotY + trail[i - 1].y * scale);
      ctx.lineTo(pivotX + trail[i].x * scale, pivotY + trail[i].y * scale);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  const bobRadius1 = Math.max(4, 5 * Math.sqrt(params.m1));
  const bobRadius2 = Math.max(4, 5 * Math.sqrt(params.m2));
  ctx.fillStyle = bobColor;
  ctx.beginPath();
  ctx.arc(p1.x, p1.y, bobRadius1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p2.x, p2.y, bobRadius2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPivot(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.2, 4, 0, Math.PI * 2);
  ctx.fill();
}
