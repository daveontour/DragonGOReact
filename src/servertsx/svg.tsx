import * as common from "./common";

function createSVG(
  cells: common.Cell[][],
  minRow: number,
  minCol: number,
  maxRow: number,
  maxCol: number,
  rc: common.RequestConfig
): string {
  let templateArray: string[][][][] = Array.from({ length: 3 }, () =>
    Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => Array(4).fill(""))
    )
  );

  const LocalLeft = 0;

  templateArray[common.INSIDE][0][0][0] = getInsideCellTemplate(rc);
  templateArray[common.OUTSIDE][0][0][0] = getOutsideCellTemplate(rc);
  templateArray[common.ACTIVE][LocalLeft][common.TOPLEFT][common.BOTTOMRIGHT] =
    getActiveCellTemplate(LocalLeft, common.TOPLEFT, common.BOTTOMRIGHT, rc);
  templateArray[common.ACTIVE][LocalLeft][common.TOPRIGHT][common.BOTTOMLEFT] =
    getActiveCellTemplate(LocalLeft, common.TOPRIGHT, common.BOTTOMLEFT, rc);
  templateArray[common.ACTIVE][LocalLeft][common.BOTTOMRIGHT][common.TOPLEFT] =
    getActiveCellTemplate(LocalLeft, common.BOTTOMRIGHT, common.TOPLEFT, rc);
  templateArray[common.ACTIVE][LocalLeft][common.BOTTOMLEFT][common.TOPRIGHT] =
    getActiveCellTemplate(LocalLeft, common.BOTTOMLEFT, common.TOPRIGHT, rc);
  templateArray[common.ACTIVE][common.RIGHT][common.TOPLEFT][
    common.BOTTOMRIGHT
  ] = getActiveCellTemplate(
    common.RIGHT,
    common.TOPLEFT,
    common.BOTTOMRIGHT,
    rc
  );
  templateArray[common.ACTIVE][common.RIGHT][common.TOPRIGHT][
    common.BOTTOMLEFT
  ] = getActiveCellTemplate(
    common.RIGHT,
    common.TOPRIGHT,
    common.BOTTOMLEFT,
    rc
  );
  templateArray[common.ACTIVE][common.RIGHT][common.BOTTOMRIGHT][
    common.TOPLEFT
  ] = getActiveCellTemplate(
    common.RIGHT,
    common.BOTTOMRIGHT,
    common.TOPLEFT,
    rc
  );
  templateArray[common.ACTIVE][common.RIGHT][common.BOTTOMLEFT][
    common.TOPRIGHT
  ] = getActiveCellTemplate(
    common.RIGHT,
    common.BOTTOMLEFT,
    common.TOPRIGHT,
    rc
  );

  let knuthTemplateArray: string[] = Array(7).fill("");

  if (rc.CellType.includes("knuth")) {
    knuthTemplateArray[1] = getActiveCellTemplate(1, 0, 0, rc);
    knuthTemplateArray[2] = getActiveCellTemplate(2, 0, 0, rc);
    knuthTemplateArray[3] = getActiveCellTemplate(3, 0, 0, rc);
    knuthTemplateArray[4] = getActiveCellTemplate(4, 0, 0, rc);
    knuthTemplateArray[5] = getActiveCellTemplate(5, 0, 0, rc);
    knuthTemplateArray[6] = getActiveCellTemplate(6, 0, 0, rc);
  }

  const width = maxCol - minCol;
  const height = maxRow - minRow;
  const ri = rc.Radius;

  const svgWidth =
    2 * rc.Margin + (width + 3) * rc.Radius + (width + 3) * rc.Grouting;
  const svgHeight =
    2 * rc.Margin + (height + 3) * rc.Radius + (height + 3) * rc.Grouting;

  let insideFillColor = "#ffffff";
  let insideOpacity = 0.0;
  if (rc.InsideFill) {
    insideFillColor = toSVGColor(rc.InsideFillColorRaw)[0];
    insideOpacity = toSVGColor(rc.InsideFillColorRaw)[1];
  }
  let insideStrokeColor = "#ffffff";
  let insideStrokeOpacity = 0.0;
  if (rc.InsideStroke) {
    insideStrokeColor = toSVGColor(rc.InsideStrokeColorRaw)[0];
    insideStrokeOpacity = toSVGColor(rc.InsideStrokeColorRaw)[1];
  }

  let outsideFillColor = "#ffffff";
  let outsideOpacity = 0.0;
  if (rc.OutSideFill) {
    outsideFillColor = toSVGColor(rc.OutsideFillColorRaw)[0];
    outsideOpacity = toSVGColor(rc.OutsideFillColorRaw)[1];
  }
  let outsideStrokeColor = "#ffffff";
  let outsideStrokeOpacity = 0.0;
  if (rc.OutSideStroke) {
    outsideStrokeColor = toSVGColor(rc.OutsideStrokeColorRaw)[0];
    outsideStrokeOpacity = toSVGColor(rc.OutsideStrokeColorRaw)[1];
  }

  let activeFillColor = "#ffffff";
  let activeOpacity = 1;
  if (rc.ActiveFill) {
    activeFillColor = toSVGColor(rc.ActiveFillColorRaw)[0];
    activeOpacity = toSVGColor(rc.ActiveFillColorRaw)[1];
  }

  let activeStrokeColor = "#ffffff";
  let activeStrokeOpacity = 1;
  if (rc.ActiveStroke) {
    activeStrokeColor = toSVGColor(rc.ActiveStrokeColorRaw)[0];
    activeStrokeOpacity = toSVGColor(rc.ActiveStrokeColorRaw)[1];
  }

  let bgFillColor = toSVGColor(rc.GroutingColorRaw)[0];
  let bgOpacity = toSVGColor(rc.GroutingColorRaw)[1];

  var pathStrokeColor = toSVGColor(rc.PathStrokeColorRaw)[0];
  var pathStrokeOpacity = toSVGColor(rc.PathStrokeColorRaw)[1];

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${svgWidth.toFixed(
    2
  )} ${svgHeight.toFixed(2)}">
    
    <style>    
        .inside {
            fill: ${insideFillColor};
            fill-opacity: ${insideOpacity};
            stroke: ${insideStrokeColor};
            stroke-width: ${rc.InsideStrokeWidth};
            stroke-opacity: ${insideStrokeOpacity};
        }
        .outside {
            fill: ${outsideFillColor};
            fill-opacity: ${outsideOpacity};
            stroke: ${outsideStrokeColor};
            stroke-width: ${rc.OutsideStrokeWidth};
            stroke-opacity: ${outsideStrokeOpacity};
        }
        .active {
            fill: ${activeFillColor};
            fill-opacity: ${activeOpacity};
            stroke: ${activeStrokeColor};
            stroke-width: ${rc.ActiveStrokeWidth};
            stroke-opacity: ${activeStrokeOpacity};
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
        }    
    </style>`;

  let buf = svgContent.concat(``);

  buf = buf.concat(
    `<rect class="bgrect" x="0" y="0" height="${svgHeight}" width="${svgWidth}" />`
  );

  const ox = rc.Grouting + rc.Margin;
  const oy = rc.Grouting + rc.Margin;

  for (const [idy, row] of cells.entries()) {
    for (const [idx, cell] of row.entries()) {
      if (cell.FillState !== common.ACTIVE) {
        continue;
      }

      const x = ox + idx * (ri + rc.Grouting) - rc.Grouting / 2;
      const y = oy + idy * (ri + rc.Grouting) - rc.Grouting / 2;

      buf = buf.concat(`<g transform="translate(${x}, ${y})">`);

      if (cell.Turn === 3) {
        cell.Turn = 0;
      }
      if (rc.CellType.includes("knuth")) {
        buf = buf.concat(knuthTemplateArray[cell.KnuthType]);
      } else {
        buf = buf.concat(
          templateArray[common.ACTIVE][cell.Turn][cell.StartCorner][
            cell.EndCorner
          ]
        );
      }

      if (rc.Grouting > 0) {
        const xm = -rc.Grouting;
        const ym = -rc.Grouting;

        buf = buf.concat(
          `<rect x="${xm}" y="${ym}" height="${rc.Grouting}" width="${
            rc.Radius + rc.Grouting * 2
          }" fill="${rc.GroutingColorRaw}" stroke="none" />`
        );
        buf = buf.concat(
          `<rect x="${xm}" y="${ym}" height="${
            rc.Radius + rc.Grouting * 2
          }" width="${rc.Grouting}" fill="${
            rc.GroutingColorRaw
          }" stroke="none" />`
        );

        buf = buf.concat(
          `<rect x="${xm}" y="${ym + rc.Radius + rc.Grouting}" height="${
            rc.Grouting
          }" width="${rc.Radius + rc.Grouting * 2}" fill="${
            rc.GroutingColorRaw
          }" stroke="none" />`
        );
        buf = buf.concat(
          `<rect x="${xm + rc.Radius + rc.Grouting}" y="${ym}" height="${
            rc.Radius + rc.Grouting * 2
          }" width="${rc.Grouting}" fill="${
            rc.GroutingColorRaw
          }" stroke="none" />`
        );
      }

      buf = buf.concat(`</g>`);
    }
  }

  for (const [idy, row] of cells.entries()) {
    for (const [idx, cell] of row.entries()) {
      if (cell.FillState === common.ACTIVE) {
        continue;
      }

      const x = ox + idx * (ri + rc.Grouting) - rc.Grouting / 2;
      const y = oy + idy * (ri + rc.Grouting) - rc.Grouting / 2;

      switch (cell.FillState) {
        case common.OUTSIDE:
          buf = buf.concat(`<g transform="translate(${x}, ${y})">`);
          buf = buf.concat(templateArray[common.OUTSIDE][0][0][0]);
          buf = buf.concat(`</g>`);
          break;
        case common.INSIDE:
          buf = buf.concat(`<g transform="translate(${x}, ${y})">`);
          buf = buf.concat(templateArray[common.INSIDE][0][0][0]);
          buf = buf.concat(`</g>`);
          break;
      }
    }
  }

  if (rc.GridLines) {
    for (let w = 0; w < width + 4; w++) {
      const x = ox - rc.Grouting + w * (ri + rc.Grouting);
      buf = buf.concat(
        `<line x1="${x}" y1="0" x2="${x}" y2="${svgHeight}" stroke="#00000088" stroke-width="1" />`
      );
    }
    for (let h = 0; h < height + 4; h++) {
      const y = ox - rc.Grouting + h * (ri + rc.Grouting);
      buf = buf.concat(
        `<line x1="0" y1="${y}" x2="${svgWidth}" y2="${y}" stroke="#00000088" stroke-width="1" />`
      );
    }
  }

  buf = buf.concat(`</svg>`);

  return buf.toString();
}

