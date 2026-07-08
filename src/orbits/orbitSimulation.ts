export const G = 1;
export const SUN_MASS = 12000;
export const PLANET_MASS = 18;
export const SPACECRAFT_MASS = 0.01;
export const THRUST_ACCELERATION = 3.5;
export const SOFTENING = 8;

export const MIN_ORBIT_RADIUS = 80;
export const MAX_ORBIT_RADIUS = 220;
export const DEFAULT_PLANET1_RADIUS = 140;
export const DEFAULT_PLANET2_RADIUS = 180;
export const MIN_ECCENTRICITY = 0;
export const MAX_ECCENTRICITY = 0.85;
export const DEFAULT_PLANET1_ECCENTRICITY = 0.2;
export const DEFAULT_PLANET2_ECCENTRICITY = 0.35;
export const MIN_SPACECRAFT_ORBIT = 18;
export const MAX_SPACECRAFT_ORBIT = 60;
export const DEFAULT_SPACECRAFT_ORBIT = 28;
export const MIN_TIMESCALE = 0.1;
export const MAX_TIMESCALE = 5;
export const DEFAULT_TIMESCALE = 1;

export type ThrustMode = "none" | "prograde" | "retrograde";

export interface PlanetOrbitConfig {
  semiMajorAxis: number;
  eccentricity: number;
}

export interface SimBody {
  id: "sun" | "planet1" | "planet2" | "spacecraft";
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
  fixed?: boolean;
}

export interface OrbitParams {
  planet1: PlanetOrbitConfig;
  planet2: PlanetOrbitConfig;
  spacecraftOrbitRadius: number;
}

export interface OrbitSimulation {
  bodies: SimBody[];
  params: OrbitParams;
  time: number;
}

export function clampOrbitRadius(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PLANET1_RADIUS;
  }
  return Math.min(MAX_ORBIT_RADIUS, Math.max(MIN_ORBIT_RADIUS, value));
}

export function clampEccentricity(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PLANET1_ECCENTRICITY;
  }
  return Math.min(MAX_ECCENTRICITY, Math.max(MIN_ECCENTRICITY, value));
}

export function clampSpacecraftOrbit(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SPACECRAFT_ORBIT;
  }
  return Math.min(MAX_SPACECRAFT_ORBIT, Math.max(MIN_SPACECRAFT_ORBIT, value));
}

export function clampTimescale(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TIMESCALE;
  }
  return Math.min(MAX_TIMESCALE, Math.max(MIN_TIMESCALE, value));
}

export function visVivaSpeed(
  centralMass: number,
  radius: number,
  semiMajorAxis: number
): number {
  return Math.sqrt(Math.max(G * centralMass * (2 / radius - 1 / semiMajorAxis), 0));
}

export function circularOrbitSpeed(centralMass: number, radius: number): number {
  return Math.sqrt((G * centralMass) / radius);
}

function normalizePlanetConfig(config: PlanetOrbitConfig): PlanetOrbitConfig {
  return {
    semiMajorAxis: clampOrbitRadius(config.semiMajorAxis),
    eccentricity: clampEccentricity(config.eccentricity),
  };
}

function createPlanetAtPeriapsis(
  id: "planet1" | "planet2",
  config: PlanetOrbitConfig,
  sign: 1 | -1,
  color: string
): SimBody {
  const { semiMajorAxis, eccentricity } = normalizePlanetConfig(config);
  const periapsis = semiMajorAxis * (1 - eccentricity);
  const speed = visVivaSpeed(SUN_MASS, periapsis, semiMajorAxis);

  return {
    id,
    x: sign * periapsis,
    y: 0,
    vx: 0,
    vy: sign * speed,
    mass: PLANET_MASS,
    radius: 10,
    color,
  };
}

