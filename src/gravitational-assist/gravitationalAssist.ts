export const G = 1200;
export const SOFTENING = 8;

export const MIN_ENCOUNTER_ANGLE = -180;
export const MAX_ENCOUNTER_ANGLE = 180;
export const DEFAULT_ENCOUNTER_ANGLE = 30;

export const MIN_APPROACH_SPEED = 20;
export const MAX_APPROACH_SPEED = 120;
export const DEFAULT_APPROACH_SPEED = 55;

export const MIN_PLANET_SPEED = 10;
export const MAX_PLANET_SPEED = 80;
export const DEFAULT_PLANET_SPEED = 40;

export const MIN_IMPACT_PARAMETER = 20;
export const MAX_IMPACT_PARAMETER = 120;
export const DEFAULT_IMPACT_PARAMETER = 55;

export const MIN_TIMESCALE = 0.2;
export const MAX_TIMESCALE = 3;
export const DEFAULT_TIMESCALE = 1;

export const PLANET_MASS = 800;
export const SPACECRAFT_MASS = 1;
export const PLANET_RADIUS = 18;
export const SPACECRAFT_RADIUS = 4;
export const START_DISTANCE = 420;
export const TRAIL_LENGTH = 500;
export const FAR_DISTANCE = 280;

export interface Vec2 {
  x: number;
  y: number;
}

export interface GravitationalAssistParams {
  encounterAngleDeg: number;
  approachSpeed: number;
  planetSpeed: number;
  impactParameter: number;
}

export interface GravitationalAssistBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
}

export interface GravitationalAssistSimulation {
  planet: GravitationalAssistBody;
  spacecraft: GravitationalAssistBody;
  time: number;
  params: GravitationalAssistParams;
  initialSpacecraftSpeed: number;
  closestApproach: number;
  finished: boolean;
  exitSpeed: number | null;
  encountered: boolean;
}

export interface GravitationalAssistStats {
  time: number;
  spacecraftSpeed: number;
  speedChange: number;
  closestApproach: number;
  turnAngleDeg: number | null;
  finished: boolean;
}

export function clampEncounterAngle(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ENCOUNTER_ANGLE;
  }
  return Math.min(
    MAX_ENCOUNTER_ANGLE,
    Math.max(MIN_ENCOUNTER_ANGLE, Math.round(value))
  );
}

export function clampApproachSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_APPROACH_SPEED;
  }
  return Math.min(
    MAX_APPROACH_SPEED,
    Math.max(MIN_APPROACH_SPEED, Math.round(value))
  );
}

export function clampPlanetSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PLANET_SPEED;
  }
  return Math.min(
    MAX_PLANET_SPEED,
    Math.max(MIN_PLANET_SPEED, Math.round(value))
  );
}

export function clampImpactParameter(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_IMPACT_PARAMETER;
  }
  return Math.min(
    MAX_IMPACT_PARAMETER,
    Math.max(MIN_IMPACT_PARAMETER, Math.round(value))
  );
}

export function clampTimescale(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TIMESCALE;
  }
  return Math.min(MAX_TIMESCALE, Math.max(MIN_TIMESCALE, Math.round(value * 10) / 10));
}

/** Hyperbolic turn angle in the planet rest frame (radians). */
export function hyperbolicTurnAngleRad(
  impactParameter: number,
  approachSpeed: number,
  planetMass: number = PLANET_MASS
): number {
  const mu = G * planetMass;
  const b = Math.max(1, impactParameter);
  const vInf = Math.max(1, approachSpeed);
  const eccentricity = Math.sqrt(1 + Math.pow((b * vInf * vInf) / mu, 2));
  return 2 * Math.asin(Math.min(1, 1 / eccentricity));
}

