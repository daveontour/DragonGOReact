export const BELOWRIGHT = 0;
export const ABOVERIGHT = 1;
export const ABOVELEFT = 2;
export const BELOWLEFT = 3;

export const TOPLEFT = 0;
export const TOPRIGHT = 1;
export const BOTTOMRIGHT = 2;
export const BOTTOMLEFT = 3;

export const UP = 0;
export const RIGHT = 1;
export const DOWN = 2;
export const LEFT = 3;
export const RANDOM = 4;

export const INSIDE = 0;
export const ACTIVE = 1;
export const OUTSIDE = 2;

export const RadiusDefault = 10.0;

export interface RequestConfig {
  OutSideFill: boolean;
  OutSideStroke: boolean;
  InsideFill: boolean;
  InsideStroke: boolean;
  ActiveFill: boolean;
  ActiveStroke: boolean;
  PathStroke: boolean;
  GridLines: boolean;
  NumberFolds: number;
  Radius: number;
  StartDirection: number;
  CellType: string;
  OriginX: number;
  OrignY: number;
  Margin: number;
  // InsideStrokeColor:     color.RGBA
  // InsideFillColor:       color.RGBA
  // OutsideStrokeColor:    color.RGBA
  // OutsideFillColor:      color.RGBA
  // ActiveStrokeColor:     color.RGBA
  // ActiveFillColor:       color.RGBA
  // PathStrokeColor:       color.RGBA
  // GroutingColor:         color.RGBA
  InsideStrokeColorRaw: string;
  InsideFillColorRaw: string;
  OutsideStrokeColorRaw: string;
  OutsideFillColorRaw: string;
  ActiveStrokeColorRaw: string;
  ActiveFillColorRaw: string;
  PathStrokeColorRaw: string;
  GroutingColorRaw: string;
  InsideStrokeWidth: number;
  OutsideStrokeWidth: number;
  ActiveStrokeWidth: number;
  PathWidth: number;
  Grouting: number;
  TriangleAngle: number;
  Format: string;
}

let CacheMap: { [key: string]: Uint8Array } = {};

const Pallette: [number, number, number, number][] = [
  [0, 0, 0, 255],
  [255, 0, 0, 255],
  [0, 255, 0, 255],
  [0, 0, 255, 255],
  [255, 255, 0, 255],
  [255, 0, 255, 255],
  [0, 255, 255, 255],
  [255, 255, 255, 255],
];
const AltPalette: [number, number, number, number][] = [[0, 0, 0, 255]];
let ColorIndex = 0;

class Point {
  constructor(public X: number, public Y: number) {}
}

class Point2 {
  constructor(public x: number, public y: number) {}
}

export class Cell {
  Row!: number;
  Col!: number;
  P1: Point;
  P2: Point;
  FillState!: any;
  Turn!: number;
  Direction!: number;
  StartCorner!: number;
  EndCorner!: number;
  StartEdge!: number;
  EndEdge!: number;
  KnuthType!: number;
  KStart!: number;
  KEnd!: number;
  Color: [number, number, number, number];

  constructor() {
    this.P1 = new Point(0, 0);
    this.P2 = new Point(0, 0);
    this.Color = [0, 0, 0, 0];
  }

  toString(): string {
    return `Row: ${this.Row}, Col: ${this.Col}, FillState: ${this.FillState}, Turn: ${this.Turn}, Direction: ${this.Direction}, StartCorner: ${this.StartCorner}, EndCorner: ${this.EndCorner}`;
  }

  Rotate90() {
    this.StartCorner = (this.StartCorner + 1) % 4;
    this.EndCorner = (this.EndCorner + 1) % 4;
    this.Direction = (this.Direction + 1) % 4;
  }

  Rotate180() {
    this.Rotate90();
    this.Rotate90();
  }

  Rotate270() {
    this.Rotate180();
    this.Rotate90();
  }

