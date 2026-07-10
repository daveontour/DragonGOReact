export type OpArtPattern = "line-grating" | "concentric-circles" | "radial-rays";

export const OP_ART_PATTERNS: Array<{
  id: OpArtPattern;
  label: string;
  description: string;
}> = [
  {
    id: "line-grating",
    label: "Line grating",
    description: "Two fine parallel-line gratings at a shared but offset angle.",
  },
  {
    id: "concentric-circles",
    label: "Concentric circles",
    description: "Two sets of rings sharing a slightly displaced center.",
  },
  {
    id: "radial-rays",
    label: "Radial rays",
    description: "Two sunburst spoke patterns at a shared but offset angle.",
  },
];

export const MIN_SPACING = 6;
export const MAX_SPACING = 48;
export const DEFAULT_SPACING_A = 16;

export const MIN_SPACING_DELTA = -6;
export const MAX_SPACING_DELTA = 6;
export const DEFAULT_SPACING_DELTA = 1.5;
export const SPACING_FLOOR = 2;

export const MIN_ANGLE_OFFSET = 0;
export const MAX_ANGLE_OFFSET = 45;
export const DEFAULT_ANGLE_OFFSET = 8;

export const MIN_CENTER_OFFSET = 0;
export const MAX_CENTER_OFFSET = 60;
export const DEFAULT_CENTER_OFFSET = 18;

export const MIN_LINE_WIDTH = 0.5;
export const MAX_LINE_WIDTH = 3;
export const DEFAULT_LINE_WIDTH = 1;

export const MIN_ROTATE_SPEED = 2;
export const MAX_ROTATE_SPEED = 60;
export const DEFAULT_ROTATE_SPEED = 15;

export const OP_ART_BACKGROUND = "#f5f4ef";
export const OP_ART_LAYER_A_COLOR = "#101010";
export const OP_ART_LAYER_B_COLOR = "#101010";

export interface OpArtLayerParams {
  spacing: number;
  angleDeg: number;
  centerX: number;
  centerY: number;
}

export interface OpArtParams {
  pattern: OpArtPattern;
  width: number;
  height: number;
  spacingA: number;
  spacingDelta: number;
  angleOffsetDeg: number;
  centerOffsetPx: number;
  lineWidth: number;
  rotationPhaseDeg: number;
}

export function clampSpacing(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SPACING_A;
  }
  return Math.min(MAX_SPACING, Math.max(MIN_SPACING, Math.round(value)));
}

export function clampSpacingDelta(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SPACING_DELTA;
  }
  return Math.min(MAX_SPACING_DELTA, Math.max(MIN_SPACING_DELTA, value));
}

export function clampAngleOffset(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ANGLE_OFFSET;
  }
  return Math.min(MAX_ANGLE_OFFSET, Math.max(MIN_ANGLE_OFFSET, Math.round(value)));
}

export function clampCenterOffset(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_CENTER_OFFSET;
  }
  return Math.min(MAX_CENTER_OFFSET, Math.max(MIN_CENTER_OFFSET, Math.round(value)));
}

export function clampLineWidth(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LINE_WIDTH;
  }
  return Math.min(MAX_LINE_WIDTH, Math.max(MIN_LINE_WIDTH, value));
}

export function clampRotateSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ROTATE_SPEED;
  }
  return Math.min(MAX_ROTATE_SPEED, Math.max(MIN_ROTATE_SPEED, Math.round(value)));
}

/** Layer B is Layer A with its spacing, angle, and center nudged by the
 * moiré-beat controls; the center shifts perpendicular to Layer A's axis. */
export function deriveLayerB(
  layerA: OpArtLayerParams,
  spacingDelta: number,
  angleOffsetDeg: number,
  centerOffsetPx: number
): OpArtLayerParams {
  const spacing = Math.max(SPACING_FLOOR, layerA.spacing + spacingDelta);
  const angleDeg = layerA.angleDeg + angleOffsetDeg;
  const perpendicular = ((layerA.angleDeg + 90) * Math.PI) / 180;
  return {
    spacing,
    angleDeg,
    centerX: layerA.centerX + Math.cos(perpendicular) * centerOffsetPx,
    centerY: layerA.centerY + Math.sin(perpendicular) * centerOffsetPx,
  };
}

/** Signed perpendicular offsets (from the canvas center) of every grating
 * line needed to fully cover a width x height canvas at the given spacing. */
export function computeGratingLineOffsets(
  width: number,
  height: number,
  spacing: number
): number[] {
  const diagonal = Math.hypot(width, height);
  const halfCount = Math.ceil(diagonal / spacing) + 1;
  const offsets: number[] = [];
  for (let i = -halfCount; i <= halfCount; i++) {
    offsets.push(i * spacing);
  }
  return offsets;
}

