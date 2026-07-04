import * as common from "./common";

type TemplateCache = string[][][][];

type SvgColor = { color: string; opacity: number };

type PathDrawer = (
  rc: common.RequestConfig,
  turn: number,
  start: number,
  end: number
) => string;

const ACTIVE_TEMPLATE_KEYS: [number, number, number][] = [
  [common.UP, common.TOPLEFT, common.BOTTOMRIGHT],
  [common.UP, common.TOPRIGHT, common.BOTTOMLEFT],
  [common.UP, common.BOTTOMRIGHT, common.TOPLEFT],
  [common.UP, common.BOTTOMLEFT, common.TOPRIGHT],
  [common.RIGHT, common.TOPLEFT, common.BOTTOMRIGHT],
  [common.RIGHT, common.TOPRIGHT, common.BOTTOMLEFT],
  [common.RIGHT, common.BOTTOMRIGHT, common.TOPLEFT],
  [common.RIGHT, common.BOTTOMLEFT, common.TOPRIGHT],
];

function isKnuthCellType(cellType: string): boolean {
  return cellType.includes("knuth");
}

function isActiveFill(fillState: common.Cell["FillState"]): boolean {
  return fillState === common.ACTIVE || fillState === 1 || fillState === "ACTIVE";
}

function isOutsideFill(fillState: common.Cell["FillState"]): boolean {
  return (
    fillState === common.OUTSIDE || fillState === 2 || fillState === "OUTSIDE"
  );
}

function isInsideFill(fillState: common.Cell["FillState"]): boolean {
  return (
    fillState === common.INSIDE || fillState === 0 || fillState === "INSIDE"
  );
}

/** Map fold turns onto the two template orientations (LEFT→0, RIGHT→1). */
function normalizeTurn(turn: number): number {
  return turn === common.LEFT ? common.UP : turn;
}

function computeSvgDimensions(
  width: number,
  height: number,
  rc: common.RequestConfig
): { svgWidth: number; svgHeight: number } {
  return {
    svgWidth:
      2 * rc.Margin + (width + 3) * rc.Radius + (width + 3) * rc.Grouting,
    svgHeight:
      2 * rc.Margin + (height + 3) * rc.Radius + (height + 3) * rc.Grouting,
  };
}

function cellOrigin(
  col: number,
  row: number,
  ox: number,
  oy: number,
  ri: number,
  grouting: number
): { x: number; y: number } {
  return {
    x: ox + col * (ri + grouting) - grouting / 2,
    y: oy + row * (ri + grouting) - grouting / 2,
  };
}

function toSVGColor(s: string): [string, number] {
  if (s === "") {
    return ["#000000", 1];
  }

  if (s[0] === "#" && s.length === 7) {
    return [s, 1];
  }
  if (s[0] === "#" && s.length === 9) {
    const os = s.slice(7);
    const o = parseInt(os, 16) / 255.0;
    return [s.slice(0, 7), o];
  }
  if (s.length === 6) {
    return ["#" + s, 1];
  }
  if (s.length === 8) {
    const c = "#" + s.slice(0, 6);
    const h = parseInt(s.slice(6), 16);
    const o = h / 255.0;
    return [c, o];
  }
  return ["#000000", 1];
}

function resolveStyleColor(
  enabled: boolean,
  raw: string,
  defaults: SvgColor
): SvgColor {
  if (!enabled) {
    return defaults;
  }
  const [color, opacity] = toSVGColor(raw);
  return { color, opacity };
}

