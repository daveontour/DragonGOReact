/** A circle stored as curvature (k = 1/radius, negative for a circle that
 * curves the "wrong way" around the others — an enclosing boundary) plus
 * its center, with the center's (re, im) being literally the (x, y)
 * position in the plane. The Complex Descartes Circle Theorem treats that
 * position as a complex number purely as an algebraic trick — the small
 * complex-arithmetic helpers below operate on that same (re, im) pair. */
export interface Circle {
  k: number;
  re: number;
  im: number;
}

interface Complex {
  re: number;
  im: number;
}

function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function cMul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

function cScale(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s };
}

function cSqrt(a: Complex): Complex {
  const r = Math.hypot(a.re, a.im);
  const re = Math.sqrt(Math.max(0, (r + a.re) / 2));
  let im = Math.sqrt(Math.max(0, (r - a.re) / 2));
  if (a.im < 0) {
    im = -im;
  }
  return { re, im };
}

export const MIN_MAX_DEPTH = 4;
export const MAX_MAX_DEPTH = 14;
export const DEFAULT_MAX_DEPTH = 10;

export const MIN_RADIUS_FRACTION = 0.0005;
export const MAX_RADIUS_FRACTION = 0.05;
export const DEFAULT_RADIUS_FRACTION = 0.003;

export function clampMaxDepth(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MAX_DEPTH;
  }
  return Math.min(MAX_MAX_DEPTH, Math.max(MIN_MAX_DEPTH, Math.round(value)));
}

export function clampMinRadiusFraction(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_RADIUS_FRACTION;
  }
  return Math.min(MAX_RADIUS_FRACTION, Math.max(MIN_RADIUS_FRACTION, value));
}

/** Descartes Circle Theorem's k4, plus its complex-plane extension for the
 * center, solved directly with a sign choice — used only once, to seed the
 * very first 4th circle from the 3-circle base. Every circle after that is
 * found via nextCircleByVieta instead, which needs no sqrt or sign pick. */
export function solveFourthCircle(a: Circle, b: Circle, c: Circle, sign: 1 | -1): Circle {
  const kDiscriminant = a.k * b.k + b.k * c.k + c.k * a.k;
  const k4 = a.k + b.k + c.k + sign * 2 * Math.sqrt(Math.max(0, kDiscriminant));

  const za: Complex = { re: a.re, im: a.im };
  const zb: Complex = { re: b.re, im: b.im };
  const zc: Complex = { re: c.re, im: c.im };

  const zDiscriminant = cAdd(
    cAdd(cScale(cMul(za, zb), a.k * b.k), cScale(cMul(zb, zc), b.k * c.k)),
    cScale(cMul(zc, za), c.k * a.k)
  );
  const sqrtZ = cSqrt(zDiscriminant);

  const wSum = cAdd(cAdd(cScale(za, a.k), cScale(zb, b.k)), cScale(zc, c.k));
  const w4 = cAdd(wSum, cScale(sqrtZ, sign * 2));
  const z4 = cScale(w4, 1 / k4);

  return { k: k4, re: z4.re, im: z4.im };
}

/** Given a mutually tangent triple (a, b, c) and the 4th circle already
 * known to be tangent to all three, the Descartes equation is quadratic in
 * k4 (and, separately, in w4 = k4*z4) with a known root-sum — so the
 * *other* root can be "jumped to" directly via Vieta's formula, with no
 * sqrt and no sign ambiguity. This is what every gasket circle after the
 * initial seed uses. */
export function nextCircleByVieta(a: Circle, b: Circle, c: Circle, known: Circle): Circle {
  const k4 = 2 * (a.k + b.k + c.k) - known.k;

  const za: Complex = { re: a.re, im: a.im };
  const zb: Complex = { re: b.re, im: b.im };
  const zc: Complex = { re: c.re, im: c.im };
  const zKnown: Complex = { re: known.re, im: known.im };

  const wSum = cAdd(cAdd(cScale(za, a.k), cScale(zb, b.k)), cScale(zc, c.k));
  const w4 = cAdd(cScale(wSum, 2), cScale(zKnown, -known.k));
  const z4 = cScale(w4, 1 / k4);

  return { k: k4, re: z4.re, im: z4.im };
}

