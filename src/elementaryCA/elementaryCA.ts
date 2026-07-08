export const MIN_CA_RULE = 0;
export const MAX_CA_RULE = 255;
export const DEFAULT_CA_RULE = 30;
export const FAMOUS_CA_RULES = [30, 90, 110, 184, 54, 60, 150, 222];

export type CAInitialCondition = "single" | "random";

export function ruleToBits(rule: number): boolean[] {
  const bits: boolean[] = [];
  for (let i = 0; i < 8; i++) {
    bits.push(((rule >> i) & 1) === 1);
  }
  return bits;
}

export function nextCARow(row: Uint8Array, ruleBits: boolean[]): Uint8Array {
  const n = row.length;
  const next = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const left = row[(i - 1 + n) % n];
    const center = row[i];
    const right = row[(i + 1) % n];
    const pattern = (left << 2) | (center << 1) | right;
    next[i] = ruleBits[pattern] ? 1 : 0;
  }
  return next;
}

export function createInitialRow(
  width: number,
  condition: CAInitialCondition
): Uint8Array {
  const row = new Uint8Array(width);
  if (condition === "single") {
    row[Math.floor(width / 2)] = 1;
  } else {
    for (let i = 0; i < width; i++) {
      row[i] = Math.random() < 0.5 ? 1 : 0;
    }
  }
  return row;
}

export function clampCARule(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_CA_RULE;
  }
  return Math.min(MAX_CA_RULE, Math.max(MIN_CA_RULE, Math.round(value)));
}

export function renderElementaryCA(
  imageData: ImageData,
  rule: number,
  condition: CAInitialCondition,
  colorRgb: [number, number, number]
): void {
  const { width, height, data } = imageData;
  const ruleBits = ruleToBits(rule);
  let row = createInitialRow(width, condition);
  const [r, g, b] = colorRgb;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      if (row[x]) {
        data[offset] = r;
        data[offset + 1] = g;
        data[offset + 2] = b;
      } else {
        data[offset] = 8;
        data[offset + 1] = 9;
        data[offset + 2] = 16;
      }
      data[offset + 3] = 255;
    }
    row = nextCARow(row, ruleBits);
  }
}
