export interface TriplePendulumState {
  theta: [number, number, number];
  omega: [number, number, number];
}

export interface TriplePendulumParams {
  m: [number, number, number];
  L: [number, number, number];
  g: number;
}

export const MIN_MASS = 0.2;
export const MAX_MASS = 5;
export const DEFAULT_MASS = 1;

export const MIN_LENGTH = 0.4;
export const MAX_LENGTH = 2;
export const DEFAULT_LENGTH = 0.8;

export const MIN_GRAVITY = 1;
export const MAX_GRAVITY = 30;
export const DEFAULT_GRAVITY = 9.81;

export const DEFAULT_THETA1_DEG = 130;
export const DEFAULT_THETA2_DEG = -20;
export const DEFAULT_THETA3_DEG = 30;

export const MIN_TIMESCALE = 0.1;
export const MAX_TIMESCALE = 3;
export const DEFAULT_TIMESCALE = 1;

export const MIN_TRAIL = 50;
export const MAX_TRAIL = 2000;
export const DEFAULT_TRAIL = 700;

export const PERTURBATION_EPSILON_RAD = 0.001;

/** Finer than the double pendulum's already-fine 1/240: a third coupled
 * link makes the system stiffer still. */
export const BASE_TIME_STEP = 1 / 360;

export function clampMass(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MASS;
  return Math.min(MAX_MASS, Math.max(MIN_MASS, value));
}

export function clampLength(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_LENGTH;
  return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, value));
}

export function clampGravity(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_GRAVITY;
  return Math.min(MAX_GRAVITY, Math.max(MIN_GRAVITY, value));
}

export function clampAngleDeg(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(180, Math.max(-180, value));
}

export function clampTimescale(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_TIMESCALE;
  return Math.min(MAX_TIMESCALE, Math.max(MIN_TIMESCALE, value));
}

export function clampTrailLength(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_TRAIL;
  return Math.min(MAX_TRAIL, Math.max(MIN_TRAIL, Math.round(value)));
}

function det3(m: number[][]): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

/** Solves the 3x3 linear system M*x = f via Cramer's rule — small and
 * well-conditioned enough here (pendulum-chain mass matrices are always
 * positive definite away from degenerate zero-length/zero-mass inputs)
 * that a direct determinant solve is simpler and just as robust as
 * Gaussian elimination for this fixed size. */
function solveLinear3(M: number[][], f: number[]): [number, number, number] {
  const D = det3(M);
  const result: number[] = [];
  for (let col = 0; col < 3; col++) {
    const Mi = M.map((row) => row.slice());
    for (let row = 0; row < 3; row++) {
      Mi[row][col] = f[row];
    }
    result.push(det3(Mi) / D);
  }
  return result as [number, number, number];
}

export interface TripleDerivative {
  dtheta: [number, number, number];
  domega: [number, number, number];
}

/** General n-link pendulum-chain Lagrangian equations of motion,
 * specialized to n=3, derived directly from the kinetic energy's quadratic
 * form rather than a hand-typed closed form (a 3-link closed form has no
 * clean expression the way the 2-link case does). For indices i,j and
 * S_ij = sum of masses from index max(i,j) to the last link:
 *   mass matrix   M_ij = L_i L_j cos(theta_i - theta_j) S_ij
 *   forcing       f_i  = -sum_{j!=i} L_i L_j S_ij sin(theta_i-theta_j) omega_j^2
 *                        - g L_i S_ii sin(theta_i)
 *   solve         M * theta'' = f
 * This reduces to the standard closed-form double-pendulum equations when
 * the third mass -> 0 (verified by the cross-check test against the
 * independently-implemented double-pendulum module), and its own
 * correctness gate — as with the double pendulum — is that total energy
 * stays bounded over many RK4 steps, not code review alone. */
export function tripleDerivative(
  state: TriplePendulumState,
  params: TriplePendulumParams
): TripleDerivative {
  const { theta, omega } = state;
  const { m, L, g } = params;

  const S: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let sum = 0;
      for (let k = Math.max(i, j); k < 3; k++) {
        sum += m[k];
      }
      S[i][j] = sum;
    }
  }

  const M: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      M[i][j] = L[i] * L[j] * Math.cos(theta[i] - theta[j]) * S[i][j];
    }
  }

  const f: number[] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    let sum = 0;
    for (let j = 0; j < 3; j++) {
      if (j === i) continue;
      sum += L[i] * L[j] * S[i][j] * Math.sin(theta[i] - theta[j]) * omega[j] * omega[j];
    }
    f[i] = -sum - g * L[i] * S[i][i] * Math.sin(theta[i]);
  }

  const domega = solveLinear3(M, f);
  return { dtheta: [omega[0], omega[1], omega[2]], domega };
}

