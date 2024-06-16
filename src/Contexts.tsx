import react, { createContext } from "react";

export const ThemeContext = createContext("light");
export const AuthContext = createContext(null);

export interface Config {
  state: any;
  setState: react.Dispatch<
    react.SetStateAction<{
      folds: string;
      margin: string;
      cellType: string;
      triangleAngle: string;
      radius: string;
      grouting: string;
      gridlines: boolean;
      groutingColor: string;
      pallette: string;
    }>
  >;
  pathState: any;
  setPathState: react.Dispatch<
    react.SetStateAction<{
      borderStyle: string;
      borderWidth: string;
      borderColor: string;
      borderEnabled: boolean;
      title: string;
      shortTitle: string;
      startDirection: string;
    }>
  >;
  insideCellState: any;
  setInsideCellState: react.Dispatch<
    react.SetStateAction<{
      borderStyle: string;
      borderWidth: string;
      borderColor: string;
      backgroundColor: string;
      borderEnabled: boolean;
      fillEnabled: boolean;
      title: string;
      shortTitle: string;
    }>
  >;
  activeCellState: any;
  setActiveCellState: react.Dispatch<
    react.SetStateAction<{
      borderStyle: string;
      borderWidth: string;
      borderColor: string;
      backgroundColor: string;
      borderEnabled: boolean;
      fillEnabled: boolean;
      title: string;
      shortTitle: string;
    }>
  >;
  outsideCellState: any;
  setOutsideCellState: react.Dispatch<
    react.SetStateAction<{
      borderStyle: string;
      borderWidth: string;
      borderColor: string;
      backgroundColor: string;
      borderEnabled: boolean;
      fillEnabled: boolean;
      title: string;
      shortTitle: string;
    }>
  >;
  collageConfig: any;
  setCollageConfig: react.Dispatch<
    react.SetStateAction<{
      width: number;
      height: number;
      elementWidth: number;
      elementGap: number;
      gapColor: string;
      startDirection: number;
      format: string;
    }>
  >;
  settingsConfig: any;
  setSettingsConfig: react.Dispatch<
    react.SetStateAction<{
      slideShowInterval: number;
      background: string;
    }>
  >;
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
  dirty: boolean;
  setDirty: react.Dispatch<react.SetStateAction<boolean>>;
  urlHead: string;
  updateImage: (newImgUrl: string) => void; // Added function
  slideShow: boolean;
  setSlideShow: react.Dispatch<react.SetStateAction<boolean>>;
  imageSize: any;
  setImageSize: react.Dispatch<
    react.SetStateAction<{
      width: string;
      height: string;
      zoom: string;
    }>
  >;
}

export const CurrentConfigContext = createContext<Config>({} as Config);
