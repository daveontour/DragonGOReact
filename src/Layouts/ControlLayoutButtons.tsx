import { OverlayTrigger, Tooltip, TooltipProps } from "react-bootstrap";
import { JSX } from "react/jsx-runtime";
import { RefAttributes, useContext, useState } from "react";
import { CurrentConfigContext } from "../Contexts";
import { downloadSVG } from "../utils/downloadUtils";
import { SetShowFullScreen } from "../types";
import CurveStatsModal from "../DialogBoxes/CurveStatsModal";
import TileInspectModal from "../DialogBoxes/TileInspectModal";
import {
  getTileStats,
  RequestConfig,
  TileStats,
} from "../servertsx/common";
import { buildRequestConfig } from "../utils/buildRequestConfig";

export default function ControlLayoutButtons({
  setShowFullScreen,
}: {
  setShowFullScreen: SetShowFullScreen;
}) {
  let config = useContext(CurrentConfigContext);
  const [statsShow, setStatsShow] = useState(false);
  const [stats, setStats] = useState<TileStats>({
    total: 0,
    active: 0,
    activeLeftOnly: 0,
    activeRightOnly: 0,
    complementary: 0,
    inside: 0,
    outside: 0,
    horizontal: 0,
    vertical: 0,
  });
  const [statsRequestConfig, setStatsRequestConfig] =
    useState<RequestConfig | null>(null);
  const [tileInspectShow, setTileInspectShow] = useState(false);
  const [tileInspectConfig, setTileInspectConfig] =
    useState<RequestConfig | null>(null);

  const showStatistics = () => {
    const rc = buildRequestConfig(config);
    setStats(getTileStats(rc));
    setStatsRequestConfig(rc);
    setStatsShow(true);
  };

  const showTileInspect = () => {
    setTileInspectConfig(buildRequestConfig(config));
    setTileInspectShow(true);
  };

  const downloadDragonCurveSVG = () => {
    config.setDownloadShow(true);

    let svg = document.getElementById("imageHTMLElement") as HTMLElement;
    if (svg && svg.innerHTML) {
      downloadSVG(svg.innerHTML, "DragonCurve.svg");
    }
    config.setDownloadShow(false);
  };

  const loadCurve = () => {
    config.setLoadShow(true);
  };

  const saveCurve = () => {
    config.setSaveShow(true);
  };

  // Defintion of the tooltip for various buttons

  const renderSaveTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Download the configuration settings of the current dragon curve by showing the
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
      Save the SVG file of the current dragon curve.
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
  const renderStatsTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Show tile counts for the current curve.
    </Tooltip>
  );
  const renderTileInspectTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Inspect a single tile by row and column.
    </Tooltip>
  );
  const renderFullscreenTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="button-tooltip" {...props}>
      Display in fullscreen mode.
    </Tooltip>
  );

  const exitHandler = () => {
    if (!document.fullscreenElement) {
      setShowFullScreen(false);
      document.body.className = "";
      document.body.style.backgroundColor = "";

      //Reload the image so it's sized correctly
      setTimeout(() => {
        let btn = document.getElementById(
          "generate-dragon-curve-button"
        ) as HTMLButtonElement;
        btn.click();
      }, 500);
    }
  };

  const goFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      if (config.settingsConfig.background == "plain") {
        document.body.style.backgroundColor = "#0d1117";
      } else {
        document.body.className = config.settingsConfig.background;
      }
      document.addEventListener("fullscreenchange", exitHandler);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  return (
    <>
      <div className="dragon-toolbar">
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
            className="bi bi-download"
            viewBox="0 0 16 16"
          >
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z" />
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
            className="bi bi-upload"
            viewBox="0 0 16 16"
          >
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
            <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z" />
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
            className="bi bi-floppy"
            viewBox="0 0 16 16"
          >
            <path d="M11 2H9v3h2z" />
            <path d="M1.5 0h11.586a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13A1.5 1.5 0 0 1 1.5 0M1 1.5v13a.5.5 0 0 0 .5.5H2v-4.5A1.5 1.5 0 0 1 3.5 9h9a1.5 1.5 0 0 1 1.5 1.5V15h.5a.5.5 0 0 0 .5-.5V2.914a.5.5 0 0 0-.146-.353l-1.415-1.415A.5.5 0 0 0 13.086 1H13v4.5A1.5 1.5 0 0 1 11.5 7h-7A1.5 1.5 0 0 1 3 5.5V1H1.5a.5.5 0 0 0-.5.5m3 4a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V1H4zM3 15h10v-4.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5z" />

          </svg>
        </OverlayTrigger>
        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 400 }}
          overlay={renderTurnsTooltip}
        >
          <svg
            onClick={() => {
              config.setFoldsShow(true);
            }}
            xmlns="http://www.w3.org/2000/svg"
            width="30px"
            height="30px"
            fill="currentColor"
            className="bi bi-sign-turn-slight-left"
            viewBox="0 0 16 16"
          >
            <path d="m7.665 6.982-.8 1.386a.25.25 0 0 1-.451-.039l-1.06-2.882a.25.25 0 0 1 .192-.333l3.026-.523a.25.25 0 0 1 .26.371l-.667 1.154.621.373A2.5 2.5 0 0 1 10 8.632V11H9V8.632a1.5 1.5 0 0 0-.728-1.286z" />
            <path
              fillRule="evenodd"
              d="M6.95.435c.58-.58 1.52-.58 2.1 0l6.515 6.516c.58.58.58 1.519 0 2.098L9.05 15.565c-.58.58-1.519.58-2.098 0L.435 9.05a1.48 1.48 0 0 1 0-2.098zm1.4.7a.495.495 0 0 0-.7 0L1.134 7.65a.495.495 0 0 0 0 .7l6.516 6.516a.495.495 0 0 0 .7 0l6.516-6.516a.495.495 0 0 0 0-.7L8.35 1.134Z"
            />
          </svg>
        </OverlayTrigger>
        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 400 }}
          overlay={renderTileInspectTooltip}
        >
          <svg
            onClick={showTileInspect}
            xmlns="http://www.w3.org/2000/svg"
            width="30px"
            height="30px"
            fill="currentColor"
            cursor={"pointer"}
            className="bi bi-grid-3x3"
            viewBox="0 0 16 16"
          >
            <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5zM1.5 1a.5.5 0 0 0-.5.5V5h4V1zM5 6H1v4h4zm1 4h4V6H6zm-1 1H1v3.5a.5.5 0 0 0 .5.5H5zm1 0v4h4v-4zm5 0v4h3.5a.5.5 0 0 0 .5-.5V11zm0-1h4V6h-4zm0-5h4V1.5a.5.5 0 0 0-.5-.5H11zm-1 0V1H6v4z" />
          </svg>
        </OverlayTrigger>
        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 400 }}
          overlay={renderStatsTooltip}
        >
          <svg
            onClick={showStatistics}
            xmlns="http://www.w3.org/2000/svg"
            width="30px"
            height="30px"
            fill="currentColor"
            cursor={"pointer"}
            className="bi bi-bar-chart"
            viewBox="0 0 16 16"
          >
            <path d="M4 11H2v3h2zm5-4H7v7h2zm5-5v12h-2V2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z" />
          </svg>
        </OverlayTrigger>
        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 400 }}
          overlay={renderFullscreenTooltip}
        >
          <svg
            onClick={() => {
              document.getElementById("imageHTMLElementFullScreen")?.focus();
              setShowFullScreen(true);
              goFullScreen();
            }}
            xmlns="http://www.w3.org/2000/svg"
            width="30px"
            height="30px"
            fill="currentColor"
            cursor={"pointer"}
            className="bi bi-fullscreen"
            viewBox="0 0 16 16"
          >
            <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5M.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5" />
          </svg>
        </OverlayTrigger>
      </div>
      <CurveStatsModal
        show={statsShow}
        onHide={() => setStatsShow(false)}
        stats={stats}
        requestConfig={statsRequestConfig}
      />
      <TileInspectModal
        show={tileInspectShow}
        onHide={() => setTileInspectShow(false)}
        requestConfig={tileInspectConfig}
      />
    </>
  );
}