function buildStyleBlock(rc: common.RequestConfig): string {
  const insideFill = resolveStyleColor(rc.InsideFill, rc.InsideFillColorRaw, {
    color: "#ffffff",
    opacity: 0,
  });
  const insideStroke = resolveStyleColor(
    rc.InsideStroke,
    rc.InsideStrokeColorRaw,
    { color: "#ffffff", opacity: 0 }
  );
  const outsideFill = resolveStyleColor(
    rc.OutSideFill,
    rc.OutsideFillColorRaw,
    { color: "#ffffff", opacity: 0 }
  );
  const outsideStroke = resolveStyleColor(
    rc.OutSideStroke,
    rc.OutsideStrokeColorRaw,
    { color: "#ffffff", opacity: 0 }
  );
  const activeFill = resolveStyleColor(
    rc.ActiveFill,
    rc.ActiveFillColorRaw,
    { color: "#ffffff", opacity: 1 }
  );
  const activeStroke = resolveStyleColor(
    rc.ActiveStroke,
    rc.ActiveStrokeColorRaw,
    { color: "#ffffff", opacity: 1 }
  );
  const [bgFillColor, bgOpacity] = toSVGColor(rc.GroutingColorRaw);
  const [pathStrokeColor, pathStrokeOpacity] = toSVGColor(
    rc.PathStrokeColorRaw
  );

  return `    
        .inside {
            fill: ${insideFill.color};
            fill-opacity: ${insideFill.opacity};
            stroke: ${insideStroke.color};
            stroke-width: ${rc.InsideStrokeWidth};
            stroke-opacity: ${insideStroke.opacity};
        }
        .outside {
            fill: ${outsideFill.color};
            fill-opacity: ${outsideFill.opacity};
            stroke: ${outsideStroke.color};
            stroke-width: ${rc.OutsideStrokeWidth};
            stroke-opacity: ${outsideStroke.opacity};
        }
        .active {
            fill: ${activeFill.color};
            fill-opacity: ${activeFill.opacity};
            stroke: ${activeStroke.color};
            stroke-width: ${rc.ActiveStrokeWidth};
            stroke-opacity: ${activeStroke.opacity};
        }
        .dragon {
            stroke: ${pathStrokeColor};
            stroke-width: ${rc.PathWidth};
            opacity: ${pathStrokeOpacity};
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
        }
        .bgrect {
            fill: ${bgFillColor};
            stroke: none;
            fill-opacity: ${bgOpacity};
        }`;
}

function getCellRectTemplate(
  className: "inside" | "outside" | "active",
  strokeEnabled: boolean,
  strokeWidth: number,
  radius: number,
  wrapInGroup: boolean
): string {
  const rectSX = strokeEnabled ? strokeWidth / 2 : 0;
  const rectSY = strokeEnabled ? strokeWidth / 2 : 0;
  const rectR = radius - (strokeEnabled ? strokeWidth : 0);
  const rect = `<rect class="${className}" x="${rectSX}" y="${rectSY}" height="${rectR}" width="${rectR}" />`;

  if (wrapInGroup) {
    return `<g>
        ${rect}
    </g>`;
  }
  return rect;
}

function getInsideCellTemplate(rc: common.RequestConfig): string {
  return getCellRectTemplate(
    "inside",
    rc.InsideStroke,
    rc.InsideStrokeWidth,
    rc.Radius,
    true
  );
}

function getOutsideCellTemplate(rc: common.RequestConfig): string {
  return getCellRectTemplate(
    "outside",
    rc.OutSideStroke,
    rc.OutsideStrokeWidth,
    rc.Radius,
    true
  );
}

function getActiveCellBackgroundTemplate(rc: common.RequestConfig): string {
  return getCellRectTemplate(
    "active",
    rc.ActiveStroke,
    rc.ActiveStrokeWidth,
    rc.Radius,
    false
  );
}

function emptyDragonPath(): string {
  return `<path class="dragon" d="" />`;
}

function closeDragonPath(buf: string, d: string): string {
  return `${buf}d="${d}" />`;
}

function buildTemplateCache(rc: common.RequestConfig): TemplateCache {
  const templateArray: TemplateCache = Array.from({ length: 3 }, () =>
    Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => Array(4).fill(""))
    )
  );

  templateArray[common.INSIDE][0][0][0] = getInsideCellTemplate(rc);
  templateArray[common.OUTSIDE][0][0][0] = getOutsideCellTemplate(rc);

  for (const [turn, start, end] of ACTIVE_TEMPLATE_KEYS) {
    templateArray[common.ACTIVE][turn][start][end] = getActiveCellTemplate(
      turn,
      start,
      end,
      rc
    );
  }

  return templateArray;
}

function buildKnuthTemplateArray(rc: common.RequestConfig): string[] {
  const knuthTemplateArray: string[] = Array(7).fill("");

  if (isKnuthCellType(rc.CellType)) {
    for (let knuthType = 1; knuthType <= 6; knuthType++) {
      knuthTemplateArray[knuthType] = getActiveCellTemplate(
        knuthType,
        0,
        0,
        rc
      );
    }
  }

  return knuthTemplateArray;
}

