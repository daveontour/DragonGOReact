import ControlLayout from "./ControlLayout";
import ImageLayout from "./ImageLayout";
import myGlobalObject from "../globals";
import { CurrentConfigContext } from "../Contexts";
import { useState } from "react";

function hslToRgb(h: number, s: number, l: number) {
  var r, g, b;
  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    var hue2rgb = function hue2rgb(p: number, q: number, t: number) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// function hslaToRgba(h: number, s: number, l: number, a: number): string {
//   var rgb = hslToRgb(h, s, l);
//   return `#${rgb[0].toString(16).padStart(2, "0")}${rgb[1]
//     .toString(16)
//     .padStart(2, "0")}${rgb[2].toString(16).padStart(2, "0")}${Math.round(
//     a * 255
//   )
//     .toString(16)
//     .padStart(2, "0")}`;
// }

// a function for taking a hsla color and returning a hsla 137.5 degrees away
function hslaRotate(
  h: number,
  s: number,
  l: number,
  a: number,
  degrees: number
): number[] {
  let newH = (h + degrees / 360) % 360;
  return [newH, s, l, a];
}

function rgbToHsl(r: number, g: number, b: number): number[] {
  (r /= 255), (g /= 255), (b /= 255);
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);

  let h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
    return [h, s, l];
  } else {
    var d = max - min;
    let h: number = 0;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;

    return [h, s, l];
  }
}

function rgbaToHsla(r: number, g: number, b: number, a: number): number[] {
  var hsl = rgbToHsl(r, g, b);
  return [hsl[0], hsl[1], hsl[2], a];
}

function stringToRGBA(str: string): number[] {
  var hex = str.replace("#", "");
  var bigint = parseInt(hex, 16);
  var r = (bigint >> 24) & 255;
  var g = (bigint >> 16) & 255;
  var b = (bigint >> 8) & 255;
  var a = bigint & 255;
  return [r, g, b, a];
}