function getInsideCellTemplate(rc: common.RequestConfig): string {
  const rectSX = rc.InsideStroke ? rc.InsideStrokeWidth / 2 : 0;
  const rectSY = rc.InsideStroke ? rc.InsideStrokeWidth / 2 : 0;
  const rectR = rc.Radius - (rc.InsideStroke ? rc.InsideStrokeWidth : 0);

  return `<g>
        <rect class="inside" x="${rectSX}" y="${rectSY}" height="${rectR}" width="${rectR}" />
    </g>`;
}

function getOutsideCellTemplate(rc: common.RequestConfig): string {
  const rectSX = rc.OutSideStroke ? rc.OutsideStrokeWidth / 2 : 0;
  const rectSY = rc.OutSideStroke ? rc.OutsideStrokeWidth / 2 : 0;
  const rectR = rc.Radius - (rc.OutSideStroke ? rc.OutsideStrokeWidth : 0);

  return `<g>
        <rect class="outside" x="${rectSX}" y="${rectSY}" height="${rectR}" width="${rectR}" />
    </g>`;
}

function getActiveCellTemplate(
  turn: number,
  start: number,
  bottom: number,
  rc: common.RequestConfig
): string {
  let buf = `<g>`;
  buf += getActiveCellBackgroundTemplate(rc);
  if (rc.PathStroke) {
    buf += getSVGCellDrawer(rc)(rc, turn, start, bottom);
  }
  buf += `</g>`;
  return buf;
}

