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

function appendTileBlockGrid(
  parts: string[],
  ox: number,
  oy: number,
  ri: number,
  grouting: number,
  svgWidth: number,
  svgHeight: number,
  tilesPerBlock: number
): void {
  const blockPitch = tilesPerBlock * (ri + grouting);
  const startX = ox - grouting;
  const startY = oy - grouting;

  for (let w = 0; ; w++) {
    const x = startX + w * blockPitch;
    if (x > svgWidth) {
      break;
    }
    parts.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${svgHeight}" stroke="#000000aa" stroke-width="2" />`
    );
  }
  for (let h = 0; ; h++) {
    const y = startY + h * blockPitch;
    if (y > svgHeight) {
      break;
    }
    parts.push(
      `<line x1="0" y1="${y}" x2="${svgWidth}" y2="${y}" stroke="#000000aa" stroke-width="2" />`
    );
  }
}

function appendPlanBlockHitTargets(
  parts: string[],
  ox: number,
  oy: number,
  ri: number,
  grouting: number,
  gridWidth: number,
  gridHeight: number,
  tilesPerBlock: number
): void {
  const blockPitch = tilesPerBlock * (ri + grouting);
  const startX = ox - grouting;
  const startY = oy - grouting;

  for (let blockRow = 0; ; blockRow++) {
    const y = startY + blockRow * blockPitch;
    if (y >= gridHeight) {
      break;
    }
    for (let blockCol = 0; ; blockCol++) {
      const x = startX + blockCol * blockPitch;
      if (x >= gridWidth) {
        break;
      }
      parts.push(
        `<rect class="plan-block-hit" data-block-row="${blockRow}" data-block-col="${blockCol}" x="${x}" y="${y}" width="${blockPitch}" height="${blockPitch}" fill="transparent" />`
      );
    }
  }
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

function dragonPath(d: string, pathIndex?: number): string {
  const indexAttr =
    pathIndex !== undefined ? ` data-path-index="${pathIndex}"` : "";
  return `<path class="dragon"${indexAttr} d="${d}" />`;
}

function closeDragonPath(buf: string, d: string): string {
  return `${buf}d="${d}" />`;
}

function injectPathIndex(
  html: string,
  pathIndex: number | undefined
): string {
  if (pathIndex === undefined) {
    return html;
  }

  return html.replace(
    /<path class="dragon"(?![^>]*data-path-index)/g,
    `<path class="dragon" data-path-index="${pathIndex}"`
  );
}

function isComplementaryKnuthType(knuthType: number): boolean {
  return knuthType === 5 || knuthType === 6;
}

function pathIndexForKnuthSegment(
  cell: common.Cell,
  geometryType: number
): number | undefined {
  if (cell.KnuthSegmentFirst === geometryType) {
    return cell.PathIndex;
  }
  if (cell.KnuthSegmentSecond === geometryType) {
    return cell.PathIndexSecond;
  }
  return cell.PathIndex;
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
        if (isComplementaryKnuthType(cell.KnuthType)) {
          parts.push(getComplementaryKnuthActiveCellContent(cell, rc));
        } else {
          parts.push(
            injectPathIndex(knuthTemplateArray[cell.KnuthType], cell.PathIndex)
          );
        }
      } else {
        parts.push(
          injectPathIndex(
            templateArray[common.ACTIVE][turn][cell.StartCorner][cell.EndCorner],
            cell.PathIndex
          )
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

      if (rc.NoCells) {
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

  if (rc.TileBlockGridSize > 0) {
    appendTileBlockGrid(
      parts,
      ox,
      oy,
      ri,
      rc.Grouting,
      svgWidth,
      svgHeight,
      rc.TileBlockGridSize
    );
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
  const parts = [`<g>`];

  if (!rc.NoCells) {
    parts.push(getActiveCellBackgroundTemplate(rc));
  }

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

function getKnuthPathSegment(
  rc: common.RequestConfig,
  geometryType: number,
  pathIndex?: number
): string {
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

    if (geometryType === 1) {
      return dragonPath(`M 0 ${d} L ${p1x} ${p1y} L ${d} ${2 * d}`, pathIndex);
    }

    if (geometryType === 2) {
      return dragonPath(
        `M ${d} ${2 * d} L ${p2x} ${p2y} L ${2 * d} ${d}`,
        pathIndex
      );
    }

    if (geometryType === 3) {
      return dragonPath(`M ${d} 0 L ${p3x} ${p3y} L ${2 * d} ${d}`, pathIndex);
    }

    if (geometryType === 4) {
      return dragonPath(`M 0 ${d} L ${p4x} ${p4y} L ${d} 0`, pathIndex);
    }
  } else if (rc.CellType.includes("knuthcurve")) {
    if (geometryType === 1) {
      return dragonPath(
        `M ${rc.Radius / 2} ${rc.Radius} A ${rc.Radius / 2} ${
          rc.Radius / 2
        } 90 0 0 0 ${rc.Radius / 2}`,
        pathIndex
      );
    }

    if (geometryType === 2) {
      return dragonPath(
        `M ${rc.Radius / 2} ${rc.Radius} A ${rc.Radius / 2} ${
          rc.Radius / 2
        } 90 0 1 ${rc.Radius} ${rc.Radius / 2}`,
        pathIndex
      );
    }

    if (geometryType === 3) {
      return dragonPath(
        `M ${rc.Radius / 2} 0 A ${rc.Radius / 2} ${
          rc.Radius / 2
        } 90 0 0 ${rc.Radius} ${rc.Radius / 2}`,
        pathIndex
      );
    }

    if (geometryType === 4) {
      return dragonPath(
        `M ${rc.Radius / 2} 0 A ${rc.Radius / 2} ${
          rc.Radius / 2
        } 90 0 1 0 ${rc.Radius / 2}`,
        pathIndex
      );
    }
  } else {
    if (geometryType === 1) {
      return dragonPath(
        `M ${rc.Radius / 2} ${rc.Radius} L 0 ${rc.Radius / 2}`,
        pathIndex
      );
    }

    if (geometryType === 2) {
      return dragonPath(
        `M ${rc.Radius / 2} ${rc.Radius} L ${rc.Radius} ${rc.Radius / 2}`,
        pathIndex
      );
    }

    if (geometryType === 3) {
      return dragonPath(
        `M ${rc.Radius / 2} 0 L ${rc.Radius} ${rc.Radius / 2}`,
        pathIndex
      );
    }

    if (geometryType === 4) {
      return dragonPath(
        `M 0 ${rc.Radius / 2} L ${rc.Radius / 2} 0`,
        pathIndex
      );
    }
  }

  return emptyDragonPath();
}

function getComplementaryKnuthActiveCellContent(
  cell: common.Cell,
  rc: common.RequestConfig
): string {
  const segments = cell.KnuthType === 5 ? [1, 3] : [2, 4];
  const parts = [`<g>`];

  if (!rc.NoCells) {
    parts.push(getActiveCellBackgroundTemplate(rc));
  }

  if (rc.PathStroke) {
    for (const geometryType of segments) {
      parts.push(
        getKnuthPathSegment(
          rc,
          geometryType,
          pathIndexForKnuthSegment(cell, geometryType)
        )
      );
    }
  }

  parts.push(`</g>`);
  return parts.join("");
}

function getDragonPathKnuthTemplate(
  rc: common.RequestConfig,
  knuthType: number,
  _start: number,
  _end: number
): string {
  void _start;
  void _end;

  if (knuthType === 5) {
    return getKnuthPathSegment(rc, 1) + getKnuthPathSegment(rc, 3);
  }

  if (knuthType === 6) {
    return getKnuthPathSegment(rc, 2) + getKnuthPathSegment(rc, 4);
  }

  return getKnuthPathSegment(rc, knuthType);
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

export type TileInfo = {
  type: "active" | "inside" | "outside";
  turn: "left" | "right" | "none";
  complementary: boolean;
  knuthType: number;
  rows: number;
  cols: number;
};

export function getTileGridSize(
  rc: common.RequestConfig
): { rows: number; cols: number } | null {
  const [cells] = common.prepareCells(rc, true);
  if (!cells || cells.length === 0) {
    return null;
  }
  return { rows: cells.length, cols: cells[0].length };
}

/**
 * Render a single tile as SVG. Row and column are 1-based (same as plans).
 */
export function getTileSVG(
  rc: common.RequestConfig,
  row: number,
  col: number
): { svg: string; info: TileInfo } | null {
  const [cells] = common.prepareCells(rc, true);
  if (!cells || cells.length === 0) {
    return null;
  }

  const rows = cells.length;
  const cols = cells[0].length;
  const r = row - 1;
  const c = col - 1;
  if (r < 0 || c < 0 || r >= rows || c >= cols) {
    return null;
  }

  const cell = cells[r][c];
  const pad = 4;
  const size = rc.Radius + pad * 2;
  const templateArray = buildTemplateCache(rc);
  const knuthTemplateArray = buildKnuthTemplateArray(rc);

  let cellContent = "";

  if (isActiveFill(cell.FillState)) {
    const turn = normalizeTurn(cell.Turn);
    if (isKnuthCellType(rc.CellType)) {
      cellContent = knuthTemplateArray[cell.KnuthType] || "";
    } else {
      cellContent =
        templateArray[common.ACTIVE][turn][cell.StartCorner][cell.EndCorner] ||
        "";
    }
  } else if (isOutsideFill(cell.FillState)) {
    cellContent = templateArray[common.OUTSIDE][0][0][0];
  } else {
    cellContent = templateArray[common.INSIDE][0][0][0];
  }

  const info = cellToTileInfo(cell, rows, cols);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${size} ${size}">
    <style>${buildStyleBlock(rc)}</style>
    <rect class="bgrect" x="0" y="0" width="${size}" height="${size}" />
    <g transform="translate(${pad}, ${pad})">${cellContent}</g>
  </svg>`;

  return { svg, info };
}

function cellToTileInfo(
  cell: common.Cell,
  rows: number,
  cols: number
): TileInfo {
  let type: TileInfo["type"] = "inside";
  if (isActiveFill(cell.FillState)) {
    type = "active";
  } else if (isOutsideFill(cell.FillState)) {
    type = "outside";
  }

  const turnLabel: TileInfo["turn"] =
    type !== "active"
      ? "none"
      : cell.Turn === common.LEFT
        ? "left"
        : cell.Turn === common.RIGHT
          ? "right"
          : "none";

  return {
    type,
    turn: turnLabel,
    complementary:
      type === "active" && (cell.KnuthType === 5 || cell.KnuthType === 6),
    knuthType: cell.KnuthType,
    rows,
    cols,
  };
}

function appendPlansCellContent(
  parts: string[],
  cell: common.Cell,
  rc: common.RequestConfig,
  templateArray: ReturnType<typeof buildTemplateCache>,
  knuthTemplateArray: string[],
  groutingFillColor: string,
  col: number,
  row: number,
  ox: number,
  oy: number,
  ri: number,
  grouting: number
): void {
  const { x, y } = cellOrigin(col, row, ox, oy, ri, grouting);
  parts.push(`<g transform="translate(${x}, ${y})">`);

  if (isActiveFill(cell.FillState)) {
    const turn = normalizeTurn(cell.Turn);
    if (isKnuthCellType(rc.CellType)) {
      parts.push(knuthTemplateArray[cell.KnuthType]);
    } else {
      parts.push(
        templateArray[common.ACTIVE][turn][cell.StartCorner][cell.EndCorner]
      );
    }
  } else if (isOutsideFill(cell.FillState)) {
    parts.push(templateArray[common.OUTSIDE][0][0][0]);
  } else if (isInsideFill(cell.FillState)) {
    parts.push(templateArray[common.INSIDE][0][0][0]);
  }

  if (rc.Grouting > 0) {
    appendGroutingRects(parts, rc, groutingFillColor);
  }

  parts.push(`</g>`);
}

export type OverlayBlockTile = {
  row: number;
  col: number;
  info: TileInfo;
};

export type OverlayBlockDetails = {
  blockRow: number;
  blockCol: number;
  blockSize: number;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  activeLeftOnly: number;
  activeRightOnly: number;
  complementary: number;
  inside: number;
  outside: number;
  total: number;
  tiles: OverlayBlockTile[];
  svg: string;
};

export function getOverlayBlockDetails(
  base: common.RequestConfig,
  blockRow: number,
  blockCol: number
): OverlayBlockDetails | null {
  const blockSize = base.TileBlockGridSize;
  if (blockSize <= 0) {
    return null;
  }

  const rc = buildPlansConfig(base);
  const [cells] = common.prepareCells(rc, true);
  if (!cells || cells.length === 0) {
    return null;
  }

  const rows = cells.length;
  const cols = cells[0].length;
  const startRow0 = blockRow * blockSize;
  const startCol0 = blockCol * blockSize;
  if (startRow0 >= rows || startCol0 >= cols) {
    return null;
  }

  const endRow0 = Math.min(startRow0 + blockSize, rows) - 1;
  const endCol0 = Math.min(startCol0 + blockSize, cols) - 1;
  const blockRows = endRow0 - startRow0 + 1;
  const blockCols = endCol0 - startCol0 + 1;

  const templateArray = buildTemplateCache(rc);
  const knuthTemplateArray = buildKnuthTemplateArray(rc);
  const [groutingFillColor] = toSVGColor(rc.GroutingColorRaw);
  const ri = rc.Radius;
  const ox = rc.Grouting;
  const oy = rc.Grouting;
  const { svgWidth, svgHeight } = computeSvgDimensions(
    blockCols - 1,
    blockRows - 1,
    rc
  );

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${svgWidth.toFixed(2)} ${svgHeight.toFixed(2)}">`,
    `<style>${buildStyleBlock(rc)}
        .inside { stroke-dasharray: 2 2; }
    </style>`,
    `<rect class="bgrect" x="0" y="0" height="${svgHeight}" width="${svgWidth}" />`,
  ];

  const tiles: OverlayBlockTile[] = [];
  let activeLeftOnly = 0;
  let activeRightOnly = 0;
  let complementary = 0;
  let inside = 0;
  let outside = 0;

  for (let r = startRow0; r <= endRow0; r++) {
    for (let c = startCol0; c <= endCol0; c++) {
      const cell = cells[r][c];
      const info = cellToTileInfo(cell, rows, cols);
      tiles.push({ row: r + 1, col: c + 1, info });

      if (info.type === "inside") {
        inside++;
      } else if (info.type === "outside") {
        outside++;
      } else if (info.complementary) {
        complementary++;
      } else if (info.turn === "left") {
        activeLeftOnly++;
      } else if (info.turn === "right") {
        activeRightOnly++;
      }

      appendPlansCellContent(
        parts,
        cell,
        rc,
        templateArray,
        knuthTemplateArray,
        groutingFillColor,
        c - startCol0,
        r - startRow0,
        ox,
        oy,
        ri,
        rc.Grouting
      );
    }
  }

  parts.push(`</svg>`);

  return {
    blockRow,
    blockCol,
    blockSize,
    startRow: startRow0 + 1,
    startCol: startCol0 + 1,
    endRow: endRow0 + 1,
    endCol: endCol0 + 1,
    activeLeftOnly,
    activeRightOnly,
    complementary,
    inside,
    outside,
    total: tiles.length,
    tiles,
    svg: parts.join(""),
  };
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
    NoCells: false,
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
  stats: common.TileStats,
  includeStats = true
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
  const svgWidth = includeStats
    ? statsX + PLANS_STATS_WIDTH
    : labelOffsetX + gridSvgWidth;
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
        .plan-block-hit {
            cursor: pointer;
        }
        .plan-block-hit:hover {
            fill: rgba(0, 0, 0, 0.08);
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
        if (isComplementaryKnuthType(cell.KnuthType)) {
          parts.push(getComplementaryKnuthActiveCellContent(cell, rc));
        } else {
          parts.push(
            injectPathIndex(knuthTemplateArray[cell.KnuthType], cell.PathIndex)
          );
        }
      } else {
        parts.push(
          injectPathIndex(
            templateArray[common.ACTIVE][turn][cell.StartCorner][cell.EndCorner],
            cell.PathIndex
          )
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

  if (rc.TileBlockGridSize > 0) {
    appendTileBlockGrid(
      parts,
      ox,
      oy,
      ri,
      rc.Grouting,
      gridSvgWidth,
      gridSvgHeight,
      rc.TileBlockGridSize
    );
  }

  if (!includeStats && rc.TileBlockGridSize > 0) {
    appendPlanBlockHitTargets(
      parts,
      ox,
      oy,
      ri,
      rc.Grouting,
      gridSvgWidth,
      gridSvgHeight,
      rc.TileBlockGridSize
    );
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

  // Statistics box in the lower right (download only)
  if (includeStats) {
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
  }

  parts.push(`</svg>`);
  return parts.join("");
}

/**
 * Generate a black-and-white schematic SVG for on-screen plan view.
 */
export function getPlansDisplaySVG(base: common.RequestConfig): string {
  const rc = buildPlansConfig(base);
  const [cells, , , minRow, minCol, maxRow, maxCol] = common.prepareCells(
    rc,
    true
  );
  if (!cells) {
    return "";
  }

  const stats = common.getTileStats(rc);
  return createPlansSVG(
    cells,
    minRow,
    minCol,
    maxRow,
    maxCol,
    rc,
    stats,
    false
  );
}

export function getPlansSizeSVG(base: common.RequestConfig): [number, number] {
  const svg = getPlansDisplaySVG(base);
  const match = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!match) {
    return [0, 0];
  }
  return [Number(match[1]), Number(match[2])];
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
  const svg = createPlansSVG(
    cells,
    minRow,
    minCol,
    maxRow,
    maxCol,
    rc,
    stats,
    true
  );
  const [, width, height] = common.prepareCells(rc, false);
  const { svgWidth: gridW, svgHeight: gridH } = computeSvgDimensions(
    width,
    height,
    rc
  );
  const contentWidth =
    PLANS_LABEL_GUTTER + gridW + PLANS_STATS_GAP + PLANS_STATS_WIDTH;
  const contentHeight = PLANS_LABEL_GUTTER + gridH;
  const page =
    contentWidth >= contentHeight ? A4_LANDSCAPE_MM : A4_PORTRAIT_MM;

  return svg.replace(
    /width="100%" height="100%"/,
    `width="${page.width}mm" height="${page.height}mm"`
  );
}
