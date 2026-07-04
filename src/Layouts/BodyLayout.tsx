import ControlLayout from "./ControlLayout";
import ImageLayout from "./ImageLayout";
import { CurrentConfigContext } from "../Contexts";
import { useRef, useState } from "react";
import { executeRandomiser } from "../randomiserSchemes";
import { SetShowFullScreen } from "../types";
import type {
  ActiveCellState,
  DragonCurveState,
  InsideCellState,
  OutsideCellState,
  PathState,
} from "../types";

export default function BodyLayout({
  showFullScreen,
  setShowFullScreen,
  handlersRef,
}: {
  showFullScreen: boolean;
  setShowFullScreen: SetShowFullScreen;
  handlersRef?: React.MutableRefObject<{
    getIntervalID: () => number | null;
    getConfigJSON: () => string;
  } | null>;
}) {
  const [slideShow, setSlideShow] = useState(false);
  const [slideShowPause, setSlideShowPause] = useState(false);
  const [imageSize, setImageSize] = useState({
    width: "calc(100vw - 400px)",
    height: "auto",
    zoom: "100",
  });

  const [settingsConfig, setSettingsConfig] = useState({
    background: "plain",
    slideShowInterval: 5,
  });

  const [state, setState] = useState<DragonCurveState>({
    folds: "9",
    margin: "1",
    cellType: "knuthcurve",
    triangleAngle: "45",
    radius: "22",
    grouting: "2",
    gridlines: false,
    groutingColor: "#ffffffff",
    pallette: "pastel",
  });

  const [pathState, setPathState] = useState<PathState>({
    borderStyle: "solid",
    borderWidth: "3px",
    borderColor: "#000000ff",
    borderEnabled: true,
    title:
      "Dragon Path Curve Configuration (The path that the dragon curve follows)",
    shortTitle: "Dragon Curve Path Configuration",
    startDirection: "LEFT",
  });
  const [activeCellState, setActiveCellState] = useState<ActiveCellState>({
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#000000ff",
    borderRadius: "0px",
    backgroundColor: "#7090B7FF",
    borderEnabled: true,
    fillEnabled: true,
    title: "Active Tile Configuration (Tiles that the path passes through)",
    shortTitle: "Active Tile Configuration",
  });

  const [insideCellState, setInsideCellState] = useState<InsideCellState>({
    borderStyle: "solid",
    borderWidth: "2px",
    borderColor: "#00ffff",
    borderRadius: "0px",
    backgroundColor: "#ff0000",
    borderEnabled: false,
    fillEnabled: false,
    title: "Inside Tile Configuration (Empty tiles encompassed by the path)",
    shortTitle: "Inside Tile Configuration",
  });
  const [outsideCellState, setOutsideCellState] = useState<OutsideCellState>({
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#000000ff",
    borderRadius: "0px",
    backgroundColor: "#7090b7cc",
    borderEnabled: true,
    fillEnabled: true,
    title:
      "Outside Tile Configuration (Empty tiles not encompassed by the path)",
    shortTitle: "Outside Tile Configuration",
  });
  const [collageConfig, setCollageConfig] = useState({
    width: 7,
    height: 7,
    elementWidth: 100,
    elementGap: 5,
    gapColor: "#dddddd",
    startDirection: 0,
    format: "png",
  });
  const [downloadShow, setDownloadShow] = useState(false);
  const [foldsShow, setFoldsShow] = useState(false);
  const [saveShow, setSaveShow] = useState(false);
  const [loadShow, setLoadShow] = useState(false);
  const [showRendererHelp, setShowRendererHelp] = useState(false);
  const [showFoldsHelp, setShowFoldsHelp] = useState(false);
  const [showSlideShowConfig, setSlideShowConfig] = useState(false);
  const [slideShowAutoDownload, setSlideShowAutoDownload] = useState(false);
  const [slideShowRandomiseCellType, setSlideShowRandomiseCellType] =
    useState(true);
  const slideShowRandomiseCellTypeRef = useRef(true);
  slideShowRandomiseCellTypeRef.current = slideShowRandomiseCellType;
  const [dirty, setDirty] = useState(false);
  const [randomiserScheme, setRandomiserScheme] = useState("standard");
  const [randomHue, setRandomHue] = useState(false);
  const [lastConstrastValue, setLastConstrastValue] = useState("");
  const [contrastCount, setContrastCount] = useState(0);
  const [configJSON, setConfigJSON] = useState("");
  const [intervalID, setIntervalID] = useState<number | null>(null);
  const [stopSlideShow, setStopSlideShow] = useState(false);

  // Expose handlers to parent component
  if (handlersRef) {
    handlersRef.current = {
      getIntervalID: () => intervalID,
      getConfigJSON: () => configJSON,
    };
  }

  const setSlideShowRandom = () => {
    const schemes = [
      "standard",
      "noOutside",
      "boldPath",
      "pathOnly",
      "triangular",
    ];
    const palettes = [
      "pastel",
      "vibrant",
      "redhue",
      "greenhue",
      "bluehue",
      "randomhue",
      "highcontrast",
      "random",
      "vangogh",
      "monet",
      "blueyellow",
    ];
    const scheme = schemes[Math.floor(Math.random() * schemes.length)];
    const palette = palettes[Math.floor(Math.random() * palettes.length)];
    setRandomiserScheme(scheme);
    setRandomHue(palette === "randomhue");

    setState((currentState) => {
    let s = executeRandomiser(
        { ...currentState, pallette: palette },
      pathState,
      activeCellState,
      insideCellState,
        outsideCellState,
        scheme,
        palette,
        lastConstrastValue,
        contrastCount,
        setLastConstrastValue,
        setContrastCount,
        slideShowRandomiseCellTypeRef.current
      );
      
      // Update other states using current values
      setPathState((currentPathState) => ({
        ...currentPathState,
      borderStyle: s[1].borderStyle,
      borderWidth: s[1].borderWidth,
      borderColor: s[1].borderColor,
      borderEnabled: s[1].borderEnabled,
      startDirection: s[1].startDirection,
      }));
      setInsideCellState((currentInsideState) => ({
        ...currentInsideState,
      borderStyle: s[2].borderStyle,
      borderWidth: s[2].borderWidth,
      borderColor: s[2].borderColor,
      borderEnabled: s[2].borderEnabled,
      backgroundColor: s[2].backgroundColor,
      fillEnabled: s[2].fillEnabled,
      }));
      setOutsideCellState((currentOutsideState) => ({
        ...currentOutsideState,
      borderStyle: s[3].borderStyle,
      borderWidth: s[3].borderWidth,
      borderColor: s[3].borderColor,
      borderEnabled: s[3].borderEnabled,
      backgroundColor: s[3].backgroundColor,
      fillEnabled: s[3].fillEnabled,
      }));

      setActiveCellState((currentActiveState) => ({
        ...currentActiveState,
      borderStyle: s[4].borderStyle,
      borderWidth: s[4].borderWidth,
      borderColor: s[4].borderColor,
      borderEnabled: s[4].borderEnabled,
      backgroundColor: s[4].backgroundColor,
      fillEnabled: s[4].fillEnabled,
      }));
      
      return {
        ...currentState,
        margin: s[0].margin,
        cellType: s[0].cellType,
        radius: s[0].radius,
        gridlines: s[0].gridlines,
        grouting: s[0].grouting,
        triangleAngle: s[0].triangleAngle,
        folds: s[0].folds,
        pallette: palette,
        groutingColor: currentState.groutingColor,
      };
    });
  };

  return (
    <>
      <CurrentConfigContext.Provider
        value={{
          state,
          setState,
          pathState,
          setPathState,
          insideCellState,
          setInsideCellState,
          activeCellState,
          setActiveCellState,
          outsideCellState,
          setOutsideCellState,
          collageConfig,
          setCollageConfig,
          settingsConfig,
          setSettingsConfig,
          downloadShow,
          setDownloadShow,
          foldsShow,
          setFoldsShow,
          saveShow,
          setSaveShow,
          loadShow,
          setLoadShow,
          showRendererHelp,
          setShowRendererHelp,
          showFoldsHelp,
          setShowFoldsHelp,
          showSlideShowConfig,
          setSlideShowConfig,
          slideShowAutoDownload,
          setSlideShowAutoDownload,
          slideShowRandomiseCellType,
          setSlideShowRandomiseCellType,
          dirty,
          setDirty,
          slideShow,
          setSlideShow,
          slideShowPause,
          setSlideShowPause,
          imageSize,
          setImageSize,
          randomiserScheme,
          setRandomiserScheme,
          randomHue,
          setRandomHue,
          lastConstrastValue,
          setLastConstrastValue,
          contrastCount,
          setContrastCount,
          configJSON,
          setConfigJSON,
          intervalID,
          setIntervalID,
          stopSlideShow,
          setStopSlideShow,
        }}
      >
        <div
          className="main-content"
          style={{ display: showFullScreen ? "none" : "flex" }}
        >
          <ControlLayout
            setSlideShowRandomFunction={setSlideShowRandom}
            setShowFullScreen={setShowFullScreen}
          ></ControlLayout>

          <ImageLayout />
        </div>
      </CurrentConfigContext.Provider>
    </>
  );
}