  SetAbsoluteCornersWithGrouting(
    radius: number,
    rowOffset: number,
    colOffset: number,
    originX: number,
    originY: number,
    grouting: number
  ) {
    if (this.StartCorner === TOPLEFT) {
      this.P1 = new Point(
        this.Col * (radius + grouting) + colOffset + originX,
        this.Row * (radius + grouting) + rowOffset + originY
      );
    }
    if (this.StartCorner === TOPRIGHT) {
      this.P1 = new Point(
        (this.Col + 1) * (radius + grouting) + colOffset + originX - grouting,
        this.Row * (radius + grouting) + rowOffset + originY
      );
    }
    if (this.StartCorner === BOTTOMLEFT) {
      this.P1 = new Point(
        this.Col * (radius + grouting) + colOffset + originX,
        (this.Row + 1) * (radius + grouting) + rowOffset + originY - grouting
      );
    }
    if (this.StartCorner === BOTTOMRIGHT) {
      this.P1 = new Point(
        (this.Col + 1) * (radius + grouting) + colOffset + originX - grouting,
        (this.Row + 1) * (radius + grouting) + rowOffset + originY - grouting
      );
    }

    if (this.EndCorner === TOPLEFT) {
      this.P2 = new Point(this.P1.X - radius, this.P1.Y - radius);
    }
    if (this.EndCorner === TOPRIGHT) {
      this.P2 = new Point(this.P1.X + radius, this.P1.Y - radius);
    }
    if (this.EndCorner === BOTTOMLEFT) {
      this.P2 = new Point(this.P1.X - radius, this.P1.Y + radius);
    }
    if (this.EndCorner === BOTTOMRIGHT) {
      this.P2 = new Point(this.P1.X + radius, this.P1.Y + radius);
    }
  }
}

function getRandomColor(): [number, number, number, number] {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const a = Math.floor(Math.random() * 256);
  return [r, g, b, a];
}

function getRandomboolean(): boolean {
  return Math.random() >= 0.5;
}

function parseColor(
  colorString: string
): [number, number, number, number] | Error {
  colorString = "#" + colorString;

  if (colorString.length !== 9 || colorString[0] !== "#") {
    if (colorString.length === 7) {
      colorString = colorString + "ff";
    } else {
      return new Error("invalid color string");
    }
  }

  try {
    const r = parseInt(colorString.substring(1, 3), 16);
    const g = parseInt(colorString.substring(3, 5), 16);
    const b = parseInt(colorString.substring(5, 7), 16);
    const a = parseInt(colorString.substring(7, 9), 16);
    return [r, g, b, a];
  } catch (error) {
    return new Error("error parsing color");
  }
}

function getNextPoint(
  p: Point,
  radius: number,
  turn: number,
  dir: number
): [Point, number] {
  if (turn === LEFT && dir === UP) {
    return [new Point(p.X - radius, p.Y - radius), LEFT];
  }
  if (turn === RIGHT && dir === UP) {
    return [new Point(p.X + radius, p.Y - radius), RIGHT];
  }
  if (turn === LEFT && dir === DOWN) {
    return [new Point(p.X + radius, p.Y + radius), RIGHT];
  }
  if (turn === RIGHT && dir === DOWN) {
    return [new Point(p.X - radius, p.Y + radius), LEFT];
  }
  if (turn === LEFT && dir === LEFT) {
    return [new Point(p.X - radius, p.Y + radius), DOWN];
  }
  if (turn === RIGHT && dir === LEFT) {
    return [new Point(p.X - radius, p.Y - radius), UP];
  }
  if (turn === LEFT && dir === RIGHT) {
    return [new Point(p.X + radius, p.Y - radius), UP];
  }
  if (turn === RIGHT && dir === RIGHT) {
    return [new Point(p.X + radius, p.Y + radius), DOWN];
  }
  return [new Point(0, 0), 0];
}

export function fillConnected(grid: Cell[][]) {
  const rows = grid.length;
  const cols = grid[0].length;

  const queue: Point2[] = [new Point2(0, 0)];

  while (queue.length > 0) {
    const point = queue.shift()!;

    if (
      point.x < 0 ||
      point.y < 0 ||
      point.x >= rows ||
      point.y >= cols ||
      grid[point.x][point.y].FillState === 1 ||
      grid[point.x][point.y].FillState === OUTSIDE
    ) {
      continue;
    }

    grid[point.x][point.y].FillState = OUTSIDE;

    queue.push(
      new Point2(point.x + 1, point.y),
      new Point2(point.x - 1, point.y),
      new Point2(point.x, point.y + 1),
      new Point2(point.x, point.y - 1)
    );
  }
}