function appendGroutingRects(
  parts: string[],
  rc: common.RequestConfig,
  groutingFillColor: string
): void {
  const xm = -rc.Grouting;
  const ym = -rc.Grouting;

  parts.push(
    `<rect x="${xm}" y="${ym}" height="${rc.Grouting}" width="${
      rc.Radius + rc.Grouting * 2
    }" fill="${groutingFillColor}" stroke="none" />`,
    `<rect x="${xm}" y="${ym}" height="${
      rc.Radius + rc.Grouting * 2
    }" width="${rc.Grouting}" fill="${groutingFillColor}" stroke="none" />`,
    `<rect x="${xm}" y="${ym + rc.Radius + rc.Grouting}" height="${
      rc.Grouting
    }" width="${rc.Radius + rc.Grouting * 2}" fill="${groutingFillColor}" stroke="none" />`,
    `<rect x="${xm + rc.Radius + rc.Grouting}" y="${ym}" height="${
      rc.Radius + rc.Grouting * 2
    }" width="${rc.Grouting}" fill="${groutingFillColor}" stroke="none" />`
  );
}

function createSVG(
  cells: common.Cell[][],
  minRow: number,
  minCol: number,
  maxRow: number,
  maxCol: number,
  rc: common.RequestConfig
): string {
  const templateArray = buildTemplateCache(rc);
  const knuthTemplateArray = buildKnuthTemplateArray(rc);

  const width = maxCol - minCol;
  const height = maxRow - minRow;
  const ri = rc.Radius;
  const { svgWidth, svgHeight } = computeSvgDimensions(width, height, rc);
  const [groutingFillColor] = toSVGColor(rc.GroutingColorRaw);

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${svgWidth.toFixed(
      2
    )} ${svgHeight.toFixed(2)}">
    
    <style>    ${buildStyleBlock(rc)}    
    </style>`,
    `<rect class="bgrect" x="0" y="0" height="${svgHeight}" width="${svgWidth}" />`,
  ];

  const ox = rc.Grouting + rc.Margin;
  const oy = rc.Grouting + rc.Margin;

  for (const [idy, row] of cells.entries()) {
    for (const [idx, cell] of row.entries()) {
      if (!isActiveFill(cell.FillState)) {
        continue;
      }

      const { x, y } = cellOrigin(idx, idy, ox, oy, ri, rc.Grouting);
      const turn = normalizeTurn(cell.Turn);

      parts.push(`<g transform="translate(${x}, ${y})">`);

      if (isKnuthCellType(rc.CellType)) {
        parts.push(knuthTemplateArray[cell.KnuthType]);
      } else {
        parts.push(
          templateArray[common.ACTIVE][turn][cell.StartCorner][cell.EndCorner]
        );
      }

      if (rc.Grouting > 0) {
        appendGroutingRects(parts, rc, groutingFillColor);
      }

      parts.push(`</g>`);
    }
  }

  for (const [idy, row] of cells.entries()) {
    for (const [idx, cell] of row.entries()) {
      if (isActiveFill(cell.FillState)) {
        continue;
      }

      const { x, y } = cellOrigin(idx, idy, ox, oy, ri, rc.Grouting);

      if (isOutsideFill(cell.FillState)) {
        parts.push(
          `<g transform="translate(${x}, ${y})">`,
          templateArray[common.OUTSIDE][0][0][0],
          `</g>`
        );
      } else if (isInsideFill(cell.FillState)) {
        parts.push(
          `<g transform="translate(${x}, ${y})">`,
          templateArray[common.INSIDE][0][0][0],
          `</g>`
        );
      }
    }
  }

  if (rc.GridLines) {
    for (let w = 0; w < width + 4; w++) {
      const x = ox - rc.Grouting + w * (ri + rc.Grouting);
      parts.push(
        `<line x1="${x}" y1="0" x2="${x}" y2="${svgHeight}" stroke="#00000088" stroke-width="1" />`
      );
    }
    for (let h = 0; h < height + 4; h++) {
      const y = oy - rc.Grouting + h * (ri + rc.Grouting);
      parts.push(
        `<line x1="0" y1="${y}" x2="${svgWidth}" y2="${y}" stroke="#00000088" stroke-width="1" />`
      );
    }
  }

  parts.push(`</svg>`);

  return parts.join("");
}

function getActiveCellTemplate(
  turn: number,
  start: number,
  end: number,
  rc: common.RequestConfig
): string {
  const parts = [`<g>`, getActiveCellBackgroundTemplate(rc)];

  if (rc.PathStroke) {
    parts.push(getSVGCellDrawer(rc)(rc, turn, start, end));
  }

  parts.push(`</g>`);
  return parts.join("");
}

function getSVGCellDrawer(rc: common.RequestConfig): PathDrawer {
  switch (rc.CellType) {
    case "line":
      return getDragonPathLineTemplate;
    case "triangle":
      return getDragonTriTemplate;
    case "corner":
      return getDragonPathCornerTemplate;
    case "quadrant":
      return getDragonPathQuadrantTemplate;
    case "knuth":
    case "knuthcurve":
    case "knuthtri":
      return getDragonPathKnuthTemplate;
    default:
      return getDragonPathLineTemplate;
  }
}

function getDragonPathKnuthTemplate(
  rc: common.RequestConfig,
  knuthType: number,
  _start: number,
  _end: number
): string {
  void _start;
  void _end;

  const buf = `<path class="dragon" `;

  if (rc.CellType.includes("knuthtri")) {
    const theta = (Math.PI / 180) * rc.TriangleAngle;
    const d = rc.Radius / 2;
    const dd = (Math.sqrt(2) * rc.Radius) / 2;
    const short = (dd * Math.sin(theta)) / 2;

    const cx = rc.Radius / 2;
    const cy = rc.Radius / 2;

    const p1x = cx - short;
    const p1y = cy + short;

    const p2x = cx + short;
    const p2y = cy + short;

    const p3x = cx + short;
    const p3y = cy - short;

    const p4x = cx - short;
    const p4y = cy - short;

    if (knuthType === 1) {
      return closeDragonPath(buf, `M 0 ${d} L ${p1x} ${p1y} L ${d} ${2 * d}`);
    }

    if (knuthType === 2) {
      return closeDragonPath(
        buf,
        `M ${d} ${2 * d} L ${p2x} ${p2y} L ${2 * d} ${d}`
      );
    }

    if (knuthType === 3) {
      return closeDragonPath(buf, `M ${d} 0 L ${p3x} ${p3y} L ${2 * d} ${d}`);
    }

    if (knuthType === 4) {
      return closeDragonPath(buf, `M 0 ${d} L ${p4x} ${p4y} L ${d} 0`);
    }

    if (knuthType === 5) {
      return (
        closeDragonPath(buf, `M 0 ${d} L ${p1x} ${p1y} L ${d} ${2 * d}`) +
        `<path class="dragon" d="M ${d} 0 L ${p3x} ${p3y} L ${2 * d} ${d}" />`
      );
    }

    if (knuthType === 6) {
      return (
        closeDragonPath(
          buf,
          `M ${d} ${2 * d} L ${p2x} ${p2y} L ${2 * d} ${d}`
        ) +
        `<path class="dragon" d="M 0 ${d} L ${p4x} ${p4y} L ${d} 0" />`
      );
    }
  } else if (rc.CellType.includes("knuthcurve")) {
    if (knuthType === 1) {
      return closeDragonPath(
        buf,
        `M ${rc.Radius / 2} ${rc.Radius} A ${rc.Radius / 2} ${
          rc.Radius / 2
        } 90 0 0 0 ${rc.Radius / 2}`
      );
    }

    if (knuthType === 2) {
      return closeDragonPath(
        buf,
        `M ${rc.Radius / 2} ${rc.Radius} A ${rc.Radius / 2} ${
          rc.Radius / 2
        } 90 0 1 ${rc.Radius} ${rc.Radius / 2}`
      );
    }

    if (knuthType === 3) {
      return closeDragonPath(
        buf,
        `M ${rc.Radius / 2} 0 A ${rc.Radius / 2} ${
          rc.Radius / 2
        } 90 0 0 ${rc.Radius} ${rc.Radius / 2}`
      );
    }

    if (knuthType === 4) {
      return closeDragonPath(
        buf,
        `M ${rc.Radius / 2} 0 A ${rc.Radius / 2} ${
          rc.Radius / 2
        } 90 0 1 0 ${rc.Radius / 2}`
      );
    }

    if (knuthType === 5) {
      return (
        closeDragonPath(
          buf,
          `M ${rc.Radius / 2} ${rc.Radius} A ${rc.Radius / 2} ${
            rc.Radius / 2
          } 90 0 0 0 ${rc.Radius / 2}`
        ) +
        `<path class="dragon" d="M ${rc.Radius / 2} 0 A ${rc.Radius / 2} ${
          rc.Radius / 2
        } 90 0 0 ${rc.Radius} ${rc.Radius / 2}" />`
      );
    }

    if (knuthType === 6) {
      return (
        closeDragonPath(
          buf,
          `M ${rc.Radius / 2} ${rc.Radius} A ${rc.Radius / 2} ${
            rc.Radius / 2
          } 90 0 1 ${rc.Radius} ${rc.Radius / 2}`
        ) +
        `<path class="dragon" d="M ${rc.Radius / 2} 0 A ${rc.Radius / 2} ${
          rc.Radius / 2
        } 90 0 1 0 ${rc.Radius / 2}" />`
      );
    }
  } else {
    if (knuthType === 1) {
      return closeDragonPath(
        buf,
        `M ${rc.Radius / 2} ${rc.Radius} L 0 ${rc.Radius / 2}`
      );
    }

    if (knuthType === 2) {
      return closeDragonPath(
        buf,
        `M ${rc.Radius / 2} ${rc.Radius} L ${rc.Radius} ${rc.Radius / 2}`
      );
    }

    if (knuthType === 3) {
      return closeDragonPath(
        buf,
        `M ${rc.Radius / 2} 0 L ${rc.Radius} ${rc.Radius / 2}`
      );
    }

    if (knuthType === 4) {
      return closeDragonPath(buf, `M 0 ${rc.Radius / 2} L ${rc.Radius / 2} 0`);
    }

    if (knuthType === 5) {
      return (
        closeDragonPath(
          buf,
          `M ${rc.Radius / 2} ${rc.Radius} L 0 ${rc.Radius / 2}`
        ) +
        `<path class="dragon" d="M ${rc.Radius / 2} 0 L ${rc.Radius} ${
          rc.Radius / 2
        }" />`
      );
    }

    if (knuthType === 6) {
      return (
        closeDragonPath(
          buf,
          `M ${rc.Radius / 2} ${rc.Radius} L ${rc.Radius} ${rc.Radius / 2}`
        ) +
        `<path class="dragon" d="M 0 ${rc.Radius / 2} L ${
          rc.Radius / 2
        } 0" />`
      );
    }
  }

  return emptyDragonPath();
}

