import { describe, expect, it } from "vitest";
import { buildPythagorasTree, Point, squareFromEdge } from "./pythagorastree";

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

describe("squareFromEdge", () => {
  it("produces a true square: 4 equal sides and perpendicular adjacent sides", () => {
    const [p1, p2, p3, p4] = squareFromEdge({ x: 0, y: 0 }, { x: 10, y: 0 });
    const sideA = dist(p1, p2);
    const sideB = dist(p2, p3);
    const sideC = dist(p3, p4);
    const sideD = dist(p4, p1);
    expect(sideB).toBeCloseTo(sideA);
    expect(sideC).toBeCloseTo(sideA);
    expect(sideD).toBeCloseTo(sideA);

    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    expect(dot).toBeCloseTo(0);
  });
});

describe("buildPythagorasTree leg-length identity", () => {
  it("satisfies leg1^2 + leg2^2 = hypotenuse^2 for several angles, independent of rotation direction", () => {
    const root1: Point = { x: 0, y: 0 };
    const root2: Point = { x: 20, y: 0 };
    const L = dist(root1, root2);

    for (const angleDeg of [15, 30, 45, 60, 75]) {
      const angleRad = (angleDeg * Math.PI) / 180;
      const squares = buildPythagorasTree(root1, root2, 1, angleRad);
      // squares[0] = root, squares[1] = left child, squares[2] = right child
      const leftChild = squares[1];
      const rightChild = squares[2];
      const apex = leftChild.corners[1]; // p2 of the left child edge is the apex
      expect(rightChild.corners[0]).toEqual(apex);

      const legA = dist(root1, apex);
      const legB = dist(apex, root2);
      expect(legA * legA + legB * legB).toBeCloseTo(L * L, 5);
    }
  });

  it("at the symmetric 45-degree angle, both children have equal side length", () => {
    const root1: Point = { x: 0, y: 0 };
    const root2: Point = { x: 20, y: 0 };
    const squares = buildPythagorasTree(root1, root2, 1, Math.PI / 4);
    const leftSide = dist(squares[1].corners[0], squares[1].corners[1]);
    const rightSide = dist(squares[2].corners[0], squares[2].corners[1]);
    expect(leftSide).toBeCloseTo(rightSide, 5);
    expect(leftSide).toBeCloseTo(20 / Math.SQRT2, 5);
  });

  it("at 45 degrees, the apex sits directly above the midpoint of the root edge", () => {
    const root1: Point = { x: 0, y: 0 };
    const root2: Point = { x: 20, y: 0 };
    const squares = buildPythagorasTree(root1, root2, 1, Math.PI / 4);
    const apex = squares[1].corners[1];
    expect(apex.x).toBeCloseTo(10, 5);
  });
});

describe("buildPythagorasTree structure", () => {
  it("depth 0 returns exactly the root square and nothing else", () => {
    const squares = buildPythagorasTree({ x: 0, y: 0 }, { x: 10, y: 0 }, 0, Math.PI / 4);
    expect(squares.length).toBe(1);
    expect(squares[0].depth).toBe(0);
    expect(squares[0].branch).toBe("root");
  });

  it("produces exactly 2^(depth+1)-1 squares", () => {
    for (const depth of [1, 2, 3, 5]) {
      const squares = buildPythagorasTree({ x: 0, y: 0 }, { x: 10, y: 0 }, depth, Math.PI / 4);
      expect(squares.length).toBe(2 ** (depth + 1) - 1);
    }
  });

  it("never produces NaN or Infinity near the clamped angle bounds", () => {
    for (const angleDeg of [10, 80]) {
      const squares = buildPythagorasTree(
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        6,
        (angleDeg * Math.PI) / 180
      );
      for (const square of squares) {
        for (const corner of square.corners) {
          expect(Number.isFinite(corner.x)).toBe(true);
          expect(Number.isFinite(corner.y)).toBe(true);
        }
      }
    }
  });
});