export function calculateTurns(n: number): number[] {
  if (n <= 0) {
    return [];
  }

  let turns: number[] = [0];

  for (let i = 1; i <= n; i++) {
    const reversed = reverse(turns);
    for (let j = 0; j < reversed.length; j++) {
      reversed[j] = 1 - reversed[j];
    }
    turns = [...turns, 0, ...reversed];
  }
  return turns.map((turn) => (turn === 0 ? LEFT : RIGHT));
}

function reverse(arr: number[]): number[] {
  return arr.slice().reverse();
}

export function calcCells(
  turns: number[],
  startDir: number
): [Cell[], number, number, number, number] {
  const cells: Cell[] = [];
  let currentCell = new Cell();
  currentCell.Row = 0;
  currentCell.Col = 0;
  currentCell.Direction = startDir;
  currentCell.FillState = ACTIVE;
  currentCell.Turn = turns[0];
  currentCell.KnuthType = -1;
  if (currentCell.Turn === LEFT) {
    currentCell.StartCorner = BOTTOMRIGHT;
    currentCell.EndCorner = TOPLEFT;
  }
  if (currentCell.Turn === RIGHT) {
    currentCell.StartCorner = BOTTOMLEFT;
    currentCell.EndCorner = TOPRIGHT;
  }

  cells.push(currentCell);

  let minRow = 0;
  let minCol = 0;
  let maxRow = 0;
  let maxCol = 0;

  for (let i = 1; i < turns.length - 1; i++) {
    const turn = turns[i];
    const newCell = new Cell();
    newCell.FillState = ACTIVE;
    newCell.KnuthType = -1;

    if (turn === LEFT) {
      newCell.Turn = LEFT;
      if (currentCell.Direction === UP) {
        newCell.Direction = LEFT;
        newCell.StartCorner = BOTTOMRIGHT;
        newCell.EndCorner = TOPLEFT;
        if (currentCell.EndCorner === TOPLEFT) {
          newCell.Row = currentCell.Row - 1;
          newCell.Col = currentCell.Col - 1;
        } else if (currentCell.EndCorner === TOPRIGHT) {
          newCell.Row = currentCell.Row - 1;
          newCell.Col = currentCell.Col;
        }
      } else if (currentCell.Direction === RIGHT) {
        newCell.Direction = UP;
        newCell.StartCorner = BOTTOMLEFT;
        newCell.EndCorner = TOPRIGHT;
        if (currentCell.EndCorner === TOPRIGHT) {
          newCell.Row = currentCell.Row - 1;
          newCell.Col = currentCell.Col + 1;
        } else if (currentCell.EndCorner === BOTTOMRIGHT) {
          newCell.Row = currentCell.Row;
          newCell.Col = currentCell.Col + 1;
        }
      } else if (currentCell.Direction === DOWN) {
        newCell.Direction = RIGHT;
        newCell.StartCorner = TOPLEFT;
        newCell.EndCorner = BOTTOMRIGHT;
        if (currentCell.EndCorner === BOTTOMRIGHT) {
          newCell.Row = currentCell.Row + 1;
          newCell.Col = currentCell.Col + 1;
        } else if (currentCell.EndCorner === BOTTOMLEFT) {
          newCell.Row = currentCell.Row + 1;
          newCell.Col = currentCell.Col;
        }
      } else if (currentCell.Direction === LEFT) {
        newCell.Direction = DOWN;
        newCell.StartCorner = TOPRIGHT;
        newCell.EndCorner = BOTTOMLEFT;
        if (currentCell.EndCorner === BOTTOMLEFT) {
          newCell.Row = currentCell.Row + 1;
          newCell.Col = currentCell.Col - 1;
        } else if (currentCell.EndCorner === TOPLEFT) {
          newCell.Row = currentCell.Row;
          newCell.Col = currentCell.Col - 1;
        }
      }
    } else if (turn === RIGHT) {
      newCell.Turn = RIGHT;
      if (currentCell.Direction === UP) {
        newCell.Direction = RIGHT;
        newCell.StartCorner = BOTTOMLEFT;
        newCell.EndCorner = TOPRIGHT;
        if (currentCell.EndCorner === TOPLEFT) {
          newCell.Row = currentCell.Row - 1;
          newCell.Col = currentCell.Col;
        } else if (currentCell.EndCorner === TOPRIGHT) {
          newCell.Row = currentCell.Row - 1;
          newCell.Col = currentCell.Col + 1;
        }
      } else if (currentCell.Direction === RIGHT) {
        newCell.Direction = DOWN;
        newCell.StartCorner = TOPLEFT;
        newCell.EndCorner = BOTTOMRIGHT;
        if (currentCell.EndCorner === TOPRIGHT) {
          newCell.Row = currentCell.Row;
          newCell.Col = currentCell.Col + 1;
        } else if (currentCell.EndCorner === BOTTOMRIGHT) {
          newCell.Row = currentCell.Row + 1;
          newCell.Col = currentCell.Col + 1;
        }
      } else if (currentCell.Direction === DOWN) {
        newCell.Direction = LEFT;
        newCell.StartCorner = TOPRIGHT;
        newCell.EndCorner = BOTTOMLEFT;
        if (currentCell.EndCorner === BOTTOMRIGHT) {
          newCell.Row = currentCell.Row + 1;
          newCell.Col = currentCell.Col;
        } else if (currentCell.EndCorner === BOTTOMLEFT) {
          newCell.Row = currentCell.Row + 1;
          newCell.Col = currentCell.Col - 1;
        }
      } else if (currentCell.Direction === LEFT) {
        newCell.Direction = UP;
        newCell.StartCorner = BOTTOMRIGHT;
        newCell.EndCorner = TOPLEFT;
        if (currentCell.EndCorner === BOTTOMLEFT) {
          newCell.Row = currentCell.Row;
          newCell.Col = currentCell.Col - 1;
        } else if (currentCell.EndCorner === TOPLEFT) {
          newCell.Row = currentCell.Row - 1;
          newCell.Col = currentCell.Col - 1;
        }
      }
    }

    if (newCell.Col < minCol) {
      minCol = newCell.Col;
    }
    if (newCell.Row < minRow) {
      minRow = newCell.Row;
    }
    if (newCell.Col > maxCol) {
      maxCol = newCell.Col;
    }
    if (newCell.Row > maxRow) {
      maxRow = newCell.Row;
    }

    cells.push(newCell);

    currentCell = newCell;
  }

  return [cells, minRow, minCol, maxRow, maxCol];
}