function addScaled(
  a: TriplePendulumState,
  d: TripleDerivative,
  scale: number
): TriplePendulumState {
  return {
    theta: [
      a.theta[0] + d.dtheta[0] * scale,
      a.theta[1] + d.dtheta[1] * scale,
      a.theta[2] + d.dtheta[2] * scale,
    ],
    omega: [
      a.omega[0] + d.domega[0] * scale,
      a.omega[1] + d.domega[1] * scale,
      a.omega[2] + d.domega[2] * scale,
    ],
  };
}

export function rk4TripleStep(
  state: TriplePendulumState,
  params: TriplePendulumParams,
  dt: number
): TriplePendulumState {
  const k1 = tripleDerivative(state, params);
  const s2 = addScaled(state, k1, dt / 2);
  const k2 = tripleDerivative(s2, params);
  const s3 = addScaled(state, k2, dt / 2);
  const k3 = tripleDerivative(s3, params);
  const s4 = addScaled(state, k3, dt);
  const k4 = tripleDerivative(s4, params);

  const theta: [number, number, number] = [0, 0, 0];
  const omega: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    theta[i] =
      state.theta[i] +
      (dt / 6) * (k1.dtheta[i] + 2 * k2.dtheta[i] + 2 * k3.dtheta[i] + k4.dtheta[i]);
    omega[i] =
      state.omega[i] +
      (dt / 6) * (k1.domega[i] + 2 * k2.domega[i] + 2 * k3.domega[i] + k4.domega[i]);
  }
  return { theta, omega };
}

export function runTripleSteps(
  state: TriplePendulumState,
  params: TriplePendulumParams,
  dt: number,
  steps: number
): TriplePendulumState {
  let next = state;
  for (let i = 0; i < steps; i++) {
    next = rk4TripleStep(next, params, dt);
  }
  return next;
}

/** Total mechanical energy: KE = 0.5*omega^T*M*omega using the same mass
 * matrix as the derivative, PE = -g*sum(L_j*cos(theta_j)*S_jj) (downward
 * positive y, matching the double pendulum's sign convention). */
export function totalTripleEnergy(state: TriplePendulumState, params: TriplePendulumParams): number {
  const { theta, omega } = state;
  const { m, L, g } = params;

  const S: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let sum = 0;
      for (let k = Math.max(i, j); k < 3; k++) {
        sum += m[k];
      }
      S[i][j] = sum;
    }
  }

  let ke = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const Mij = L[i] * L[j] * Math.cos(theta[i] - theta[j]) * S[i][j];
      ke += 0.5 * Mij * omega[i] * omega[j];
    }
  }

  let pe = 0;
  for (let j = 0; j < 3; j++) {
    pe += -g * L[j] * Math.cos(theta[j]) * S[j][j];
  }

  return ke + pe;
}

export interface TripleBobPositions {
  x: [number, number, number];
  y: [number, number, number];
}

export function tripleBobPositions(
  state: TriplePendulumState,
  params: TriplePendulumParams
): TripleBobPositions {
  const x: [number, number, number] = [0, 0, 0];
  const y: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const prevX = i === 0 ? 0 : x[i - 1];
    const prevY = i === 0 ? 0 : y[i - 1];
    x[i] = prevX + params.L[i] * Math.sin(state.theta[i]);
    y[i] = prevY + params.L[i] * Math.cos(state.theta[i]);
  }
  return { x, y };
}

export function perturbTripleState(
  state: TriplePendulumState,
  epsilonRad: number
): TriplePendulumState {
  return {
    theta: [state.theta[0] + epsilonRad, state.theta[1], state.theta[2]],
    omega: [...state.omega],
  };
}

export function drawTriplePendulum(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: TriplePendulumState,
  params: TriplePendulumParams,
  trail: Array<{ x: number; y: number }>,
  scale: number,
  bobColor: string
): void {
  const pivotX = width / 2;
  const pivotY = height * 0.16;
  const { x, y } = tripleBobPositions(state, params);
  const points = [
    { x: pivotX, y: pivotY },
    { x: pivotX + x[0] * scale, y: pivotY + y[0] * scale },
    { x: pivotX + x[1] * scale, y: pivotY + y[1] * scale },
    { x: pivotX + x[2] * scale, y: pivotY + y[2] * scale },
  ];

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
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  ctx.fillStyle = bobColor;
  const masses = [params.m[0], params.m[1], params.m[2]];
  for (let i = 0; i < 3; i++) {
    const radius = Math.max(4, 4.5 * Math.sqrt(masses[i]));
    ctx.beginPath();
    ctx.arc(points[i + 1].x, points[i + 1].y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawTriplePivot(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.16, 4, 0, Math.PI * 2);
  ctx.fill();
}
