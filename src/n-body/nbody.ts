export const G = 400;
export const SOFTENING = 12;
export const MIN_BODIES = 2;
export const MAX_BODIES = 8;
export const DEFAULT_BODIES = 4;
export const MIN_TIMESCALE = 0.1;
export const MAX_TIMESCALE = 3;
export const DEFAULT_TIMESCALE = 1;
export const WORLD_RADIUS = 260;
export const TRAIL_LENGTH = 400;

export interface NBody {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
}

export interface NBodySimulation {
  bodies: NBody[];
  time: number;
}

const BODY_COLORS = [
  "#f6d860",
  "#7090b7",
  "#7dcea0",
  "#f6a86a",
  "#c792ea",
  "#7fd4ff",
  "#ff8fa3",
  "#b0c4de",
];

export function clampBodyCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_BODIES;
  }
  return Math.min(MAX_BODIES, Math.max(MIN_BODIES, Math.round(value)));
}

export function clampNBodyTimescale(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TIMESCALE;
  }
  return Math.min(MAX_TIMESCALE, Math.max(MIN_TIMESCALE, value));
}

export function createRandomNBodySystem(count: number): NBodySimulation {
  const bodies: NBody[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const radius = WORLD_RADIUS * (0.35 + Math.random() * 0.55);
    const mass = 40 + Math.random() * 160;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const speed = Math.sqrt((G * (count * 60)) / radius) * (0.5 + Math.random() * 0.4);
    const tangentAngle = angle + Math.PI / 2;

    bodies.push({
      id: i,
      x,
      y,
      vx: Math.cos(tangentAngle) * speed,
      vy: Math.sin(tangentAngle) * speed,
      mass,
      radius: 4 + Math.cbrt(mass),
      color: BODY_COLORS[i % BODY_COLORS.length],
    });
  }

  return { bodies, time: 0 };
}

function acceleration(body: NBody, bodies: NBody[]): { ax: number; ay: number } {
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

export function stepNBodySimulation(simulation: NBodySimulation, dt: number): void {
  const accelerations = simulation.bodies.map((body) =>
    acceleration(body, simulation.bodies)
  );

  simulation.bodies.forEach((body, index) => {
    body.vx += accelerations[index].ax * dt;
    body.vy += accelerations[index].ay * dt;
  });
  simulation.bodies.forEach((body) => {
    body.x += body.vx * dt;
    body.y += body.vy * dt;
  });

  simulation.time += dt;
}

export function totalMomentum(simulation: NBodySimulation): { px: number; py: number } {
  let px = 0;
  let py = 0;
  for (const body of simulation.bodies) {
    px += body.mass * body.vx;
    py += body.mass * body.vy;
  }
  return { px, py };
}

export function systemExtent(simulation: NBodySimulation): number {
  let maxDist = WORLD_RADIUS;
  for (const body of simulation.bodies) {
    maxDist = Math.max(maxDist, Math.hypot(body.x, body.y) + body.radius);
  }
  return maxDist;
}

export interface NBodyTrailPoint {
  x: number;
  y: number;
}

export function drawNBodySimulation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  simulation: NBodySimulation,
  trails: NBodyTrailPoint[][]
): void {
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.6
  );
  gradient.addColorStop(0, "#101828");
  gradient.addColorStop(1, "#05070c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const extent = systemExtent(simulation) * 1.15;
  const scale = (Math.min(width, height) * 0.48) / extent;
  const cx = width / 2;
  const cy = height / 2;
  const toScreen = (x: number, y: number) => ({ x: cx + x * scale, y: cy - y * scale });

  simulation.bodies.forEach((body, index) => {
    const trail = trails[index];
    if (!trail || trail.length < 2) {
      return;
    }
    ctx.strokeStyle = body.color;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const first = toScreen(trail[0].x, trail[0].y);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < trail.length; i++) {
      const point = toScreen(trail[i].x, trail[i].y);
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  for (const body of simulation.bodies) {
    const point = toScreen(body.x, body.y);
    const screenRadius = Math.max(body.radius * scale, 3);

    const glow = ctx.createRadialGradient(
      point.x,
      point.y,
      0,
      point.x,
      point.y,
      screenRadius * 2.5
    );
    glow.addColorStop(0, body.color);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(point.x, point.y, screenRadius * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, screenRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}