/** Ring radii from one spacing increment out to maxRadius, inclusive. */
export function computeRingRadii(maxRadius: number, spacing: number): number[] {
  const radii: number[] = [];
  for (let r = spacing; r <= maxRadius; r += spacing) {
    radii.push(r);
  }
  return radii;
}

export function computeRayAngles(rayCount: number, startAngleDeg: number): number[] {
  const angles: number[] = [];
  const step = 360 / rayCount;
  for (let i = 0; i < rayCount; i++) {
    angles.push(startAngleDeg + step * i);
  }
  return angles;
}

/** Reuses the line-grating "spacing" slider as an angular-density knob for
 * rays, so denser spacing reads as more rays regardless of pattern type. */
export function rayCountFromSpacing(spacing: number, referenceRadius = 200): number {
  return Math.max(3, Math.round((2 * Math.PI * referenceRadius) / spacing));
}

export function drawLineGratingLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number,
  angleDeg: number,
  color: string,
  lineWidth: number
): void {
  const angle = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const nx = Math.cos(angle + Math.PI / 2);
  const ny = Math.sin(angle + Math.PI / 2);
  const diagonal = Math.hypot(width, height);
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "butt";

  for (const offset of computeGratingLineOffsets(width, height, spacing)) {
    const ox = centerX + nx * offset;
    const oy = centerY + ny * offset;
    ctx.beginPath();
    ctx.moveTo(ox - dx * diagonal, oy - dy * diagonal);
    ctx.lineTo(ox + dx * diagonal, oy + dy * diagonal);
    ctx.stroke();
  }
}

export function drawConcentricCirclesLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number,
  centerX: number,
  centerY: number,
  color: string,
  lineWidth: number
): void {
  const maxRadius = Math.hypot(
    Math.max(centerX, width - centerX),
    Math.max(centerY, height - centerY)
  );

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  for (const radius of computeRingRadii(maxRadius, spacing)) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawRadialRaysLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number,
  angleDeg: number,
  centerX: number,
  centerY: number,
  color: string,
  lineWidth: number
): void {
  const maxRadius = Math.hypot(width, height);
  const rayCount = rayCountFromSpacing(spacing);

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  for (const rayAngleDeg of computeRayAngles(rayCount, angleDeg)) {
    const rad = (rayAngleDeg * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(rad) * maxRadius, centerY + Math.sin(rad) * maxRadius);
    ctx.stroke();
  }
}

export function renderOpArt(ctx: CanvasRenderingContext2D, params: OpArtParams): void {
  const {
    pattern,
    width,
    height,
    spacingA,
    spacingDelta,
    angleOffsetDeg,
    centerOffsetPx,
    lineWidth,
    rotationPhaseDeg,
  } = params;

  ctx.fillStyle = OP_ART_BACKGROUND;
  ctx.fillRect(0, 0, width, height);

  // Layer B is derived from a fixed base (angle 0) so auto-rotate only
  // advances Layer A. Deriving B from A's live angle would spin both layers
  // together and cancel the relative moiré beat.
  const layerBase: OpArtLayerParams = {
    spacing: spacingA,
    angleDeg: 0,
    centerX: width / 2,
    centerY: height / 2,
  };
  const layerA: OpArtLayerParams = {
    ...layerBase,
    angleDeg: rotationPhaseDeg,
  };
  const layerB = deriveLayerB(layerBase, spacingDelta, angleOffsetDeg, centerOffsetPx);

  if (pattern === "concentric-circles") {
    drawConcentricCirclesLayer(
      ctx,
      width,
      height,
      layerA.spacing,
      layerA.centerX,
      layerA.centerY,
      OP_ART_LAYER_A_COLOR,
      lineWidth
    );
    drawConcentricCirclesLayer(
      ctx,
      width,
      height,
      layerB.spacing,
      layerB.centerX,
      layerB.centerY,
      OP_ART_LAYER_B_COLOR,
      lineWidth
    );
    return;
  }

  if (pattern === "radial-rays") {
    drawRadialRaysLayer(
      ctx,
      width,
      height,
      layerA.spacing,
      layerA.angleDeg,
      layerA.centerX,
      layerA.centerY,
      OP_ART_LAYER_A_COLOR,
      lineWidth
    );
    drawRadialRaysLayer(
      ctx,
      width,
      height,
      layerB.spacing,
      layerB.angleDeg,
      layerB.centerX,
      layerB.centerY,
      OP_ART_LAYER_B_COLOR,
      lineWidth
    );
    return;
  }

  drawLineGratingLayer(
    ctx,
    width,
    height,
    layerA.spacing,
    layerA.angleDeg,
    OP_ART_LAYER_A_COLOR,
    lineWidth
  );
  drawLineGratingLayer(
    ctx,
    width,
    height,
    layerB.spacing,
    layerB.angleDeg,
    OP_ART_LAYER_B_COLOR,
    lineWidth
  );
}