function getActiveCellBackgroundTemplate(rc: common.RequestConfig): string {
  const rectSX = rc.ActiveStroke ? rc.ActiveStrokeWidth / 2 : 0;
  const rectSY = rc.ActiveStroke ? rc.ActiveStrokeWidth / 2 : 0;
  const rectR = rc.Radius - (rc.ActiveStroke ? rc.ActiveStrokeWidth : 0);

  return `<rect class="active" x="${rectSX}" y="${rectSY}" height="${rectR}" width="${rectR}" />`;
}

function getSVGCellDrawer(
  rc: common.RequestConfig
): (
  rc: common.RequestConfig,
  turn: number,
  start: number,
  end: number
) => void {
  switch (rc.CellType) {
    case "line":
      return getDragonPathLineTemplate;
    case "triangle":
      return getDragonTriTemplate;
    case "corner":
      return getDragonPathCornerTemplate;
    case "quadrant":
      return getDragonPathQuadarantTemplate;
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
  let buf = `<path class="dragon" `;

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
      buf += `d="M 0 ${d} L ${p1x} ${p1y} L ${d} ${2 * d}" />`;
      return buf;
    }

    if (knuthType === 2) {
      buf += `d="M ${d} ${2 * d} L ${p2x} ${p2y} L ${2 * d} ${d}" />`;
      return buf;
    }

    if (knuthType === 3) {
      buf += `d="M ${d} 0 L ${p3x} ${p3y} L ${2 * d} ${d}" />`;
      return buf;
    }

    if (knuthType === 4) {
      buf += `d="M 0 ${d} L ${p4x} ${p4y} L ${d} 0" />`;
      return buf;
    }

    if (knuthType === 5) {
      buf += `d="M 0 ${d} L ${p1x} ${p1y} L ${d} ${2 * d}" />`;
      buf += `<path class="dragon" d="M ${d} 0 L ${p3x} ${p3y} L ${
        2 * d
      } ${d}" />`;
      return buf;
    }

    if (knuthType === 6) {
      buf += `d="M ${d} ${2 * d} L ${p2x} ${p2y} L ${2 * d} ${d}" />`;
      buf += `<path class="dragon" d="M 0 ${d} L ${p4x} ${p4y} L ${d} 0" />`;
      return buf;
    }
  } else if (rc.CellType.includes("knuthcurve")) {
    if (knuthType === 1) {
      buf += `d="M ${rc.Radius / 2} ${rc.Radius} A ${rc.Radius / 2} ${
        rc.Radius / 2
      } 90 0 0 0 ${rc.Radius / 2}" />`;
      return buf;
    }

    if (knuthType === 2) {
      buf += `d="M ${rc.Radius / 2} ${rc.Radius} A ${rc.Radius / 2} ${
        rc.Radius / 2
      } 90 0 1 ${rc.Radius} ${rc.Radius / 2}" />`;
      return buf;
    }

    if (knuthType === 3) {
      buf += `d="M ${rc.Radius / 2} 0 A ${rc.Radius / 2} ${
        rc.Radius / 2
      } 90 0 0 ${rc.Radius} ${rc.Radius / 2}" />`;
      return buf;
    }

    if (knuthType === 4) {
      buf += `d="M ${rc.Radius / 2} 0 A ${rc.Radius / 2} ${
        rc.Radius / 2
      } 90 0 1 0 ${rc.Radius / 2}" />`;
      return buf;
    }

    if (knuthType === 5) {
      buf += `d="M ${rc.Radius / 2} ${rc.Radius} A ${rc.Radius / 2} ${
        rc.Radius / 2
      } 90 0 0 0 ${rc.Radius / 2}" />`;
      buf += `<path class="dragon" d="M ${rc.Radius / 2} 0 A ${rc.Radius / 2} ${
        rc.Radius / 2
      } 90 0 0 ${rc.Radius} ${rc.Radius / 2}" />`;
      return buf;
    }

    if (knuthType === 6) {
      buf += `d="M ${rc.Radius / 2} ${rc.Radius} A ${rc.Radius / 2} ${
        rc.Radius / 2
      } 90 0 1 ${rc.Radius} ${rc.Radius / 2}" />`;
      buf += `<path class="dragon" d="M ${rc.Radius / 2} 0 A ${rc.Radius / 2} ${
        rc.Radius / 2
      } 90 0 1 0 ${rc.Radius / 2}" />`;
      return buf;
    }
  } else {
    if (knuthType === 1) {
      buf += `d="M ${rc.Radius / 2} ${rc.Radius} L 0 ${rc.Radius / 2}" />`;
      return buf;
    }

    if (knuthType === 2) {
      buf += `d="M ${rc.Radius / 2} ${rc.Radius} L ${rc.Radius} ${
        rc.Radius / 2
      }" />`;
      return buf;
    }

    if (knuthType === 3) {
      buf += `d="M ${rc.Radius / 2} 0 L ${rc.Radius} ${rc.Radius / 2}" />`;
      return buf;
    }

    if (knuthType === 4) {
      buf += `d="M 0 ${rc.Radius / 2} L ${rc.Radius / 2} 0" />`;
      return buf;
    }

    if (knuthType === 5) {
      buf += `d="M ${rc.Radius / 2} ${rc.Radius} L 0 ${rc.Radius / 2}" />`;
      buf += `<path class="dragon" d="M ${rc.Radius / 2} 0 L ${rc.Radius} ${
        rc.Radius / 2
      }" />`;
      return buf;
    }

    if (knuthType === 6) {
      buf += `d="M ${rc.Radius / 2} ${rc.Radius} L ${rc.Radius} ${
        rc.Radius / 2
      }" />`;
      buf += `<path class="dragon" d="M 0 ${rc.Radius / 2} L ${
        rc.Radius / 2
      } 0" />`;
      return buf;
    }
  }
  return buf;
}

