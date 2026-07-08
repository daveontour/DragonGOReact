import { describe, expect, it } from "vitest";
import { RequestConfig } from "./common";
import { getDragonSVG, getDragonSizeSVG, getOverlayBlockDetails, getPlansDisplaySVG, getPlansSizeSVG, getPlansSVG } from "./svg";

function createTestRequestConfig(
  overrides: Partial<RequestConfig> = {}
): RequestConfig {
  return {
    OutSideFill: false,
    OutSideStroke: false,
    InsideFill: false,
    InsideStroke: false,
    ActiveFill: true,
    ActiveStroke: false,
    PathStroke: true,
    NoCells: false,
    GridLines: false,
    TileBlockGridSize: 0,
    NumberFolds: 2,
    Radius: 10,
    StartDirection: 0,
    CellType: "line",
    OriginX: 0,
    OrignY: 0,
    Margin: 5,
    InsideStrokeColorRaw: "#000000",
    InsideFillColorRaw: "#ffffff",
    OutsideStrokeColorRaw: "#000000",
    OutsideFillColorRaw: "#ffffff",
    ActiveStrokeColorRaw: "#000000",
    ActiveFillColorRaw: "#ff0000",
    PathStrokeColorRaw: "#000000",
    GroutingColorRaw: "cccccc",
    InsideStrokeWidth: 1,
    OutsideStrokeWidth: 1,
    ActiveStrokeWidth: 1,
    PathWidth: 1,
    Grouting: 2,
    TriangleAngle: 45,
    Format: "",
    ...overrides,
  };
}

function horizontalLineYValues(svg: string): number[] {
  const matches = svg.matchAll(/<line x1="0" y1="([^"]+)"/g);
  return [...matches].map((match) => Number(match[1]));
}

describe("getDragonSVG", () => {
  it.each([
    ["line", { CellType: "line" }],
    ["triangle", { CellType: "triangle" }],
    ["corner", { CellType: "corner" }],
    ["quadrant", { CellType: "quadrant" }],
    ["knuth", { CellType: "knuth" }],
    ["knuthcurve", { CellType: "knuthcurve" }],
    ["knuthtri", { CellType: "knuthtri" }],
  ])("matches snapshot for %s cell type", (_label, overrides) => {
    const rc = createTestRequestConfig(overrides);
    expect(getDragonSVG(rc)).toMatchSnapshot();
  });

  it("returns empty string when NumberFolds is zero", () => {
    const rc = createTestRequestConfig({ NumberFolds: 0 });
    expect(getDragonSVG(rc)).toBe("");
  });

  it("assigns separate path indices to complementary knuth segments", () => {
    for (let folds = 4; folds <= 20; folds++) {
      const rc = createTestRequestConfig({ CellType: "knuth", NumberFolds: folds });
      const svg = getDragonSVG(rc);
      const segmentPairs = [
        ...svg.matchAll(
          /<g transform="translate\([^"]+\)"><g>[\s\S]*?<path class="dragon" data-path-index="(\d+)"[\s\S]*?<path class="dragon" data-path-index="(\d+)"/g
        ),
      ];
      const pair = segmentPairs.find((match) => match[1] !== match[2]);
      if (pair) {
        expect(Number(pair[1])).not.toBe(Number(pair[2]));
        return;
      }
    }

    expect.fail("expected complementary knuth tile in test range");
  });

  it("includes expected viewBox dimensions from getDragonSizeSVG", () => {
    const rc = createTestRequestConfig();
    const [svgWidth, svgHeight] = getDragonSizeSVG(rc);
    const svg = getDragonSVG(rc);

    expect(svg).toContain(`viewBox="0 0 ${svgWidth.toFixed(2)} ${svgHeight.toFixed(2)}"`);
  });
});

describe("grid lines", () => {
  it("positions horizontal lines using the vertical origin", () => {
    const rc = createTestRequestConfig({
      GridLines: true,
      Margin: 7,
      Grouting: 3,
      Radius: 10,
      NumberFolds: 1,
    });
    const svg = getDragonSVG(rc);
    const oy = rc.Grouting + rc.Margin;
    const expectedFirstY = oy - rc.Grouting;

    expect(horizontalLineYValues(svg)[0]).toBe(expectedFirstY);
    expect(svg).toMatchSnapshot();
  });
});

