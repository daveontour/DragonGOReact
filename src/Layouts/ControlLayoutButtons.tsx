import { RefAttributes, useState } from "react";
import { OverlayTrigger, Tooltip, TooltipProps } from "react-bootstrap";
import axios from "axios";
import { JSX } from "react/jsx-runtime";

export default function ControlLayoutButtons({
  state,
  pathState,
  activeCellState,
  outsideCellState,
  insideCellState,
  urlHead,
  setDownloadingShow,
  setSettingsShow,
  setFoldsShow,
  setSaveShow,
  setLoadShow,
}: {
  state: any;
  pathState: any;
  activeCellState: any;
  outsideCellState: any;
  insideCellState: any;
  urlHead: any;
  setDownloadingShow: any;
  setSettingsShow: any;
  setFoldsShow: any;
  setSaveShow: any;
  setLoadShow: any;
}) {
  const [configState, setConfigState] = useState({
    outside: outsideCellState,
    inside: insideCellState,
    active: activeCellState,
    path: pathState,
    state: state,
  });

  const getSingleURL = () => {
    var newURL =
      urlHead +
      `/getTile?
  &folds=${state.folds}
  &margin=${state.margin}
  &cellType=${state.cellType}
  &triangleAngle=${state.triangleAngle}
  &radius=${state.radius}
  &grouting=${state.grouting}
  &groutingColor=${state.groutingColor}
  &gridlines=${state.gridlines}
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
        .replace(/\s/g, "");

    return newURL;
  };

  const downloadRawTurns = () => {
    setFoldsShow(true);
  };

  const downloadDragonCurveSVG = () => {
    setDownloadingShow(true);
    var url = getSingleURL();

    axios({
      url: url, //your url
      method: "GET",
      responseType: "blob", // important
    }).then((response) => {
      // create file link in browser's memory
      const href = URL.createObjectURL(response.data);

      // create "a" HTML element with href to file & click
      const link = document.createElement("a");
      link.href = href;
      link.setAttribute("download", "Dragon.svg"); //or any other extension
      document.body.appendChild(link);
      link.click();

      // clean up "a" element & remove ObjectURL
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      setDownloadingShow(false);
    });
  };

  const loadCurve = () => {
    setLoadShow(true);
  };

  const saveCurve = () => {
    setConfigState({
      ...configState,
      state: state,
      inside: insideCellState,
      outside: outsideCellState,
      active: activeCellState,
      path: pathState,
    });
    setSaveShow(true);
  };

  // Defintion of the tooltip for various buttons

  const renderSaveTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Save the configuration settings of the current dragon curve by showing the
      underlying configuration which can be saved as a JSON file.
    </Tooltip>
  );
  const renderLoadTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Load a previously saved configuration settings of a dragon curve by
      uploading a JSON file.
    </Tooltip>
  );
  const renderDownLoadTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Download the SVG file of the current dragon curve.
    </Tooltip>
  );
  const renderSettingsTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Open the settings dialog box to change the general settings.
    </Tooltip>
  );
  const renderTurnsTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Download the sequence of turns for an artbitrary number of folds of a
      dragon curve.
    </Tooltip>
  );
  const renderHelpTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Opens the help dialog box. (not implemented yet)
    </Tooltip>
  );
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          height: "40px",
          width: "280px",
          paddingTop: "5px",
          borderRadius: "5px",
        }}
      >
        {" "}
        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 400 }}
          overlay={renderSettingsTooltip}
        >
          <svg
            onClick={() => setSettingsShow(true)}
            xmlns="http://www.w3.org/2000/svg"
            width="30px"
            height="30px"
            fill="#444444"
            cursor={"pointer"}
            className="bi bi-gear"
            viewBox="0 0 16 16"
          >
            <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" />
            <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" />
          </svg>
        </OverlayTrigger>
        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 400 }}
          overlay={renderSaveTooltip}
        >
          <svg
            onClick={saveCurve}
            xmlns="http://www.w3.org/2000/svg"
            width="30px"
            height="30px"
            cursor={"pointer"}
            fill="currentColor"
            className="bi bi-floppy"
            viewBox="0 0 20 20"
          >
            <path d="M11 2H9v3h2z" />
            <path d="M1.5 0h11.586a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13A1.5 1.5 0 0 1 1.5 0M1 1.5v13a.5.5 0 0 0 .5.5H2v-4.5A1.5 1.5 0 0 1 3.5 9h9a1.5 1.5 0 0 1 1.5 1.5V15h.5a.5.5 0 0 0 .5-.5V2.914a.5.5 0 0 0-.146-.353l-1.415-1.415A.5.5 0 0 0 13.086 1H13v4.5A1.5 1.5 0 0 1 11.5 7h-7A1.5 1.5 0 0 1 3 5.5V1H1.5a.5.5 0 0 0-.5.5m3 4a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V1H4zM3 15h10v-4.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5z" />
          </svg>
        </OverlayTrigger>
        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 400 }}
          overlay={renderLoadTooltip}
        >
          <svg
            onClick={loadCurve}
            cursor={"pointer"}
            xmlns="http://www.w3.org/2000/svg"
            width="30px"
            height="30px"
            fill="currentColor"
            className="bi bi-door-open"
            viewBox="0 0 20 20"
          >
            <path d="M8.5 10c-.276 0-.5-.448-.5-1s.224-1 .5-1 .5.448.5 1-.224 1-.5 1" />
            <path d="M10.828.122A.5.5 0 0 1 11 .5V1h.5A1.5 1.5 0 0 1 13 2.5V15h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V1.5a.5.5 0 0 1 .43-.495l7-1a.5.5 0 0 1 .398.117M11.5 2H11v13h1V2.5a.5.5 0 0 0-.5-.5M4 1.934V15h6V1.077z" />
          </svg>
        </OverlayTrigger>
        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 400 }}
          overlay={renderDownLoadTooltip}
        >
          <svg
            onClick={downloadDragonCurveSVG}
            cursor={"pointer"}
            xmlns="http://www.w3.org/2000/svg"
            width="30px"
            height="30px"
            fill="currentColor"
            className="bi bi-download"
            viewBox="0 0 20 20"
          >
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z" />
          </svg>
        </OverlayTrigger>
        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 400 }}
          overlay={renderTurnsTooltip}
        >
          <svg
            onClick={downloadRawTurns}
            xmlns="http://www.w3.org/2000/svg"
            width="30px"
            height="30px"
            fill="currentColor"
            className="bi bi-sign-turn-slight-left"
            viewBox="0 0 16 16"
          >
            <path d="m7.665 6.982-.8 1.386a.25.25 0 0 1-.451-.039l-1.06-2.882a.25.25 0 0 1 .192-.333l3.026-.523a.25.25 0 0 1 .26.371l-.667 1.154.621.373A2.5 2.5 0 0 1 10 8.632V11H9V8.632a1.5 1.5 0 0 0-.728-1.286z" />
            <path
              fill-rule="evenodd"
              d="M6.95.435c.58-.58 1.52-.58 2.1 0l6.515 6.516c.58.58.58 1.519 0 2.098L9.05 15.565c-.58.58-1.519.58-2.098 0L.435 9.05a1.48 1.48 0 0 1 0-2.098zm1.4.7a.495.495 0 0 0-.7 0L1.134 7.65a.495.495 0 0 0 0 .7l6.516 6.516a.495.495 0 0 0 .7 0l6.516-6.516a.495.495 0 0 0 0-.7L8.35 1.134Z"
            />
          </svg>
        </OverlayTrigger>
        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 400 }}
          overlay={renderHelpTooltip}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30px"
            height="30px"
            fill="currentColor"
            cursor={"pointer"}
            className="bi bi-question"
            viewBox="0 0 16 16"
          >
            <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94" />
          </svg>
        </OverlayTrigger>
      </div>
    </>
  );
}
