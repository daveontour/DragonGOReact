import { describe, expect, it } from "vitest";
import { RequestConfig } from "./common";
import { getDragonSVG, getDragonSizeSVG } from "./svg";

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
    GridLines: false,
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
