export type TourType = "open" | "closed";

export interface CellPos {
  r: number;
  c: number;
}

export interface TourResult {
  board: number[][] | null;
  operations: number;
}

const BOARD_SIZE = 8;
const MAX_OPS = 2_000_000;

const KNIGHT_MOVES: ReadonlyArray<readonly [number, number]> = [
  [2, 1],
  [1, 2],
  [-1, 2],
  [-2, 1],
  [-2, -1],
  [-1, -2],
  [1, -2],
  [2, -1],
];

export function generateRandomKnightsTour(
  startRow: number,
  startCol: number,
  isClosed: boolean
): TourResult {
  const board = Array.from({ length: BOARD_SIZE }, () =>
    Array<number>(BOARD_SIZE).fill(-1)
  );

  let operations = 0;

  function isValid(r: number, c: number): boolean {
    return (
      r >= 0 &&
      r < BOARD_SIZE &&
      c >= 0 &&
      c < BOARD_SIZE &&
      board[r][c] === -1
    );
  }

  function countOnwardMoves(r: number, c: number): number {
    let count = 0;
    for (const [dr, dc] of KNIGHT_MOVES) {
      if (isValid(r + dr, c + dc)) {
        count++;
      }
    }
    return count;
  }

  function solve(r: number, c: number, step: number): boolean {
    operations++;
    if (operations > MAX_OPS) {
      return false;
    }

    if (step === BOARD_SIZE * BOARD_SIZE - 1) {
      if (!isClosed) {
        return true;
      }
      for (const [dr, dc] of KNIGHT_MOVES) {
        if (r + dr === startRow && c + dc === startCol) {
          return true;
        }
      }
      return false;
    }

    const shuffledMoves = [...KNIGHT_MOVES].sort(() => Math.random() - 0.5);

    const nextMoves: Array<{ r: number; c: number; onwardMoves: number }> = [];
    for (const [dr, dc] of shuffledMoves) {
      const nextR = r + dr;
      const nextC = c + dc;
      if (isValid(nextR, nextC)) {
        nextMoves.push({
          r: nextR,
          c: nextC,
          onwardMoves: countOnwardMoves(nextR, nextC),
        });
      }
    }

    nextMoves.sort((a, b) => {
      if (a.onwardMoves === b.onwardMoves) {
        return Math.random() - 0.5;
      }
      return a.onwardMoves - b.onwardMoves;
    });

    for (const move of nextMoves) {
      board[move.r][move.c] = step + 1;
      if (solve(move.r, move.c, step + 1)) {
        return true;
      }
      board[move.r][move.c] = -1;
    }

    return false;
  }

  board[startRow][startCol] = 0;

  if (solve(startRow, startCol, 0)) {
    return { board, operations };
  }

  return { board: null, operations };
}

export function boardToSequence(board: number[][]): CellPos[] {
  const sequence: CellPos[] = new Array(BOARD_SIZE * BOARD_SIZE);
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      sequence[board[r][c]] = { r, c };
    }
  }
  return sequence;
}

export const KNIGHTS_TOUR_BOARD_SIZE = BOARD_SIZE;
