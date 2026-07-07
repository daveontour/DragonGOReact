import { describe, expect, it } from "vitest";
import {
  boardToSequence,
  generateRandomKnightsTour,
  KNIGHTS_TOUR_BOARD_SIZE,
} from "./knightsTourAlgorithm";

describe("knightsTourAlgorithm", () => {
  it("finds an open tour from the default corner", () => {
    const result = generateRandomKnightsTour(0, 0, false);
    expect(result.board).not.toBeNull();

    const sequence = boardToSequence(result.board!);
    expect(sequence).toHaveLength(KNIGHTS_TOUR_BOARD_SIZE * KNIGHTS_TOUR_BOARD_SIZE);

    const visited = new Set(sequence.map((pos) => `${pos.r}-${pos.c}`));
    expect(visited.size).toBe(KNIGHTS_TOUR_BOARD_SIZE * KNIGHTS_TOUR_BOARD_SIZE);
  });
});