function getDragonPathQuadrantTemplate(
  rc: common.RequestConfig,
  turn: number,
  start: number,
  end: number
): string {
  const buf = `<path class="dragon" `;
  const normalizedTurn = normalizeTurn(turn);
  const r = rc.Radius;

  if (
    (start === 0 && end === 2 && normalizedTurn === 0) ||
    (start === 2 && end === 0 && normalizedTurn === 1)
  ) {
    return closeDragonPath(buf, `M 0 0 A ${r} ${r} 90 0 0 ${r} ${r}`);
  }
  if (
    (start === 0 && end === 2 && normalizedTurn === 1) ||
    (start === 2 && end === 0 && normalizedTurn === 0)
  ) {
    return closeDragonPath(buf, `M 0 0 A ${r} ${r} 90 0 1 ${r} ${r}`);
  }

  if (
    (start === 1 && end === 3 && normalizedTurn === 0) ||
    (start === 3 && end === 1 && normalizedTurn === 1)
  ) {
    return closeDragonPath(buf, `M ${r} 0 A ${r} ${r} 90 0 0 0 ${r}`);
  }
  if (
    (start === 1 && end === 3 && normalizedTurn === 1) ||
    (start === 3 && end === 1 && normalizedTurn === 0)
  ) {
    return closeDragonPath(buf, `M ${r} 0 A ${r} ${r} 90 0 1 0 ${r}`);
  }

  return emptyDragonPath();
}

