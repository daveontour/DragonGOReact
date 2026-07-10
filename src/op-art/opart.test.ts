import { describe, expect, it } from "vitest";
import {
  clampAngleOffset,
  clampCenterOffset,
  clampLineWidth,
  clampRotateSpeed,
  clampSpacing,
  clampSpacingDelta,
  computeGratingLineOffsets,
  computeRayAngles,
  computeRingRadii,
  deriveLayerB,
  DEFAULT_ANGLE_OFFSET,
  DEFAULT_CENTER_OFFSET,
  DEFAULT_LINE_WIDTH,
  DEFAULT_ROTATE_SPEED,
  DEFAULT_SPACING_A,
  DEFAULT_SPACING_DELTA,
  MAX_ANGLE_OFFSET,
  MAX_CENTER_OFFSET,
  MAX_LINE_WIDTH,
  MAX_ROTATE_SPEED,
  MAX_SPACING,
  MAX_SPACING_DELTA,
  MIN_ANGLE_OFFSET,
  MIN_CENTER_OFFSET,
  MIN_LINE_WIDTH,
  MIN_ROTATE_SPEED,
  MIN_SPACING,
  MIN_SPACING_DELTA,
  rayCountFromSpacing,
  SPACING_FLOOR,
} from "./opart";

describe("opart", () => {
  it("derives layer B's spacing and angle from layer A plus the offsets", () => {
    const layerA = { spacing: 16, angleDeg: 10, centerX: 100, centerY: 100 };
    const layerB = deriveLayerB(layerA, 1.5, 8, 0);
    expect(layerB.spacing).toBeCloseTo(17.5);
    expect(layerB.angleDeg).toBeCloseTo(18);
  });

  it("keeps layer B's angle fixed when derived from a non-rotating base", () => {
    // Auto-rotate only advances Layer A; Layer B is derived from angle 0 so
    // its absolute angle stays at the user-set offset.
    const layerBase = { spacing: 16, angleDeg: 0, centerX: 100, centerY: 100 };
    const layerB = deriveLayerB(layerBase, 0, 8, 0);
    expect(layerB.angleDeg).toBeCloseTo(8);
  });

  it("floors layer B's spacing so it never reaches zero or negative", () => {
    const layerA = { spacing: MIN_SPACING, angleDeg: 0, centerX: 0, centerY: 0 };
    const layerB = deriveLayerB(layerA, MIN_SPACING_DELTA, 0, 0);
    expect(layerB.spacing).toBeGreaterThanOrEqual(SPACING_FLOOR);
  });

  it("shifts layer B's center perpendicular to layer A's axis", () => {
    const layerA = { spacing: 16, angleDeg: 0, centerX: 100, centerY: 100 };
    const layerB = deriveLayerB(layerA, 0, 0, 20);
    // angleDeg=0 grating runs along x, so the perpendicular shift is along y.
    expect(layerB.centerX).toBeCloseTo(100);
    expect(layerB.centerY).toBeCloseTo(120);
  });

  it("computes a symmetric set of grating line offsets covering the canvas", () => {
    const width = 400;
    const height = 300;
    const spacing = 20;
    const offsets = computeGratingLineOffsets(width, height, spacing);
    const diagonal = Math.hypot(width, height);
    const halfCount = Math.ceil(diagonal / spacing) + 1;
    expect(offsets.length).toBe(2 * halfCount + 1);
    for (let i = 0; i < offsets.length; i++) {
      expect(offsets[i]).toBeCloseTo(-offsets[offsets.length - 1 - i]);
    }
  });

  it("computes ring radii that increase monotonically by spacing", () => {
    const radii = computeRingRadii(100, 15);
    expect(radii[0]).toBeCloseTo(15);
    expect(radii[radii.length - 1]).toBeLessThanOrEqual(100);
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i] - radii[i - 1]).toBeCloseTo(15);
    }
  });

  it("computes evenly spaced ray angles starting at the given angle", () => {
    const angles = computeRayAngles(6, 10);
    expect(angles.length).toBe(6);
    expect(angles[0]).toBeCloseTo(10);
    for (let i = 1; i < angles.length; i++) {
      expect(angles[i] - angles[i - 1]).toBeCloseTo(60);
    }
  });

  it("derives more rays from denser (smaller) spacing", () => {
    const dense = rayCountFromSpacing(6);
    const sparse = rayCountFromSpacing(24);
    expect(dense).toBeGreaterThan(sparse);
  });

  it("clamps spacing, delta, angle offset, center offset, line width, and rotate speed to their ranges", () => {
    expect(clampSpacing(0)).toBe(MIN_SPACING);
    expect(clampSpacing(9999)).toBe(MAX_SPACING);
    expect(clampSpacing(NaN)).toBe(DEFAULT_SPACING_A);

    expect(clampSpacingDelta(-9999)).toBe(MIN_SPACING_DELTA);
    expect(clampSpacingDelta(9999)).toBe(MAX_SPACING_DELTA);
    expect(clampSpacingDelta(NaN)).toBe(DEFAULT_SPACING_DELTA);

    expect(clampAngleOffset(-10)).toBe(MIN_ANGLE_OFFSET);
    expect(clampAngleOffset(9999)).toBe(MAX_ANGLE_OFFSET);
    expect(clampAngleOffset(NaN)).toBe(DEFAULT_ANGLE_OFFSET);

    expect(clampCenterOffset(-10)).toBe(MIN_CENTER_OFFSET);
    expect(clampCenterOffset(9999)).toBe(MAX_CENTER_OFFSET);
    expect(clampCenterOffset(NaN)).toBe(DEFAULT_CENTER_OFFSET);

    expect(clampLineWidth(0)).toBe(MIN_LINE_WIDTH);
    expect(clampLineWidth(9999)).toBe(MAX_LINE_WIDTH);
    expect(clampLineWidth(NaN)).toBe(DEFAULT_LINE_WIDTH);

    expect(clampRotateSpeed(0)).toBe(MIN_ROTATE_SPEED);
    expect(clampRotateSpeed(9999)).toBe(MAX_ROTATE_SPEED);
    expect(clampRotateSpeed(NaN)).toBe(DEFAULT_ROTATE_SPEED);
  });
});
