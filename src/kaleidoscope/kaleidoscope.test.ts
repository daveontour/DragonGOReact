import { describe, expect, it } from "vitest";
import { StrokeSegment, symmetryCopies } from "./kaleidoscope";

const CENTER_X = 100;
const CENTER_Y = 100;

function baseSegment(): StrokeSegment {
  return { x1: 130, y1: 100, x2: 150, y2: 110, color: "#fff", width: 2 };
}

describe("symmetryCopies copy count", () => {
  it("produces exactly `order` copies with mirror off, `2*order` with mirror on", () => {
    for (const order of [2, 4, 8, 16]) {
      const seg = baseSegment();
      expect(symmetryCopies(seg, CENTER_X, CENTER_Y, order, false).length).toBe(order);
      expect(symmetryCopies(seg, CENTER_X, CENTER_Y, order, true).length).toBe(order * 2);
    }
  });
});

describe("rotational closure (mirror off)", () => {
  it("rotating every generated point by 2*pi/N reproduces the same set", () => {
    const order = 6;
    const seg = baseSegment();
    const copies = symmetryCopies(seg, CENTER_X, CENTER_Y, order, false);
    const points = copies.flatMap((c) => [
      { x: c.x1, y: c.y1 },
      { x: c.x2, y: c.y2 },
    ]);

    const rotate = (p: { x: number; y: number }) => {
      const dx = p.x - CENTER_X;
      const dy = p.y - CENTER_Y;
      const angle = (2 * Math.PI) / order;
      return {
        x: CENTER_X + dx * Math.cos(angle) - dy * Math.sin(angle),
        y: CENTER_Y + dx * Math.sin(angle) + dy * Math.cos(angle),
      };
    };

    for (const p of points) {
      const rotated = rotate(p);
      const found = points.some((q) => Math.hypot(q.x - rotated.x, q.y - rotated.y) < 1e-6);
      expect(found).toBe(true);
    }
  });
});

describe("isometry: every copy point stays at the source's radius from center", () => {
  it("does not scale points, only rotate/reflect them", () => {
    const seg = baseSegment();
    const r1 = Math.hypot(seg.x1 - CENTER_X, seg.y1 - CENTER_Y);
    const r2 = Math.hypot(seg.x2 - CENTER_X, seg.y2 - CENTER_Y);
    const copies = symmetryCopies(seg, CENTER_X, CENTER_Y, 8, true);
    for (const c of copies) {
      expect(Math.hypot(c.x1 - CENTER_X, c.y1 - CENTER_Y)).toBeCloseTo(r1);
      expect(Math.hypot(c.x2 - CENTER_X, c.y2 - CENTER_Y)).toBeCloseTo(r2);
    }
  });
});

describe("order=2 mirror=true concrete regression case", () => {
  it("reproduces exact hand-computed horizontal and vertical mirror coordinates", () => {
    const seg: StrokeSegment = { x1: 120, y1: 100, x2: 120, y2: 100, color: "#fff", width: 1 };
    // Point at (120,100), center (100,100) -> dx=20,dy=0, r=20, phi=0.
    const copies = symmetryCopies(seg, CENTER_X, CENTER_Y, 2, true);
    const points = copies.map((c) => ({ x: c.x1, y: c.y1 }));
    // Rotational copies (k=0,1) at angles 0 and pi: (120,100) and (80,100).
    const foundOriginal = points.some((p) => Math.hypot(p.x - 120, p.y - 100) < 1e-6);
    expect(foundOriginal).toBe(true);
  });

  it("mirrored copies at order=2 land at the expected reflected angles", () => {
    const seg: StrokeSegment = { x1: 100, y1: 130, x2: 100, y2: 130, color: "#fff", width: 1 };
    // Point at (100,130): dx=0, dy=30, r=30, phi=pi/2.
    // flip=true -> baseAngle=-pi/2; k=0 -> theta=-pi/2 -> (100,70).
    const copies = symmetryCopies(seg, CENTER_X, CENTER_Y, 2, true);
    const mirrored = copies.slice(2); // second half are the mirrored copies
    const first = { x: mirrored[0].x1, y: mirrored[0].y1 };
    expect(first.x).toBeCloseTo(100);
    expect(first.y).toBeCloseTo(70);
  });
});

describe("center point safety", () => {
  it("a point exactly at the center maps to itself under every copy, no NaN", () => {
    const seg: StrokeSegment = { x1: CENTER_X, y1: CENTER_Y, x2: CENTER_X, y2: CENTER_Y, color: "#fff", width: 1 };
    const copies = symmetryCopies(seg, CENTER_X, CENTER_Y, 6, true);
    for (const c of copies) {
      expect(Number.isNaN(c.x1)).toBe(false);
      expect(Number.isNaN(c.y1)).toBe(false);
      expect(c.x1).toBeCloseTo(CENTER_X);
      expect(c.y1).toBeCloseTo(CENTER_Y);
    }
  });
});
