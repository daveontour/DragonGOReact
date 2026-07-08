import { describe, expect, it } from "vitest";
import {
  createSeededRandom,
  DEFAULT_GRID_COLS,
  generateMorellet,
} from "./morellet";

describe("morellet", () => {
  it("is deterministic for the same seed", () => {
    const params = {
      width: 400,
      height: 300,
      cols: DEFAULT_GRID_COLS,
      rows: 10,
      lineWidth: 2,
      pattern: "random-tiles" as const,
      primaryAngle: 45,
      secondaryOffset: 90,
      lineSpacing: 20,
      emptyProbability: 0.1,
      seed: 42,
      showTileGrid: false,
      accentRed: false,
    };
    const first = generateMorellet(params);
    const second = generateMorellet(params);
    expect(first.tiles).toEqual(second.tiles);
  });

  it("produces different tile layouts for different seeds", () => {
    const base = {
      width: 400,
      height: 300,
      cols: 12,
      rows: 8,
      lineWidth: 2,
      pattern: "random-tiles" as const,
      primaryAngle: 45,
      secondaryOffset: 90,
      lineSpacing: 20,
      emptyProbability: 0.1,
      showTileGrid: false,
      accentRed: false,
    };
    const a = generateMorellet({ ...base, seed: 1 });
    const b = generateMorellet({ ...base, seed: 2 });
    expect(a.tiles).not.toEqual(b.tiles);
  });

  it("uses only orthogonal angles in random-tiles mode", () => {
    const artwork = generateMorellet({
      width: 400,
      height: 300,
      cols: 10,
      rows: 8,
      lineWidth: 2,
      pattern: "random-tiles",
      primaryAngle: 45,
      secondaryOffset: 90,
      lineSpacing: 20,
      emptyProbability: 0,
      seed: 5,
      showTileGrid: false,
      accentRed: false,
    });
    expect(artwork.tiles.length).toBeGreaterThan(0);
    for (const tile of artwork.tiles) {
      expect([0, 90]).toContain(tile.angleDeg);
    }
  });

  it("uses six-axis angles in six-axes mode", () => {
    const artwork = generateMorellet({
      width: 400,
      height: 300,
      cols: 8,
      rows: 6,
      lineWidth: 2,
      pattern: "six-axes",
      primaryAngle: 45,
      secondaryOffset: 90,
      lineSpacing: 20,
      emptyProbability: 0,
      seed: 8,
      showTileGrid: false,
      accentRed: false,
    });
    for (const tile of artwork.tiles) {
      expect([0, 30, 60, 90, 120, 150]).toContain(tile.angleDeg);
    }
  });

  it("creates no tiles for crossed-trames mode", () => {
    const artwork = generateMorellet({
      width: 400,
      height: 300,
      cols: 12,
      rows: 8,
      lineWidth: 2,
      pattern: "crossed-trames",
      primaryAngle: 30,
      secondaryOffset: 90,
      lineSpacing: 16,
      emptyProbability: 0.1,
      seed: 3,
      showTileGrid: false,
      accentRed: false,
    });
    expect(artwork.tiles).toEqual([]);
  });

  it("creates seeded random values in range", () => {
    const rng = createSeededRandom(99);
    for (let i = 0; i < 20; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
