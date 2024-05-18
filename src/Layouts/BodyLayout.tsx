import { useState } from "react";
import ControlLayout from "./ControlLayout";
import ImageLayout from "./ImageLayout";

export default function BodyLayout() {
  //const urlHead = "http://localhost:8080";
  const urlHead = "..";

  const [imageSize, setImageSize] = useState({
    width: "calc(100vw - 320px)",
    height: "auto",
    zoom: "100",
  });

  const [state, setState] = useState({
    folds: "9",
    margin: "12",
    cellType: "knuthcurve",
    triangleAngle: "45",
    radius: "15",
    grouting: "1",
  });

  const [pathState, setPathState] = useState({
    borderStyle: "solid",
    borderWidth: "3px",
    borderColor: "#000000ff",
    borderEnabled: true,
    title:
      "Dragon Path Curve Configuration (The path that the dragon curve follows)",
    shortTitle: "Dragon Curve Path Configuration",
    startDirection: "DOWN",
  });
  const [activeCellState, setActiveCellState] = useState({
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#000000ff",
    backgroundColor: "#7090B7FF",
    borderEnabled: true,
    fillEnabled: true,
    title: "Active Cell Configuration (Cells that the path passes through)",
    shortTitle: "Active Cell Configuration",
  });
  const [insideCellState, setInsideCellState] = useState({
    borderStyle: "solid",
    borderWidth: "2px",
    borderColor: "#00ffff",
    backgroundColor: "#ff0000",
    borderEnabled: false,
    fillEnabled: false,
    title: "Inside Cell Configuration (Empty cells encompassed by the path)",
    shortTitle: "Inside Cell Configuration",
  });
  const [outsideCellState, setOutsideCellState] = useState({
    borderStyle: "solid",
    borderWidth: "2px",
    borderColor: "#00ffff",
    backgroundColor: "#ff0000",
    borderEnabled: false,
    fillEnabled: false,
    title:
      "Outside Cell Configuration (Empty cells not encompassed by the path)",
    shortTitle: "Outside Cell Configuration",
  });

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

    pathState.borderStyle = "solid";
    pathState.borderWidth = Math.floor(Math.random() * 4).toString() + "px";
    pathState.borderColor =
      "#" + Math.floor(Math.random() * 4294967295).toString(16);
    pathState.borderEnabled = Math.random() > 0.3;

    // set pathState.startDirection to a random value from the set of "UP", "DOWN", "LEFT", "RIGHT"

    pathState.startDirection = ["UP", "DOWN", "LEFT", "RIGHT"][
      Math.floor(Math.random() * 4)
    ];

    insideCellState.borderStyle = "solid";
    insideCellState.borderWidth =
      Math.floor(Math.random() * 4).toString() + "px";
    insideCellState.borderColor =
      "#" + Math.floor(Math.random() * 4294967295).toString(16);
    insideCellState.backgroundColor =
      "#" + Math.floor(Math.random() * 4294967295).toString(16);
    insideCellState.borderEnabled = Math.random() > 0.5;
    insideCellState.fillEnabled = Math.random() > 0.5;

    outsideCellState.borderStyle = "solid";
    outsideCellState.borderWidth =
      Math.floor(Math.random() * 3).toString() + "px";
    outsideCellState.borderColor =
      "#" + Math.floor(Math.random() * 4294967295).toString(16);
    outsideCellState.backgroundColor =
      "#" + Math.floor(Math.random() * 4294967295).toString(16);
    outsideCellState.borderEnabled = Math.random() > 0.6;
    outsideCellState.fillEnabled = Math.random() > 0.4;

    activeCellState.borderStyle = "solid";
    activeCellState.borderWidth =
      Math.floor(Math.random() * 4).toString() + "px";
    activeCellState.borderColor =
      "#" + Math.floor(Math.random() * 4294967295).toString(16);
    activeCellState.backgroundColor =
      "#" + Math.floor(Math.random() * 4294967295).toString(16);
    activeCellState.borderEnabled = Math.random() > 0.6;
    activeCellState.fillEnabled = Math.random() > 0.4;
  };

  const setRandomCurrentSizeState = () => {
    state.cellType = ["quadrant", "line", "corner", "knuth", "knuthcurve"][
      Math.floor(Math.random() * 5)
    ];
    state.triangleAngle = ["0", "10", "20", "30", "45", "50", "60", "65"][
      Math.floor(Math.random() * 8)
    ];

    if (state.cellType === "knuthcurve" || state.cellType === "knuth") {
      state.grouting = ["1", "2", "3", "4", "5"][Math.floor(Math.random() * 5)];
    } else {
      state.grouting = "0";
    }

    pathState.borderStyle = "solid";
    pathState.borderWidth = Math.floor(Math.random() * 4).toString() + "px";
    pathState.borderColor =
      "#" + Math.floor(Math.random() * 4294967295).toString(16);
    pathState.borderEnabled = Math.random() > 0.3;

    // set pathState.startDirection to a random value from the set of "UP", "DOWN", "LEFT", "RIGHT"

    insideCellState.borderStyle = "solid";
    insideCellState.borderWidth =
      Math.floor(Math.random() * 4).toString() + "px";

    insideCellState.borderColor =
      "#" +
      Math.floor(Math.random() * 4294967295)
        .toString(16)
        .padStart(8, "0");
    insideCellState.backgroundColor =
      "#" + Math.floor(Math.random() * 4294967295).toString(16);
    insideCellState.borderEnabled = Math.random() > 0.5;
    insideCellState.fillEnabled = Math.random() > 0.5;

    outsideCellState.borderStyle = "solid";
    outsideCellState.borderWidth =
      Math.floor(Math.random() * 3).toString() + "px";
    outsideCellState.borderColor =
      "#" + Math.floor(Math.random() * 4294967295).toString(16);
    outsideCellState.backgroundColor =
      "#" + Math.floor(Math.random() * 4294967295).toString(16);
    outsideCellState.borderEnabled = Math.random() > 0.5;
    outsideCellState.fillEnabled = Math.random() > 0.5;

    activeCellState.borderStyle = "solid";
    activeCellState.borderWidth =
      Math.floor(Math.random() * 4).toString() + "px";
    activeCellState.borderColor =
      "#" + Math.floor(Math.random() * 4294967295).toString(16);
    activeCellState.backgroundColor =
      "#" + Math.floor(Math.random() * 4294967295).toString(16);
    activeCellState.borderEnabled = Math.random() > 0.5;
    activeCellState.fillEnabled = Math.random() > 0.5;
  };

  const [imgUrl, setImgUrl] = useState(
    urlHead +
      `/getTile?
    &folds=${state.folds}
    &margin=${state.margin}
    &cellType=${state.cellType}
    &triangleAngle=${state.triangleAngle}
    &radius=${state.radius}
    &grouting=${state.grouting}
    &startDirection=${pathState.startDirection}
    &pathStroke=${pathState.borderEnabled}
    &pathWidth=${pathState.borderWidth}
    &pathStrokeColor=${pathState.borderColor}
    &outsideFill=${outsideCellState.fillEnabled}
    &outsideFillColor=${outsideCellState.backgroundColor}
    &outsideStroke=${outsideCellState.borderEnabled}
    &outsideStrokeWidth=${outsideCellState.borderWidth}
    &outsideStrokeColor=${outsideCellState.borderColor}
    &insideFill=${insideCellState.fillEnabled}
    &insideFillColor=${insideCellState.backgroundColor}
    &insideStroke=${insideCellState.borderEnabled}
    &insideStrokeWidth=${insideCellState.borderWidth}
    &insideStrokeColor=${insideCellState.borderColor}
    &activeFill=${activeCellState.fillEnabled}
    &activeFillColor=${activeCellState.backgroundColor}
    &activeStroke=${activeCellState.borderEnabled}
    &activeStrokeWidth=${activeCellState.borderWidth}
    &activeStrokeColor=${activeCellState.borderColor}
    &random=${Math.random()}`
        .replace(/#/g, "")
        .replace(/\s/g, "")
  );
  const generate = (newImgUrl: string) => {
    newImgUrl = newImgUrl.replace(/#/g, "").replace(/\s/g, "");
    setImgUrl(newImgUrl);
  };

  return (
    <>
      <div
        className="mw-100"
        style={{
          height: "calc(100vh - 140px)",
          display: "flex",
          rowGap: "10px",
          justifyContent: "left",
          alignItems: "center",
          // marginBottom: "5px",
          marginLeft: "5px",
          // marginRight: "5px",
        }}
      >
        <ControlLayout
          state={state}
          setState={setState}
          updateImage={generate}
          pathState={pathState}
          setPathState={setPathState}
          activeCellState={activeCellState}
          setActiveCellState={setActiveCellState}
          insideCellState={insideCellState}
          setInsideCellState={setInsideCellState}
          outsideCellState={outsideCellState}
          setOutsideCellState={setOutsideCellState}
          randomDragonCurveLocal={setRandomState}
          randomDragonCurveLocalCurrentSize={setRandomCurrentSizeState}
          urlHead={urlHead}
          imageSize={imageSize}
          setImageSize={setImageSize}
        ></ControlLayout>

        <ImageLayout
          imgUrl={imgUrl}
          imageSize={imageSize}
          setImageSize={setImageSize}
        ></ImageLayout>
      </div>
    </>
  );
}
