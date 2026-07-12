export const MIN_MASS = 1;
export const MAX_MASS_A = 20;
export const MAX_MASS_B = 100_000;
export const DEFAULT_MASS_A = 4;
export const DEFAULT_MASS_B = 8;

export const MIN_VELOCITY = -0.45;
export const MAX_VELOCITY = 0.45;
export const DEFAULT_VELOCITY_A = 0.28;
export const DEFAULT_VELOCITY_B = -0.12;

export const MIN_TIME_SCALE = 0.25;
export const MAX_TIME_SCALE = 3;
export const DEFAULT_TIME_SCALE = 1;

export const MIN_BODY_RADIUS = 0.04;
export const MAX_BODY_RADIUS = 0.075;
export const LEFT_WALL_X = 0;

export interface CollisionBody {
  x: number;
  velocity: number;
  mass: number;
  radius: number;
  color: string;
}

export interface ElasticCollisionSimulation {
  bodyA: CollisionBody;
  bodyB: CollisionBody;
  time: number;
  bodyCollisions: number;
  wallBounces: number;
}

export interface ElasticCollisionConfig {
  massA: number;
  massB: number;
  velocityA: number;
  velocityB: number;
}

export function clampMassA(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_MASS;
  }
  return Math.min(MAX_MASS_A, Math.max(MIN_MASS, Math.round(value)));
}

export function clampMassB(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_MASS;
  }
  return Math.min(MAX_MASS_B, Math.max(MIN_MASS, Math.round(value)));
}

export function clampVelocity(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(MAX_VELOCITY, Math.max(MIN_VELOCITY, value));
}

export function clampTimeScale(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TIME_SCALE;
  }
  return Math.min(MAX_TIME_SCALE, Math.max(MIN_TIME_SCALE, value));
}

export function bodyRadiusForMass(mass: number): number {
  const normalized =
    Math.log10(clampMassB(mass)) / Math.log10(MAX_MASS_B);
  return MIN_BODY_RADIUS + normalized * (MAX_BODY_RADIUS - MIN_BODY_RADIUS);
}

export function elasticCollisionVelocities(
  massA: number,
  velocityA: number,
  massB: number,
  velocityB: number
): [number, number] {
  const totalMass = massA + massB;
  return [
    ((massA - massB) * velocityA + 2 * massB * velocityB) / totalMass,
    ((massB - massA) * velocityB + 2 * massA * velocityA) / totalMass,
  ];
}

export function createElasticCollisionSimulation(
  config: ElasticCollisionConfig
): ElasticCollisionSimulation {
  const massA = clampMassA(config.massA);
  const massB = clampMassB(config.massB);
  return {
    bodyA: {
      x: 0.3,
      velocity: clampVelocity(config.velocityA),
      mass: massA,
      radius: bodyRadiusForMass(massA),
      color: "#6bdcaa",
    },
    bodyB: {
      x: 0.72,
      velocity: clampVelocity(config.velocityB),
      mass: massB,
      radius: bodyRadiusForMass(massB),
      color: "#f0ad5f",
    },
    time: 0,
    bodyCollisions: 0,
    wallBounces: 0,
  };
}

function bounceFromWall(
  body: CollisionBody,
  simulation: ElasticCollisionSimulation
): void {
  if (body.x - body.radius < LEFT_WALL_X && body.velocity < 0) {
    body.x = LEFT_WALL_X + body.radius;
    body.velocity = -body.velocity;
    simulation.wallBounces++;
  }
}

function resolveBodyCollision(simulation: ElasticCollisionSimulation): void {
  const { bodyA, bodyB } = simulation;
  const left = bodyA.x <= bodyB.x ? bodyA : bodyB;
  const right = left === bodyA ? bodyB : bodyA;
  const overlap = left.x + left.radius - (right.x - right.radius);

  if (overlap < 0 || left.velocity <= right.velocity) {
    return;
  }

  const [leftVelocity, rightVelocity] = elasticCollisionVelocities(
    left.mass,
    left.velocity,
    right.mass,
    right.velocity
  );
  left.velocity = leftVelocity;
  right.velocity = rightVelocity;

  const totalMass = left.mass + right.mass;
  left.x -= overlap * (right.mass / totalMass);
  right.x += overlap * (left.mass / totalMass);
  simulation.bodyCollisions++;
}

export function stepElasticCollision(
  simulation: ElasticCollisionSimulation,
  dt: number
): void {
  if (!Number.isFinite(dt) || dt <= 0) {
    return;
  }

  const maxStep = 1 / 240;
  const steps = Math.max(1, Math.ceil(dt / maxStep));
  const substep = dt / steps;

  for (let i = 0; i < steps; i++) {
    simulation.bodyA.x += simulation.bodyA.velocity * substep;
    simulation.bodyB.x += simulation.bodyB.velocity * substep;
    bounceFromWall(simulation.bodyA, simulation);
    bounceFromWall(simulation.bodyB, simulation);
    resolveBodyCollision(simulation);
  }
  simulation.time += dt;
}

export function totalMomentum(simulation: ElasticCollisionSimulation): number {
  return (
    simulation.bodyA.mass * simulation.bodyA.velocity +
    simulation.bodyB.mass * simulation.bodyB.velocity
  );
}

export function totalKineticEnergy(
  simulation: ElasticCollisionSimulation
): number {
  return (
    0.5 *
      simulation.bodyA.mass *
      simulation.bodyA.velocity *
      simulation.bodyA.velocity +
    0.5 *
      simulation.bodyB.mass *
      simulation.bodyB.velocity *
      simulation.bodyB.velocity
  );
}