function getDragonPathLineTemplate(
  rc: common.RequestConfig,
  _turn: number,
  start: number,
  end: number
): string {
  const buf = `<path class="dragon" `;

  if ((start === 0 && end === 2) || (start === 2 && end === 0)) {
    return closeDragonPath(buf, `M 0 0 L ${rc.Radius} ${rc.Radius}`);
  }

  if ((start === 1 && end === 3) || (start === 3 && end === 1)) {
    return closeDragonPath(buf, `M ${rc.Radius} 0 L 0 ${rc.Radius}`);
  }

  return emptyDragonPath();
}

function getDragonTriTemplate(
  rc: common.RequestConfig,
  turn: number,
  start: number,
  end: number
): string {
  const buf = `<path class="dragon" `;

  const theta = (Math.PI / 180) * rc.TriangleAngle;
  const d = rc.Radius;
  const dd = Math.sqrt(2) * rc.Radius;
  const short = (dd * Math.sin(theta)) / 2;

  const p1x = short;
  const p1y = d - short;

  const p2x = d - short;
  const p2y = short;

  const p3x = short;
  const p3y = short;

  const p4x = d - short;
  const p4y = d - short;

  const normalizedTurn = normalizeTurn(turn);
  const r = rc.Radius;

  if (
    (start === 0 && end === 2 && normalizedTurn === 0) ||
    (start === 2 && end === 0 && normalizedTurn === 1)
  ) {
    return closeDragonPath(buf, `M 0 0 L ${p1x} ${p1y} L ${r} ${r}`);
  }
  if (
    (start === 0 && end === 2 && normalizedTurn === 1) ||
    (start === 2 && end === 0 && normalizedTurn === 0)
  ) {
    return closeDragonPath(buf, `M 0 0 L ${p2x} ${p2y} L ${r} ${r}`);
  }

  if (
    (start === 1 && end === 3 && normalizedTurn === 0) ||
    (start === 3 && end === 1 && normalizedTurn === 1)
  ) {
    return closeDragonPath(buf, `M ${r} 0 L ${p3x} ${p3y} L 0 ${r}`);
  }
  if (
    (start === 1 && end === 3 && normalizedTurn === 1) ||
    (start === 3 && end === 1 && normalizedTurn === 0)
  ) {
    return closeDragonPath(buf, `M ${r} 0 L ${p4x} ${p4y} L 0 ${r}`);
  }

  return emptyDragonPath();
}

