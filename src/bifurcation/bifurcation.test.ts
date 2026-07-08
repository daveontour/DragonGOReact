import { describe, expect, it } from "vitest";
import {
  clampBifurcationIterations,
  DEFAULT_BIFURCATION_VIEW,
  logisticMap,
  rAtPixel,
  renderBifurcation,
  zoomBifurcationAt,
} from "./bifurcation";

describe("bifurcation", () => {
  it("computes the logistic map exactly", () => {
    expect(logisticMap(0.5, 4)).toBeCloseTo(1);
    expect(logisticMap(0.2, 3)).toBeCloseTo(0.48);
  });

  it("maps pixel columns to r values across the view", () => {
    expect(rAtPixel(0, 100, DEFAULT_BIFURCATION_VIEW)).toBeCloseTo(
      DEFAULT_BIFURCATION_VIEW.rMin
    );
    expect(rAtPixel(100, 100, DEFAULT_BIFURCATION_VIEW)).toBeCloseTo(
      DEFAULT_BIFURCATION_VIEW.rMax
    );
  });

  it("zooms into a narrower, centered r range", () => {
    const zoomed = zoomBifurcationAt(DEFAULT_BIFURCATION_VIEW, 3.5, 0.5);
    const originalWidth = DEFAULT_BIFURCATION_VIEW.rMax - DEFAULT_BIFURCATION_VIEW.rMin;
    const zoomedWidth = zoomed.rMax - zoomed.rMin;
    expect(zoomedWidth).toBeCloseTo(originalWidth * 0.5);
    expect((zoomed.rMin + zoomed.rMax) / 2).toBeCloseTo(3.5);
  });

  it("clamps iteration counts to the supported range", () => {
    expect(clampBifurcationIterations(1)).toBe(50);
    expect(clampBifurcationIterations(99999)).toBe(600);
  });

  it("draws points for the stable fixed point at low r", () => {
    const width = 50;
    const height = 50;
    const imageData = {
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    } as ImageData;
    // r in [2.4, 2.9] is below the first period-doubling; every column
    // should converge to a single stable fixed point.
    renderBifurcation(
      imageData,
      { rMin: 2.4, rMax: 2.9 },
      100,
      100,
      [255, 255, 255]
    );

    for (let px = 0; px < width; px++) {
      let litRows = 0;
      for (let py = 0; py < height; py++) {
        const offset = (py * width + px) * 4;
        if (imageData.data[offset] === 255) {
          litRows++;
        }
      }
      expect(litRows).toBeLessThanOrEqual(2);
    }
  });

  it("draws a spread of points once chaos sets in near r = 4", () => {
    const width = 20;
    const height = 60;
    const imageData = {
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    } as ImageData;
    renderBifurcation(
      imageData,
      { rMin: 3.95, rMax: 4.0 },
      200,
      200,
      [255, 255, 255]
    );

    const lastColumnOffset = (height - 1) * width * 4 + (width - 1) * 4;
    let litRows = 0;
    for (let py = 0; py < height; py++) {
      const offset = (py * width + (width - 1)) * 4;
      if (imageData.data[offset] === 255) {
        litRows++;
      }
    }
    expect(litRows).toBeGreaterThan(5);
    expect(imageData.data[lastColumnOffset]).toBeDefined();
  });
});
