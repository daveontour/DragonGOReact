import { describe, expect, it } from "vitest";
import { buildLoadedSnapshot, parseSavedConfig } from "./savedConfig";
import { SavedConfig } from "../types";

function createSavedConfig(overrides: Partial<SavedConfig> = {}): SavedConfig {
  return {
    state: {
      folds: "11",
      margin: "2",
      cellType: "knuthcurve",
      triangleAngle: "45",
      radius: "30",
      grouting: "3",
      gridlines: true,
      tileBlockGridSize: 4,
      groutingColor: "#ffffffff",
      pallette: "vibrant",
      ...overrides.state,
    },
    path: {
      borderStyle: "solid",
      borderWidth: "3px",
      borderColor: "#000000ff",
      borderEnabled: true,
      title: "Path",
      shortTitle: "Path",
      startDirection: "UP",
      ...overrides.path,
    },
    active: {
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "#000000ff",
      borderRadius: "0px",
      backgroundColor: "#7090B7FF",
      borderEnabled: true,
      fillEnabled: true,
      title: "Active",
      shortTitle: "Active",
      ...overrides.active,
    },
    inside: {
      borderStyle: "solid",
      borderWidth: "2px",
      borderColor: "#00ffff",
      borderRadius: "0px",
      backgroundColor: "#ff0000",
      borderEnabled: false,
      fillEnabled: true,
      title: "Inside",
      shortTitle: "Inside",
      ...overrides.inside,
    },
    outside: {
      borderStyle: "solid",
      borderWidth: "2px",
      borderColor: "#000000ff",
      borderRadius: "0px",
      backgroundColor: "#00ff00",
      borderEnabled: false,
      fillEnabled: false,
      title: "Outside",
      shortTitle: "Outside",
      ...overrides.outside,
    },
    ...overrides,
  };
}

describe("savedConfig", () => {
  it("parseSavedConfig accepts a valid saved configuration", () => {
    const saved = createSavedConfig();
    const parsed = parseSavedConfig(JSON.stringify(saved));

    expect(parsed.state.folds).toBe("11");
    expect(parsed.path.startDirection).toBe("UP");
  });

  it("buildLoadedSnapshot merges saved values over current config", () => {
    const saved = createSavedConfig();
    const current = {
      state: { folds: "9", pallette: "pastel" },
      pathState: { startDirection: "LEFT" },
      activeCellState: { backgroundColor: "#000000ff" },
      insideCellState: {},
      outsideCellState: {},
    };

    const snapshot = buildLoadedSnapshot(current as never, saved);

    expect(snapshot[0].folds).toBe("11");
    expect(snapshot[0].pallette).toBe("vibrant");
    expect(snapshot[1].startDirection).toBe("UP");
    expect(snapshot[2].backgroundColor).toBe("#7090B7FF");
  });
});
