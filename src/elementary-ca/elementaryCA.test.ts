import { describe, expect, it } from "vitest";
import {
  clampCARule,
  createInitialRow,
  nextCARow,
  renderElementaryCA,
  ruleToBits,
} from "./elementaryCA";

describe("elementaryCA", () => {
  it("decodes rule 30 into the classic Wolfram truth table", () => {
    const bits = ruleToBits(30);
    expect(bits).toEqual([
      false, // 000
      true, // 001
      true, // 010
      true, // 011
      true, // 100
      false, // 101
      false, // 110
      false, // 111
    ]);
  });

  it("matches the left XOR right rule for rule 90", () => {
    const bits = ruleToBits(90);
    for (let pattern = 0; pattern < 8; pattern++) {
      const left = (pattern >> 2) & 1;
      const right = pattern & 1;
      expect(bits[pattern]).toBe((left ^ right) === 1);
    }
  });

  it("advances a row using the rule's neighborhood table", () => {
    const row = new Uint8Array([0, 0, 1, 0, 0]);
    const next = nextCARow(row, ruleToBits(30));
    expect(next).toHaveLength(5);
    expect(Array.from(next).some((v) => v === 1)).toBe(true);
  });

  it("wraps neighbor lookups across row edges", () => {
    const row = new Uint8Array([1, 0, 0, 0, 1]);
    const bits = ruleToBits(90);
    const next = nextCARow(row, bits);
    // cell 0's neighbors wrap to the last cell (1) and cell 1 (0) -> pattern 100 -> XOR(1,0)=1
    expect(next[0]).toBe(1);
  });

  it("seeds a single live cell in the center", () => {
    const row = createInitialRow(9, "single");
    expect(row[4]).toBe(1);
    expect(row.reduce((sum, v) => sum + v, 0)).toBe(1);
  });

  it("seeds an approximately half-filled random row", () => {
    const row = createInitialRow(2000, "random");
    const liveCount = row.reduce((sum, v) => sum + v, 0);
    expect(liveCount).toBeGreaterThan(700);
    expect(liveCount).toBeLessThan(1300);
  });

  it("clamps rule numbers to the valid 0-255 range", () => {
    expect(clampCARule(-5)).toBe(0);
    expect(clampCARule(999)).toBe(255);
  });

  it("renders a non-trivial image for rule 30 from a single seed", () => {
    const width = 61;
    const height = 30;
    const imageData = {
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    } as ImageData;
    renderElementaryCA(imageData, 30, "single", [255, 255, 255]);

    let litPixels = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 255) {
        litPixels++;
      }
    }
    expect(litPixels).toBeGreaterThan(10);
    // Row 0 should have exactly the single seed cell lit.
    let firstRowLit = 0;
    for (let x = 0; x < width; x++) {
      if (imageData.data[x * 4] === 255) {
        firstRowLit++;
      }
    }
    expect(firstRowLit).toBe(1);
  });
});