function getDragonPathCornerTemplate(
  rc: common.RequestConfig,
  turn: number,
  start: number,
  end: number
): string {
  const buf = `<path class="dragon" `;
  const normalizedTurn = normalizeTurn(turn);
  const r = rc.Radius;

  if (
    (start === 0 && end === 2 && normalizedTurn === 0) ||
    (start === 2 && end === 0 && normalizedTurn === 1)
  ) {
    return closeDragonPath(buf, `M 0 0 L 0 ${r} L ${r} ${r}`);
  }
  if (
    (start === 0 && end === 2 && normalizedTurn === 1) ||
    (start === 2 && end === 0 && normalizedTurn === 0)
  ) {
    return closeDragonPath(buf, `M 0 0 L ${r} 0 L ${r} ${r}`);
  }

  if (
    (start === 1 && end === 3 && normalizedTurn === 0) ||
    (start === 3 && end === 1 && normalizedTurn === 1)
  ) {
    return closeDragonPath(buf, `M ${r} 0 L 0 0 L 0 ${r}`);
  }
  if (
    (start === 1 && end === 3 && normalizedTurn === 1) ||
    (start === 3 && end === 1 && normalizedTurn === 0)
  ) {
    return closeDragonPath(buf, `M ${r} 0 L ${r} ${r} L 0 ${r}`);
  }

  return emptyDragonPath();
}

export function getDragonSizeSVG(rc: common.RequestConfig): [number, number] {
  const [, width, height] = common.prepareCells(rc, true);
  const { svgWidth, svgHeight } = computeSvgDimensions(width, height, rc);
  return [svgWidth, svgHeight];
}

export function getDragonSVG(rc: common.RequestConfig): string {
  const [cells, , , minRow, minCol, maxRow, maxCol] = common.prepareCells(
    rc,
    true
  );
  return cells
    ? createSVG(cells, minRow, minCol, maxRow, maxCol, rc)
    : "";
}

