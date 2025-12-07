import ControlLayout from "./ControlLayout";
import ImageLayout from "./ImageLayout";
import { CurrentConfigContext } from "../Contexts";
import { useState } from "react";
import { executeRandomiser } from "../randomiserSchemes";
import { SetShowFullScreen } from "../types";

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
  const urlHead = "http://localhost:8080";
  // const urlHead = "./";

  const [slideShow, setSlideShow] = useState(false);
  const [slideShowPause, setSlideShowPause] = useState(false);
  const [imageSize, setImageSize] = useState({
    width: "calc(100vw - 320px)",
    height: "auto",
    zoom: "100",
  });

  const [settingsConfig, setSettingsConfig] = useState({
    background: "plain",
    slideShowInterval: 5,
  });

  const [state, setState] = useState({
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

  const [pathState, setPathState] = useState({
    borderStyle: "solid",
    borderWidth: "3px",
    borderColor: "#000000ff",
    borderEnabled: true,
    title:
      "Dragon Path Curve Configuration (The path that the dragon curve follows)",
    shortTitle: "Dragon Curve Path Configuration",
    startDirection: "LEFT",
  });
  const [activeCellState, setActiveCellState] = useState({
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#000000ff",
    backgroundColor: "#7090B7FF",
    borderEnabled: true,
    fillEnabled: true,
    title: "Active Tile Configuration (Tiles that the path passes through)",
    shortTitle: "Active Tile Configuration",
  });

  const [insideCellState, setInsideCellState] = useState({
    borderStyle: "solid",
    borderWidth: "2px",
    borderColor: "#00ffff",
    backgroundColor: "#ff0000",
    borderEnabled: false,
    fillEnabled: false,
    title: "Inside Tile Configuration (Empty tiles encompassed by the path)",
    shortTitle: "Inside Tile Configuration",
  });
  const [outsideCellState, setOutsideCellState] = useState({
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#000000ff",
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
  const [settingsShow, setSettingsShow] = useState(false);
  const [foldsShow, setFoldsShow] = useState(false);
  const [saveShow, setSaveShow] = useState(false);
  const [loadShow, setLoadShow] = useState(false);
  const [showRendererHelp, setShowRendererHelp] = useState(false);
  const [showFoldsHelp, setShowFoldsHelp] = useState(false);
  const [showSlideShowConfig, setSlideShowConfig] = useState(false);
  const [slideShowRandomise, setSlideShowRandomise] = useState(false);
  const [slideShowAutoDownload, setSlideShowAutoDownload] = useState(false);
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
    let s = executeRandomiser(
      state,
      pathState,
      activeCellState,
      insideCellState,
      outsideCellState,
      slideShowRandomise,
      randomiserScheme,
      state.pallette,
      lastConstrastValue,
      contrastCount,
      setLastConstrastValue,
      setContrastCount
    );
    setState({
      ...state,
      margin: s[0].margin,
      cellType: s[0].cellType,
      radius: s[0].radius,
      gridlines: s[0].gridlines,
      grouting: s[0].grouting,
      triangleAngle: s[0].triangleAngle,
      folds: s[0].folds,
    });
    setPathState({
      ...pathState,
      borderStyle: s[1].borderStyle,
      borderWidth: s[1].borderWidth,
      borderColor: s[1].borderColor,
      borderEnabled: s[1].borderEnabled,
      startDirection: s[1].startDirection,
    });
    setInsideCellState({
      ...insideCellState,
      borderStyle: s[2].borderStyle,
      borderWidth: s[2].borderWidth,
      borderColor: s[2].borderColor,
      borderEnabled: s[2].borderEnabled,
      backgroundColor: s[2].backgroundColor,
      fillEnabled: s[2].fillEnabled,
    });
    setOutsideCellState({
      ...outsideCellState,
      borderStyle: s[3].borderStyle,
      borderWidth: s[3].borderWidth,
      borderColor: s[3].borderColor,
      borderEnabled: s[3].borderEnabled,
      backgroundColor: s[3].backgroundColor,
      fillEnabled: s[3].fillEnabled,
    });

    setActiveCellState({
      ...activeCellState,
      borderStyle: s[4].borderStyle,
      borderWidth: s[4].borderWidth,
      borderColor: s[4].borderColor,
      borderEnabled: s[4].borderEnabled,
      backgroundColor: s[4].backgroundColor,
      fillEnabled: s[4].fillEnabled,
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
          settingsShow,
          setSettingsShow,
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
          slideShowRandomise,
          setSlideShowRandomise,
          slideShowAutoDownload,
          setSlideShowAutoDownload,
          dirty,
          setDirty,
          urlHead,
          updateImage: () => {},
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
          className="mw-100"
          style={{
            display: showFullScreen ? "none" : "flex",
            height: "calc(100vh - 85px)",
            rowGap: "10px",
            justifyContent: "left",
            alignItems: "center",
            marginLeft: "5px",
          }}
        >
          <ControlLayout
            setSlideShowRandomFunction={setSlideShowRandom}
          ></ControlLayout>

          <ImageLayout
            statsURL={""}
            setShowFullScreen={setShowFullScreen}
            stopSlideShowNow={() => {
              setSlideShow(false);
              setStopSlideShow(true);
            }}
          />
        </div>
      </CurrentConfigContext.Provider>
    </>
  );
}