export function calcCellsKnuth(
  turns: number[],
  startDir: number
): [Cell[], number, number, number, number] {
  const cells: Cell[] = [];

  let currentCell = new Cell();
  currentCell.Row = 0;
  currentCell.Col = 0;
  currentCell.Direction = startDir;
  currentCell.KEnd = startDir;
  currentCell.KnuthType = 0;
  currentCell.FillState = OUTSIDE;
  currentCell.Turn = turns[0];

  cells.push(currentCell);

  let minRow = 0;
  let minCol = 0;
  let maxRow = 0;
  let maxCol = 0;

  for (let i = 1; i < turns.length - 1; i++) {
    const turn = turns[i];
    const newCell = new Cell();
    newCell.FillState = OUTSIDE;
    newCell.KnuthType = 0;

    if (currentCell.KEnd === DOWN) {
      newCell.FillState = ACTIVE;
      newCell.KStart = UP;
      newCell.Row = currentCell.Row + 1;
      newCell.Col = currentCell.Col;
      if (turn === LEFT) {
        newCell.KEnd = RIGHT;
        newCell.KnuthType = 3;
      } else {
        newCell.KEnd = LEFT;
        newCell.KnuthType = 4;
      }
    } else if (currentCell.KEnd === UP) {
      newCell.FillState = ACTIVE;
      newCell.KStart = DOWN;
      newCell.Row = currentCell.Row - 1;
      newCell.Col = currentCell.Col;
      if (turn === LEFT) {
        newCell.KEnd = LEFT;
        newCell.KnuthType = 1;
      } else {
        newCell.KEnd = RIGHT;
        newCell.KnuthType = 2;
      }
    } else if (currentCell.KEnd === LEFT) {
      newCell.FillState = ACTIVE;
      newCell.KStart = RIGHT;
      newCell.Row = currentCell.Row;
      newCell.Col = currentCell.Col - 1;
      if (turn === LEFT) {
        newCell.KEnd = DOWN;
        newCell.KnuthType = 2;
      } else {
        newCell.KEnd = UP;
        newCell.KnuthType = 3;
      }
    } else if (currentCell.KEnd === RIGHT) {
      newCell.FillState = ACTIVE;
      newCell.KStart = LEFT;
      newCell.Row = currentCell.Row;
      newCell.Col = currentCell.Col + 1;
      if (turn === LEFT) {
        newCell.KEnd = UP;
        newCell.KnuthType = 4;
      } else {
        newCell.KEnd = DOWN;
        newCell.KnuthType = 1;
      }
    }

    if (newCell.Col < minCol) {
      minCol = newCell.Col;
    }
    if (newCell.Row < minRow) {
      minRow = newCell.Row;
    }
    if (newCell.Col > maxCol) {
      maxCol = newCell.Col;
    }
    if (newCell.Row > maxRow) {
      maxRow = newCell.Row;
    }

    cells.push(newCell);

    currentCell = newCell;
  }

  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (cells[i].Row === cells[j].Row && cells[i].Col === cells[j].Col) {
        if (cells[i].KnuthType === 1 || cells[i].KnuthType === 3) {
          cells[i].KnuthType = 5;
          cells.splice(j, 1);
          break;
        }
        if (cells[i].KnuthType === 2 || cells[i].KnuthType === 4) {
          cells[i].KnuthType = 6;
          cells.splice(j, 1);
          break;
        }
      }
    }
  }

  return [cells, minRow, minCol, maxRow, maxCol];
}