/** Black-and-white schematic style for printable plans (uses base Tile Renderer). */
export function buildPlansConfig(base: common.RequestConfig): common.RequestConfig {
  return {
    ...base,
    Grouting: 5,
    PathWidth: 3,
    PathStroke: true,
    PathStrokeColorRaw: "#000000",
    ActiveFill: true,
    ActiveFillColorRaw: "#ffffff",
    ActiveStroke: true,
    ActiveStrokeColorRaw: "#000000",
    ActiveStrokeWidth: 1,
    InsideFill: false,
    InsideStroke: true,
    InsideStrokeColorRaw: "#000000",
    InsideStrokeWidth: 1,
    OutSideFill: false,
    OutSideStroke: true,
    OutsideStrokeColorRaw: "#000000",
    OutsideStrokeWidth: 1,
    GroutingColorRaw: "#ffffff",
    GridLines: false,
    Margin: 10,
    Radius: 20,
  };
}

/** A4 page size in millimetres. */
const A4_PORTRAIT_MM = { width: 210, height: 297 };
const A4_LANDSCAPE_MM = { width: 297, height: 210 };

const PLANS_LABEL_GUTTER = 22;
const PLANS_STATS_WIDTH = 150;
const PLANS_STATS_GAP = 12;
const PLANS_STATS_PAD = 10;
const PLANS_STATS_LINE_HEIGHT = 14;
const PLANS_STATS_FIRST_BASELINE = 11;

