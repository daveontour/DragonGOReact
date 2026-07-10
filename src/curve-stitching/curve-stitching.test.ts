import { describe, expect, it } from "vitest";
import {
  circleMultiplicationChords,
  clampMultiplierK,
  clampStitchN,
  DEFAULT_MULTIPLIER_K,
  DEFAULT_STITCH_N,
  maxMultiplierFor,
  MIN_MULTIPLIER_K,
  MAX_STITCH_N,
  MIN_STITCH_N,
  parabolaChords,
} from "./curve-stitching";

function hasChord(chords: { from: number; to: number }[], from: number, to: number): boolean {
  return chords.some((c) => c.from === from && c.to === to);
}

describe("curve-stitching", () => {
  it("connects point i to round(i*k) mod n for circle multiplication", () => {
    const chords = circleMultiplicationChords(12, 2);
    expect(hasChord(chords, 6, 0)).toBe(true); // round(6*2)=12, 12 mod 12 = 0
    expect(hasChord(chords, 1, 2)).toBe(true);
    expect(hasChord(chords, 5, 10)).toBe(true);
  });

  it("is self-symmetric about the x-axis: reflecting every chord's endpoints stays in the same pattern", () => {
    const cases: Array<[number, number]> = [
      [12, 2],
      [12, 5],
      [11, 3],
    ];
    for (const [n, k] of cases) {
      const chords = circleMultiplicationChords(n, k);
      for (const chord of chords) {
        const reflectedFrom = (n - chord.from) % n;
        const reflectedTo = (n - chord.to) % n;
        expect(hasChord(chords, reflectedFrom, reflectedTo)).toBe(true);
      }
    }
  });

  it("draws no chords at k=1, where every point maps to itself", () => {
    expect(circleMultiplicationChords(50, 1)).toEqual([]);
  });

  it("matches a hand-computed parabola chord set for n=5, including the odd-n vertex self-pair", () => {
    expect(parabolaChords(5)).toEqual([
      { from: 0, to: 4 },
      { from: 1, to: 3 },
      { from: 2, to: 2 },
      { from: 3, to: 1 },
      { from: 4, to: 0 },
    ]);
  });

  it("does NOT produce mirror-image patterns for k and n-k (a disproven folk claim)", () => {
    // n=12: pattern(5) has 4 distinct chords, pattern(7) has only 3 --
    // different chord counts, so they cannot be mirror images of each
    // other. This guards against that claim being "fixed" back in later.
    expect(circleMultiplicationChords(12, 5).length).not.toBe(
      circleMultiplicationChords(12, 7).length
    );
  });

  it("clamps n and the multiplier k (which depends on n) to their supported ranges", () => {
    expect(clampStitchN(0)).toBe(MIN_STITCH_N);
    expect(clampStitchN(9999)).toBe(MAX_STITCH_N);
    expect(clampStitchN(NaN)).toBe(DEFAULT_STITCH_N);

    expect(maxMultiplierFor(100)).toBe(50);
    expect(clampMultiplierK(0, 100)).toBe(MIN_MULTIPLIER_K);
    expect(clampMultiplierK(9999, 100)).toBe(50);
    expect(clampMultiplierK(NaN, 100)).toBe(DEFAULT_MULTIPLIER_K);
  });
});
