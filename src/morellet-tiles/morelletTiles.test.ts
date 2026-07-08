import { describe, expect, it } from "vitest";
import {
  colorPercentages,
  colorWeightTotal,
  countTilesByColor,
  createSeededRandom,
  DEFAULT_COLOR_WEIGHTS,
  exactColorCounts,
  fitArtworkToViewport,
  generateMorelletTiles,
  gridPixelSpan,
  normalizeColorWeights,
  pickWeightedTileColor,
  colsForGoldenRows,
  rowsForGoldenCols,
  snapGridToGoldenRatio,
} from "./morelletTiles";

describe("morelletTiles", () => {
  it("is deterministic for the same seed", () => {
    const params = {
      cols: 20,
      rows: 15,
      cellSize: 8,
      gutter: 1,
      colorWeights: DEFAULT_COLOR_WEIGHTS,
      seed: 42,
    };
    const first = generateMorelletTiles(params);
    const second = generateMorelletTiles(params);
    expect(first.cells).toEqual(second.cells);
  });

  it("produces different layouts for different seeds", () => {
    const base = {
      cols: 20,
      rows: 15,
      cellSize: 8,
      gutter: 0,
      colorWeights: DEFAULT_COLOR_WEIGHTS,
    };
    const a = generateMorelletTiles({ ...base, seed: 1 });
    const b = generateMorelletTiles({ ...base, seed: 2 });
    expect(a.cells).not.toEqual(b.cells);
  });

  it("generates the requested number of cells", () => {
    const artwork = generateMorelletTiles({
      cols: 30,
      rows: 25,
      cellSize: 6,
      gutter: 2,
      colorWeights: DEFAULT_COLOR_WEIGHTS,
      seed: 9,
    });
    expect(artwork.cells).toHaveLength(30 * 25);
  });

  it("normalizes color weights and computes percentages", () => {
    const normalized = normalizeColorWeights({
      red: 50,
      green: 0,
      blue: 50,
      orange: 0,
    });
    expect(colorWeightTotal(normalized)).toBe(100);
    const percentages = colorPercentages(normalized);
    expect(percentages.red).toBeCloseTo(50);
    expect(percentages.blue).toBeCloseTo(50);
  });

  it("falls back to defaults when all weights are zero", () => {
    const normalized = normalizeColorWeights({
      red: 0,
      green: 0,
      blue: 0,
      orange: 0,
    });
    expect(normalized).toEqual(DEFAULT_COLOR_WEIGHTS);
  });

  it("picks only from colors with positive weight", () => {
    const rng = createSeededRandom(5);
    for (let i = 0; i < 50; i++) {
      const color = pickWeightedTileColor(rng, {
        red: 0,
        green: 0,
        blue: 100,
        orange: 0,
      });
      expect(color).toBe("blue");
    }
  });

  it("includes gutter spacing in the output dimensions", () => {
    expect(gridPixelSpan(60, 8, 0)).toBe(480);
    expect(gridPixelSpan(60, 8, 1)).toBe(539);
    expect(gridPixelSpan(60, 8, 5)).toBe(775);
  });

  it("fits artwork inside the viewport without changing aspect ratio", () => {
    const fit = fitArtworkToViewport(480, 240, 800, 600);
    expect(fit.scale).toBeCloseTo(800 / 480);
    expect(fit.drawWidth).toBeCloseTo(480 * fit.scale);
    expect(fit.drawHeight).toBeCloseTo(240 * fit.scale);
    expect(fit.offsetX).toBeCloseTo((800 - fit.drawWidth) / 2);
    expect(fit.offsetY).toBeCloseTo((600 - fit.drawHeight) / 2);
  });

  it("allocates exact color counts that sum to the total", () => {
    const counts = exactColorCounts(100, {
      red: 45,
      green: 5,
      blue: 45,
      orange: 5,
    });
    expect(counts.red + counts.green + counts.blue + counts.orange).toBe(100);
    expect(counts.red).toBe(45);
    expect(counts.green).toBe(5);
    expect(counts.blue).toBe(45);
    expect(counts.orange).toBe(5);
  });

  it("distributes remainders when percentages do not divide evenly", () => {
    const counts = exactColorCounts(10, {
      red: 1,
      green: 1,
      blue: 1,
      orange: 0,
    });
    expect(counts.red + counts.green + counts.blue + counts.orange).toBe(10);
    expect(counts.orange).toBe(0);
  });

  it("produces tile counts matching the requested mix in exact mode", () => {
    const artwork = generateMorelletTiles({
      cols: 20,
      rows: 20,
      cellSize: 8,
      gutter: 1,
      colorWeights: { red: 45, green: 5, blue: 45, orange: 5 },
      exactMix: true,
      seed: 7,
    });
    const counts = countTilesByColor(artwork.cells);
    const expected = exactColorCounts(400, {
      red: 45,
      green: 5,
      blue: 45,
      orange: 5,
    });
    expect(counts).toEqual(expected);
    expect(counts.red + counts.green + counts.blue + counts.orange).toBe(400);
  });

  it("derives golden-ratio grid dimensions from width", () => {
    expect(rowsForGoldenCols(60)).toBe(37);
    expect(colsForGoldenRows(37)).toBe(60);
    expect(snapGridToGoldenRatio(60)).toEqual({ cols: 60, rows: 37 });
    expect(rowsForGoldenCols(60, "vertical-long")).toBe(97);
    expect(colsForGoldenRows(97, "vertical-long")).toBe(60);
    expect(snapGridToGoldenRatio(60, "vertical-long")).toEqual({
      cols: 60,
      rows: 97,
    });
  });
});