export function speed(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

export function bodySpeed(body: GravitationalAssistBody): number {
  return Math.hypot(body.vx, body.vy);
}

export function relativeVelocity(
  spacecraft: GravitationalAssistBody,
  planet: GravitationalAssistBody
): Vec2 {
  return {
    x: spacecraft.vx - planet.vx,
    y: spacecraft.vy - planet.vy,
  };
}

export function createGravitationalAssistEncounter(
  params: GravitationalAssistParams
): GravitationalAssistSimulation {
  const encounterAngleDeg = clampEncounterAngle(params.encounterAngleDeg);
  const approachSpeed = clampApproachSpeed(params.approachSpeed);
  const planetSpeed = clampPlanetSpeed(params.planetSpeed);
  const impactParameter = clampImpactParameter(params.impactParameter);

  const theta = (encounterAngleDeg * Math.PI) / 180;
  const relVx = approachSpeed * Math.cos(theta);
  const relVy = approachSpeed * Math.sin(theta);
  const relSpeed = Math.hypot(relVx, relVy);
  const relHatX = relVx / relSpeed;
  const relHatY = relVy / relSpeed;
  const normalX = -relHatY;
  const normalY = relHatX;

  const planet: GravitationalAssistBody = {
    x: 0,
    y: 0,
    vx: planetSpeed,
    vy: 0,
    mass: PLANET_MASS,
    radius: PLANET_RADIUS,
    color: "#5aaaff",
  };

  const spacecraft: GravitationalAssistBody = {
    x: planet.x - relHatX * START_DISTANCE + normalX * impactParameter,
    y: planet.y - relHatY * START_DISTANCE + normalY * impactParameter,
    vx: planet.vx + relVx,
    vy: planet.vy + relVy,
    mass: SPACECRAFT_MASS,
    radius: SPACECRAFT_RADIUS,
    color: "#f6d860",
  };

  return {
    planet,
    spacecraft,
    time: 0,
    params: {
      encounterAngleDeg,
      approachSpeed,
      planetSpeed,
      impactParameter,
    },
    initialSpacecraftSpeed: bodySpeed(spacecraft),
    closestApproach: Number.POSITIVE_INFINITY,
    finished: false,
    exitSpeed: null,
    encountered: false,
  };
}

function spacecraftAcceleration(
  spacecraft: GravitationalAssistBody,
  planet: GravitationalAssistBody
): Vec2 {
  const dx = planet.x - spacecraft.x;
  const dy = planet.y - spacecraft.y;
  const distSq = dx * dx + dy * dy + SOFTENING * SOFTENING;
  const dist = Math.sqrt(distSq);
  const accel = (G * planet.mass) / distSq;
  return {
    x: (accel * dx) / dist,
    y: (accel * dy) / dist,
  };
}

export function stepGravitationalAssist(
  simulation: GravitationalAssistSimulation,
  dt: number
): void {
  if (simulation.finished) {
    return;
  }

  const { planet, spacecraft } = simulation;
  const accel = spacecraftAcceleration(spacecraft, planet);

  spacecraft.vx += accel.x * dt;
  spacecraft.vy += accel.y * dt;
  spacecraft.x += spacecraft.vx * dt;
  spacecraft.y += spacecraft.vy * dt;

  planet.x += planet.vx * dt;
  planet.y += planet.vy * dt;

  const dist = Math.hypot(
    spacecraft.x - planet.x,
    spacecraft.y - planet.y
  );
  simulation.closestApproach = Math.min(simulation.closestApproach, dist);

  if (dist < START_DISTANCE * 0.75) {
    simulation.encountered = true;
  }

  const relPos = {
    x: spacecraft.x - planet.x,
    y: spacecraft.y - planet.y,
  };
  const relVel = relativeVelocity(spacecraft, planet);
  const departing =
    relPos.x * relVel.x + relPos.y * relVel.y > 0;

  if (
    simulation.encountered &&
    departing &&
    simulation.time > 2 &&
    dist > FAR_DISTANCE
  ) {
    simulation.finished = true;
    simulation.exitSpeed = bodySpeed(spacecraft);
  }

  simulation.time += dt;
}

export function computeGravitationalAssistStats(
  simulation: GravitationalAssistSimulation
): GravitationalAssistStats {
  const spacecraftSpeed = bodySpeed(simulation.spacecraft);
  const speedChange = spacecraftSpeed - simulation.initialSpacecraftSpeed;

  let turnAngleDeg: number | null = null;
  if (simulation.finished && simulation.exitSpeed !== null) {
    const rel0 = {
      x:
        simulation.params.approachSpeed *
        Math.cos((simulation.params.encounterAngleDeg * Math.PI) / 180),
      y:
        simulation.params.approachSpeed *
        Math.sin((simulation.params.encounterAngleDeg * Math.PI) / 180),
    };
    const relNow = relativeVelocity(simulation.spacecraft, simulation.planet);
    const dot = rel0.x * relNow.x + rel0.y * relNow.y;
    const cross = rel0.x * relNow.y - rel0.y * relNow.x;
    const rel0Speed = speed(rel0);
    const relNowSpeed = speed(relNow);
    if (rel0Speed > 0 && relNowSpeed > 0) {
      turnAngleDeg = (Math.atan2(cross, dot) * 180) / Math.PI;
    }
  }

  return {
    time: simulation.time,
    spacecraftSpeed,
    speedChange,
    closestApproach: simulation.closestApproach,
    turnAngleDeg,
    finished: simulation.finished,
  };
}

export interface TrailPoint {
  x: number;
  y: number;
}

export function drawGravitationalAssist(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  simulation: GravitationalAssistSimulation,
  trail: TrailPoint[]
): void {
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.65
  );
  gradient.addColorStop(0, "#101828");
  gradient.addColorStop(1, "#05070c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const focusX = (simulation.planet.x + simulation.spacecraft.x) / 2;
  const focusY = (simulation.planet.y + simulation.spacecraft.y) / 2;
  const extent = Math.max(
    START_DISTANCE * 0.55,
    Math.hypot(
      simulation.spacecraft.x - simulation.planet.x,
      simulation.spacecraft.y - simulation.planet.y
    ) * 1.8,
    FAR_DISTANCE * 0.75
  );
  const scale = (Math.min(width, height) * 0.44) / extent;
  const cx = width / 2;
  const cy = height / 2;
  const toScreen = (x: number, y: number) => ({
    x: cx + (x - focusX) * scale,
    y: cy - (y - focusY) * scale,
  });

  // Planet velocity arrow
  const planetPoint = toScreen(simulation.planet.x, simulation.planet.y);
  const arrowScale = 1.4;
  const arrowEnd = toScreen(
    simulation.planet.x + simulation.planet.vx * arrowScale,
    simulation.planet.y + simulation.planet.vy * arrowScale
  );
  ctx.strokeStyle = "rgba(90, 170, 255, 0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(planetPoint.x, planetPoint.y);
  ctx.lineTo(arrowEnd.x, arrowEnd.y);
  ctx.stroke();

  if (trail.length >= 2) {
    ctx.strokeStyle = simulation.spacecraft.color;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const first = toScreen(trail[0].x, trail[0].y);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < trail.length; i++) {
      const point = toScreen(trail[i].x, trail[i].y);
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const planetScreenRadius = Math.max(simulation.planet.radius * scale, 10);
  const planetGlow = ctx.createRadialGradient(
    planetPoint.x,
    planetPoint.y,
    0,
    planetPoint.x,
    planetPoint.y,
    planetScreenRadius * 2.8
  );
  planetGlow.addColorStop(0, simulation.planet.color);
  planetGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = planetGlow;
  ctx.beginPath();
  ctx.arc(
    planetPoint.x,
    planetPoint.y,
    planetScreenRadius * 2.8,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = simulation.planet.color;
  ctx.beginPath();
  ctx.arc(planetPoint.x, planetPoint.y, planetScreenRadius, 0, Math.PI * 2);
  ctx.fill();

  const craftPoint = toScreen(simulation.spacecraft.x, simulation.spacecraft.y);
  const craftRadius = Math.max(simulation.spacecraft.radius * scale, 4);
  ctx.fillStyle = simulation.spacecraft.color;
  ctx.beginPath();
  ctx.arc(craftPoint.x, craftPoint.y, craftRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.fillText("planet →", arrowEnd.x + 6, arrowEnd.y + 4);
}