describe("tile block grid", () => {
  it("draws lines every six tiles when size is 6", () => {
    const rc = createTestRequestConfig({
      TileBlockGridSize: 6,
      Margin: 7,
      Grouting: 3,
      Radius: 10,
      NumberFolds: 5,
    });
    const svg = getDragonSVG(rc);
    const ox = rc.Grouting + rc.Margin;
    const blockPitch = 6 * (rc.Radius + rc.Grouting);
    const expectedFirstX = ox - rc.Grouting;
    const expectedSecondX = expectedFirstX + blockPitch;

    expect(svg).toContain(
      `<line x1="${expectedFirstX}" y1="0" x2="${expectedFirstX}"`
    );
    expect(svg).toContain(
      `<line x1="${expectedSecondX}" y1="0" x2="${expectedSecondX}"`
    );
    expect(svg).toContain('stroke-width="2"');
  });

  it("draws no overlay lines when size is 0", () => {
    const rc = createTestRequestConfig({
      TileBlockGridSize: 0,
      NumberFolds: 5,
    });
    const svg = getDragonSVG(rc);

    expect(svg).not.toContain('stroke="#000000aa" stroke-width="2"');
  });
});

describe("plans grid overlay", () => {
  it("includes tile block grid when enabled", () => {
    const rc = createTestRequestConfig({
      TileBlockGridSize: 6,
      NumberFolds: 5,
    });
    const svg = getPlansSVG(rc);

    expect(svg).toContain('stroke="#000000aa" stroke-width="2"');
  });

  it("omits tile block grid when size is 0", () => {
    const rc = createTestRequestConfig({
      TileBlockGridSize: 0,
      NumberFolds: 5,
    });
    const svg = getPlansSVG(rc);

    expect(svg).not.toContain('stroke="#000000aa" stroke-width="2"');
  });
});

describe("plans display", () => {
  it("getPlansDisplaySVG keeps responsive sizing attributes", () => {
    const rc = createTestRequestConfig({ NumberFolds: 5 });
    const svg = getPlansDisplaySVG(rc);

    expect(svg).toContain('width="100%" height="100%"');
    expect(svg).not.toContain('<rect class="plans-stats-box"');
  });

  it("getPlansDisplaySVG adds overlay hit targets when grid overlay is enabled", () => {
    const rc = createTestRequestConfig({
      NumberFolds: 5,
      TileBlockGridSize: 3,
    });
    const svg = getPlansDisplaySVG(rc);

    expect(svg).toContain('class="plan-block-hit"');
    expect(svg).toContain('data-block-row="0"');
    expect(svg).toContain('data-block-col="0"');
  });

  it("getPlansSVG includes the statistics box", () => {
    const rc = createTestRequestConfig({ NumberFolds: 5 });
    const svg = getPlansSVG(rc);

    expect(svg).toContain('<rect class="plans-stats-box"');
  });

  it("getPlansSizeSVG returns viewBox dimensions", () => {
    const rc = createTestRequestConfig({ NumberFolds: 5 });
    const [w, h] = getPlansSizeSVG(rc);

    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
  });
});

describe("no cells mode", () => {
  it("renders only the dragon path without cell rectangles", () => {
    const rc = createTestRequestConfig({
      NoCells: true,
      Grouting: 0,
      ActiveFill: false,
      InsideFill: false,
      OutSideFill: false,
      PathStroke: true,
      NumberFolds: 3,
    });
    const svg = getDragonSVG(rc);

    expect(svg).toContain('class="dragon"');
    expect(svg).not.toContain('class="inside"');
    expect(svg).not.toContain('class="outside"');
    expect(svg).not.toContain('class="active"');
  });
});

describe("overlay block details", () => {
  it("returns tile details for a selected overlay square", () => {
    const rc = createTestRequestConfig({
      NumberFolds: 5,
      TileBlockGridSize: 3,
    });
    const details = getOverlayBlockDetails(rc, 0, 0);

    expect(details).not.toBeNull();
    expect(details?.startRow).toBe(1);
    expect(details?.startCol).toBe(1);
    expect(details?.endRow).toBe(3);
    expect(details?.endCol).toBe(3);
    expect(details?.total).toBe(9);
    expect(details?.tiles).toHaveLength(9);
    expect(details?.svg).toContain("<svg");
  });
});
