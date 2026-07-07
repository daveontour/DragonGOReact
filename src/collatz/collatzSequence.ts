export const MIN_COLLATZ_START = 1n;
export const MAX_COLLATZ_START = 10_000_000n;
export const DEFAULT_COLLATZ_START = 27n;
export const MAX_COLLATZ_STEPS = 100_000;
export const MAX_COLLATZ_RANGE_SIZE = 5000;
export const DEFAULT_COLLATZ_RANGE_LOWER = 1n;
export const DEFAULT_COLLATZ_RANGE_UPPER = 100n;

export type CollatzPlotMode = "single" | "range";
export interface CollatzStats {
  sequence: bigint[];
  steps: number;
  peak: bigint;
  reachedOne: boolean;
}

export function clampCollatzStart(value: bigint): bigint {
  if (value < MIN_COLLATZ_START) {
    return MIN_COLLATZ_START;
  }
  if (value > MAX_COLLATZ_START) {
    return MAX_COLLATZ_START;
  }
  return value;
}

export function parseCollatzStart(raw: string): bigint | null {
  if (!/^\d+$/.test(raw.trim())) {
    return null;
  }
  try {
    return clampCollatzStart(BigInt(raw.trim()));
  } catch {
    return null;
  }
}

export function collatzNext(n: bigint): bigint {
  return n % 2n === 0n ? n / 2n : 3n * n + 1n;
}

export function collatzStoppingTime(start: bigint): {
  steps: number;
  reachedOne: boolean;
} {
  let current = clampCollatzStart(start);
  let steps = 0;

  while (current !== 1n && steps < MAX_COLLATZ_STEPS) {
    current = collatzNext(current);
    steps++;
  }

  return {
    steps,
    reachedOne: current === 1n,
  };
}

/** Number of values in the Collatz sequence (includes the starting value). */
export function collatzSequenceLength(start: bigint): number {
  return collatzStoppingTime(start).steps + 1;
}

export interface RangeLengthPoint {
  start: bigint;
  length: number;
}

export function parseCollatzRange(
  lowerRaw: string,
  upperRaw: string
): { lower: bigint; upper: bigint } | null {
  const lower = parseCollatzStart(lowerRaw);
  const upper = parseCollatzStart(upperRaw);
  if (lower === null || upper === null) {
    return null;
  }

  const rangeLower = lower <= upper ? lower : upper;
  const rangeUpper = lower <= upper ? upper : lower;

  if (rangeUpper - rangeLower + 1n > BigInt(MAX_COLLATZ_RANGE_SIZE)) {
    return null;
  }

  return { lower: rangeLower, upper: rangeUpper };
}

export function collatzRangeLengths(
  lower: bigint,
  upper: bigint
): RangeLengthPoint[] {
  const rangeLower = lower <= upper ? lower : upper;
  const rangeUpper = lower <= upper ? upper : lower;
  const points: RangeLengthPoint[] = [];

  for (let n = rangeLower; n <= rangeUpper; n++) {
    points.push({
      start: n,
      length: collatzSequenceLength(n),
    });
  }

  return points;
}

export interface RangeChartPoint {
  start: bigint;
  length: number;
  x: number;
  y: number;
}

export function buildRangeLengthChartPoints(
  points: RangeLengthPoint[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number }
): RangeChartPoint[] {
  if (points.length === 0) {
    return [];
  }

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const startMin = Number(points[0].start);
  const startMax = Number(points[points.length - 1].start);
  const lengthMin = Math.min(...points.map((point) => point.length));
  const lengthMax = Math.max(...points.map((point) => point.length), 1);
  const startSpan = startMax - startMin;

  return points.map((point) => {
    const startNumber = Number(point.start);
    const x =
      padding.left +
      (points.length === 1 || startSpan === 0
        ? plotWidth / 2
        : ((startNumber - startMin) / startSpan) * plotWidth);
    const y =
      padding.top +
      plotHeight -
      ((point.length - lengthMin) / (lengthMax - lengthMin || 1)) * plotHeight;
    return { start: point.start, length: point.length, x, y };
  });
}

export function rangeChartPolyline(points: RangeChartPoint[]): string {
  if (points.length === 0) {
    return "";
  }
  const [first, ...rest] = points;
  return (
    `M ${first.x} ${first.y} ` +
    rest.map((point) => `L ${point.x} ${point.y}`).join(" ")
  );
}
export function collatzSequence(start: bigint): CollatzStats {
  const normalizedStart = clampCollatzStart(start);
  const sequence: bigint[] = [normalizedStart];
  let peak = normalizedStart;
  let current = normalizedStart;

  while (current !== 1n && sequence.length < MAX_COLLATZ_STEPS) {
    current = collatzNext(current);
    sequence.push(current);
    if (current > peak) {
      peak = current;
    }
  }

  return {
    sequence,
    steps: sequence.length - 1,
    peak,
    reachedOne: sequence[sequence.length - 1] === 1n,
  };
}

/** log10 for chart scaling; works beyond Number.MAX_SAFE_INTEGER. */
export function bigintLog10(value: bigint): number {
  if (value <= 0n) {
    return 0;
  }
  const digits = value.toString();
  if (digits.length === 1) {
    return Math.log10(Number(digits));
  }
  const mantissa = Number(
    `${digits[0]}.${digits.substring(1, 3).padEnd(2, "0")}`
  );
  return Math.log10(mantissa) + digits.length - 1;
}

export interface ChartPoint {
  step: number;
  value: bigint;
  x: number;
  y: number;
}

export function buildCollatzChartPoints(
  sequence: bigint[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number }
): ChartPoint[] {
  if (sequence.length === 0) {
    return [];
  }

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const logs = sequence.map(bigintLog10);
  const minLog = 0;
  const maxLog = Math.max(...logs, 1);

  return sequence.map((value, step) => {
    const x =
      padding.left +
      (sequence.length === 1 ? 0 : (step / (sequence.length - 1)) * plotWidth);
    const log = bigintLog10(value);
    const y =
      padding.top +
      plotHeight -
      ((log - minLog) / (maxLog - minLog || 1)) * plotHeight;
    return { step, value, x, y };
  });
}

export function chartPolyline(points: ChartPoint[]): string {
  if (points.length === 0) {
    return "";
  }
  const [first, ...rest] = points;
  return (
    `M ${first.x} ${first.y} ` +
    rest.map((point) => `L ${point.x} ${point.y}`).join(" ")
  );
}

export function formatCollatzValue(value: bigint): string {
  return value.toLocaleString("en-US");
}
