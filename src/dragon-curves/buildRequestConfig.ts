import { Config } from "./Contexts";
import { DOWN, LEFT, RequestConfig, RIGHT, UP } from "./engine/common";

export function applyNoCellsOverrides(
  rc: RequestConfig,
  noCells: boolean
): RequestConfig {
  if (!noCells) {
    return rc;
  }
  return {
    ...rc,
    NoCells: true,
    Grouting: 0,
    ActiveFill: false,
    ActiveStroke: false,
    InsideFill: false,
    InsideStroke: false,
    OutSideFill: false,
    OutSideStroke: false,
  };
}

export function buildRequestConfig(config: Config): RequestConfig {
  let sd = LEFT;
  if (config.pathState.startDirection === "random") {
    const directions = [UP, DOWN, LEFT, RIGHT];
    sd = directions[Math.floor(Math.random() * 4)];
  } else if (config.pathState.startDirection === "LEFT") {
    sd = LEFT;
  } else if (config.pathState.startDirection === "RIGHT") {
    sd = RIGHT;
  } else if (config.pathState.startDirection === "UP") {
    sd = UP;
  } else if (config.pathState.startDirection === "DOWN") {
    sd = DOWN;
  }

  const rc: RequestConfig = {
    OutSideFill: config.outsideCellState.fillEnabled,
    OutSideStroke: config.outsideCellState.borderEnabled,
    InsideFill: config.insideCellState.fillEnabled,
    InsideStroke: config.insideCellState.borderEnabled,
    ActiveFill: config.activeCellState.fillEnabled,
    ActiveStroke: config.activeCellState.borderEnabled,
    PathStroke: config.pathState.borderEnabled,
    NoCells: false,
    GridLines: config.state.gridlines,
    TileBlockGridSize: config.state.tileBlockGridSize,
    NumberFolds: Number(config.state.folds),
    Radius: Number(config.state.radius),
    StartDirection: sd,
    CellType: config.state.cellType,
    OriginX: 0,
    OrignY: 0,
    Margin: Number(config.state.margin.replace(/px/g, "")),
    InsideStrokeColorRaw: config.insideCellState.borderColor,
    InsideFillColorRaw: config.insideCellState.backgroundColor,
    OutsideStrokeColorRaw: config.outsideCellState.borderColor,
    OutsideFillColorRaw: config.outsideCellState.backgroundColor,
    ActiveStrokeColorRaw: config.activeCellState.borderColor,
    ActiveFillColorRaw: config.activeCellState.backgroundColor,
    PathStrokeColorRaw: config.pathState.borderColor,
    GroutingColorRaw: config.state.groutingColor,
    InsideStrokeWidth: Number(
      config.insideCellState.borderWidth.replace(/px/g, "")
    ),
    OutsideStrokeWidth: Number(
      config.outsideCellState.borderWidth.replace(/px/g, "")
    ),
    ActiveStrokeWidth: Number(
      config.activeCellState.borderWidth.replace(/px/g, "")
    ),
    PathWidth: Number(config.pathState.borderWidth.replace(/px/g, "")),
    Grouting: Number(config.state.grouting.replace(/px/g, "")),
    TriangleAngle: Number(config.state.triangleAngle),
    Format: "",
  };
  return applyNoCellsOverrides(rc, config.state.noCells);
}
