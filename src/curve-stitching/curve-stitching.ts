export type StitchPattern = "circle-multiplication" | "two-ray-parabola";
export type StitchColorMode = "mono" | "rainbow";

export const MIN_STITCH_N = 20;
export const MAX_STITCH_N = 300;
export const DEFAULT_STITCH_N = 120;

export const MIN_MULTIPLIER_K = 1;
export const DEFAULT_MULTIPLIER_K = 2;

export const STITCH_BACKGROUND = "#0a0d18";
export const STITCH_LINE_COLOR = "#7fd4ff";

export interface StitchPoint {
  x: number;
  y: number;
}

export interface StitchChord {
  from: number;
  to: number;
}

export function clampStitchN(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_STITCH_N;
  }
  return Math.min(MAX_STITCH_N, Math.max(MIN_STITCH_N, Math.round(value)));
}

export function maxMultiplierFor(n: number): number {
  return n / 2;
}

export function clampMultiplierK(value: number, n: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MULTIPLIER_K;
  }
  return Math.min(maxMultiplierFor(n), Math.max(MIN_MULTIPLIER_K, value));
}

/** Point 0 sits at angle 0 (not an arbitrary rotational offset) so that
 * reflecting a point about the x-axis corresponds exactly to the clean
 * index map i -> (n-i) mod n, which every single-k circle-multiplication
 * pattern turns out to be self-symmetric under. */
export function circlePointPosition(index: number, n: number): StitchPoint {
  const angle = (index / n) * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function parabolaPointOnRayA(index: number, n: number): StitchPoint {
  return { x: (index + 1) / n, y: 0 };
}

export function parabolaPointOnRayB(index: number, n: number): StitchPoint {
  return { x: 0, y: (index + 1) / n };
}

/** The classic "times tables" construction: point i connects to point
 * i*k mod n. k=2 is the well-known cardioid case. Self-loops (i === its
 * own target, e.g. always at k=1) are skipped since they draw nothing. */
export function circleMultiplicationChords(n: number, k: number): StitchChord[] {
  const chords: StitchChord[] = [];
  for (let i = 0; i < n; i++) {
    const to = Math.round(i * k) % n;
    if (to !== i) {
      chords.push({ from: i, to });
    }
  }
  return chords;
}

/** Point i on ray A connects to point n-1-i on ray B; the straight lines'
 * envelope traces a parabola. For odd n, the middle index maps to itself
 * (the vertex-adjacent point), a real feature of the construction, not a
 * degenerate case to filter out. */
export function parabolaChords(n: number): StitchChord[] {
  const chords: StitchChord[] = [];
  for (let i = 0; i < n; i++) {
    chords.push({ from: i, to: n - 1 - i });
  }
  return chords;
}

export function drawCurveStitching(
  ctx: CanvasRenderingContext2D,
  size: number,
  pattern: StitchPattern,
  n: number,
  chords: StitchChord[],
  scale: number,
  lineWidth: number,
  lineAlpha: number,
  colorMode: StitchColorMode,
  revealCount: number = chords.length,
  offsetX: number = 0,
  offsetY: number = 0
): void {
  ctx.fillStyle = STITCH_BACKGROUND;
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const count = Math.max(0, Math.min(revealCount, chords.length));
  if (count < 1) {
    return;
  }

  const endpointFor = (index: number, isRayB: boolean): StitchPoint => {
    if (pattern === "circle-multiplication") {
      return circlePointPosition(index, n);
    }
    return isRayB ? parabolaPointOnRayB(index, n) : parabolaPointOnRayA(index, n);
  };

  ctx.lineWidth = lineWidth;

  for (let i = 0; i < count; i++) {
    const chord = chords[i];
    const from = endpointFor(chord.from, false);
    const to = endpointFor(chord.to, true);

    ctx.globalAlpha = lineAlpha;
    ctx.strokeStyle =
      colorMode === "mono"
        ? STITCH_LINE_COLOR
        : `hsl(${((i / chords.length) * 360).toFixed(1)}, 75%, 62%)`;
    ctx.beginPath();
    ctx.moveTo(cx + (from.x + offsetX) * scale, cy - (from.y + offsetY) * scale);
    ctx.lineTo(cx + (to.x + offsetX) * scale, cy - (to.y + offsetY) * scale);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
