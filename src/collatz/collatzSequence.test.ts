import { describe, expect, it } from "vitest";
import {
  bigintLog10,
  buildCollatzChartPoints,
  collatzNext,
  collatzRangeLengths,
  collatzSequence,
  collatzSequenceLength,
  DEFAULT_COLLATZ_START,
  parseCollatzRange,
} from "./collatzSequence";

describe("collatzSequence", () => {
  it("applies the Collatz rule", () => {
    expect(collatzNext(10n)).toBe(5n);
    expect(collatzNext(5n)).toBe(16n);
  });

  it("reaches 1 for the classic starting value 27", () => {
    const stats = collatzSequence(27n);
    expect(stats.reachedOne).toBe(true);
    expect(stats.sequence[0]).toBe(DEFAULT_COLLATZ_START);
    expect(stats.sequence[stats.sequence.length - 1]).toBe(1n);
    expect(stats.steps).toBe(111);
    expect(stats.peak).toBe(9232n);
  });

  it("handles starting value 1", () => {
    const stats = collatzSequence(1n);
    expect(stats.steps).toBe(0);
    expect(stats.sequence).toEqual([1n]);
  });

  it("builds chart points in order", () => {
    const stats = collatzSequence(6n);
    const points = buildCollatzChartPoints(stats.sequence, 400, 300, {
      top: 20,
      right: 20,
      bottom: 40,
      left: 50,
    });
    expect(points.length).toBe(stats.sequence.length);
    expect(points[0].x).toBeLessThan(points[points.length - 1].x);
  });

  it("computes log10 for large bigints", () => {
    expect(bigintLog10(1000n)).toBeCloseTo(3, 5);
    expect(bigintLog10(9232n)).toBeCloseTo(Math.log10(9232), 3);
  });

  it("computes sequence length without building the full sequence", () => {
    expect(collatzSequenceLength(1n)).toBe(1);
    expect(collatzSequenceLength(27n)).toBe(112);
  });

  it("builds range length data in order", () => {
    const points = collatzRangeLengths(1n, 5n);
    expect(points).toHaveLength(5);
    expect(points[0]).toEqual({ start: 1n, length: 1 });
    expect(points[4].start).toBe(5n);
  });

  it("rejects ranges that are too large", () => {
    expect(parseCollatzRange("1", "10000")).toBeNull();
    expect(parseCollatzRange("1", "100")).not.toBeNull();
  });
});