function getDragonPathQuadarantTemplate(
  rc: common.RequestConfig,
  turn: number,
  start: number,
  end: number
): string {
  let buf = `<path class="dragon" `;

  if (turn === 3) {
    turn = 0;
  }

  const r = rc.Radius;
  if (
    (start === 0 && end === 2 && turn === 0) ||
    (start === 2 && end === 0 && turn === 1)
  ) {
    buf += `d="M 0 0 A ${r} ${r} 90 0 0 ${r} ${r}" />`;
    return buf;
  }
  if (
    (start === 0 && end === 2 && turn === 1) ||
    (start === 2 && end === 0 && turn === 0)
  ) {
    buf += `d="M 0 0 A ${r} ${r} 90 0 1 ${r} ${r}" />`;
    return buf;
  }

  if (
    (start === 1 && end === 3 && turn === 0) ||
    (start === 3 && end === 1 && turn === 1)
  ) {
    buf += `d="M ${r} 0 A ${r} ${r} 90 0 0 0 ${r}" />`;
    return buf;
  }
  if (
    (start === 1 && end === 3 && turn === 1) ||
    (start === 3 && end === 1 && turn === 0)
  ) {
    buf += `d="M ${r} 0 A ${r} ${r} 90 0 1 0 ${r}" />`;
    return buf;
  }

  return buf;
}

