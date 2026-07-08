import { Config } from "./Contexts";
import { RandomiserReturnType, SavedConfig } from "./types";

export function buildSavedConfig(config: Config): SavedConfig {
  return {
    state: config.state,
    path: config.pathState,
    active: config.activeCellState,
    inside: config.insideCellState,
    outside: config.outsideCellState,
  };
}

export function parseSavedConfig(text: string): SavedConfig {
  const parsed = JSON.parse(text) as Partial<SavedConfig>;
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !parsed.state ||
    !parsed.path ||
    !parsed.active ||
    !parsed.inside ||
    !parsed.outside
  ) {
    throw new Error("Invalid configuration file");
  }
  return parsed as SavedConfig;
}

export function buildLoadedSnapshot(
  config: Config,
  saved: SavedConfig
): RandomiserReturnType {
  return [
    { ...config.state, ...saved.state },
    { ...config.pathState, ...saved.path },
    { ...config.activeCellState, ...saved.active },
    { ...config.insideCellState, ...saved.inside },
    { ...config.outsideCellState, ...saved.outside },
  ];
}

export function applySavedConfig(config: Config, saved: SavedConfig): void {
  config.setActiveCellState({ ...config.activeCellState, ...saved.active });
  config.setOutsideCellState({ ...config.outsideCellState, ...saved.outside });
  config.setInsideCellState({ ...config.insideCellState, ...saved.inside });
  config.setPathState({ ...config.pathState, ...saved.path });
  config.setState({ ...config.state, ...saved.state });
}