export default function BodyLayout({
  showFullScreen,
  setShowFullScreen,
}: {
  showFullScreen: boolean;
  setShowFullScreen: any;
}) {
  const urlHead = "http://localhost:8080";
  // const urlHead = "./";

  const [slideShow, setSlideShow] = useState(false);
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
  const [dirty, setDirty] = useState(false);

  const generateColor = () => {
    if (myGlobalObject.colorPallete === "pastel") {
      return generatePastelColor();
    } else if (myGlobalObject.colorPallete === "vibrant") {
      return generateVibrantColor();
    } else if (myGlobalObject.colorPallete === "redhue") {
      return generateRedHueColor();
    } else if (myGlobalObject.colorPallete === "greenhue") {
      return generateGreenHueColor();
    } else if (myGlobalObject.colorPallete === "bluehue") {
      return generateBlueHueColor();
    } else if (myGlobalObject.colorPallete === "randomhue") {
      return generateRandomHueColor();
    } else if (myGlobalObject.colorPallete === "highcontrast") {
      return generateHighContrastColor();
    } else {
      return generateRandomColor();
    }
  };

  const generateHighContrastColor = () => {
    if (
      myGlobalObject.lastConstrastValue === "" ||
      myGlobalObject.contrastCount % 5 === 0
    ) {
      let x = generateVibrantColor();
      myGlobalObject.lastConstrastValue = x;
      myGlobalObject.contrastCount++;
      return x;
    } else {
      //convert the last contrast value to RGBA

      let y = stringToRGBA(myGlobalObject.lastConstrastValue);

      let x = rgbaToHsla(y[0], y[1], y[2], y[3] / 255);
      var newHSL = hslaRotate(x[0], x[1], x[2], x[3], 137.5);
      var newRGB = hslToRgb(newHSL[0], newHSL[1], newHSL[2]);
      let newVal = `#${newRGB[0].toString(16).padStart(2, "0")}${newRGB[1]
        .toString(16)
        .padStart(2, "0")}${newRGB[2]
        .toString(16)
        .padStart(2, "0")}${Math.round(newHSL[3] * 255)
        .toString(16)
        .padStart(2, "0")}`;
      myGlobalObject.lastConstrastValue = newVal;
      myGlobalObject.contrastCount++;
      return newVal;
    }
  };

  const generateRandomHueColor = () => {
    if (Math.random() > 0.66) {
      return generateRedHueColor();
    } else if (Math.random() > 0.5) {
      return generateGreenHueColor();
    } else {
      return generateBlueHueColor();
    }
  };
  const generateRedHueColor = () => {
    let R = Math.floor(Math.random() * 127 + 127);
    let G = Math.floor(Math.random() * 63);
    let B = Math.floor(Math.random() * 63);

    let rgb = (R << 16) + (G << 8) + B;
    return `#${rgb.toString(16)}`;
  };

  const generateBlueHueColor = () => {
    let R = Math.floor(Math.random() * 63);
    let G = Math.floor(Math.random() * 63);
    let B = Math.floor(Math.random() * 127 + 127);

    let rgb = (R << 16) + (G << 8) + B;
    return `#${rgb.toString(16)}`;
  };
  const generateGreenHueColor = () => {
    let R = Math.floor(Math.random() * 63);
    let G = Math.floor(Math.random() * 127 + 127);
    let B = Math.floor(Math.random() * 63);

    let rgb = (R << 16) + (G << 8) + B;
    return `#${rgb.toString(16)}`;
  };

  const generateRandomColor = () => {
    let R = Math.floor(Math.random() * 255);
    let G = Math.floor(Math.random() * 255);
    let B = Math.floor(Math.random() * 255);
    let A = Math.floor(Math.random() * 127 + 127);

    let rgb = (R << 24) + (G << 16) + (B << 8) + A;
    return `#${rgb.toString(16)}`;
  };
  const generatePastelColor = () => {
    let R = Math.floor(Math.random() * 127 + 127);
    let G = Math.floor(Math.random() * 127 + 127);
    let B = Math.floor(Math.random() * 127 + 127);

    let rgb = (R << 16) + (G << 8) + B;
    return `#${rgb.toString(16)}`;
  };

  const generateVibrantColor = () => {
    let R = Math.floor(Math.random() * 255);
    let G = Math.floor(Math.random() * 255);
    let B = Math.floor(Math.random() * 255);

    if (Math.random() > 0.66) {
      R = 255;
    } else if (Math.random() > 0.5) {
      G = 255;
    } else {
      B = 255;
    }

    let rgb = (R << 16) + (G << 8) + B;
    return `#${rgb.toString(16).padStart(6, "0")}`;
  };

  const generateBorderWidth = (seed: number) => {
    return Math.floor(Math.random() * seed).toString() + "px";
  };

  const setRandomState = () => {
    state.folds = ["9", "10", "11"][Math.floor(Math.random() * 3)];
    state.grouting = ["0", "0", "0", "0", "0", "1", "2", "3", "4", "5"][
      Math.floor(Math.random() * 9)
    ];
    state.margin = "5";
    state.cellType = ["quadrant", "line", "corner", "knuth", "knuthcurve"][
      Math.floor(Math.random() * 5)
    ];
    state.triangleAngle = ["0", "10", "20", "30", "45", "50", "60", "65"][
      Math.floor(Math.random() * 8)
    ];
    state.radius = ["5", "8", "10", "12"][Math.floor(Math.random() * 4)];
    state.gridlines = Math.random() > 0.75;
    //state.pallette = ["pastel", "vibrant", "random"][Math.floor(Math.random() * 3)];

    if (
      state.cellType === "knuthcurve" ||
      state.cellType === "knuth" ||
      state.cellType === "knuthtri"
    ) {
      state.grouting = ["1", "2", "3", "4", "5"][Math.floor(Math.random() * 5)];
    }
    if (myGlobalObject.randomHue) {
      myGlobalObject.colorPallete = ["redhue", "bluehue", "greenhue"][
        Math.floor(Math.random() * 3)
      ];
      state.pallette = myGlobalObject.colorPallete;
    }

    state.groutingColor = generateColor();

    if (Math.random() > 0.5) {
      state.groutingColor = "#ffffffff";
    }

    pathState.borderStyle = "solid";
    pathState.borderWidth = generateBorderWidth(4);
    pathState.borderColor = generateColor();
    pathState.borderEnabled = Math.random() > 0.66;

    // set pathState.startDirection to a random value from the set of "UP", "DOWN", "LEFT", "RIGHT"

    pathState.startDirection = ["UP", "DOWN", "LEFT", "RIGHT"][
      Math.floor(Math.random() * 4)
    ];

    insideCellState.borderStyle = "solid";
    insideCellState.borderWidth = generateBorderWidth(4);
    insideCellState.borderColor = generateColor();
    insideCellState.backgroundColor = generateColor();
    insideCellState.borderEnabled = Math.random() > 0.5;
    insideCellState.fillEnabled = Math.random() > 0.5;

    outsideCellState.borderStyle = "solid";
    outsideCellState.borderWidth = generateBorderWidth(4);
    outsideCellState.borderColor = generateColor();
    outsideCellState.backgroundColor = generateColor();
    outsideCellState.borderEnabled = Math.random() > 0.6;
    outsideCellState.fillEnabled = Math.random() > 0.4;

    activeCellState.borderStyle = "solid";
    activeCellState.borderWidth = generateBorderWidth(4);
    activeCellState.borderColor = generateColor();
    activeCellState.backgroundColor = generateColor();
    activeCellState.borderEnabled = Math.random() > 0.6;
    activeCellState.fillEnabled = Math.random() > 0.4;
  };

  const setRandomCurrentSizeState = () => {
    if (
      state.cellType === "knuthcurve" ||
      state.cellType === "knuth" ||
      state.cellType === "knuthtri"
    ) {
      state.cellType = ["knuth", "knuthcurve", "knuthtri"][
        Math.floor(Math.random() * 3)
      ];
    } else {
      state.cellType = ["quadrant", "line", "corner", "triangle"][
        Math.floor(Math.random() * 4)
      ];
    }

    state.triangleAngle = ["0", "10", "20", "30", "45", "50", "60", "65", "75"][
      Math.floor(Math.random() * 8)
    ];

    if (state.cellType === "knuthcurve" || state.cellType === "knuth") {
      state.grouting = ["1", "2", "3", "4", "5"][Math.floor(Math.random() * 5)];
    } else {
      state.grouting = "0";
    }

    if (myGlobalObject.randomHue) {
      myGlobalObject.colorPallete = ["redhue", "bluehue", "greenhue"][
        Math.floor(Math.random() * 3)
      ];
      state.pallette = myGlobalObject.colorPallete;
    }
    state.groutingColor = generateColor();

    if (Math.random() > 0.5) {
      state.groutingColor = "#ffffffff";
    }
    state.gridlines = Math.random() > 0.75;

    pathState.borderStyle = "solid";
    pathState.borderWidth =
      (3 + Math.floor(Math.random() * 3)).toString() + "px";
    pathState.borderColor = generateColor();
    pathState.borderEnabled = Math.random() > 0.3;

    // set pathState.startDirection to a random value from the set of "UP", "DOWN", "LEFT", "RIGHT"

    insideCellState.borderStyle = "solid";
    insideCellState.borderWidth = generateBorderWidth(4);
    insideCellState.borderColor = generateColor();
    insideCellState.backgroundColor = generateColor();
    insideCellState.borderEnabled = Math.random() > 0.2;
    insideCellState.fillEnabled = Math.random() > 0.2;

    outsideCellState.borderStyle = "solid";
    outsideCellState.borderWidth = generateBorderWidth(4);
    outsideCellState.borderColor = generateColor();
    outsideCellState.backgroundColor = generateColor();
    outsideCellState.borderEnabled = Math.random() > 0.5;
    outsideCellState.fillEnabled = Math.random() > 0.5;

    activeCellState.borderStyle = "solid";
    activeCellState.borderWidth = generateBorderWidth(4);
    activeCellState.borderColor = generateColor();
    activeCellState.backgroundColor = generateColor();
    activeCellState.borderEnabled = Math.random() > 0.5;
    activeCellState.fillEnabled = Math.random() > 0.5;
  };

  // const [imgUrl, setImgUrl] = useState(
  //   urlHead +
  //     `/getTile?
  //   &folds=${state.folds}
  //   &margin=${state.margin}
  //   &cellType=${state.cellType}
  //   &triangleAngle=${state.triangleAngle}
  //   &radius=${state.radius}
  //   &grouting=${state.grouting}
  //   &groutingColor=${state.groutingColor}
  //   &gridlines=${state.gridlines}
  //   &startDirection=${pathState.startDirection}
  //   &pathStroke=${pathState.borderEnabled}
  //   &pathWidth=${pathState.borderWidth}
  //   &pathStrokeColor=${pathState.borderColor}
  //   &outsideFill=${outsideCellState.fillEnabled}
  //   &outsideFillColor=${outsideCellState.backgroundColor}
  //   &outsideStroke=${outsideCellState.borderEnabled}
  //   &outsideStrokeWidth=${outsideCellState.borderWidth}
  //   &outsideStrokeColor=${outsideCellState.borderColor}
  //   &insideFill=${insideCellState.fillEnabled}
  //   &insideFillColor=${insideCellState.backgroundColor}
  //   &insideStroke=${insideCellState.borderEnabled}
  //   &insideStrokeWidth=${insideCellState.borderWidth}
  //   &insideStrokeColor=${insideCellState.borderColor}
  //   &activeFill=${activeCellState.fillEnabled}
  //   &activeFillColor=${activeCellState.backgroundColor}
  //   &activeStroke=${activeCellState.borderEnabled}
  //   &activeStrokeWidth=${activeCellState.borderWidth}
  //   &activeStrokeColor=${activeCellState.borderColor}
  //   &random=${Math.random()}`
  //       .replace(/#/g, "")
  //       .replace(/\s/g, "")
  // );

  const [statsURL, setStatsURL] = useState("");
  // const generate = (newImgUrl: string) => {
  //   newImgUrl = newImgUrl.replace(/#/g, "").replace(/\s/g, "");
  //   setImgUrl(newImgUrl);
  //   let statsURL = newImgUrl.replace("getTile", "getStats");
  //   setStatsURL(statsURL);
  //   //  if (showFullScreen) {
  //   setFSImageURL(newImgUrl);
  //   //    }
  // };

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
          dirty,
          setDirty,
          urlHead,
          updateImage: () => {},
          slideShow,
          setSlideShow,
          imageSize,
          setImageSize,
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
            randomDragonCurveLocal={setRandomState}
            randomDragonCurveLocalCurrentSize={setRandomCurrentSizeState}
          ></ControlLayout>

          <ImageLayout
            statsURL={statsURL}
            setShowFullScreen={setShowFullScreen}
            stopSlideShowNow={() => {
              setSlideShow(false);
              myGlobalObject.stopSlideShow = true;
            }}
          />
        </div>
      </CurrentConfigContext.Provider>
    </>
  );
}