function getDragonPathLineTemplate(
  rc: common.RequestConfig,
  _turn: number,
  start: number,
  end: number
): string {
  let buf = `<path class="dragon" `;

  if ((start === 0 && end === 2) || (start === 2 && end === 0)) {
    buf += `d="M 0 0 L ${rc.Radius} ${rc.Radius}" />`;
  }

  if ((start === 1 && end === 3) || (start === 3 && end === 1)) {
    buf += `d="M ${rc.Radius} 0 L 0 ${rc.Radius}" />`;
  }
  return buf;
}

function getDragonTriTemplate(
  rc: common.RequestConfig,
  turn: number,
  start: number,
  end: number
): string {
  let buf = `<path class="dragon" `;

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

  if (turn === 3) {
    turn = 0;
  }
  const r = rc.Radius;
  if (
    (start === 0 && end === 2 && turn === 0) ||
    (start === 2 && end === 0 && turn === 1)
  ) {
    buf += `d="M 0 0 L ${p1x} ${p1y} L ${r} ${r}" />`;
    return buf;
  }
  if (
    (start === 0 && end === 2 && turn === 1) ||
    (start === 2 && end === 0 && turn === 0)
  ) {
    buf += `d="M 0 0 L ${p2x} ${p2y} L ${r} ${r}" />`;
    return buf;
  }

  if (
    (start === 1 && end === 3 && turn === 0) ||
    (start === 3 && end === 1 && turn === 1)
  ) {
    buf += `d="M ${r} 0 L ${p3x} ${p3y} L 0 ${r}" />`;
    return buf;
  }
  if (
    (start === 1 && end === 3 && turn === 1) ||
    (start === 3 && end === 1 && turn === 0)
  ) {
    buf += `d="M ${r} 0 L ${p4x} ${p4y} L 0 ${r}" />`;
    return buf;
  }

  return buf;
}