export function prepareCells(
  rc: RequestConfig,
  prepareCells: boolean
):
  | [Cell[][], number, number, number, number, number, number]
  | [null, number, number, number, number, number, number] {
  if (rc.NumberFolds <= 0) {
    return [null, 0, 0, 0, 0, 0, 0];
  }

  let turns = calculateTurns(rc.NumberFolds);
  let cells: Cell[];
  let minRow: number, minCol: number, maxRow: number, maxCol: number;

  if (rc.CellType.includes("knuth")) {
    // Assume CalcCellsKnuth is a function that exists in your TypeScript code

    let ck = calcCellsKnuth(turns, rc.StartDirection);
    cells = ck[0];
    minRow = ck[1];
    minCol = ck[2];
    maxRow = ck[3];
    maxCol = ck[4];
  } else {
    // Assume CalcCells is a function that exists in your TypeScript code
    let cc = calcCells(turns, rc.StartDirection);
    cells = cc[0];
    minRow = cc[1];
    minCol = cc[2];
    maxRow = cc[3];
    maxCol = cc[4];
  }

  let width = maxCol - minCol;
  let height = maxRow - minRow;

  if (prepareCells) {
    let arr: Cell[][] = [];

    for (let i = 0; i <= height + 2; i++) {
      let row: Cell[] = [];
      for (let j = 0; j <= width + 2; j++) {
        let cell: Cell = {
          FillState: "INSIDE",
          Row: i,
          Col: j,
          P1: new Point(0, 0),
          P2: new Point(0, 0),
          Turn: 0,
          Direction: 0,
          StartCorner: 0,
          EndCorner: 0,
          StartEdge: 0,
          EndEdge: 0,
          KnuthType: 0,
          KStart: 0,
          KEnd: 0,
          Color: [0, 0, 0, 0],
          Rotate90: function (): void {
            throw new Error("Function not implemented.");
          },
          Rotate180: function (): void {
            throw new Error("Function not implemented.");
          },
          Rotate270: function (): void {
            throw new Error("Function not implemented.");
          },
          SetAbsoluteCornersWithGrouting: function (
            radius: number,
            rowOffset: number,
            colOffset: number,
            originX: number,
            originY: number,
            grouting: number
          ): void {
            throw new Error("Function not implemented.");
          },
        };

        row.push(cell);
      }
      arr.push(row);
    }

    let colOffset = -minCol + 1;
    let rowOffset = -minRow + 1;

    cells.forEach((cell, idx) => {
      cell.Color = AltPalette[idx % AltPalette.length];
      cell.Row += rowOffset;
      cell.Col += colOffset;
      arr[cell.Row][cell.Col] = cell;
    });

    // Assume FillConnected is a function that exists in your TypeScript code
    fillConnected(arr);
    return [arr, width, height, minRow, minCol, maxRow, maxCol];
  }

  return [null, width, height, minRow, minCol, maxRow, maxCol];
}

// Helper functions like calculateTurns, calcCells, calcCellsKnuth, and fillConnected need to be defined in TypeScript.
