// Color and styling types
export type ColorValue = string; // Hex color string (e.g., "#000000ff")
export type BorderWidth = string; // CSS border width (e.g., "3px")

// Fill state type for cells
export type FillStateType = number | string; // Can be number (0, 1, 2) or string ("INSIDE", "OUTSIDE", "ACTIVE")

// Main dragon curve state
export interface DragonCurveState {
  folds: string;
  margin: string;
  cellType: string;
  triangleAngle: string;
  radius: string;
  grouting: string;
  gridlines: boolean;
  groutingColor: string;
  pallette: string;
}

// Path configuration state
export interface PathState {
  borderStyle: string;
  borderWidth: BorderWidth;
  borderColor: ColorValue;
  borderEnabled: boolean;
  title: string;
  shortTitle: string;
  startDirection: string;
}

// Base cell state (shared properties)
export interface BaseCellState {
  borderStyle: string;
  borderWidth: BorderWidth;
  borderColor: ColorValue;
  borderRadius: string;
  backgroundColor: ColorValue;
  borderEnabled: boolean;
  fillEnabled: boolean;
  title: string;
  shortTitle: string;
}

// Union type for all cell states
export type CellState = ActiveCellState | InsideCellState | OutsideCellState;

// Active cell state
export interface ActiveCellState extends BaseCellState {}

// Inside cell state
export interface InsideCellState extends BaseCellState {}

// Outside cell state
export interface OutsideCellState extends BaseCellState {}

// Collage configuration
export interface CollageConfig {
  width: number;
  height: number;
  elementWidth: number;
  elementGap: number;
  gapColor: string;
  startDirection: number;
  format: string;
}

// Settings configuration
export interface SettingsConfig {
  slideShowInterval: number;
  background: string;
}

// Image size configuration
export interface ImageSize {
  width: string;
  height: string;
  zoom: string;
}

// Function types
export type SetShowFullScreen = (show: boolean) => void;
export type StopSlideShowNow = () => void;
export type SetSlideShowRandomFunction = () => void;

// Saved config structure (what gets saved/loaded)
export interface SavedConfig {
  outside: OutsideCellState;
  inside: InsideCellState;
  active: ActiveCellState;
  path: PathState;
  state: DragonCurveState;
}

// Randomiser return type tuple
export type RandomiserReturnType = [
  DragonCurveState,
  PathState,
  ActiveCellState,
  InsideCellState,
  OutsideCellState
];

// Cell state parameter types for randomiser functions
export interface PathStateParam {
  borderStyle: string;
  borderWidth: BorderWidth;
  borderColor: ColorValue;
  borderEnabled: boolean;
  startDirection: string;
}

export interface CellStateParam {
  borderStyle: string;
  borderWidth: BorderWidth;
  borderColor: ColorValue;
  backgroundColor: ColorValue;
  borderEnabled: boolean;
  fillEnabled: boolean;
}