function getDragonPathCornerTemplate(
  rc: common.RequestConfig,
  turn: number,
  start: number,
  end: number
): string {
  let buf = `<path class="dragon" `;

  if (turn === 3) {
    turn = 0;
  }
  const r = rc.Radius;
  if (
    (start === 0 && end === 2 && turn === 0) ||
    (start === 2 && end === 0 && turn === 1)
  ) {
    buf += `d="M 0 0 L 0 ${r} L ${r} ${r}" />`;
    return buf;
  }
  if (
    (start === 0 && end === 2 && turn === 1) ||
    (start === 2 && end === 0 && turn === 0)
  ) {
    buf += `d="M 0 0 L ${r} 0 L ${r} ${r}" />`;
    return buf;
  }

  if (
    (start === 1 && end === 3 && turn === 0) ||
    (start === 3 && end === 1 && turn === 1)
  ) {
    buf += `d="M ${r} 0 L 0 0 L 0 ${r}" />`;
    return buf;
  }
  if (
    (start === 1 && end === 3 && turn === 1) ||
    (start === 3 && end === 1 && turn === 0)
  ) {
    buf += `d="M ${r} 0 L ${r} ${r} L 0 ${r}" />`;
    return buf;
  }

  return buf;
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

export function getDragonSizeSVG(rc: common.RequestConfig): [number, number] {
  let pc = common.prepareCells(rc, true);

  let width = pc[1];
  let height = pc[2];

  const svgWidth =
    2 * rc.Margin + (width + 3) * rc.Radius + (width + 3) * rc.Grouting;
  const svgHeight =
    2 * rc.Margin + (height + 3) * rc.Radius + (height + 3) * rc.Grouting;
  return [svgWidth, svgHeight];
}

export function getDragonSVG(rc: common.RequestConfig): string {
  let pc = common.prepareCells(rc, true);
  const buf = pc[0] ? createSVG(pc[0], pc[3], pc[4], pc[5], pc[6], rc) : "";
  return buf;
}