export function createOrbitSimulation(params: OrbitParams): OrbitSimulation {
  const planet1Config = normalizePlanetConfig(params.planet1);
  const planet2Config = normalizePlanetConfig(params.planet2);
  const scRadius = clampSpacecraftOrbit(params.spacecraftOrbitRadius);
  const planetOrbitSpeed = circularOrbitSpeed(PLANET_MASS, scRadius);

  const planet1 = createPlanetAtPeriapsis(
    "planet1",
    planet1Config,
    1,
    "#7090b7"
  );
  const planet2 = createPlanetAtPeriapsis(
    "planet2",
    planet2Config,
    -1,
    "#7dcea0"
  );

  const spacecraft: SimBody = {
    id: "spacecraft",
    x: planet1.x + scRadius,
    y: planet1.y,
    vx: planet1.vx,
    vy: planet1.vy + planetOrbitSpeed,
    mass: SPACECRAFT_MASS,
    radius: 4,
    color: "#f6d860",
  };

  const sun: SimBody = {
    id: "sun",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    mass: SUN_MASS,
    radius: 22,
    color: "#f6d860",
    fixed: true,
  };

  return {
    bodies: [sun, planet1, planet2, spacecraft],
    params: {
      planet1: planet1Config,
      planet2: planet2Config,
      spacecraftOrbitRadius: scRadius,
    },
    time: 0,
  };
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

function acceleration(body: SimBody, bodies: SimBody[]): { ax: number; ay: number } {
  let ax = 0;
  let ay = 0;

  for (const other of bodies) {
    if (other.id === body.id) {
      continue;
    }

    const dx = other.x - body.x;
    const dy = other.y - body.y;
    const distSq = dx * dx + dy * dy + SOFTENING * SOFTENING;
    const dist = Math.sqrt(distSq);
    const accel = (G * other.mass) / distSq;

    ax += (accel * dx) / dist;
    ay += (accel * dy) / dist;
  }

  return { ax, ay };
}

function applyThrust(body: SimBody, thrust: ThrustMode): { ax: number; ay: number } {
  if (thrust === "none") {
    return { ax: 0, ay: 0 };
  }

  const speed = Math.hypot(body.vx, body.vy);
  if (speed <= 1e-6) {
    return { ax: 0, ay: 0 };
  }

  const direction = thrust === "prograde" ? 1 : -1;
  return {
    ax: (direction * THRUST_ACCELERATION * body.vx) / speed,
    ay: (direction * THRUST_ACCELERATION * body.vy) / speed,
  };
}

export function stepOrbitSimulation(
  simulation: OrbitSimulation,
  dt: number,
  thrust: ThrustMode
): void {
  const movable = simulation.bodies.filter((body) => !body.fixed);
  const accelerations = movable.map((body) => {
    const gravity = acceleration(body, simulation.bodies);
    const thrustAccel =
      body.id === "spacecraft" ? applyThrust(body, thrust) : { ax: 0, ay: 0 };
    return {
      ax: gravity.ax + thrustAccel.ax,
      ay: gravity.ay + thrustAccel.ay,
    };
  });

  movable.forEach((body, index) => {
    body.vx += accelerations[index].ax * dt;
    body.vy += accelerations[index].ay * dt;
    body.x += body.vx * dt;
    body.y += body.vy * dt;
  });

  simulation.time += dt;
}

export function getBody(simulation: OrbitSimulation, id: SimBody["id"]): SimBody {
  const body = simulation.bodies.find((entry) => entry.id === id);
  if (!body) {
    throw new Error(`Missing body: ${id}`);
  }
  return body;
}

export function spacecraftAltitude(simulation: OrbitSimulation): number {
  const spacecraft = getBody(simulation, "spacecraft");
  const planet = getBody(simulation, "planet1");
  return distance(spacecraft.x, spacecraft.y, planet.x, planet.y);
}

export function spacecraftSpeed(simulation: OrbitSimulation): number {
  const spacecraft = getBody(simulation, "spacecraft");
  return Math.hypot(spacecraft.vx, spacecraft.vy);
}

export function maxOrbitExtent(params: OrbitParams): number {
  const extent = (config: PlanetOrbitConfig) =>
    clampOrbitRadius(config.semiMajorAxis) *
    (1 + clampEccentricity(config.eccentricity));
  return Math.max(extent(params.planet1), extent(params.planet2));
}

export interface OrbitTrailPoint {
  x: number;
  y: number;
}

export function drawOrbitSimulation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  simulation: OrbitSimulation,
  planet1Trail: OrbitTrailPoint[],
  planet2Trail: OrbitTrailPoint[],
  spacecraftTrail: OrbitTrailPoint[]
): void {
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.55
  );
  gradient.addColorStop(0, "#101828");
  gradient.addColorStop(1, "#060910");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const maxExtent = maxOrbitExtent(simulation.params) + 120;
  const scale = (Math.min(width, height) * 0.42) / maxExtent;
  const cx = width / 2;
  const cy = height / 2;

  const toScreen = (x: number, y: number) => ({
    x: cx + x * scale,
    y: cy - y * scale,
  });

  drawReferenceOrbit(
    ctx,
    simulation.params.planet1.semiMajorAxis,
    simulation.params.planet1.eccentricity,
    toScreen,
    "rgba(112, 144, 183, 0.35)"
  );
  drawReferenceOrbit(
    ctx,
    simulation.params.planet2.semiMajorAxis,
    simulation.params.planet2.eccentricity,
    toScreen,
    "rgba(125, 206, 160, 0.35)"
  );

  drawTrail(ctx, planet1Trail, toScreen, "rgba(112, 144, 183, 0.35)");
  drawTrail(ctx, planet2Trail, toScreen, "rgba(125, 206, 160, 0.35)");
  drawTrail(ctx, spacecraftTrail, toScreen, "rgba(246, 216, 96, 0.45)");

  for (const body of simulation.bodies) {
    const point = toScreen(body.x, body.y);
    const screenRadius = Math.max(body.radius * scale, body.id === "sun" ? 14 : 5);

    if (body.id === "sun") {
      const glow = ctx.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        screenRadius * 2.2
      );
      glow.addColorStop(0, "rgba(246, 216, 96, 0.95)");
      glow.addColorStop(0.45, "rgba(246, 180, 80, 0.35)");
      glow.addColorStop(1, "rgba(246, 180, 80, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(point.x, point.y, screenRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, screenRadius, 0, Math.PI * 2);
    ctx.fill();

    if (body.id === "spacecraft") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  trail: OrbitTrailPoint[],
  toScreen: (x: number, y: number) => { x: number; y: number },
  color: string
): void {
  if (trail.length < 2) {
    return;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const first = toScreen(trail[0].x, trail[0].y);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < trail.length; i++) {
    const point = toScreen(trail[i].x, trail[i].y);
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
}

function drawReferenceOrbit(
  ctx: CanvasRenderingContext2D,
  semiMajorAxis: number,
  eccentricity: number,
  toScreen: (x: number, y: number) => { x: number; y: number },
  strokeColor: string
): void {
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();

  const steps = 180;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const radius =
      (semiMajorAxis * (1 - eccentricity * eccentricity)) /
      (1 + eccentricity * Math.cos(angle));
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    const point = toScreen(x, y);
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }

  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
}