/** The canonical seed: an outer bounding circle plus two equal circles
 * spanning its diameter, plus one of the two circles tangent to all three
 * (filling the lens-shaped gap above the diameter). The mirror circle
 * below the diameter isn't seeded here — it falls out naturally as the
 * first Vieta jump in generateGasket, from the {outer, inner1, inner2}
 * triple. */
export function seedGasket(outerRadius: number): [Circle, Circle, Circle, Circle] {
  const outer: Circle = { k: -1 / outerRadius, re: 0, im: 0 };
  const innerRadius = outerRadius / 2;
  const inner1: Circle = { k: 1 / innerRadius, re: -innerRadius, im: 0 };
  const inner2: Circle = { k: 1 / innerRadius, re: innerRadius, im: 0 };
  const top = solveFourthCircle(outer, inner1, inner2, 1);
  return [outer, inner1, inner2, top];
}

interface GaskState {
  a: Circle;
  b: Circle;
  c: Circle;
  known: Circle;
  depth: number;
}

/** Recursively fills every gap: from a mutually-tangent quadruple
 * {a,b,c,known}, each of the 3 triples that includes the newly found
 * circle (swapping it in for one of a/b/c) spawns its own next circle —
 * the triple {a,b,c} itself is skipped since jumping it would just
 * regenerate `known` (going backward). Recursion stops once a circle's
 * radius drops below minRadiusFraction of the outer radius, with maxDepth
 * as a defensive backstop. */
export function generateGasket(
  outerRadius: number,
  minRadiusFraction: number,
  maxDepth: number
): Circle[] {
  const [outer, inner1, inner2, top] = seedGasket(outerRadius);
  const results: Circle[] = [outer, inner1, inner2, top];
  const minRadius = outerRadius * minRadiusFraction;

  const stack: GaskState[] = [
    { a: inner1, b: inner2, c: top, known: outer, depth: 1 },
    { a: outer, b: inner2, c: top, known: inner1, depth: 1 },
    { a: outer, b: inner1, c: top, known: inner2, depth: 1 },
    { a: outer, b: inner1, c: inner2, known: top, depth: 1 },
  ];

  while (stack.length > 0) {
    const frame = stack.pop() as GaskState;
    if (frame.depth > maxDepth) {
      continue;
    }
    const next = nextCircleByVieta(frame.a, frame.b, frame.c, frame.known);
    const radius = Math.abs(1 / next.k);
    if (!Number.isFinite(radius) || radius < minRadius) {
      continue;
    }
    results.push(next);
    stack.push({ a: frame.b, b: frame.c, c: next, known: frame.a, depth: frame.depth + 1 });
    stack.push({ a: frame.a, b: frame.c, c: next, known: frame.b, depth: frame.depth + 1 });
    stack.push({ a: frame.a, b: frame.b, c: next, known: frame.c, depth: frame.depth + 1 });
  }

  return results;
}

export type GasketColorMode = "generation" | "size";

export function colorForCircle(
  circle: Circle,
  mode: GasketColorMode,
  generation: number,
  maxGeneration: number,
  outerRadius: number
): string {
  if (mode === "size") {
    const radius = Math.abs(1 / circle.k);
    const t = Math.min(1, Math.log(1 + radius) / Math.log(1 + outerRadius));
    const hue = 20 + t * 200;
    return `hsl(${hue.toFixed(1)}, 70%, 58%)`;
  }
  const t = maxGeneration > 0 ? generation / maxGeneration : 0;
  const hue = 260 - t * 220;
  return `hsl(${hue.toFixed(1)}, 65%, 58%)`;
}

export function renderGasket(
  ctx: CanvasRenderingContext2D,
  size: number,
  circles: Circle[],
  outerRadius: number,
  scale: number,
  lineWidth: number,
  colorMode: GasketColorMode
): void {
  ctx.fillStyle = "#0a0d18";
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const maxGeneration = circles.length > 4 ? Math.log2(circles.length - 3) + 1 : 1;

  ctx.lineWidth = lineWidth;
  for (let i = 0; i < circles.length; i++) {
    const circle = circles[i];
    const radius = Math.abs(1 / circle.k) * scale;
    if (radius < 0.4) {
      continue;
    }
    const generation = i <= 3 ? 0 : Math.log2(Math.max(1, i - 2));
    ctx.strokeStyle = colorForCircle(circle, colorMode, generation, maxGeneration, outerRadius);
    ctx.beginPath();
    ctx.arc(cx + circle.re * scale, cy - circle.im * scale, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}
