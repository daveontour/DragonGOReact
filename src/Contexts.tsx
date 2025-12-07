import react, { createContext } from "react";
import {
  DragonCurveState,
  PathState,
  ActiveCellState,
  InsideCellState,
  OutsideCellState,
  CollageConfig,
  SettingsConfig,
  ImageSize,
} from "./types";

export const ThemeContext = createContext("light");
export const AuthContext = createContext(null);

export interface Config {
  state: DragonCurveState;
  setState: react.Dispatch<react.SetStateAction<DragonCurveState>>;
  pathState: PathState;
  setPathState: react.Dispatch<react.SetStateAction<PathState>>;
  insideCellState: InsideCellState;
  setInsideCellState: react.Dispatch<react.SetStateAction<InsideCellState>>;
  activeCellState: ActiveCellState;
  setActiveCellState: react.Dispatch<react.SetStateAction<ActiveCellState>>;
  outsideCellState: OutsideCellState;
  setOutsideCellState: react.Dispatch<react.SetStateAction<OutsideCellState>>;
  collageConfig: CollageConfig;
  setCollageConfig: react.Dispatch<react.SetStateAction<CollageConfig>>;
  settingsConfig: SettingsConfig;
  setSettingsConfig: react.Dispatch<react.SetStateAction<SettingsConfig>>;
  downloadShow: boolean;
  setDownloadShow: react.Dispatch<react.SetStateAction<boolean>>;
  settingsShow: boolean;
  setSettingsShow: react.Dispatch<react.SetStateAction<boolean>>;
  foldsShow: boolean;
  setFoldsShow: react.Dispatch<react.SetStateAction<boolean>>;
  saveShow: boolean;
  setSaveShow: react.Dispatch<react.SetStateAction<boolean>>;
  loadShow: boolean;
  setLoadShow: react.Dispatch<react.SetStateAction<boolean>>;
  showRendererHelp: boolean;
  setShowRendererHelp: react.Dispatch<react.SetStateAction<boolean>>;
  showFoldsHelp: boolean;
  setShowFoldsHelp: react.Dispatch<react.SetStateAction<boolean>>;
  showSlideShowConfig: boolean;
  setSlideShowConfig: react.Dispatch<react.SetStateAction<boolean>>;
  slideShowRandomise: boolean;
  setSlideShowRandomise: react.Dispatch<react.SetStateAction<boolean>>;
  slideShowAutoDownload: boolean;
  setSlideShowAutoDownload: react.Dispatch<react.SetStateAction<boolean>>;
  dirty: boolean;
  setDirty: react.Dispatch<react.SetStateAction<boolean>>;
  urlHead: string;
  updateImage: (newImgUrl: string) => void; // Added function
  slideShow: boolean;
  setSlideShow: react.Dispatch<react.SetStateAction<boolean>>;
  slideShowPause: boolean;
  setSlideShowPause: react.Dispatch<react.SetStateAction<boolean>>;
  imageSize: ImageSize;
  setImageSize: react.Dispatch<react.SetStateAction<ImageSize>>;
  randomiserScheme: string;
  setRandomiserScheme: react.Dispatch<react.SetStateAction<string>>;
  randomHue: boolean;
  setRandomHue: react.Dispatch<react.SetStateAction<boolean>>;
  lastConstrastValue: string;
  setLastConstrastValue: react.Dispatch<react.SetStateAction<string>>;
  contrastCount: number;
  setContrastCount: react.Dispatch<react.SetStateAction<number>>;
  configJSON: string;
  setConfigJSON: react.Dispatch<react.SetStateAction<string>>;
  intervalID: number | null;
  setIntervalID: react.Dispatch<react.SetStateAction<number | null>>;
  stopSlideShow: boolean;
  setStopSlideShow: react.Dispatch<react.SetStateAction<boolean>>;
}

export const CurrentConfigContext = createContext<Config>({} as Config);