function createPlansSVG(
  cells: common.Cell[][],
  minRow: number,
  minCol: number,
  maxRow: number,
  maxCol: number,
  rc: common.RequestConfig,
  stats: common.TileStats
): string {
  const templateArray = buildTemplateCache(rc);
  const knuthTemplateArray = buildKnuthTemplateArray(rc);

  const width = maxCol - minCol;
  const height = maxRow - minRow;
  const ri = rc.Radius;
  const { svgWidth: gridSvgWidth, svgHeight: gridSvgHeight } =
    computeSvgDimensions(width, height, rc);
  const [groutingFillColor] = toSVGColor(rc.GroutingColorRaw);

  const statsLines: { text: string; bold?: boolean }[] = [
    { text: "Tile statistics", bold: true },
    { text: `Left turns only: ${stats.activeLeftOnly}` },
    { text: `Right turns only: ${stats.activeRightOnly}` },
    { text: `Complementary turns: ${stats.complementary}` },
    { text: `Inside: ${stats.inside}` },
    { text: `Outside: ${stats.outside}` },
    { text: `Horizontal: ${stats.horizontal}` },
    { text: `Vertical: ${stats.vertical}` },
    { text: `Total: ${stats.total}`, bold: true },
  ];
  const statsBoxHeight =
    PLANS_STATS_PAD +
    PLANS_STATS_FIRST_BASELINE +
    (statsLines.length - 1) * PLANS_STATS_LINE_HEIGHT +
    PLANS_STATS_PAD;

  const labelOffsetX = PLANS_LABEL_GUTTER;
  const labelOffsetY = PLANS_LABEL_GUTTER;
  const ox = rc.Grouting + rc.Margin;
  const oy = rc.Grouting + rc.Margin;
  const lastRow = Math.max(cells.length - 1, 0);
  const { y: lastRowTop } = cellOrigin(0, lastRow, ox, oy, ri, rc.Grouting);
  // Bottom edge of the last row of cells (cell rect height is Radius).
  const gridBottom = labelOffsetY + lastRowTop + ri;

  const statsX = labelOffsetX + gridSvgWidth + PLANS_STATS_GAP;
  const statsY = gridBottom - statsBoxHeight;
  const svgWidth = statsX + PLANS_STATS_WIDTH;
  const svgHeight = Math.max(labelOffsetY + gridSvgHeight, gridBottom);

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${svgWidth.toFixed(
      2
    )} ${svgHeight.toFixed(2)}">
    
    <style>    ${buildStyleBlock(rc)}
        .inside {
            stroke-dasharray: 2 2;
        }
        .plans-label {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9px;
            fill: #000000;
        }
        .plans-stats-title {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            font-weight: bold;
            fill: #000000;
        }
        .plans-stats-text {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            fill: #000000;
        }
        .plans-stats-box {
            fill: #ffffff;
            stroke: #000000;
            stroke-width: 1.5;
        }
    </style>`,
    `<rect class="bgrect" x="0" y="0" height="${svgHeight}" width="${svgWidth}" />`,
    `<g transform="translate(${labelOffsetX}, ${labelOffsetY})">`,
  ];

  for (const [idy, row] of cells.entries()) {
    for (const [idx, cell] of row.entries()) {
      if (!isActiveFill(cell.FillState)) {
        continue;
      }

      const { x, y } = cellOrigin(idx, idy, ox, oy, ri, rc.Grouting);
      const turn = normalizeTurn(cell.Turn);

      parts.push(`<g transform="translate(${x}, ${y})">`);

      if (isKnuthCellType(rc.CellType)) {
        parts.push(knuthTemplateArray[cell.KnuthType]);
      } else {
        parts.push(
          templateArray[common.ACTIVE][turn][cell.StartCorner][cell.EndCorner]
        );
      }

      if (rc.Grouting > 0) {
        appendGroutingRects(parts, rc, groutingFillColor);
      }

      parts.push(`</g>`);
    }
  }

  for (const [idy, row] of cells.entries()) {
    for (const [idx, cell] of row.entries()) {
      if (isActiveFill(cell.FillState)) {
        continue;
      }

      const { x, y } = cellOrigin(idx, idy, ox, oy, ri, rc.Grouting);

      if (isOutsideFill(cell.FillState)) {
        parts.push(
          `<g transform="translate(${x}, ${y})">`,
          templateArray[common.OUTSIDE][0][0][0],
          `</g>`
        );
      } else if (isInsideFill(cell.FillState)) {
        parts.push(
          `<g transform="translate(${x}, ${y})">`,
          templateArray[common.INSIDE][0][0][0],
          `</g>`
        );
      }
    }
  }

  parts.push(`</g>`);

  // Column numbers (1-based) along the top
  for (let col = 0; col < cells[0].length; col++) {
    const { x } = cellOrigin(col, 0, ox, oy, ri, rc.Grouting);
    const cx = labelOffsetX + x + ri / 2;
    const cy = labelOffsetY - 6;
    parts.push(
      `<text class="plans-label" x="${cx.toFixed(2)}" y="${cy.toFixed(2)}" text-anchor="middle">${col + 1}</text>`
    );
  }

  // Row numbers (1-based) along the left
  for (let row = 0; row < cells.length; row++) {
    const { y } = cellOrigin(0, row, ox, oy, ri, rc.Grouting);
    const cx = labelOffsetX - 6;
    const cy = labelOffsetY + y + ri / 2 + 3;
    parts.push(
      `<text class="plans-label" x="${cx.toFixed(2)}" y="${cy.toFixed(2)}" text-anchor="end">${row + 1}</text>`
    );
  }

  // Statistics box in the lower right
  parts.push(
    `<rect class="plans-stats-box" x="${statsX}" y="${statsY}" width="${PLANS_STATS_WIDTH}" height="${statsBoxHeight}" />`
  );

  statsLines.forEach((line, i) => {
    const y =
      statsY +
      PLANS_STATS_PAD +
      PLANS_STATS_FIRST_BASELINE +
      i * PLANS_STATS_LINE_HEIGHT;
    const cls = line.bold ? "plans-stats-title" : "plans-stats-text";
    parts.push(
      `<text class="${cls}" x="${statsX + PLANS_STATS_PAD}" y="${y}">${line.text}</text>`
    );
  });

  parts.push(`</svg>`);
  return parts.join("");
}

/**
 * Generate a black-and-white A4 schematic SVG for the curve in `base`
 * (folds and start direction preserved; style fixed for plans).
 */
export function getPlansSVG(base: common.RequestConfig): string {
  const rc = buildPlansConfig(base);
  const [cells, , , minRow, minCol, maxRow, maxCol] = common.prepareCells(
    rc,
    true
  );
  if (!cells) {
    return "";
  }

  const stats = common.getTileStats(rc);
  const svg = createPlansSVG(cells, minRow, minCol, maxRow, maxCol, rc, stats);
  const width = maxCol - minCol;
  const height = maxRow - minRow;
  const { svgWidth: gridW, svgHeight: gridH } = computeSvgDimensions(
    width,
    height,
    rc
  );
  const contentWidth =
    PLANS_LABEL_GUTTER + gridW + PLANS_STATS_GAP + PLANS_STATS_WIDTH;
  const contentHeight = Math.max(
    PLANS_LABEL_GUTTER + gridH,
    PLANS_LABEL_GUTTER + gridH
  );
  const page =
    contentWidth >= contentHeight ? A4_LANDSCAPE_MM : A4_PORTRAIT_MM;

  return svg.replace(
    /width="100%" height="100%"/,
    `width="${page.width}mm" height="${page.height}mm"`
  );
}
